# Roteamento multi-provedor de LLM

Por que existe: um agente que usa **um só provedor gratuito** (ex.: Groq/Llama) estoura o
limite de tokens por dia (TPD ~100K) e fica sem raciocínio nos momentos que exigem. A solução é
um **roteador por função (tier)** que escolhe um provedor/modelo diferente conforme o *momento
da conversa*, com uma **cadeia de fallback que SEMPRE termina no provedor-piso**.

O ganho decisivo: **deploy seguro do código antes de provisionar as chaves premium** — sem as
chaves novas, cada tier degrada para o piso e o comportamento é idêntico ao antigo.

Referência: `includes/LlmRouter.php`, `includes/AnthropicClient.php`, `includes/GroqClient.php`;
seleção em `whatsapp_ai_agent_select_tier()` (`ai_training.php`).

## Três peças desacopladas

### 1. Registry de provedores (dados, não código)

Um mapa `provider → { clientType, apiKeyEnv, apiUrlEnv, defaultUrl }`. `clientType` distingue
famílias de wire-protocol:
- **openai-compat** (Chat Completions): OpenAI, Groq, Gemini (endpoint OpenAI-compat do Google
  `.../v1beta/openai/chat/completions`), DeepSeek, MiniMax — **todos reusam o mesmo cliente**,
  só mudando `api_url`/`api_key`.
- **anthropic** (Messages API): cliente próprio.

Adicionar um provedor novo = **uma entrada no registry + uma chave no ambiente**, sem tocar no
código do agente. `providerConfigured(p)` = a chave está preenchida.

### 2. Spec de tier no formato `provider:model`

Cada tier é uma variável de ambiente. Referência do Memora:

| Tier | Env (default) | Quando |
|---|---|---|
| `standard` | `LLM_AGENT_STANDARD=gemini:gemini-2.5-flash-lite` | Saudação, coleta de dados, conversa leve (barato/rápido) |
| `commercial` | `LLM_AGENT_COMMERCIAL=anthropic:claude-haiku-4-5` | Apresentar/vender pacote (dados completos + catálogo) |
| `negotiation` | `LLM_AGENT_NEGOTIATION=anthropic:claude-sonnet-5` | Objeção/negociação (modelo forte, raciocínio) |

Parse: split no primeiro `:`; valida o provider contra o registry; retorna null se
malformado/desconhecido → o tier vira só fallback.

### 3. Seleção DETERMINÍSTICA do tier (código puro, NÃO a LLM)

`selectTier(classification, facts, context, lastUserMsg, history) → tier`:
1. Deriva `priceShown` = **alguma mensagem OUTBOUND contém o marcador de preço** (literal `R$`).
   Heurística de string, não semântica.
2. **Objeção → `negotiation`.** `detectObjection(text, priceShown)`:
   - Sinais **FORTES** (regex) **sempre** escalam, independente de preço: "caro", "desconto",
     "mais barato/em conta", "orçamento apertado", "outro fotógrafo cobra", "salgado",
     "negociar", "chorar um desconto"…
   - Sinais **FRACOS** ("vou pensar", "depois te falo", "vou falar com meu/minha…") **só escalam
     se `priceShown`** — "vou pensar" antes de ver preço é dúvida inicial, não objeção.
   - Normalize o texto (minúsculas, sem acento) antes das regex.
3. Senão, se intenção comercial **E** não faltam campos de disponibilidade **E** há pacotes no
   catálogo → `commercial`.
4. Caso contrário → `standard`.

Manter isso determinístico dá **previsibilidade de custo** e evita gastar o modelo caro cedo.

## A cadeia de fallback (sempre termina no piso)

`buildChain(tier) → [{provider, model, client}, …]`:
1. Se a spec do tier tem chave configurada, é a **1ª tentativa**.
2. **SEMPRE anexe o provedor-piso** confiável/barato (no Memora, `groq:GROQ_MODEL_AGENT`, default
   `llama-3.3-70b-versatile`) como última entrada, deduplicando.

