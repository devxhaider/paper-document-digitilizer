# Document Management System — Technical Specification

Version: 0.1 (draft for agentic build via Antigravity)

## 1. Scope

### 1.1 In scope
- Web app for uploading scanned/digital copies of paper documents.
- Manual metadata entry by uploader (no AI extraction — see 1.2).
- Role-based access: Staff/Uploader, Reviewer/Administrator.
- Metadata-filtered keyword search.
- Local filesystem storage for file bytes; Postgres for metadata.
- Audit logging of upload/view/delete/edit actions.
- Light-mode-only, responsive UI (desktop, tablet, mobile) — see 3.6.

### 1.2 Out of scope (v1)
- AI-assisted metadata extraction (removed from scope; uploader fills all metadata manually — see 3.2).
- Cloud storage backend (design storage layer so it can be swapped later; do not implement).
- OCR-based full-text search inside document body (search is metadata/title/tag only).
- Soft delete / recycle bin (deletion is permanent per requirement).
- Multi-tenant support.
- Mobile native app.
- E-signature / workflow approval chains.
- Dark mode (light mode only, per 3.6).

Anything not explicitly listed in this document is out of scope until a phase is amended. This section exists specifically to stop an autonomous agent from expanding scope on its own.

## 2. User Roles & Permission Matrix

| Action | Staff/Uploader | Reviewer/Administrator |
|---|---|---|
| Upload document (scanner or file) | Yes | Yes |
| Edit metadata on own uploads | Yes | Yes (any document) |
| Edit metadata on others' uploads | No | Yes |
| Flag metadata as inaccurate ("report") | No | Yes |
| Delete document | No | Yes |
| Search/retrieve | Yes | Yes |
| View audit log for a document | No | Yes |
| Manage user accounts | No | Yes |

Notes:
- Every document detail view displays the uploader's identity (name/username) regardless of viewer role.
- "Report" is a distinct action from "edit" — it sets a `flagged` state + reason on the document without altering the metadata itself, so uploader and admin can see something was contested.

## 3. Functional Requirements

### 3.1 Document Capture & Upload
- Accepted formats: PDF, JPG, JPEG, PNG, TIFF.
- Max file size: 25 MB per file (configurable via env var, not hardcoded).
- Two ingestion paths, both terminating in the same upload endpoint:
  1. Browser file picker (upload from local storage).
  2. Browser-based scanner/camera capture (use `navigator.mediaDevices.getUserMedia` for camera; for TWAIN/WIA physical scanners, integrate via a scanning bridge — see 6.4). Output of either path is a file blob handled identically downstream.
- Server validates real file type via magic-byte inspection, not just file extension or client-reported MIME type.
- Reject executable, script, or archive files regardless of extension spoofing.

### 3.2 Metadata Entry (Manual)
- No AI extraction step. Upload form is presented blank immediately after file upload completes.
- Uploader fills every metadata field themselves; form cannot be submitted until all required fields (3.3) are filled.

### 3.3 Metadata Schema

| Field | Required | Source | Notes |
|---|---|---|---|
| Title | Yes | Uploader | Free text |
| Document type/category | Yes | Uploader | Fixed enum, admin-managed list |
| Department/Owner | Yes | Uploader | Fixed enum, admin-managed list |
| Document date | Yes | Uploader | The date on/relevant to the document itself, NOT the upload date. Distinct field from `uploaded_at`. |
| Tags | No | Uploader | Free-text, multi-value, used only for search, not shown as a fixed enum |
| Uploaded by | System | Automatic | From session, not editable |
| Uploaded at | System | Automatic | Timestamp, not editable |
| Flagged / flag reason | System + Admin | Admin sets via report action | Boolean + free text reason |

### 3.4 Search & Retrieval
- Single search bar for keyword, plus a metadata filter panel (type, department, date range).
- Query behavior: filters (type/department/date range) narrow the candidate set first; the keyword is then matched against `title` and `tags` only within that set.
- Keyword match: case-insensitive, partial-word match, tags matched individually. Use Postgres `pg_trgm` + `ILIKE`, or `tsvector`/`tsquery` on `title` and a joined `tags` string — pick one at implementation time, do not implement both.
- Results sortable by document date and upload date.

