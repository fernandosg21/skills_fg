---
name: schedule-reliable-whatsapp-messages
description: "Implemente ou audite mensagens proativas agendadas no WhatsApp com fila persistente, aprovação opcional, timezone, templates, opt-out, deduplicação, claim concorrente, outbox, retry, reconciliação e Evolution API ou outro provedor. Use quando programar lembretes de pagamento, check-in de evento, aviso de entrega ou diagnosticar mensagens duplicadas, atrasadas ou presas."
---

# Agendar mensagens confiáveis no WhatsApp

## Objetivo

Faça o agendamento representar uma intenção persistida e recuperável, não um timer do navegador. Garanta que concorrência, timeout e múltiplos disparadores não gerem envio duplicado.

## Mapear o caminho inteiro

1. Identifique criação manual, automações, aprovação, cancelamento, worker, provedor, webhook/eco e histórico da conversa.
2. Defina timezone do tenant e semântica de horário de verão.
3. Classifique cada origem e sua chave natural de deduplicação.
4. Leia [fila-e-reconciliacao.md](references/fila-e-reconciliacao.md).
5. Mapeie opt-out, horário permitido, limites e política do canal antes de habilitar envio.

## Modelar a intenção

- Persista tenant, destinatário canônico, corpo/template versionado, horário UTC, timezone original, origem e contexto.
- Separe status operacional de aprovação.
- Guarde tentativas, próximo retry, lease, provider ID, erro sanitizado e timestamps terminais.
- Use chave idempotente única por tenant e intenção lógica.
- Não vincule destinatário apenas por telefone; mantenha IDs de cliente/evento quando existirem e confirme ownership.

## Controlar aprovação

- Faça a política explícita por origem: aprovação obrigatória, automática autorizada ou proibida.
- Uma mensagem pendente nunca pode ser selecionada pelo worker.
- Registre aprovador, instante e versão do conteúdo aprovado.
- Editar conteúdo depois da aprovação deve invalidá-la ou criar nova versão.
- Cancelamento antes de sending impede novos claims; envio em voo segue para reconciliação e nunca é simplesmente esquecido.

## Criar automações idempotentes

- Dê a cada automação um source estável, como event_checkin ou payment_reminder.
- Derive uma chave com tenant, entidade, tipo e marco temporal.
- Faça o produtor convergir por upsert seguro ou detectar a intenção existente.
- Ao reagendar a entidade, cancele/substitua somente mensagens ainda não entregues.
- Revalide estado do evento, pagamento ou entrega imediatamente antes de enviar.
- Não envie lembrete de obrigação já quitada ou evento cancelado.

## Processar com concorrência segura

1. Selecione mensagens vencidas, aprovadas e elegíveis.
2. Faça claim atômico com lease/fencing; limite o lote.
3. Recarregue opt-out, estado do contexto, conexão e limites.
4. Crie ou obtenha outbox antes do I/O externo.
5. Envie com chave idempotente quando o provedor suportar.
6. Classifique o resultado como entregue/aceito, falha definitiva, falha transitória ou desconhecido.
7. Persista o resultado e libere lease em finally.

Múltiplos crons, heartbeats ou chamadas manuais podem acionar o mesmo processador, mas nunca implementar processadores paralelos com regras diferentes.

## Tratar resultado desconhecido

- Timeout depois do request não significa que nada foi enviado.
- Antes de retry, consulte provider ID, webhook, eco/outbound e outbox.
- Se não houver prova, mantenha estado unknown e reconcilie.
- Nunca crie uma nova intenção apenas para destravar uma antiga.
- Marque dead letter somente depois da política de tentativas e preserve ação manual segura.

## Manter inbox e auditoria coerentes

- Registre o outbound entregue na mesma conversa e histórico usados pelo atendimento.
- Marque source como automação para que o eco não pare o agente como se fosse humano.
- Não salve tokens, headers ou payloads brutos do provedor em logs.
- Exponha diagnóstico por mensagem e fila: elegibilidade, bloqueador, última tentativa, lease e próximo passo.
- Mantenha ferramentas de processar/enviar escondidas da UI comum ou protegidas por autorização reforçada.

## Entregar UX operacional

- Permita escolher cliente, evento ou número manual sem habilitar campos de modos diferentes ao mesmo tempo.
- Normalize números locais conforme o país do tenant e preserve números internacionais explícitos.
- Mostre horário local e timezone; persista UTC.
- Atualize lista, aprovação e cancelamento por Ajax.
- Diferencie pendente de aprovação, agendada, enviando, enviada, falhou, cancelada e aguardando reconciliação.

## Validar sem enviar de verdade

- Teste o worker com adapter fake e relógio controlável.
- Cubra duplo clique, dois workers, lease expirado, timeout após aceite e webhook fora de ordem.
- Teste opt-out após agendamento, evento cancelado, pagamento quitado e mensagem editada após aprovação.
- Teste horário de verão, timezone diferente do servidor e agendamento no passado.
- Confirme isolamento entre tenants com o mesmo telefone/context ID.
- Só execute worker contra provedor real quando o usuário autorizar mensagens reais.

## Critérios de conclusão

Considere pronto quando toda intenção tem chave idempotente, somente mensagens autorizadas e ainda válidas chegam ao provedor, e estados desconhecidos são reconciliados antes de qualquer retry.
