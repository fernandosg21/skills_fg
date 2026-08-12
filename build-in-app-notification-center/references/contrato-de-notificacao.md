# Contrato de notificação

## Entidades

| Entidade | Responsabilidade |
|---|---|
| notification | Conteúdo e estado in-app |
| notification_recipient | Usuário/papel e leitura |
| notification_occurrence | Ocorrências agregadas opcionais |
| notification_outbox | Entrega por canal |
| notification_preference | Canal, tipo e horário |
| notification_digest | Edição e itens incluídos |

## Payload canônico

- type_key estável;
- tenant_id;
- audience user/role;
- dedupe_key;
- severity;
- title e body sanitizados;
- action_key e resource_id opaco;
- occurred_at, expires_at;
- source_event_id;
- metadata allowlisted.

## Exemplo de dedupe

Parcela atrasada:

tenant:parcela:overdue

Atualize dias/valor exibido enquanto a parcela continuar aberta. Resolva ao pagar. Um novo atraso da mesma parcela depois de estorno pode incrementar uma geração/versão explícita.

## Estados

In-app:

unread -> read -> archived

O fato pode ainda ganhar resolved ou expired independentemente da leitura.

Outbox:

pending -> sending -> accepted ou failed ou unknown -> reconciled/dead_letter

## Notificação versus tarefa

| Item | Exige conclusão de negócio | Pode desaparecer ao ler |
|---|---:|---:|
| notificação informativa | não | sim |
| alerta de condição | depende de resolver o fato | não |
| tarefa operacional | sim | não |

Não use read_at como completed_at.

## Métricas

- taxa de dedupe;
- tempo evento -> notificação;
- tempo até leitura/ação;
- taxa de resolução;
- falhas por canal;
- idade da outbox mais antiga;
- produtores sem emissão esperada.
