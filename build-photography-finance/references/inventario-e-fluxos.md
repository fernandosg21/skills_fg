# Inventário e fluxos

Retrato de 01/10/2026. Responsável: Codex. Fontes e limites em [evidencias-memora.md](evidencias-memora.md). Use cada linha como requisito de paridade.

## Gestão financeira do estúdio

| Área | Comportamento que deve existir | Regra relacionada |
|---|---|---|
| Financeiro | Entradas, saídas, resultado, a receber/a pagar, próximos vencimentos, gráficos e movimento por conta; mês, datas ou todo histórico. | Caixa e vencimento têm bases distintas; Ajax; totais de todo o filtro. |
| Contas a Receber | Abas de parcelas e avulsas, estados, busca/filtros, recebimento/detalhes, categoria, cliente, conta, data e exports. | KPIs da aba ativa; recebidas avulsas pelo recebimento; crédito não é dinheiro novo. |
| Parcelas | Lista completa por evento, recebido, saldo e vencimento; pagamento integral/parcial, histórico, edição protegida, reagendamento e exports. | Pagamentos são autoridade; pago/cancelado protegidos; cronograma deve fechar o total. |
| Crédito de cliente | Marcar avulsa manual recebida, vincular cliente, consultar saldo, aplicar na parcela de outro evento da mesma cliente e desfazer. | Administração; sem caixa; fonte consumida protegida; resolver Asaas aberto. |
| Contas a Pagar | Despesa com categoria, fornecedor, evento opcional, vencimento, valor, conta e observação; pagar/editar/cancelar/excluir conforme origem, estados e exports. | Equipe pelo saldo após baixas; previsão de álbum fora da dívida firme. |
| Contas Fixas e Salários | Modelos de entrada/saída recorrente, início/fim, dia do vencimento, ativo, beneficiário/vínculo; salários em partes e ajustes. | Projeção mensal não prova pagamento; salário tem competência e aplicações próprias. |
| Contas Bancárias | Nome, tipo, banco, identificação, cor, observação, ativa/principal; padrão quando necessário; saldo acumulado. | Corrente, poupança, caixa, cartão, Asaas e outro; ownership de empresa/pessoa. |
| Extrato | Realizados consolidados, entrada/saída, período, busca, conta/Sem conta, origem, cliente/fornecedor e documento autorizado. | Editar apenas a conta de origens permitidas; preservar sinal de estorno e ID. |
| Ajuste de caixa | Entrada/saída manual com data, valor, motivo e conta quando conhecida; autoria, edição/exclusão. | Administração; origem própria; extrato e saldos, sem duplicar outro lançamento. |
| DRE | 12 meses/ano por categoria, receitas, despesas pagas, provisões e recorte de previsto; resultado/margem e distribuição separada; export. | DRE gerencial híbrido; fórmula e diferenças em regimes-e-movimentos. |
| Retirada de Lucro | Distribuição/pró-labore, histórico, conta/data, situação, lucro/caixa/compromissos e aviso de excesso. | Distribuição reduz caixa e não é despesa operacional; pró-labore é despesa. |
| Relatório Analítico | Ano/ano anterior, descontos por mês, popularidade de pacotes, ticket, comparações e previsão. | Contratado pela data do evento; cancelados excluídos; não é caixa recebido. |
| Precificação | Custo/hora, capacidade, custos diretos/fixos, impostos, margem, mínimo e ponto de equilíbrio. | Simulação não registra receita/despesa; motor próprio. |

Categorias distinguem receita/despesa, têm estado e ownership. Categorias automáticas são garantidas idempotentemente. Fornecedores têm contato/documento, busca e autocomplete. A IA sugere categoria pela descrição; a pessoa confere antes de salvar.

## Eventos, contratos e equipe

