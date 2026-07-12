# Modelo de dados e instrumentação

Referência de implementação. No Memora tudo vive em `includes/llm_usage.php` (arquivo
procedural, funções globais `memoraLlmUsage*` guardadas por `if (!function_exists())`).
Aqui está o que importa para replicar em qualquer stack.

## 1. As duas tabelas

O medidor precisa de exatamente duas estruturas.

### `llm_usage_log` — uma linha por chamada de LLM (append-only)

| Campo | Tipo (ref. MySQL) | Papel |
|---|---|---|
| `id` | BIGINT PK auto | — |
| `tenant_id` | INT NOT NULL DEFAULT 0 | Multi-tenant. `0` = tarefa de sistema/single-tenant. |
| `provider` | VARCHAR(30) | `anthropic`, `openai`, `gemini`, `groq`… |
| `model` | VARCHAR(120) | Nome do modelo retornado pela API. |
| `tier` | VARCHAR(30) NULL | Rótulo de roteamento por função (ex.: standard/commercial/negotiation). |
| `feature` | VARCHAR(60) NOT NULL | **Dimensão lógica de origem** ("qual funcionalidade gastou"). |
| `context_id` | VARCHAR(60) NULL | Agrupa chamadas de uma mesma conversa/tarefa (`conv_123`, `pauta_45`). |
| `ok` | TINYINT(1) DEFAULT 1 | Sucesso (1) ou falha (0) da chamada. |
| `input_tokens` | INT DEFAULT 0 | — |
| `output_tokens` | INT DEFAULT 0 | — |
| `cost_usd` | DECIMAL(12,6) DEFAULT 0 | Custo estimado. 6 casas para frações de centavo (conversa Gemini ~US$0,0004). **0 quando `ok=0`.** |
| `created_at` | DATETIME DEFAULT now | — |

Índices: `(tenant_id, created_at)`, `(provider, created_at)`, `(created_at)`.
Portabilidade: em Postgres use `NUMERIC(12,6)`; em Mongo, um documento; em NoSQL, particione
por data. O essencial é **um evento por chamada**, com as dimensões acima.

### `llm_usage_settings` — key/value de configuração e cache

`setting_key VARCHAR(60) PK`, `setting_value TEXT NULL`, `updated_at`. Upsert idempotente
(`ON DUPLICATE KEY UPDATE` / `INSERT … ON CONFLICT`). Guarda:
- `anthropic_credits_usd` — créditos comprados, informados pelo gestor (base do saldo).
- `anthropic_credits_ref_date` — data `YYYY-MM-DD` a partir da qual o gasto é descontado.
- `usd_brl_rate` (ou sua moeda local) — cotação opcional para exibir equivalente.
- `anthropic_cost_cache_<data>` — cache JSON `{ts, amount}` (TTL ~1h) do custo real da Admin API.

No Memora o schema é criado on-demand (`CREATE TABLE IF NOT EXISTS` numa função guardada por
`static $done`, chamada no início de toda operação de log/leitura). Simples, mas sem `ALTER`
automático — se seu projeto já tem migrations versionadas, prefira-as.

## 2. Tabela de preços versionada (no código, não no banco)

Um mapa `prefixo_de_modelo → [preço_input_por_1M, preço_output_por_1M]` em USD. Mantido no
código para virar diff/PR quando os provedores mudam preço. Referência atual do Memora
(`memoraLlmUsagePriceTable`):

```
gemini-2.5-flash-lite   [0.10,  0.40]
gemini-3.1-flash-lite   [0.25,  1.50]
claude-haiku-4-5        [1.00,  5.00]
claude-sonnet-5         [2.00, 10.00]   # PREÇO INTRODUTÓRIO até 2026-08-31; depois [3.00, 15.00]
claude-opus             [5.00, 25.00]
llama / meta-llama      [0.00,  0.00]   # Groq tier gratuito = custo zero
```

Regras:
- Casamento por **prefixo** (`starts_with(lowercase(model), prefix)`); o primeiro que bate
  vence — a ordem importa se houver prefixos ambíguos.
- Modelo desconhecido = custo **0** (nunca lança). Isso **subestima** o gasto de um modelo
  novo até você adicioná-lo à tabela.
- Marque preços introdutórios/temporários com a data de expiração **em comentário** — a troca
  é manual e é a fonte de erro mais comum.

## 3. Normalização de tokens (dois dialetos de API)

Antes de precificar, normalize o bloco `usage` cru de qualquer provedor para `{input, output}`:

- **Input** = `input_tokens` (Anthropic) **ou** `prompt_tokens` (OpenAI-compatível/Groq/Gemini),
  **somando** `cache_read_input_tokens` + `cache_creation_input_tokens` quando presentes (os
  tokens de cache da Anthropic contam como input).
