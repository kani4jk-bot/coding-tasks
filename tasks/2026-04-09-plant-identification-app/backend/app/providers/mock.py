from app.schemas import GrowingTip, PlantResult


class MockProvider:
    async def identify(self, image_data: bytes, content_type: str) -> PlantResult:
        return PlantResult(
            common_name="Monstera",
            scientific_name="Monstera deliciosa",
            confidence="high",
            description="A popular tropical houseplant with distinctive split and fenestrated leaves.",
            fun_facts=[
                "The holes and splits in Monstera leaves evolved to let wind pass through during tropical storms without tearing them.",
                "In the wild, Monstera can climb over 70 feet up rainforest trees using aerial roots.",
                "The name 'deliciosa' refers to its edible fruit, which ripens over a full year and tastes like a mix of pineapple and banana.",
                "It is sometimes called the 'Swiss cheese plant' because of the distinctive holes that form as leaves mature.",
                "Young Monstera leaves are solid and uncut — the characteristic fenestrations only appear as the plant matures.",
            ],
            is_houseplant=True,
            growing_tips=[
                GrowingTip(category="Light", tip="Thrives in bright, indirect light. Avoid direct afternoon sun which can scorch the leaves."),
                GrowingTip(category="Watering", tip="Water when the top 2 inches of soil are dry, roughly every 1–2 weeks. Reduce in winter."),
                GrowingTip(category="Soil", tip="Use a well-draining potting mix with added perlite or bark to prevent root rot."),
                GrowingTip(category="Humidity", tip="Prefers 50–60% humidity. Mist the leaves, use a pebble tray, or run a humidifier nearby."),
                GrowingTip(category="Fertilizing", tip="Feed once a month in spring and summer with a balanced liquid fertilizer. Skip in winter."),
            ],
        )
