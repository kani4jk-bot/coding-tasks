import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Home,
  ImagePlus,
  Loader2,
  RefreshCw,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';

const PROCESS_STEPS = [
  'Preparing image',
  'Building selection mask',
  'Sending edit request',
  'Rendering final result',
];

const PRESETS = [
  { label: 'Warm oak floor', value: 'warm white oak flooring with subtle natural grain' },
  { label: 'Sage walls', value: 'soft sage green painted wall with a matte finish' },
  { label: 'Stone counters', value: 'light quartz countertop with soft gray veining' },
  { label: 'Modern sofa', value: 'clean-lined cream sofa with modern styling' },
  { label: 'Brass accents', value: 'brushed brass hardware and fixtures' },
  { label: 'Mood lighting', value: 'warm recessed ambient lighting with a premium modern feel' },
];

const ErrorBanner = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast-stack">
      <div className="toast toast-error">
        <AlertCircle size={18} />
        <div>
          <strong>Something went wrong</strong>
          <p>{message}</p>
        </div>
        <button type="button" className="ghost-icon-button" onClick={onClose} aria-label="Dismiss error">
          ×
        </button>
      </div>
    </div>
  );
};

const LoadingToast = ({ label }) => (
  <div className="toast-stack">
    <div className="toast toast-info">
      <Loader2 size={18} className="spin" />
      <div>
        <strong>Working on it</strong>
        <p>{label}</p>
      </div>
    </div>
  </div>
);

const clampPoint = (value, max) => Math.max(0, Math.min(max, value));

const getCanvasPoint = (event, canvas) => {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height || !canvas.width || !canvas.height) {
    return null;
  }

  const clientX = 'touches' in event ? event.touches[0]?.clientX ?? event.changedTouches[0]?.clientX : event.clientX;
  const clientY = 'touches' in event ? event.touches[0]?.clientY ?? event.changedTouches[0]?.clientY : event.clientY;

  if (typeof clientX !== 'number' || typeof clientY !== 'number') {
    return null;
  }

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: clampPoint((clientX - rect.left) * scaleX, canvas.width),
    y: clampPoint((clientY - rect.top) * scaleY, canvas.height),
  };
};

