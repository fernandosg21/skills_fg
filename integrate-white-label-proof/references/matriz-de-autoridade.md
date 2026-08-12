# Matriz de autoridade

Use esta matriz como ponto de partida e registre as escolhas do projeto.

| Domínio | Standalone | Integrado |
|---|---|---|
| identidade de login | módulo | SSO principal ou membership vinculada |
| nome/logo do estúdio | módulo | principal vence |
| cores e watermark do Proof | módulo | módulo, salvo regra explícita |
| cliente/evento | módulo | principal vence; módulo mantém link |
| projeto de seleção/álbum | módulo | módulo vence |
| andamento da prova | módulo | módulo publica eventos |
| plano/billing | módulo | autoridade declarada por oferta |
| métricas de uso | módulo | módulo agrega e compartilha mínimo |

## Registro de vínculo

- integration_id;
- parent_tenant_id;
- module_tenant_id;
- entity_type;
- parent_entity_id;
- module_entity_id;
- status;
- source;
- local_version e remote_version;
- linked_at, last_synced_at, unlinked_at.

## Evento de sincronização

Campos mínimos:

- event_id globalmente único;
- event_type;
- integration_id;
- entity_type e IDs dos dois lados;
- version monotônica por entidade;
- occurred_at;
- payload versionado e allowlisted;
- signature.

## Conflitos

| Situação | Ação |
|---|---|
| remote ID pertence a outro tenant | abortar e alertar |
| duas entidades locais apontam ao mesmo remoto | bloquear reconciliação automática |
| evento mais antigo chega depois | ignorar por versão |
| fonte não autoritativa muda campo | registrar, não sobrescrever |
| vínculo órfão | suspender efeitos e pedir correção |

## Desvinculação

Defina previamente:

- quais snapshots permanecem;
- se links públicos continuam válidos;
- quem passa a ser dono de clientes/projetos;
- como tokens/SSO são revogados;
- como reativar sem criar uma segunda integração.
