import base64
import io
import logging
import os

from PIL import Image

logger = logging.getLogger(__name__)


class HostedEditProvider:
    """Hosted image editing provider placeholder.

    This keeps the backend contract stable while deferring actual provider-specific
    wiring until a concrete vendor/API is selected.
    """

    def __init__(self):
        self.provider = os.getenv('HOSTED_EDIT_PROVIDER', '').strip()
        self.api_key = os.getenv('HOSTED_EDIT_API_KEY', '').strip()
        self.api_url = os.getenv('HOSTED_EDIT_API_URL', '').strip()

    def is_configured(self):
        return bool(self.provider and self.api_key)

    def edit_image(self, original_image, mask_image, modification_prompt):
        if not self.provider:
            raise RuntimeError(
                'Hosted backend mode is enabled, but HOSTED_EDIT_PROVIDER is not set. '
                'Choose a provider (for example: replicate, fal, openai, huggingface) and add credentials.'
            )

        if not self.api_key:
            raise RuntimeError(
                f'Hosted backend mode is enabled for provider "{self.provider}", but HOSTED_EDIT_API_KEY is missing.'
            )

        raise RuntimeError(
            f'Hosted backend mode is not wired for provider "{self.provider}" yet. '
            'The refactor path is ready, but the actual outbound API request/response mapping still needs to be implemented.'
        )


def image_to_png_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    return buffer.getvalue()


def image_to_base64(image: Image.Image) -> str:
    return base64.b64encode(image_to_png_bytes(image)).decode('utf-8')
