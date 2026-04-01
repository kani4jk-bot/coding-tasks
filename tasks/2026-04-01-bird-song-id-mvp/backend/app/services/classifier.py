from app.config import get_settings
from app.services.providers import BirdNetProvider, ClassifierProvider, MockClassifierProvider


def get_classifier_provider() -> ClassifierProvider:
    provider_name = get_settings().classifier_provider.lower()

    if provider_name == "mock":
        return MockClassifierProvider()
    if provider_name == "birdnet":
        return BirdNetProvider()

    raise ValueError(f"Unsupported classifier provider: {provider_name}")
