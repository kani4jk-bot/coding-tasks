import gc
import logging

import torch
from diffusers import StableDiffusionInpaintPipeline
from PIL import Image

logger = logging.getLogger(__name__)


class LocalEditProvider:
    """Local Stable Diffusion inpainting provider with lazy model loading."""

    def __init__(
        self,
        device: str,
        dtype: torch.dtype,
        max_image_size: int,
        max_image_dimension: int,
        num_inference_steps: int,
        guidance_scale: float,
        model_id: str = 'runwayml/stable-diffusion-inpainting'
    ):
        self.device = device
        self.dtype = dtype
        self.max_image_size = max_image_size
        self.max_image_dimension = max_image_dimension
        self.num_inference_steps = num_inference_steps
        self.guidance_scale = guidance_scale
        self.model_id = model_id
        self._pipe = None

    def _ensure_loaded(self):
        if self._pipe is not None:
            return

        logger.info('Loading Stable Diffusion Inpainting model...')
        self._pipe = StableDiffusionInpaintPipeline.from_pretrained(
            self.model_id,
            torch_dtype=self.dtype,
            safety_checker=None
        ).to(self.device)

        if self.device == 'cuda':
            self._pipe.enable_attention_slicing()
            logger.info('✅ CUDA memory optimizations enabled')
        elif self.device == 'mps':
            logger.info('✅ MPS optimizations enabled')

        logger.info('Stable Diffusion inpainting model loaded successfully')

    def _cleanup_memory(self):
        if self.device == 'cuda':
            torch.cuda.empty_cache()
        gc.collect()

    def edit_image(self, original_image, mask_image, modification_prompt):
        self._ensure_loaded()

        try:
            if original_image.mode != 'RGB':
                original_image = original_image.convert('RGB')
            if mask_image.mode != 'L':
                mask_image = mask_image.convert('L')

            width, height = original_image.size
            if width > self.max_image_dimension or height > self.max_image_dimension:
                raise ValueError(
                    f'Image dimensions ({width}x{height}) exceed maximum allowed '
                    f'({self.max_image_dimension}x{self.max_image_dimension})'
                )

            if max(original_image.size) > self.max_image_size:
                ratio = self.max_image_size / max(original_image.size)
                new_size = tuple(int(dim * ratio) for dim in original_image.size)
                logger.info(f'Resizing image from {original_image.size} to {new_size}')
                original_image = original_image.resize(new_size, Image.LANCZOS)
                mask_image = mask_image.resize(new_size, Image.LANCZOS)

            result = self._pipe(
                prompt=f'professional interior photography, {modification_prompt}, photorealistic, highly detailed, 8k',
                negative_prompt='blur, distortion, low quality, artifacts, unrealistic, cartoon, painting',
                image=original_image,
                mask_image=mask_image,
                num_inference_steps=self.num_inference_steps,
                guidance_scale=self.guidance_scale,
                strength=0.85
            ).images[0]

            return result
        finally:
            self._cleanup_memory()
