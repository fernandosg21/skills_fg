---
name: secure-multitenant-saas
description: "Implementa, endurece ou audita isolamento multi-tenant em aplicações SaaS, cobrindo resolução de tenant, ownership, autenticação e papéis, índices únicos compostos, tokens públicos, arquivos, jobs, webhooks, integrações e migração segura de chaves globais legadas. Use quando houver `tenant_id`, organizações, workspaces, contas de clientes, risco de vazamento cruzado, colisões de CPF/CNPJ/e-mail/slug, importações entre tenants ou IDs técnicos de provedores."
---

# SaaS multi-tenant seguro

Trate o isolamento como contrato de domínio e de segurança, não como filtro decorativo da interface.

## Começar pelo mapa real

1. Localizar todos os entrypoints: páginas, APIs, links públicos, webhooks, jobs, filas, CLI, relatórios, exports, uploads, integrações e rotas legadas.
2. Classificar entidades como globais da plataforma, pertencentes ao tenant ou públicas por token/namespace.
3. Identificar como o tenant é provado em cada contexto. Sessão autenticada, token público ligado a uma entidade e conta técnica do provedor são vínculos; parâmetro livre do cliente não é.
4. Mapear chaves de negócio, chaves públicas e IDs técnicos antes de alterar índices ou upserts.
5. Ler [modelo-de-ameacas.md](references/modelo-de-ameacas.md) antes de migrar schema ou expor uma nova superfície.

## Invariantes

- Resolver o tenant no início e carregá-lo explicitamente até a camada de dados.
- Filtrar toda entidade de negócio por tenant e validar ownership antes de ler, mutar, excluir, baixar, exportar ou gerar arquivo.
- Repetir a barreira no backend. Ocultar botão ou menu não autoriza a ação.
- Devolver 403 em acesso cruzado autenticado e 404 genérico em link público quando isso reduzir enumeração.
- Fazer unicidade de dados do cliente ser composta com o tenant: documento, código legado, nome técnico ou slug que pode se repetir entre organizações.
- Manter token público opaco global somente quando o namespace for intencionalmente global e houver entropia suficiente.
- Nunca usar `ON DUPLICATE KEY UPDATE` se a colisão puder pertencer a outro tenant; confirmar o dono ou abortar.
- Tratar ID do provedor como global apenas quando o provedor garantir esse namespace. Mesmo assim, verificar o tenant dono antes de atualizar.
- Em resultado ambíguo, falhar fechado; nunca escolher `LIMIT 1`.
- Escopar uploads, artefatos, cache, locks, quotas, logs e filas, não apenas linhas SQL.
- Fazer jobs iterarem tenants explicitamente ou receberem um tenant por execução.
- Não usar tenant fixo como fallback em produção.

## Implementar em camadas

### Identidade e autorização

- Separar usuário, tenant, membership e papel.
- Autorizar por capacidade no servidor; suportar usuário em mais de uma organização quando o produto exigir.
- Regenerar sessão após login e troca de tenant; não confiar em tenant guardado apenas no navegador.
- Exigir papel elevado para administração, billing, usuários, exportação ampla e ações destrutivas.

### Persistência

- Incluir `tenant_id NOT NULL` e índices iniciados por tenant nas tabelas de negócio.
- Usar FK composta ou conferir tenant dos dois lados da relação no serviço.
- Aplicar `UNIQUE (tenant_id, business_key)` quando a chave pertence ao cliente SaaS.
- Registrar `created_by`/`updated_by` e trilha de auditoria em efeitos sensíveis.
- Se o banco suportar RLS, usá-la como defesa adicional, sem dispensar testes e filtros da aplicação.

### Público e integrações

- Resolver link público por token e derivar o tenant da entidade encontrada; nunca aceitar `tenant_id` livre para completar o lookup.
- Assinar parâmetros quando um fluxo público precisar transportar contexto adicional.
- No webhook, autenticar primeiro, resolver a conta técnica e exigir consenso entre sinais de ownership.
- Namespear idempotência por tenant, ambiente, provedor e conta quando o ID externo não for universal.

### Arquivos e caches

- Derivar caminhos no servidor e impedir travessia; nunca montar destino diretamente com entrada do usuário.
- Vincular metadado do arquivo ao tenant ou a uma entidade já validada.
- Escopar cache, lock e fila com tenant + entidade; invalidar com a mesma chave.
- Em links privados, evitar IDs sequenciais e metadados sociais com PII.

## Migrar legado sem colisão

1. Medir duplicidades globais e por tenant em modo somente leitura.
2. Preencher `tenant_id` por relações comprováveis; separar casos ambíguos para revisão.
3. Criar a nova chave tenant-scoped antes de remover a global.
4. Alterar todos os leitores e escritores, inclusive importadores, webhooks e scripts.
5. Testar dois tenants com o mesmo valor de negócio.
6. Remover a chave global somente após provar que nenhum consumidor depende dela.
7. Manter rollback aditivo; não apagar dados para resolver colisões.

## Testes obrigatórios

- Tenant A não lê, altera, exclui, exporta nem baixa artefato do tenant B.
- Mesmo CPF/CNPJ/e-mail/slug permitido em tenants distintos e recusado dentro do mesmo tenant, conforme o domínio.
- Token/ID aleatório de outro tenant falha sem revelar existência.
- Job, webhook, upsert e importação não atravessam ownership.
- Relatórios e contagens agregadas não misturam organizações.
- Cache, quota, rate limit e locks não colidem entre tenants.
- ID técnico já pertencente a outro tenant causa erro auditável.
- Contexto ausente ou ambíguo falha fechado.

## Entrega

Produzir mapa de entidades/entrypoints, matriz de ownership, migrações reversíveis, guards compartilhados, testes de acesso cruzado e lista de exceções globais justificadas. Não declarar o isolamento concluído enquanto caminhos públicos, jobs, webhooks, arquivos e relatórios não tiverem sido cobertos.
