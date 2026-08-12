---
name: build-photography-pricing-engine
description: "Implemente ou audite um motor de precificação para fotografia, vídeo e eventos com custos mensais, horas produtivas, custos diretos, impostos, margem, ponto de equilíbrio e composição de pacotes. Use quando criar calculadora de preço mínimo, simulador de margem, precificação por hora/evento, diagnóstico público de preço ou aquisição de leads baseada em resultado financeiro."
---

# Construir motor de precificação fotográfica

## Objetivo

Calcule preços reproduzíveis e explicáveis sem contar o mesmo custo duas vezes, escondendo hipóteses ou misturando aquisição pública com os dados privados do assinante.

## Separe motor e interfaces

1. Implemente o cálculo como função pura, sem sessão, banco ou chamadas externas.
2. Normalize a entrada em um contrato versionado.
3. Faça painel privado e calculadora pública chamarem o mesmo motor.
4. Leia [formulas-e-cenarios.md](references/formulas-e-cenarios.md).
5. Verifique regras tributárias atuais em fontes oficiais quando o cálculo usar legislação brasileira.

## Modele os insumos

- Custos fixos mensais: estrutura, software, pró-labore e reserva de equipamentos.
- Capacidade: horas disponíveis, percentual realmente vendável e quantidade sustentável de eventos.
- Custos diretos: equipe, deslocamento, álbum, impressão, taxas e itens consumidos por evento.
- Impostos e taxas: alíquota efetiva estimada e taxas de pagamento aplicáveis.
- Margem desejada e preço atual para comparação.
- Pacotes: quantidade de horas, entregáveis, custos e adicionais.

Use centavos/decimal exato e percentuais normalizados. Recuse combinações em que imposto + margem seja igual ou superior a 100%.

## Calcule sem dupla contagem

- Derive custo da hora apenas dos custos mensais e da capacidade produtiva.
- Multiplique o custo da hora pelo esforço do evento.
- Some custos diretos uma única vez no evento ou pacote.
- Divida o custo total por `1 - imposto - taxa - margem` para obter preço sugerido, quando essa for a semântica escolhida.
- Calcule ponto de equilíbrio e meta mensal em unidades comparáveis.
- Mantenha arredondamento comercial como etapa separada e mostre o valor técnico anterior.

## Explique o resultado

- Mostre custo interno, impostos/taxas, margem em valor e preço sugerido.
- Exiba quais hipóteses mais influenciam o preço.
- Avise quando capacidade, horas vendáveis ou margem tornarem o cenário inviável.
- Rotule o cálculo tributário como estimativa gerencial e não como orientação contábil.
- Permita cenários lado a lado sem sobrescrever a configuração confirmada.

## Proteja a calculadora pública

- Calcule o resultado final no servidor e mantenha apenas rascunho transitório no navegador.
- Mostre valor antes de pedir contato; não transforme o formulário em barreira enganosa.
- Exija consentimento destacado para contato comercial.
- Use honeypot, tempo mínimo, limite de corpo, same-origin e rate limit com identificador pseudonimizado.
- Não envie custos, pró-labore, preço atual, resultado, e-mail ou telefone a pixels de analytics.
- Relacione captura e cadastro futuro por referência opaca e idempotente.

## Valide numericamente

- Crie fixtures com resultados manuais conhecidos.
- Teste custo direto zero, capacidade zero, margem limite, impostos por faixa e valores muito altos.
- Confirme que alterar custo direto muda o preço uma vez, não duas.
- Compare painel privado e calculadora pública para o mesmo payload normalizado.
- Teste arredondamento de centavos e formatação pt-BR separadamente.
- Teste abuso do formulário público, ausência de consentimento e reenvio.
- Rode testes determinísticos sem rede para o motor puro.

## Critérios de conclusão

Considere pronto quando o mesmo estado produz sempre o mesmo resultado, cada parcela do preço é explicável e a captação pública não vaza informações financeiras sensíveis.
