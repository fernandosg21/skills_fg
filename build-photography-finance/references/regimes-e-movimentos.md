# Regimes e movimentos

## Contrato normalizado de movimento

```text
tenant_id
movement_id
source_type
source_id
occurred_on
direction: entrada | saida
amount_cents
bank_account_id
description
counterparty
status
```

O movimento normalizado pode ser uma projeção de várias tabelas. Evite duplicá-lo só para alimentar cada relatório.

## Matriz de inclusão

| Item | Extrato de caixa | Saldo bancário | DRE | Previsão |
|---|---:|---:|---:|---:|
| Recebimento confirmado | sim | sim | conforme regime | sim |
| Conta paga | sim | sim | sim | sim |
| Conta pendente firme | não | não | provisão | sim |
| Custo previsto ativo | não | não | subconjunto de provisão | sim |
| Baixa sem caixa | não | não | conforme natureza | pode afetar saldo da obrigação |
| Ajuste manual | sim | sim | política explícita | não necessariamente |

Adapte a matriz à contabilidade do produto, mas não deixe a inclusão implícita.

## Invariantes de reconciliação

- `saldo_final = saldo_anterior + entradas - saídas` por conta.
- `saldo_obrigação = valor_original - aplicações_ativas + estornos_ativos`.
- Um movimento automático tem no máximo uma linha ativa por chave de origem.
- Um pagamento parcial nunca transforma o saldo restante em zero por arredondamento.
- Uma baixa sem caixa não altera conta bancária.
- Um estorno não pode ultrapassar o valor aplicado.

## Datas diferentes

Documente pelo menos:

- data econômica/competência;
- vencimento;
- data de pagamento;
- data de conciliação;
- data de criação.

Escolher uma delas silenciosamente é uma fonte comum de divergência entre DRE e extrato.
