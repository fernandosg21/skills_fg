# Admin-managed Asaas setup: key in the panel, webhook created by the system

Reference implementation extracted from a production SaaS (Supabase + Edge Functions + vanilla JS PWA). The operator only pastes the Asaas API key for each environment; the system validates it, stores it as a secret and creates the webhook with its own token. Adapt names to the target app; the contract stays the same in PHP/MySQL (see the last section).

## Contract

| Action | Who | What it does |
|---|---|---|
| `status` | superadmin | Per environment: configured, key hint (last 4), account name/e-mail, live balance (`/finance/balance`), webhook configured. Plus active env, sales on/off, webhook URL and the last audit rows. Never the key or token. |
| `save_key {env, key}` | superadmin | Prefix check, `GET /finance/balance` on that env (must be 200), `GET /myAccount/commercialInfo/` for name/e-mail, store the key as a secret, upsert metadata, audit. |
| `remove_key {env}` | superadmin | Refuse if this env is active with sales on. Delete key and webhook token secrets and metadata, audit. |
| `setup_webhook {env}` | superadmin | New random token, store it, then create or update the webhook pointing to this app (matched by URL), save `webhook_id`, audit. |
| `set_env {env}` | superadmin | Requires key and token for that env. Changes which env new checkouts use. |
| `set_sales {enabled}` | superadmin | Turning on requires key and token for the active env. Off shows a waitlist instead of the buy button. |

Public app reads only a secret-free function: sales on/off, active env and prices.

## Schema (Postgres / Supabase)

```sql
create table if not exists public.admins (user_id uuid primary key references auth.users (id) on delete cascade);

create table if not exists public.billing_settings (
  id            boolean primary key default true check (id),   -- single row
  active_env    text not null default 'sandbox' check (active_env in ('sandbox', 'production')),
  sales_enabled boolean not null default false,
  updated_at    timestamptz not null default now(),
  updated_by    uuid
);
insert into public.billing_settings (id) values (true) on conflict (id) do nothing;

-- Metadata only. The key itself lives in Vault.
create table if not exists public.billing_keys (
  env text primary key check (env in ('sandbox', 'production')),
  key_hint text, account_name text, account_email text, validated_at timestamptz,
  webhook_id text, webhook_url text, webhook_at timestamptz,
  updated_at timestamptz not null default now(), updated_by uuid
);

create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(), actor uuid, action text not null, detail jsonb not null default '{}'
);

alter table public.billing_settings enable row level security;
alter table public.billing_keys enable row level security;
alter table public.admin_audit enable row level security;
revoke all on public.admins, public.billing_settings, public.billing_keys, public.admin_audit from anon, authenticated;
grant all on public.admins, public.billing_settings, public.billing_keys, public.admin_audit to service_role;

-- Secrets in Vault, through a whitelisted name. Only the server (service_role) can call these.
create or replace function public._asaas_secret_set(p_name text, p_secret text)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_name !~ '^asaas_(api_key|webhook_token)_(sandbox|production)$' then raise exception 'invalid_name'; end if;
  select id into v_id from vault.secrets where name = p_name;
  if v_id is null then perform vault.create_secret(p_secret, p_name, 'Asaas secret');
  else perform vault.update_secret(v_id, p_secret); end if;
end; $$;

create or replace function public._asaas_secret_del(p_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_name !~ '^asaas_(api_key|webhook_token)_(sandbox|production)$' then raise exception 'invalid_name'; end if;
  delete from vault.secrets where name = p_name;
end; $$;

-- Everything the server functions need, in one call.
create or replace function public.billing_runtime()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'active_env', s.active_env, 'sales_enabled', s.sales_enabled,
    'keys', jsonb_build_object(
      'sandbox', (select decrypted_secret from vault.decrypted_secrets where name = 'asaas_api_key_sandbox'),
      'production', (select decrypted_secret from vault.decrypted_secrets where name = 'asaas_api_key_production')),
    'tokens', jsonb_build_object(
      'sandbox', (select decrypted_secret from vault.decrypted_secrets where name = 'asaas_webhook_token_sandbox'),
      'production', (select decrypted_secret from vault.decrypted_secrets where name = 'asaas_webhook_token_production')))
  from public.billing_settings s;
$$;

revoke all on function public._asaas_secret_set(text, text) from public, anon, authenticated;
revoke all on function public._asaas_secret_del(text) from public, anon, authenticated;
revoke all on function public.billing_runtime() from public, anon, authenticated;
grant execute on function public._asaas_secret_set(text, text) to service_role;
grant execute on function public._asaas_secret_del(text) to service_role;
grant execute on function public.billing_runtime() to service_role;
```

