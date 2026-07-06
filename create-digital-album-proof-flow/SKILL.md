---
name: create-digital-album-proof-flow
description: "Build or audit a standalone Proof-style digital album creation flow in any web project. Use when Codex needs to replicate Memora Proof's album project creation UI and behavior: album model/size library, required model selection, Novo projeto de álbum form, size/photo preview, Ajax/no-refresh creation, and redirect to the laminate/spread upload step. Do not use for Memora System event binding or inherited System album models unless explicitly requested."
---

# Create Digital Album Proof Flow

## Overview

Use this skill to add the standalone creation surface for digital album proofing: the photographer chooses an album model/size, creates a draft album project, and lands directly on the upload step for album spreads/lâminas.

The source pattern is Memora Proof. The portable target is any authenticated web app; adapt to the local framework instead of copying PHP literally.

## Core Workflow

1. Read `references/proof-pattern.md` before implementing.
2. Inspect the target app's auth, admin layout, form conventions, routing, database layer, and upload/review flow.
3. Add or map an album model library.
4. Add the digital album creation endpoint and UI.
5. Preserve the Proof presentation: operational app screen, not marketing.
6. Validate ownership, CSRF/session, model selection, empty states, Ajax behavior, and redirect to upload.
7. Run the app's tests/lint and optionally run `scripts/check_digital_album_flow.py <project-root>`.

## Feature Contract

Implement these pieces unless the target project already has equivalent names:

- Album model library: `name`, `size_label`, optional `included_photos`, owner/tenant scope, active flag if the app supports soft delete.
- Digital album project: title/name, slug/token, `album_model_id`, draft status, optional event date, optional approval deadline, owner/tenant scope.
- Upload/review continuation: after creation, redirect to the route where the photographer uploads album spreads/lâminas.
- Settings/admin CRUD for models: list, add, edit, delete or deactivate. Normalize sizes like `30x30`, `30 × 30 cm`, and `30*30` to a stable `30x30`.

## UI Contract

Build the actual app screen as the first viewport:

- Hero: eyebrow similar to `Proof · Álbuns`, title like `Novo projeto de álbum.`, short operational subtitle.
- Main form sections: `Dados do álbum` and, if the app has clients, a compact client field. Keep client linking optional for this standalone skill.
- Required select: `Modelo do álbum *`.
- Option labels: show `Modelo - tamanho`, but do not duplicate the size when the model name already contains it.
- Read-only details beside the select: `Tamanho contratado` and `Fotos contratadas`, populated from the selected model.
- Empty state: if there are no models, show a warm warning and disable creation with a clear path to settings/model creation.
- Next-step band: one primary submit button, `Avançar para envio de lâminas`, inside a `Próxima etapa` section.
- Side/context panel: `Fluxo do álbum`, with compact cards for `Modelo obrigatório` and `Próxima etapa`.

Do not duplicate the primary action in multiple cards. Do not build a landing page.

## Backend Contract

- Require authentication and owner/tenant scope for every read/write.
- Validate CSRF or the target framework's equivalent.
- Validate `title` and `album_model_id`; confirm the selected model belongs to the current owner/tenant.
- Generate a unique slug/token server-side.
- Create a draft album project and return JSON for Ajax:

```json
{
  "success": true,
  "message": "Álbum criado.",
  "album_id": 123,
  "redirect_url": "/prova-de-album/123"
}
```

- Return field-level errors for failed validation, especially `title` and `album_model`.
- Keep a non-JS fallback redirect if the stack supports classic form POST.

## Frontend Behavior

- Submit without full refresh when the stack supports it.
- Show loading text such as `Criando...`, disable the button while saving, then redirect.
- On model change, update size/photos fields from `data-model-size` and `data-included-photos` or equivalent state.
- Keep visible inline errors and a status box.
- Keep labels and messages in pt-BR when the product serves Brazilian photographers.

## What Not To Port

For this standalone skill, do not include Memora System event binding:

- No inherited System model badge.
- No `SystemTenantBridge`.
- No external event/client search dependency.
- No Groq contract analysis for detecting album in System contracts.
- No `contracted_album_*` matching unless the user explicitly asks for event/contract integration.

## Validation

After implementation:

- Verify creating without a title fails.
- Verify creating without a model fails.
- Verify a user cannot use another user's model ID.
- Verify no-model state disables the primary action.
- Verify successful creation redirects to upload/review of lâminas.
- Run `python scripts/check_digital_album_flow.py <project-root>` from this skill as a heuristic smoke check.
