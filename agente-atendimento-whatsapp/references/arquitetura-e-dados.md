# Arquitetura e modelo de dados

Visão de conjunto do agente autônomo de atendimento e o modelo de dados que o sustenta.
Referência: `adm/whatsapp/` no Memora (`a:\Site Fotografia\Memora.fot.br`). Tudo é
**multi-tenant**: `tenant_id` participa de toda chave, query e escopo.

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
[1] Webhook: autentica (fail-closed) → persiste evento (idempotente) → ACK 200 IMEDIATO
        │  (só então processa, com o cliente já liberado)
        ▼
[2] Ingestão: upsert idempotente da mensagem (dedup por id do provedor)
        │  marca inbound; dispara o responder
        ▼
[3] Responder autônomo (as ~20 travas — ver travas-e-guardas.md):
        opt-in → gate(grupo/blocklist/pausa) → pedido-humano → LOCK →
        é-a-última? → idempotência → limites(dia/hora) → saúde-da-conexão →
        histórico → intenção/fatos(+memória durável) → fechamento? →
        [4] seleção de tier → [5] cadeia LLM → sanitiza → follow-through →
        re-checa corrida → [6] envio direto (source=ai_agent, pause_agent=false) →
        atualiza memória → [7] audita decisão
        ▼
[8] Eco do provedor (fromMe) volta segundos depois → adoção/guarda anti-falso-takeover
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
| Envio de mensagem (marcador de origem) | `adm/whatsapp/backend/direct_send.php` |
| **Responder autônomo (as travas)** | `adm/whatsapp/backend/agent_responder.php` |
| Memória durável por conversa | `adm/whatsapp/backend/agent_memory.php` |
| Prompt, estilos, guardrails, fechamento, gate, pausas, blocklist | `adm/whatsapp/backend/ai_training.php` |
| Extração determinística de fatos/intenção | `adm/whatsapp/backend/intent_classifier.php` |
| Roteador multi-LLM + clientes de provedor | `includes/LlmRouter.php`, `includes/AnthropicClient.php`, `includes/GroqClient.php` |
| Fila de mensagens agendadas (cron-independente) | `adm/whatsapp/backend/scheduled_messages.php` |
| Schema idempotente | `adm/whatsapp/backend/schema.php` |
| Painel de controle/observabilidade | `adm/whatsapp/treinamento-ia.php` + `adm/whatsapp/api/ai_training.php` |
| Medição de uso/custo de IA | `includes/llm_usage.php` (skill separada [`medidor-uso-ia`](../../medidor-uso-ia)) |

## Modelo de dados (5 entidades lógicas, agnósticas de banco)

Pense em cinco agregados, todos isolados por `tenant_id`. Vale para SQL, NoSQL ou documento.

### 1. Conversation (linha-mestra de estado)
Chave natural = (tenant, telefone-do-negócio, contato). Índice de listagem por
(tenant, status, última-atividade). Colunas do agente:

| Coluna | Papel |
|---|---|
| `agent_paused` (bool) | Agente em silêncio nesta conversa |
| `agent_paused_at` (datetime) | Quando pausou (base do cálculo de expiração) |
| `agent_paused_reason` (enum) | `human_takeover` \| `cliente_pediu_humano` \| `cliente_quer_fechar` |
| `agent_memory_json` (documento) | **Memória durável** (fatos + perguntas + contadores) |
| `receiver_health_status` (string) | Saúde da conexão do canal (`disconnected` bloqueia antes do LLM) |

### 2. Message
`provider_message_id` (dedup), `direction` (inbound/outbound), `type`, `text`, `raw_payload`
(documento com o marcador **`source`**), `status`, timestamps por transição. Unicidade por
(tenant, provider_message_id). **Crie de propósito um índice `(tenant, sent_at)`** — o
rate-limit por tenant/hora do responder consulta os outbound recentes.

O campo `payload_json.source` (`ai_agent` / `direct_reply`) é **load-bearing**: alimenta o
limite horário do tenant, o painel de "clientes atendidos" e a detecção de eco. Protegido
contra sobrescrita pelo eco (ver [ingestao-anti-eco-e-agendamento.md](ingestao-anti-eco-e-agendamento.md)).

### 3. AgentDecision (append-only, auditoria)
`(tenant, conversation, message, decision('sent'|'skipped'), reason, detail, reply_text,
model_used, llm_ok, created_at)`. **Toda inbound processada grava exatamente uma linha.**
Índices `(tenant, created_at)` e `(tenant, conversation, id)`. Retenção ~30 dias amostrada.

### 4. AgentProfile (1 por tenant)
`agent_mode` (off/shadow/autonomous), `autonomous_enabled`, `require_approval`,
`confidence_threshold`, estilo (`style_preset`/`emoji_usage`/`sales_drive`),
`agent_blocklist_json`, `agent_resume_hours`, e os blocos de texto do prompt
(`business_summary`, `tone_guidelines`, `services_catalog`, `pricing_guidelines`,
`availability_rules`, `handoff_rules`, `autonomy_policy`, `forbidden_topics`,
`knowledge_notes`). Detalhes em [prompt-vendedor-consultivo.md](prompt-vendedor-consultivo.md).

### 5. ModuleSettings / CrmAction
Flags de segurança por tenant (`module_enabled`, `shadow_mode`, `verify_signature`,
`last_scheduled_dispatch_at`…) e a fila de ações pendentes para a equipe (ex.: `fechar_venda`
com `preview_json`, deduplicada por conversa).

## Esquema idempotente (regras)

No Memora todo o DDL vive numa função única (`whatsapp_ensure_schema`) guardada por um flag
de "já rodou neste processo": `CREATE TABLE IF NOT EXISTS` + migrações incrementais
(`ADD COLUMN`/índice tolerantes a falha) + troca de índices únicos globais legados por
**índices únicos por tenant**. Princípios portáteis:
- Toda migração checa existência antes e tolera falha sem derrubar a requisição; **a ordem
  importa** (colunas antes dos índices que as usam).
- Introspecção de schema pelo catálogo padrão (`INFORMATION_SCHEMA`/equivalente) **com
  parâmetros vinculados** — não por comandos tipo `SHOW`/`DESCRIBE`, que podem não aceitar
  placeholders na versão de produção. (Ver a cicatriz do MySQL 5.7 em
  [painel-observabilidade-e-testes.md](painel-observabilidade-e-testes.md).)
- Rode o setup de schema **fora de qualquer transação** — em muitos bancos DDL faz commit
  implícito e não é revertido por rollback.

Com o modelo de dados no lugar, a peça mais delicada são as travas do responder:
siga [travas-e-guardas.md](travas-e-guardas.md).
