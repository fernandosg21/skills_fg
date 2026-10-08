---
name: implement-asaas-checkout
description: Use when implementing or auditing Asaas Checkout, recurring subscriptions, payment links, event payments, webhooks, credit-card installments, anticipation fees, fee/net-value reconciliation, and idempotent fulfillment or finance summaries. Default setup is admin-managed - the superadmin pastes only the API key (sandbox and production) in an admin panel, and the system validates it, stores it as a secret and creates/updates the Asaas webhook with its own generated token. Works for PHP/MySQL and Supabase/Edge Functions stacks.
---

# Implement Asaas Checkout

## Default: Admin-Managed Keys And Automatic Webhook

For every new system, prefer this setup over `.env` keys and a manually created webhook. The operator only pastes the API key; everything else is done by the system. Full contract, schema and code templates: [references/admin-managed-setup.md](references/admin-managed-setup.md).

1. **Superadmin panel, one card per environment** (`sandbox` and `production`). Each card shows: configured or not, last 4 characters of the key, Asaas account name, live balance, webhook status, and buttons `Salvar chave`, `Configurar webhook`, `Remover`.
2. **Save key** (`save_key`): reject keys with the wrong prefix for the environment (`$aact_hmlg_` is sandbox, `$aact_prod_` is production; old keys without the prefix are checked only through the API), then call `GET /v3/finance/balance` on that environment's URL. Only a key that answers 200 is stored. Also read `GET /v3/myAccount/commercialInfo/` to show the account name and use its e-mail for webhook alerts.
3. **Store secrets outside app tables**: Supabase Vault (`vault.create_secret`/`update_secret` through a `security definer` function callable only by `service_role`, with a name whitelist like `^asaas_(api_key|webhook_token)_(sandbox|production)$`), or an encrypted column/secret manager in other stacks. A separate public table keeps only metadata: `key_hint`, account name/e-mail, `validated_at`, `webhook_id`, `webhook_url`, `webhook_at`.
4. **Configure webhook** (`setup_webhook`): generate a random token (32 bytes hex), save it as the environment's webhook token **before** creating the webhook (so the first event is accepted), then `GET /v3/webhooks?limit=100`, find the one whose `url` is this app's endpoint and `PUT /v3/webhooks/{id}`, or `POST /v3/webhooks` if none. Body: `name`, `url`, `email`, `enabled: true`, `interrupted: false`, `apiVersion: 3`, `authToken`, `sendType: "SEQUENTIALLY"`, `events: [...]`. Re-running it rotates the token and never duplicates the webhook.
5. **Runtime settings in one row**: `active_env` (which environment new sales use) and `sales_enabled`. `set_env` and `set_sales` refuse to proceed unless that environment has both a key and a webhook token. The public app reads only a secret-free view (sales on/off, active env, prices).
6. **Webhook endpoint identifies the environment by token**: compare the `asaas-access-token` header against every stored environment token in constant time (always check all of them), and record the event with the environment that matched. Unknown token returns 401.
7. **Each Asaas object remembers its environment** (`env` column on checkouts, subscriptions and payments). Cancel/update a subscription in the environment where it was created, not in the currently active one.
8. **Never return secrets**: no endpoint returns the key or the webhook token; logs never contain them; every admin action writes an audit row (`save_key`, `remove_key`, `setup_webhook`, `set_env`, `set_sales`).
9. **Legacy fallback**: if the secret store has no key yet, read `ASAAS_API_KEY`/`ASAAS_WEBHOOK_TOKEN` env vars for the legacy environment only, so old deployments keep working during migration.

Tell the user, in plain words, that the only manual steps are: create the API key in Asaas (`Integrações > Chaves de API`), paste it in the panel, click `Configurar webhook`, and turn sales on. For the product logo and name on the Asaas checkout page, each Asaas account has its own branding; use a separate account or subaccount per product.

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

## Recurring Subscriptions (Checkout RECURRENT)

Learned in production with Asaas Checkout + subscriptions:

