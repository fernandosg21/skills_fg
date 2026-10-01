# Evidências do Memora

Auditoria de código/documentação em 01/10/2026. Responsável: Codex. Repositório fonte: `fernandosg21/memora-system`, HEAD local `9e300c0f18e2c81f62ce74b633124edc2f8f5d89`. Repositório da skill: `fernandosg21/skills_fg`, pasta `build-photography-finance`.

O [índice de fontes e hashes](evidence-index.json) registra os arquivos usados no retrato. Eles são localizadores/evidências; não precisam existir no projeto alvo. Os contratos de replicação estão nas demais referências, sem dependência de acesso ao checkout do Memora.

## Onde estão as autoridades

| Capacidade | Fontes auditadas |
|---|---|
| Guia/entrega | `AGENTS.md` (Financeiro), `docs/ajuda/sistema/financeiro.md`, `docs/blog/base-conhecimento-financeiro-contratos.md`, `includes/update_stories.php` |
| Caixa derivado | `adm/includes/financeiro_extrato_service.php`: memoraFinanceiroExtratoLoad; `includes/financeiro_helpers.php`: pagamentos/sync/recalcular/baixa_sem_caixa |
| Dashboard/período | `adm/api/dados_financeiro.php`, `adm/financeiro.php` |
| Saldo por conta | `adm/includes/financeiro_saldos.php`, `adm/api/financeiro_saldos.php`, `includes/financeiro_bank_accounts.php` |
| Conta no movimento | `adm/api/financeiro_extrato_conta.php` e `adm/financeiro_extrato.php` |
| Escopo | `adm/includes/financeiro_scope.php`, `includes/financeiro_bank_accounts.php`, `includes/admin_permissions.php`, `adm/includes/auth.php` |
| Ajuste manual | `includes/financeiro_ajustes_caixa.php`, `adm/api/financeiro_ajustes_caixa_crud.php` |
| Contas/recebimento | `adm/api/contas_receber_listar.php`, APIs avulsa salvar/marcar_recebido/excluir, `adm/contas_receber.php` |
| Parcelas/desconto | `adm/api/registrar_pagamento_parcela.php`, `confirmar_parcela.php`, `pagamento_parcial_parcela.php`, `listar_pagamentos_evento.php`, `desfazer_baixa_parcela.php`, `excluir_pagamento_parcela.php` |
| Reagendamento/edição | `adm/api/reagendar_parcelas_evento.php`, `editar_parcela.php`, `includes/financeiro_helpers.php` |
| Sinal/conversão | `includes/financeiro_helpers.php`: memoraSyncReservaSinalFinanceiro/memoraNormalizeReservaSinalConvertedEvento |
| Crédito cliente | `includes/cliente_credito.php`, `adm/api/cliente_credito.php`, avulsa salvar/marcar_recebido/excluir, `adm/evento.php` |
| Contas a pagar | `adm/api/contas_pagar_listar.php`, `contas_pagar_salvar.php`, `contas_pagar_marcar_pago.php`, `contas_pagar_excluir.php` |
| Equipe/saldo real | `includes/freelancer_settlement_read.php`: memoraFreelancerContaPagarBaixasResumoSql; `adm/api/freelancer_acerto_baixa.php`, `freelancer_credito_usar.php`, `pagamentos_equipe.php` |
| Acertos/resumos | `adm/api/financeiro_acerto_freelancer.php`, `financeiro_acerto_valores.php`, `financeiro_acerto_recreacao.php`, `adm/acertos_equipe_resumo.php` |
| Automáticos/evento | `adm/includes/financeiro_auto_custos.php`: memoraAutomaticPayableUpsert, memoraSyncAutomaticEventCosts, memoraFetchEventoFinancialSummary |
| Álbum | Mesmo helper: memoraAlbumPedidoEnviado, memoraSyncAlbumCostForEvent, memoraCpPrevistoExcluirSql |
| Extras/deslocamento | Mesmo helper: memoraSyncServiceUpsellReceivablesForEvent, memoraSyncEventoDeslocamentoReceivable, memoraContractMirrorReceivableExclusionSql |
| Recorrência | `adm/includes/financeiro_recorrentes.php`, `adm/api/financeiro_recorrentes.php` |
| Salário | `adm/includes/financeiro_salario_pagamentos.php`, `financeiro_salario_ajustes.php`, `adm/api/salario_pagamentos.php`, `salario_ajustes.php` |
| DRE | `adm/api/dados_dre.php`, `adm/dre.php`, `adm/api/export_dre.php` |
| Retirada | `adm/includes/financeiro_retiradas.php`, `adm/api/retirada_lucro_salvar.php`, `retirada_lucro_listar.php` |
| Relatório/previsão | `adm/api/dados_relatorio_financeiro.php`, `dados_previsao_faturamento.php`, `includes/forecast_engine.php` |
| Precificação/ponte | `includes/pricing_engine.php` e a skill `build-photography-pricing-engine` existente no skills_fg |
| Asaas de eventos | `includes/AsaasEventIntegration.php`, `adm/api/asaas_eventos_cobrancas.php`, `integracoes_asaas.php`, `api/asaas_eventos_webhook.php` |
| Cancelamento | `includes/financeiro_helpers.php`: memoraCancelPendingEventFinancials; `adm/api/cancelar_evento.php`, `atualizar_status_evento.php` |
| Cadastros/IA | APIs `financeiro_categorias_crud.php`, `financeiro_fornecedores_crud.php`, `financeiro_contas_bancarias_crud.php`, `sugerir_categoria_conta.php`; `adm/includes/financeiro_categorias_seed.php` |
| Exports | `adm/includes/financeiro_export.php`, APIs export_financeiro_extrato/export_contas_pagar/export_contas_receber/export_parcelas/export_dre |

