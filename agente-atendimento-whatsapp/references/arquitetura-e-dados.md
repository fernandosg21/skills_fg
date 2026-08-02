# Arquitetura e modelo de dados

Visão de conjunto do agente autônomo de atendimento e o modelo de dados que o sustenta.
Referência histórica: `adm/whatsapp/` no Memora. Em produto multi-tenant, `tenant_id` participa de
toda chave, query e escopo; em produto single-tenant, preserve o mesmo ownership explícito para não
misturar conta, número e instância.

## O princípio-mestre

> **O LLM conduz e encanta; o código detém tudo que envolve dinheiro, compromisso e
> disponibilidade.** O modelo é livre para conversar; os momentos de risco (consultar agenda,
> fechar venda, falar de preço/parcelamento) são interceptados por código determinístico
> ANTES e/ou DEPOIS da chamada ao modelo.

Todo o resto da skill deriva disso.

## Fluxo ponta a ponta (uma mensagem do cliente)

```
Provedor de WhatsApp (Evolution/Meta)
        │  POST webhook
        ▼
[1] Webhook: limita corpo → autentica antes do banco de negócio → persiste evento idempotente → ACK
        │  (só então processa, com o cliente já liberado)
        ▼
[2] Ingestão: upsert idempotente da mensagem (ID escopado por provedor+conta)
        │  marca inbound, persiste fatos permitidos; dispara o responder
        ▼
[3] Responder autônomo (ver travas-e-guardas.md):
        modo/entitlement/consentimento → gate(grupo/opt-out/blocklist/pausa/horário) → pedido-humano →
        lock por inbound → é-a-última? → idempotência → limites → saúde-da-conexão →
        histórico → intenção/fatos(+memória durável) → fechamento? →
        [4] seleção de tier → [5] cadeia LLM → sanitiza → follow-through →
        re-checa todos os gates → lock curto de entrega → [6] outbox/envio →
        atualiza memória derivada do outbound entregue → [7] audita decisão
        ▼
[8] Eco do provedor volta → reconcilia outbox/ID → adoção anti-falso-takeover
```

Cada número acima é um subsistema com sua própria reference:
- **[1][2][6][8]** ingestão, envio, anti-eco, agendamento → [ingestao-anti-eco-e-agendamento.md](ingestao-anti-eco-e-agendamento.md)
- **[3]** as travas de segurança → [travas-e-guardas.md](travas-e-guardas.md)
- memória durável (fatos/perguntas) → [memoria-duravel.md](memoria-duravel.md)
- **[4][5]** roteamento de modelo → [roteamento-llm.md](roteamento-llm.md)
- prompt, estilos, guardrails, fechamento → [prompt-vendedor-consultivo.md](prompt-vendedor-consultivo.md)
- **[7]** + painel de controle e testes → [painel-observabilidade-e-testes.md](painel-observabilidade-e-testes.md)

## Componentes (mapa Memora → papel portátil)

| Papel portátil | Arquivo de referência (Memora) |
|---|---|
| Endpoint de webhook (ACK rápido) | `adm/whatsapp/api/webhook.php` |
| Ingestão idempotente + anti-eco + gancho do agente | `adm/whatsapp/backend/processor.php` |
| Envio/outbox (marcador de origem e reconciliação) | `adm/whatsapp/backend/direct_send.php` + camada de outbox do projeto |
| **Responder autônomo (as travas)** | `adm/whatsapp/backend/agent_responder.php` |
| Memória durável por conversa | `adm/whatsapp/backend/agent_memory.php` |
| Prompt, estilos, guardrails, fechamento, gate, pausas, blocklist | `adm/whatsapp/backend/ai_training.php` |
| Extração determinística de fatos/intenção | `adm/whatsapp/backend/intent_classifier.php` |
| Roteador multi-LLM + clientes de provedor | `includes/LlmRouter.php`, `includes/AnthropicClient.php`, `includes/GroqClient.php` |
| Fila de mensagens agendadas (dispatcher monitorado) | `adm/whatsapp/backend/scheduled_messages.php` |
| Schema legado versionado | `adm/whatsapp/backend/schema.php` |
| Painel de controle/observabilidade | `adm/whatsapp/treinamento-ia.php` + `adm/whatsapp/api/ai_training.php` |
| Medição de uso/custo de IA | `includes/llm_usage.php` (skill separada [`medidor-uso-ia`](../../medidor-uso-ia)) |
| Segurança, privacidade e retenção | [seguranca-privacidade-e-governanca.md](seguranca-privacidade-e-governanca.md) |
| Confiabilidade e go-live | [confiabilidade-envio-e-go-live.md](confiabilidade-envio-e-go-live.md) |

## Modelo de dados (agregados mínimos, agnósticos de banco)

Modele os agregados abaixo, todos isolados por `tenant_id`. Vale para SQL, NoSQL ou documento.

### 1. ChannelAccount / Integration

Vínculo entre tenant, número/instância e provedor: estado local, ID técnico, identidade, saúde do
webhook e referência ao segredo seguro. Desconectar aplica kill-switch local primeiro; conectar só
vira saudável depois de registrar/verificar o webhook.

### 2. WebhookEvent (envelope operacional)

