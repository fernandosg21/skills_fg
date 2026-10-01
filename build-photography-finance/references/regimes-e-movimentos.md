# Regimes e movimentos

Retrato de 01/10/2026. Responsável: Codex. O Memora deriva o financeiro de várias autoridades; não exige um livro-razão único. No alvo, um ledger unificado é possível se preservar os contratos abaixo.

## Movimento normalizado

```text
tenant_id, finance_owner_user_id (nulo = estúdio)
movement_id, source_type, source_id, source_key
occurred_on, direction (entrada|saida), amount_cents, signed_amount_cents
bank_account_id (nulo = Sem conta), description, counterparty, status
```

Identidade é tenant + proprietário + fonte, nunca só ID. Origem e IDs técnicos permanecem; labels podem ser humanizados. Preserve valor assinado: devolução/estorno negativo de receita reduz entradas; `abs()` não pode criar receita positiva.

## Autoridades de caixa

| Fonte | Data/condição | Exclusão essencial |
|---|---|---|
| Pagamento de parcela | `pagamentos_parcela.data_pagamento`; método financeiro | `baixa_sem_caixa` não entra; parcela paga sem log não vira entrada presumida. |
| Avulsa recebida | recebimento (fallback legado documentado para vencimento) | Pendentes/canceladas e espelhos incluídos no contrato. |
| Conta paga | pagamento (fallback legado documentado para vencimento) | Pendente/cancelada; não recontar baixas de equipe. |
| Pagamento de equipe/adiantamento | baixa ativa, `pagamento_estudio|adiantamento`, data_baixa | `cliente_direto` (inclusive aplicação de `credito_cliente`) e `adiantamento_aplicado`; conta já paga não entra duas vezes. |
| Ajuste de caixa | data_movimentacao | Fora do escopo pessoal/sem permissão; não substituir a baixa original por ajuste fictício. |

Existem projeções pessoais de salário/ajustes no código; sua revisão para editor está em piloto/local. Não misture salário provisionado com caixa confirmado ao adaptar esse papel. Veja limites em evidencias-memora.

O serviço do extrato alimenta dashboard realizado, movimentos por conta, saldos acumulados, exports e resumo de retiradas. DRE e previsão têm regras próprias. Uma funcionalidade nova deve definir exatamente quais projeções consomem sua autoridade.

## Quatro bases de tempo

| Superfície | Base | O que mede |
|---|---|---|
| Extrato/dashboard realizado | Entrada/saída efetiva | Dinheiro movimentado no intervalo. |
| DRE gerencial | Recebimento/pagamento + provisão no vencimento/competência | Resultado híbrido gerencial, incluindo pendências automáticas e recorrências. |
| Relatório/previsão | Data do evento (`data_festa`) | Valor contratado/eventos, mesmo com dinheiro em outro mês. |
| A receber/a pagar e avisos | Vencimento para abertos; recebimento/pagamento para realizados conforme a aba | Dívida/saldo ou realizado do período, sem comparar datas implicitamente. |

Data de criação, competência, vencimento, baixa e conciliação são campos diferentes. Declare a base em título, tooltip, query e export.

## Matriz de inclusão do estúdio

| Item | Caixa/saldo banco | DRE atual | Pendências firmes | Resultado evento |
|---|---|---|---|---|
| Recebimento financeiro confirmado | sim | receita por recebimento | reduz recebível | liquidado |
| Parcela quitada por crédito/cliente direto | não | não cria receita nova | reduz recebível | liquidado, sem afirmar caixa |
| Avulsa recebida marcada crédito | sim, uma vez na origem | receita original | saldo do crédito separado | aplicação liquida destino |
| Conta paga operacional/pró-labore | sim | despesa paga | não | custo quando vinculada |
| Conta automática pendente | não | provisão pelo vencimento | sim, após abatimentos | custo |
| Conta manual pendente sem modelo | não | **não integra automaticamente a provisão no SQL atual** | sim | custo se vinculada |
| Álbum previsto ativo | não | subconjunto da provisão | não | custo previsto |
| Modelo recorrente ativo | não sem pagamento real | projeção mensal, com dedup das despesas | não cria dívida real só por projeção | conforme vínculo |
| Distribuição de lucro paga | saída | linha separada abaixo do resultado | não | não é custo do evento |
| Ajuste manual de caixa | sim | não consumido pelo endpoint atual do DRE | não | não é receita/custo contratual |
| Cancelado não pago | não | fora dos abertos/provisões | não | histórico |

Não confunda essa matriz com contabilidade oficial. Não aumente silenciosamente a cobertura do DRE ao portar: trate eventual inclusão de toda conta manual pendente como mudança de negócio documentada.

## Fórmulas e reconciliação

```text
resultado_periodo = entradas_assinadas_periodo - saidas_periodo
saldo_conta(D) = soma_assinada_do_historico_ate_D_da_conta
saldo_fim = saldo_anterior + movimentos_assinados_periodo
saldo_parcela = max(0, devido_apos_desconto - pagamentos_e_aplicacoes_validas)
saldo_equipe = max(0, valor_conta - baixas_ativas_vinculadas)
credito_disponivel = fonte_recebida - aplicacoes_vigentes
DRE.despesas = despesas_pagas + despesas_provisionadas
DRE.resultado = DRE.receitas - DRE.despesas
DRE.resultado_caixa = DRE.receitas - despesas_pagas
```

`despesas_previstas` já pertence a `despesas_provisionadas`, não entra novamente em resultado. Saldo aberto não pode ficar negativo; crédito excedente é uma entidade/posição separada. Comparação monetária do alvo deve ser exata em centavos/decimal, sem limiar flutuante arbitrário.

**Ponte entre DRE e extrato:** DRE exclui distribuição das despesas operacionais, não lê ajustes manuais de caixa e adiciona receitas recorrentes projetadas. Também limita recebimentos positivos de evento ao contrato e possui um fallback histórico de evento quitado sem log, detalhados em [relatorios-e-previsao.md](relatorios-e-previsao.md). Portanto até a chave `resultado_caixa` pode diferir do extrato; não a trate como saldo bancário universal. Reconciliação direta exige receitas com a mesma elegibilidade, dentro do teto, sem fallback, e despesas operacionais pagas. Exponha cada ajuste de ponte, inclusive pagamentos negativos ignorados pelo DRE. Piloto pessoal exige ponte própria.

## Contas e correção de vínculo

Conta deve ser ativa e pertencer ao tenant/escopo. Histórico sem banco identificado fica Sem conta; conta padrão de uma ação nova não autoriza preencher histórico. Saldo global inclui Sem conta de forma visível.

O Extrato permite ao administrador trocar somente `conta_bancaria_id` de pagamento de parcela, avulsa, conta paga e ajuste manual. Preserve valor/data/origem/ID; baixa sem caixa não aceita conta. Não generalize para todo tipo técnico, nem apresente reatribuição como transferência real entre bancos.

## Cancelamento, estorno e automações

Aberto somente pendente/atrasado (contas a pagar usam pendente com vencido derivado). Cancelado é terminal para ações normais; recebido/pago continua histórico. Estorno financeiro e cancelamento do evento são ações distintas.

Uma origem automática tem chave estável por tenant/entidade; sync é upsert, não um novo lançamento a cada abertura. Preserve snapshots/valores já pagos e custos efetivados. No alvo, gere migrações explícitas fora de transações de pagamento; não copie DDL de GETs ou backfills silenciosos como contrato obrigatório.
