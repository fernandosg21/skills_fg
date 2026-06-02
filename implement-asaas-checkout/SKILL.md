---
name: implement-asaas-checkout
description: Use when implementing or auditing Asaas Checkout, payment links, event payments, webhooks, credit-card installments, anticipation fees, fee/net-value reconciliation, and PHP/MySQL flows with idempotent fulfillment or finance summaries.
---

# Implement Asaas Checkout

## Workflow

1. Map the existing app first: routes, auth/session/CSRF, database helpers, mailer, order model, upload limits, and migration style.
2. Add configuration without secrets: `ASAAS_API_URL`, `ASAAS_CHECKOUT_URL`, `ASAAS_WEBHOOK_URL`, `ASAAS_API`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_MAX_INSTALLMENTS`, and checkout expiration. `ASAAS_API` stores the Asaas API key used in the request header named `access_token`.
3. Persist the local purchase before calling Asaas. Use a unique local code as `externalReference`; never use the callback page as proof of payment.
4. Create the checkout with `POST /v3/checkouts`, `billingTypes: ["CREDIT_CARD"]`, `chargeTypes: ["DETACHED", "INSTALLMENT"]`, item value, customer data, callback URLs, and configured `maxInstallmentCount`.
5. Store `asaas_checkout_id`, checkout URL, local status, timestamps, and the original local purchase totals. Redirect the user to `https://asaas.com/checkoutSession/show?id=...` or the link returned by the API.
6. Add a webhook route outside CSRF, and document the absolute Asaas webhook URL in `ASAAS_WEBHOOK_URL`; fallback formula is `rtrim(APP_URL, "/") . "/webhooks/asaas"` if the app runs in a subfolder and `APP_URL` already includes it.
7. In the Asaas integration screen, configure that full HTTPS URL for `POST` events and use the same token stored in `ASAAS_WEBHOOK_TOKEN`; validate the received `asaas-access-token` header with `hash_equals` before touching the payload.
8. Record every webhook in an idempotency table keyed by Asaas event id, or a deterministic hash fallback. Duplicate webhooks must return success without re-processing credit.
9. Unlock fulfillment only for paid events such as `CHECKOUT_PAID`. Handle cancellation and expiration only while the local purchase is still pending. Treat refund or chargeback events as blocking states.
10. For credit/package flows, consume credits from confirmed orders only, enforce minimum batch sizes, and allow the final upload to be smaller when it equals the remaining balance.
11. Send customer/admin notifications only after the webhook changes the purchase to an active/paid state.

## Event Payment And Finance Pattern

Use this pattern when the app creates Asaas charges or payment links for an event/order and needs finance totals, not just checkout fulfillment.

- Persist a local mirror before or immediately after creating the Asaas object. Store at least `tenant_id`, environment, local event/order id, local installment/parcel id, provider entity (`payment`, `payment_link`, `checkout`), Asaas ids, `externalReference`, billing type, status, gross value, `netValue`, estimated fee, actual fee, invoice/payment URLs, raw JSON, timestamps, and created-by user.
- `externalReference` must encode the tenant and local entity ids so webhooks can recover ownership. For payment links created later from a local parcel, use a unique suffix and keep the original local parcel id.
- Do not treat a payment link id as a paid payment id. A link is the purchase surface; the actual payment ids arrive later through payment webhooks or API resync.
- When replacing an open charge/link, cancel only local/Asaas charges that are still open. Never cancel paid, refunded, chargeback, or already-conciliated rows.
- For finance dashboards, create/update one automatic payable cost per local Asaas mirror key. Update the same payable as estimates become real; cancel it if the Asaas charge is deleted/refunded and the payable is not already paid.

## Credit-Card Installments

Asaas may return one payment first even though the customer purchased in multiple installments. Do not use only the first payment fee as the total platform fee.

- Store the payment `installment` id when present.
- Fetch all payments in the installment group with `GET /v3/installments/{id}/payments`. Official reference: https://docs.asaas.com/reference/listar-cobran%C3%A7as-de-um-parcelamento
- Sum every installment payment's gross `value`.
- If every payment has `netValue`, compute actual total fee as `sum(value - netValue)` and net receivable as `sum(netValue)`.
- If some payments do not have `netValue` yet, compute a consolidated estimate by applying the app's configured Asaas fee table to each installment amount. Mark/display it as estimated or predicted, not final.
- Store aggregate audit fields such as `installment_id`, `installment_count`, `installment_fee_value`, `installment_net_value`, `installment_total_value`, and `installment_updated_at` when the local schema allows it.
- In the UI, label consolidated values clearly, for example `Taxas reais do parcelamento` or `Taxas previstas do parcelamento`, with the installment count.

## Anticipation Fees

Anticipation changes the receivable amount. The payment creation request usually should not try to send the anticipation fee; Asaas calculates and returns it through payment/anticipation state.

- Enable and process anticipation webhooks in addition to payment/checkout webhooks. Official guide: https://docs.asaas.com/docs/webhook-para-antecipacoes
- Persist anticipation data on the local payment mirror when relevant: `anticipation_id`, `anticipation_status`, `anticipation_fee_value`, `anticipation_net_value`, `anticipation_total_value`, and `anticipation_updated_at`.
- For active anticipation statuses, compute the effective fee as gross value minus anticipated net value. For installment groups, sum all active anticipations or all anticipated installment nets before updating the finance cost.
- Treat denied/cancelled/refused/rejected anticipation statuses as not affecting the net receivable. Fall back to real payment fee (`value - netValue`) or the configured estimate.
- List anticipations with `GET /v3/anticipations?payment={paymentId}` or `GET /v3/anticipations?installment={installmentId}`; the endpoint is paginated and accepts `limit <= 100`. Official reference: https://docs.asaas.com/reference/listar-antecipacoes
- Statuses such as `CREDITED`, `DEBITED`, `SCHEDULED`, `PENDING`, and `OVERDUE` can matter for forecast displays. Only mark the payable as paid when the app's finance semantics consider the fee/anticipation settled.

