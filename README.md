# doc-vault

Local prototype for replacing paper filing cabinets with a searchable, tagged document store. Staff upload a scan or file, fill in a few metadata fields, and can find it later by keyword and filters instead of digging through physical folders.

This is a **local, single-user prototype** — no accounts, no login, no deployment target. See `SPEC.md` for the full technical specification.

## Status

Build is in progress via an autonomous coding agent, phase by phase. Current phase: see `DECISIONS.md`.

## What it does

- Upload a document (PDF, JPG, PNG, TIFF) via file picker or browser camera capture.
- Fill in required metadata: title, document type, department, document date, optional tags.
- Search by keyword (matched against title + tags) combined with type/department/date-range filters.
- Switch between "Acting as: Uploader" and "Acting as: Admin" via a dropdown — no login. Admin can edit any document, flag inaccurate metadata, and delete.

## What it deliberately doesn't do (v1)

- No AI-assisted metadata extraction — every field is filled by hand.
- No accounts, sessions, or password auth.
- No audit logging.
- No cloud storage — files live on local disk, metadata in local Postgres.
- No soft delete — deletion is permanent.

## Stack

- Backend: Python 3.12, FastAPI, SQLAlchemy 2.x + Alembic, PostgreSQL 15+ (`pg_trgm` for search).
- Frontend: React + TypeScript + Vite, Tailwind CSS, TanStack Query, React Hook Form + Zod.
- Storage: local filesystem, path stored in Postgres.

## Prerequisites

- Python 3.12+
- Node 20+
- PostgreSQL 15+ running locally

## Setup

1. **Database**
   ```bash
   createdb dms_db
   psql -d dms_db -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
   ```

2. **Backend**
   ```bash
   cd backend
   cp .env.example .env   # fill in DATABASE_URL, STORAGE_ROOT, etc.
   pip install -r requirements.txt --break-system-packages
   alembic upgrade head
   uvicorn app.main:app --reload
   ```
   Runs at `http://localhost:8000`. Interactive API docs at `http://localhost:8000/docs`.

3. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Runs at `http://localhost:5173`.

## Project layout

```
backend/    FastAPI app, SQLAlchemy models, Alembic migrations
frontend/   React + Vite app
SPEC.md     Full technical specification
DECISIONS.md   Implementation choices left open by the spec, resolved during build
```

## Notes

- No Docker required — Postgres, backend, and frontend all run natively for fast local iteration.
- Role switching (`X-Role` header) is UI/workflow gating only, not real access control — acceptable because this runs on one machine for one person.
