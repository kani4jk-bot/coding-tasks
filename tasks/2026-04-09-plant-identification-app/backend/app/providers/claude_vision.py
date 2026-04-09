import base64
import json

import anthropic

from app.schemas import GrowingTip, PlantResult

IDENTIFY_PROMPT = """You are a botanist and plant expert. Analyze this image and identify the plant species shown.

Respond with a JSON object only — no markdown, no surrounding text — using exactly this structure:
{
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
}

Rules:
- fun_facts must contain exactly 5 surprising, specific facts about this species.
- Set is_houseplant to true for any plant commonly kept indoors or in a home garden: houseplants, herbs, edible plants (strawberries, citrus, tomatoes, etc.), and ornamental flowers.
- growing_tips must be a non-empty array ONLY when is_houseplant is true. Otherwise set it to [].
- Each growing tip should be a practical, actionable sentence specific to this species.
- If you cannot identify the plant with any confidence, set common_name to "Unknown plant", scientific_name to "Unknown", confidence to "low", and provide general botanical facts.
- Return only the JSON object. No other text."""


class ClaudeVisionProvider:
    def __init__(self, api_key: str):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def identify(self, image_data: bytes, content_type: str) -> PlantResult:
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

        return PlantResult(
            common_name=data["common_name"],
            scientific_name=data["scientific_name"],
            confidence=data["confidence"],
            description=data["description"],
            fun_facts=data.get("fun_facts", []),
            is_houseplant=data.get("is_houseplant", False),
            growing_tips=[GrowingTip(**t) for t in data.get("growing_tips", [])],
        )
