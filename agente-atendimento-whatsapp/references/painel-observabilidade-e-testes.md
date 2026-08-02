# Painel, observabilidade e testes

Use esta referência para operar o agente sem transformar o dashboard em worker nem o log em banco
de mensagens. A interface mostra o mesmo estado que o runtime usa; a recuperação vive em
inbox/ledger/outbox, não em auditoria best-effort.

## 1. Estado efetivo com blockers

Exponha um único modo canônico:

```text
off         -> desligado
shadow      -> observa/sugere, nunca envia
autonomous  -> pode enviar se todos os gates atuais permitirem
```

Mapeie `learn_only`, `aprendizado` e flags antigas somente durante migração. Faça migração
controlada e bloqueie autonomia até o perfil estar coerente; não peça que o usuário salve novamente.

Crie uma função pura compartilhada:

```text
computeEffectiveState(config, runtimeSignals)
  -> {mode, acting, blockers[], checked_at}
```

Ela usa exatamente os gates do motor: tenant, entitlement, módulo, modo, kill switch, pausa,
opt-out, blocklist, horário, canal/webhook e quota. A UI traduz códigos para linguagem do negócio,
mas não calcula outra condição.

Mostre “Respondendo sozinho” somente quando `acting=true`. Caso contrário, mostre “Em silêncio” e
blockers acionáveis. Diferencie `conectada`, `conectada_sem_webhook`, `desconectada` e `desconhecida`.

## 2. GET sem efeitos; ações explícitas

GET de dashboard/listagem é estritamente read-only:

- não executa worker/claim;
- não chama provedor, QR, reconexão ou reparo;
- não roda migração pesada;
- não altera conexão, modo, fila ou conversa;
- não dispara LLM.

Mutações usam POST, RBAC/admin, CSRF, rate limit e auditoria: salvar perfil, mudar modo, bloquear,
suprimir, retomar, retry, conectar, reparar webhook, testar provedor e arquivar exemplo. O backend
revalida ownership e estado; ocultar botão não é autorização.

## 3. Separe ledger, outbox e log

### Ledger canônico de processamento

Uma entrada lógica por evento/inbound, com unique key, estado, lease/fencing token, tentativas e
resultado terminal. Retry cria novo `attempt`, não outro `terminal_outcome` para a mesma origem.
Falha ao persistir o ledger impede considerar o evento concluído.

### Outbox canônica de entrega

Guarda intenção, chave idempotente, corpo cifrado/referência com TTL, estado e reconciliação. Retry
manual reutiliza a mesma intenção/chave quando continua sendo a mesma entrega.

### Log de decisões para observabilidade

Append-only e best-effort, com:

```text
tenant_id, conversation_id, inbound_id, run_id, attempt_no,
decision, reason_code, detail_safe, outbox_id,
provider, model, tier, fallback, latency_ms, finish_reason,
policy_version/hash, created_at
```

Não guardar `reply_text`, prompt, resposta do provedor, telefone, `remoteJid`, stack ou erro bruto.
Use fingerprint/categoria. Como o log não é canônico, sua falha não perde a intenção; mas emite
métrica/alerta de observabilidade degradada.

## 4. Fila de exceções acionável

Construa a fila a partir de ledger/outbox e enriqueça com decisões seguras. Inclua somente estados
que o operador consegue resolver:

- canal/webhook indisponível;
- outbox `unknown`, `retry` vencida ou `dead_letter`;
- perfil/entitlement/módulo bloqueado;
- conversa pausada aguardando equipe;
- grounding/LLM sem resposta segura;
- opt-out ou política que exige revisão.

Não inclua ruído como webhook duplicado ou resposta obsoleta já substituída.

Escolha uma ação correta por item:

- `unknown` -> reconciliar/revisar, nunca reenviar às cegas;
- `retry` recuperável -> tentar a mesma outbox após gates frescos;
- pausa -> abrir conversa ou retomar explicitamente quando permitido;
- canal -> conectar/reparar por POST;
- política -> abrir configuração;
- default -> abrir conversa e contexto seguro.

Retry recusa se a inbound original não é mais a última, houve outbound posterior, opt-out, takeover,
revogação de plano/módulo ou a intenção foi cancelada. Uma revisão deliberadamente nova recebe nova
idempotency key e auditoria explícita.

## 5. Prova de trabalho e métricas

Conte trabalho por `source` e outbox confirmada, não por payload textual. Separe `agent`, `human`,
`human_external`, `scheduled`, `campaign`, `system` e `provider_echo`. Receipt técnico não é
mensagem nem atividade.

Métricas mínimas:

- inbound recebida/processada/dead e atraso da inbox;
- gerações iniciadas/descartadas por obsolescência;
- outbox `pending|claimed|sending|accepted|delivered|unknown|reconciliation|retry|dead_letter|cancelled`
  e idade máxima por estado;
