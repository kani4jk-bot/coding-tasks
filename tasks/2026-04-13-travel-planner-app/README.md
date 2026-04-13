# Travel Planner

A TripIt-style travel planner that reads booking confirmation emails and organizes flights, hotels, car rentals, and activities into a unified trip view.

## How it works

Paste any booking confirmation email (flight, hotel, Airbnb, car rental, etc.) and Claude automatically extracts all travel details and organizes them into trips grouped by date.

## Stack

- **Backend**: FastAPI + SQLite + Anthropic SDK (Claude extracts travel segments)
- **Frontend**: Vite + React 18 + TypeScript

## Running

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## Features

- Paste email confirmations → Claude parses and extracts travel segments
- Auto-groups segments into trips by date proximity (segments within 2 days merge)
- Supports: flights, hotels, Airbnb, car rentals, trains, cruises, activities
- Timeline view grouped by day
- Rename trips, delete trips or individual segments
- Persistent storage (SQLite)