Sem chaves premium, a cadeia inteira de todos os tiers vira `[piso]` = comportamento legado.

`runChain(chain, prompt)`: itera; a **primeira resposta ok + não-vazia vence** (normaliza UTF-8,
trunca ~4000 chars); **cada tentativa (sucesso E falha) registra uso** (ver skill
[`medidor-uso-ia`](../../medidor-uso-ia)); falhas logam e seguem para o próximo; cadeia esgotada
= erro gracioso. **Nunca lança em fluxo de negócio.**

## Clientes por família de wire-protocol (superfície comum)

Todos expõem o MESMO contrato — `chat(messages, opts)`, `chatWithRedaction(messages, known,
opts)`, `isConfigured()`, `lastError()` → `{ok, content, usage, model, httpCode, error}`. As
diferenças ficam **encapsuladas**:

**OpenAI-compat:** header `Authorization: Bearer`; `messages` inclui o system; resposta em
`choices[0].message.content`; aceita `temperature`/`response_format`/`tools`.

**Anthropic (Messages API) — as pegadinhas que quebram integração:**
- Endpoint `POST /v1/messages`; headers `x-api-key` + `anthropic-version: 2023-06-01` (NÃO
  `Authorization: Bearer`).
- A mensagem `system` vai num **campo top-level `system`** (concatenado), **fora** de `messages`.
- `messages` deve **começar com `user`** (injete um placeholder se começar com assistant;
  `(sem mensagem)` se vazio).
- Resposta em `content[]` (blocks) — concatene os `type=text`.
- `max_tokens` é **obrigatório**.
- **NUNCA envie `temperature`** — o Claude Sonnet 5 rejeita valores não-default (HTTP 400); o
  cliente aceita `temperature` nos opts e **ignora**.
- **`thinking:{type:disabled}` só nos modelos que suportam** (no Memora, só `claude-sonnet-5`, que
  roda adaptive thinking por omissão — desligue para resposta curta de WhatsApp).
- **`stop_reason=refusal`** (classificador de segurança recusou) → trate como **falha** (`ok=false`)
  de propósito, para o chamador cair no próximo provedor.
- Retry com backoff exponencial em erro de conexão, **429**, **529** (overloaded) e ≥500.
- Implementado em **cURL puro, sem SDK** — decisão porque o deploy é por FTP, sem build/composer.

## Redação de PII (obrigatória)

`chatWithRedaction(prompt, known, opts)` **redige PII antes de qualquer envio externo** e
re-hidrata na volta. No agente, `known = [CLIENTE, TELEFONE]`. Se há dados pessoais no prompt,
portar isso não é opcional.

## Resiliência a deploy parcial

Se o arquivo do roteador não estiver deployado, o ponto de entrada cai num **caminho legado**:
provedor-piso direto (Groq, `temperature 0.3`, `max_tokens 320`). Sem a chave do piso, retorna
uma **resposta segura local** (fallback determinístico), nunca um erro cru ao cliente.

## Chaves de ambiente (referência)

`LLM_AGENT_STANDARD` / `LLM_AGENT_COMMERCIAL` / `LLM_AGENT_NEGOTIATION` (specs `provider:model`);
`GROQ_API_KEY` / `GROQ_MODEL_AGENT` (piso); `GEMINI_API_KEY`; `ANTHROPIC_API_KEY` /
`ANTHROPIC_MODEL` / `ANTHROPIC_MAX_TOKENS`; e por provedor extra `OPENAI_API_KEY`,
`DEEPSEEK_API_KEY`, `MINIMAX_API_KEY`. Ver [prompt-vendedor-consultivo.md](prompt-vendedor-consultivo.md)
para como o tier escolhido entra na chamada, e a skill [`medidor-uso-ia`](../../medidor-uso-ia)
para o log de uso/custo de cada tentativa.

## Princípios transversais

Degradação graciosa (nunca exceção em produção); a LLM sugere e o chamador valida; redação de
PII antes de todo envio externo; e um **log de uso por tenant/provider/model/tier/feature** com
estimativa de custo (a skill separada).
