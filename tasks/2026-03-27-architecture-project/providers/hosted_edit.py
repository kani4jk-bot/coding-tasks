import base64
import io
import logging
import os
from typing import Optional

import requests
from PIL import Image

logger = logging.getLogger(__name__)


DEFAULT_FAL_MODEL = 'fal-ai/qwen-image-edit/inpaint'
DEFAULT_FAL_URL = 'https://queue.fal.run'


class HostedEditProvider:
    """Hosted image editing provider.

    Currently supports Fal inpainting via queued REST requests.
    """

    def __init__(self):
        self.provider = os.getenv('HOSTED_EDIT_PROVIDER', 'fal').strip().lower()
        self.api_key = (
            os.getenv('HOSTED_EDIT_API_KEY', '').strip()
            or os.getenv('FAL_KEY', '').strip()
        )
        self.api_url = os.getenv('HOSTED_EDIT_API_URL', '').strip() or DEFAULT_FAL_URL
        self.model = os.getenv('HOSTED_EDIT_MODEL', '').strip() or DEFAULT_FAL_MODEL
        self.timeout_seconds = int(os.getenv('HOSTED_EDIT_TIMEOUT_SECONDS', '300'))

    def is_configured(self):
        return bool(self.provider and self.api_key)

    def edit_image(self, original_image, mask_image, modification_prompt):
        if not self.provider:
            raise RuntimeError('Hosted backend mode is enabled, but HOSTED_EDIT_PROVIDER is not set.')
        if not self.api_key:
            raise RuntimeError(
                f'Hosted backend mode is enabled for provider "{self.provider}", but HOSTED_EDIT_API_KEY/FAL_KEY is missing.'
            )

        if self.provider == 'fal':
            return self._edit_with_fal(original_image, mask_image, modification_prompt)

        raise RuntimeError(
            f'Unsupported hosted provider "{self.provider}". Supported: fal.'
        )

    def _edit_with_fal(self, original_image, mask_image, modification_prompt):
        image_url = image_to_data_uri(original_image, mode='RGB')
        mask_url = image_to_data_uri(mask_image, mode='L')

        payload = {
            'prompt': modification_prompt,
            'image_url': image_url,
            'mask_url': mask_url,
            'num_inference_steps': int(os.getenv('FAL_NUM_INFERENCE_STEPS', '28')),
            'guidance_scale': float(os.getenv('FAL_GUIDANCE_SCALE', '4')),
            'num_images': 1,
            'output_format': os.getenv('FAL_OUTPUT_FORMAT', 'png'),
            'enable_safety_checker': os.getenv('FAL_ENABLE_SAFETY_CHECKER', 'true').lower() == 'true',
            'acceleration': os.getenv('FAL_ACCELERATION', 'regular'),
            'strength': float(os.getenv('FAL_STRENGTH', '0.93')),
            'negative_prompt': os.getenv('FAL_NEGATIVE_PROMPT', 'blurry, ugly, distorted, low quality'),
            'sync_mode': True,
        }

        headers = {
            'Authorization': f'Key {self.api_key}',
            'Content-Type': 'application/json',
        }
        url = f"{self.api_url.rstrip('/')}/{self.model}"
        logger.info('Calling Fal hosted edit model: %s', self.model)
        response = requests.post(url, headers=headers, json=payload, timeout=self.timeout_seconds)

        if response.status_code >= 400:
            raise RuntimeError(f'Fal API error ({response.status_code}): {response.text[:500]}')

        data = response.json()
        images = data.get('images') or []
        if not images:
            raise RuntimeError('Fal API returned no images.')

        image_ref = images[0]
        if image_ref.get('url'):
            return fetch_image(image_ref['url'], timeout=self.timeout_seconds)

        b64 = image_ref.get('base64')
        if b64:
            return decode_base64_image(b64)

        raise RuntimeError('Fal API returned an image entry without a URL or base64 payload.')


def image_to_png_bytes(image: Image.Image, mode: Optional[str] = None) -> bytes:
    buffer = io.BytesIO()
    if mode and image.mode != mode:
        image = image.convert(mode)
    image.save(buffer, format='PNG')
    return buffer.getvalue()


def image_to_base64(image: Image.Image) -> str:
    return base64.b64encode(image_to_png_bytes(image)).decode('utf-8')


def image_to_data_uri(image: Image.Image, mode: Optional[str] = None) -> str:
    return f"data:image/png;base64,{base64.b64encode(image_to_png_bytes(image, mode=mode)).decode('utf-8')}"


def fetch_image(url: str, timeout: int = 300) -> Image.Image:
    response = requests.get(url, timeout=timeout)
    response.raise_for_status()
    return Image.open(io.BytesIO(response.content)).convert('RGB')


def decode_base64_image(b64: str) -> Image.Image:
    if b64.startswith('data:image'):
        b64 = b64.split(',', 1)[1]
    return Image.open(io.BytesIO(base64.b64decode(b64))).convert('RGB')
