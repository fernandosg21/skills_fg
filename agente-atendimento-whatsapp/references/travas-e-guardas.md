# Travas e guardas do responder autônomo

Este é o coração da skill. Um agente que responde clientes sozinho é perigoso: pode
responder duas vezes, responder mensagem velha, entrar em loop, responder num grupo, atropelar
um atendimento humano, ou queimar tokens gerando resposta que não pode ser entregue. As travas
abaixo blindam contra cada um desses casos.

Referência histórica: `whatsapp_agent_autoreply()` em `adm/whatsapp/backend/agent_responder.php` +
o gate/pausas/blocklist em `adm/whatsapp/backend/ai_training.php`.

## Contrato da função central

```
autoreply(tenantId, conversationId, message, settings) -> { sent: bool, skipped_reason: string, ... }
```
Sempre retorna — nunca lança. Um helper `skip(reason)` padroniza o retorno de silêncio, e o
motivo é gravado na auditoria (ver [painel-observabilidade-e-testes.md](painel-observabilidade-e-testes.md)).
É acionada pela ingestão em toda inbound nova, **dentro de try/catch — o agente nunca derruba o
webhook** (uma exceção vira decisão `erro_interno`).

## As travas, na ORDEM EXATA

A ordem não é estética: coisas baratas e conservadoras primeiro; o que gasta LLM por último.

| # | Guarda/ação | Motivo de silêncio | Porquê |
|---|---|---|---|
| 1 | IDs/ownership de tenant, conversa e inbound | `conversa_invalida` | Abortar cedo e impedir acesso cruzado. |
| 2 | Texto acionável normalizado | `mensagem_sem_texto` | Mídia sem legenda não dispara resposta textual. |
| 3 | Módulo + entitlement/plano | `modulo_ou_plano_bloqueado` | Produto não autorizado não cria efeitos nem gasta IA. |
| 4 | Modo efetivo do perfil | `perfil_nao_autonomo` | `off`/`shadow` não enviam; flags derivadas precisam concordar. |
| 5 | Gate de conversa: grupo → opt-out/supressão → blocklist → pausa | `conversa_bloqueada:<motivo>` | Respeitar destinatário, escopo e intervenção humana. |
| 6 | Opt-out ou pedido de humano | supressão ou handoff + pausa | Tem prioridade sobre qualquer geração. |
| 7 | Horário/fuso/política de ausência | `fora_do_horario` | Não responder em horário indesejado; ausência é determinística. |
| 8 | Orçamento de geração da request | `geracao_ja_consumida` | Uma geração lógica por request; sem recursão/coalescência cara. |
| 9 | **Lock de geração por inbound** | `geracao_em_andamento` | Duas requests não geram para a mesma mensagem; inbound seguinte continua livre. |
| 10 | É a última inbound? | `mensagem_nao_e_a_ultima` | Resposta velha não compete com a mensagem mais nova. |
| 11 | Sem outbound/outbox posterior | `ja_respondida` | Retry de webhook não duplica intenção. |
| 12 | Rate limit por conversa + global | `limite_atingido` | Somar todo outbound; política de indisponibilidade explícita. |
| 13 | Saúde da conexão/webhook | `whatsapp_indisponivel` | Não gastar LLM sem caminho de entrega. |
| 14 | Histórico/memória válidos | `sem_contexto` | Normalizar memória não confiável antes do prompt. |
| 15 | Intenção crítica pela `CommitmentPolicy` | resposta segura, ação tipada ou handoff | Dinheiro/contrato não dependem do LLM. |
| — | Gerar: tier → deadline global → sanitizar → follow-through | `sem_resposta_segura` / ponte | Uma geração lógica, fallback dentro do orçamento. |
| 16 | **Recarregar todos os gates** | `estado_alterado_durante_geracao` | Plano, modo, pausa, blocklist, horário e conexão podem mudar. |
| 17 | **Lock curto de entrega por conversa** | `entrega_em_andamento` | Serializar envio, insert do webhook/eco e adoção. |
| 18 | Repetir última-inbound/dedupe sob lock | `resposta_obsoleta` | Fechar a corrida imediatamente antes da entrega. |
| 19 | Criar/obter outbox idempotente e entregar | — | Persistir intenção antes do I/O e reconciliar aceite desconhecido. |
| 20 | Atualizar memória/auditoria com o entregue | — | Bolha parcial não pode registrar o texto inteiro. |

Segurar o lock de geração até concluir a geração/intenção daquela inbound, sempre liberando em
`finally`. Não segurar o lock de conversa durante LLM. Adquirir o lock de entrega apenas para a
janela final, reler o estado e criar/entregar a outbox; liberar em `finally`.

## O gate de conversa (ordem: grupo → supressão → blocklist → pausa)

`can_agent_use_conversation(tenant, conversation)` decide se o agente pode agir naquela
conversa, nesta ordem:
1. **Grupo/broadcast → bloqueia.** Grupo não é atendimento 1:1; responder é ruído/risco.
2. **Opt-out/supressão → bloqueia.** Pedido do destinatário nunca é removido por retomada automática.
3. **Blocklist → bloqueia.** Contato silenciado pelo dono (ver abaixo).
4. **Pausa → bloqueia**, a menos que a pausa tenha expirado — nesse caso o **auto-resume é
   *lazy*** (acontece na própria checagem, sem cron): se `pause_expired()` e o resume der certo,
   `allowed=true`.

Reuse esse gate: a mesma função alimenta o runtime e o painel.

## Intertravamento de ativação do dono

O envio automático só sai quando um administrador **deliberadamente** coloca o agente em modo
`autonomous`. Isso é autorização da feature, não consentimento do destinatário nem base legal para
mensagem proativa.

