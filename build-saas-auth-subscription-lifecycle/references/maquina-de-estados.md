# Máquina de estados de referência

## Identidade

| Estado | Entrada | Saída válida |
|---|---|---|
| pending_verification | cadastro manual | verified, expired/reissued |
| verified | token ou provedor confiável | active session |
| locked | abuso/política | recuperação administrativa |

## Conta e entitlement

| Estado | Significado | Acesso recomendado |
|---|---|---|
| trial | período gratuito válido | completo ou conforme produto |
| active | plano pago ou gratuito ativo | conforme catálogo |
| incomplete | checkout/assinatura não concluída | orientar retomada |
| past_due_grace | vencido dentro da carência | manter + avisar |
| past_due | inadimplência após carência | restrito |
| cancelled | assinatura encerrada | leitura/retensão conforme política |
| suspended | risco/ação administrativa | bloqueado |

## Eventos não são estados

`PAYMENT_OVERDUE`, `CHECKOUT_PAID` e equivalentes são sinais. Reconciliar o espelho e então derivar o estado. Não guardar o último nome de evento como verdade da conta.

## Precedência de acesso

1. Identidade autenticada e ativa.
2. Tenant existente e membership válida.
3. Verificação exigida concluída.
4. Estado de risco/suspensão.
5. Estado financeiro + carência.
6. Plano/entitlements/módulos.
