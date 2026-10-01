# Parcelas, clientes e Asaas

Retrato de 01/10/2026. Responsável: Codex. Leia também [regimes-e-movimentos.md](regimes-e-movimentos.md).

## Cronograma e recebimento

Separe contrato/evento, parcelas, pagamentos e aplicações sem caixa. Parcela tem número/total, valor devido, vencimento, estado e saldo derivado; pagamento tem valor, data efetiva, método, conta, autor e origem.

Estados internos: `pendente`, `atrasado`, `pago`, `cancelado`. Parcialidade é saldo/pagamentos, não exige inventar estado incompatível. Aberto = pendente ou atrasado. Nunca use `status != pago` para saldo aberto.

As formas de pagamento comuns e o cronograma personalizado geram parcelas que fecham o total canônico: pacote final + deslocamento + extras efetivamente incluídos. Distribua arredondamento sem perder centavos. Pagamento personalizado não permite que sync altere valores livremente quando a soma diverge.

No recebimento, valide tenant/evento/parcela, evento ativo, data válida, valor positivo, saldo atual e conta ativa/autorizada. Trave e releia antes de gravar. Crie pagamento e derive parcela/evento no mesmo commit. Não dê quitação usando só o status sem registrar dinheiro/aplicação. Registre cada pagamento parcial separadamente.

Se o evento não tiver parcelas, o fluxo manual pode criar uma parcela de referência. Se já tiver, o usuário escolhe uma existente. Reconciliação de valores históricos já informados exige cuidado para não recontar caixa.

Baixas podem ser desfeitas/excluídas por caminhos próprios; a parcela/evento deve ser recalculada. Desfazer uma liquidação não equivale a autorizar um reembolso real do provedor. Faça compensação/auditoria conforme a autoridade original; não prometa estorno de desconto automático por excluir um pagamento.

## Desconto na parcela

- `recebido + desconto <= saldo atual`; ambos não negativos; ao menos um positivo.
- Desconto reduz `valor_parcela` e `eventos.valor_final`; preço cheio em `valor_original` e nota permanecem.
- Desconto não pode reduzir o valor total da parcela a zero. Pode, porém, fechar um saldo remanescente de parcela já parcialmente paga.
- Somente desconto, com recebido zero, não cria `pagamentos_parcela` e não exige conta bancária.
- Sem parcela, o lançamento manual do evento não aceita desconto. Cobrança Asaas aberta bloqueia desconto até resolução; inclui PENDING/OVERDUE/AWAITING_RISK_ANALYSIS no caminho auditado.

Exemplo sintético: parcela original 1.000, já pagos 200; novo recebido 700 + desconto 100 → devido 900, liquidado 900, saldo 0, caixa total 900 e desconto 100. Não crie pagamento de 100 para o desconto.

## Reagendamento depois da assinatura

Pode mudar vencimento de parcela aberta mesmo com contrato emitido/assinado. Não altera valor, pagamentos, total, cliente nem contrato. UI pode deslocar seguintes pelo mesmo número de dias; backend valida cada item e ignora mudanças inexistentes.

O Memora confirma as datas localmente em transação e sincroniza Asaas **após commit**, retornando avisos. Falha remota não deve ser apresentada como sincronização completa. Proteja pago/cancelado e atualize atrasado/pendente, listas e avisos.

## Reserva e sinal

Sinal recebido pertence ao caixa da data do recebimento. Conversão da reserva em contrato preserva o pagamento e abate o sinal, sem registrá-lo novamente. Reconheça reservas duplicadas com decisão explícita; uma reserva com dinheiro já recebido não é descartada silenciosamente. Reordenar/recriar cronograma mantém baixas e referências do provedor.

Parcela excluída/recriada não libera um webhook antigo para criar outra entrada. Verifique espelho, vínculo ao evento e estado da cobrança; não autorize reuso de uma referência somente porque o ID local mudou.

## Avulsas e crédito de cliente

Receita avulsa tem descrição, valor, vencimento, estado pendente/recebido/cancelado, recebimento, categoria, cliente opcional, conta, origem/chave e escopo financeiro. Recebidas são filtradas pela data do recebimento; abertas pelo vencimento. Lista, KPI e export devem declarar o mesmo período/aba.

