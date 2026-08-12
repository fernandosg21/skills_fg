# Fórmulas e cenários

## Núcleo sugerido

```text
horas_vendaveis = horas_disponiveis * taxa_utilizacao
custo_hora = custos_fixos_mensais / horas_vendaveis
custo_trabalho = custo_hora * horas_do_evento
custo_base = custo_trabalho + custos_diretos
preco_tecnico = custo_base / (1 - aliquota_imposto - taxa_pagamento - margem)
```

Se taxas incidem de forma diferente, modele a ordem explicitamente e cubra com fixtures.

## Guardas

- `horas_vendaveis > 0`.
- Todos os valores monetários são não negativos, salvo ajustes declarados.
- `0 <= imposto, taxa, margem < 1`.
- A soma das parcelas do denominador deve ser menor que 1.
- Custos diretos não entram também nos custos fixos rateados.

## Cenário de regressão

```text
custos_fixos = 6.000,00
horas_vendaveis = 120
custo_hora = 50,00
horas_evento = 10
custos_diretos = 500,00
imposto = 6%
taxa = 4%
margem = 20%
custo_base = 1.000,00
preco_tecnico = 1.428,57
```

Use este cenário apenas como teste matemático, não como recomendação de preço.

## Pacotes

Componha cada pacote a partir de:

- esforço interno;
- custos diretos específicos;
- limites/entregáveis;
- impostos e taxas;
- margem-alvo;
- arredondamento comercial.

Não derive pacote premium apenas multiplicando o pacote básico sem recalcular custos e capacidade.
