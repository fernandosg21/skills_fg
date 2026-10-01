# Equipe, salários e custos

Retrato de 01/10/2026. Responsável: Codex.

## Contas a pagar e geração mensal

Conta: valor, descrição, fornecedor/categoria, evento opcional, vencimento, estado pendente/pago/cancelado, data de pagamento, método, conta, origem/chave, automática, previsto e proprietário. Vencido é pendente com vencimento anterior, não um novo pagamento.

Cadastro de conta pode criar uma sequência mensal finita agrupada por recorrencia_grupo. Isso é diferente do modelo de Contas Fixas e Salários, que projeta competências. Preserve ambas as funções sem gerar conta duplicada para uma projeção já materializada.

No caminho atual, a sequência vai de 2 a 36 ocorrências; só a primeira herda situação/data de pagamento, as seguintes nascem pendentes. Editar uma ocorrência não propaga ao grupo. O incremento legado usa DateTime +1 month, que pode avançar para março ao partir de dia 31; se o alvo corrigir para último dia de fevereiro, registre a divergência. O modelo de recorrência por competência já limita o dia ao fim válido do mês.

Pagar conta registra realização; pagar álbum efetiva previsão. Editar/excluir precisa respeitar origem automática, pagamentos/aplicações e vínculos; cadastro de fornecedor em uso não pode desaparecer como se não tivesse histórico. A previsão ativa fica fora da lista/KPI/export de dívida firme em todas as abas, inclusive Todos.

## Equipe e acertos

Custo por contratação/função gera conta a pagar com origem/chave estáveis, fornecedor e snapshot. Equipe não deve mudar custos pagos a cada sync. Pagamentos de Equipe apresenta contratado, pago, saldo pendente, saldo vencido e quantidade de serviços; acerto avulso participa do pago sem esconder serviço aberto. Preserve Pix e detalhes na hora de pagar.

| Tipo de baixa | Liquida serviço | Move caixa do estúdio | Excedente |
|---|---|---|---|
| pagamento_estudio | sim, inclusive parcial | saída na data/conta | adiantamento em caixa |
| cliente_direto | sim, por aplicações | não | crédito sem caixa mediante escolha explícita |
| adiantamento | ainda sem serviço | saída uma vez | fonte consumível |
| adiantamento_aplicado | sim | não, dinheiro saiu antes | reduz fonte |
| crédito cliente aplicado (`cliente_direto` + `origem_baixa_id`) | sim conforme crédito de origem | não | reduz fonte `credito_cliente` |

Contas podem continuar tecnicamente pendentes enquanto a liquidação mora no ledger de baixas. O resumo canônico soma baixas ativas `cliente_direto`, `pagamento_estudio`, `adiantamento_aplicado` vinculadas à conta, derivando o saldo. Não marcar conta paga novamente para fabricar uma segunda saída. Se a conta já é paga, a fonte do extrato/DRE precisa ficar disjunta do ledger.

No esquema atual, `credito_cliente` identifica a fonte, não uma baixa liquidante. Seu uso gera `cliente_direto` com `origem_baixa_id`; uso de adiantamento gera `adiantamento_aplicado`. Não criar o tipo literal `credito_aplicado` sem adaptar todos os agregadores e consumidores: esse tipo não existe na autoridade auditada. Um alvo com tipos diferentes deve mapear fonte, aplicação e consumo explicitamente.

No pagamento do estúdio, a aplicação cobre a fila de serviços escolhidos; excedente vira adiantamento vinculado ao profissional. Ex.: dívida 600, paga 750 → serviço liquidado 600 + adiantamento 150; saída total 750, não 1.350.

Cliente direto é uma liquidação não financeira do estúdio. O fluxo abate dívidas do profissional (inclusive serviços antigos conforme a fila) e pode abater parcelas do cliente do evento de referência com baixa_sem_caixa. A sobra exige decisão de guardar como crédito, não consumo silencioso. Histórico mostra origem/eventos/aplicações; desfazer reabre os saldos e remove o crédito dependente conforme integridade.

Crédito e adiantamento têm saldo derivado das aplicações ativas. Para salário e serviço disputando o mesmo adiantamento, os dois caminhos travam a mesma fonte e consideram **consumo em ambos**. Não reutilizar a sobra duas vezes nem tratar baixa de crédito como nova saída.

