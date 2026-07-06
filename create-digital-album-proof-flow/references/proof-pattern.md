# Proof Pattern Reference

This reference captures the standalone parts of Memora Proof's digital album creation flow. Use it as a behavioral contract, not as copy-paste PHP.

## Source Files Studied

- `proof/app/models/AlbumModel.php`: album model library with `name`, `size_label`, optional `included_photos`, owner scope, and size ordering.
- `proof/app/controllers/AdminSettingsController.php`: add/update/delete album model endpoints, CSRF, Ajax payloads, onboarding completion.
- `proof/app/controllers/AdminAlbumController.php`: album create flow, plan limit, `album_model_id` validation, draft creation, JSON redirect.
- `proof/app/models/Album.php`: `createAlbum()` inserts a draft project into the album/event table with `album_model_id`, slug, status, dates, and notification message.
- `proof/app/views/admin/settings/index.php`: model list, modal add/edit UI, inline Ajax update.
- `proof/app/views/admin/album/create_album.php`: Proof presentation for `Novo projeto de álbum`, model select, size/photo details, next-step submit.

## Minimal Data Model

Use local naming conventions, but preserve these concepts:

### Album Models

- `id`
- `owner_id` or `tenant_id`
- `name`
- `size_label`
- `included_photos` optional
- `active` optional
- timestamps optional

Rules:

- Scope all queries by owner/tenant.
- Normalize sizes to `NNxNN` when saving.
- Sort by `name`, then `size_label`.
- If deleting is risky because albums reference a model, soft-delete/deactivate instead.

### Digital Album Projects

- `id`
- `owner_id` or `tenant_id`
- `title`
- `slug` or public token
- `album_model_id`
- `status`, initially `draft`
- `event_date` optional
- `approval_deadline` optional
- timestamps

Rules:

- `album_model_id` is required.
- The chosen model must belong to the same owner/tenant.
- Store the project before upload; upload belongs to the next route.

### Album Spreads/Lâminas

The creation flow only needs to redirect to the spread upload route. A complete proofing module normally also has:

- `album_versions`
- `album_spreads`
- annotation/approval tables
- public token/slug for client review

Do not block the creation flow on building the entire review system unless the user asks for the full module.

## Presentation Details To Preserve

The screen should feel like Proof:

- Compact operational admin layout.
- Serif title with a copper/accent italic phrase is fine when the target design supports it.
- Cards around form sections, not a marketing hero.
- One clear next step: create project, then upload lâminas.
- Right/sticky context panel on desktop, below the form on mobile.
- Stable button dimensions so loading text does not shift layout.

Recommended pt-BR labels:

- `Proof · Álbuns`
- `Novo projeto de álbum.`
- `Dados do álbum`
- `Nome do álbum *`
- `Modelo do álbum *`
- `Tamanho contratado`
- `Fotos contratadas`
- `Próxima etapa`
- `Enviar lâminas`
- `Avançar para envio de lâminas`
- `Fluxo do álbum`
- `Modelo obrigatório`

Standalone copy should say:

- `O projeto será vinculado ao modelo e tamanho selecionado.`
- `Depois de criar, envie as lâminas para revisão da cliente.`
- `Nenhum modelo cadastrado. Crie um em Ajustes > Modelos para continuar.`

Avoid System-specific copy such as `Modelos herdados do Memora System`.

## Option Label Logic

When rendering the model select:

1. Read `model.name` and `model.size_label`.
2. If one is empty, show the other.
3. Normalize both by removing accents, punctuation, and repeated spaces.
4. If the name already contains the size, show only the name.
5. Otherwise show `name - size_label`.

Each option should expose enough data for the UI to update the detail fields:

- `data-model-name`
- `data-model-size`
- `data-included-photos`

## Standalone Create Flow

Backend:

1. Require auth.
2. Enforce plan/limit if the app has one.
3. Validate CSRF/session.
4. Sanitize inputs.
5. Validate title.
6. Validate selected model by owner/tenant.
7. Insert draft album.
8. Return JSON `{success,message,album_id,redirect_url}` for Ajax.
9. Redirect normally for non-Ajax form submissions.

Frontend:

1. Disable submit during save.
2. Change label to `Criando...`.
3. Submit `FormData` with `Accept: application/json` and an Ajax marker when appropriate.
4. Render field-level errors from server payload.
5. On success, show a brief success state and navigate to `redirect_url`.

## Explicitly Out Of Scope

For the standalone skill, do not port:

- Memora System inherited models.
- External event/client binding.
- Contract album detection.
- Groq analysis.
- System badges/locks.
- Event-specific `contracted_album_*` matching.

Those belong to an integration skill, not to this standalone digital album creation pattern.
