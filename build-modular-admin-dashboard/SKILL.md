---
name: build-modular-admin-dashboard
description: "Implementa ou audita uma tela inicial administrativa modular por usuário e tenant, com catálogo central de blocos, tamanhos, presets combináveis, atalhos, página de entrada, preferências persistidas, feature/plan gates, renderização defensiva e fallback para dashboard clássico. Use quando usuários precisam personalizar widgets/KPIs sem quebrar a home operacional existente."
---

# Dashboard administrativo modular

Mantenha a home clássica como rede de segurança enquanto o modo modular amadurece.

## Arquitetura mínima

- Preferência por `tenant_id + user_id` contendo `mode`, `layout`, `quick_actions` e `landing_route`.
- Catálogo único com chave, rótulo, descrição, ícone, categoria, tamanho padrão, tamanhos aceitos e função de disponibilidade.
- Um renderer/partial autocontido por bloco.
- Presets que referenciam chaves do catálogo; não duplicar metadados no front.
- Endpoint GET/POST autenticado; POST com CSRF e validação completa.

Leia [contrato-de-blocos.md](references/contrato-de-blocos.md) ao criar ou portar widgets.

## Fluxo

1. Mapear os dados e helpers já usados pela home clássica.
2. Definir catálogo e chaves estáveis antes da interface de edição.
3. Normalizar layout no servidor: remover desconhecidos/duplicados, aplicar tamanho permitido e filtrar indisponíveis.
4. Criar defaults a partir de um preset de visão geral.
5. Renderizar o modo modular dentro de buffer/limite de erro; qualquer falha estrutural cai para a home clássica.
6. Fazer cada bloco tratar sua própria falha/estado vazio sem derrubar os demais.
7. Criar edição Ajax/no-refresh com preview, reordenação, tamanhos, presets e salvamento explícito.
8. Resolver a página inicial somente por allowlist; nunca redirecionar para URL arbitrária.

## Regras de produto

- Preferência é individual, não do tenant inteiro.
- Presets podem ser combináveis quando isso fizer sentido; unir blocos pela ordem escolhida e deduplicar por chave.
- Módulo/plano/permissão decide disponibilidade no servidor e na UI.
- Bloco ausente após downgrade deve ser ignorado, não quebrar o layout salvo.
- Ações rápidas apontam apenas para rotas internas permitidas.
- Painel de personalização deve funcionar em desktop e mobile e explicar o que muda antes de salvar.

## Performance e segurança

- Evitar N+1: carregar dados compartilhados uma vez ou usar serviços agregados.
- Não executar LLM, worker, envio ou DDL pesado ao renderizar blocos.
- Escapar conteúdo e não permitir HTML/rota arbitrários vindos do layout JSON.
- Limitar quantidade de blocos e tamanho do payload.
- Tratar catálogos e presets como código confiável; tratar preferência como entrada não confiável.
- Aplicar timeout/cache quando um bloco consultar serviço lento e oferecer degradação honesta.

## Testes

- Preferências não vazam entre usuários nem tenants.
- Layout malformado, chave desconhecida, duplicata e tamanho inválido são normalizados.
- Downgrade ou módulo desligado remove o bloco efetivo sem corromper o salvo.
- Falha de um bloco mantém os outros e falha estrutural retorna à home clássica.
- Presets combinados preservam ordem e não duplicam widgets.
- Landing route externa/desconhecida cai no default.
- Ajax salva e reabre o mesmo estado; navegação mobile permanece utilizável.
- Home clássica continua inalterada e acessível.

## Entrega

Produzir schema, catálogo, presets, renderizadores, endpoint, editor, fallback clássico, testes de normalização e medição de custo da home. Documentar como adicionar um novo bloco sem editar múltiplas listas.
