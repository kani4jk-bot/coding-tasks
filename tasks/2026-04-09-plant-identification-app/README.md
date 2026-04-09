# Plant Identification App

Snap a photo of any plant to identify its species, learn fun facts, and get growing instructions for houseplants.

## Architecture

| Layer | Stack | Port |
|-------|-------|------|
| Backend | FastAPI (Python 3.12) | 8000 |
| Frontend | Vite + React 18 + TypeScript | 5173 |

### How it works

1. User uploads or captures a photo in the browser
2. Frontend POSTs the image to `POST /api/identify`
3. Backend passes the image to the configured provider
4. Provider returns: species name, confidence, fun facts, and (for houseplants) growing tips
5. Frontend renders the result

### Providers

| `IDENTIFIER_PROVIDER` | Description |
|-----------------------|-------------|
| `mock` (default) | Returns a fixed Monstera response — no API key needed |
| `claude` | Sends image to Claude claude-sonnet-4-6 vision for real identification |

## Backend

```
backend/
  app/
    main.py          # FastAPI app, CORS, error handlers
    config.py        # Settings via pydantic-settings
    schemas.py       # Pydantic request/response models
    routers/
      health.py      # GET /api/health
      identify.py    # POST /api/identify
    providers/
      mock.py        # Fixed mock response
      claude_vision.py  # Claude vision API
  requirements.txt
  Dockerfile
  railway.toml
  .env.example
```

### Run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```

### API

`GET /api/health` → `{ "status": "ok", "provider": "..." }`

`POST /api/identify` — multipart form
- `image` (required): JPEG, PNG, or WebP, max 10 MB

Response:
```json
{
  "request_id": "plantreq_abc123",
  "received_at": "2026-04-09T12:00:00Z",
  "provider": "claude",
  "result": {
    "common_name": "Monstera",
    "scientific_name": "Monstera deliciosa",
    "confidence": "high",
    "description": "...",
    "fun_facts": ["...", "...", "...", "...", "..."],
    "is_houseplant": true,
    "growing_tips": [
      { "category": "Light", "tip": "..." },
      { "category": "Watering", "tip": "..." }
    ]
  },
  "image": { "filename": "photo.jpg", "content_type": "image/jpeg", "file_size_bytes": 204800 }
}
```

## Frontend

```
frontend/
  src/
    App.tsx                   # Root component
    api.ts                    # fetch wrapper
    types.ts                  # TypeScript types
    index.css                 # Styles
    components/
      ImageUpload.tsx          # Upload / camera trigger
      ResultCard.tsx           # Species name, facts, growing tips
  index.html
  vite.config.ts
```

### Run locally

```bash
cd frontend
npm install
npm run dev   # → http://localhost:5173
```

Set `VITE_API_BASE` in a `.env` file if the backend is not at `http://localhost:8000`.

## Deploy (Railway)

Backend: point Railway at `backend/` with the included `Dockerfile` and `railway.toml`. Set env vars:
- `IDENTIFIER_PROVIDER=claude`
- `ANTHROPIC_API_KEY=sk-ant-...`
- `CORS_ORIGINS=https://your-frontend-domain.com`
