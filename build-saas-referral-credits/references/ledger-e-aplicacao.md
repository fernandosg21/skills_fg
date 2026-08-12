# Ledger e aplicação de créditos

## Entidades

| Entidade | Unicidade essencial |
|---|---|
| atribuição | referred_tenant único |
| qualificação | atribuição + primeiro pagamento |
| recompensa | owner_tenant + reward_number |
| aplicação | cobrança remota/local elegível |
| item de aplicação | aplicação + recompensa |
| evento do gateway | ambiente + provider_event_id |

## Estados da recompensa

```text
available -> reserved -> applied -> consumed
available/reserved -> revoked
reserved/applied -> available (somente com prova de que a mutação não ocorreu)
qualquer ambiguidade -> requires_review
```

## Elegibilidade da cobrança

- pertence ao mesmo tenant, customer e subscription;
- está futura e pendente;
- valor bate com o valor cheio esperado;
- não é prorrata;
- não possui outro benefício incompatível;
- não tem aplicação ativa concorrente.

## Valor final zero

Dispense somente a cobrança daquele ciclo. Preserve assinatura e confirme que existe/será criada a competência seguinte antes de consumir o crédito conforme a política.

## Precedência de estados

Refund, chargeback, cancelamento, consumo e revisão não devem regredir por evento atrasado de pagamento. Use uma matriz explícita, não um `UPDATE status = payload.status` genérico.

## Recuperação

Para uma intenção abandonada:

1. obtenha lease;
2. leia cobrança remota;
3. compare valor/estado com a intenção;
4. finalize consumo, libere com prova ou marque revisão;
5. registre fingerprint sanitizado do erro.
