# Modelo de ameaças multi-tenant

## Tabela de decisão

| Superfície | Prova aceitável de tenant | Falha comum | Guarda mínima |
|---|---|---|---|
| Painel/API autenticada | sessão + membership ativa | aceitar `tenant_id` do body | derivar da sessão e filtrar ownership |
| Link público | token opaco ligado à entidade | token + ID livre de outro tenant | resolver tudo pela entidade do token |
| Webhook | assinatura + conta/instância do provedor | confiar em query string | consenso entre sinais e fail-closed |
| Job/cron | tenant explícito ou loop controlado | query global sem escopo | iterar tenant e auditar progresso |
| Importação | tenant destino autenticado | merge global por CPF/e-mail | dedupe apenas dentro do destino |
| Arquivo | entidade tenant-scoped validada | caminho/ID previsível | autorização antes do stream |
| Cache/lock/fila | tenant + recurso | chave só pelo ID local | namespace completo |
| Relatório/export | tenant da sessão ou papel de plataforma | filtro opcional | filtro obrigatório no servidor |

## Exceções globais legítimas

- Configuração e catálogo realmente globais da plataforma.
- Token público de alta entropia cujo namespace é global por desenho.
- ID técnico que o provedor garante único na conta/plataforma.
- Administração da plataforma com papel separado, consulta auditada e escopo explícito.

Cada exceção deve ser documentada. A tabela já ser assim não é justificativa.

## Sinais de vulnerabilidade

- `WHERE id = ?` em tabela de negócio sem ownership anterior.
- `OR user_id = ?` aberto junto de `tenant_id` em dados já migrados.
- Busca global por e-mail, telefone ou documento seguida de adoção automática.
- Upsert por chave externa sem conferir o dono da linha existente.
- `LIMIT 1` para resolver múltiplos candidatos de tenant.
- Job que seleciona todos e presume tenant a partir do primeiro registro.
- Caminho de arquivo construído por ID/slug sem checar a entidade.
- Cache, lock ou idempotency key sem tenant/conta/ambiente.
