# Relatórios e previsão

Retrato de 01/10/2026. Responsável: Codex. Regras de inclusão em [regimes-e-movimentos.md](regimes-e-movimentos.md).

## DRE gerencial

Retorna ano, receitas/despesas por categoria, vetor de 12 meses, total anual, margem, despesas_pagas, despesas_provisionadas, despesas_previstas, resultado, resultado_caixa e distribuicao. Sem categoria continua visível; ordenar/renomear não muda identidade nem soma.

Receita de evento vem dos pagamentos financeiros pela data efetiva, não do mês da festa; baixa_sem_caixa não é recebimento novo. Avulsas recebidas entram pela realização, excluindo espelhos de itens já incluídos no contrato. Modelos de entrada recorrente também podem projetar receita no DRE atual.

Preserve dois recortes históricos da receita de evento no DRE do estúdio:

1. Pagamentos positivos são ordenados por evento, data, parcela e ID. O teto acumulado é o `valor_final` normalizado do contrato; se não positivo, usa `valor_pago` normalizado, e sem teto positivo reconhece o recebido. Pagamentos anteriores ao ano também consomem o teto antes de distribuir o ano consultado. Contrato de 1.000 recebido integralmente em setembro e mais 100 em outubro: caixa de outubro entra 100, DRE de outubro zero. Pagamentos negativos/zero são ignorados por esse agregado, embora o extrato preserve o sinal.
2. Fallback legado exige evento com `valor_pago>0`, `pagamento_pendente=0`, `data_pagamento_final` não nula, sem qualquer `pagamentos_parcela` e sem parcela com status pago. Reconhece `valor_pago` normalizado em `COALESCE(DATE(data_cadastro), data_pagamento_final, data_festa)`, dentro do ano. A precedência da data de cadastro é intencional na consulta atual. Esse reconhecimento gerencial não autoriza inventar entrada de caixa, banco ou log de pagamento na migração.

Esses recortes explicam divergências DRE/extrato mesmo sem distribuições/projeções. Para paridade, mantenha-os. Se o alvo remover o teto ou exigir comprovante para o fallback, registre a mudança e apresente reconciliação do histórico antes de aprovar a migração.

Despesas pagas são contas pagas e baixas em caixa de equipe/adiantamento, com fontes disjuntas. Provisões incluem contas **automáticas pendentes** pelo vencimento, recorrências ativas por competência, gratificações/descontos e abatimentos de salário/equipe. Conta manual pendente sem modelo não entra automaticamente na provisão do SQL auditado.

Dedup de recorrente consome uma ocorrência real por modelo/categoria/valor/mês. Salário usa soma por competência e teto no líquido. Equipe usa pools/aplicações vinculados ao profissional/evento; não consumir o mesmo abatimento em dois custos.

Despesas = pagas + provisões. Previstas já estão nas provisões. Resultado = receitas − despesas; resultado_caixa = receitas − pagas; margem = resultado / receitas × 100, com zero sem receita. Distribuição de lucro é exposta separada abaixo do resultado; pró-labore continua despesa.

Nome resultado_caixa não garante igualdade universal ao Extrato: teto/fallback de receita, sinal de pagamento, distribuição, ajuste manual de caixa, receita recorrente projetada e piloto pessoal exigem ponte de reconciliação. Mostre o motivo e a base temporal ao usuário. Não prometa DRE contábil/fiscal oficial.

## Retirada e pró-labore

Origem `retirada_distribuicao` para distribuição; `retirada_prolabore` para pró-labore. Lançamentos usam contas a pagar/categorias próprias, dados do responsável/fornecedor, conta e pagamento ou vencimento, histórico e status.

O resumo usa caixa acumulado desde 2000 até hoje no escopo do estúdio:

```text
lucroAcumulado = entradas - (saidasTotais - distribuido)
disponivelCaixa = entradas - saidasTotais
compromissos = soma das contas pendentes (inclui custo previsto)
disponivelPrudente = max(0, disponivelCaixa - compromissos)
```

`distribuido`/`prolaborePago` são realizados. Aviso de retirada acima do recomendado não equivale a uma ordem bancária. Esse resumo é regra gerencial implementada, não garantia de solvência; não substitua seu cálculo por saldo do mês nem por receita contratada futura.

Há um limite importante: a soma atual de compromissos em retiradas lê `contas_pagar.valor` pendente, enquanto outras superfícies usam saldo após baixas de equipe. A equivalência em cenários de pagamento parcial precisa ser conferida; não alegue que todas as telas já usam o mesmo saldo líquido. No alvo, preserve a diferença para paridade ou trate a unificação como divergência explícita, com teste e decisão de negócio.

## Relatório analítico

Filtro anual, anos disponíveis, comparação com ano anterior e percentuais; séries mensais de receita original/final e descontos, quantidade de eventos, desconto médio/máximo; ranking de pacotes com quantidade, receita, ticket e descontos. Evento cancelado não entra; dados baseiam-se em `data_festa` e valores contratuais, não em dinheiro recebido.

