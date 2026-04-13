from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class Trip(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class Segment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    trip_id: Optional[int] = Field(default=None, foreign_key="trip.id")
    type: str  # flight, hotel, airbnb, car_rental, activity, train, cruise, other
    title: str
    confirmation_number: Optional[str] = None
    start_datetime: str  # ISO 8601
    end_datetime: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    location: Optional[str] = None
    airline: Optional[str] = None
    flight_number: Optional[str] = None
    notes: Optional[str] = None
