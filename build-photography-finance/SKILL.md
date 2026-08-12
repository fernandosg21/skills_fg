---
name: build-photography-finance
description: "Implemente ou audite o financeiro de um estúdio de fotografia, vídeo, recreação ou eventos, cobrindo parcelas, contas a pagar e receber, caixa por conta bancária, extrato derivado, DRE, provisões, previsões, salários, retiradas e integrações de eventos. Use quando criar dashboard financeiro, razão de movimentos, baixa e estorno, custo previsto versus firme, conciliação ou relatórios com regimes financeiros distintos."
---

# Construir financeiro para fotografia e eventos

## Objetivo

Entregue um sistema em que cada número tenha regime, origem e estado conhecidos, e em que baixar ou estornar uma obrigação reconcilie todas as superfícies afetadas sem dupla contagem.

## Comece pela auditoria

1. Mapeie schema, serviços, páginas, APIs, exports, jobs, webhooks e geradores automáticos de lançamentos.
2. Identifique todas as fontes de entrada e saída e qual delas é autoridade.
3. Liste as definições atuais de caixa, competência, provisão, saldo de conta e resultado do período.
4. Leia [regimes-e-movimentos.md](references/regimes-e-movimentos.md).
5. Faça consultas de reconciliação antes de alterar dados financeiros reais.

## Defina contratos monetários

- Use centavos inteiros ou `DECIMAL` exato; nunca ponto flutuante binário para persistência ou igualdade.
- Grave tenant, moeda, valor original, saldo, vencimento, estado, origem e timestamps.
- Modele conta bancária explicitamente em todo movimento de caixa.
- Separe obrigação/recebível do pagamento que a liquida; permita parcialidade por aplicações.
- Faça toda escrita validar ownership, estado atual e concorrência no backend.
- Use chaves idempotentes por origem para lançamentos automáticos e webhooks.

## Construa um extrato canônico derivado

- Normalize cada fonte em um shape de movimento: ID, tipo, data, descrição, valor, direção, conta e origem.
- Una somente movimentos realizados; não misture provisões no extrato de caixa.
- Exclua baixas sem caixa do saldo bancário e identifique-as separadamente no negócio.
- Calcule saldo acumulado com saldo anterior + movimentos do período, não chame o resultado do período de saldo da conta.
- Faça dashboards, exportações e saldos por conta consumirem o mesmo serviço canônico.
- Humanize rótulos técnicos apenas na apresentação; preserve a chave de origem.

## Preserve regimes distintos

- Caixa: dinheiro efetivamente movimentado.
- DRE: resultado por regra contábil/gerencial, incluindo provisões documentadas.
- Competência/previsão: receita e custo atribuídos ao período econômico definido.
- Cards operacionais: vencimentos e estados, que podem usar datas diferentes.

Não tente fazer todas as telas exibirem o mesmo total. Documente por que cada uma responde a uma pergunta diferente e ofereça pontes de reconciliação.

## Modele previsto versus firme

- Use um marcador próprio para custo previsto; não invente um status que quebre fluxos de pagamento existentes.
- Defina um predicado canônico para “previsão ativa”, incluindo o estado ainda pendente.
- Mostre previsão no resultado e nas provisões que a incluem, mas não como dívida vencida antes do compromisso real.
- Efetive somente por sinal de negócio confiável, carimbe a data e congele valor/vencimento conforme a regra.
- Faça a efetivação ser de mão única quando o compromisso externo puder já existir.
- Nunca some o subconjunto previsto novamente sobre o total de provisões.

## Centralize baixas e estornos

1. Trave a obrigação atual e revalide o saldo.
2. Grave pagamento/aplicação e movimento de caixa na mesma transação curta quando ambos existirem.
3. Sincronize os espelhos derivados pelo serviço único.
4. Emita integrações externas após o commit.
5. No estorno, reverta exatamente as aplicações e movimentos originais.
6. Registre auditoria com antes/depois e usuário responsável.

Impeça que uma mesma obrigação seja liquidada simultaneamente por caixa e por baixa sem caixa.

## Construa previsões e retiradas com prudência

- Separe valor recebido, contratado, vencido e previsto.
- Faça cenários explícitos e rotule estimativas; não apresente projeção como saldo disponível.
- Calcule retirada de lucro considerando compromissos definidos e preserve pró-labore como categoria própria.
- Permita ajustes manuais de caixa somente a administradores, com conta, data, motivo e auditoria.

## Valide com reconciliação

- Teste pagamento integral, parcial, excedente, estorno e concorrência.
- Teste movimento entre contas e edição apenas da conta sem alterar valor/origem.
- Teste previsão antes e depois da efetivação, pagamento e cancelamento.
- Compare extrato, saldo por conta, dashboard, DRE e exportações para o mesmo conjunto conhecido.
- Teste dois tenants com IDs, documentos e descrições coincidentes.
- Faça somas em SQL antes/depois e explique qualquer diferença esperada por regime.
- Rode testes e linters e mantenha um fixture financeiro regressivo.

## Critérios de conclusão

Considere pronto quando cada total pode ser refeito a partir de movimentos rastreáveis, toda diferença entre telas é explicável pelo regime e retries ou estornos não criam nem apagam dinheiro fictício.
