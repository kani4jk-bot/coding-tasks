# Birdsong ID MVP

A GitHub-ready MVP scaffold for a **"Shazam but for birds"** app: record or upload a short bird song clip from a phone-friendly web UI, send it to an API, run bird-species inference, and return ranked matches with confidence and notes.

## Why this architecture

This is a realistic MVP rather than vaporware:

- **Frontend:** React + Vite mobile-first web app with PWA groundwork
- **Backend:** FastAPI API for file upload, validation, inference orchestration, and results
- **Inference provider layer:** lets you start with a mock/dev classifier and then swap in a real model such as **BirdNET** without rewriting the app
- **Short-audio workflow:** designed for 5–15 second clips recorded in browser or uploaded manually

## What changed in this pass

- Added an initial **real BirdNET backend integration path** using `birdnetlib`
- Added **ffmpeg-based normalization** to mono 48 kHz WAV before BirdNET analysis
- Added optional **latitude, longitude, and recording date** form fields end-to-end
- Kept **mock mode** as a runnable fallback so the project still works without heavy ML setup
- Improved backend/provider boundaries so a real model can fail honestly instead of silently pretending

## MVP user flow

1. User opens the web app on phone or desktop
2. Records audio or uploads an existing clip
3. Optionally adds location/date context
4. Frontend POSTs the clip to `/api/identify`
5. Backend normalizes/validates the audio, invokes the configured provider
6. API returns top candidate species with scores and basic suggestions
7. UI shows best match, alternatives, and confidence

## Current repo contents

- `frontend/` — Vite + React + TypeScript client
- `backend/` — FastAPI service with provider abstraction
- `docs/architecture.md` — architecture and next steps

## What is implemented now

### Working today

- Runnable FastAPI backend
- Runnable React frontend
- File upload flow end-to-end
- Browser microphone recording in supported browsers
- Mock classifier provider for local development
- Optional location/date metadata passed from UI to backend
- ffmpeg audio normalization step for the BirdNET path
- BirdNET provider implementation that can run when optional BirdNET dependencies are installed
- Mobile-first UI structure with install/app-like affordances
- Web app manifest and basic service worker shell cache

### Honest limitations / still scaffolded

- BirdNET now has a verified local runtime path on this host via `tensorflow-cpu==2.16.1`, but it is still a heavier dependency than mock mode
- First-run BirdNET model loading may be slow/heavy
- No persistence/history yet
- No spectrogram preview yet
- No eBird-style reranking beyond what BirdNET already does with date/location
- No offline on-device identification in the browser

## Recommended provider mode

### Default development mode

Use `CLASSIFIER_PROVIDER=mock` while iterating on UI and API behavior.

### Real inference mode

Use `CLASSIFIER_PROVIDER=birdnet` once backend dependencies are installed successfully.

On this machine, the missing runtime turned out to be TensorFlow Lite compatibility; installing `tensorflow-cpu==2.16.1` in the Python 3.12 backend venv made BirdNET initialize successfully.

This mode:
- writes the upload to a temp file
- converts it to mono 48 kHz WAV with `ffmpeg`
- runs BirdNET analysis through `birdnetlib`
- aggregates detections into ranked species predictions

## Run locally

### 1) Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Backend will run at: `http://localhost:8000`

If you want the real model path, edit `.env`:

```env
CLASSIFIER_PROVIDER=birdnet
```

> Note: this repo is verified against **Python 3.12** here. The host default Python 3.14 is still a bad bet for this stack.
>
> For the real BirdNET path on this host, `backend/requirements.txt` now includes `tensorflow-cpu==2.16.1`, which satisfied BirdNET's missing TFLite/TensorFlow runtime.

### 2) Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at: `http://localhost:5173`

### 3) Build check

```bash
cd frontend
npm run build
```

## Environment

Backend `.env` options:

```env
APP_NAME=Birdsong ID API
APP_ENV=development
CORS_ORIGINS=http://localhost:5173
CLASSIFIER_PROVIDER=mock
MAX_UPLOAD_MB=20
BIRDNET_MIN_CONFIDENCE=0.2
BIRDNET_TOP_N=5
```

## API

### `GET /api/health`
Returns service status.

### `POST /api/identify`
Multipart form upload with one `audio` file.

Optional form fields:
- `latitude`
- `longitude`
- `recorded_on` (ISO date, for example `2026-04-01`)

Response shape:

```json
{
  "provider": "birdnet",
  "top_match": {
    "species_code": "haemorhous",
    "common_name": "House Finch",
    "scientific_name": "Haemorhous mexicanus",
    "confidence": 0.57,
    "reason": "BirdNET detected this species in 2 time window(s); strongest hit around 9.0–12.0s."
  },
  "alternatives": [],
  "advice": [
    "Try a 5–15 second recording with minimal wind noise."
  ]
}
```

## Notes

- The mock provider is still intentionally fake; it is only a development fallback.
- The BirdNET path is now real integration code, but it depends on optional ML dependencies being installable in the backend environment.
- This is the right MVP tradeoff: runnable by default, real inference when the machine is ready.
