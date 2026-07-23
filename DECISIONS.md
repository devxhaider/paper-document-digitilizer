# Decisions Log

This document records the architectural and technology decisions made for the Document Management System (DMS).

## 1. Authentication Details: X-Role Header (Local Prototype)
- **Alternative considered**: Real authentication (JWT or Sessions)
- **Decision**: Simple "Acting as: Uploader / Admin" dropdown in UI, sending `X-Role: uploader` or `X-Role: admin` header.
- **Rationale**: The project scope was simplified to a local-only prototype that will never be deployed. We dropped all auth/security infrastructure (no JWT, no passwords, no tokens) to focus purely on the core features.
## 2. Search implementation: `pg_trgm` + `ILIKE`
- **Alternative considered**: Full-Text Search via `tsvector`/`tsquery`.
- **Decision**: PostgreSQL `pg_trgm` (trigram) index + `ILIKE`.
- **Rationale**: Simple partial matches (substring matches anywhere in title and tags) are easier and cover the requirements perfectly without the text parsing/lexeme stemming overhead of `tsvector`.

## 3. Dependency Manager: pip + `requirements.txt`
- **Alternative considered**: Poetry, Pipenv.
- **Decision**: pip + `requirements.txt`.
- **Rationale**: High reliability, low conceptual overhead, and aligns with standard local/native setup request.

## 4. Frontend Component Library: shadcn/ui (Radix)
- **Alternative considered**: Material UI (MUI), pure Tailwind components.
- **Decision**: `shadcn/ui` built on Radix Primitives + Tailwind CSS.
- **Rationale**: Provides accessible, fully customizable primitives that we can copy into our project and style natively while maintaining total control.

## 5. Deployment / Execution Environment: Native running
- **Alternative considered**: Docker Compose.
- **Decision**: Native Python (uvicorn) and npm (Vite dev server) processes.
- **Rationale**: User database is already installed locally and prefers developer-native feedback loops.
