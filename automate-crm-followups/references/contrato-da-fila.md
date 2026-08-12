# Contrato da fila de follow-ups

## Chave idempotente

Derive a chave com componentes estáveis, por exemplo:

`tenant | tipo | oportunidade | lead/cliente | evento | ciclo`

Inclua evento em follow-ups pós-evento. Inclua o ciclo anual em recorrências. Não use texto da mensagem como identidade.

## Estados

| Estado | Significado |
|---|---|
| pendente | Ainda exige ação |
| enviado | A ação externa foi confirmada |
| respondido | O destinatário respondeu e encerrou a espera |
| ignorado | O sistema ou operador concluiu que não se aplica |
| cancelado | Um envio agendado foi explicitamente revogado |

Mapeie os estados existentes em vez de renomeá-los sem migração.

## Ordem antes do envio

1. Trave ou reivindique o item de forma atômica.
2. Releia o estado atual do negócio.
3. Verifique opt-out e direção da última mensagem.
4. Confirme que não existe envio equivalente aceito.
5. Grave a intenção na outbox.
6. Envie fora da transação longa.
7. Reconcilie recibo e estado do follow-up.

## Matriz de cancelamento

| Sinal | Ação comum |
|---|---|
| Cliente respondeu | Marcar retomadas compatíveis como respondidas |
| Negócio fechado | Ignorar retomadas comerciais abertas |
| Evento cancelado | Ignorar pós-evento e avisos dependentes |
| Opt-out | Cancelar mensagens externas; preservar histórico |
| Tarefa interna concluída | Concluir sem criar mensagem externa |
