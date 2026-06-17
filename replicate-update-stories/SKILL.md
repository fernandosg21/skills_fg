---
name: replicate-update-stories
description: Build, port, audit, or extend in-app update stories/release-story flows for any project, including tenant-scoped story catalogs, seen-state tracking, auto-opening story UI, editorial classification of new features vs point fixes, tenant notification decisions, and hiding SaaS/operator management changes from normal users.
---

# Replicate Update Stories

Use this skill to reproduce the Memora-style "stories of updates" pattern in another system or to decide whether a product change should be shown to tenants/users, grouped as small fixes, sent as a direct tenant notice, or kept hidden because it belongs to SaaS/platform management.

## First Pass

1. Identify the product audiences before writing code:
   - normal end users or tenant users
   - tenant owners/admins
   - SaaS/platform operators
   - internal support/development only
2. Find the project equivalents for authentication, tenant/account context, roles, layouts, API routes, CSRF/session protection, migrations/schema helpers, and asset loading.
3. Map the surface that will consume the story. Customer product surfaces can receive tenant/user stories; SaaS/operator shells need a separate operator-only flow or no story.
4. Inspect existing release-note, notification, onboarding, modal, or dashboard patterns. Reuse local UI, auth, routing, and data helpers instead of inventing a parallel system.
5. Classify the change with `references/editorial-decision-matrix.md` before adding a story.
6. If implementing the feature from scratch or porting the Memora pattern, read `references/memora-pattern.md`.

Optional helper:

```bash
python scripts/story_decision.py --summary "New monthly event report with package ranking" --audience tenant-user --change-type feature --user-actionable --visible-to-tenant
```

Treat the helper as a first-pass checklist, not as a substitute for code/product judgment.

## Core Architecture

Implement the flow as five small contracts:

1. **Registry/catalog**: stable story entries with `id`, `title`, `summary`, `where_label`, optional `href`, `icon`, `published_at`, optional `active`, and optional audience/tenant/segment targeting.
2. **Eligibility filter**: only return active, already-published stories that match the current audience, tenant segment, role, plan, or feature flag.
3. **Seen state**: decide whether dismissal is per user or tenant/account-wide, then store `(tenant/account id, user id if applicable, story id, seen_at)` with a uniqueness guarantee so stories are idempotently marked as read.
4. **Authenticated API**: `GET` returns all eligible stories plus unseen stories/count; `POST mark_seen` accepts only active eligible ids and uses CSRF/session protection.
5. **Client UI**: dashboard button + badge, auto-open unseen stories, modal/card carousel, progress bars, previous/next, pause/resume, close, see-later, optional open-link, keyboard support, and immediate mark-seen when a slide is displayed.

Keep catalog data server-owned. Render story text as text, not HTML. Allow only safe internal links when stories navigate into the app.

## Classification

Decide the communication class before editing files:

- `individual_story`: new function, new workflow, new module, new integration, or a clearly user-actionable capability available in the normal product surface.
- `grouped_small_fixes`: several minor corrections that users may notice and that are useful to summarize together.
- `no_story`: isolated bug fix, copy tweak, UI polish, validation edge case, cache/version bump, schema hardening, access guard, refactor, internal API work, performance tune, or deployment-only change.
- `tenant_notice`: a change tenants must act on or must explicitly know about, such as billing/plan impact, permissions/data visibility, legal/compliance terms, deprecation, migration, downtime, destructive workflow, or automation that can send messages/charges.
- `operator_only`: SaaS/platform management feature, subscriber administration, plan/coupon management, tenant billing operations, internal analytics, support tooling, migration console, or anything normal tenants/users should not see.

If a change is both product-visible and tenant-action-required, do the direct tenant notice first. A story can be secondary only if it is safe, non-sensitive, and useful inside the product.

## Copy Rules

Write stories for the reader who can actually use the feature:

- Lead with the practical benefit.
- State where to find it using visible menu/module labels.
- Keep the text short and plain-language.
- Avoid implementation terms: HTTP, API, database/table names, helper/class names, routes, schema changes, deployment steps, queues, tokens, webhooks, internal SaaS/admin/backoffice structure.
- Do not expose privileged or operator-only areas in tenant/user stories.
- Do not turn every fix into a slide. If in doubt, default to `no_story`.

Match the language of the product. For pt-BR products, write natural pt-BR for users, not translated engineering notes.

## Porting Checklist

When replicating this into a new project:

1. Add the catalog near other domain/configuration helpers.
2. Add a migration/schema step for seen state, or use the project's existing migration system.
3. Add an authenticated endpoint under the app's normal API conventions.
4. Add a dashboard/topbar entry point with an unread badge.
5. Add the client script/style in the same asset pipeline used by the target app.
6. Filter by tenant/account, role, plan, segment, feature flag, and release date before the UI receives stories.
7. Make `mark_seen` idempotent and scoped to the logged-in tenant/account and user.
8. Store and compare `published_at` in UTC unless the project already has a release-time convention.
9. Keep the icon allowlist or icon component mapping aligned with the icons used by the catalog.
10. Validate mobile and desktop controls: previous, next, pause/resume, close, see later, and open function.
11. Define "see later" as closing the carousel; already displayed slides remain seen and undisplayed slides remain unseen.
12. Confirm a story is marked seen when displayed, not only when the user reaches the end.
13. Confirm SaaS/operator-only changes do not appear for tenant users.

## Validation

Before finishing:

- Run syntax/type checks for changed server and client files.
- Exercise the API with authenticated GET and POST if the project has a local dev/test path.
- Confirm unseen count decreases after `mark_seen`.
- Confirm a future `published_at` story does not appear.
- Confirm an inactive story does not appear.
- Confirm story ids are unique and match the project's slug rules.
- Confirm a tenant/segment/role-restricted story appears only for the intended audience.
- Confirm every catalog icon renders or intentionally falls back.
- Confirm safe links reject external URLs, protocol-relative URLs, and empty/invalid values.
- Confirm destination routes enforce their own authorization even when linked from a story.
- Confirm focus handling, labels, keyboard behavior, and reduced-motion behavior are acceptable for the target UI.
- Review every story entry against the decision matrix.
