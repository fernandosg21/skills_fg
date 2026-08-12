# Matriz e fluxos de acesso

## Papéis de referência

| Capacidade | Owner | Admin | Editor |
|---|---:|---:|---:|
| operar CRM/eventos | sim | sim | sim |
| editar configurações operacionais | sim | sim | conforme permissão |
| gerir usuários comuns | sim | sim | não |
| promover/remover admin | sim | política explícita | não |
| billing e plano | sim | opcional | não |
| segredos e integrações | sim | opcional com reautenticação | não |
| transferir propriedade | sim | não | não |
| excluir/exportar tenant | sim com prova reforçada | não | não |

Adapte a matriz, mas mantenha uma autoridade final inequívoca.

## Estados de membership

invited -> active -> suspended -> revoked

Convite expirado é terminal e deve ser reemitido com novo token. Revogar não apaga auditoria.

## Tabela de membership sugerida

- tenant_id
- user_id
- role_key
- status
- permissions_json ou relação normalizada
- invited_by
- accepted_at
- security_version
- timestamps

## Convite

Armazene:

- hash do token;
- tenant;
- e-mail normalizado;
- papel máximo permitido;
- expiração;
- emissor;
- consumed/revoked timestamp.

## 2FA/TOTP

Estados:

disabled -> enrollment_pending -> enabled -> recovery_required ou disabled

Ativar somente após confirmar um código produzido pelo segredo novo. Ao regenerar segredo, invalide o anterior e códigos de recuperação.

## Ordem de autorização

1. Sessão ou token autenticado.
2. Usuário ativo.
3. Tenant resolvido sem ambiguidade.
4. Membership ativa.
5. Papel/permissão.
6. Ownership do recurso.
7. Reautenticação/fator recente quando exigido.
8. Regra de estado do domínio.

Falha em qualquer etapa encerra a ação antes de mutação ou leitura sensível.
