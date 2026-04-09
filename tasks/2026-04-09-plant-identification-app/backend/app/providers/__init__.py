from app.config import Settings


def get_provider(settings: Settings):
    if settings.identifier_provider == "claude":
        from app.providers.claude_vision import ClaudeVisionProvider
        return ClaudeVisionProvider(settings.anthropic_api_key)
    from app.providers.mock import MockProvider
    return MockProvider()