| Origem | Efeito financeiro |
|---|---|
| Contrato/pacote | Forma de pagamento gera cronograma. Total, deslocamento e extras incluídos têm interpretação canônica sem duplicar avulsas. |
| Reserva/sinal | Sinal pode anteceder contrato; conversão preserva a baixa e abate o sinal conforme decisão, sem nova entrada. |
| Pagamento manual do evento | Sem parcelas, backend pode criar parcela manual; com parcelas, exige escolher a existente. |
| Desconto na parcela | Reduz dívida e valor final; não movimenta caixa; guarda preço original e nota. |
| Deslocamento/extra | Independente ou incluído no contrato; espelho coberto pelas parcelas não vira segunda entrada. |
| Equipe/freelancer | Custo por função/contratação gera conta e espelhos autorizados; contratado/pago/pendente/vencido por pessoa. |
| Recreação | Mesmas fronteiras com serviços/equipe/acertos do segmento; sem duplicar com fotografia. |
| Custos personalizados | Linhas por origem no evento, equipe/fornecedor/outros e sincronização idempotente. |
| Álbum | Custo previsto do catálogo/pacote, efetivado quando pedido, confirmado externamente ou pago. |
| Asaas de eventos | Link Pix/boleto/cartão conforme tenant, espelho, sync, webhook, pagamento, taxas/conciliação. |
| Cancelamento | Cancela somente pendências/cobranças abertas e preserva dinheiro movimentado. |

O resultado do evento separa contrato/extras/deslocamento (total/recebido/pendente), equipe/álbum/Asaas/outros, custo pago/pendente, lucro previsto/recebido e margem. `custo_album_previsto` pertence a `custo_album`, sem somar novamente. `lucro_recebido` usa receita liquidada menos custos totais, inclusive previsão; não é caixa disponível.

## Caminhos operáveis

1. Contas a Receber ou Evento → Pagamentos → valor/data/método/conta → confirmar → saldo e histórico.
2. Avulsas → recebida → editar → cliente e Guardar como crédito → outro evento da cliente → Usar crédito → aplicar/desfazer.
3. Pagamentos de Equipe → profissional/serviços → estúdio ou cliente direto → aplicações/adiantamento → saldo e histórico.
4. Contas Fixas e Salários → salário/competência → Pagar → dinheiro ou crédito → parcial/excedente/desfazer.
5. Pacote prevê álbum → envio com evidência → efetivar valor/vencimento/fornecedor → pagar sem regressão para previsto.

Páginas de evento, home e avisos usam a mesma autoridade. Aviso de recebimento na home abre modal de data/conta, sem baixa direta. Selo Pago usa saldo das parcelas, não apenas `pagamento_pendente`; cancelados/convites recebidos não recebem selo do caixa do estúdio.

## Interface e exportações

- Filtros e ações atualizam por Ajax. Exiba Carregando e descarte respostas de filtros antigos.
- Extrato/Contas a Pagar podem renderizar progressivamente por Mostrar mais; totais/exports usam o filtro inteiro.
- Preserve PDF, CSV e Excel aceito pelo produto. Diferencie HTML/`.xls` de `.xlsx` nativo ao documentar o alvo.
- Extrato tem atalhos Este mês, Mês passado, Últimos 3 meses, Últimos 12 meses, Este ano; datas manuais continuam disponíveis.
- Preserve busca, filtros de estado/conta/categoria/fornecedor, foco e ações no celular; humanize labels sem perder códigos internos.

## Fronteiras de entrega

Escopo financeiro por pessoa e financeiro de freelancer existem no código. Refinamentos para editor interno, contas pessoais isoladas, desempenho/rolagem e apresentação de salário aparecem como preparação/piloto local na ajuda de 25/09. Preserve a fronteira se o alvo tiver esse papel; não anuncie esses refinamentos como produção homologada.

Assinatura SaaS, cupons e indicação não são caixa do estúdio. Contratos jurídicos, produção de álbum e cálculo detalhado de preços têm escopo próprio; esta skill inclui as interfaces financeiras. Não inclui emissão fiscal oficial, Open Finance, transferência bancária real, contabilidade oficial, escrita offline ou quitação inferida por IA.