Fonte de crédito: **manual, já recebida, do estúdio, cliente válido e marca credito_cliente**. Saldo disponível = valor recebido − aplicações vinculadas. Fonte continua no extrato e DRE na data original. Não importe o histórico de uma avulsa para outro mês só porque ela foi usada como crédito.

Aplicação é administrativa, na parcela de evento do **mesmo cliente e tenant**, até o menor entre saldo da fonte e da parcela. Destino avulsa não participa do fluxo atual. Valide evento/estado e cobrança aberta. Grave `metodo=baixa_sem_caixa`, origem da avulsa e conta nula; recalcule parcela/evento. Não some a aplicação aos novos recebimentos do caixa/KPI.

Ordem de trava auditada: fonte → parcela → pagamento da aplicação (ao desfazer). Confirme cliente, origem, recebido e saldo depois do lock. Em duas requisições concorrentes, a soma não pode exceder a fonte ou a dívida.

Depois de consumo, bloquear mudança de cliente/valor/estado, remarcação do recebimento e exclusão da fonte até desfazer. Desfazer remove/reverte somente a aplicação vinculada, devolve saldo e reabre o devido, sem nova movimentação de banco.

## Asaas do cliente do estúdio

Configuração é tenant-scoped: habilitação, ambiente, chave/token protegidos, conta bancária do estúdio, métodos e limite de cartão. Separar essa integração do Asaas que cobra assinatura do SaaS. Nunca expor segredos em DTOs ou logs da UI.

Criação de cobrança valida evento/parcela, saldo e configuração; usa espelho com chave externa/vínculo. Descrição identifica evento, cliente, data da festa e parcela. Links antigos mantêm sua descrição; não modificar histórico para parecer atualizado.

Para cartão contratual parcelado, existe **uma parcela interna pelo saldo total**; Nx é a opção do provedor. Não gerar/reusar o novo link sobre cronograma legado com várias parcelas abertas. Preserve cronogramas legados pagos e exija decisão de transição.

Webhook valida token e identifica tenant/espelho pelas relações reais. Retry/out-of-order não duplicam pagamento ou taxa, não reabrem cancelado e não mudam para pago pela simples visita ao link. Preserve ID do pagamento/grupo, método, bruto, líquido, taxa e datas. `Atualizar Asaas` reconcilia os dados externos; não é botão de quitação presumida.

Depois da confirmação, desativar o link de uso único para impedir outro pagamento, preservando o recebimento. Resolver estados transitórios e falhas por retry/reconciliação; não apagar pagamento porque o link foi encerrado.

## Taxas e cartão antecipado

Pagamento comum: taxa = bruto − líquido confirmado. Grupo parcelado: somar **todas** as cobranças do grupo; comparar agregado com total interno; buscar antecipações por pagamento e parcelamento. Uma prestação não representa o líquido de toda a venda.

`PAYMENT_ANTICIPATED` com `netValue=value` não prova taxa zero. Dados parciais, antecipação PENDING ou ausência de líquido final → `fee_reconciliation_pending`, aviso de taxas aguardando conciliação e preservação da despesa já registrada. Não substituir por zero/estimativa.

Após confirmação integral: upsert único em categoria Taxas Asaas, origem `asaas_fee`, chave `asaas_event_payment:{mirrorId}`; líquido e taxa do espelho são do grupo. Receita do cliente permanece bruta; taxa vira saída/custo separado. Não registrar receita líquida e descontar a taxa outra vez.

Webhooks de antecipação podem localizar espelho pelo installment mesmo sem payment. Conciliação de despesas históricas já pagas exige evidência e escopo autorizado; uma correção de algoritmo não autoriza alteração em lote de registros antigos.

## Cancelamento do evento

Cancele cobranças externas abertas antes de confirmar o cancelamento local. Falha do provedor mantém o evento ativo nesse fluxo; relate quais cobranças já foram resolvidas para retry seguro. Confirme evento e pendências locais juntos; rotina idempotente muda parcelas pendentes/atrasadas e contas pendentes para cancelado. Recebido/pago permanece; cancelamento não é devolução.

Depois disso: saldo aberto, DRE/provisões, cards, avisos, previsões e exports ignoram as pendências canceladas. Histórico continua consultável, sem receber, pagar, editar/reagendar ou ressuscitar cancelado pela sincronização.
