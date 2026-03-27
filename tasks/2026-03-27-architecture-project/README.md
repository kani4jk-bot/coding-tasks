# Architecture Image Editor

An AI-powered image editing application designed for architectural visualization. Edit specific areas of architectural photos using advanced segmentation and inpainting technology.

## Overview

This application allows you to:
- Upload architectural/interior design photos
- Select specific objects or areas using point clicks or bounding boxes
- Describe desired modifications using natural language
- Generate photorealistic edits using AI-powered inpainting

## Features

- **Dual Selection Modes**:
  - **Point Selection**: Click on objects to select them, right-click to exclude areas
  - **Box Selection**: Draw a bounding box around the area you want to edit

- **AI-Powered Editing**:
  - Uses Meta's SAM (Segment Anything Model) for precise mask generation
  - Uses Stable Diffusion Inpainting for photorealistic image editing
  - Optimized for architectural and interior design modifications

- **Modern Web Interface**:
  - React-based frontend with intuitive UI
  - Real-time preview of selections and edits
  - Toggle between original and edited images
  - Quick preset buttons for common modifications

## How It Works

1. **Upload Image**: Upload an architectural photo (JPG, PNG, WebP)
2. **Select Area**: Choose point or box mode, then select the object/area to modify
3. **Describe Changes**: Enter a text description of your desired modification (e.g., "white marble table with gold veins")
4. **Generate**: The AI creates a mask using SAM, then edits the image using Stable Diffusion Inpainting
5. **Download**: Save your edited image

## Architecture

### Backend (`app.py`)
- **Flask API** running on port 5001
- **SAM Model**: Facebook's SAM-ViT-Huge for segmentation
- **Stable Diffusion**: RunwayML's Stable Diffusion Inpainting model
- **Multi-device Support**: Automatically detects and uses CUDA (NVIDIA GPU), MPS (Apple Silicon), or CPU

### Frontend (`website.html`)
- **React Component** with modern UI
- Canvas-based image display and interaction
- Real-time visualization of selections and results

## Quick Start

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Run the backend (Terminal 1)
python app.py

# 3. Install Node dependencies and run frontend (Terminal 2)
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser!

**📖 For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)**

## Setup

### Prerequisites

- Python 3.8+
- PyTorch (with CUDA support if using NVIDIA GPU)
- Node.js 16+ and npm (for React frontend)

### Installation

1. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

2. **Install Hugging Face models** (downloaded automatically on first run):
   - `facebook/sam-vit-huge` - SAM model for segmentation (~1.5GB)
   - `runwayml/stable-diffusion-inpainting` - Stable Diffusion for inpainting (~1.5GB)

3. **Run the backend**:
```bash
python app.py
```

The backend will start on `http://localhost:5001`

4. **Run the frontend** (in a separate terminal):
```bash
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

## API Endpoints

### `GET /api/health`
Health check endpoint. Returns device info and model status.

### `POST /api/edit`
Main editing endpoint. Expects JSON with:
- `image`: Base64 encoded image
- `mode`: `'point'` or `'box'`
- `points`: Array of `{x, y, type}` objects (for point mode)
- `box`: `{start: {x, y}, end: {x, y}}` (for box mode)
- `modification`: Text description of desired changes

Returns:
- `edited_image`: Base64 encoded edited image
- `mask`: Base64 encoded mask used
- `timestamp`: Timestamp of the operation

### `POST /api/test`
Test endpoint for SAM segmentation (returns mask without editing).

## Device Support

The application automatically detects and optimizes for:
- **CUDA**: NVIDIA GPUs (uses float16 for efficiency)
- **MPS**: Apple Silicon Macs (uses float32)
- **CPU**: Fallback option (slower but works everywhere)

## Output

Edited images and masks are saved to the `outputs/` directory with timestamps:
- `mask_YYYYMMDD_HHMMSS.png` - Generated mask
- `edited_YYYYMMDD_HHMMSS.png` - Final edited image

## Notes

- Images are automatically resized to max 1024px to avoid memory issues
- HEIC format is not supported (convert to JPG/PNG first)
- Processing time varies based on device (GPU is fastest)
- First run will download large model files (~2-3GB total)

## Example Use Cases

- Replace furniture in interior photos
- Change wall colors or materials
- Modify countertops, floors, or fixtures
- Add or remove architectural elements
- Visualize design changes before implementation

## Dependencies

- Flask - Web framework
- Flask-CORS - Cross-origin resource sharing
- PyTorch - Deep learning framework
- Diffusers - Hugging Face diffusion models
- Transformers - Hugging Face transformers
- Pillow (PIL) - Image processing
- OpenCV - Computer vision operations
- NumPy - Numerical operations

## License

This project is for architectural visualization purposes.
