# CLAUDE.md

Guidelines for Claude Code in this repository.

## About this repo

A workspace for coding tasks completed through OpenClaw. Each task lives in `tasks/<date>-<name>/` and typically contains source code, docs, and output artifacts. Tasks vary in stack and scope.

## My profile

- Solo developer
- Works across full-stack, mobile (React Native), and backend (Python/FastAPI)
- Typical stack: TypeScript + React (web), React Native / Expo (mobile), Python/FastAPI (backend), Vite

## Current tasks

### `tasks/2026-03-27-architecture-project/`

AI-powered architectural image editor.

- **Structure:** `backend/` (Flask), `frontend/` (Vite/React), `mobile/` (Expo), `docs/`
- **Frontend:** React 18 + Vite (JSX, `frontend/src/App.jsx`), served at `localhost:3000`
- **Backend:** Flask API (`backend/app.py`) at `localhost:5001`
- **Modes:** `BACKEND_MODE=local` (SAM + Stable Diffusion locally) or `BACKEND_MODE=hosted` (SAM local + Fal for inpainting)
- **Key env vars:** `BACKEND_MODE`, `HOSTED_EDIT_PROVIDER`, `FAL_KEY`, `VITE_API_BASE`
- **API endpoints:** `GET /api/health`, `POST /api/edit`, `POST /api/test`
- **Run:** `cd backend && python app.py` (backend), `cd frontend && npm run dev` (frontend)
- Local models download automatically on first run (~2–3 GB: `facebook/sam-vit-huge`, `runwayml/stable-diffusion-inpainting`)
- Device auto-detection: CUDA → MPS → CPU
- Outputs written to `backend/outputs/` with timestamps

### `tasks/2026-04-01-bird-song-id-mvp/`

"Shazam but for birds" — record or upload a short clip, identify the species.

Three sub-projects:

#### `backend/` — FastAPI (Python 3.12)

- Entry point: `backend/app/main.py`; config in `backend/app/config.py`; schemas in `backend/app/schemas.py`
- Deployed via Railway (`backend/railway.toml`, `backend/Dockerfile`)
- Provider abstraction: `CLASSIFIER_PROVIDER=mock` (default) or `CLASSIFIER_PROVIDER=birdnet`
- BirdNET path: upload → temp file → ffmpeg normalize to mono 48 kHz WAV → `birdnetlib` inference → ranked species
- Key deps: `fastapi`, `uvicorn`, `pydantic-settings`, `birdnetlib`, `librosa`, `tensorflow-cpu==2.16.1`
- **Python 3.12 required** (3.14 is not compatible with this stack)
- API: `GET /api/health`, `POST /api/identify` (multipart: `audio` file + optional `latitude`, `longitude`, `recorded_on`)
- Run: `source .venv/bin/activate && uvicorn app.main:app --reload --port 8000`

#### `frontend/` — Vite + React 18 + TypeScript

- Entry: `frontend/src/App.tsx`; API calls in `frontend/src/api.ts`; types in `frontend/src/types.ts`
- PWA groundwork: `frontend/public/manifest.webmanifest`, `frontend/public/sw.js`
- Run: `npm run dev` → `localhost:5173`
- Build check: `npm run build`

#### `mobile/` — Expo / React Native (React 19, RN 0.81)

- Entry: `mobile/App.tsx`; types in `mobile/src/types.ts`
- Key native deps: `expo-av` (recording), `expo-location`, `expo-file-system`, `@react-native-async-storage/async-storage`
- Navigation: `@react-navigation/bottom-tabs` + native-stack
- Builds via EAS (`mobile/eas.json`)
- API base: `EXPO_PUBLIC_API_BASE` env var (defaults to localhost; set to LAN IP for physical device testing)
- Features: record → upload → results screen; local field journal/history; starred sightings + notes; offline retry queue groundwork; Wikipedia species metadata
- Type check: `npx tsc --noEmit`
- Run: `npx expo start`

#### `docs/`

- `docs/architecture.md` — system design and provider abstraction decisions
- `docs/production-foundation.md` — backend direction, metadata model, roadmap
- `docs/privacy-site/` — static HTML privacy policy page for app store submission

## How I like to work with Claude

### Judgment calls
Make a call and tell me what you decided. Don't stop to ask unless you're truly blocked.

### Communication
- Be concise. No preamble, no summaries of what you just did.
- Use markdown links for file references so they're clickable.

### Code changes
- Only change what was asked. Don't refactor, clean up, or improve surrounding code.
- Don't add tests unless I ask.
- Don't add comments or docstrings to code you didn't touch.
- Don't add error handling for scenarios that can't happen.
- Don't design for hypothetical future requirements.

### Git / GitHub
- Never push, force-push, or open PRs without my explicit confirmation.
- Commit style: conventional commits (`feat:`, `fix:`, `chore:`, etc.) are fine; follow the pattern in the existing log.

## Task folder conventions

```
tasks/
  YYYY-MM-DD-task-name/
    README.md       # context and decisions
    src/            # source code (or frontend/, backend/, mobile/)
    docs/           # optional specs or notes
```

## Expo / EAS conventions

Each mobile app has its **own unique EAS projectId** — do not reuse IDs across apps. When generating a new mobile app, create a fresh EAS project and use its projectId. Current per-app IDs:

| App | projectId |
|-----|-----------|
| `tasks/2026-03-27-architecture-project/mobile` | `5f9a4d75-483e-4c9c-ad4a-82357a7a323a` |
| `tasks/2026-04-01-bird-song-id-mvp/mobile` | `60b2403f-d9ca-4ddc-a28a-ca26bdb0b56b` |
| `tasks/2026-04-09-plant-identification-app/mobile` | `9a25eba8-106d-4c61-b8ac-cfaeb4e7f164` |
| `tasks/2026-04-09-vehicle-identification-app/mobile` | `e8f6ee23-9808-44df-b739-2b20fd30e5bb` |
| `tasks/2026-04-13-travel-planner-app/mobile` | `f5c10a41-366d-489b-890e-c32cc9bf2803` |
| `tasks/2026-04-18-charades-mobile-game` | `64a919d8-9535-4c0c-b10e-1656bba05377` |
| `tasks/2026-04-30-poker-calculator/mobile` | `64a919d8-9535-4c0c-b10e-1656bba05377` |

Each app's `app.json` must also include `expo-updates` in `package.json` for OTA updates to work at runtime. Use `checkAutomatically: "ON_LOAD"` in the `updates` block (not the deprecated `fallbackToCacheTimeout`).

When adding a new mobile app to CI, update three places in `.github/workflows/eas-build.yml`: the `workflow_dispatch` options list, the `push: paths:` filter, and the APP loop in the "Resolve app path" step.

## Repo-wide conventions

- Root `.gitignore` excludes: `.DS_Store`, `*.log`, `node_modules/`, `.env`, `.env.*`, `dist/`, `build/`, `__pycache__/`, `*.pyc`
- Each task manages its own `.gitignore` for task-specific exclusions (e.g. `.venv/` in the bird-song backend)
- Don't commit `.env` files — use `.env.example` to document required vars

## Auto-update this file

Update this file whenever you learn something important about how I work, what I prefer, or what to avoid — so future sessions have full context without me repeating myself.