- Create with `POST /v3/checkouts`, `billingTypes: ["CREDIT_CARD"]`, `chargeTypes: ["RECURRENT"]`, `subscription: { cycle, nextDueDate }` (`nextDueDate` in `AAAA-MM-DD HH:mm:ss`, Brasília time), `items: [{ name, description, quantity: 1, value }]`, `callback: { successUrl, cancelUrl, expiredUrl }`, `minutesToExpire`, and `externalReference` with the local user and plan. Price always comes from the server catalog, never from the client.
- Save the checkout locally (`id`, user, plan, env, status) **before** redirecting. The local checkout id is the link back to the user.
- **`CHECKOUT_PAID` may arrive with `customer: null` and after the subscription/payment events.** Subscription and payment payloads carry `checkoutSession` = the checkout id. Link subscription, payment and customer to the user through `checkoutSession` on every event, in any order (an after-insert/after-update trigger on the events table works well), and backfill old events once.
- Monthly value for MRR: monthly plans as is, yearly plans divided by 12.
- **Cancel without refund**: `DELETE /v3/subscriptions/{id}` (treat 404 as already removed), mark the local row `DELETED` with `canceled_at` and an optional reason, keep access until the end of the paid period, and let expiry downgrade the account automatically. Mention the consumer 7-day withdrawal right (CDC art. 49) in the terms.
- Changing the value of a card subscription (`PUT /v3/subscriptions/{id}` with `value`, `updatePendingPayments: false`), for example after an introductory price, requires card tokenization enabled in the Asaas account; if Asaas refuses, mark it as failed and warn in the admin panel.
- Recommended events for subscription products: `CHECKOUT_CREATED`, `CHECKOUT_PAID`, `CHECKOUT_CANCELED`, `CHECKOUT_EXPIRED`, `SUBSCRIPTION_CREATED`, `SUBSCRIPTION_UPDATED`, `SUBSCRIPTION_INACTIVATED`, `SUBSCRIPTION_DELETED`, `PAYMENT_CREATED`, `PAYMENT_UPDATED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`, `PAYMENT_REFUNDED`, `PAYMENT_PARTIALLY_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED`, `PAYMENT_CHARGEBACK_DISPUTE`, `PAYMENT_AWAITING_CHARGEBACK_REVERSAL`.
- Sandbox purchase test: switch the panel to sandbox, turn sales on, buy with an Asaas sandbox test card, and confirm the events arrive and grant access. Decline test cards in the current docs: `5184019740373151` and `4916561358240741`.

## Admin Finance Metrics

With subscriptions mirrored locally (`created_at`, `canceled_at`, monthly value, env), the admin panel can show without extra API calls:

- MRR now and per month (subscriptions created before the month end and not canceled by then), ARR = MRR x 12, growth vs previous month.
- New MRR, canceled MRR and net new MRR in the month (start + new - canceled = end).
- Customer churn = canceled in the month among those active at month start / active at month start; revenue churn = same in MRR; use a 3-month average for stability.
- ARPU = MRR / paying customers; LTV = ARPU / monthly churn; paid conversion = paying accounts / all accounts.
- Received, fees and net this month from payment mirrors (`value - netValue`), live balance from `GET /v3/finance/balance`, overdue and refund/chargeback alerts.
- Show the environment picker (sandbox/production) on every finance view.

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

## Web App Setup Tutorial (Manual Fallback)

Prefer the admin-managed `setup_webhook` above. Use this only when the system cannot call the Asaas webhook API and the user needs to create the webhook manually in the Asaas dashboard:

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

Admin-managed setup:

- Saving a sandbox key in the production card (and vice versa) is refused; an invalid key is refused after the `/finance/balance` check; nothing is stored in either case.
- No endpoint, log or page returns the full key or the webhook token; non-admin users get 403 on every admin action.
- Running `setup_webhook` twice keeps one webhook in Asaas and rotates the token; the old token is rejected with 401 and the new one accepted.
- An event signed with the sandbox token is recorded as sandbox even when production is active.
- `set_env`/`set_sales` refuse an environment without key or webhook.
- Canceling a sandbox subscription while production is active calls the sandbox API.

General:

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
