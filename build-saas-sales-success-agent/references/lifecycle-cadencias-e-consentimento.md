# Lifecycle, cadências e consentimento

## Estágios sugeridos

`prospect -> conta_criada -> assinante -> churn_risco -> cancelado/winback`

Adapte as chaves existentes e registre cada transição na timeline.

## Matriz de sinais

| Sinal confirmado | Estágio/ação |
|---|---|
| signup verificado | conta criada + suporte de trial |
| checkout/pagamento ativo | assinante + onboarding |
| trial termina sem assinatura | verificação e oferta assistida |
| past due após carência | churn em risco |
| cancelamento | anti-churn ou winback conforme política |
| opt-out | cancelar toda comunicação externa |

## Cadências comuns

- suporte trial: ajuda contextual, reduz frequência quando não há dúvidas;
- fim do trial: conferir assinatura antes de enviar;
- onboarding: passos espaçados após ativação;
- anti-churn: abordar causa confirmada, sem pressionar;
- winback: poucas tentativas em janelas longas;
- venda fria: somente origem consentida e aprovação humana inicial.

## Claim seguro

O claim não é autorização eterna. Revalide imediatamente antes do envio:

- consentimento ainda ativo;
- estágio ainda compatível;
- mensagem não ficou obsoleta por inbound recente;
- está dentro da janela local;
- não existe outbox equivalente.

## Identidade no prompt

Separe blocos:

1. identidade da plataforma;
2. catálogo e links atuais;
3. contexto do prospect;
4. estilo/voz;
5. regras inegociáveis e ferramentas permitidas.

O bloco de estilo nunca pode substituir o de identidade.
