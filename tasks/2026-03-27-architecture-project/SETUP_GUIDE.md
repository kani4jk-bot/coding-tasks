# Setup Guide - How to Run the Application

This guide will walk you through setting up and running the Architecture Image Editor application.

## Prerequisites

Before you begin, make sure you have:

1. **Python 3.8+** installed
   - Check with: `python --version` or `python3 --version`
   - Download from: https://www.python.org/downloads/

2. **Node.js 16+** and npm installed
   - Check with: `node --version` and `npm --version`
   - Download from: https://nodejs.org/

3. **PyTorch** (will be installed with requirements)
   - For GPU support (NVIDIA): Install CUDA-compatible PyTorch
   - For Apple Silicon: PyTorch with MPS support
   - For CPU: Standard PyTorch

## Step-by-Step Setup

### 1. Backend Setup (Flask API)

#### Install Python Dependencies

```bash
# Navigate to the project directory
cd Architecture-Project

# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Note**: The first time you run the app, it will download large model files (~2-3GB):
- SAM-ViT-Huge model (~1.5GB)
- Stable Diffusion Inpainting model (~1.5GB)

This may take several minutes depending on your internet connection.

#### Run the Backend

```bash
python app.py
```

You should see output like:
```
🚀 NVIDIA GPU detected! Using CUDA
Device: cuda
Loading SAM model...
Loading Stable Diffusion Inpainting model...
Models loaded successfully!
✅ CUDA memory optimizations enabled
Home Visualizer Backend Starting...
```

The backend will be running on `http://localhost:5001`

**Keep this terminal window open** - the backend needs to stay running.

### 2. Frontend Setup (React App)

Open a **new terminal window** (keep the backend running in the first one).

#### Install Node Dependencies

```bash
# Make sure you're in the project directory
cd Architecture-Project

# Install npm packages
npm install
```

#### Run the Frontend Development Server

```bash
npm run dev
```

You should see output like:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

The frontend will be running on `http://localhost:3000`

### 3. Using the Application

1. **Open your browser** and go to `http://localhost:3000`

2. **Upload an image**:
   - Click the upload area or drag and drop an image
   - Supported formats: JPG, PNG, WebP, GIF
   - Maximum size: 50MB

3. **Select the area to edit**:
   - **Point Mode**: Click on objects to select them (left click = select, right click = exclude)
   - **Box Mode**: Click and drag to draw a box around the object

4. **Describe your changes**:
   - Type what you want to change (e.g., "white marble table")
   - Or use the quick preset buttons

5. **Generate**:
   - Click "Generate Visualization"
   - Wait for processing (this may take 30 seconds to 2 minutes depending on your hardware)

6. **Download**:
   - Once complete, click "Download Result" to save your edited image

## Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError` or import errors
- **Solution**: Make sure you activated the virtual environment and installed requirements:
  ```bash
  source venv/bin/activate  # or venv\Scripts\activate on Windows
  pip install -r requirements.txt
  ```

**Problem**: CUDA/GPU not detected
- **Solution**: 
  - For NVIDIA: Install CUDA-compatible PyTorch: `pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118`
  - For Apple Silicon: PyTorch should work with MPS automatically
  - CPU mode will work but is slower

**Problem**: Models downloading slowly
- **Solution**: This is normal on first run. Models are ~3GB total. Be patient or use a faster internet connection.

**Problem**: Port 5001 already in use
- **Solution**: Change the port in `app.py` line 450, or kill the process using port 5001:
  ```bash
  # Find process
  lsof -i :5001  # macOS/Linux
  netstat -ano | findstr :5001  # Windows
  
  # Kill process (replace PID with actual process ID)
  kill -9 PID  # macOS/Linux
  taskkill /PID PID /F  # Windows
  ```

### Frontend Issues

**Problem**: `npm install` fails
- **Solution**: Make sure Node.js 16+ is installed. Try:
  ```bash
  node --version  # Should be 16 or higher
  npm --version
  ```

**Problem**: Port 3000 already in use
- **Solution**: Vite will automatically try the next available port, or change it in `vite.config.js`

**Problem**: Can't connect to backend
- **Solution**: 
  1. Make sure the backend is running on `http://localhost:5001`
  2. Check the browser console for errors
  3. Verify CORS settings in `app.py` if using a different port

**Problem**: React/JSX errors
- **Solution**: Make sure you're using the Vite dev server (`npm run dev`), not opening the HTML file directly

### Performance Issues

**Slow processing**:
- GPU (CUDA/MPS) is much faster than CPU
- Large images take longer to process
- First request may be slower (model initialization)

**Out of memory**:
- Reduce image size before uploading
- Close other applications
- Use CPU mode if GPU memory is limited

## Environment Variables (Optional)

You can customize the backend with environment variables:

```bash
# Set allowed CORS origins (comma-separated)
export ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"

# Set maximum image size (default: 1024px)
export MAX_IMAGE_SIZE=1024

# Set output cleanup days (default: 7)
export OUTPUT_CLEANUP_DAYS=7

# Enable debug mode (default: False)
export FLASK_DEBUG=True
```

## Project Structure

```
Architecture-Project/
├── app.py                 # Flask backend
├── website.jsx            # Original React component (legacy)
├── src/
│   ├── App.jsx           # Main React component
│   └── main.jsx          # React entry point
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── package.json          # Node.js dependencies
├── requirements.txt      # Python dependencies
├── outputs/             # Generated images (created automatically)
├── README.md            # Project documentation
├── CODE_REVIEW.md       # Code review findings
└── SETUP_GUIDE.md       # This file
```

## Quick Start (TL;DR)

```bash
# Terminal 1 - Backend
cd Architecture-Project
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Terminal 2 - Frontend
cd Architecture-Project
npm install
npm run dev

# Open browser to http://localhost:3000
```

## Need Help?

- Check the console/terminal for error messages
- Review the README.md for more details
- Check CODE_REVIEW.md for known issues and improvements

Happy editing! 🎨
