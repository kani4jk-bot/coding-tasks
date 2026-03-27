from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import cv2
import numpy as np
from diffusers import StableDiffusionInpaintPipeline
from transformers import SamModel, SamProcessor
from PIL import Image
import io
import base64
import os
from datetime import datetime
import logging
from functools import wraps
from collections import defaultdict
from threading import Lock
import time
import glob
from math import isfinite
import gc
import random

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# CORS configuration - restrict to specific origins in production
allowed_origins = os.getenv(
    'ALLOWED_ORIGINS',
    'http://localhost:3000,http://localhost:5173,http://localhost:8080'
).split(',')
CORS(app, origins=allowed_origins)

# Rate limiting storage
rate_limit_storage = defaultdict(list)
rate_limit_lock = Lock()


def rate_limit(max_requests=10, window_seconds=60):
    """Simple rate limiting decorator."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.remote_addr or 'unknown'
            current_time = time.time()

            with rate_limit_lock:
                rate_limit_storage[client_ip] = [
                    req_time for req_time in rate_limit_storage[client_ip]
                    if current_time - req_time < window_seconds
                ]

                if len(rate_limit_storage[client_ip]) >= max_requests:
                    return jsonify({
                        'error': f'Rate limit exceeded. Maximum {max_requests} requests per {window_seconds} seconds.'
                    }), 429

                rate_limit_storage[client_ip].append(current_time)

            return f(*args, **kwargs)
        return decorated_function
    return decorator


# Configuration constants
MAX_IMAGE_SIZE = int(os.getenv('MAX_IMAGE_SIZE', 1024))
MAX_REQUEST_SIZE = int(os.getenv('MAX_REQUEST_SIZE', 50 * 1024 * 1024))
MAX_IMAGE_DIMENSION = int(os.getenv('MAX_IMAGE_DIMENSION', 4096))
NUM_INFERENCE_STEPS = int(os.getenv('NUM_INFERENCE_STEPS', 50))
GUIDANCE_SCALE = float(os.getenv('GUIDANCE_SCALE', 7.5))
OUTPUT_CLEANUP_DAYS = int(os.getenv('OUTPUT_CLEANUP_DAYS', 7))


# Set up device - automatically detect best option
if torch.cuda.is_available():
    device = 'cuda'
    dtype = torch.float16
    logger.info('🚀 NVIDIA GPU detected! Using CUDA')
elif getattr(torch.backends, 'mps', None) and torch.backends.mps.is_available():
    device = 'mps'
    dtype = torch.float32
    logger.info('🍎 Apple Silicon detected! Using MPS (Metal)')
else:
    device = 'cpu'
    dtype = torch.float32
    logger.info('💻 Using CPU (slower)')

logger.info(f'Device: {device}')
logger.info(f'Data type: {dtype}')

# Initialize models (load once at startup)
logger.info('Loading SAM model...')
sam_model = SamModel.from_pretrained('facebook/sam-vit-huge', torch_dtype=dtype).to(device)
sam_processor = SamProcessor.from_pretrained('facebook/sam-vit-huge')

logger.info('Loading Stable Diffusion Inpainting model...')
inpaint_pipe = StableDiffusionInpaintPipeline.from_pretrained(
    'runwayml/stable-diffusion-inpainting',
    torch_dtype=dtype,
    safety_checker=None
).to(device)

logger.info('Models loaded successfully!')

if device == 'cuda':
    inpaint_pipe.enable_attention_slicing()
    logger.info('✅ CUDA memory optimizations enabled')
elif device == 'mps':
    logger.info('✅ MPS optimizations enabled')

# Create output directory
os.makedirs('outputs', exist_ok=True)


def cleanup_old_outputs():
    """Clean up old output files based on OUTPUT_CLEANUP_DAYS."""
    try:
        current_time = time.time()
        cutoff_time = current_time - (OUTPUT_CLEANUP_DAYS * 24 * 60 * 60)
        mask_files = glob.glob('outputs/mask_*.png')
        edited_files = glob.glob('outputs/edited_*.png')

        deleted_count = 0
        for file_path in mask_files + edited_files:
            try:
                file_time = os.path.getmtime(file_path)
                if file_time < cutoff_time:
                    os.remove(file_path)
                    deleted_count += 1
            except Exception as e:
                logger.warning(f'Error deleting file {file_path}: {str(e)}')

        if deleted_count > 0:
            logger.info(f'Cleaned up {deleted_count} old output files')
    except Exception as e:
        logger.error(f'Error during output cleanup: {str(e)}')


cleanup_old_outputs()


def create_mask_from_points(image, foreground_points, background_points=None):
    """Create a mask using SAM based on user-selected points."""
    all_points = foreground_points.copy()
    all_labels = [1] * len(foreground_points)

    if background_points:
        all_points.extend(background_points)
        all_labels.extend([0] * len(background_points))

    inputs = sam_processor(
        image,
        input_points=[[all_points]],
        input_labels=[[all_labels]],
        return_tensors='pt'
    ).to(device)

    with torch.no_grad():
        outputs = sam_model(**inputs)

    masks = sam_processor.image_processor.post_process_masks(
        outputs.pred_masks.cpu(),
        inputs['original_sizes'].cpu(),
        inputs['reshaped_input_sizes'].cpu()
    )[0]

    scores = outputs.iou_scores.cpu().numpy()[0]
    best_mask_idx = scores.argmax()
    best_mask = masks[0, best_mask_idx].numpy()

    mask_image = Image.fromarray((best_mask * 255).astype(np.uint8))
    mask_np = np.array(mask_image)
    kernel = np.ones((5, 5), np.uint8)
    mask_np = cv2.dilate(mask_np, kernel, iterations=2)
    return Image.fromarray(mask_np)


def create_mask_from_box(image, box):
    """Create a mask using SAM based on bounding box."""
    inputs = sam_processor(
        image,
        input_boxes=[[[box]]],
        return_tensors='pt'
    ).to(device)

    with torch.no_grad():
        outputs = sam_model(**inputs)

    masks = sam_processor.image_processor.post_process_masks(
        outputs.pred_masks.cpu(),
        inputs['original_sizes'].cpu(),
        inputs['reshaped_input_sizes'].cpu()
    )[0]

    scores = outputs.iou_scores.cpu().numpy()[0]
    best_mask_idx = scores.argmax()
    best_mask = masks[0, best_mask_idx].numpy()

    mask_image = Image.fromarray((best_mask * 255).astype(np.uint8))
    mask_np = np.array(mask_image)
    kernel = np.ones((5, 5), np.uint8)
    mask_np = cv2.dilate(mask_np, kernel, iterations=2)
    return Image.fromarray(mask_np)


def cleanup_memory():
    """Clean up GPU memory if using CUDA."""
    if device == 'cuda':
        torch.cuda.empty_cache()
    gc.collect()


def edit_image_with_inpainting(original_image, mask_image, modification_prompt):
    """Edit image using Stable Diffusion Inpainting."""
    try:
        if original_image.mode != 'RGB':
            original_image = original_image.convert('RGB')
        if mask_image.mode != 'L':
            mask_image = mask_image.convert('L')

        width, height = original_image.size
        if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
            raise ValueError(
                f'Image dimensions ({width}x{height}) exceed maximum allowed '
                f'({MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION})'
            )

        if max(original_image.size) > MAX_IMAGE_SIZE:
            ratio = MAX_IMAGE_SIZE / max(original_image.size)
            new_size = tuple(int(dim * ratio) for dim in original_image.size)
            logger.info(f'Resizing image from {original_image.size} to {new_size}')
            original_image = original_image.resize(new_size, Image.LANCZOS)
            mask_image = mask_image.resize(new_size, Image.LANCZOS)

        result = inpaint_pipe(
            prompt=f'professional interior photography, {modification_prompt}, photorealistic, highly detailed, 8k',
            negative_prompt='blur, distortion, low quality, artifacts, unrealistic, cartoon, painting',
            image=original_image,
            mask_image=mask_image,
            num_inference_steps=NUM_INFERENCE_STEPS,
            guidance_scale=GUIDANCE_SCALE,
            strength=0.85
        ).images[0]

        return result
    finally:
        cleanup_memory()


def image_to_base64(image):
    """Convert PIL Image to base64 string."""
    buffered = io.BytesIO()
    image.save(buffered, format='PNG')
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f'data:image/png;base64,{img_str}'


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'device': device,
        'models_loaded': True
    })


@app.route('/api/cleanup', methods=['POST'])
def manual_cleanup():
    """Manual cleanup endpoint (admin function)."""
    try:
        cleanup_old_outputs()
        return jsonify({'success': True, 'message': 'Cleanup completed'})
    except Exception as e:
        logger.error(f'Error in manual cleanup: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/api/edit', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)
def edit_image():
    """Main endpoint for image editing."""
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400

        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        if request.content_length and request.content_length > MAX_REQUEST_SIZE:
            return jsonify({
                'error': f'Request too large. Maximum size: {MAX_REQUEST_SIZE / (1024 * 1024):.1f}MB'
            }), 413

        image_data = data.get('image')
        if not image_data:
            return jsonify({'error': 'No image provided'}), 400
        if not isinstance(image_data, str):
            return jsonify({'error': 'Image must be a base64 string'}), 400

        try:
            if image_data.startswith('data:image'):
                image_data = image_data.split(',', 1)[1]
            image_bytes = base64.b64decode(image_data)
            if len(image_bytes) == 0:
                return jsonify({'error': 'Invalid image data'}), 400
            original_image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        except Exception as e:
            logger.error(f'Error decoding image: {str(e)}')
            return jsonify({'error': 'Invalid image format'}), 400

        mode = data.get('mode', 'point')
        modification = data.get('modification', '').strip()

        if mode not in ['point', 'box']:
            return jsonify({'error': 'Invalid mode. Must be "point" or "box"'}), 400
        if not modification:
            return jsonify({'error': 'Modification description is required'}), 400
        if len(modification) > 500:
            return jsonify({'error': 'Modification description too long (max 500 characters)'}), 400

        logger.info(f'Processing image in {mode} mode...')
        logger.info(f'Modification: {modification[:100]}...')

        if mode == 'point':
            points_data = data.get('points', [])
            foreground_points = [[p['x'], p['y']] for p in points_data if p['type'] == 'foreground']
            background_points = [[p['x'], p['y']] for p in points_data if p['type'] == 'background']

            if not foreground_points:
                return jsonify({'error': 'No foreground points provided'}), 400

            mask_image = create_mask_from_points(
                original_image,
                foreground_points,
                background_points if background_points else None
            )
        else:
            box_data = data.get('box', {})
            if not box_data:
                return jsonify({'error': 'Box coordinates not provided'}), 400

            start = box_data.get('start', {})
            end = box_data.get('end', {})
            if not start or not end:
                return jsonify({'error': 'Box start and end coordinates required'}), 400

            try:
                if 'x' not in start or 'y' not in start:
                    return jsonify({'error': 'Box start coordinates missing x or y'}), 400
                if 'x' not in end or 'y' not in end:
                    return jsonify({'error': 'Box end coordinates missing x or y'}), 400
                if start.get('x') is None or start.get('y') is None:
                    return jsonify({'error': 'Box start coordinates cannot be null'}), 400
                if end.get('x') is None or end.get('y') is None:
                    return jsonify({'error': 'Box end coordinates cannot be null'}), 400

                x1 = float(start['x'])
                y1 = float(start['y'])
                x2 = float(end['x'])
                y2 = float(end['y'])

                if not all(isfinite(val) for val in [x1, y1, x2, y2]):
                    return jsonify({'error': 'Box coordinates contain invalid values (NaN or infinite)'}), 400

                x1, x2 = min(x1, x2), max(x1, x2)
                y1, y2 = min(y1, y2), max(y1, y2)

                img_width, img_height = original_image.size
                if x1 < 0 or y1 < 0 or x2 > img_width or y2 > img_height:
                    return jsonify({
                        'error': (
                            f'Box coordinates out of image bounds. Image: {img_width}x{img_height}, '
                            f'Box: ({x1},{y1}) to ({x2},{y2})'
                        )
                    }), 400

                if x2 - x1 < 10 or y2 - y1 < 10:
                    return jsonify({'error': 'Box too small (minimum 10x10 pixels)'}), 400

                box = [x1, y1, x2, y2]
                logger.info(f'Creating mask from box: {box}')
                mask_image = create_mask_from_box(original_image, box)
            except Exception as e:
                logger.error(f'Invalid box coordinates: {str(e)}', exc_info=True)
                return jsonify({'error': f'Invalid box coordinates format: {str(e)}'}), 400

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        mask_image.save(f'outputs/mask_{timestamp}.png')
        logger.info(f'Mask saved to outputs/mask_{timestamp}.png')

        logger.info('Generating edited image with Stable Diffusion...')
        edited_image = edit_image_with_inpainting(original_image, mask_image, modification)
        edited_image.save(f'outputs/edited_{timestamp}.png')
        logger.info(f'Edited image saved to outputs/edited_{timestamp}.png')

        if random.random() < 0.1:
            cleanup_old_outputs()

        edited_base64 = image_to_base64(edited_image)
        mask_base64 = image_to_base64(mask_image)

        return jsonify({
            'success': True,
            'edited_image': edited_base64,
            'mask': mask_base64,
            'timestamp': timestamp
        })
    except ValueError as e:
        logger.warning(f'Validation error: {str(e)}')
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f'Error processing image: {str(e)}', exc_info=True)
        error_message = str(e) if os.getenv('FLASK_DEBUG', 'False').lower() == 'true' else 'An error occurred while processing the image'
        return jsonify({'error': error_message}), 500


@app.route('/api/test', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=60)
def test_segmentation():
    """Test endpoint to verify SAM segmentation is working."""
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400

        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        image_data = data.get('image')
        if not image_data:
            return jsonify({'error': 'No image provided'}), 400

        try:
            if image_data.startswith('data:image'):
                image_data = image_data.split(',', 1)[1]
            image_bytes = base64.b64decode(image_data)
            if len(image_bytes) == 0:
                return jsonify({'error': 'Invalid image data'}), 400
            original_image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        except Exception as e:
            logger.error(f'Error decoding image: {str(e)}')
            return jsonify({'error': 'Invalid image format'}), 400

        points_data = data.get('points', [])
        if not points_data:
            return jsonify({'error': 'No points provided'}), 400

        foreground_points = [[p['x'], p['y']] for p in points_data if p.get('type') == 'foreground']
        if not foreground_points:
            return jsonify({'error': 'No foreground points provided'}), 400

        mask_image = create_mask_from_points(original_image, foreground_points)
        mask_base64 = image_to_base64(mask_image)
        return jsonify({'success': True, 'mask': mask_base64})
    except ValueError as e:
        logger.warning(f'Validation error: {str(e)}')
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f'Error in test segmentation: {str(e)}', exc_info=True)
        error_message = str(e) if os.getenv('FLASK_DEBUG', 'False').lower() == 'true' else 'An error occurred while processing the image'
        return jsonify({'error': error_message}), 500


if __name__ == '__main__':
    logger.info('\n' + '=' * 50)
    logger.info('Home Visualizer Backend Starting...')
    logger.info(f'Device: {device}')
    logger.info('=' * 50 + '\n')

    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    logger.info(f'Debug mode: {debug_mode}')
    app.run(host='0.0.0.0', port=5001, debug=debug_mode)
