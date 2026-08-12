# Matriz de gates

Preencher uma linha por módulo e consumidor real.

| Superfície | Arquivo/rota/job | Ação | Gate servidor | Reflexo UI | Comportamento negado |
|---|---|---|---|---|---|
| página | | ler | sim | menu oculto | 403/redirect |
| API GET | | ler | sim | n/a | 403 |
| API POST | | mutar | sim + CSRF | botão oculto | 403 |
| cron/tick | | automatizar | sim antes do claim | n/a | skip auditável |
| webhook | | efeito | sim após autenticar | n/a | ACK/skip conforme contrato |
| público | | responder | decisão explícita | n/a | 404 ou compatibilidade |

## Precedência recomendada

1. Autenticação e ownership.
2. Gate de módulo.
3. Direito do plano/entitlement.
4. Papel/capacidade do usuário.
5. Estado específico do recurso.

Não esconda um erro de ownership como simples falta de plano e não use a UI para compensar ausência de gate no servidor.
