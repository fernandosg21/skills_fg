# Roteamento multi-provedor de LLM

Por que existe: um agente que usa **um só provedor** concentra indisponibilidade, quota, custo e
latência. A solução é
um **roteador por função (tier)** que escolhe um provedor/modelo diferente conforme o risco e o
momento da conversa, com fallback somente enquanto houver orçamento global.

Sem provedor apto ou sem tempo restante, retorne falha segura/resultado local e mantenha outbound em
shadow quando necessário. Não caia silenciosamente num caminho legado sem os mesmos guardrails.

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

Cada tier é configuração, não código. Exemplo histórico da implementação de referência (verificar
modelos/capacidades atuais na documentação oficial antes de usar):

| Tier | Env (default) | Quando |
|---|---|---|
| `standard` | `LLM_AGENT_STANDARD=gemini:gemini-2.5-flash-lite` | Saudação, coleta de dados, conversa leve (barato/rápido) |
| `commercial` | `LLM_AGENT_COMMERCIAL=anthropic:claude-haiku-4-5` | Apresentar/vender pacote (dados completos + catálogo) |
| `negotiation` | `LLM_AGENT_NEGOTIATION=anthropic:claude-sonnet-5` | Objeção/negociação (modelo forte, raciocínio) |

Parse: split no primeiro `:`; valida o provider contra o registry; retorna null se
malformado/desconhecido → o tier vira só fallback.

### 3. Seleção DETERMINÍSTICA do tier (código puro, NÃO a LLM)

`selectTier(classification, facts, context, lastUserMsg, history) → tier`:

1. Derive por metadado canônico se preço/oferta foi realmente entregue; não procure apenas símbolo
   de moeda no texto.
2. Escale objeção/negociação detectada por classificador determinístico e `LocaleAdapter`.
   Sinais fortes e fracos dependem do idioma/domínio; os fracos só escalam quando houve oferta.
3. Use tier comercial quando os fatos mínimos e o catálogo canônico necessários estiverem presentes.
4. Caso contrário, use tier padrão ou resposta local.

No caso histórico pt-BR, regex de “caro”, “desconto”, “mais em conta” e “vou pensar” ajudaram, mas
não são regra universal. Normalize texto de modo determinístico e teste gírias do locale alvo.

Manter isso determinístico dá **previsibilidade de custo** e evita gastar o modelo caro cedo.

## A cadeia de fallback (termina no piso se houver tempo)

`buildChain(tier) → [{provider, model, client}, …]`:
1. Se a spec do tier tem chave configurada, é a **1ª tentativa**.
2. Anexar o provedor-piso confiável/barato como última entrada, deduplicando, desde que caiba no
   deadline global.

Sem chave premium, use o piso somente se ele estiver configurado, aprovado para a finalidade e
couber no deadline. Caso contrário, falhe de forma segura.

`runChain(chain, prompt)`: iterar dentro do orçamento restante; a primeira resposta HTTP válida,
não-vazia **e convertida em resultado seguro** vence. Normalizar UTF-8 e aplicar o teto da chamada;
**cada tentativa (sucesso e falha) registra uso** (ver skill
[`medidor-uso-ia`](../../medidor-uso-ia)); falhas logam e seguem para o próximo; cadeia esgotada
= erro gracioso. **Nunca lança em fluxo de negócio.**

## Deadline global, circuit breaker e saída válida

- Definir um deadline para a resposta inteira. Timeout/retry é por provedor; sem teto global, três
  fallbacks somam latência e a resposta chega fora de contexto.
- Não iniciar tentativa que não caiba no tempo restante. Usar circuit breaker por
  `feature+provider`, com cooldown e probe controlado.
- Permitir uma geração lógica por request. Retry de formatação cabe na mesma política e nunca vira
  loop/segunda rodada ilimitada.
- Em extração/JSON determinístico, desligar reasoning quando suportado. Em alguns modelos,
  `max_tokens` cobre raciocínio + resposta; dimensionar o pior caso.
- Ler `finish_reason`/equivalente. `length`, recusa, JSON truncado ou parse inválido são falha e
  liberam fallback. Sucesso HTTP com conteúdo inútil não encerra a cadeia.
- Parsear em função pura e testável, tolerante apenas a cercas/texto periférico esperados; aplicar
  whitelist/caps antes de persistir.

## Clientes por família de wire-protocol (superfície comum)

Todos expõem o MESMO contrato — `chat(messages, opts)`, `chatWithRedaction(messages, known,
opts)`, `isConfigured()`, `lastError()` → `{ok, content, usage, model, httpCode, error}`. As
diferenças ficam **encapsuladas**:

**OpenAI-compat:** costuma usar bearer token, `messages` e `choices`, mas capacidades como
`temperature`, structured output, tools e reasoning variam por provedor/modelo. Modele-as no
registry e verifique a documentação oficial atual antes de enviar parâmetros.

**Família Messages/Anthropic:** system, turnos, blocos de conteúdo, headers, parâmetros e motivos de
parada diferem de Chat Completions. Encapsule no adapter; não copie opções de outra família. Trate
recusa, truncamento e conteúdo não parseável como tentativa sem resultado. Parâmetros de
thinking/reasoning entram por capability do registry. Se um parâmetro opcional não suportado receber
400 imediato, no máximo uma repetição sem ele, somente se couber no deadline. As decisões cURL/sem
SDK do Memora são adaptação de deploy FTP, não regra portátil.

## Redação de PII (obrigatória)

`chatWithRedaction(prompt, known, opts)` redige PII antes de qualquer envio externo e re-hidrata
na volta. `known` inclui entidades já conhecidas do contexto. Isso reduz exposição, mas não garante
anonimização de nome/endereço livre sem NER; minimizar o prompt e testar falsos negativos.

Em produção, logs guardam apenas provider/model/feature/tier, latência, tokens allowlisted,
categoria/classe, bytes, finish reason seguro e fingerprint. Prompt, resposta e erro bruto só em
ambiente local/desenvolvimento com debug e flag própria do provedor.

## Resiliência a deploy parcial

Ausência de roteador, política, redator, parser ou grounder crítico deve manter o agente em shadow
ou produzir resposta local determinística, nunca acionar automaticamente um responder legado menos
seguro. Use feature detection, health check e deploy atômico/compatível; alerte o operador.

## Chaves de ambiente (exemplo, não contrato fixo)

`LLM_AGENT_STANDARD` / `LLM_AGENT_COMMERCIAL` / `LLM_AGENT_NEGOTIATION` (specs `provider:model`);
`GROQ_API_KEY` / `GROQ_MODEL_AGENT` (piso); `GEMINI_API_KEY`; `ANTHROPIC_API_KEY` /
`ANTHROPIC_MODEL` / `ANTHROPIC_MAX_TOKENS`; e por provedor extra `OPENAI_API_KEY`,
`DEEPSEEK_API_KEY`, `MINIMAX_API_KEY`. Ver [prompt-vendedor-consultivo.md](prompt-vendedor-consultivo.md)
para como o tier escolhido entra na chamada, e a skill [`medidor-uso-ia`](../../medidor-uso-ia)
para telemetria detalhada quando instalada. A skill funciona sem ela se o projeto registrar o
contrato mínimo de métricas descrito no arquivo principal.

## Princípios transversais

Degradação graciosa (nunca exceção em produção); a LLM sugere e o chamador valida; redação de
PII antes de todo envio externo; e um **log de uso por tenant/provider/model/tier/feature** com
estimativa de custo (a skill separada).
