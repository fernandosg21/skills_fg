---
name: medidor-uso-ia
description: Implementa um medidor de uso e custo de IA (LLM) multi-provedor para SaaS — registra cada chamada de LLM (sucesso E falha) com tokens e custo estimado em USD, agrega por período/tenant/modelo/função, e estima o saldo de créditos de provedores que não expõem saldo por API (ex.: Anthropic/Claude). Use quando o usuário pedir para medir/controlar gasto de IA, contador/medidor de tokens, custo de LLM, painel de uso de IA, quanto a IA está custando, saldo de créditos da OpenAI/Anthropic/Gemini, telemetria de LLM, ou gestão de consumo de IA no SaaS. Agnóstico de linguagem (Node, Python, Ruby, Go, PHP) e de banco (Postgres, MySQL, Mongo, SQLite). Baseada na implementação de referência do Memora (a:\Site Fotografia\Memora.fot.br).
---

# Medidor de Uso e Custo de IA (multi-provedor, SaaS)

Skill de implementação: replica em qualquer projeto o medidor de uso de IA do Memora —
uma peça de telemetria que responde três perguntas de negócio: **quanto a IA está me
custando, quem consome, e quanto ainda tenho de crédito** no provedor. Vale para qualquer
stack (Node/Python/Ruby/Go/PHP) e qualquer banco; as citações `arquivo:linha` nos
references apontam para a referência em `a:\Site Fotografia\Memora.fot.br` (no Memora tudo
vive em `includes/llm_usage.php` + painel `saas/ia_uso.php`).

Combina bem com a skill [`agente-atendimento-whatsapp`](../agente-atendimento-whatsapp):
o agente é o maior gerador de chamadas de LLM e o principal cliente deste medidor.

## Arquitetura em uma frase

Toda chamada de LLM do sistema grava **uma linha** num log append-only (`provider`,
`model`, `tier`, `feature`, `context_id`, `ok`, tokens de entrada/saída, `cost_usd`) no
instante em que ocorre — via um **wrapper de log que nunca lança exceção**; o custo é
estimado por uma **tabela de preços versionada no código** (casada por prefixo de modelo);
o painel só faz `GROUP BY` sobre esse log; e o **saldo** de provedores sem API de saldo
(Anthropic) é `créditos informados manualmente − gasto desde a data de referência`.

## Referências (leia conforme a etapa)

| Arquivo | Conteúdo |
|---|---|
| [references/modelo-e-instrumentacao.md](references/modelo-e-instrumentacao.md) | As duas tabelas (`usage_log` + `settings`), tabela de preços versionada, normalização de tokens (2 dialetos de API), fórmula de custo, o wrapper `logUsage` à prova de falha e onde instrumentar cada chamada |
| [references/painel-e-saldo.md](references/painel-e-saldo.md) | O painel SaaS (blocos, cards, gráficos, insights), agregações, saldo estimado por créditos, Cost Report Admin da Anthropic + cache 1h, alertas e regras de UX sem jargão |

## Ordem de implementação

Cada etapa entrega valor sozinha — dá para parar em qualquer uma.

1. **Log + preços + custo (o núcleo)** — crie a tabela `llm_usage_log` (uma linha por
   chamada), a tabela de preços por prefixo de modelo (no código, não no banco), o
   normalizador de tokens e o estimador de custo. Detalhes em
   [modelo-e-instrumentacao.md](references/modelo-e-instrumentacao.md).
2. **Wrapper de instrumentação** — a função `logUsage(tenantId, {provider, model, tier?,
   feature, context_id?, ok, usage})` que normaliza tokens, calcula custo **só em sucesso**,
   trunca strings e persiste dentro de um try/catch que **nunca propaga exceção**.
3. **Instrumente os pontos de chamada** — envolva CADA chamada de LLM (agente, classificação,
   follow-up, geração de conteúdo…) com `logUsage`, chamando-o **uma vez por tentativa**:
   `ok=true` no sucesso e `ok=false` para cada provedor que falhou numa cadeia de fallback.
   Sempre dentro de try/catch próprio ("o log de uso nunca quebra a feature").
4. **Agregações** — `totals / byTenant / byProvider / daily / byModel / byFeature`, todas com
   filtro de janela `[from 00:00, to+1dia)`. É o que o painel consome.
5. **Painel** — período (hoje/7d/30d/mês), 4 cards, gráficos, ranking por tenant, tabelas por
   modelo/função e **insights em linguagem natural**. Rótulos sem jargão técnico.
6. **Saldo por créditos** — settings key/value (`credits_usd`, `ref_date`), `saldo = créditos
   − gasto desde ref`, com fonte "estimado" (soma dos logs) por padrão.
7. **Custo real opcional (Admin API)** — se o provedor tiver API de custo administrativa (a
   Anthropic tem o Cost Report), consulte-a com chave admin, cacheie ~1h, e marque a fonte
   como "real". Fallback gracioso para "estimado" quando ausente/falha.

## Decisões de projeto que importam (não mude sem motivo)

- **O log de uso NUNCA lança exceção.** É telemetria: se a tabela sumir ou o INSERT falhar,
  o atendimento ao cliente e o webhook têm que continuar. O wrapper engole o erro (só
  `error_log`) e retorna false; **cada chamador também envolve em try/catch próprio**.
- **Falha grava custo ZERO.** Se `ok=false`, `cost_usd=0` mesmo que a API tenha retornado
  tokens. Isso separa "quanto gastei" de "quantas vezes tentei" — a falha é uma métrica de
  fallback/confiabilidade (`SUM(ok=0)`), não de gasto.