**Regra de ouro:** o administrador edita **um único modo** (`off|shadow|autonomous`). Migre flags
legadas num ciclo controlado, derive-as do modo e impeça autonomia até a migração terminar. Não
espere o usuário “salvar novamente” nem mantenha duas autoridades concorrentes.

## Fail-open vs fail-closed (decisão explícita de blast radius)

- Ownership, entitlement, modo, pausa, blocklist, horário, lock de entrega e última inbound são
  **fail-closed**. Falha em provar autorização nunca libera envio.
- Limites somam todo outbound iniciado localmente e incorporam atividade externa observada por eco.
  Se o canal externo não é observável em tempo hábil, reserve margem pessimista ou bloqueie esse
  caminho durante autonomia.
- Em atendimento autônomo, preferir limiter **fail-closed** quando o estado está indisponível. Se o
  negócio não puder aceitar silêncio global, usar fallback deliberado de volume muito baixo + teto
  por conversa + alerta imediato; documentar a escolha e testar a falha.
- Métrica/observabilidade pode ser best-effort; autorização de envio não.

Valores como 40/dia e 120/h são exemplos da implementação de referência, não defaults universais.
Dimensionar por política do provedor, negócio, país, tipo de canal e risco.

## Pausas e retomada

- **Pausar** grava estado, instante, motivo e origem. Motivos mínimos:
  - `human_takeover`: um humano enviou manualmente; só expira conforme política explícita e após
    provar que não houve nova atividade humana desde a pausa;
  - `customer_requested_human`: default de retomada manual; qualquer auto-resume exige política,
    janela mínima e prova de ausência de resposta da equipe;
  - `critical_handoff`: default de retomada manual até a ação de negócio terminar;
  - `policy_or_incident`: retomada somente por administrador/kill-switch.
- Parametrize prazos por domínio e risco. Os valores usados num projeto histórico não são defaults.
- **Auto-resume é *lazy*:** avaliado só na próxima inbound. Se o cliente nunca mais escreve, a
  conversa permanece pausada na prática, mesmo "vencida".

## Supressão e blocklist

- **Supressão do destinatário** registra pedido de parar/revogação, finalidade, origem e data.
  Cancela fila/outbox apenas antes de `sending`; in-flight recebe `do_not_retry` e reconciliação.
  Nunca é removida por resume automático.
- **Blocklist operacional** é a decisão do dono de não automatizar um contato. Não substitui a
  supressão nem a prova exigida para comunicação proativa.

- Guardar em tabela tenant-scoped ou documento allowlisted com limite explícito. Cada entrada tem
  número canônico, rótulo opcional e data.
- Normalizar conforme o plano de numeração do país. Para Brasil, testar variação com/sem nono
  dígito sem transformar a heurística em match global por últimos dígitos.
- Add/remove alteram somente a blocklist, nunca salvam o perfil inteiro. Silenciar um contato é
  ação isolada e não deve reescrever persona/modo.
- Aplicar no runtime, aprendizado, fila, retry e envio direto automático. Retomar conversa não pode
  remover blocklist implicitamente.

## Sanitização de saída (antes de enviar)

`sanitize_reply()`: remove cercas de código e aspas envolventes, **bloqueia vazamento da
estrutura interna** (nomes de campos internos, JSON do contexto, "system prompt"), corta em ~900
chars. Se a limpeza **esvaziar** o texto e o modelo tinha respondido → `sem_resposta_segura`
(silêncio). Texto inseguro nunca vai ao cliente; o silêncio é intencional.

Sanitização textual não valida fatos. Depois dela, conferir valores, moeda, disponibilidade,
desconto, prazo, compromisso e chamadas de ferramenta contra fontes canônicas. Divergência usa
resposta determinística segura ou handoff; não “corrija” com uma segunda LLM.

## Rede de segurança sem vácuo

Se toda a cadeia de modelo falhar, considere uma **mensagem-ponte fixa**, sob os mesmos gates,
horário, opt-out, quota, lock e outbox. A política define o cooldown por conversa; registre a
intenção para não duplicar. Se não for seguro ou autorizado enviar, permaneça em silêncio e alerte a
equipe. Não prometa ausência de vácuo sacrificando autorização.

## Checklist portátil de guardas (para qualquer canal, qualquer stack)

Antes de o agente **entregar** qualquer resposta:

1. Provar tenant, conversa, inbound e ownership.
2. Confirmar mensagem acionável.
3. Resolver módulo, plano/entitlement e modo efetivo.
4. Aplicar grupo, opt-out/supressão, blocklist, pausa, pedido humano e horário.
5. Consumir um orçamento de geração da request.
6. Adquirir lock por inbound; provar que é a última e ainda não tem resposta/outbox.
7. Aplicar limites e pré-check de conexão/webhook.
8. Tratar intenção crítica pela `CommitmentPolicy`; gerar só o texto conversacional permitido.
9. Sanitizar e validar saída; fallback cabe no deadline global.
10. Reler todos os gates após a LLM.
11. Adquirir lock curto de entrega por conversa.
12. Repetir última-inbound e dedupe sob o lock.
13. Criar/obter outbox com chave idempotente antes do I/O externo.
14. Reconciliar aceite desconhecido/eco antes de retry.
15. Persistir bolhas realmente entregues e atualizar memória somente com elas.
16. Marcar `source=agent`; eco não pausa, humano posterior pausa.
17. Auditar categoria/fingerprint/outbox sem conteúdo sensível.
18. Liberar todos os locks em `finally`; falha deixa intenção recuperável, não envia por fora.

Trate números da implementação de referência apenas como exemplos. Parametrize janela de histórico,
limites, cooldown, tamanho da resposta, deadline e retenção; teste mínimos/máximos e o pior caso do
projeto alvo.