### 3.5 Security & Access Control
- Every user has an individual account (username/email + password). No shared logins.
- Passwords hashed with argon2id (or bcrypt if argon2 unavailable in chosen stack) — never MD5/SHA1/plaintext.
- Session via signed JWT (short-lived access token + refresh token) or server-side session store — pick one at implementation time.
- Authorization enforced server-side on every request (role check on the endpoint, not just hiding buttons in the UI).
- Audit log table records: actor user id, action (upload/view/edit/delete/flag), document id, timestamp. Only admins can view audit logs.

### 3.6 Versioning & Deletion
- No versioning. Deletion is permanent (hard delete of DB row + file bytes).
- Only Reviewer/Administrator can delete.
- Re-uploading a previously deleted or similar document is allowed and may produce duplicates by design. Admin has a manual "remove duplicate" action (find + delete), not automatic dedup detection in v1.

### 3.7 UI/UX Requirements
- Light mode only — no dark mode, no theme toggle, in v1.
- Fully responsive across three target breakpoints: desktop (≥1024px), tablet (768–1023px), mobile (<768px). Every screen (login, upload form, search/results, document detail, admin views) must be usable at all three, not just desktop with mobile as an afterthought.
- Layout built mobile-first: base styles target the smallest breakpoint, larger breakpoints add layout (e.g. filter panel collapses to a drawer/accordion on mobile, sits inline on desktop).
- Consistent spacing/typography scale and a single accent color — avoid ad hoc one-off styling per page (this is what tends to make an agent-built UI look inconsistent).
- Data-dense screens (search results, admin views) use a table on desktop/tablet and a stacked card layout on mobile — do not force a wide table into a horizontal scroll on small screens.
- Every interactive element (buttons, form fields, filters) has a visible focus/hover state and a minimum comfortable tap target size on mobile (~44px).

## 4. Data Model (PostgreSQL)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('uploader', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  document_date DATE NOT NULL,
  file_path TEXT NOT NULL,
  file_mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  flagged_by UUID REFERENCES users(id),
  flagged_at TIMESTAMPTZ
);