- **Preço por PREFIXO de modelo, na tabela do código.** `starts-with` case-insensitive tolera
  sufixos de versão (datas) sem cadastrar cada variante; a tabela vira diff/PR quando o
  provedor muda preço. Modelo desconhecido = custo 0 (nunca quebra, mas **subestima** até você
  adicioná-lo).
- **Saldo é estimativa, e o painel diz isso.** Provedores como a Anthropic não expõem saldo por
  API; o painel mostra `créditos informados − gasto` e um selo "estimado" vs "real via Admin
  API". Nunca apresente estimativa como número oficial de billing.
- **`feature` separa uso real de teste interno.** `agente_whatsapp` ≠ `agente_teste`. Sem essa
  dimensão você cobra o cliente por testes do time.
- **`context_id` habilita "custo por conversa".** Agrupar chamadas de uma mesma conversa/tarefa
  (`conv_123`, `pauta_45`) permite `COUNT(DISTINCT context_id)` — a métrica de precificação mais
  útil ("cada atendimento custa ~X").
- **O painel degrada para "sem dados", nunca 500.** Toda query e o cálculo de saldo ficam em
  try/catch: é um painel financeiro consultado sob pressão; melhor mostrar 0 do que erro.

## Gotchas (cicatrizes da implementação de referência)

- **Tokens vêm em dois dialetos.** OpenAI-compatível usa `prompt_tokens`/`completion_tokens`;
  Anthropic usa `input_tokens`/`output_tokens` **+** `cache_read_input_tokens` +
  `cache_creation_input_tokens` (tokens de cache somam ao input). O normalizador precisa aceitar
  os dois e mapear para `{input, output}`; passar o bloco cru errado subcontabiliza cache.
- **Preço introdutório tem validade.** No Memora, `claude-sonnet-5` está a US$2/US$10 por 1M
  até 2026-08-31 e depois vira US$3/US$15 — há um comentário no código, mas a troca é **manual**.
  Preço introdutório esquecido = subestimação de custo. Marque a data no código.
- **Custo 0 do Groq é legítimo, não "sem dados".** Llama/meta-llama têm preço `[0,0]` (tier
  gratuito): aparecem nas contagens de chamadas/tokens mas somem do gráfico de custo. O painel
  avisa "gratuito não gera custo" quando o gráfico de custo fica vazio.
- **Schema on-demand dificulta ALTER.** No Memora as tabelas nascem por `CREATE TABLE IF NOT
  EXISTS` na primeira chamada (sem migration versionada). Simples, mas trocar coluna depois exige
  cuidado extra — prefira migration versionada se seu projeto já tem uma.
- **Cost Report é lento e muda devagar → cache 1h.** A Admin API da Anthropic é paginada e
  rate-limited; cachear por ~1h (chaveado pela data de referência) evita martelar a API a cada
  refresh. O saldo "real" não é ao vivo.
- **Parsing da Cost API é defensivo de propósito.** O Memora soma **recursivamente** todo campo
  `amount` numérico do JSON, para tolerar mudança de shape — mas se a API passar a repetir
  `amount` em subtotais aninhados, poderia dobrar. Valide o total contra os próprios logs.
- **Se a instrumentação sumir, o painel fica vazio SEM erro.** Como `logUsage` engole tudo,
  "painel sem dados" quase sempre é caller faltando — faça `grep` pelos pontos de instrumentação
  antes de suspeitar do painel.
- **Não desligue verificação SSL em produção.** A referência desliga `SSL_VERIFY` só no Windows
  de dev (sem CA bundle) para a Admin API; em Linux/produção fica ligada. Replicar o desligamento
  em produção é um furo de segurança.

## Checklist de verificação

- [ ] Uma chamada de LLM bem-sucedida grava 1 linha com tokens e `cost_usd > 0` (modelo pago)
- [ ] Uma chamada que falhou grava 1 linha com `ok=0` e `cost_usd=0`
- [ ] Cadeia de fallback de N provedores grava N linhas (as falhas + o sucesso final)
- [ ] Modelo gratuito (ex.: Groq/Llama) grava `cost_usd=0` e ainda conta chamadas/tokens
- [ ] Modelo sem prefixo na tabela não quebra (custo 0) — e isso está anotado como risco
- [ ] Derrubar a tabela de log NÃO derruba a feature (o try/catch segura)
- [ ] Painel abre com "sem dados" quando o log está vazio (não dá 500)
- [ ] Ranking por tenant, série diária, por modelo e por função batem com o total
- [ ] `COUNT(DISTINCT context_id)` mostra nº de conversas e o "custo médio por conversa" fecha
- [ ] Saldo = créditos − gasto; selo "estimado" quando não há chave admin
- [ ] Com chave admin, saldo vira "real", cacheia ~1h e degrada para "estimado" se a API falhar
- [ ] Todos os rótulos da tela estão em linguagem de negócio (sem `prompt_tokens`, `TPD`, `tier`)
- [ ] Moeda local (ex.: R$) aparece só se a cotação for informada; opcional não trava a tela

## Saída esperada ao final

1. **Tabela(s) de uso** aplicáveis ao banco real, com índices por (tenant, data), (provider, data), (data).
2. **Módulo/serviço de metering** (`logUsage`, normalizador, estimador de custo, agregações, saldo).
3. **Pontos de instrumentação** em todas as chamadas de LLM do sistema, com `feature` e (quando
   fizer sentido) `context_id` preenchidos.
4. **Painel** com período, cards, gráficos, ranking por tenant e insights — rótulos sem jargão.
5. **Tabela de preços** versionada no código, com datas de preço introdutório anotadas.
6. **README/PR** explicando como adicionar um provedor/modelo à tabela de preços e como informar
   créditos para o saldo.
