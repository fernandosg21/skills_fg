# Memora CEP Address Autocomplete Pattern

These notes summarize the Memora implementation that inspired this global skill. Use them as source-backed examples, not as Memora-only requirements.

## Public contract forms

Files observed:

- `contrato.php`
- `contrato_empresa.php`

Pattern:

- Address section starts with `CEP`.
- CEP input uses placeholder `00000-000`.
- Client script strips non-digits, limits to 8 digits, formats `00000-000`, and calls `fetchAddress(...)` only after 8 digits.
- ViaCEP endpoint: `https://viacep.com.br/ws/${cep}/json/`.
- Successful lookup fills:
  - `address` from `data.logradouro`
  - `neighborhood` from `data.bairro`
  - `city` from `${data.localidade} - ${data.uf}` in the public contract flow
- After filling, focus moves to the `number` input.
- The public contract flow also triggers draft/autosave after autofill when available.
- Invalid or failed lookup keeps manual entry available.

Useful lesson: For guided public forms, CEP-first plus focus-to-number makes the intended order obvious: CEP, number, complement, then review the rest.

## Admin client create/edit forms

Files observed:

- `adm/novo_cliente.php`
- `adm/editar_cliente.php`

Pattern:

- Address fields are stored separately as `cep`, `rua`, `numero`, `complemento`, `bairro`, `cidade`, and `estado`.
- CEP is normalized server-side with digits-only logic and formatted for display.
- Client script uses:
  - `formatCep(...)`
  - `lastCep` / `lastCepFetched` guard
  - `AbortController` to cancel stale requests
  - `fetch(https://viacep.com.br/ws/${cepDigits}/json/, { signal })`
- Autofill writes `logradouro`, `bairro`, and `localidade` only when those fields are empty.
- UF is always uppercased and limited to 2 letters.
- Focus moves to `numero` only when the active field is still CEP.

Useful lesson: For edit forms, do not overwrite existing non-empty address fields. This protects manually corrected data.

## Billing/profile forms

Files observed:

- `adm/cadastro.php`
- `adm/ajustes.php`

Pattern:

- Billing CEP uses `inputmode="numeric"`, `autocomplete="postal-code"`, `maxlength="9"`, and a loading spinner.
- Feedback is inline, not only a blocking alert.
- Lookup uses `mode: "cors"`, `cache: "no-store"`, and `AbortController`.
- Billing address fills `billing_address` from `logradouro`.
- Billing province/bairro falls back to a city/UF label when `bairro` is missing.

Useful lesson: For onboarding and billing, make status visible and gentle. The user must still be able to finish manually when ViaCEP misses.

## Portable synthesis

When implementing in any project:

1. Keep CEP first in UI, DOM order, and tab order.
2. Mask CEP immediately and query only at 8 digits.
3. Use ViaCEP with cancellation and stale-request guards.
4. Fill fields from `logradouro`, `bairro`, `localidade`, and `uf`.
5. Prefer preserving non-empty fields in edit screens.
6. Move focus to number after a successful lookup.
7. Keep backend normalization and storage aligned with the UI field names.
