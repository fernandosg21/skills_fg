---
name: memora-feature-package
description: "Build or refresh upload-ready feature folders for Memora and related PHP projects. Use when the user asks to package, deliver, or publish a Memora feature. Produces mirrored tmp/feature-* bundles with validation and enforces the Memora editorial gate: classify the change, update stories and blog knowledge when applicable, test the social source, and keep the posts project fed without authorizing unrelated deployment."
---

# Memora Feature Package

Create or refresh a deploy-ready `tmp/feature-*` package after code changes, preserving project-relative paths exactly and validating the copied bundle before handoff.

## Trigger

Use this skill when the user asks for any of these:

- `faça a feature`, `faca a feature`, `faça a pasta da feature`, or `crie a pasta em tmp`.
- Files to upload by FTP/server, a deploy-ready bundle, or a mirrored feature package.
- A Memora feature/change that should be evaluated for the in-app novidades/stories catalog.

## Workflow

1. Confirm the repo root. For Memora it is usually `A:\Site Fotografia\Memora.fot.br`.
2. Inspect `git status --short` and targeted diffs. Use an explicit changed-file list; never package the whole dirty worktree.
3. Include every changed runtime file under the same relative path inside `tmp/<feature>/`.
4. Add direct dependencies needed by those files: included helpers, APIs, assets, schema/migration scripts, side entrypoints, and story catalog changes.
5. Name the folder `tmp/feature-<area>-<mudanca>-<yyyymmdd>`. Refresh the same folder for follow-up edits in the same rollout.
6. Add `MANIFESTO.txt` with summary, files to upload, post-upload steps, and validation. Always write it in pt-BR with correct accents, direct wording, and operator-friendly language.
7. Run the **Mandatory Editorial Gate** below before finalizing the package. This is part of the definition of done, not an optional review.
8. Update `docs/produto/catalogo-crescimento-correcoes.md` for product-visible Memora work, unless the change is package-only, docs-only, internal-only, or the user explicitly says not to catalog it.
9. Validate source and package files. Use `php -l` for PHP, `node --check` for JS, and compare SHA-256 between source and package.
10. Read the generated manifest before handoff. Fix any missing accents, mojibake, or ASCII-only Portuguese before reporting the package.
11. List the final recursive tree and report the package path, files, validation results, database steps, editorial decision, social-source verification, production status, and catalog decision.

## Mandatory Editorial Gate

For every Memora delivery, explicitly classify it as one of:

- `individual_story`: a new user-actionable capability, workflow, module, integration, or meaningful visible behavior.
- `grouped_small_fixes`: several related minor corrections worth communicating together.
- `no_story`: an isolated bug fix, visual polish, copy, validation, guard, cache, performance, or hardening change.
- `tenant_notice`: relevant only to a specific account and better communicated directly.
- `operator_only`: internal administration, infrastructure, unreleased pilot, or operational tooling.

Then enforce all applicable outcomes:

1. For `individual_story` or `grouped_small_fixes`, add or update `includes/update_stories.php` in the same delivery. Give the entry a stable ID, benefit-first copy, a visible location, audience/module/segment limits when relevant, and the responsible author.
2. If the change creates or alters a durable user-facing capability in CRM/WhatsApp, Agenda, Financeiro/Contratos, Entregas/Proof, Analytics, Recreação, or editorial content, update the matching `docs/blog/base-conhecimento-*.md` even when the story classification is `no_story`.
3. If neither story nor blog base applies, record the reason in `AGENTS.md`, the product catalog when applicable, and the handoff. Never leave the decision implicit.
4. Whenever `includes/update_stories.php` or any consumed `docs/blog/base-conhecimento-*.md` changes, run `php scripts/test_social_content_context.php`. Do not finish while the test fails, a source is truncated, a future/inactive story leaks, or an internal path/client datum appears.
5. Include every changed editorial file in the mirrored package under its original path. Do not maintain a second manual list of social updates: `includes/social_content_context.php` must continue deriving recent updates from `includes/update_stories.php`.

### Memora Posts production sync

