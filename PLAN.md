# Implementation Plan & Task Checklist

## Phase A — Role Selector & Middleware (✅ Completed)
- [x] Removed login views and JWT authentication.
- [x] Added `X-Role: uploader/admin` dropdown switcher to UI.
- [x] Added FastAPI dependency/middleware to check `X-Role` headers.
- [x] Strip out DB models for `User` and `AuditLog`.

## Phase B — Consolidated Frontend UI (CURRENT)
- [x] Frontend: Build a responsive, functional upload form handling file + manual metadata.
- [x] Frontend: Setup `React Hook Form` and `Zod` validation for upload metadata.
- [ ] UI: Implement the single search bar + metadata filter panel.
- [ ] UI: Build data-dense desktop table vs. mobile stacked-card results view.
- [ ] UI: Admin tools view or delete buttons on rows.

## Phase C — Backend Search & Admin Logic
- [ ] Backend: `GET /api/documents` keyword search using `pg_trgm` via `ILIKE`.
- [ ] Backend: `DELETE /api/documents/{id}` (hard delete of DB row and local file).
- [ ] Backend: Wire fetching endpoints to UI.

## Phase E — UI Consistency Pass
- [ ] Final visual QA on padding, typography, tap targets.
- [ ] Validate behaviors on `sm`, `md`, `lg` breakpoints explicitly.
