---
name: build-saas-referral-credits
description: "Implemente ou audite um programa SaaS de indicação que atribui a primeira referência válida, qualifica após pagamento real, cria recompensas por marcos e aplica créditos em cobranças com ledger idempotente. Use quando criar indique-e-ganhe, cupom de referral, crédito de renovação, abatimento de fatura, reversão por chargeback ou reconciliação entre ledger local e gateway."
---

# Construir créditos SaaS por indicação

## Objetivo

Conceda e aplique créditos sem permitir autoindicação, dupla atribuição, consumo antecipado ou mutações ambíguas no gateway de pagamento.

## Separe domínios

1. Mantenha atribuição/qualificação/recompensa em ledger local puro.
2. Coloque chamadas ao gateway em adapter separado.
3. Diferencie cupom promocional de código de indicação.
4. Leia [ledger-e-aplicacao.md](references/ledger-e-aplicacao.md).
5. Comece com captura e aplicação automática desligadas por flags independentes.

## Atribua de forma imutável

- Dê ownership do código a um único tenant e não permita trocar depois da primeira atribuição.
- Faça a primeira atribuição válida do indicado vencer.
- Recuse autoindicação, código inativo/expirado, segundo indicador e conta já pagante.
- Preserve referência comercial de lead separada do código de referral.
- Não conte cadastros anteriores à ativação do programa retroativamente.
- Guarde apenas dados necessários e não exponha PII dos indicados ao indicador.

## Qualifique com evidência exata

- Qualifique somente depois do primeiro pagamento válido.
- Relacione tenant indicado, resgate, pagamento e assinatura exatos.
- Rejeite sinais divergentes de ownership em vez de escolher por heurística.
- Faça eventos repetidos de confirmado/recebido convergirem ao mesmo registro.
- Em refund/chargeback do primeiro pagamento, reverta a qualificação conforme a política.

## Crie recompensas em ledger

- Gere uma recompensa única por indicador e número do marco.
- Grave snapshot do valor e da regra do marco.
- Use estados como disponível, reservada, aplicada, consumida, revogada e requer revisão.
- Mantenha `remaining_cents` para uso parcial.
- Não expire nem converta em dinheiro se a política não permitir.
- Quando recompensa consumida precisar ser revertida, gere déficit contra marcos futuros; não cobre retroativamente sem autorização.

## Reserve antes de mutar o gateway

1. Escolha uma cobrança futura elegível e confirme valor cheio, estado, assinatura, cliente e ausência de benefício conflitante.
2. Reserve localmente créditos e crie intenção/lease em transação curta.
3. Termine a transação.
4. Revalide ownership remoto.
5. Aplique abatimento parcial atualizando apenas a cobrança ou dispense a cobrança zero sem excluir a assinatura.
6. Releia o estado remoto.
7. Marque aplicada/aguardando confirmação.
8. Consuma somente após pagamento confirmado/recebido, ou após evidência definida para ciclo integralmente dispensado.

Nunca faça DDL ou HTTP dentro da transação do ledger.

## Trate ciclos e falhas

- Em plano mensal, limite quantas recompensas entram por cobrança conforme política.
- Em anual, permita empilhar até o valor integral e preserve saldo restante.
- Não aplique em cobrança vencida, paga, prorrateada, divergente ou com outro desconto.
- Use lease, backoff e limite de tentativas.
- Antes de retry, consulte o estado remoto para não repetir uma mutação que já ocorreu.
- Depois do limite, marque `requires_review`; não libere saldo se a mutação puder ter acontecido.
- Faça estados terminais terem precedência monotônica sobre webhooks atrasados.

## Métricas e contabilidade

- Preserve preço cheio da assinatura para MRR.
- Mostre separadamente créditos concedidos, saldo, desconto consumido, receita cheia e líquida.
- Emita documento fiscal apenas sobre pagamento efetivo conforme regra vigente.
- Mostre ao indicador código, link, progresso e histórico próprios, sem nome/e-mail/documentos dos indicados.

## Valide

- Teste autoindicação, segundo código, conta já paga e referência anterior à ativação.
- Reenvie webhooks e prove unicidade de atribuição, qualificação, marco e consumo.
- Teste mensal, anual, saldo parcial e valor final zero.
- Simule pagamento concorrente, timeout após mutação, webhook atrasado e lease vencido.
- Teste refund antes e depois de consumo.
- Teste divergência de tenant/customer/subscription/payment e confirme fail-closed.
- Reconcile ledger local e gateway em sandbox antes de ligar aplicação automática.

## Critérios de conclusão

Considere pronto quando cada indicado pertence a no máximo um indicador, cada marco nasce uma vez e nenhum crédito é consumido ou devolvido sem evidência remota inequívoca.