Use “Contratado” na previsão e “Recebido” para entradas financeiras de caixa; título/tooltip/legenda devem manter a mesma base. Reserva, permuta e evento incluído em pacote não ganham receita arbitrária para preencher gráfico.

## Motor de previsão atual

Para paridade numérica, leia o [algoritmo puro da origem](../assets/forecast-engine-memora.php) ao portar fórmulas, grade de parâmetros, inicialização, percentis e PRNG. Ele é uma referência executável sem banco, rede ou credenciais, copiada do retrato auditado; não exige PHP no runtime alvo. Os vetores `previsao_*` do fixture foram gerados por esse algoritmo em séries sintéticas. Não escolha defaults de uma biblioteca de previsão e afirme igualdade sem comparar os vetores.

Histórico mensal contratado por data do evento, sem avulsas/cancelados e sem eventos futuros no treinamento. Preserve meses com zero. Futuro já contratado entra apenas como piso mês a mês para todos os cenários, incluindo pessimista.

A consulta atual ancora no último mês completo e busca até 48 meses anteriores. A série começa no primeiro mês com receita positiva da janela, preenchendo com zero os meses seguintes sem eventos até a âncora; não inventa zeros anteriores ao início do histórico. Exclui mês corrente e futuros do treino. O piso vendido cobre os 12 meses desde o primeiro dia do mês corrente.

| Histórico | Método |
|---|---|
| Menos de 3 meses ou total não positivo | insuficiente, média disponível com confiança zero; piso vendido ainda vale |
| 3–5 meses | preliminar: nível recente e tendência amortecida, phi=0,6; incerteza conservadora |
| 6–11 meses | média recente, tendência amortecida (phi=0,65) e regressão linear comparadas por validação temporal |
| 12–23 meses | tendência linear + offsets sazonais de período 12 (holt-sazonal) |
| 24+ meses | Holt-Winters ajustado por grade, com fallback sazonal quando inviável |

Essa tabela descreve a lógica executável do retrato. O cabeçalho do asset ainda resume n<6 como projeção plana; a função distingue insuficiente de preliminar amortecido, conforme a tabela e os vetores.

Validação temporal prevê cada mês usando apenas meses anteriores: WAPE = soma erros absolutos / soma valores observados. Com total observado zero, erro é indisponível, não infinito artificial nem prova de exatidão. Critério curto: menor WAPE; validação sazonal compara mesmo mês do ano anterior. Não use erro de ajuste nos próprios dados como confiança futura.

Monte Carlo atual: 3.000 simulações, valores não negativos e piso contratado em cada mês, faixa P10/P50/P90, horizonte de 3/6/12 meses. Semente deriva de série, âncora e piso; PRNG local determinístico não muda a aleatoriedade global. Mesmo dado deve reproduzir a mesma faixa e nota. Entregue crescimento, pico/vale, cobertura contratada e explicação determinística; narrativa opcional de IA não altera números.

Para paridade da confiança:

```text
accuracy = max(0, 100 - min(100, WAPE_fracao * 140))
history = min(100, n/18 * 100)
tests = min(100, testes_temporais/6 * 100)
precision = max(0, 100 - min(100, largura_relativa_media_trimestre * 66.7))
score = round(0.50*accuracy + 0.20*history + 0.20*tests + 0.10*precision)
```

Alta: n>=18, testes>=6, WAPE<=0,22 e score>=75. Média: n>=6, testes>=3, WAPE<=0,45 e score>=48. Caso contrário baixa; insuficiente tem score zero. WAPE ausente tem accuracy zero. A UI expõe nível, nota, meses, testes, erro e largura relativa. A chave legada mape no DTO guarda WAPE por compatibilidade, não outra métrica.

Não extrapole 12 meses de crescimento inicial sem amortecimento. Histórico longo não garante confiança alta; vendidos não são garantia de dinheiro no banco. Se o alvo usar outro modelo, documente isso como alteração e mantenha piso, transparência, validação fora da amostra e determinismo.

## Precificação e exports

Precificação tem motor próprio (`includes/pricing_engine.php`) e interfaces pública/admin: custos fixos, pró-labore/reserva, horas produtivas, capacidade, diretos, impostos/taxas, margem e pacote. Não duplicar custo fixo/projeção de salário com a mesma despesa materializada. Quando aplicável, preço sugerido = custo total / (1 − imposto − taxa − margem); rejeitar denominador não positivo. Para portar o motor inteiro, usar a skill específica ou auditar suas fórmulas/faixas; o diagnóstico público e captura de leads não fazem parte do caixa.

Exports do financeiro: CSV UTF-8 com BOM e delimitador `;`, XLSX via planilha nativa, PDF tabular em paisagem. Totais, período, status, escopo e ordenação iguais ao filtro da tela, independentemente de Mostrar mais. DRE exporta 12 meses/total e percentuais como percentuais, sem formatá-los como BRL. Não exigir bibliotecas PHP no alvo; preserve formato e comportamento.