const HomeVisualizationApp = () => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [points, setPoints] = useState([]);
  const [selectionIntent, setSelectionIntent] = useState('foreground');
  const [mode, setMode] = useState('point');
  const [showOriginal, setShowOriginal] = useState(false);
  const [modification, setModification] = useState('');
  const [boxStart, setBoxStart] = useState(null);
  const [boxEnd, setBoxEnd] = useState(null);
  const [isDrawingBox, setIsDrawingBox] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  const [error, setError] = useState(null);

  const selectionSummary = useMemo(() => ({
    include: points.filter((point) => point.type === 'foreground').length,
    exclude: points.filter((point) => point.type === 'background').length,
  }), [points]);

  const drawOverlays = useCallback((ctx) => {
    points.forEach((point, index) => {
      const isForeground = point.type === 'foreground';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = isForeground ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.font = '600 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), point.x, point.y + 0.5);
    });

    if (boxStart && boxEnd) {
      const x = Math.min(boxStart.x, boxEnd.x);
      const y = Math.min(boxStart.y, boxEnd.y);
      const width = Math.abs(boxEnd.x - boxStart.x);
      const height = Math.abs(boxEnd.y - boxStart.y);

      ctx.fillStyle = 'rgba(139, 92, 246, 0.18)';
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.95)';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 10]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
    }
  }, [boxEnd, boxStart, points]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    const baseImg = new Image();

    baseImg.onload = () => {
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;

      const activeSource = editedImage && !showOriginal ? editedImage : image;
      const displayImg = new Image();
      displayImg.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(displayImg, 0, 0);
        if (!editedImage || showOriginal) {
          drawOverlays(ctx);
        }
      };
      displayImg.src = activeSource;
    };

    baseImg.src = image;
  }, [drawOverlays, editedImage, image, showOriginal]);

  useEffect(() => {
    if (!image) return;
    const frame = requestAnimationFrame(drawCanvas);
    return () => cancelAnimationFrame(frame);
  }, [drawCanvas, image, points, boxStart, boxEnd, isDrawingBox, editedImage, showOriginal]);

  useEffect(() => {
    document.title = 'Home Visualizer AI';
  }, []);

  const clearSelection = useCallback(() => {
    setPoints([]);
    setBoxStart(null);
    setBoxEnd(null);
  }, []);

  const resetAll = () => {
    setImage(null);
    setEditedImage(null);
    setModification('');
    setShowOriginal(false);
    clearSelection();
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Max size is 50MB, and this file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      event.target.value = '';
      setIsUploading(false);
      return;
    }

    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const isHEIC = fileName.endsWith('.heic') || fileName.endsWith('.heif') || fileType.includes('heic') || fileType.includes('heif');
    if (isHEIC) {
      setError('HEIC is not supported yet. Please export the photo as JPG or PNG first.');
      event.target.value = '';
      setIsUploading(false);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file. JPG, PNG, and WebP work best.');
      event.target.value = '';
      setIsUploading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        setImage(loadEvent.target?.result);
        setEditedImage(null);
        setModification('');
        setShowOriginal(false);
        clearSelection();
        setIsUploading(false);
      };
      img.onerror = () => {
        setError('Could not open that image. Try a different file.');
        setIsUploading(false);
      };
      img.src = loadEvent.target?.result;
    };
    reader.onerror = () => {
      setError('Failed to read the selected file.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePointAdd = (event, pointType = selectionIntent) => {
    const canvas = canvasRef.current;
    if (!canvas || !image || isProcessing || mode !== 'point') return;

    const point = getCanvasPoint(event, canvas);
    if (!point) return;

    setPoints((current) => [...current, { x: Number(point.x), y: Number(point.y), type: pointType }]);
  };

  const beginBoxDraw = (event) => {
    if (!image || isProcessing || mode !== 'box') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = getCanvasPoint(event, canvas);
    if (!point) return;

    setIsDrawingBox(true);
    setBoxStart(point);
    setBoxEnd(point);
  };

  const moveBoxDraw = (event) => {
    if (!isDrawingBox || !image || isProcessing || mode !== 'box') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = getCanvasPoint(event, canvas);
    if (!point) return;
    setBoxEnd(point);
  };

  const endBoxDraw = () => {
    if (isDrawingBox) {
      setIsDrawingBox(false);
    }
  };

  const undoLastSelection = () => {
    if (mode === 'point') {
      setPoints((current) => current.slice(0, -1));
    } else {
      setBoxStart(null);
      setBoxEnd(null);
    }
  };

  const downloadImage = () => {
    if (!editedImage) return;
    const link = document.createElement('a');
    link.href = editedImage;
    link.download = 'edited-home-visualization.png';
    link.click();
  };

  const processImage = async () => {
    if (!modification.trim()) {
      setError('Describe the change you want before generating.');
      return;
    }

    if (mode === 'point' && points.length === 0) {
      setError('Add at least one selection point first.');
      return;
    }

    if (mode === 'box' && (!boxStart || !boxEnd)) {
      setError('Draw a box around the area you want to edit.');
      return;
    }

    if (mode === 'box') {
      const width = Math.abs(boxEnd.x - boxStart.x);
      const height = Math.abs(boxEnd.y - boxStart.y);
      if (width < 10 || height < 10) {
        setError('The selection box is too small. Draw a slightly larger area.');
        return;
      }
    }

    setIsProcessing(true);
    setProgressValue(15);
    setProcessingStage(PROCESS_STEPS[0]);
    setError(null);

    const requestData = {
      image,
      mode,
      modification: modification.trim(),
      points,
      box: mode === 'box' ? { start: boxStart, end: boxEnd } : null,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);
      const apiBase = import.meta.env.VITE_API_BASE || '';

      setProcessingStage(PROCESS_STEPS[1]);
      setProgressValue(35);

      setProcessingStage(PROCESS_STEPS[2]);
      setProgressValue(60);
      const response = await fetch(`${apiBase}/api/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `${errorMessage} ${response.statusText}`;
        }
        if (response.status === 429) {
          errorMessage = 'Rate limit hit. Wait a little, then try again.';
        }
        throw new Error(errorMessage);
      }

      setProcessingStage(PROCESS_STEPS[3]);
      setProgressValue(85);
      const result = await response.json();

      if (!result.success) {
        throw new Error('The edit request finished without a usable result.');
      }

      setEditedImage(result.edited_image);
      setShowOriginal(false);
      setProgressValue(100);
      setProcessingStage('Done');
      window.setTimeout(() => setProcessingStage(''), 1200);
    } catch (requestError) {
      if (requestError.name === 'AbortError') {
        setError('The request timed out. Try a smaller image or a simpler edit prompt.');
      } else if (String(requestError.message).includes('Failed to fetch')) {
        setError('Could not reach the backend. Make sure the Flask API is running on port 5001.');
      } else {
        setError(requestError.message);
      }
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgressValue(0), 400);
    }
  };

  const stepState = (index) => {
    const currentIndex = PROCESS_STEPS.findIndex((step) => step === processingStage);
    if (!isProcessing && progressValue === 100) return 'done';
    if (currentIndex > index) return 'done';
    if (currentIndex === index) return 'active';
    return 'todo';
  };

  return (
    <div className="app-shell">
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
      {isUploading && <LoadingToast label="Importing your image…" />}

      <header className="topbar">
        <div className="brand-mark">
          <Home size={20} />
        </div>
        <div>
          <p className="eyebrow">Mobile-first editor</p>
          <h1>Home Visualizer AI</h1>
        </div>
      </header>

      <main className="app-layout">
        <section className="phone-stage card surface-hero">
          <div className="phone-stage-header">
            <div>
              <p className="section-kicker">Live preview</p>
              <h2>{!image ? 'Start with a room photo' : editedImage && !showOriginal ? 'Edited result' : 'Selection canvas'}</h2>
            </div>
            {editedImage && (
              <button type="button" className="pill-button" onClick={() => setShowOriginal((value) => !value)}>
                {showOriginal ? <Eye size={16} /> : <EyeOff size={16} />}
                {showOriginal ? 'Show edit' : 'Show original'}
              </button>
            )}
          </div>

          <div className="canvas-shell">
            {!image ? (
              <button type="button" className="upload-blank-state" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon"><ImagePlus size={26} /></div>
                <strong>Upload a space photo</strong>
                <span>JPG, PNG, or WebP up to 50MB</span>
              </button>
            ) : (
              <canvas
                ref={canvasRef}
                onClick={(event) => handlePointAdd(event)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  handlePointAdd(event, 'background');
                }}
                onMouseDown={beginBoxDraw}
                onMouseMove={moveBoxDraw}
                onMouseUp={endBoxDraw}
                onMouseLeave={endBoxDraw}
                onTouchStart={beginBoxDraw}
                onTouchMove={moveBoxDraw}
                onTouchEnd={endBoxDraw}
                className={`editor-canvas ${mode === 'box' ? 'is-box-mode' : ''}`}
              />
            )}
          </div>

          <div className="selection-toolbar">
            <div className="badge-row">
              <span className="stat-badge">Mode: {mode === 'point' ? 'Point select' : 'Drag box'}</span>
              {mode === 'point' ? (
                <>
                  <span className="stat-badge success">Include: {selectionSummary.include}</span>
                  <span className="stat-badge danger">Exclude: {selectionSummary.exclude}</span>
                </>
              ) : (
                <span className="stat-badge accent">{boxStart && boxEnd ? 'Box ready' : 'Draw selection box'}</span>
              )}
            </div>
            <div className="action-row compact-row">
              <button type="button" className="secondary-button" onClick={undoLastSelection} disabled={mode === 'point' ? points.length === 0 : !boxStart}>
                <RefreshCw size={16} />
                Undo
              </button>
              <button type="button" className="secondary-button" onClick={clearSelection} disabled={points.length === 0 && !boxStart}>
                <Trash2 size={16} />
                Clear
              </button>
              {editedImage && (
                <button type="button" className="secondary-button" onClick={downloadImage}>
                  <Download size={16} />
                  Save
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className="controls-stack">
          <section className="card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Step 1</p>
                <h3>Upload</h3>
              </div>
              {image && <span className="mini-status"><CheckCircle2 size={14} /> Image ready</span>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              className="hidden-input"
            />
            <button type="button" className="primary-button" onClick={() => fileInputRef.current?.click()}>
              <Upload size={18} />
              {image ? 'Replace image' : 'Choose image'}
            </button>
            {image && (
              <button type="button" className="ghost-button danger-text" onClick={resetAll}>
                <Trash2 size={16} />
                Reset everything
              </button>
            )}
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Step 2</p>
                <h3>Select area</h3>
              </div>
            </div>
            <div className="segmented-grid">
              <button type="button" className={`segment ${mode === 'point' ? 'active' : ''}`} onClick={() => { setMode('point'); clearSelection(); }}>
                <Sparkles size={16} />
                Point mode
              </button>
              <button type="button" className={`segment ${mode === 'box' ? 'active' : ''}`} onClick={() => { setMode('box'); clearSelection(); }}>
                <Square size={16} />
                Box mode
              </button>
            </div>

            {mode === 'point' && (
              <>
                <div className="segmented-grid tone-grid">
                  <button type="button" className={`segment ${selectionIntent === 'foreground' ? 'active success' : ''}`} onClick={() => setSelectionIntent('foreground')}>
                    Include area
                  </button>
                  <button type="button" className={`segment ${selectionIntent === 'background' ? 'active danger' : ''}`} onClick={() => setSelectionIntent('background')}>
                    Exclude area
                  </button>
                </div>
                <p className="helper-text">On phones, tap the canvas after choosing Include or Exclude. On desktop, right-click still works for exclude points.</p>
              </>
            )}

            {mode === 'box' && (
              <p className="helper-text">Drag directly on the image to frame the area you want changed.</p>
            )}
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Step 3</p>
                <h3>Describe the change</h3>
              </div>
            </div>
            <textarea
              value={modification}
              onChange={(event) => setModification(event.target.value)}
              className="prompt-input"
              placeholder="Example: Replace this countertop with honed white quartz and make the backsplash warmer."
            />
            <div className="preset-grid">
              {PRESETS.map((preset) => (
                <button key={preset.label} type="button" className="preset-chip" onClick={() => setModification(preset.value)}>
                  {preset.label}
                </button>
              ))}
            </div>
          </section>

          <section className="card sticky-action-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Step 4</p>
                <h3>Generate</h3>
              </div>
              <span className="mini-status muted">App-style progress</span>
            </div>
            <button type="button" className="primary-button large-button" onClick={processImage} disabled={isProcessing || !image}>
              {isProcessing ? <Loader2 size={18} className="spin" /> : <Wand2 size={18} />}
              {isProcessing ? processingStage || 'Generating…' : 'Generate visualization'}
            </button>

            <div className="progress-shell">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressValue}%` }} />
              </div>
              <div className="progress-steps">
                {PROCESS_STEPS.map((step, index) => (
                  <div key={step} className={`progress-step ${stepState(index)}`}>
                    <span>{index + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
};

export default HomeVisualizationApp;
