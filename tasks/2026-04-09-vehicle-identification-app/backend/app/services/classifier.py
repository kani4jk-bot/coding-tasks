from app.config import get_settings
from app.services.providers import ClaudeVisionProvider, MockVehicleProvider, VehicleClassifierProvider


def get_classifier_provider() -> VehicleClassifierProvider:
    provider_name = get_settings().classifier_provider.lower()

    if provider_name == "mock":
        return MockVehicleProvider()
    if provider_name == "claude":
        return ClaudeVisionProvider()

    raise ValueError(f"Unsupported classifier provider: {provider_name}")
