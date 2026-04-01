# Birdsong ID MVP

A GitHub-ready MVP scaffold for a **"Shazam but for birds"** app: record or upload a short bird song clip from a phone-friendly web UI, send it to an API, run bird-species inference, and return ranked matches with confidence and notes.

## Why this architecture

This is a realistic MVP rather than vaporware:

- **Frontend:** React + Vite mobile-first web app with PWA groundwork
- **Backend:** FastAPI API for file upload, validation, inference orchestration, and results
- **Inference provider layer:** lets you start with a mock/dev classifier and then swap in a real model such as **BirdNET-Lite / BirdNET Analyzer / TensorFlow Lite / ONNX** without rewriting the app
- **Short-audio workflow:** designed for 5–15 second clips recorded in browser or uploaded manually

## MVP user flow

1. User opens the web app on phone or desktop
2. Records audio or uploads an existing clip
3. Frontend POSTs the clip to `/api/identify`
4. Backend normalizes/validates the audio, invokes the configured provider
5. API returns top candidate species with scores and basic suggestions
6. UI shows best match, alternatives, and confidence

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
- Clean interfaces for plugging in a real bird-song model
- Web app manifest, icon scaffolding, and a basic service worker shell cache
- Mobile-first UI structure with install/app-like affordances

### Stubbed but designed for next step

- Real BirdNET/Bioacoustics inference
- Audio resampling/segmentation pipeline
- Geo/time-aware reranking using checklist data like eBird
- Spectrogram preview
- Result explanation / similar-species comparison
- Offline identification logic beyond static shell caching

## Recommended real model/provider path

### Best practical MVP path

**BirdNET-Lite or BirdNET Analyzer-compatible model wrapper**

Why:
- purpose-built for bird vocalization classification
- widely used and realistic for an MVP
- can run locally on CPU for short clips
- avoids depending on a generic LLM to guess species from text descriptions

### Suggested evolution

1. **Phase 1 (this scaffold):** mock provider + real API/UI
2. **Phase 2:** add a `birdnet` provider that:
   - converts audio to mono WAV, 48 kHz if needed
   - chunks into windows
   - runs BirdNET inference
   - aggregates top predictions across windows
3. **Phase 3:** rerank predictions by:
   - location
   - month/season
   - confidence thresholding
   - "common near you" boosting

## Monorepo layout

```text
2026-04-01-bird-song-id-mvp/
├── README.md
├── docs/
│   └── architecture.md
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── schemas.py
│       ├── routers/
│       │   ├── health.py
│       │   └── identify.py
│       └── services/
│           ├── audio.py
│           ├── classifier.py
│           ├── providers.py
│           └── mock_birds.py
└── frontend/
    ├── public/
    │   ├── manifest.webmanifest
    │   ├── sw.js
    │   └── icons/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── styles.css
        ├── api.ts
        ├── types.ts
        └── components/
            ├── Recorder.tsx
            ├── UploadForm.tsx
            └── ResultCard.tsx
```

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

> Note: this scaffold is verified with **Python 3.12** on this machine. The host default Python 3.14 currently causes a `pydantic-core` build issue in this environment.

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

## Phone usage notes

- Open the Vite URL on your phone while both devices are on the same network, or deploy the frontend/backend to reachable URLs.
- If your browser shows an install prompt, install it. Otherwise use the browser's **Add to Home Screen** action.
- Live recording depends on mobile browser microphone support and permission prompts.
- If recording is blocked, use your phone's voice memo app and upload the saved clip instead.
- The current service worker only caches the static app shell. Identification still requires the backend API.

## Environment

Backend `.env` options:

```env
APP_NAME=Birdsong ID API
APP_ENV=development
CORS_ORIGINS=http://localhost:5173
CLASSIFIER_PROVIDER=mock
MAX_UPLOAD_MB=20
```

## API

### `GET /api/health`
Returns service status.

### `POST /api/identify`
Multipart form upload with one `audio` file.

Response shape:

```json
{
  "provider": "mock",
  "top_match": {
    "species_code": "nocar",
    "common_name": "Northern Cardinal",
    "scientific_name": "Cardinalis cardinalis",
    "confidence": 0.78,
    "reason": "Strong tonal whistle profile in sample."
  },
  "alternatives": [],
  "advice": [
    "Try a 5–15 second recording with minimal wind noise."
  ]
}
```

## Good next implementation step

If you want this scaffold turned into a **real BirdNET-backed prototype**, the next concrete tasks are:

1. add ffmpeg-based audio normalization
2. implement `BirdNetProvider`
3. add location/month inputs to the UI
4. rerank by regional likelihood
5. store anonymous sample + prediction for evaluation

## Notes

- This repo intentionally keeps the MVP lightweight and runnable.
- The mock provider is not pretending to be real ML; it is clearly a development fallback.
- The architecture is set up so the real model can slot in without changing the HTTP contract.
