---
name: build-photography-crm
description: "Implemente ou audite um CRM multi-tenant para estúdios de fotografia, recreação e eventos, cobrindo captação, deduplicação de contatos, clientes PF/PJ, funil, reserva separada de fechamento, histórico, conversão em evento e integrações. Use quando criar CRM, kanban comercial, Lead Express, formulário de captação, ficha 360 do cliente, automação de perdido ou integração de leads com WhatsApp e orçamento."
---

# Construir CRM para fotografia e eventos

## Objetivo

Entregue um CRM que preserve a jornada comercial inteira, da primeira captação ao evento confirmado, sem duplicar pessoas nem confundir intenção, reserva e venda.

## Antes de alterar

1. Mapeie schema, páginas, APIs, jobs, webhooks e consumidores laterais do CRM.
2. Identifique todas as origens de lead: cadastro interno, formulário público, WhatsApp, orçamento, link da bio, importação e integrações.
3. Levante os papéis de usuário e resolva o tenant no servidor.
4. Leia [modelo-de-dominio.md](references/modelo-de-dominio.md) antes de definir tabelas ou estados.
5. Preserve dados e rotas legadas até provar uma migração reversível.

## Modele identidades sem misturar responsabilidades

- Trate `lead`, `cliente`, `oportunidade` e `evento` como conceitos relacionados, não como sinônimos.
- Permita que uma oportunidade aponte para um lead ainda não convertido ou para um cliente existente.
- Modele pessoa física e pessoa jurídica explicitamente. Não reutilize CPF como CNPJ nem force documento fictício para satisfazer unicidade.
- Escopo todos os dados de negócio por tenant e use unicidade composta quando o valor só precisa ser único dentro da conta.
- Normalize telefone e e-mail para comparação, mas preserve a forma original útil à exibição.
- Faça deduplicação assistida: mostre candidatos e permita aproveitar o cadastro correto sem apagar histórico.

## Construa o funil como máquina de estados

- Defina chaves estáveis para as etapas e rótulos editáveis para a interface.
- Mantenha `reserva` separada de `fechado`: reserva segura uma data; fechado representa negócio confirmado.
- Valide transições no backend e registre cada mudança como interação auditável.
- Não deixe arrastar um cartão produzir efeitos irreversíveis silenciosos.
- Ao fechar, vincule ou crie o cliente e o evento em uma operação consistente; torne a repetição idempotente.
- Ao perder, guarde motivo, data e origem da decisão e permita recuperação quando fizer sentido.

## Integre as entradas

1. Normalize o payload de cada origem para um contrato canônico.
2. Procure primeiro por vínculo explícito; depois compare telefone e e-mail dentro do tenant.
3. Atualize apenas campos cuja autoridade da origem esteja definida. Não substitua dados melhores por strings vazias.
4. Reaproveite oportunidade aberta compatível em vez de criar cartões paralelos.
5. Registre a origem e uma interação inicial.
6. Agende follow-up por contrato idempotente, se a origem exigir retorno.
7. Retorne o mesmo shape de sucesso e erro para todos os produtores.

## Entregue a ficha 360

- Reúna contato, oportunidades, interações, eventos, contratos, pagamentos, follow-ups e conversas por IDs e tenant confirmados.
- Busque clientes por API com debounce e cancelamento; não pré-carregue toda a base nem use `datalist` para dados sensíveis.
- Preserve o contexto com ações Ajax e feedback inline.
- Restrinja campos e ações administrativas no backend, não somente na interface.

## Automatize com limites explícitos

- Rode classificação por IA somente sob demanda para um item ou em job controlado; nunca dentro do carregamento de uma lista.
- Grave tentativa, resultado, modelo e horário para evitar chamadas infinitas quando a IA não encontrar resposta.
- Para marcação automática de perdido, gere primeiro relatório de impacto, exclua reservas e fechados e mantenha trilha de reversão.
- Trate opt-out, resposta recebida e fechamento como sinais de encerramento das automações comerciais.
- Separe fornecedores recomendados ao cliente de fornecedores contábeis, mesmo quando compartilhem uma pessoa.

## Valide de ponta a ponta

- Teste duas contas com os mesmos telefone, e-mail, CPF e CNPJ.
- Teste captação nova, contato já existente e reenvio do mesmo webhook.
- Teste todas as transições, inclusive reserva, fechado, perdido e recuperação.
- Confirme que fechar gera um único cliente/evento e encerra follow-ups incompatíveis.
- Confirme que buscas, filtros, arraste e ações funcionam no desktop e no celular sem recarregar a página inteira.
- Inspecione queries sem `tenant_id`, joins ambíguos e updates por ID global.
- Execute os testes e linters do projeto e documente riscos que não puderam ser exercitados.

## Critérios de conclusão

Considere pronto somente quando todas as origens convergirem no mesmo modelo, os estados tiverem semântica inequívoca, as conversões forem idempotentes e houver evidência de isolamento entre tenants.
