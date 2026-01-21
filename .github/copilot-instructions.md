<!-- Purpose: concise guidance for AI coding agents working in this repository -->

# Copilot Instructions — voice-app-ai

Purpose: help an AI coding agent become productive quickly in this monorepo (Next.js frontend + Python backend TTS).

1. Big picture

- Frontend: a Next.js (app router) project in `frontend/` — run scripts with `npm` (see `frontend/package.json`). Core UI lives in `frontend/src/app` and `frontend/src/components`. Auth helpers are in `frontend/src/lib` (e.g., `auth.ts`, `auth-client.ts`). Prisma schema and migrations are in `frontend/prisma/`.
- Backend: Python services live under `backend/`. The text-to-speech worker is `backend/text-to-speech/tts.py` and its Python deps are in `backend/text-to-speech/requirements.txt`. A lightweight Python virtualenv exists at `backend/source/` (pyvenv.cfg).

2. How to run & common developer flows

- Frontend local dev: from repo root run `cd frontend && npm run dev` (script `dev` uses `next dev --turbo`). Build with `npm run build` and preview with `npm run preview`.
- Prisma: use `cd frontend && npm run db:generate` (dev), `npm run db:migrate` (deploy), and `npm run db:studio` to open Studio. `prisma` lives in `frontend/prisma/`.
- Backend TTS: this service uses `modal` for deployment. Examples in repo history use `modal deploy tts.py`. For local runs use a Python venv and install `backend/text-to-speech/requirements.txt` then `python tts.py` for simple testing.

3. Project-specific conventions & patterns

- Frontend
  - Uses Next.js app-router; pages and layouts live in `frontend/src/app/` with nested folders like `(dashboard)` and `(auth)`.
  - UI primitives live in `frontend/src/components/ui/` (e.g., `breadcrumb.tsx`, `button.tsx`). Sidebar components are in `frontend/src/components/sidebar/` (see `breadcrumb-page-client.tsx` for use of `usePathname`).
  - Auth flows use `better-auth` and `@polar-sh` integrations; prefer `frontend/src/lib/auth.ts` helpers for token/client patterns.
- Backend
  - Python TTS service is small and self-contained; it lists `modal`, `fastapi`, and `chatterbox-tts` in `requirements.txt`. When changing runtime behavior, update `requirements.txt` accordingly.
  - There is a lightweight venv at `backend/source/` — prefer creating/testing inside a venv to match runtime.

4. Integration points & deployment notes

- The frontend relies on Prisma client generated at postinstall; CI or dev machines must run `npm install` in `frontend/` to trigger `prisma generate` (see `postinstall`).
- TTS deployment uses `modal` — look for `modal deploy` usage in terminal history. Treat `modal` as the production deployment mechanism for the TTS worker.

5. Files to inspect for context when making changes (high-signal)

- Frontend: `frontend/src/app/`, `frontend/src/components/`, `frontend/src/lib/auth.ts`, `frontend/prisma/schema.prisma`, `frontend/package.json`.
- Backend: `backend/text-to-speech/tts.py`, `backend/text-to-speech/requirements.txt`, `backend/source/pyvenv.cfg`.

6. When you edit files

- Keep changes minimal and consistent with existing patterns (e.g., Next.js app-router conventions, React server/client boundaries using `use client` in client components).
- Update `frontend/package.json` scripts only if necessary and document new script names in this file.

7. Quick examples to guide small tasks

- Add a new UI component: place in `frontend/src/components/ui/`, export a typed prop interface, and use existing `button.tsx` patterns.
- Modify DB schema: edit `frontend/prisma/schema.prisma`, then run `cd frontend && npm run db:generate` and commit generated migration files under `frontend/prisma/migrations/`.
- Update TTS deps: edit `backend/text-to-speech/requirements.txt`, recreate venv, `pip install -r requirements.txt`, then run `python tts.py` or `modal deploy tts.py`.

8. FAQs for the agent

- Q: Which files are server vs client in the frontend? A: `use client` marks client components (see `breadcrumb-page-client.tsx`). Files without it default to server components under Next.js app router.
- Q: Where is DB logic? A: See `frontend/src/server/db.ts` for DB connection code and `frontend/prisma/` for schema.

If anything here is unclear or you want more specifics (CI commands, env vars, or deployment steps), tell me which area to expand.
