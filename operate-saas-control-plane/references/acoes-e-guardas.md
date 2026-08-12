# Ações e guardas do control plane

## Papéis sugeridos

| Papel | Escopo |
|---|---|
| support_read | leitura sanitizada e diagnóstico |
| support_action | ações reversíveis de suporte |
| billing_operator | cobranças, cupons e reconciliação |
| product_operator | módulos, flags e pilotos |
| security_admin | identidade, incidentes e segredos |
| super_admin | ações excepcionais com reautenticação |

Evite um booleano admin universal quando o time crescer.

## Catálogo de comandos

| Comando | Reautenticação | Efeito externo | Reversível |
|---|---:|---:|---:|
| reenviar_verificacao | não/risco | e-mail | sim |
| ativar_conta | sim | opcional | por comando compensatório |
| ajustar_trial | sim | não | sim |
| override_plano | sim | produtos integrados | sim |
| mudar_assinatura | sim | gateway | depende |
| configurar_modulo | sim | gates | sim |
| compensar_credito | sim | gateway futuro | por ledger |
| impersonar | sim | sessão | sim |
| reprocessar_webhook | sim | múltiplo | requer idempotência |

## Audit log

Registre:

- command_id/idempotency_key;
- operador e papel;
- tenant alvo;
- ação e motivo;
- preview hash;
- estado anterior/depois sanitizado;
- efeitos externos e IDs;
- resultado;
- IP/device quando legítimo;
- timestamps.

## Máquina de comando

requested -> authorized -> executing -> succeeded

Saídas: partially_succeeded, pending_reconciliation, rejected, failed e compensated.

## Guardas universais

1. Operador autenticado e ativo.
2. Permissão específica.
3. CSRF/session freshness.
4. Tenant alvo existe e foi relido.
5. Estado atual ainda corresponde ao preview.
6. Reautenticação quando exigida.
7. Idempotency key.
8. Mutação local curta.
9. Outbox para efeitos externos.
10. Auditoria e feedback sem segredos.

## Divergências que devem aparecer

- plano local diferente da assinatura;
- trial depois de plano pago;
- tenant ativo com billing suspenso;
- cupom reservado sem cobrança correspondente;
- crédito local não refletido;
- produto integrado com entitlement diferente;
- job sem heartbeat;
- webhook em unknown/retry.
