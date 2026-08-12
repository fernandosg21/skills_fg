---
name: automate-crm-followups
description: "Implemente ou audite follow-ups comerciais e tarefas de relacionamento com fila, recorrência, reconciliação, idempotência, opt-out e envio seguro. Use quando criar lembretes de CRM, retomada de orçamento, pós-evento, recorrência anual, digest ao responsável, mensagens sugeridas por IA ou automação de resposta pendente ligada a WhatsApp."
---

# Automatizar follow-ups de CRM

## Objetivo

Crie uma fila confiável de próximos passos que ajude a equipe a agir sem cobrar quem já respondeu, fechou, cancelou ou pediu para não receber mensagens.

## Faça o levantamento primeiro

1. Mapeie todos os produtores e consumidores de follow-up.
2. Identifique quais itens são mensagens ao cliente e quais são tarefas internas.
3. Localize a fila de envio, os webhooks de resposta, as rotinas de fechamento e os jobs de varredura.
4. Leia [contrato-da-fila.md](references/contrato-da-fila.md).
5. Preserve registros históricos; corrija dados legados por migração idempotente e mensurável.

## Modele o lembrete

- Grave `tenant`, tipo, estado, data agendada, canal, origem e mensagem em rascunho.
- Vincule por IDs explícitos a oportunidade, lead, cliente, evento e conversa quando existirem.
- Use estados que distingam pendente, enviado, respondido, ignorado e cancelado.
- Registre o motivo de encerramentos automáticos.
- Gere uma chave de idempotência a partir da intenção de negócio, não apenas da data de criação.
- Mantenha tarefas internas fora de qualquer caminho de envio ao cliente.

## Centralize a conclusão

- Implemente um único serviço para concluir, responder, ignorar ou cancelar um item.
- Faça todos os endpoints, webhooks e jobs chamarem esse serviço.
- Registre interação no CRM no mesmo fluxo.
- Torne a operação idempotente para que retries não dupliquem histórico.
- Cancele mensagens ainda agendadas quando a causa do follow-up deixar de existir.

## Crie e reconcilie com segurança

1. Antes de criar, verifique se já existe pendência equivalente no tenant.
2. Antes de enviar, revalide estado do negócio, opt-out, última direção da conversa e autorização de automação.
3. Se o cliente respondeu, marque os itens comerciais compatíveis como respondidos.
4. Se o negócio fechou ou foi cancelado, encerre lembretes incompatíveis.
5. Para pós-evento, encerre quando o evento for cancelado ou a entrega já estiver concluída.
6. Para recorrência anual, encerre quando já houver novo evento equivalente confirmado.
7. Expire lixo antigo com regra documentada e motivo auditável.

## Separe sugestão de envio

- Gere texto por IA somente quando a pessoa pedir ou em job explicitamente autorizado.
- Limite a uma chamada de IA por item/request e registre tentativa inclusive em falha.
- Use contexto mínimo e redija PII quando o provedor não precisar dela.
- Entregue a sugestão como rascunho editável; não trate geração de texto como autorização de envio.
- Envie por outbox durável com idempotência, retry limitado e reconciliação do status remoto.

## Construa a experiência operacional

- Mostre atrasados, de hoje e futuros com filtros previsíveis.
- Permita concluir, reagendar e editar por Ajax, preservando filtros e rolagem.
- Mostre claramente canal, destinatário, origem e por que o lembrete existe.
- Para digest do responsável, gere no máximo um por período e confirme que o número de destino não é o número remetente.
- Use modal para confirmações e feedback inline para falhas.

## Valide os cenários críticos

- Reexecute criação, sweep e webhook e prove ausência de duplicatas.
- Simule resposta antes do envio, opt-out, fechamento, cancelamento e reabertura.
- Teste lead sem cliente, cliente com duas oportunidades e dois eventos da mesma pessoa.
- Garanta que tarefa interna nunca entra na outbox.
- Teste falha temporária do provedor, retry e reconciliação sem envio duplo.
- Teste dois tenants com o mesmo telefone.
- Compare contagens por estado antes e depois de qualquer saneamento.

## Critérios de conclusão

Considere pronto quando cada intenção gerar no máximo uma pendência ativa, cada encerramento tiver uma causa rastreável e nenhum caminho puder enviar mensagem obsoleta ou interna ao cliente.
