# Treino de voz por conversas reais (aprender o jeito da empresa)

Capacidade opcional e avançada: o dono envia **conversas reais exportadas do WhatsApp**
(`.txt`, "Exportar conversa > Sem mídia") e a IA extrai a **voz** do atendimento — persona,
tom, expressões típicas, emojis, saudação/despedida e o **FORMATO** de apresentar preço,
tratar objeção e conduzir o fechamento. O resultado vira um "perfil de voz" que entra no
system prompt do agente, deixando-o falar como a empresa fala.

Implemente isso **só depois** do agente básico (prompt + travas + observabilidade). É um
reforço do `prompt-vendedor-consultivo`, não um substituto.

## Os quatro contratos inegociáveis

Antes de qualquer código, grave estas quatro regras — elas definem o que a feature pode e não
pode fazer. Violar qualquer uma descaracteriza a feature.

1. **TÉCNICA ≠ FORMATO.** Extraia só o *jeito de falar* (formato, vocabulário, ritmo). A
   *técnica de venda* continua sendo o playbook consultivo do prompt. Onde a conversa real
   mostrar prática pior que o playbook (resposta seca, preço sem contexto, sumir), isso **não**
   entra no perfil — vai para um relatório "o que farei melhor". O modelo de extração é
   instruído explicitamente a **não avaliar estratégia de venda**.
2. **COEXISTÊNCIA.** O perfil de voz é **extra**: complementa os campos de treinamento
   escritos à mão e nunca os substitui. Grave-o numa coluna separada; a função de salvar o
   perfil manual **não pode tocar** nessa coluna. Em conflito, vencem as orientações escritas e
   as regras. O perfil de voz **não** carrega informação de negócio (preço, condição, serviço)
   — isso pertence aos campos manuais.
3. **LGPD INVIOLÁVEL.** Dado sigiloso/pessoal/senha é **descartado**, não mascarado. Ver a
   seção de privacidade abaixo — é a parte mais fácil de errar e a mais grave.
4. **POR CONTA (tenant).** O aprendizado é exclusivo da conta. Toda query filtra/grava
   `tenant_id` da sessão, nunca do payload. Nenhuma outra conta enxerga os dados nem o perfil.

## Melhoria contínua (não substituição)

Re-treinar **refina**, não recomeça. Quando já existe um perfil aplicado, a etapa de
consolidação recebe o perfil atual como base: mantém o que continua verdadeiro, ajusta o que
as novas conversas contradizem (o recente vence — a empresa evolui), acrescenta o novo.
**Ausência não é contradição** (não apague uma característica só porque a rodada nova não a
mostrou). A saída traz um campo `aperfeicoamentos[]` — o diff em linguagem de dono ("encontrei
3 expressões novas", "ajustei como você apresenta preços") — renderizado como card "O que
mudou". Volume **não** confunde: o perfil é sempre consolidado com **tetos fixos** (ex.: ≤10
expressões, strings curtas), então mais conversas = mais fiel, nunca maior. Enviar 1–2
conversas é permitido, com aviso de que o aprendizado sai mais raso.

## Arquitetura: map-reduce em passos curtos (hospedagem sem worker)

O processamento é dividido para caber no `max_execution_time` de hospedagem compartilhada e é
**dirigido pelo cliente** (o JS chama passo a passo), sem worker de fundo.

```
upload (1 arquivo/request) → parse+scrub → staging
   → confirmar "quem é você" (autor-empresa) → montar chunks
   → analisar (MAP: 1 chunk por request, LLM tier barato → JSON parcial)  ← loop do JS
   → consolidar (REDUCE: junta parciais + perfil atual → perfil final + diff)
   → revisar (editável pelo dono) → aplicar (grava perfil + exemplos)
```

Duas tabelas (ambas com `tenant_id`):

- **jobs**: `status` (`draft`→`analyzing`→`consolidating`→`reducing`→`review`→
  `applied`|`failed`|`canceled`), `participants_json`, `business_author`, `chunks_total/done`,
  `result_json`, `applied_at`.
- **chunks** (staging + fila numa tabela só): `idx`, `status`
  (`staged`→`pending`→`processing`→`done`|`failed`), `content` (texto já com scrub),
  `claim_token`, `result_json`.

**Idempotência por claim atômico** (o mesmo padrão do responder): cada passo faz
`UPDATE ... SET status='processing', claim_token=? WHERE status='pending' ... LIMIT 1`; só quem
venceu o UPDATE processa. Duplo clique / duas abas não duplicam trabalho nem custo. Transições
de fase (`draft→analyzing`, `consolidating→reducing`, `review→applied`) também são `UPDATE`
condicionais ao status atual (rowCount 0 ⇒ 409). Órfãos (`processing` há >2min) são
recuperados por reclaim.

## Parser determinístico (sem LLM)