CREATE TABLE document_tags (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (document_id, tag)
);

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID NOT NULL REFERENCES users(id),
  document_id UUID, -- nullable; row may outlive a deleted document
  action TEXT NOT NULL CHECK (action IN ('upload','view','edit','delete','flag')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_title_trgm ON documents USING gin (title gin_trgm_ops);
CREATE INDEX idx_document_tags_tag_trgm ON document_tags USING gin (tag gin_trgm_ops);
CREATE INDEX idx_documents_type ON documents(document_type_id);
CREATE INDEX idx_documents_department ON documents(department_id);
CREATE INDEX idx_documents_date ON documents(document_date);
```

Note: `file_path` stores a path relative to a configured storage root, never an absolute host path or a user-controlled string — server generates it (e.g. `{document_id}.{ext}`) to prevent path traversal.

## 5. API Surface (v1)

```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

POST   /api/documents                 (upload; multipart/form-data + metadata fields)
GET    /api/documents                 (search; query params: q, type, department, date_from, date_to, sort)
GET    /api/documents/{id}
PATCH  /api/documents/{id}            (edit metadata; role-checked)
DELETE /api/documents/{id}            (admin only)
POST   /api/documents/{id}/flag       (admin only)
GET    /api/documents/{id}/file       (stream file bytes; requires auth)

GET    /api/departments
GET    /api/document-types
GET    /api/audit-log?document_id=    (admin only)
```

## 6. Technology Stack

### 6.1 Backend
- **Python 3.12 + FastAPI** — async, strong typing (Pydantic), straightforward for an autonomous agent to scaffold predictably.
- **SQLAlchemy 2.x + Alembic** for ORM and migrations. No raw string-built SQL.
- **python-magic** for file-type verification by content, not extension.
- **argon2-cffi** for password hashing.
- **python-jose** or **PyJWT** for JWT.

### 6.2 Frontend
- **React + TypeScript + Vite**.
- **TanStack Query** for server-state/fetching.
- **React Hook Form + Zod** for the metadata form and its validation.
- **Tailwind CSS** — build the light-mode color/spacing/typography scale as Tailwind theme tokens (not inline one-off styles) so every screen draws from the same palette; component primitives from a maintained, actively-updated library (e.g. Radix/shadcn) rather than hand-rolled modals/dropdowns.
- Responsive layout via Tailwind's default breakpoints (`sm`/`md`/`lg`), mapped to the mobile/tablet/desktop targets in 3.7. No separate mobile app/site — one responsive codebase.

### 6.3 Scanner integration
- Browser-native camera capture via `getUserMedia` for v1 (works cross-platform with zero drivers).
- For TWAIN/WIA desktop scanner hardware: this requires a small local bridge process (e.g. a lightweight local service exposing scan-to-file over localhost, since browsers cannot talk TWAIN directly). Treat this as a distinct, later phase — do not let the agent attempt browser-to-TWAIN integration directly, it does not exist.

### 6.4 Storage
- Local filesystem, path from config (e.g. `STORAGE_ROOT` env var), one file per document, named by `document_id`.
- Storage access wrapped behind a small internal interface (`save(bytes) -> path`, `read(path) -> bytes`, `delete(path)`) so swapping to S3-compatible storage later is a single-module change, not a rewrite.

### 6.5 Database
- PostgreSQL 15+.

## 7. Forbidden / Disallowed Libraries & Patterns

Do not let the agent use any of the following:

- **pickle** for any data crossing a trust boundary (deserialization RCE risk).
- **MD5 or SHA1** for password hashing, or any home-rolled hashing scheme.
- **eval()/exec()** on any user- or file-derived input.
- **moment.js** (deprecated) — use `date-fns` or `luxon` if a JS date lib is needed.
- **request** (deprecated npm package) — use `fetch` or `axios`.
- Storing file bytes directly in Postgres as `bytea`/large objects — files stay on disk (or later, object storage); DB holds metadata + path only.
- Client-side-only authorization checks (hiding a delete button is not access control — server must re-check role on every request).
- Raw string-concatenated SQL queries — ORM or parameterized queries only.
- Any unmaintained/abandoned OCR or PDF wrapper (e.g. old `PyPDF2` — use the maintained `pypdf` fork or `PyMuPDF` instead).
- `localStorage`/`sessionStorage` for auth tokens (XSS-exposed) — use httpOnly cookies or in-memory storage with refresh flow.
- Auto-generated CRUD admin panels that bypass the role/permission layer (e.g. exposing a raw Django-admin-style table editor for `documents`).
- Implementing both `tsvector` and `pg_trgm` search paths redundantly — pick one.

## 8. Non-Functional Requirements

- Search response time: under 1s for a database on the order of 100k documents, given the indexes above.
- Expected volume: mid-size org — design for up to ~500k documents / tens of concurrent users, not internet-scale.
- UI must render correctly at all three breakpoints (3.7) with no horizontal scroll on primary content and no overlapping/clipped elements — treat this as a hard requirement, not a nice-to-have.
- Availability: single-instance deployment acceptable for v1; no HA requirement stated.
- Retention/compliance: not specified by the org yet — flag this as an open question before building anything that auto-expires or auto-purges data. Do not implement retention rules the org hasn't specified.

## 9. Build Phases

Structured for an autonomous coding agent (Antigravity) to execute sequentially.

**Phase A — Role selector + role-check middleware**
- Plain "Acting as: Uploader / Admin" dropdown in UI.
- Send selected role as `X-Role: uploader` or `X-Role: admin` on every request.
- Backend middleware checks this header before allowing admin-only actions.

**Phase B — Upload + Metadata + Flagging**
- Upload endpoint, file-type validation, local storage save.
- `documents` row creation with manual metadata entry. `uploaded_by` is plain text.
- Department/document-type management.
- Editing and Flagging (only admins can flag or edit others).

**Phase C — Search**
- Filter + keyword search endpoint and UI.

**Phase D — Admin Deletion**
- Permanent admin delete, removing DB row and file.

**Phase E — UI Consistency Pass**
- Re-check layout across breakpoints (`sm`, `md`, `lg`) to ensure it scales correctly.

## 10. Operating Instructions for the Autonomous Agent

- Feed the agent one phase at a time, with this document as persistent context, not the whole thing as one giant task.
- After each phase, require the agent to state exactly which acceptance criteria passed and how it verified them (test output, not narrative).
- Re-state section 7 (forbidden libraries/patterns) explicitly before Phases 1 and 2 — these are the phases most likely to reach for a disallowed shortcut (auth, storage).
- Re-state section 3.7 (UI/UX requirements) explicitly before every phase that touches a screen (2, 3, 4, 7) — this is the requirement most likely to quietly slip if not repeated each time.
- Do not let the agent invent requirements beyond section 1.2's out-of-scope list without flagging it back to you first.
- Keep a running `DECISIONS.md` in the repo where the agent logs any implementation choice this spec left open (e.g. tsvector vs pg_trgm, JWT vs server session) — prevents silent inconsistency across phases.
