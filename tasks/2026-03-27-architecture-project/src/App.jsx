import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  MoveHorizontal,
  Download,
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

const compressImage = (dataUrl, maxDimension = 1920) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
      if (scale >= 1) { resolve(dataUrl); return; }
      const offscreen = document.createElement('canvas');
      offscreen.width = Math.round(img.naturalWidth * scale);
      offscreen.height = Math.round(img.naturalHeight * scale);
      offscreen.getContext('2d').drawImage(img, 0, 0, offscreen.width, offscreen.height);
      resolve(offscreen.toDataURL('image/jpeg', 0.88));
    };
    img.src = dataUrl;
  });

const BeforeAfterCompare = ({ beforeImage, afterImage, compareValue, onCompareChange, aspect }) => (
  <div className="before-after-shell">
    <div className="before-after-stage" style={{ '--compare-position': `${compareValue}%`, aspectRatio: aspect || 'auto' }}>
      <img src={beforeImage} alt="Original room" className="compare-image base-image" draggable="false" />
      <div className="compare-overlay" aria-hidden="true">
        <img src={afterImage} alt="" className="compare-image" draggable="false" />
      </div>
      <div className="compare-divider" aria-hidden="true">
        <div className="compare-handle">
          <MoveHorizontal size={18} />
        </div>
      </div>
      <div className="compare-chip compare-chip-left">Before</div>
      <div className="compare-chip compare-chip-right">After</div>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={compareValue}
        onChange={(event) => onCompareChange(Number(event.target.value))}
        className="compare-range"
        aria-label="Swipe to compare before and after images"
      />
    </div>
    <div className="compare-footer">
      <span>Drag the slider to compare</span>
      <strong>{compareValue < 50 ? 'Original focus' : compareValue > 50 ? 'Edited focus' : 'Split view'}</strong>
    </div>
  </div>
);

