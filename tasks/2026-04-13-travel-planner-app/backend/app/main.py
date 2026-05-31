import re
from datetime import datetime, timedelta
from typing import Optional

import anthropic
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Session, select

from .config import settings
from .database import create_db, get_session
from .models import Segment, Trip
from .parser import parse_email

app = FastAPI(title="Travel Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    create_db()


# ── Request/response models ────────────────────────────────────────────────


class ParseEmailRequest(BaseModel):
    email_text: str


class UpdateTripRequest(BaseModel):
    name: str


# ── Helpers ────────────────────────────────────────────────────────────────


def _parse_dt(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        try:
            return datetime.strptime(dt_str[:10], "%Y-%m-%d")
        except (ValueError, AttributeError):
            return None


def _generate_trip_name(segments: list[dict], start_dt: Optional[datetime], end_dt: Optional[datetime]) -> str:
    destinations: list[str] = []
    for seg in segments:
        if seg.get("type") == "flight" and seg.get("destination"):
            destinations.append(seg["destination"])
        elif seg.get("type") in ("hotel", "airbnb") and seg.get("location"):
            destinations.append(seg["location"])

    if destinations:
        dest = destinations[0]
        dest = re.sub(r"\s*\([A-Z]{3}\)", "", dest).strip()
        dest = dest.split(",")[0].strip()
        if start_dt:
            return f"Trip to {dest} ({start_dt.strftime('%b %-d')})"
        return f"Trip to {dest}"

    if start_dt:
        if end_dt and (end_dt - start_dt).days > 0:
            return f"Trip ({start_dt.strftime('%b %-d')} – {end_dt.strftime('%b %-d, %Y')})"
        return f"Trip ({start_dt.strftime('%b %-d, %Y')})"
    return "New Trip"


def _find_or_create_trip(session: Session, segments: list[dict]) -> Trip:
    """Assign segments to an existing trip (by date proximity) or create a new one."""
    seg_dates: list[datetime] = []
    for seg in segments:
        for key in ("start_datetime", "end_datetime"):
            dt = _parse_dt(seg.get(key))
            if dt:
                seg_dates.append(dt.replace(tzinfo=None))

    seg_start = min(seg_dates) if seg_dates else None
    seg_end = max(seg_dates) if seg_dates else None

    tolerance = timedelta(days=2)
    existing_trips: list[Trip] = session.exec(select(Trip)).all()

    for trip in existing_trips:
        if not seg_start or not trip.start_date:
            continue
        trip_start = _parse_dt(trip.start_date)
        trip_end = _parse_dt(trip.end_date or trip.start_date)
        if not trip_start or not trip_end:
            continue

        # Strip tz for comparison (SQLite stores naive)
        trip_start = trip_start.replace(tzinfo=None)
        trip_end = trip_end.replace(tzinfo=None)
        seg_end_cmp = (seg_end or seg_start).replace(tzinfo=None)

        if seg_start <= trip_end + tolerance and seg_end_cmp >= trip_start - tolerance:
            # Extend trip date range if needed
            if seg_start < trip_start:
                trip.start_date = seg_start.date().isoformat()
            if seg_end and seg_end.replace(tzinfo=None) > trip_end:
                trip.end_date = seg_end.replace(tzinfo=None).date().isoformat()
            session.add(trip)
            return trip

    # No matching trip — create one
    name = _generate_trip_name(segments, seg_start, seg_end)
    trip = Trip(
        name=name,
        start_date=seg_start.date().isoformat() if seg_start else None,
        end_date=seg_end.date().isoformat() if seg_end else None,
    )
    session.add(trip)
    session.flush()
    return trip


def _trip_with_segments(trip: Trip, session: Session) -> dict:
    segs = session.exec(
        select(Segment)
        .where(Segment.trip_id == trip.id)
        .order_by(Segment.start_datetime)
    ).all()
    d = trip.model_dump()
    d["segments"] = [s.model_dump() for s in segs]
    return d


# ── Endpoints ──────────────────────────────────────────────────────────────


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/parse")
def parse_email_endpoint(
    request: ParseEmailRequest,
    session: Session = Depends(get_session),
) -> dict:
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="The server is missing an ANTHROPIC_API_KEY. Add one to backend/.env and restart.",
        )

    try:
        segments_data = parse_email(request.email_text)
    except anthropic.AuthenticationError:
        raise HTTPException(
            status_code=503,
            detail="The configured ANTHROPIC_API_KEY is invalid. Check backend/.env and restart.",
        )

    if not segments_data:
        return {
            "segments": [],
            "trip": None,
            "message": "No travel segments found in this email.",
        }

    trip = _find_or_create_trip(session, segments_data)

    created: list[Segment] = []
    for sd in segments_data:
        seg = Segment(
            trip_id=trip.id,
            type=sd.get("type", "other"),
            title=sd.get("title", ""),
            confirmation_number=sd.get("confirmation_number"),
            start_datetime=sd.get("start_datetime", ""),
            end_datetime=sd.get("end_datetime"),
            origin=sd.get("origin"),
            destination=sd.get("destination"),
            location=sd.get("location"),
            airline=sd.get("airline"),
            flight_number=sd.get("flight_number"),
            notes=sd.get("notes"),
        )
        session.add(seg)
        created.append(seg)

    session.commit()
    for s in created:
        session.refresh(s)
    session.refresh(trip)

    return {
        "segments": [s.model_dump() for s in created],
        "trip": _trip_with_segments(trip, session),
    }


@app.get("/api/trips")
def list_trips(session: Session = Depends(get_session)) -> list[dict]:
    trips = session.exec(select(Trip).order_by(Trip.start_date)).all()
    return [_trip_with_segments(t, session) for t in trips]


@app.get("/api/trips/{trip_id}")
def get_trip(trip_id: int, session: Session = Depends(get_session)) -> dict:
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return _trip_with_segments(trip, session)


@app.patch("/api/trips/{trip_id}")
def update_trip(
    trip_id: int,
    req: UpdateTripRequest,
    session: Session = Depends(get_session),
) -> dict:
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip.name = req.name
    session.add(trip)
    session.commit()
    session.refresh(trip)
    return _trip_with_segments(trip, session)


@app.delete("/api/trips/{trip_id}")
def delete_trip(trip_id: int, session: Session = Depends(get_session)) -> dict:
    trip = session.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    segs = session.exec(select(Segment).where(Segment.trip_id == trip_id)).all()
    for s in segs:
        session.delete(s)
    session.delete(trip)
    session.commit()
    return {"ok": True}


@app.delete("/api/segments/{segment_id}")
def delete_segment(segment_id: int, session: Session = Depends(get_session)) -> dict:
    seg = session.get(Segment, segment_id)
    if not seg:
        raise HTTPException(status_code=404, detail="Segment not found")
    trip_id = seg.trip_id
    session.delete(seg)
    session.commit()
    # Remove trip if now empty
    if trip_id:
        remaining = session.exec(select(Segment).where(Segment.trip_id == trip_id)).all()
        if not remaining:
            trip = session.get(Trip, trip_id)
            if trip:
                session.delete(trip)
                session.commit()
    return {"ok": True}