- **Output** = `output_tokens` **ou** `completion_tokens`.
- Clampe em `>= 0`; bloco ausente/não-array = `{0, 0}`.

> Nuance: essa soma simplificada trata cache-read e cache-creation como input normal. Se um
> provedor precifica cache-read mais barato, o custo desse componente fica levemente
> super/subestimado — aceitável para telemetria, documente se precisar de precisão fiscal.

## 4. Fórmula de custo

```
custo_usd = (input_tokens * preçoInputPor1M + output_tokens * preçoOutputPor1M) / 1_000_000
```

Só calcule custo **se a chamada teve sucesso** (`ok=true`); falha grava `cost_usd = 0`.

## 5. O wrapper de instrumentação (`logUsage`) — à prova de falha

Assinatura portátil:

```
logUsage(tenantId, {
  provider, model,
  tier?,            // opcional: rótulo de roteamento
  feature,          // "agente_whatsapp", "blog_geracao"… obrigatório
  context_id?,      // "conv_123", "pauta_45"… opcional
  ok,               // bool
  usage             // bloco cru do provedor
}) -> bool          // true se gravou; NUNCA lança
```

Passos internos (na ordem):
1. Garante schema (se on-demand).
2. Normaliza `usage` → `{input, output}` (seção 3).
3. Calcula custo **só se `ok`** (seção 4); senão `0`.
4. **Trunca** cada string ao tamanho da coluna (model 120, provider 30, tier 30, feature 60,
   context_id 60) — defensivo contra estouro de VARCHAR.
5. INSERT.
6. **Tudo dentro de try/catch** que só faz `error_log` e retorna false. Nunca propaga exceção.

Regra de ouro: **telemetria não pode derrubar o produto.** Além do try/catch interno, todo
chamador envolve `logUsage` no seu próprio try/catch, com o comentário "o log de uso nunca
quebra a feature".

## 6. Onde instrumentar (uma chamada por tentativa)

Chame `logUsage` **em cada tentativa de LLM**:
- **`ok=true`** uma vez, no sucesso.
- **`ok=false`** uma vez para **cada provedor que falhou** numa cadeia de fallback.

Assim, uma cadeia de 3 provedores onde os 2 primeiros falham grava 3 linhas: duas `ok=0`
(custo 0) e uma `ok=1` (com custo). `SUM(ok=0)` vira a taxa de fallback/confiabilidade por
provedor.

No Memora, o ponto quente é o percorrer da cadeia (`whatsapp_ai_agent_llm_reply_via_chain` em
`adm/whatsapp/backend/ai_training.php`): um closure `$logUsage` é chamado com `ok=true` no
provedor que respondeu e `ok=false` a cada provedor que caiu. O chamador (o agente, em
`agent_responder.php`) passa o contexto do log: `{pdo, tenant_id, feature:'agente_whatsapp',
context_id:'conv_'+conversationId}`.

### Pontos instrumentados hoje na referência (para dimensionar cobertura)

| `feature` | Origem | Observação |
|---|---|---|
| `agente_whatsapp` | Agente autônomo (clientes reais) | com `tier` e `context_id`=conversa |
| `agente_teste` | Chat de treinamento do agente | mesma cadeia, **feature separada** para não cobrar teste como uso real |
| `lead_classificacao` | Classificação de leads | provider fixo (Groq) |
| `followup_ia` | Geração de follow-up | — |
| `categoria_conta` | Categorização financeira | — |
| `blog_geracao` | Gerador de artigos | `tenant_id=0`, `context_id='pauta_'+id`, provider/model variam na rotação |

Todos usam o **mesmo shape** de `entry` e o **mesmo padrão try/catch**. Padronizar isso é o que
torna o painel confiável — um caller esquecido = buraco silencioso na medição.

## 7. Contratos portáteis (resumo)

```
normalizeTokens(usageBruto)                 -> {input:int, output:int}
estimateCostUsd(model, input, output)       -> float          // 0 se prefixo não casar
logUsage(tenantId, entry)                   -> bool           // nunca lança
totals(from, to)                            -> {calls, failed_calls, tokens_in, tokens_out, cost_usd, by_provider}
byTenant / byProvider / byModel / byFeature / daily(from, to) -> agregações
```

Filtro de janela em todas as agregações: `created_at >= from 00:00:00 AND < (to + 1 dia)`
(inclusivo no fim). Métricas derivadas: taxa de falha = `failed_calls / calls`; projeção
mensal = `custo / dias * 30`; custo por conversa = `custo(feature agente) / COUNT(DISTINCT
context_id)`. O saldo e o painel estão em [painel-e-saldo.md](painel-e-saldo.md).