const HomeVisualizationApp = () => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [imageAspect, setImageAspect] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [points, setPoints] = useState([]);
  const [selectionIntent, setSelectionIntent] = useState('foreground');
  const [mode, setMode] = useState('box');
  const [compareValue, setCompareValue] = useState(50);
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

  const boxMetrics = useMemo(() => {
    if (!boxStart || !boxEnd) return null;
    return {
      width: Math.abs(boxEnd.x - boxStart.x),
      height: Math.abs(boxEnd.y - boxStart.y),
    };
  }, [boxEnd, boxStart]);

  const hasActiveSelection = points.length > 0 || Boolean(boxStart && boxEnd);
  const resultReady = Boolean(editedImage);
  const promptLength = modification.trim().length;

  const currentStepNumber = useMemo(() => {
    if (resultReady) return 4;
    if (promptLength > 0) return 3;
    if (hasActiveSelection) return 2;
    if (image) return 1;
    return 0;
  }, [resultReady, promptLength, hasActiveSelection, image]);

  const resultSummaryText = useMemo(() => {
    if (!resultReady) return '';
    if (modification.trim()) return modification.trim();
    return 'Generated design update';
  }, [modification, resultReady]);

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
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      drawOverlays(ctx);
    };
    img.src = image;
  }, [drawOverlays, image]);

  useEffect(() => {
    if (!image) return;
    const frame = requestAnimationFrame(drawCanvas);
    return () => cancelAnimationFrame(frame);
  }, [drawCanvas, image, points, boxStart, boxEnd, isDrawingBox]);

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
    setImageAspect(null);
    setEditedImage(null);
    setModification('');
    setCompareValue(50);
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
      setError('HEIC format is not supported. In Photos, share the image and choose "Export as JPEG", then upload that file.');
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
        setImageAspect(img.naturalWidth / img.naturalHeight);
        setImage(loadEvent.target?.result);
        setEditedImage(null);
        setModification('');
        setCompareValue(50);
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
    setProgressValue(10);
    setProcessingStage(PROCESS_STEPS[0]);
    setError(null);

    try {
      const compressedImage = await compressImage(image);

      setProcessingStage(PROCESS_STEPS[1]);
      setProgressValue(30);

      const requestData = {
        image: compressedImage,
        mode,
        modification: modification.trim(),
        points,
        box: mode === 'box' ? { start: boxStart, end: boxEnd } : null,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);
      const apiBase = import.meta.env.VITE_API_BASE || '';

      setProcessingStage(PROCESS_STEPS[2]);
      setProgressValue(55);
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
      setCompareValue(50);
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
    if (!isProcessing && progressValue === 100) return 'done';
    const currentIndex = PROCESS_STEPS.findIndex((step) => step === processingStage);
    if (currentIndex === -1) return 'todo';
    if (currentIndex > index) return 'done';
    if (currentIndex === index) return 'active';
    return 'todo';
  };

  return (
    <div className="app-shell">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isProcessing ? processingStage : error || ''}
      </div>
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
      {isUploading && <LoadingToast label="Importing your image…" />}

      <header className="topbar">
        <div className="brand-mark">
          <Home size={20} />
        </div>
        <div>
          <p className="eyebrow">AI Design Studio</p>
          <h1>Home Visualizer AI</h1>
        </div>
      </header>

      <main className="app-layout">
        <section className="phone-stage card surface-hero">
          <div className="phone-stage-header">
            <div>
              <p className="section-kicker">Live preview</p>
              <h2>{!image ? 'Start with a room photo' : resultReady ? 'Before / after compare' : 'Selection canvas'}</h2>
            </div>
            {resultReady && <span className="mini-status accent"><MoveHorizontal size={14} /> Swipe compare</span>}
          </div>

          <div className="compact-stepper">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className={`compact-step ${currentStepNumber >= step ? 'active' : ''} ${currentStepNumber > step ? 'complete' : ''}`}>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <div className="canvas-shell">
            {!image ? (
              <button type="button" className="upload-blank-state" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon"><ImagePlus size={26} /></div>
                <strong>Upload a space photo</strong>
                <span>JPG, PNG, or WebP up to 50MB</span>
              </button>
            ) : resultReady ? (
              <BeforeAfterCompare
                beforeImage={image}
                afterImage={editedImage}
                compareValue={compareValue}
                onCompareChange={setCompareValue}
                aspect={imageAspect}
              />
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

          {resultReady ? (
            <div className="result-spotlight">
              <div className="result-spotlight-copy">
                <p className="section-kicker">Result ready</p>
                <h3>Updated design concept</h3>
                <p>{resultSummaryText}</p>
              </div>
              <div className="result-spotlight-actions">
                <span className="stat-badge accent"><MoveHorizontal size={16} /> Drag the divider to inspect details</span>
                <button type="button" className="primary-button inline-primary" onClick={downloadImage}>
                  <Download size={16} />
                  Download result
                </button>
              </div>
            </div>
          ) : (
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
              </div>
            </div>
          )}
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
              accept="image/*"
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
              {hasActiveSelection && <span className="mini-status success"><CheckCircle2 size={14} /> Selection ready</span>}
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
                <p className="helper-text">Tap the canvas after choosing Include or Exclude to place a selection point.</p>
              </>
            )}

            {mode === 'box' && (
              <>
                <p className="helper-text">Drag directly on the image to frame the area you want changed.</p>
                {boxMetrics && (
                  <div className="micro-stats-row">
                    <span className="stat-badge accent">W: {Math.round(boxMetrics.width)}px</span>
                    <span className="stat-badge accent">H: {Math.round(boxMetrics.height)}px</span>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Step 3</p>
                <h3>Describe the change</h3>
              </div>
              {promptLength > 0 && <span className="mini-status muted">{promptLength} chars</span>}
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

          <section className="card sticky-action-card bottom-sheet-card">
            <div className="bottom-sheet-handle" aria-hidden="true" />
            <div className="section-heading">
              <div>
                <p className="section-kicker">Step 4</p>
                <h3>Generate</h3>
              </div>
              <span className="mini-status muted">App-style progress</span>
            </div>
            <button type="button" className="primary-button large-button" onClick={processImage} disabled={isProcessing || !image}>
              {isProcessing ? <Loader2 size={18} className="spin" /> : <Wand2 size={18} />}
              {isProcessing ? processingStage || 'Generating…' : resultReady ? 'Generate another version' : 'Generate visualization'}
            </button>

            <div className="progress-shell">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressValue}%` }} />
              </div>
              <div className="progress-steps clean-steps">
                {PROCESS_STEPS.map((step, index) => (
                  <div key={step} className={`progress-step ${stepState(index)}`}>
                    <span>{stepState(index) === 'done' ? '✓' : index + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </aside>
      </main>
      <div className="mobile-generate-bar" role="region" aria-label="Generate action">
        <button
          type="button"
          className="primary-button"
          onClick={processImage}
          disabled={isProcessing || !image}
          aria-busy={isProcessing}
        >
          {isProcessing ? <Loader2 size={18} className="spin" /> : <Wand2 size={18} />}
          {isProcessing ? (processingStage || 'Generating…') : resultReady ? 'Generate another' : 'Generate'}
        </button>
      </div>
    </div>
  );
};

export default HomeVisualizationApp;