`provider`, `channel_account_id`, `event_key`, `event_type`, `conversation_key_hint`,
`provider_sequence`, `occurred_at`, `signature_valid`, `status`, `attempts`, `next_retry_at`,
`processing_token`, `normalized_event_ref` mínimo/cifrado, timestamps e envelope bruto opcional. Unique por
`(tenant, provider, channel_account_id, event_key)`. O payload bruto nasce desligado e é apagado após processamento
quando a política assim determina. O evento normalizado preserva somente os campos necessários para
processar exatamente aquele `event_id`, sem depender novamente do body HTTP.

### 3. Conversation (linha-mestra de estado)
Chave natural = (tenant, telefone-do-negócio, contato). Índice de listagem por
(tenant, status, última-atividade). Colunas do agente:

| Coluna | Papel |
|---|---|
| `agent_paused` (bool) | Agente em silêncio nesta conversa |
| `agent_paused_at` (datetime) | Quando pausou (base do cálculo de expiração) |
| `agent_paused_reason` (enum) | `human_takeover` \| `customer_requested_human` \| `critical_handoff` \| `policy_or_incident` |
| `agent_memory_json` (documento) | **Memória durável** (fatos + perguntas + contadores) |
| `receiver_health_status` (string) | Saúde da conexão do canal (`disconnected` bloqueia antes do LLM) |

### 4. Message e Receipt
`provider_message_id`, `provider`, `channel_account_id`, `direction`, `type`, `text`, `source`,
`origin_inbound_id`, `outbox_id`, referências de mídia, `status` e timestamps. Unicidade por
`(tenant, provider, channel_account_id, provider_message_id)`. Criar índice por tenant/conta/data
para métricas e quota.

`source` (`customer`, `agent`, `human`, `human_external`, `scheduled`, `campaign`, `system`,
`provider_echo`) é
**load-bearing**: alimenta limite, painel e anti-eco. Preferir coluna própria e proteger a primeira
gravação local contra o eco. Modelar receipt/status técnico separadamente: ele atualiza entrega,
mas não vira turno, não muda última inbound nem representa atividade humana.

### 5. ProcessingLedger / AgentRun (canônico)

Guardar uma linha única por evento/inbound com estado `pending|processing|retry|completed|dead`,
lease/fencing token, tentativa e resultado terminal. Este ledger recuperável, junto da inbox/outbox,
é a fonte da idempotência operacional. Separar `run/attempt` de `terminal_outcome` para que retries
não criem dois resultados lógicos.

### 6. AgentDecision (append-only, observabilidade)
`(tenant, conversation, message, run_id, decision, reason, detail_safe, outbox_id, model_used,
llm_ok, created_at)`. Pode ser best-effort porque não é a fonte de recuperação. Não armazenar prompt,
erro bruto nem corpo a reenviar; referenciar outbox/mensagem. Aplicar retenção definida.

### 7. AgentProfile / ModuleSettings (1 por tenant)
`agent_mode` (`off|shadow|autonomous`), estilo (`style_preset`/`emoji_usage`/`sales_drive`),
blocklist/suppression, horário/fuso e os blocos permitidos do perfil. Flags legadas como
`autonomous_enabled`/`require_approval` são derivadas e migradas, nunca autoridade concorrente.
Uma política de confiança só existe se tiver comportamento, métrica e fallback definidos.
Detalhes em [prompt-vendedor-consultivo.md](prompt-vendedor-consultivo.md).

Settings guardam `module_enabled`, modo, entitlement resolvido, horário/fuso, retenção,
`store_raw_payload` e saúde operacional. `CrmAction` guarda tarefas humanas deduplicadas por
conversa/origem.

### 8. Outbox

Intenção de entrega persistida antes do provedor: origem, chave idempotente, destino/corpo por
referência segura, estado, claim token, tentativas, provider ID, fingerprints e timestamps. Unique
por `(tenant, channel_account_id, idempotency_key)`. Ver
[confiabilidade-envio-e-go-live.md](confiabilidade-envio-e-go-live.md).

### 9. ScheduledMessage / DeadLetter

Agenda, aprovação, cancelamento, claim/token e referência à outbox. Uma dead-letter explícita
recebe falhas permanentes; não deixar retry infinito nem esconder erro terminal como pendência.

## Esquema idempotente (regras)

Prefira o migrador nativo do projeto. Em runtime legado, use migração versionada: o caminho
instalado deve pagar uma leitura leve de versão, não dezenas de
`ALTER` que falham a cada request. Princípios portáteis:

- Guardar versão/contrato instalado e usar lock de migração com dupla checagem.
- Checar colunas/índices uma vez por tabela com cache por request; nunca executar `ADD COLUMN` cego
  em loop nem `MODIFY` incondicional.
- Aplicar colunas antes dos índices, backfills obrigatórios e validação final do contrato. Só marcar
  a versão depois de tudo existir; falha deixa a migração pendente para retry.
- Introspecção de schema pelo catálogo padrão (`INFORMATION_SCHEMA`/equivalente) **com
  parâmetros vinculados** — não por comandos tipo `SHOW`/`DESCRIBE`, que podem não aceitar
  placeholders na versão de produção. (Ver a cicatriz do MySQL 5.7 em
  [painel-observabilidade-e-testes.md](painel-observabilidade-e-testes.md).)
- Rodar setup **fora de qualquer transação**. Em muitos bancos DDL faz commit implícito. Nunca chamar
  `ensureSchema` dentro de envio/fila/transação externa.

Com o modelo de dados no lugar, a peça mais delicada são as travas do responder:
siga [travas-e-guardas.md](travas-e-guardas.md).
