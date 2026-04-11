import base64
import io
import json

import anthropic
from PIL import Image

from app.schemas import GrowingTip, PlantResult

MAX_IMAGE_BYTES = 4 * 1024 * 1024  # 4 MB — stay under Claude's 5 MB limit


def _shrink_image(data: bytes, content_type: str) -> tuple[bytes, str]:
    """Resize image until it fits under MAX_IMAGE_BYTES."""
    img = Image.open(io.BytesIO(data)).convert("RGB")
    fmt = "JPEG"
    mime = "image/jpeg"
    quality = 85
    while True:
        buf = io.BytesIO()
        img.save(buf, format=fmt, quality=quality)
        result = buf.getvalue()
        if len(result) <= MAX_IMAGE_BYTES:
            return result, mime
        # Reduce dimensions by 20% each pass
        w, h = img.size
        img = img.resize((int(w * 0.8), int(h * 0.8)), Image.LANCZOS)

IDENTIFY_PROMPT = """You are a botanist and plant expert. Analyze this image and identify the plant species shown.

Respond with a JSON object only — no markdown, no surrounding text — using exactly this structure:
{
  "top_match": {
    "common_name": "Common name of the plant",
    "scientific_name": "Latin binomial (Genus species)",
    "confidence": "high" | "medium" | "low",
    "description": "One clear sentence describing this plant",
    "fun_facts": [
      "Interesting fact 1",
      "Interesting fact 2",
      "Interesting fact 3",
      "Interesting fact 4",
      "Interesting fact 5"
    ],
    "is_houseplant": true | false,
    "growing_tips": [
      {"category": "Light", "tip": "..."},
      {"category": "Watering", "tip": "..."},
      {"category": "Soil", "tip": "..."},
      {"category": "Humidity", "tip": "..."},
      {"category": "Fertilizing", "tip": "..."}
    ]
  },
  "alternatives": [
    {
      "common_name": "...",
      "scientific_name": "...",
      "confidence": "medium" | "low",
      "description": "One sentence explaining why this could be a match",
      "fun_facts": [],
      "is_houseplant": true | false,
      "growing_tips": []
    }
  ]
}

Rules:
- fun_facts in top_match must contain exactly 5 surprising, specific facts about this species.
- alternatives should contain 1–2 other plausible species if the image is ambiguous, or [] if the match is clear.
- Set is_houseplant to true for any plant commonly kept indoors or in a home garden: houseplants, herbs, edible plants (strawberries, citrus, tomatoes, etc.), and ornamental flowers.
- growing_tips must be a non-empty array ONLY when is_houseplant is true. Otherwise set it to [].
- Each growing tip should be a practical, actionable sentence specific to this species.
- If you cannot identify the plant with any confidence, set common_name to "Unknown plant", scientific_name to "Unknown", confidence to "low", and provide general botanical facts.
- Return only the JSON object. No other text."""


class ClaudeVisionProvider:
    def __init__(self, api_key: str):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def identify(self, image_data: bytes, content_type: str) -> tuple[PlantResult, list[PlantResult]]:
        if len(image_data) > MAX_IMAGE_BYTES:
            image_data, content_type = _shrink_image(image_data, content_type)

        image_b64 = base64.standard_b64encode(image_data).decode()

        media_type_map = {
            "image/jpeg": "image/jpeg",
            "image/png": "image/png",
            "image/webp": "image/webp",
            "image/heic": "image/jpeg",
            "image/heif": "image/jpeg",
        }
        media_type = media_type_map.get(content_type, "image/jpeg")

        message = await self.client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
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
                        {
                            "type": "text",
                            "text": IDENTIFY_PROMPT,
                        },
                    ],
                }
            ],
        )

        raw = message.content[0].text.strip()
        data = json.loads(raw)

        def parse_plant(d: dict) -> PlantResult:
            return PlantResult(
                common_name=d["common_name"],
                scientific_name=d["scientific_name"],
                confidence=d["confidence"],
                description=d["description"],
                fun_facts=d.get("fun_facts", []),
                is_houseplant=d.get("is_houseplant", False),
                growing_tips=[GrowingTip(**t) for t in d.get("growing_tips", [])],
            )

        top_match = parse_plant(data["top_match"])
        alternatives = [parse_plant(a) for a in data.get("alternatives", [])]
        return top_match, alternatives
