# Fila e reconciliação

## Estados recomendados

| Estado | Significado | Próxima ação |
|---|---|---|
| scheduled | Elegível no futuro | esperar |
| claimed | Lease ativo | processar ou recuperar lease |
| sending | Outbox persistida e I/O iniciado | reconciliar |
| accepted | Provedor aceitou | aguardar webhook/eco se necessário |
| sent | Entrega aceita conforme contrato | terminal |
| unknown | Resultado incerto | reconciliar antes de retry |
| failed | Falha transitória | retry com backoff |
| dead_letter | Política esgotada | intervenção |
| cancelled | Intenção revogada antes do envio | terminal |

Aprovação deve ser campo/máquina separada: pending, approved, rejected ou invalidated.

## Campos mínimos

- tenant_id;
- idempotency_key;
- source e source_entity_id;
- recipient_canonical;
- message_version e body/template snapshot;
- scheduled_at_utc e timezone;
- status e approval_status;
- attempts, next_attempt_at;
- lease_token, lease_until;
- outbox_id, provider_message_id;
- last_error_category;
- created/approved/sent/cancelled timestamps.

## Chaves de exemplo

- check-in: tenant:evento:event_checkin:data_evento;
- pagamento: tenant:parcela:payment_reminder:vencimento;
- entrega: tenant:entrega:delivery_ready:versao;
- manual: tenant:client_nonce.

Não use somente telefone + texto; duas intenções legítimas podem coincidir.

## Classificação de falhas

| Categoria | Retry |
|---|---:|
| autenticação/configuração | não até correção |
| destinatário inválido/opt-out | não |
| rate limit | sim, respeitando Retry-After |
| indisponibilidade/5xx | sim |
| timeout depois do envio | reconciliar primeiro |
| rejeição de política | não |

## Consulta do worker

Elegível apenas quando:

- status é scheduled ou failed recuperável;
- approval_status satisfaz a política;
- scheduled_at_utc já venceu;
- next_attempt_at vazio ou vencido;
- lease ausente ou expirado;
- tenant/canal não está pausado.

Revalide regras de negócio depois do claim.