- duplicidade detectada e reconciliação;
- latência total e por provedor, deadline/circuit breaker;
- skips por gate e handoffs;
- quota/rate-limit por tenant/conta/origem;
- falhas de grounding;
- opt-outs, supressões e direitos pendentes;
- custo/uso agregado por feature/modelo sem conteúdo.

Notifique por chave opaca/HMAC de tenant+conversa+tipo+janela. Não use nome/telefone na dedupe.
Alertas incluem atraso, outbox desconhecida, dead-letter, webhook inválido, colisão de ownership,
limiter indisponível, segredo perto de expirar e ausência de dispatcher.

## 6. Retenção operacional

Defina prazo por ledger, decisões, outbox, mídia, logs e métricas. Um job determinístico monitorado
executa expurgo em lotes; limpeza probabilística no caminho quente pode ser complemento, não o único
mecanismo. Preserve apenas o necessário para reconciliação/disputa durante o prazo definido.

## 7. Estratégia de testes

### Camada A: lógica pura

Cubra sem rede/banco:

- `computeEffectiveState` e ordem dos gates;
- parsing/normalização/opt-out;
- FactSchema, merge, correção e TTL;
- intenção crítica e handoff;
- construção de prompt e caps;
- parser de resposta, `finish_reason` e grounding;
- idempotency key estável;
- classificação de retry/unknown/dead-letter;
- sanitização de logs/DTOs.

### Camada B: contratos com adapters stubados

Use clientes stubados para webhook, LLM e canal. Verifique:

- assinatura sobre corpo bruto e limite de bytes;
- payload enviado ao provedor e redirects desativados;
- fallback somente enquanto cabe no deadline;
- JSON inválido/truncado tratado como falha;
- PII minimizada antes da LLM;
- status aceito/entregue/falhou/unknown;
- mídia com tamanho/MIME falso;
- ausência de credencial marcada `skipped`, nunca `passed`.

### Camada C: concorrência e crash boundaries

Rode processos/threads/requests reais contra banco isolado:

- webhook duplicado e eventos fora de ordem;
- duas execuções da mesma inbound;
- inbound B chega enquanto A usa LLM;
- dois dispatchers disputam fila/outbox;
- lease expira e worker antigo tenta concluir com token vencido;
- downgrade, kill switch, pausa, opt-out ou takeover antes da entrega;
- provedor aceita e processo morre antes do commit;
- timeout ambíguo e reconciliação;
- eco atrasado/duplicado e dois textos idênticos;
- rate limiter paralelo;
- helper em transação externa com savepoint;
- múltiplas bolhas com falha parcial.
- inbound/opt-out/takeover entre bolhas e envio humano fora do sistema antes do eco.

### Camada D: segurança e privacidade

- matriz negativa de ownership para conversa, mensagem, mídia, job, outbox e retry;
- tenant cruzado retorna 403, zero mutação e nenhuma enumeração;
- prompt injection em inbound, perfil, exemplo, arquivo e tool result;
- SSRF, redirects, host/DNS, MIME, XSS e nomes de arquivo;
- secret/PII scan em logs, respostas e artefatos;
- exportação/correção/supressão/expurgo e ciclo de backup;
- rotação/replay de webhook e cron.

### Camada E: ensaio real controlado

Use tenant, instância e destinatários dedicados. Teste ao menos um caminho real de inbound,
outbound, eco, receipt, retry/reconciliação, mídia, desconexão e opt-out. Não use cliente real no
primeiro smoke nem force produção sem autorização clara.

## 8. Critérios de shadow e piloto

Observe por pelo menos sete dias e atinja a amostra mínima definida antes do teste. Antes do piloto,
exija:

- zero envio em shadow;
- zero duplicidade observada e casos ambíguos reconciliados;
- zero acesso cruzado e zero PII/segredo em logs;
- nenhuma outbox/ledger vencida sem explicação;
- blockers e skips compreendidos;
- grounding sem afirmação financeira divergente;
- horário, opt-out, quota e desconexão provados;
- kill switch e rollback para shadow ensaiados.

Ative um canário por tenant/conversa, monitore e expanda gradualmente. Nunca ative todos por
migração, GET ou efeito colateral de conexão.

## Checklist do painel

- [ ] UI e runtime compartilham `computeEffectiveState`
- [ ] Perfil legado é migrado, não “salvo novamente” pelo usuário
- [ ] GET não produz efeito externo nem executa worker
- [ ] Mutações exigem POST, admin, CSRF e ownership
- [ ] Retry referencia outbox e revalida a inbound original
- [ ] Log não armazena corpo de retry nem conteúdo sensível
- [ ] Ledger/outbox continuam recuperáveis se auditoria falhar
- [ ] Métricas expõem backlog, unknown, dead-letter, deadline e grounding
- [ ] Testes concorrentes e crash boundary passam
- [ ] Smoke sem credencial aparece como skipped; caminho real controlado foi executado