## Historical Resync

Webhooks are the source of truth for new changes, but already-paid payments may not update local fees unless Asaas sends a later event. Provide an authenticated manual/server-side resync when finance accuracy matters.

Recommended resync flow:

1. Find local Asaas mirrors for the event/order with `asaas_payment_id` or `externalReference`, excluding deleted/refunded/chargeback rows.
2. Fetch the current payment via `GET /v3/payments/{id}`. If only `externalReference` is known, query `/v3/payments?externalReference=...` and choose the best current payment.
3. Reprocess the payment through the same webhook/mirror code path used by live events.
4. If the payment has `installment`, fetch `/v3/installments/{id}/payments`, aggregate all installment fees/net values, then update the local mirror and finance payable.
5. Fetch anticipations by `payment` and `installment`, dedupe by anticipation id, aggregate active anticipations, then update the same local mirror/payable.
6. Refresh the affected UI summaries after resync.

The resync endpoint must require normal app auth and CSRF/session protection. The Asaas webhook route remains the only CSRF-exempt browser-facing route.

## Env URLs

Use one active `ASAAS_API_URL` per environment; keep the other one commented. If both are active, some `.env` loaders may keep the first value they read.

```env
# Sandbox
ASAAS_API_URL=https://api-sandbox.asaas.com/v3

# Production
# ASAAS_API_URL=https://api.asaas.com/v3

# Checkout redirection URL is the same fallback in both environments.
ASAAS_CHECKOUT_URL=https://asaas.com/checkoutSession/show
```

For production, invert the comments:

```env
# Sandbox
# ASAAS_API_URL=https://api-sandbox.asaas.com/v3

# Production
ASAAS_API_URL=https://api.asaas.com/v3

ASAAS_CHECKOUT_URL=https://asaas.com/checkoutSession/show
```

## Security Checklist

- Hash customer passwords with `password_hash`; rehash on login when needed.
- Regenerate session ids on login/logout; use `HttpOnly`, `SameSite=Lax`, and secure cookies in production.
- Add rate limits for login, registration, and upload endpoints.
- Use CSRF on every browser POST except the Asaas webhook.
- Use a honeypot or equivalent low-friction bot guard on registration.
- Validate file names, extensions, MIME types, size, duplicate names, and storage paths for upload fulfillment.
- Do not log real Asaas tokens, credit-card data, or `.env` contents.
- Keep the webhook as the source of truth; the checkout return page is informational.

## Web App Setup Tutorial

Use this when the user needs to create the webhook manually in the Asaas dashboard:

1. Open the Asaas account and go to `Menu do usuario > Integracoes > Webhooks`.
2. Click `Criar Webhook`.
3. Use a clear name, for example `RevelaFoto - Pacotes Checkout`.
4. Set the URL to the full public webhook endpoint, for example `https://www.fernandogoncalves.fot.br/revelafoto/webhooks/asaas`. In other apps, use `ASAAS_WEBHOOK_URL`, or `APP_URL` without trailing slash plus `/webhooks/asaas`.
5. Add an email that should receive communication failure alerts.
6. Choose API version `v3` when the UI asks for an API version.
7. Generate or paste a secure authentication token. Save the exact same value in `.env` as `ASAAS_WEBHOOK_TOKEN`. The app validates it from the `asaas-access-token` header.
8. Keep the webhook enabled. Prefer sequential sending if the UI asks for the sending type, because the app stores idempotent events and payment state changes are easier to audit in order.
9. Select these events:
   - Required checkout events: `CHECKOUT_PAID`, `CHECKOUT_CANCELED`, `CHECKOUT_EXPIRED`.
   - Useful for audit/testing: `CHECKOUT_CREATED`.
   - Payment reconciliation: `PAYMENT_CREATED`, `PAYMENT_UPDATED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_ANTICIPATED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`.
   - Anticipation reconciliation: receivable anticipation events such as pending/scheduled/credited/debited/cancelled/denied/overdue, depending on what the Asaas panel exposes.
   - Fraud/refund protection: `PAYMENT_REFUNDED`, `PAYMENT_PARTIALLY_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED`, `PAYMENT_CHARGEBACK_DISPUTE`.
10. Save the webhook and keep the generated token somewhere secure until `.env` is updated.
11. After saving, confirm that the production `.env` has `ASAAS_WEBHOOK_URL` and `ASAAS_WEBHOOK_TOKEN` configured, then test with an invalid token first to verify that the endpoint returns 401.

## Validation

- Run syntax checks for touched PHP and JS files.
- Test invalid webhook token returns 401.
- Test duplicate webhook event does not duplicate credit.
- Test paid webhook unlocks exactly one purchase.
- Test cancellation/expiration does not override an already active paid purchase.
- Test refund/chargeback blocks further use.
- For payment links, verify that the link is not treated as paid until a payment webhook/API result identifies an actual payment.
- For credit-card installments, verify the displayed/persisted fee is the sum of all installment payment fees, not only the first payment.
- For anticipation, verify active anticipation statuses update the fee/net receivable and cancelled/denied statuses fall back to regular payment fee or estimate.
- Test manual historical resync against an already-paid installment purchase and confirm UI finance totals refresh after the API sync.
- Test below-minimum, over-balance, and final-smaller-than-minimum upload batches.
- Package changed files for server upload with mirrored relative paths when the deployment is manual/FTP.