Add an `env text` column to every mirrored Asaas table (checkouts, subscriptions, payments, events).

Supabase MCP note: `apply_migration` may hang waiting for a confirmation when the SQL contains `delete` or an `update` without `where`. Apply such functions in a separate small migration, keep `where` on every update, and verify the result with a read-only query afterwards.

## Shared client (Deno / Edge Functions)

```ts
export type AsaasEnv = 'sandbox' | 'production';
export const ENVS: AsaasEnv[] = ['sandbox', 'production'];
export const ASAAS_URLS: Record<AsaasEnv, { api: string; checkout: string }> = {
  sandbox: { api: 'https://api-sandbox.asaas.com/v3', checkout: 'https://sandbox.asaas.com/checkoutSession/show' },
  production: { api: 'https://api.asaas.com/v3', checkout: 'https://asaas.com/checkoutSession/show' },
};

export async function loadRuntime(db) {
  const { data } = await db.rpc('billing_runtime');
  const legacyEnv: AsaasEnv = Deno.env.get('ASAAS_ENV') === 'production' ? 'production' : 'sandbox';
  const keys = { sandbox: data?.keys?.sandbox ?? null, production: data?.keys?.production ?? null };
  const tokens = { sandbox: data?.tokens?.sandbox ?? null, production: data?.tokens?.production ?? null };
  // Legacy env vars only fill what the secret store does not have yet.
  if (!keys[legacyEnv] && Deno.env.get('ASAAS_API_KEY')) keys[legacyEnv] = Deno.env.get('ASAAS_API_KEY')!;
  if (!tokens[legacyEnv] && Deno.env.get('ASAAS_WEBHOOK_TOKEN')) tokens[legacyEnv] = Deno.env.get('ASAAS_WEBHOOK_TOKEN')!;
  return { activeEnv: data?.active_env === 'production' ? 'production' : 'sandbox', salesEnabled: !!data?.sales_enabled, keys, tokens };
}

export class AsaasError extends Error { constructor(m: string, public status: number) { super(m); } }

export async function asaas(target: { env: AsaasEnv; key: string | null }, path: string, init: { method?: string; body?: unknown } = {}) {
  if (!target.key) throw new AsaasError(`No Asaas key for ${target.env}`, 0);
  const res = await fetch(`${ASAAS_URLS[target.env].api}${path}`, {
    method: init.method ?? 'GET',
    headers: { access_token: target.key, 'Content-Type': 'application/json', accept: 'application/json', 'User-Agent': 'App/1.0' },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) throw new AsaasError(`Asaas ${path}: ${data?.errors?.map((e: any) => e.description).join('; ') || `HTTP ${res.status}`}`, res.status);
  return data; // never log the key
}

export function safeEqual(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}
```

## Admin function (superadmin only)

Deploy with JWT verification off and check the user inside (Asaas-facing and admin-facing functions both need custom auth). Every action first resolves the logged user from the bearer token and checks the `admins` table.

