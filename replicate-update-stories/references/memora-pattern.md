# Memora Update Stories Pattern

This reference captures the reusable architecture observed in Memora. Adapt names and framework details to the target project.

## Files In The Source Pattern

- `includes/update_stories.php`: story registry, normalization, active filtering, business-segment filtering, seen-table creation.
- `adm/api/update_stories.php`: authenticated JSON API for listing stories and marking them seen.
- `assets/js/update-stories.js`: client runtime for fetching, badge count, auto-open, carousel, mark-seen, and controls.
- `assets/css/update-stories.css`: modal/card layout, progress bars, mobile controls, badge styling.
- `adm/index.php` and `adm/includes/dashboard_freela.php`: dashboard entry button, CSS/JS loading, runtime config with CSRF token.
- `scripts/ensure_schema_full.php`: full schema alignment for `admin_update_story_views`.
- Access guards allow the stories API on restricted/free dashboard contexts so users can still see safe product updates.

## Registry Contract

Each story entry uses:

```php
[
    'id' => 'yyyy-mm-dd-short-slug',
    'title' => 'Short user-facing title',
    'summary' => 'Plain-language benefit and behavior.',
    'where_label' => 'Visible menu > area',
    'href' => '/internal/path',
    'icon' => 'material_icon_name',
    'published_at' => 'YYYY-MM-DD HH:MM:SS',
    'business_segments' => ['optional_segment'],
    'active' => true,
]
```

Adapt optional targeting fields to the target product: `audiences`, `roles`, `plans`, `segments`, `tenant_ids`, `feature_flags`, or `surface`.

## Server Behavior

- Validate story ids with a strict slug pattern and length limit.
- Reject or report duplicate story ids during review; duplicate ids confuse seen-state tracking.
- Treat `active: false` as hidden.
- Normalize/validate `published_at`; hide future stories.
- Prefer UTC for stored release times when porting to a new stack.
- Normalize links to safe internal paths only. Reject external and protocol-relative URLs.
- Filter by tenant/account segment or other targeting before returning data.
- Sort newest first.
- Create or migrate a seen-state table keyed by tenant/account id, user id, and story id.
- On `GET`, return all eligible stories, unseen stories, and unseen count.
- On `POST mark_seen`, require CSRF/session validation, accept one or more ids, ignore invalid or ineligible ids, and upsert seen rows idempotently.

## Client Behavior

- Read runtime config from a global object or app config: endpoint, CSRF token, auto-open flag, selectors, durations.
- Fetch stories once, update the dashboard badge, and auto-open only unseen stories after a delay.
- Defer auto-open when onboarding tours, blockers, welcome modals, notification modals, or other high-priority overlays are visible.
- Render a modal dialog with:
  - progress bars
  - title, summary, where label, icon
  - previous/next controls outside the card
  - pause/resume
  - close
  - see later
  - optional open-function link
  - keyboard support for Escape, arrows, and space
- Mark the current story seen immediately when displayed.
- Treat "see later" as closing the carousel; already displayed slides stay seen and undisplayed slides remain unseen.
- Refresh count after marking.
- Use `textContent` or framework-safe text rendering for story fields.
- Keep the icon allowlist or icon resolver in sync with catalog values. Otherwise valid stories can silently fall back to a generic icon.

## UX Guardrails

- Every active slide has a clear icon.
- Mobile keeps the same actions as desktop: previous, next, pause/resume, close, see later, open function.
- Long text must not overflow the card; prefer concise copy and scrollable body if needed.
- The story should feel like product guidance, not a changelog or engineering note.
- The "open function" destination should use visible app navigation and should not reveal privileged routes.
- Add or preserve a focus trap, accessible labels, focus restoration, and reduced-motion fallback when the target UI pattern supports them.

## Security And Privacy Guardrails

- Scope reads and seen writes to the authenticated tenant/account and user.
- Never trust client-provided tenant ids.
- Do not return operator-only, internal, or SaaS management stories to tenant users.
- Destination routes must still enforce authorization. A hidden or filtered story is not an access-control layer.
- Do not leak implementation details in copy.
- Do not render story HTML from the catalog unless the project has a sanitizer and a strong reason.
- Keep direct tenant notices separate when a change requires explicit action or carries billing/security/legal/automation risk.
