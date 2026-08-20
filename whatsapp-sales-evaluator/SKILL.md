---
name: whatsapp-sales-evaluator
description: Avaliar conversas comerciais no WhatsApp, em texto, exportação de chat ou screenshots, usando vendas consultivas, SPIN Selling, gestão de objeções, fechamento e persuasão ética. Usar quando o usuário pedir para avaliar atendimento, analisar conversa de vendas, dar score de vendedor, revisar qualidade comercial no WhatsApp, gerar feedback de atendimento ou comparar desempenho comercial. Adaptar a rubrica ao nicho, ticket, ciclo e estágio da venda sem inventar contexto ou benchmark.
---

# Avaliador de vendas no WhatsApp

Avaliar comportamentos observáveis, citar evidências reais e transformar a análise em feedback acionável para vendedor e gestor. Manter linguagem comercial, direta e não acadêmica.

## Fluxo obrigatório

1. Organizar a conversa em ordem cronológica e identificar vendedor, cliente e canal de origem quando possível.
2. Verificar legibilidade, continuidade e quantidade de mensagens. Não tratar conteúdo cortado, ilegível ou ausente como evidência.
3. Recuperar do pedido ou inferir com cautela: nicho, oferta, ticket, ciclo, estágio, objetivo da conversa e objeções típicas.
4. Perguntar apenas se faltar um dado que impeça identificar o vendedor ou interpretar a finalidade da conversa. Caso contrário, prosseguir com premissas explícitas.
5. Calibrar a expectativa:
   - Em vendas simples ou de baixo ticket, aceitar qualificação curta e focada no critério de compra essencial.
   - Em vendas consultivas, complexas ou de maior ticket, exigir exploração mais profunda de dor, impacto, prazo, orçamento ou viabilidade e decisão.
   - Em conversas ainda no início, avaliar o avanço para o próximo microcompromisso, não exigir fechamento final.
6. Ler [references/scoring-rubric.md](references/scoring-rubric.md) antes de pontuar.
7. Pontuar somente a partir de evidências da conversa e aplicar todas as travas de score.
8. Ler [references/report-template.md](references/report-template.md) e entregar o relatório na estrutura definida.
9. Ler [references/evaluation-examples.md](references/evaluation-examples.md) somente quando houver dúvida sobre adaptação, dimensão não observada, proposta precoce ou script robótico.

## Integridade da evidência

- Citar trechos literais da conversa em todas as dimensões observadas. Usar de dois a três exemplos centrais na síntese e evidências adicionais na tabela quando necessário.
- Nunca inventar falas, contexto, produto, resultado, intenção, objeção, tempo de resposta ou dado ausente.
- Separar claramente fato observado, inferência e informação não disponível.
- Redigir dados pessoais desnecessários nas citações, preservando o sentido comercial do trecho.
- Em screenshots, respeitar a ordem visual e sinalizar texto parcialmente ilegível. Não completar mensagens cortadas.
- Se houver menos de cinco mensagens no total, marcar `Amostra insuficiente`, apresentar análise provisória e não emitir classificação conclusiva.
- Se a conversa estiver incompleta, reduzir a confiança e evitar penalizar comportamentos que poderiam estar fora do recorte.

## Pontuação

Avaliar cinco dimensões de 0 a 5:

1. Qualificação e descoberta
2. Construção de valor
3. Gestão de objeções
4. Gatilhos de fechamento e próximos passos
5. Tom e relacionamento

Calcular cada nota a partir dos cinco comportamentos da dimensão descritos na rubrica. Usar somente pontos inteiros.

Se todas as dimensões forem observáveis, somar o total sobre 25. Se uma dimensão for `N/O — Não observada`, informar o total bruto sobre o máximo observado e calcular o equivalente normalizado sobre 25:

`equivalente = (pontos obtidos / pontos possíveis observados) × 25`

Arredondar o equivalente para uma casa decimal e mostrar o cálculo. Nunca converter ausência de oportunidade em nota zero.

Classificar pelo percentual observado:

- `Excelente`: 80% a 100%
- `Aceitável`: 60% a 79%
- `Precisa melhorar`: abaixo de 60%
- `Amostra insuficiente`: menos de cinco mensagens ou evidência materialmente incompleta

## Travas obrigatórias

- Se não houver perguntas abertas quando havia oportunidade de fazê-las, limitar Qualificação e descoberta a 2/5.
- Se o vendedor enviar proposta, preço ou apresentação completa antes da qualificação mínima adequada ao contexto, limitar Qualificação a 2/5 e Construção de valor a 3/5. Nunca conceder 25/25 nesse caso.
- Se o vendedor recuperar a conversa, reabrir descoberta e reconstruir valor, reconhecer a recuperação, mas manter a perda do ponto máximo total pela proposta prematura.
- Se não houver objeção explícita ou implícita, marcar Gestão de objeções como `N/O`; não presumir objeção.
- Se a urgência ou escassez parecer inventada, manipulativa ou sem sustentação, limitar Fechamento a 2/5 e apontar risco de confiança.
- Se houver script genérico que ignore respostas do cliente, reduzir Personalização e Escuta ativa. Mencionar `script robótico` nas recomendações.
- Se houver pressão indevida, confronto, desrespeito ou promessa não sustentada, limitar Tom e relacionamento a 1/5.

## Feedback acionável

Para cada dimensão observada, incluir:

- evidência literal;
- diagnóstico em uma frase;
- comportamento que funcionou;
- gap que prejudicou ou limitou a venda;
- recomendação prática.

Para cada dimensão com gap material, incluir também um exemplo de resposta melhor, sem inventar benefícios ou condições comerciais.

Priorizar de duas a três melhorias. Classificar cada uma como `Alta`, `Média` ou `Baixa` segundo seu provável impacto na progressão da venda.

Gerar também:

- um feedback curto, respeitoso e pronto para encaminhar ao vendedor;
- um checklist de próximos passos para o gestor;
- uma sugestão de treinamento ligada ao maior gap observado.

## Benchmark

- Comparar com média ou mediana do time somente quando o usuário fornecer uma base, histórico ou benchmark verificável.
- Quando houver base, declarar: `Isso está acima/na/abaixo da média do time`, mostrar a referência e evitar causalidade não demonstrada.
- Sem base, declarar: `Benchmark do time indisponível. Comparação feita com o padrão da rubrica.` Nunca inventar média do time.

## Estilo do relatório

- Usar Markdown e tabela para os scores.
- Começar pelo resultado geral.
- Ser direto, escaneável e orientado a decisão.
- Usar linguagem de vendas, não linguagem acadêmica.
- Distinguir pontos fortes, falhas e próximos passos.
- Não elogiar de forma genérica; ligar cada conclusão a uma evidência.
