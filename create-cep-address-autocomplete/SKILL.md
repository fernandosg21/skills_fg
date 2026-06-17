---
name: create-cep-address-autocomplete
description: Create or audit global CEP-first Brazilian address autocomplete flows in web forms. Use when Codex needs to add CEP autocomplete, ViaCEP lookup, postal-code masking, address autofill, reorder an address form so CEP is the first field, or verify rua/logradouro, numero, complemento, bairro, cidade, estado/UF fields in PHP, HTML, React, Next.js, Laravel, Rails, Vue, or static JavaScript apps.
---

# Create CEP Address Autocomplete

## Goal

Build a global, project-agnostic address form pattern where the CEP field is always the first field in the address section and drives autocomplete for the rest of the address. Use the Memora implementation as a proven reference, but adapt to the target project's stack, naming, validation, and design system.

## Workflow

1. Locate every address capture entrypoint: public forms, admin create/edit forms, profile/billing settings, autosave/draft flows, server submit handlers, and contract/document generators that consume address fields.
2. Put `CEP` first in the address section and first in tab order. Keep it before rua/endereco/logradouro, numero, complemento, bairro, cidade, and estado/UF.
3. Use the target app's existing field components and CSS. The CEP input should use `inputmode="numeric"`, `autocomplete="postal-code"`, `maxlength="9"`, and placeholder `00000-000` unless the local design system already has a stronger convention.
4. Add client behavior that masks the CEP as `00000-000`, strips non-digits, limits to 8 digits, and starts the lookup only when 8 digits are available.
5. Query ViaCEP with `https://viacep.com.br/ws/${cepDigits}/json/`. Prefer `AbortController`, a `lastCep` guard, loading feedback, and non-blocking errors.
6. Fill address fields from `logradouro`, `bairro`, `localidade`, and `uf`. Move focus to `numero` when the user is still focused on CEP so the flow naturally continues.
7. Keep manual fallback. If ViaCEP returns `erro`, the network fails, or a field is absent, do not block submission; show a short message and let the user fill manually.
8. Update server-side validation, persistence, and downstream formatting so the saved CEP and address fields match the UI contract.
9. Verify all entrypoints together. Address autocomplete often fails because public and admin forms, create and edit screens, or save and generate paths drift from each other.

## Field Contract

Prefer this order:

1. `cep`
2. `rua` / `address` / `logradouro`
3. `numero` / `number`
4. `complemento` / `complement`
5. `bairro` / `neighborhood`
6. `cidade` / `city`
7. `estado` / `uf` / `state`

Accept local names, but keep the business meaning separate. Do not collapse city and UF into one stored field unless the target app already stores it that way. If the existing app stores a combined city label, follow the local contract while preserving the raw source values when possible.

## JavaScript Pattern

Adapt this pattern to the target framework instead of pasting it blindly:

```js
const digitsOnly = (value) => String(value || "").replace(/\D+/g, "");
const formatCep = (value) => {
  const digits = digitsOnly(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

let lastCep = "";
let cepController = null;

async function lookupCep(cepInput, fields, options = {}) {
  const cepDigits = digitsOnly(cepInput.value).slice(0, 8);
  if (cepDigits.length !== 8 || cepDigits === lastCep) return;

  if (cepController) cepController.abort();
  cepController = typeof AbortController !== "undefined" ? new AbortController() : null;
  options.setLoading?.(true);

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, {
      mode: "cors",
      cache: "no-store",
      signal: cepController ? cepController.signal : undefined,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!data || data.erro) {
      options.setFeedback?.("CEP nao encontrado. Preencha manualmente.", "error");
      lastCep = "";
      return;
    }

    const shouldWrite = (input) => input && (options.overwrite || !input.value.trim());
    if (shouldWrite(fields.street) && data.logradouro) fields.street.value = data.logradouro;
    if (shouldWrite(fields.neighborhood) && data.bairro) fields.neighborhood.value = data.bairro;
    if (shouldWrite(fields.city) && data.localidade) fields.city.value = data.localidade;
    if (fields.state && data.uf) fields.state.value = String(data.uf).toUpperCase().slice(0, 2);

    lastCep = cepDigits;
    options.setFeedback?.("CEP encontrado. Endereco preenchido.", "success");
    options.onFilled?.(data);

    if (fields.number && document.activeElement === cepInput) {
      fields.number.focus();
    }
  } catch (error) {
    if (error && error.name === "AbortError") return;
    options.setFeedback?.("Nao foi possivel consultar o CEP agora. Preencha manualmente.", "error");
    lastCep = "";
  } finally {
    options.setLoading?.(false);
  }
}
```

Use `overwrite: false` in edit forms so existing user-entered addresses are not replaced unexpectedly. Use `overwrite: true` only for fresh empty forms or when the product explicitly wants the CEP to overwrite address data.

## Backend Rules

- Normalize CEP with digits-only logic and format as `00000-000` for display.
- Validate 8 digits when CEP is required; allow blank only when the field is optional.
- Persist street, number, complement, neighborhood, city, and state separately when the schema supports it.
- Keep document/contract tokens aligned with the saved fields. Do not generate legal or billing addresses from stale hidden fields.
- When introducing CEP-first autocomplete to an existing app, update create, edit, public, admin, API, and import paths that can save the same address.

## UX And Accessibility

- Keep CEP visually first, not only first in the DOM.
- Add a small loading indicator or field opacity state while looking up the CEP.
- Prefer inline feedback with `aria-live="polite"` over `alert()`. Keep `alert()` only if it is already the project's pattern.
- Preserve manual editing after autofill.
- On mobile, use numeric keyboard and keep the CEP field short enough to show the full mask.
- Avoid disabled address fields; ViaCEP can miss or return incomplete values.

## Validation

Run the project tests or linters that cover the changed files. Also test manually:

- Valid CEP fills street, neighborhood, city, UF, then focuses number.
- Invalid CEP leaves fields editable and shows a non-blocking error.
- Partial CEP does not call ViaCEP.
- Fast edits cancel or ignore stale requests.
- Edit forms do not overwrite existing non-empty address fields unless intended.
- CEP appears first in every address form on desktop and mobile.

Use the included heuristic checker after editing:

```bash
python scripts/check_cep_address_autocomplete.py <file-or-directory> [more paths...]
```

The checker scans common web files for CEP field order, ViaCEP usage, CEP mask hints, address fill keys, request cancellation, and focus-to-number behavior. Treat it as a guardrail, not a substitute for reading the code and testing the UI.

## References

- `references/memora-pattern.md`: source-derived implementation notes from Memora, including public contract forms, admin client forms, and billing/profile forms. Read it when the task needs concrete examples or when porting the exact Memora-style behavior.
