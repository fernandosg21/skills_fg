# Estados, vínculos e custos

## Marcos de apresentação

| Marco | Estados internos possíveis |
|---|---|
| seleção | aguardando seleção, seleção em andamento |
| aprovação | diagramando, em aprovação, aprovado |
| encadernação | enviado à encadernadora, pronto |
| entrega | entregue |

Mantenha o enum/estado real do projeto. O agrupamento serve à interface e aos relatórios.

## Precedência de vínculo

1. `proof_project_id` exato.
2. Evento exato com slot de projeto livre.
3. Inserção nova.

Nunca escolha por cliente+nome com `LIMIT 1` quando houver mais de um candidato.

## Sinais de efetivação do custo

- envio à encadernadora confirmado e número do pedido presente;
- ação administrativa “marcar como pedido”;
- pagamento real da obrigação.

Depois de efetivado, registre `firmed_at` e preserve o compromisso mesmo que a UI volte um estado.

## Datas

| Data | Uso |
|---|---|
| criado em | auditoria, não prazo do fornecedor |
| seleção concluída | liberar diagramação |
| enviado para aprovação | prazo do cliente, se houver |
| enviado à encadernadora | início do prazo do fornecedor e vencimento do custo |
| ficou pronto | medir SLA da encadernadora |
| entregue | encerrar produção |

## Tombstone

Grave tenant + external project/order ID + motivo + ator + data. A reconciliação consulta o tombstone antes de recriar um pedido removido conscientemente.