## Entrega registrada e limites

| Item | Estado evidenciado no retrato |
|---|---|
| Financeiro principal, contas, bancos, DRE, salário/acertos, previsto/firme | Implementados nas autoridades e documentados no produto; paridade por leitura de código. Esta tarefa não operou banco de produção. |
| Crédito de cliente | Publicação funcional/editorial registrada em 24/09; aplica em parcela de evento. Aplicação/estorno real em produção não foi homologado nesta tarefa. |
| Taxas cartão/antecipação | Correção publicada em 23/09; há registros de conciliação individual e pendências históricas. Não assumir todas as taxas históricas conciliadas. |
| Contratado versus recebido/previsão temporal | Correções/regras registradas em 13/09; código atual conserva seleção temporal, confiança e piso. |
| Editor interno/pessoal | Ajuda de 25/09 declara refinamentos em preparação/piloto e falta de conferência autenticada. Fonte local não prova publicação. |
| Resumo de acertos/Mia | Resumo administrativo e integração de leitura registrados; escopo e habilitação da IA dependem da conta. Não é autorização para IA alterar/pagar. |

Registros antigos podem dizer “local/preparação” antes de uma publicação posterior. Use a evidência mais recente do mesmo item, sem misturar estados de funcionalidades diferentes. `AGENTS.md` também contém histórico de incidentes; IDs/valores de clientes não foram copiados para a skill.

## Diferenças e limites do legado

1. Extrato canônico é derivado; DRE não é simples soma dele. Provisão atual de contas é automática, e receitas recorrentes podem ser projetadas.
2. Distribuição sai do banco sem ser despesa operacional; ajuste manual está no caixa sem integrar automaticamente o DRE.
3. Compromissos de retirada usam valor bruto das contas pendentes, podendo diferir do saldo líquido da equipe.
4. Código legado usa DECIMAL persistido com cálculos PHP float, garantias de schema no request, backfills e envelopes variados. Melhorias de infraestrutura no alvo são documentadas, sem atribuí-las falsamente ao Memora entregue.
5. Nenhum documento/fixture substitui verificação externa, sessão autenticada, prova de integração atual ou autorização para modificar histórico.

## Regressões de origem úteis

`scripts/test_cliente_credito.php`, `test_cliente_credito_ui.cjs`, `test_asaas_fee_reconciliation.php`, `test_asaas_parcela_recriada.php`, `test_asaas_link_descricao.cjs`, `test_financeiro_bank_scope.php`, `test_financeiro_extrato_filtros.cjs`, `test_forecast_engine.php`, `test_pricing_engine.php`. Reconciliações históricas existem em scripts administrativos; não executá-las em produção para testar uma skill.

Esses nomes indicam o que verificar no checkout fonte. Não são dependências da skill. Os cenários portáteis em assets e o comparador em scripts podem ser usados no projeto alvo. O [engine de previsão de referência](../assets/forecast-engine-memora.php) é uma cópia do arquivo puro indicado no índice, para portar cálculos com precisão; não contém bootstrap, banco, rede ou configuração do estúdio.
