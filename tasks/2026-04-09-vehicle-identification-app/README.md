# Vehicle Identification App

Take a photo of any vehicle — car, truck, motorcycle, bicycle, scooter, airplane, train, boat, and more — and the app identifies it with fun facts, specs, and history.

## Architecture

| Layer | Stack | Location |
|---|---|---|
| Backend API | FastAPI + Claude Vision | `backend/` |
| Mobile app | Expo / React Native | `mobile/` |

## Backend

**Provider:** `claude` (uses `claude-opus-4-6` vision via Anthropic API) or `mock` (dev, no API key needed).

### Run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # add ANTHROPIC_API_KEY, set CLASSIFIER_PROVIDER=claude
uvicorn app.main:app --reload --port 8000
```

### API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/identify` | Identify vehicle from image |

`POST /api/identify` accepts `multipart/form-data` with an `image` file field (JPEG, PNG, WebP, HEIC, max 20 MB).

### Deploy (Railway)

Push the `backend/` folder; `railway.toml` and `Dockerfile` are ready to go. Set `ANTHROPIC_API_KEY` and `CLASSIFIER_PROVIDER=claude` in Railway environment variables.

## Mobile

Expo / React Native app with three tabs:

- **Capture** — take a photo or pick from the library; sends to backend and navigates to the result
- **History** — browse past identifications, star favourites, add notes
- **Settings** — configure the backend URL

### Run locally

```bash
cd mobile
npm install
npx expo start          # scan QR with Expo Go
```

Set `EXPO_PUBLIC_API_BASE` to your LAN IP when testing on a physical device, or configure the URL in the Settings tab.

### Permissions

- **Camera** — required for live photo capture
- **Photo library** — optional, for picking existing photos

## Supported vehicle types

Cars, trucks, SUVs, vans, motorcycles, bicycles, scooters, electric scooters, airplanes, jets, helicopters, trains, trams, boats, ships, yachts, buses, coaches, tractors, and more. If Claude can see it, it can identify it.