```ts
const WEBHOOK_URL = `${Deno.env.get('SUPABASE_URL')!.replace(/\/$/, '')}/functions/v1/asaas-webhook`;
const WEBHOOK_EVENTS = [/* see SKILL.md, Recurring Subscriptions */];

function keyLooksWrong(e: AsaasEnv, key: string) {
  if (!/^\$aact_[A-Za-z0-9_]+/.test(key) || /\s/.test(key)) return 'format';
  if (e === 'production' && key.startsWith('$aact_hmlg_')) return 'sandbox_key';
  if (e === 'sandbox' && key.startsWith('$aact_prod_')) return 'production_key';
  return null; // old keys without env prefix: rely on the API check
}

// save_key
const wrong = keyLooksWrong(env, key);
if (wrong) return fail(wrong);
try {
  await asaas({ env, key }, '/finance/balance');                                   // must answer 200
  account = await asaas({ env, key }, '/myAccount/commercialInfo/').catch(() => null);
} catch (x) { return fail((x as AsaasError).status === 401 ? 'invalid_key' : 'asaas_unavailable'); }
await db.rpc('_asaas_secret_set', { p_name: `asaas_api_key_${env}`, p_secret: key });
await db.from('billing_keys').upsert({ env, key_hint: key.slice(-4), validated_at: now,
  account_name: account?.companyName || account?.name || null, account_email: account?.email || null, updated_by: user.id });

// setup_webhook
const token = Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, '0')).join('');
const config = { name: `App ${env}`, url: WEBHOOK_URL, email: meta?.account_email || user.email, enabled: true,
  interrupted: false, apiVersion: 3, authToken: token, sendType: 'SEQUENTIALLY', events: WEBHOOK_EVENTS };
const list = await asaas(target, '/webhooks?limit=100');
const existing = (list?.data || []).find((w: any) => w.url === WEBHOOK_URL);
await db.rpc('_asaas_secret_set', { p_name: `asaas_webhook_token_${env}`, p_secret: token }); // before enabling
const saved = existing
  ? await asaas(target, `/webhooks/${encodeURIComponent(existing.id)}`, { method: 'PUT', body: config })
  : await asaas(target, '/webhooks', { method: 'POST', body: config });
await db.from('billing_keys').update({ webhook_id: saved?.id || existing?.id, webhook_url: WEBHOOK_URL, webhook_at: now }).eq('env', env);
```

`authToken` must be 32 to 255 characters. Audit every action with `{ env, key_hint }`, never with the key.

## Webhook function

```ts
const rt = await loadRuntime(db);
const got = req.headers.get('asaas-access-token') || '';
const matches = ENVS.map((e) => !!rt.tokens[e] && safeEqual(got, rt.tokens[e]!)); // check all, always
const from = ENVS.find((_, i) => matches[i]);
if (!got || !from) return json({ error: 'unauthorized' }, 401);

const raw = await req.text();
const body = JSON.parse(raw);
const id = String(body?.id || `hash_${await sha256(raw)}`);
// Idempotent insert keyed by event id, with env = from. Failure to store returns 500 so Asaas retries.
// Apply business rules after storing; a rule failure is logged and left unprocessed, but still returns 200
// so one bad event does not block the sequential queue.
```

## Admin UI checklist

- Environment cards with status chips: `Chave conferida`, `Webhook ativo`, balance, account name; actions `Salvar chave`, `Configurar webhook`, `Remover`.
- A status strip always visible at the top: `Vendendo` / `Vendas desligadas` and which environment is in use; tapping it opens the sales settings.
- Confirm dialogs when switching to production or turning sales on in production (`As assinaturas novas passam a cobrar de verdade`).
- Mobile-first: tabs (Resumo, Métricas, Receita, Assinantes, Ajustes) instead of one long page; an environment picker on every finance tab.
- Error messages in plain language: `Essa chave é do sandbox`, `O Asaas recusou a chave`, `Configure o webhook antes de ligar as vendas`.

## PHP / MySQL adaptation

- Store the key and token encrypted (libsodium `sodium_crypto_secretbox` with a master key from the server environment) in a `billing_secrets` table, or in the host's secret manager. Keep `billing_keys` metadata and `billing_settings` exactly as above.
- Same actions behind an authenticated, CSRF-protected admin controller restricted to the superadmin role.
- Webhook route stays the only CSRF-exempt route; compare tokens with `hash_equals` against every environment token.
- `WEBHOOK_URL` is `rtrim(APP_URL, '/') . '/webhooks/asaas'`, and it must be public HTTPS (Asaas rejects localhost).
