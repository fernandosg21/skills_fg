# Modelo e transições do evento

## Entidades mínimas

| Entidade | Papel |
|---|---|
| evento | Agregado operacional e vínculo com cliente |
| evento_snapshot_comercial | Termos aceitos que não mudam com o catálogo |
| evento_status_history | Transições e responsável |
| evento_reagendamento | Datas anterior/nova e opções aplicadas |
| parcela | Obrigação financeira do cliente |
| evento_equipe | Profissional, função, convite e custo |
| evento_extra | Receita/custo adicional com estado próprio |
| evento_prazo | Entrega derivada do pacote |
| integration_outbox | Efeitos externos recuperáveis |

Adapte nomes ao projeto. Não colapse essas responsabilidades apenas porque um legado usa uma tabela larga.

## Máquinas de estado

Evento:

pendente -> confirmado -> concluído

Saídas controladas para cancelado. Uma reserva pode ser promovida a confirmado, mas deve manter a origem da reserva.

Contrato:

nao_gerado -> rascunho -> gerado -> enviado -> assinado

Saídas possíveis: dispensado, cancelado ou substituido, conforme o domínio. O contrato assinado é artefato histórico; reagendar não o reescreve silenciosamente.

Extra:

proposto -> confirmado -> recebido

Saídas para cancelado ou estornado, com eventos financeiros correspondentes.

## Snapshot comercial

Congele no evento:

- identificador e nome do pacote;
- itens inclusos com quantidade e unidade;
- duração e cobertura;
- valor bruto, desconto, deslocamento e valor final;
- forma e plano de pagamento;
- álbum, impressões e prazos contratados;
- versão da moeda e regra de arredondamento.

## Matriz de efeitos

| Ação | Dentro da transação | Depois do commit |
|---|---|---|
| criar | evento, snapshot, parcelas base | calendário, notificações, follow-ups |
| promover reserva | estado e histórico | CRM, cobrança, convites |
| reagendar | data e histórico | calendário, equipe, prazos, fila de mensagens |
| cancelar | estado e política financeira | cancelar cobranças/jobs, avisar interessados |
| concluir | estado e data | pós-evento, entrega, pesquisa/recorrência |

Use outbox com chave como evento:id:acao:versao para tornar efeitos repetíveis.

## Invariantes

- Reserva não entra como venda fechada.
- Valor pago nunca é inferido apenas pela forma de pagamento.
- Parcela paga não muda por reagendamento.
- Catálogo atualizado não altera contrato/evento histórico.
- Cada mutação por ID confirma o tenant.
- Relatório financeiro soma fatos uma vez, mesmo com várias equipes ou parcelas.
- Falha externa não desfaz o evento local nem autoriza duplicar o efeito.