- Formatos: iOS `[dd/mm/aaaa, hh:mm:ss] Nome: msg` e Android `dd/mm/aaaa hh:mm - Nome: msg`
  (hífen/en-dash/em-dash, am/pm opcional). Linha sem prefixo de data = continuação da anterior.
  Linha com data mas sem `": "` = mensagem de sistema (descartada, mas conta para detectar
  grupo).
- Limpeza: BOM, marcas de direção Unicode (U+200E/200F/202A-202E/2066-2069/FEFF), CRLF.
- Ruído descartado: `<Mídia oculta>`/`<Media omitted>`, figurinha/áudio/imagem omitidos,
  ligações perdidas, aviso de criptografia, mensagens apagadas.
- Grupo (>3 participantes ou "criou o grupo") → recusado com erro amigável (só conversas
  individuais).
- Sessões: quebra por gap ≥6h; descarta sessão com <4 mensagens ou de um autor só.
- Transcript rotulado `[VOCÊ]` / `[CLIENTE_N]` (nunca o nome real) — o autor-empresa é o
  participante comum entre arquivos + maior volume, **confirmado pelo dono na UI**.
- Chunk = 1–3 sessões ou ~12k chars; teto de chunks por rodada (ex.: 40), priorizando conversas
  com sinal comercial (`R$|pacote|orçamento|desconto|contrato`) e mais recentes.
- Dedup de arquivo por hash do conteúdo limpo (reenvio = "duplicado", não reprocessa).

## Privacidade (a regra inviolável, em camadas)

Ordem importa: o scrub roda **no corpo da mensagem, depois de destacar timestamp+autor** —
senão a regex de telefone come a data da linha.

1. **Scrub irreversível → `[dado removido]`** (não mascara em trânsito, apaga de vez), aplicado
   no **staging** (antes do INSERT) **e** em toda string do resultado sanitizado:
   e-mail, CPF/CNPJ (com e **sem** máscara, inclusive **grupos de dígitos separados por
   espaço**), CEP, cartão (grupos de 4, separador simples ou múltiplo), telefone BR, endereço
   com número, e qualquer sequência de 8+ dígitos colada. Para dígitos com espaço, use um
   `preg_replace_callback` que só descarta quando o total de dígitos ≥ 11 (CPF=11, CNPJ=14,
   cartão=16) — assim **data "26 04 2026" (8 dígitos), preço e horário sobrevivem** (crítico:
   scrubar data/preço quebra a análise).
2. **Mensagem com credencial é descartada INTEIRA** (não adianta mascarar o valor — o contexto
   já entrega): senha/login/PIN/CVV/validade de cartão/chave Pix, e **"código" seguido de 4–8
   dígitos** (OTP). Rode esse descarte também **no staging**, não só no parse do confirm — senão
   a senha fica em claro no banco entre o upload e a confirmação (ou para sempre, se o dono
   abandonar).
3. **Redação de PII em trânsito** (o `chatWithRedaction`/PiiRedactor do roteamento) como
   terceira camada, com os nomes dos clientes passados em `known`.
4. **Prompts map e reduce** carregam a regra dura: "se aparecer dado pessoal/documento/
   endereço/cartão/senha, IGNORE — é proibido copiar para qualquer campo do JSON".
5. **Retenção mínima**: o texto cru do chunk vira `NULL` assim que a análise dele termina
   (`done`); a tabela de chunks é apagada ao consolidar/aplicar/descartar. Uma **higiene
   oportunista** (rodada na carga da tela) cancela e limpa jobs abandonados (não-terminais
   parados > 48h) e apaga `participants_json`/`business_author` de jobs terminais — eles guardam
   **telefones** de clientes (contato não salvo vira autor = telefone no export).

## Extração: os dois prompts

- **MAP** (por chunk, tier barato, `max_tokens` ~1200): "analista de comunicação; extraia só o
  jeito de falar". Observa persona, tom, expressões literais, emojis+frequência, tamanho de
  mensagem, saudação/despedida, FORMATO de preço/objeção/fechamento; anota `red_flags_nao_copiar`
  e `candidatos_exemplo` (≤2) e `lacunas_conhecimento`. **Regra de fidelidade** (decisão do
  dono): preserva informalidade/calor/expressões, mas **nunca registra erro de digitação/
  ortografia como característica** — normaliza para português correto.