In the Memora repository `A:\Site Fotografia\Memora.fot.br`, Fernando permanently authorized automatic production publication **only for the editorial source consumed by the project Memora - Posts**. When the editorial gate changes the social endpoint/helper, `includes/update_stories.php`, or a consumed `docs/blog/base-conhecimento-*.md`:

- Publish the changed editorial subset in the same delivery without waiting for another authorization.
- Keep the upload list explicit and isolated from the feature's runtime files. This standing authorization never permits publishing the feature implementation, migrations, other documentation, or unrelated dirty-worktree changes.
- Use the established Memora FTP safety procedure: remote backup outside `/public_html`, temporary upload/promotion, per-file SHA-256 verification, rollback on failure, and zero temporary residues.
- Verify `https://memora.fot.br/api/social_context.php?area=atualizacoes&format=markdown` after publication. Confirm HTTP 200, the expected editorial ID/content, and absence of internal paths or client data.
- If publication or verification fails, report the editorial source as not synchronized; do not claim the feature delivery is fully complete. Preserve the validated package and rollback evidence.

Outside this exact Memora editorial scope, follow the repository's normal deployment authorization rules.

## Growth And Fix Catalog

Use `docs/produto/catalogo-crescimento-correcoes.md` to measure product growth and bug-fix work.

- Classify each catalog row as `funcionalidade_nova`, `ajuste`, or `correcao_bug`.
- Use stable IDs in the format `MEMORA-YYYY-MM-DD-NNN`.
- Keep the accumulated counters in the document in sync with the history table.
- Record the story decision in the row: individual story, grouped story, no story, tenant notice, or operator-only.
- When several corrections or adjustments are worth showing to users, add or update a numbered grouped story in `includes/update_stories.php`, such as `Correcoes #1: ...`.
- Keep grouped correction stories user-facing: mention the visible area and practical benefit, not routes, API names, schema, HTTP details, or deployment mechanics.
- Add the catalog file and `includes/update_stories.php` to the mirrored package whenever either changes.

## Novidades Story Check

For Memora user-facing changes, review `includes/update_stories.php` in the same delivery pass.

- Add an individual story only for new user-actionable capabilities, new workflows, new modules, new integrations, or meaningful visible behavior that users should discover.
- Group several minor fixes as `Correções de pequenos bugs e ajustes pontuais` only when they are worth communicating together.
- Omit stories for isolated bug fixes, copy tweaks, UI polish, access guards, validation tweaks, cache/version bumps, schema hardening, or internal-only changes.
- Keep copy in plain pt-BR, benefit-first, and photographer/user-facing.
- Do not mention internal routes, API/database/schema names, HTTP codes, helper names, deployment mechanics, or privileged backoffice details.
- Use visible menu/function names when saying where the user can find the feature.
- If no story is added, explicitly say why in the handoff.
- This section defines copy quality; the Mandatory Editorial Gate defines the required decision, tests, packaging, and production synchronization.

## Packaging Script

Use the bundled PowerShell helper when the file list is known:

```powershell
$files = @(
  'adm/example.php',
  'assets/js/example.js',
  'includes/update_stories.php'
)

& 'C:\Users\ferna\.codex\skills\memora-feature-package\scripts\build_feature_package.ps1' `
  -FeatureName 'feature-area-mudanca-20260614' `
  -Files $files `
  -Summary 'Resumo em pt-BR do que a feature entrega.' `
  -PostUpload 'Etapas após upload, incluindo banco de dados quando houver.'
```

Pass `-Summary` and `-PostUpload` already in pt-BR with accents. If the helper shows `HashMatch = False` or PHP lint failure, fix and recopy before handoff. Run `node --check` separately for copied JS files.

## Handoff

Keep the final response concise:

- Package path.
- Mirrored files included.
- Validation results (`php -l`, `node --check`, SHA-256 parity).
- Post-upload/database notes.
- Story added, updated, omitted, or not applicable.
- Blog knowledge base updated or explicitly not applicable.
- `php scripts/test_social_content_context.php` result when editorial files changed.
- Editorial production publication and live endpoint result when the Memora Posts source changed.
- Catalog updated or explicitly omitted, including the current counters when updated.
- Note that unrelated dirty worktree changes were left untouched when relevant.
