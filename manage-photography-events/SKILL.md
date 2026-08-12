---
name: manage-photography-events
description: "Implemente ou audite o ciclo operacional completo de eventos para fotografia, vídeo, recreação e serviços, incluindo pedido recebido, reserva, cliente, pacote, contrato, parcelas, equipe, serviços extras, prazos, reagendamento, cancelamento, conclusão e relatórios. Use quando uma ficha de evento precisa coordenar CRM, agenda, financeiro, contratos e entregas sem perder histórico nem duplicar efeitos."
---

# Gerenciar eventos de fotografia e serviços

## Objetivo

Trate o evento como agregado operacional central. Preserve a distinção entre intenção comercial, reserva de data, evento contratado e trabalho concluído, enquanto integra os módulos laterais por efeitos idempotentes.

## Mapear antes de alterar

1. Liste todos os entrypoints que criam, recebem, convertem, editam, reagendam, cancelam ou concluem eventos.
2. Identifique consumidores de cliente, pacote, data, equipe, contrato, parcelas, extras e prazos.
3. Defina a autoridade de cada campo e quais valores precisam virar snapshot histórico.
4. Leia [modelo-e-transicoes.md](references/modelo-e-transicoes.md).
5. Preserve rotas e dados legados até haver migração reversível e reconciliada.

## Separar entidades e estados

- Modele pedido recebido, oportunidade, reserva, evento, contrato e entrega como entidades relacionadas, não como um único status.
- Faça reserva significar data temporariamente segurada; ela não é venda fechada nem receita realizada.
- Use estados estáveis para o evento, como pendente, confirmado, concluído e cancelado.
- Mantenha o estado do contrato separado do estado operacional do evento.
- Escopo evento e todas as relações por tenant; valide ownership em cada mutação.
- Registre histórico imutável das transições relevantes.

## Criar o evento de modo consistente

1. Resolva ou crie o cliente dentro do tenant.
2. Valide data, intervalo, local, pacote, permissões e conflitos.
3. Copie para o evento um snapshot dos termos comerciais usados: itens, valores, descontos, duração e prazos.
4. Calcule totais em centavos ou decimal exato; não reconstrua o contrato a partir de um pacote que possa mudar depois.
5. Crie parcelas, equipe inicial, prazos e fluxo pós-evento na mesma unidade lógica ou por outbox idempotente.
6. Use chave de idempotência para conversões vindas de CRM, proposta, orçamento ou webhook.
7. Retorne o ID canônico já existente quando a mesma intenção for repetida.

## Construir a ficha 360 do evento

- Reúna dados principais, cliente, contrato, financeiro, equipe, extras, agenda, Proof/galeria, prazos e auditoria.
- Faça cada quadro carregar e salvar sem recarregar a página inteira, preservando o contexto.
- Mostre estados derivados com explicação, sem permitir que a UI substitua a validação backend.
- Diferencie custo, receita, pagamento e mera estimativa.
- Permita busca por cliente, data, tipo, status e profissional sem joins que multipliquem totais.

## Preservar semânticas financeiras

- Separe valor do pacote, deslocamento, serviços extras, excedentes, descontos, sinal e pagamentos.
- Um extra cancelado deixa de compor saldo futuro, mas continua auditável.
- Parcela paga não pode ser reaberta ou mover vencimento por um reagendamento comum.
- Atualização de vencimento não altera valor total nem exige regenerar contrato.
- Cancelamento deve aplicar uma política explícita para parcelas, cobranças externas, custos e reembolsos.
- Reconcilie totais antes e depois de qualquer correção em produção.

## Reagendar por preview e commit

1. Carregue o snapshot atual e valide a nova janela.
2. Calcule um preview com conflitos e impactos em parcelas abertas, equipe, prazos, mensagens e calendário externo.
3. Exija confirmação explícita sobre os impactos opcionais.
4. Grave a nova data e o histórico em transação curta, preservando data original e contrato assinado.
5. Após o commit, dispare efeitos por outbox ou jobs idempotentes.
6. Exponha sucesso parcial quando um provedor externo falhar e ofereça retry.

Não espalhe a lógica de reagendamento por várias telas. Todos os entrypoints devem chamar o mesmo serviço.

## Cancelar e concluir com segurança

- Defina quando cancelamento é permitido e quem pode fazê-lo.
- Use modal com resumo de impacto e reautenticação para ações sensíveis.
- Não exclua o evento como forma de cancelar.
- Marque integrações e filas pendentes para cancelamento idempotente.
- Conclua automaticamente somente quando os critérios do domínio forem objetivos; caso contrário, peça confirmação.
- Preserve contratos, comprovantes, histórico e arquivos conforme retenção.

## Validar de ponta a ponta

- Criação manual, conversão de lead, pedido público repetido e reserva promovida a evento.
- Pacote alterado depois da contratação sem mudar o snapshot antigo.
- Extras adicionados, pagos, cancelados e estornados.
- Reagendamento com parcelas pagas e abertas, equipe, prazos e calendário indisponível.
- Cancelamento antes/depois do evento e repetição da mesma requisição.
- Dois tenants com IDs, clientes, documentos e pacotes coincidentes.
- Relatórios sem duplicação por joins de equipe, parcelas ou extras.

## Critérios de conclusão

Considere pronto quando cada evento mantém termos históricos coerentes, toda mutação sensível é tenant-scoped e idempotente, e os módulos laterais convergem após criação, reagendamento, cancelamento e conclusão.
