import anthropic
from .config import settings

EXTRACT_TOOL = {
    "name": "extract_travel_segments",
    "description": "Extract all travel-related segments from email content",
    "input_schema": {
        "type": "object",
        "properties": {
            "segments": {
                "type": "array",
                "description": "All travel segments found in the email",
                "items": {
                    "type": "object",
                    "properties": {
                        "type": {
                            "type": "string",
                            "enum": [
                                "flight", "hotel", "airbnb", "car_rental",
                                "activity", "train", "cruise", "other"
                            ],
                            "description": "Type of travel segment"
                        },
                        "title": {
                            "type": "string",
                            "description": "Brief descriptive title, e.g. 'Flight JFK→LAX' or 'Hotel check-in at Marriott Downtown'"
                        },
                        "confirmation_number": {
                            "type": "string",
                            "description": "Booking or confirmation number"
                        },
                        "start_datetime": {
                            "type": "string",
                            "description": "ISO 8601 datetime when segment starts, e.g. 2026-04-15T09:30:00-05:00"
                        },
                        "end_datetime": {
                            "type": "string",
                            "description": "ISO 8601 datetime when segment ends"
                        },
                        "origin": {
                            "type": "string",
                            "description": "Departure city/airport for flights and trains, e.g. 'New York (JFK)'"
                        },
                        "destination": {
                            "type": "string",
                            "description": "Arrival city/airport for flights and trains, e.g. 'Los Angeles (LAX)'"
                        },
                        "location": {
                            "type": "string",
                            "description": "Physical address or city for hotels, Airbnb, and activities"
                        },
                        "airline": {
                            "type": "string",
                            "description": "Airline name for flights, e.g. 'American Airlines'"
                        },
                        "flight_number": {
                            "type": "string",
                            "description": "Flight number, e.g. 'AA 123'"
                        },
                        "notes": {
                            "type": "string",
                            "description": "Other relevant details: seat number, terminal, check-in time, gate, etc."
                        }
                    },
                    "required": ["type", "title", "start_datetime"]
                }
            }
        },
        "required": ["segments"]
    }
}

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _client


def parse_email(email_text: str) -> list[dict]:
    """Parse email text and return a list of travel segment dicts."""
    client = _get_client()

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4096,
        system=(
            "You are a travel itinerary parser. Extract ALL travel-related segments from email content.\n"
            "Look for: flights, hotel bookings, Airbnb confirmations, car rentals, train tickets, "
            "activity reservations, tours, cruises.\n"
            "Use ISO 8601 format for dates and times. Include timezone offsets when available.\n"
            "If only a date (no time) is given, use T00:00:00 for check-ins and T12:00:00 for check-outs.\n"
            "If no year is mentioned, infer from context or use the current year.\n"
            "Be comprehensive — extract every booking or reservation mentioned."
        ),
        tools=[EXTRACT_TOOL],
        tool_choice={"type": "tool", "name": "extract_travel_segments"},
        messages=[{
            "role": "user",
            "content": f"Extract travel segments from this email:\n\n{email_text}"
        }]
    )

    for block in response.content:
        if block.type == "tool_use" and block.name == "extract_travel_segments":
            return block.input.get("segments", [])
    return []
