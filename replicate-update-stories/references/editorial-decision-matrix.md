# Editorial Decision Matrix

Use this matrix before adding or editing story entries.

## Inputs To Gather

- What changed in user-visible terms?
- Who can use it: tenant user, tenant owner/admin, SaaS operator, or internal team?
- Is the change visible in the normal product navigation?
- Can the reader take a clear action after seeing the story?
- Does the change affect billing, plan limits, permissions, data visibility, compliance, downtime, migrations, destructive actions, or outbound automations?
- Is this a single fix, a group of fixes, or a new capability?
- Does the feature belong to the customer-facing system or to platform/SaaS management?

## Decision Table

| Situation | Class | Communicate Where |
| --- | --- | --- |
| New user-facing function, workflow, module, integration, report, or automation | `individual_story` | In-app stories for the affected product audience |
| Existing feature becomes materially more useful and users can act differently | `individual_story` | In-app stories, targeted if needed |
| Several small fixes users may notice but none deserves a slide alone | `grouped_small_fixes` | One generic small-fixes story |
| One isolated bug fix, validation tweak, copy tweak, UI polish, cache/version bump, schema hardening, access guard, refactor, internal API change, or deployment task | `no_story` | No story |
| Billing, plan entitlement, terms, permission/data visibility, deprecation, downtime, migration, destructive workflow, or outbound automation risk | `tenant_notice` | Direct tenant notice/banner/email/admin alert; story only if also safe and useful |
| Subscriber management, SaaS admin analytics, coupons/plans, tenant billing operations, platform support tools, migration consoles, or internal dashboards | `operator_only` | SaaS/operator surface only; hide from tenants/users |

## Tenant Notice Triggers

Use a direct tenant notice when the tenant must know before or during use:

- prices, invoices, subscriptions, plan limits, trial/free/paid access, or cancellation rules change
- data visibility, role permissions, sharing, privacy, or legal terms change
- a migration requires tenant action or may alter existing data/workflows
- a feature can send messages, emails, WhatsApp, calendar invites, charges, or public links automatically
- an existing workflow is removed, renamed, deprecated, blocked, or made irreversible
- there is downtime, degraded service, recovery work, or an incident follow-up

Do not bury these only inside stories.

A tenant notice can be a banner, email, admin alert, billing notice, migration checklist, or other explicit channel already used by the product. Choose a channel with auditability when the change affects billing, legal terms, data access, or destructive behavior.

## SaaS Management Hide Rule

If the feature helps the platform owner operate the SaaS business rather than helping a tenant use the product, keep it out of tenant stories. Examples:

- subscriber/tenant reports
- plan catalog, coupon, billing, proration, cancellation, or trial management
- support-only tenant impersonation/export/import controls
- internal financial reconciliation for the SaaS operator
- migrations, backfills, or health checks
- admin-only metrics about tenants

If operators need a story-like flow too, create a separate operator-only catalog and endpoint, gated by platform role and rendered only in the SaaS management shell.

Do not decide from database tables alone. Tenant/account tables often support both product features and SaaS operations. Decide from the consuming surface and audience: product dashboard for tenant users can receive stories; platform/SaaS admin shells stay hidden from tenants.

## Story Entry Quality Gate

A good story answers:

- What changed?
- Why does it help the reader?
- Where can the reader find it?
- Is the text safe for this audience?

Reject or rewrite the story if it exposes internal route names, table names, helper names, API/webhook details, deployment mechanics, privileged admin areas, or sensitive tenant/SaaS structure.
