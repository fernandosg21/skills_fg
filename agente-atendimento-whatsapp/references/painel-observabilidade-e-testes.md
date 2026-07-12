# Painel de controle, observabilidade e testes

Um agente que age sozinho em nome do dono precisa de um **painel de controle + observabilidade**
que o dono (não-técnico) entenda, e de uma **estratégia de testes** que rode sem gastar token.
Referência: `adm/whatsapp/treinamento-ia.php` + `adm/whatsapp/api/ai_training.php` +
`adm/whatsapp/backend/agent_responder.php`; testes em `adm/whatsapp/tools/`.

Regra transversal de UX: **rótulos SEM jargão técnico** (nada de "shadow", "threshold",
"payload", "handoff", "tier" na tela — todo código de motivo/estado passa por uma função de
tradução para frase de negócio). O dono não é engenheiro.

## A. Estado efetivo com blockers (a peça central)

**O bug que isso evita:** a UI antiga tinha vários flags independentes e o chip olhava só um
(`autonomous_enabled`). Dava para salvar um perfil "meio ligado" → o chip dizia "Ligado" mas o
responder (que checa uma condição composta) ficava **mudo**. O dono achava que respondia.

**A correção, em duas partes:**
1. **Um enum de modo** único e legível que o dono edita (`off` / `learn_only` / `autonomous` —
   no Memora: "Desligado" / "Só aprende, sem responder ninguém" / "Responde os clientes
   sozinho"). Os flags técnicos são **derivados no save** (invariante: `autonomous ⟺ send_enabled
   && !needs_approval`). Elimina o estado "meio ligado".
2. **Uma função pura `computeEffectiveState(config, runtimeSignals) → {acting, label,
   blockers[]}`** que usa **a mesmíssima condição que o motor de runtime avalia**, mais os sinais
   externos (canal conectado). Reutilize essa função nos **dois** lugares (motor e UI) — se
   divergirem, **o selo mente**. Cada blocker é uma **frase de negócio**, não um código de erro:
   - modo off → "o atendimento automático está desligado"
   - modo não-autônomo → "o modo atual é só aprendizado"
   - perfil legado meio-ligado → "as configurações precisam ser salvas de novo para o agente responder"
   - canal desconectado → "o WhatsApp não está conectado"

A UI mostra "Respondendo sozinho / Em silêncio" + lista de blockers **só quando inativo**.
Contrato JSON: `{ mode, mode_label, acting, acting_label, blockers[] }`.

## B. Log de decisões (append-only, retenção curta)

Tabela `agent_decisions`: `{ tenant_id, conversation_id, message_id, decision('sent'|'skipped'),
reason (código enum), detail, reply_text (o texto pronto que não foi entregue — habilita o
retry), model_used, llm_ok, created_at }`. Regras:
- **Toda inbound processada grava exatamente uma linha.** Best-effort (try/catch — a auditoria
  nunca derruba o webhook); uma exceção na própria chamada vira um registro `erro_interno`.
- **Retenção ~30 dias aplicada de forma amortizada/probabilística** (não um cron pesado): em ~2%
  das escritas, apague um lote pequeno de registros vencidos (`DELETE … WHERE created_at <
  NOW()-30d LIMIT 500`), no próprio caminho quente. Em alto volume, avalie um job dedicado.
- Índices `(tenant, created_at)` e `(tenant, conversation, id)`.

## C. Fila de "conversas sem resposta" (recuperação acionável)

Query em 3 estágios sobre o log de decisões:
1. Pega a **última decisão de cada conversa** no período; se terminou em `sent`, a conversa **sai**
   (o cliente acabou sendo respondido depois do tropeço).
2. Pega a decisão `skipped` mais recente com motivo em uma **whitelist de motivos ACIONÁVEIS** (o
   operador consegue resolver): `perfil_nao_autonomo`, `modulo_desligado`, `limite_diario_conversa`,
   `limite_hora_tenant`, `sem_resposta_segura`, `ia_indisponivel`, `whatsapp_desconectado`,
   `envio_falhou`, `erro_interno`, `conversa_bloqueada:%`. **Ruído interno**
   (`ja_respondida`, `mensagem_nao_e_a_ultima`) **nunca entra**.
3. Enriquece com o contato e traduz o motivo para frase de negócio.

A UI escolhe **UMA ação de 1 clique** por item, por prioridade:
- tem `reply_text` pronto + falha de envio → **"Enviar agora"** (retry)
- pausada → **"Reativar conversa"**
- perfil não-autônomo → **"Ligar o agente"** (leva à config)
- canal caído → **"Conectar WhatsApp"**
- default → **"Abrir conversa"** (deep-link)

O **retry é fortemente defensivo**: recusa (409) se a conversa está pausada OU se já existe
**qualquer** outbound depois da mensagem original (reenviar por cima ficaria sem contexto); só
aceita motivos de falha de envio com `reply_text` pronto; reenvia com `source=ai_agent,
pause_agent=false`; grava nova decisão `reenvio_manual`.

## D. Log de "clientes atendidos" (prova de trabalho real)

Distinga trabalho **real** de teste/simulação pelo marcador `source=ai_agent` no payload de saída
(o chat de treinamento **não** conta). Agrupe por dia, com labels relativos ("Hoje"/"Ontem"/dia
da semana). Derive um **resumo humano** dos fatos que o agente memorizou por conversa (memória
durável), com fallback para a última mensagem do cliente. Derive um **status de negócio** do
estado da conversa: "Com o agente" (não pausado) / "Quer fechar" (`cliente_quer_fechar`) /
"Pediu atendimento humano" (`cliente_pediu_humano`) / "Equipe assumiu" (`human_takeover`).
Deep-link para a conversa. Totais: clientes distintos, respostas, dias com atendimento.

## E. Notificações ao dono com deduplicação diária

Um helper `notifyOnce(tenant, payload, dedupeKey)` que insere só se **não existir** notificação
com a mesma chave **no dia** — o dono recebe **um alerta por dia**, não a cada mensagem. Dispare em:
- **Handoff** — o agente pausou por decisão do cliente (`cliente_pediu_humano` → "Cliente pediu
  atendimento humano…"; `cliente_quer_fechar` → "Cliente quer fechar — finalize…").
- **Falha de entrega** — WhatsApp desconectado / envio falhou → "cliente ficou sem resposta
  automática".

Sempre best-effort (try/catch total). A **chave = título estável** que identifica unicamente o
evento no dia (inclua nome+telefone da conversa, senão dois clientes com título idêntico
suprimiriam um alerta).

## F. Mensagem-ponte com throttle por memória durável

Quando a cadeia de IA cai totalmente, não deixe o cliente no vácuo: envie uma mensagem fixa
determinística, **no máximo 1x a cada 6h por conversa**, controlada por um timestamp
(`last_hold_at`) na memória durável. Anti-corrida: se chegou mensagem mais nova, deixe o próximo
evento tratar.

## G. Contrato da API do painel (referência)

- **GET** (leitura): `dashboard`, `conversation`, `packages`, `attended`, `agent_pauses`,
  `agent_decisions` (7/30 dias), `contact_search`, `availability`.
- **POST** (mutação, todos com CSRF): `save_profile`, `test_agent`, `block_contact`,
  `unblock_contact`, `resume_conversation`, `retry_send`, `save_example`, `archive_example`.
- Toda resposta reemite o token CSRF. Erros mapeados: 403 (não-admin/CSRF), 402 (plano
  bloqueado), 404, 400, 500 (detalhe só em modo debug). Multi-tenant em toda query.

## Estratégia de testes (3 camadas, portátil)

1. **Lógica pura, sem I/O** — extraia toda a decisão (merge de memória, seleção de tier,
   sanitização anti-vazamento, detecção de intenção/objeção, formatação de prompt, blocklist,
   expiração de pausa) em **funções puras** e cubra com asserts sobre **invariantes de negócio
   concretos**, incluindo **bugs reais reproduzidos** como caso de teste (ex.: "Me passa o local"
   quando o local já foi informado). Roda em milissegundos, sem rede/banco, sai com código ≠ 0 em
   qualquer falha. Um runner `check(label, bool)` de ~10 linhas basta — não precisa de framework.
   (No Memora: `test_agent_memory.php`, 110 checks.)
2. **Contrato de API com cliente stubado** — subclasse/stub do cliente HTTP que sobrescreve só o
   método de envio, **captura o corpo enviado** e devolve respostas fixas. Testa "o que sai para o
   provedor" sem gastar token: campos obrigatórios, params proibidos por modelo (temperature no
   Sonnet 5), tratamento de recusa/erro, redação de PII ida-e-volta, cadeia de fallback
   multi-provedor. Faça asserts **conscientes do ambiente**: se a chave do provedor está ausente,
   espere a cadeia degradada — o teste passa com ou sem credenciais.
   (No Memora: `test_llm_router.php`.)
3. **Smoke ao vivo mínimo** — exercita o pipeline real gastando o mínimo (1 chamada por caminho),
   pulando provedores/serviços não configurados em vez de falhar.
   (No Memora: `test_llm_providers.php`; e `smoke_test.php` para o webhook.)

## Cicatrizes de produção (armadilhas a evitar)

- **DDL faz commit implícito → migre FORA de transação.** Em MySQL/Oracle, `CREATE/ALTER TABLE`
  comitam implicitamente e não são revertidos por rollback. Execute o setup de schema **uma vez,
  antes** de abrir qualquer transação (com guard de idempotência por processo); deixe a transação
  envolver só DML. O smoke transacional que chama uma função que dispara o setup vaza dados —
  ver abaixo.
- **Smoke transacional pode vazar → use identificadores rastreáveis.** Como rollback não cobre DDL
  e ambientes são compartilhados, prefixe toda chave natural com `smoke_`/`.smoke.` + seed
  (timestamp+random), tenant sintético alto (ex.: 999999), telefone falso — e **exija flag
  explícita** (`--commit=1`) para commitar. Assim qualquer resíduo é localizável e limpável.
- **Introspecção de schema portátil.** Consulte o catálogo padrão (`INFORMATION_SCHEMA.COLUMNS/
  STATISTICS`) **com parâmetros vinculados** — não `SHOW COLUMNS … LIKE ?`, que **quebra com
  prepared statement no MySQL 5.7** (erro 1064). E **nunca** use um helper "coluna existe?" que
  retorna false ao engolir a exceção do `SHOW` — ele "apaga" colunas reais e causa erro
  silencioso (já causou 400 em produção).
- **Funções SQL não-portáteis.** Não dependa de funções que podem faltar na versão de produção
  (ex.: `REGEXP_REPLACE` não existe no MySQL 5.7 — erro 1305, que some dentro de um catch e pula
  código irmão). Faça normalização de texto/telefone na **camada de aplicação**.
- **Memória durável é entrada não-confiável.** Normalize na leitura E na escrita (allowlist de
  chaves, truncamento, cap de tamanho) — pode vir corrompida do banco ou envenenada pelo LLM.
- **O selo DEVE reutilizar a condição do motor, não um flag.** Se as duas condições divergirem no
  futuro, o selo volta a mentir. Trate a condição como fonte única (idealmente uma função
  compartilhada).
