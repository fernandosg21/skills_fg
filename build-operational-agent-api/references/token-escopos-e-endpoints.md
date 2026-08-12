# Token, escopos e endpoints

## Token

Formato possível:

`tenantId.randomSecret`

O prefixo reduz o lookup. A segurança vem do segredo e da comparação com o verificador guardado, seguida de ownership em cada recurso.

## Escopos exemplo

| Escopo | Permite |
|---|---|
| deliveries:read | listar pendências |
| selection:read | ler status/exportar seleção |
| gallery:create | garantir galeria de seleção |
| workflow:update | atualizar etapa permitida |
| photo:upload | enviar foto processada |

Evite `*` na UI comum. Reserve-o a diagnóstico controlado, se existir.

## Contrato de erro

| HTTP | Caso |
|---|---|
| 400 | payload inválido |
| 401 | token ausente/inválido |
| 403 | escopo, módulo ou ownership negado |
| 404 | recurso não encontrado no tenant |
| 409 | transição/conflito de estado |
| 429 | limite excedido |
| 503 | dependência/storage indisponível |

## Idempotência

- `gallery:create`: tenant + event/workflow.
- `photo:upload`: gallery + hash do arquivo; nome é sinal secundário.
- `workflow:update`: etapa + estado alvo + versão/If-Match quando necessário.
- exportações: somente leitura.

## Auditoria mínima

```text
tenant_id
agent_user_id
source=agent_api
action
entity/entity_id
request_id/idempotency_key
metadata sanitizada
created_at
```
