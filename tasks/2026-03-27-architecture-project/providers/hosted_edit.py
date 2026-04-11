"""
Hosted edit provider — Fal inpainting.

Replaces the local Stable Diffusion step when BACKEND_MODE=hosted.
SAM segmentation still runs locally; only the inpainting call goes to Fal.

Required env vars:
  FAL_KEY               Your Fal API key (https://fal.ai/dashboard/keys)
  FAL_MODEL (optional)  Fal model slug (default: fal-ai/stable-diffusion-inpainting)
                        Use "fal-ai/flux-pro/v1/fill" for higher quality.
"""

import base64
import io
import os
import urllib.request

import fal_client
from PIL import Image

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

_DEFAULT_MODEL = "fal-ai/stable-diffusion-inpainting"
_FAL_MODEL = os.getenv("FAL_MODEL", _DEFAULT_MODEL)

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _pil_to_data_url(image: Image.Image, fmt: str = "PNG") -> str:
    """Encode a PIL image as a base64 data URL."""
    buf = io.BytesIO()
    image.save(buf, format=fmt)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    mime = "image/png" if fmt.upper() == "PNG" else "image/jpeg"
    return f"data:{mime};base64,{b64}"


def _url_to_pil(url: str) -> Image.Image:
    """Download an image from a URL and return it as a PIL Image."""
    with urllib.request.urlopen(url, timeout=60) as resp:
        return Image.open(io.BytesIO(resp.read())).convert("RGB")


def _check_api_key() -> None:
    if not os.getenv("FAL_KEY"):
        raise RuntimeError(
            "FAL_KEY is not set. Add it to your .env file and restart the server.\n"
            "Get a key at: https://fal.ai/dashboard/keys"
        )

# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

def run_inpaint(
    image: Image.Image,
    mask: Image.Image,
    prompt: str,
    num_inference_steps: int = 30,
    guidance_scale: float = 7.5,
) -> Image.Image:
    """
    Send image + mask + prompt to Fal and return the inpainted PIL Image.

    Args:
        image:                Original room photo (PIL RGB).
        mask:                 Binary inpaint mask from SAM — white = edit area (PIL RGB or L).
        prompt:               Text description of the desired change.
        num_inference_steps:  Diffusion steps; higher = better quality, slower.
        guidance_scale:       Prompt adherence strength.

    Returns:
        Edited image as a PIL RGB Image.
    """
    _check_api_key()

    # fal_client reads FAL_KEY from the environment automatically.
    image_url = _pil_to_data_url(image)
    mask_url = _pil_to_data_url(mask)

    arguments: dict = {
        "prompt": prompt,
        "image_url": image_url,
        "mask_url": mask_url,
    }

    # SD-inpainting supports step/guidance controls; Flux models ignore them.
    if "stable-diffusion" in _FAL_MODEL:
        arguments["num_inference_steps"] = num_inference_steps
        arguments["guidance_scale"] = guidance_scale
        arguments["strength"] = 0.99  # full inpaint (mask drives strength)

    result = fal_client.run(_FAL_MODEL, arguments=arguments)

    output_url = result["images"][0]["url"]
    return _url_to_pil(output_url)
