import logging

import cv2
import numpy as np
import torch
from PIL import Image
from transformers import SamModel, SamProcessor

logger = logging.getLogger(__name__)


class LocalSegmentationProvider:
    """Local SAM-based segmentation provider with lazy model loading."""

    def __init__(self, device: str, dtype: torch.dtype, model_id: str = 'facebook/sam-vit-huge'):
        self.device = device
        self.dtype = dtype
        self.model_id = model_id
        self._sam_model = None
        self._sam_processor = None

    def _ensure_loaded(self):
        if self._sam_model is not None and self._sam_processor is not None:
            return

        logger.info('Loading SAM model...')
        self._sam_model = SamModel.from_pretrained(self.model_id, torch_dtype=self.dtype).to(self.device)
        self._sam_processor = SamProcessor.from_pretrained(self.model_id)
        logger.info('SAM model loaded successfully')

    def _post_process_mask(self, masks, scores):
        best_mask_idx = scores.argmax()
        best_mask = masks[0, best_mask_idx].numpy()

        mask_image = Image.fromarray((best_mask * 255).astype(np.uint8))
        mask_np = np.array(mask_image)
        kernel = np.ones((5, 5), np.uint8)
        mask_np = cv2.dilate(mask_np, kernel, iterations=2)
        return Image.fromarray(mask_np)

    def create_mask_from_points(self, image, foreground_points, background_points=None):
        self._ensure_loaded()

        all_points = foreground_points.copy()
        all_labels = [1] * len(foreground_points)

        if background_points:
            all_points.extend(background_points)
            all_labels.extend([0] * len(background_points))

        inputs = self._sam_processor(
            image,
            input_points=[[all_points]],
            input_labels=[[all_labels]],
            return_tensors='pt'
        ).to(self.device)

        with torch.no_grad():
            outputs = self._sam_model(**inputs)

        masks = self._sam_processor.image_processor.post_process_masks(
            outputs.pred_masks.cpu(),
            inputs['original_sizes'].cpu(),
            inputs['reshaped_input_sizes'].cpu()
        )[0]

        scores = outputs.iou_scores.cpu().numpy()[0]
        return self._post_process_mask(masks, scores)

    def create_mask_from_box(self, image, box):
        self._ensure_loaded()

        inputs = self._sam_processor(
            image,
            input_boxes=[[[box]]],
            return_tensors='pt'
        ).to(self.device)

        with torch.no_grad():
            outputs = self._sam_model(**inputs)

        masks = self._sam_processor.image_processor.post_process_masks(
            outputs.pred_masks.cpu(),
            inputs['original_sizes'].cpu(),
            inputs['reshaped_input_sizes'].cpu()
        )[0]

        scores = outputs.iou_scores.cpu().numpy()[0]
        return self._post_process_mask(masks, scores)
