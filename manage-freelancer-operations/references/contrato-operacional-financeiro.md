# Contrato operacional e financeiro

## Identidades

| Conceito | Chave recomendada |
|---|---|
| Freelancer | tenant + freelancer_id |
| Função | tenant + função_id |
| Serviço escalado | tenant + evento + membro + função |
| Confirmação | tenant + evento + membro_chave |
| Custo | tenant + serviço escalado |
| Pagamento | tenant + pagamento_id |

Use `membro_chave` como fallback compatível, por exemplo `f<ID>` para cadastrado e hash normalizado para membro nominal. Não confie apenas no nome exibido.

## Snapshot do evento

Grave no serviço escalado:

- função contratada;
- valor acordado em centavos;
- horário ou período;
- origem do valor;
- pessoa responsável;
- data da escala.

## Tipos de baixa

| Tipo | Caixa do estúdio | Saldo do profissional |
|---|---:|---:|
| Pagamento do estúdio | diminui | diminui |
| Cliente pagou direto | não muda | diminui |
| Adiantamento | diminui | cria crédito futuro |
| Estorno | desfaz o tipo original | reabre ou remove crédito |

## Ordem de alocação

Defina uma ordem estável, como vencimento, data do evento e ID. Grave aplicações separadas para permitir pagamento parcial e estorno exato.

## Reconciliação

Para cada operação, prove:

`saldo anterior - aplicações + estornos = saldo atual`

e, quando houver caixa:

`saldo bancário anterior + movimentos = saldo bancário atual`.
