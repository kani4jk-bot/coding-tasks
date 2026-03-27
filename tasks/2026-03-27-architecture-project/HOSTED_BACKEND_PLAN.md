# Hosted Backend Refactor Plan

## Goal
Reduce setup time while preserving model quality as much as possible.

## Current local backend
- SAM (`facebook/sam-vit-huge`) for segmentation
- Stable Diffusion Inpainting (`runwayml/stable-diffusion-inpainting`) for edits
- Heavy first-run downloads and slow CPU inference

## Better hosted design
### Best option
- Hosted segmentation API or lightweight local segmentation fallback
- Hosted image editing/inpainting API for the expensive generation step

### Recommended architecture
1. Frontend uploads image and selection data.
2. Backend creates a mask:
   - option A: local SAM if available
   - option B: hosted segmentation provider
3. Backend sends image + mask + prompt to a hosted image editing API.
4. Backend returns edited image + mask.

## Suggested providers to evaluate
- Replicate (strong image model ecosystem, simple REST)
- Fal (fast hosted inference)
- Hugging Face Inference Endpoints
- OpenAI image editing APIs if mask-based editing quality matches your use case

## Refactor steps
1. Add env-driven backend mode:
   - `BACKEND_MODE=local|hosted`
2. Extract providers into modules:
   - `providers/segmentation_local.py`
   - `providers/edit_local.py`
   - `providers/edit_hosted.py`
3. Keep API contract unchanged for frontend.
4. Add `VITE_API_BASE` support for frontend.
5. Add `.env.example` with hosted-provider keys.

## Why this is better
- Much faster setup
- Less disk usage
- Less RAM pressure
- Easier deployment
- Can preserve quality with strong hosted models

## Tradeoff
- Requires API keys / usage costs
- Slightly more network latency
