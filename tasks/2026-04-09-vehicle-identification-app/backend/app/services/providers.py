from __future__ import annotations

import base64
import json
from abc import ABC, abstractmethod

from app.schemas import VehiclePrediction
from app.services.mock_vehicles import MOCK_RESULTS

VEHICLE_ID_PROMPT = """\
You are an expert vehicle identification system with deep knowledge of cars, trucks, motorcycles, \
bicycles, aircraft, trains, boats, buses, scooters, and all other vehicle types.

Analyze the image and identify every vehicle you can see. Focus on the most prominent vehicle.

For the top match and up to 2 alternatives provide the following. Respond with valid JSON only — \
no markdown, no code fences, no explanation outside the JSON object.

JSON schema:
{
  "vehicles": [
    {
      "vehicle_type": "<car|truck|motorcycle|bicycle|scooter|airplane|helicopter|train|boat|ship|bus|tractor|other>",
      "make": "<manufacturer or null if unknown>",
      "model": "<model name or null if unknown>",
      "year_range": "<e.g. '2018–2023' or '~1965' or null>",
      "country_of_origin": "<country or null>",
      "confidence": <0.0–1.0>,
      "reason": "<concise visual cues that led to this identification>",
      "fun_facts": ["<fact 1>", "<fact 2>", "<fact 3>", "<fact 4>", "<fact 5>"],
      "specs": {"<key>": "<value>"},
      "brief_history": "<1–2 paragraph history of this vehicle or model>"
    }
  ],
  "no_vehicle_message": "<only if no vehicle detected, else omit this key>"
}

Rules:
- List the highest-confidence vehicle first (index 0 = top match).
- Include 3–5 fun facts that are genuinely interesting and surprising.
- Specs should use real-world values appropriate to the vehicle type (engine, power, speed, range, weight, etc.).
- If you cannot identify the exact make/model, set them to null and explain in the reason field.
- If no vehicle is visible set vehicles to [] and include no_vehicle_message.
"""


class VehicleClassifierProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    def predict(self, image_bytes: bytes, filename: str) -> list[VehiclePrediction]: ...


class MockVehicleProvider(VehicleClassifierProvider):
    @property
    def name(self) -> str:
        return "mock"

    def predict(self, image_bytes: bytes, filename: str) -> list[VehiclePrediction]:
        return list(MOCK_RESULTS)


class ClaudeVisionProvider(VehicleClassifierProvider):
    def __init__(self) -> None:
        import anthropic
        from app.config import get_settings

        self._client = anthropic.Anthropic(api_key=get_settings().anthropic_api_key)

    @property
    def name(self) -> str:
        return "claude"

    def predict(self, image_bytes: bytes, filename: str) -> list[VehiclePrediction]:
        media_type = self._media_type(filename)
        image_b64 = base64.standard_b64encode(image_bytes).decode()

        message = self._client.messages.create(
            model="claude-opus-4-6",
            max_tokens=2048,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": image_b64,
                            },
                        },
                        {"type": "text", "text": VEHICLE_ID_PROMPT},
                    ],
                }
            ],
        )

        raw = message.content[0].text.strip()
        # Strip accidental markdown fences if Claude adds them
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(raw)

        if not data.get("vehicles"):
            raise ValueError(data.get("no_vehicle_message", "No vehicle detected in this image."))

        return [VehiclePrediction(**v) for v in data["vehicles"]]

    @staticmethod
    def _media_type(filename: str) -> str:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpeg"
        return {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "webp": "image/webp",
            "gif": "image/gif",
        }.get(ext, "image/jpeg")