- **REDUCE** (junta parciais + perfil atual, tier melhor, `max_tokens` ~2200): consolida em um
  perfil; repete a regra central + descreve o playbook ("onde a prática real for pior, registre
  em `farei_melhor`"); dedup de lacunas com `sugestao_campo` (para onde copiar cada lacuna);
  gera `aperfeicoamentos`. Saída: JSON estrito.
- **Robustez de JSON**: extração tolerante (tira cercas ```/aspas curvas, pega do primeiro `{`
  ao último `}`) → 1 retry "responda só o JSON" → **sanitize por whitelist** com caps de tamanho
  em toda chave. Nada fora do schema chega ao banco nem ao prompt.

## Injeção no prompt do agente

Uma função dedicada transforma o perfil de voz em diretrizes determinísticas (~900 chars),
injetada logo após as diretrizes de estilo, com preâmbulo explícito de coexistência: *"estas
diretrizes complementam as orientações escritas e nunca as substituem; em conflito, valem as
orientações escritas e as regras; mantenha sempre a ortografia correta"*. Como o mesmo builder
de prompt serve teste **e** produção, injetar num ponto só cobre os dois. Sem perfil aplicado,
a função retorna `''` e o prompt fica **idêntico** ao anterior (regressão zero).

## Aplicar / Restaurar

- **Aplicar**: re-sanitiza no servidor (nunca confie no que o front mandou), grava o perfil,
  cria os candidatos aprovados como **exemplos few-shot pendentes** (entram na fila de revisão
  existente; aprovados lá reforçam o prompt de produção), marca o job `applied`, apaga os chunks.
- **Restaurar jeito padrão**: anula só a coluna de voz. Os presets de estilo continuam; os
  exemplos já criados permanecem (o dono os gerencia na aba de exemplos). **Cuidado**: o estado
  da tela não pode continuar mostrando "já aplicado" — ver gotcha abaixo.

## Gotchas (cicatrizes desta feature)

- **Senha só descartada no confirm vaza no staging.** Se o descarte de credencial roda apenas no
  parse final, a senha fica em claro na tabela de chunks entre o upload e a confirmação — e para
  sempre se o dono abandonar. Descartar **no staging** é obrigatório.
- **Dígitos com espaço furam o scrub.** "123 456 789 09" não casa a regex de CPF com pontos.
  Cubra grupos separados por espaço com limiar de total de dígitos — e **não** scrube datas
  ("26 04 2026") nem preços; teste os dois lados (deve remover / deve preservar).
- **Truncamento global corta o JSON.** Se a função de LLM compartilhada trunca a resposta num
  teto pensado para mensagens curtas de WhatsApp, o JSON grande da extração chega cortado e o
  parse falha justamente nas rodadas ricas. O teto de saída precisa ser **por chamada** (o
  agente usa curto; a extração pede longo).
- **Falha terminal vs transitória do reduce.** Se as duas chegam ao front iguais, o botão
  "Continuar" fica num loop morto (retry num job já `failed`). Sinalize a falha **terminal** com
  uma flag e faça o front voltar ao início; só a transitória oferece retry.
- **Loop de consolidação não sai em `applied`.** Se o loop de polling só encerra em `review` e
  outra aba aplica o job (vira `applied`), o polling martela a API para sempre. Trate `review`
  **e** `applied` como saída.
- **Estado pós-reset engana.** Se o GET de estado sempre cai no último job `applied`, depois de
  "Restaurar padrão" a tela volta a dizer "falo do seu jeito" mesmo com o perfil já nulo.
  Condicione o fallback a o perfil de voz ainda existir.
- **Multipart quebra o helper de fetch JSON.** O upload é `multipart/form-data`; o helper que
  força `Content-Type: application/json` corrompe o corpo. Use uma variante sem esse header
  (mantendo CSRF e rotação de token).
- **A seção fica dentro do form do perfil.** Se a UI de voz mora dentro do `<form>` do perfil, o
  render/coleta do perfil pode zerar os campos da voz e enviar campos alheios no save — isole com
  um guard (`closest('[data-voice-root]')`).

## Checklist específico

- [ ] Perfil de voz numa coluna separada; salvar o perfil manual **não** o apaga
- [ ] Sem perfil aplicado → prompt idêntico ao anterior (regressão zero no agente)
- [ ] CPF/CNPJ/cartão com espaço e OTP viram `[dado removido]`; **data/preço/horário sobrevivem**
- [ ] Mensagem com senha descartada **no staging** (conferir no banco, não só na saída)
- [ ] Texto cru vira NULL no `done`; chunks apagados ao consolidar/aplicar/descartar
- [ ] Job abandonado (>48h) é cancelado e limpo; telefones em `participants_json` purgados
- [ ] Re-treino refina (mantém+ajusta+acrescenta) e mostra `aperfeicoamentos`; volume não incha o perfil
- [ ] Duplo clique / duas abas em qualquer passo → sem trabalho/custo duplicado (claim atômico)
- [ ] Falha terminal do reduce volta ao upload; transitória oferece retry; nenhum loop morto
- [ ] Tudo filtrado por `tenant_id` da sessão; nenhuma conta vê dado de outra
- [ ] JSON malformado do LLM → reparo + 1 retry + whitelist; nada fora do schema persiste