Espelho de receita do freelancer em outra conta/pessoa usa vínculo verificado e chave contendo tenant de origem. IDs de evento de uma empresa não são válidos automaticamente na outra. Não revelar conta Asaas PJ, saldo global, outros clientes ou Pix de colegas pela leitura pessoal. Funcionalidade de editor interno está sujeita ao estado piloto/local descrito nas evidências.

## Recorrências e salários

Modelo recorrente: tipo salario/custo_fixo/outro, natureza entrada/saída, valor, dia de vencimento, intervalo início/fim, ativo, categoria, fornecedor/beneficiário, conta/método e vínculo de usuário quando aplicável. Dia 29–31 ajusta para o último dia válido no mês da competência.

Administrador pode configurar entradas/saídas e salários. Papel pessoal editor não cria salário próprio nem entrada recorrente; consulta o vínculo e administra somente despesas pessoais autorizadas. Ajustes de salário continuam sob autoridade do estúdio.

Salário líquido da competência = base + gratificações − descontos. Ajustes podem ser pontuais ou recorrentes, com vigência. Valor de ajuste projetado no histórico não comprova que foi pago/aplicado.

Pagamento de salário tem recorrente, competência YYYY-MM, data efetiva, valor, tipo caixa/credito, conta quando caixa, autor, observação, request_uid e estado ativo. Releia líquido e total pago sob lock. Caixa cria uma única conta paga espelho (`origem=salario`); crédito abate sem criar saída. Pode usar adiantamento já pago ao freelancer, com referência de origem.

Permite fracionar e exceder o líquido, explicitando adiantamento. Resumo mostra pago em dinheiro, baixado por crédito, total, restante/quitado e excedente. Retry do request_uid não repete o lançamento. Desfazer inativa o lançamento, desfaz seu espelho de caixa e libera o consumo da fonte, preservando trilha.

No DRE: base/ajustes projetam provisão na competência; aplicações caixa+crédito reduzem a provisão até o líquido. Caixa já entra por data do pagamento. Nunca deduplicar salário fracionado como se fosse uma conta de valor idêntico ao modelo. Pagamento em outubro de salário de setembro reduz provisão de setembro e movimenta caixa em outubro.

Despesas recorrentes usam dedup legado por categoria+valor+mês e **consumo de ocorrência**: uma conta não elimina dois modelos idênticos. No alvo, vínculo explícito modelo/competência é preferível, mas precisa manter os mesmos totais e uma migração documentada.

## Álbum previsto e firme

Previsão ativa = previsto=1 AND status=pendente. Participa do custo do evento, provisão do DRE e compromissos prudentes; não participa da dívida firme, vencidos, próximos pagamentos e avisos. `custo_album_previsto` é só recorte.

Efetivar quando houver pedido enviado/pronto/entregue **com número de pedido**, quando o operador confirmar pedido externo, ou quando pagar. Não efetivar só por status ilegível/fallback da captura SIGI.

Na efetivação: marque previsto_efetivado_em, resolva fornecedor da encadernadora e use data do envio como vencimento. Depois congele valor/vencimento segundo o compromisso. Regressão de status, cancelamento do card ou desfazer baixa não volta para previsão; o compromisso pode existir fora do sistema.

Sincronização deve cobrir todos os caminhos: avanço do pedido, salvar envio, captura de integração e edição do pedido. Custo já pago não é recalculado em backfill; histórico é reconciliado por conta/tenant, com dry-run e autorização.

## Resultado do evento e automações

Somar equipe+álbum+Asaas+outros uma vez. Separar custo pago, pendente e previsto. Receita = contrato + somente extras/deslocamento ainda não incluídos. Liquidação de cliente direto/crédito pode aumentar valor liquidado sem criar dinheiro; declare isso no resultado.

Cada extra/deslocamento/custo personalizado tem identidade e chave de origem. Upsert preserva estado pago, snapshot e efetivação; remoção de linha automática não apaga dinheiro histórico. Cancelar evento cancela pendências e mantém realizados; excluir evento exige regras próprias de integridade.
