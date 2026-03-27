import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Wand2, Download, Trash2, Eye, EyeOff, Sparkles, Home, Camera, X, AlertCircle } from 'lucide-react';

// Error Notification Component
const ErrorNotification = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-red-500/95 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl border border-red-400/50 max-w-md">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold mb-1">Error</p>
            <p className="text-sm text-red-50">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-red-100 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const HomeVisualizationApp = () => {
  const [image, setImage] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [points, setPoints] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [modification, setModification] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [mode, setMode] = useState('point');
  const [boxStart, setBoxStart] = useState(null);
  const [boxEnd, setBoxEnd] = useState(null);
  const [isDrawingBox, setIsDrawingBox] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const canvasRef = useRef(null);

  const presets = [
    { label: 'White Marble Table', value: 'white marble table with subtle gray veining' },
    { label: 'Dark Wood Floor', value: 'dark walnut hardwood flooring' },
    { label: 'Sage Green Wall', value: 'sage green painted wall, matte finish' },
    { label: 'Modern Gray Sofa', value: 'modern gray fabric sofa, contemporary style' },
    { label: 'Brass Fixtures', value: 'brushed brass metal fixtures' },
    { label: 'Quartz Countertop', value: 'white quartz countertop with gray veining' },
  ];

  const drawOverlays = useCallback((ctx) => {
    // Draw points
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = point.type === 'foreground' ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw box
    if (boxStart && boxEnd) {
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        boxStart.x,
        boxStart.y,
        boxEnd.x - boxStart.x,
        boxEnd.y - boxStart.y
      );
      ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
      ctx.fillRect(
        boxStart.x,
        boxStart.y,
        boxEnd.x - boxStart.x,
        boxEnd.y - boxStart.y
      );
    } else if (boxStart && !boxEnd && isDrawingBox) {
      ctx.beginPath();
      ctx.arc(boxStart.x, boxStart.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
      ctx.fill();
    }
  }, [points, boxStart, boxEnd, isDrawingBox]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Determine which image to show
      const shouldShowEdited = editedImage && !showOriginal;
      
      if (shouldShowEdited) {
        // Draw edited image
        const editedImg = new Image();
        editedImg.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(editedImg, 0, 0);
          // Don't draw overlays on the edited result
        };
        editedImg.onerror = () => {
          console.error('Failed to load edited image');
          // Fallback to original
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          drawOverlays(ctx);
        };
        editedImg.src = editedImage;
      } else {
        // Draw original image with overlays
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        drawOverlays(ctx);
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image');
    };
    
    img.src = image;
  }, [image, showOriginal, editedImage, drawOverlays]);

  useEffect(() => {
    if (image && canvasRef.current) {
      // Use requestAnimationFrame for smoother rendering
      const frameId = requestAnimationFrame(() => {
        drawCanvas();
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [image, drawCanvas]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    // Validate file size (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large! Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
      e.target.value = '';
      setIsUploading(false);
      return;
    }

    // Check if it's HEIC format
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const isHEIC = fileName.endsWith('.heic') || fileName.endsWith('.heif') || fileType.includes('heic') || fileType.includes('heif');

    if (isHEIC) {
      setError('HEIC format detected! Please convert your image to JPG or PNG first. You can:\n\n1. On iPhone: Go to Settings > Camera > Formats > Select "Most Compatible"\n2. Use an online converter like cloudconvert.com\n3. Open in Preview/Photos and export as JPG');
      e.target.value = '';
      setIsUploading(false);
      return;
    }

    // Validate it's an image
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WebP, etc.)');
      e.target.value = '';
      setIsUploading(false);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Image loaded successfully
          setImage(event.target.result);
          setEditedImage(null);
          setPoints([]);
          setBoxStart(null);
          setBoxEnd(null);
          setIsUploading(false);
        };
        img.onerror = () => {
          setError('Failed to load image. Please try a different file format (JPG or PNG recommended).');
          e.target.value = '';
          setIsUploading(false);
        };
        img.src = event.target.result;
      };
      reader.onerror = () => {
        setError('Failed to read file. Please try again.');
        e.target.value = '';
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setError('Error loading image: ' + error.message);
      e.target.value = '';
      setIsUploading(false);
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (!image || isProcessing) return;

    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX));
    const y = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY));

    // Ensure coordinates are valid numbers
    if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
      console.error('Invalid coordinates calculated:', { x, y, canvas: { width: canvas.width, height: canvas.height }, rect });
      return;
    }

    if (mode === 'point') {
      // For point mode, use click handler
      return;
    } else if (mode === 'box') {
      setIsDrawingBox(true);
      setBoxStart({ x: Number(x), y: Number(y) });
      setBoxEnd({ x: Number(x), y: Number(y) }); // Initialize end point
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!image || isProcessing || !isDrawingBox || mode !== 'box') return;

    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX));
    const y = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY));

    // Ensure coordinates are valid numbers
    if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
      return;
    }

    setBoxEnd({ x: Number(x), y: Number(y) });
  };

  const handleCanvasMouseUp = () => {
    if (isDrawingBox) {
      setIsDrawingBox(false);
    }
  };

  const handleCanvasClick = (e) => {
    if (!image || isProcessing || mode !== 'point') return;

    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX));
    const y = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY));

    // Ensure coordinates are valid numbers
    if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
      return;
    }

    setPoints([...points, { x: Number(x), y: Number(y), type: 'foreground' }]);
  };

  const handleCanvasRightClick = (e) => {
    e.preventDefault();
    if (!image || isProcessing || mode !== 'point') return;

    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX));
    const y = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY));

    // Ensure coordinates are valid numbers
    if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
      return;
    }

    setPoints([...points, { x: Number(x), y: Number(y), type: 'background' }]);
  };

  const processImage = async () => {
    if (!modification.trim()) {
      setError('Please describe what you want to change!');
      return;
    }

    if (mode === 'point' && points.length === 0) {
      setError('Please click on the object you want to modify!');
      return;
    }

    if (mode === 'box') {
      if (!boxStart || !boxEnd) {
        setError('Please draw a box around the object you want to modify!');
        return;
      }
      // Validate box coordinates
      if (typeof boxStart.x !== 'number' || typeof boxStart.y !== 'number' ||
          typeof boxEnd.x !== 'number' || typeof boxEnd.y !== 'number') {
        setError('Invalid box coordinates. Please try drawing the box again.');
        return;
      }
      // Check if box has valid dimensions
      const boxWidth = Math.abs(boxEnd.x - boxStart.x);
      const boxHeight = Math.abs(boxEnd.y - boxStart.y);
      if (boxWidth < 10 || boxHeight < 10) {
        setError('Box is too small. Please draw a larger box (minimum 10x10 pixels).');
        return;
      }
    }

    setIsProcessing(true);
    setProcessingStage('Creating mask...');
    setError(null);

    try {
      // Prepare request data
      const requestData = {
        image: image,
        mode: mode,
        modification: modification.trim(),
        points: points,
        box: mode === 'box' ? { 
          start: { x: boxStart.x, y: boxStart.y }, 
          end: { x: boxEnd.x, y: boxEnd.y } 
        } : null
      };

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

      // Call Flask backend
      setProcessingStage('Sending request to server...');
      const apiBase = import.meta.env.VITE_API_BASE || '';
      const response = await fetch(`${apiBase}/api/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = 'Failed to process image';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          
          // Handle rate limiting
          if (response.status === 429) {
            errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
          }
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      setProcessingStage('Generating edited image...');
      const result = await response.json();
      
      if (result.success) {
        setProcessingStage('Complete!');
        setEditedImage(result.edited_image);
        setShowOriginal(false); // Show the result by default
        console.log('Image processed successfully!');
        
        // Clear processing stage after a moment
        setTimeout(() => setProcessingStage(''), 1000);
      } else {
        throw new Error('Processing failed');
      }
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Error processing image: ';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. The image may be too large or the server is taking too long.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Could not connect to the server. Make sure the Flask backend is running on http://localhost:5001';
      } else if (error.message.includes('Rate limit')) {
        errorMessage = error.message;
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  const clearSelection = () => {
    setPoints([]);
    setBoxStart(null);
    setBoxEnd(null);
  };

  const downloadImage = () => {
    if (!editedImage) return;
    
    const link = document.createElement('a');
    link.download = 'edited-home-visualization.png';
    link.href = editedImage;
    link.click();
  };

  const resetAll = () => {
    setImage(null);
    setEditedImage(null);
    setPoints([]);
    setBoxStart(null);
    setBoxEnd(null);
    setModification('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {error && <ErrorNotification message={error} onClose={() => setError(null)} />}
      {isUploading && (
        <div className="fixed top-4 right-4 z-50 bg-blue-500/95 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl border border-blue-400/50">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <p className="text-sm">Uploading image...</p>
          </div>
        </div>
      )}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Home Visualizer AI</h1>
              <p className="text-purple-200 text-sm">Transform your space with AI-powered design</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Image
              </h2>
              
              {!image ? (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-purple-400/50 rounded-xl p-8 text-center hover:border-purple-400 transition-all hover:bg-white/5">
                    <Camera className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                    <p className="text-white font-medium mb-1">Click to upload</p>
                    <p className="text-purple-200 text-sm">or drag and drop your room photo</p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <button
                  onClick={resetAll}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset All
                </button>
              )}
            </div>

            {image && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4">Selection Mode</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setMode('point');
                      clearSelection();
                    }}
                    className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                      mode === 'point'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white/5 text-purple-200 hover:bg-white/10'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Point Selection
                  </button>
                  <button
                    onClick={() => {
                      setMode('box');
                      clearSelection();
                    }}
                    className={`w-full px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                      mode === 'box'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white/5 text-purple-200 hover:bg-white/10'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    Box Selection
                  </button>
                </div>
                
                <div className="mt-4 p-3 bg-black/20 rounded-lg">
                  <p className="text-purple-200 text-sm">
                    {mode === 'point' ? (
                      <>
                        <span className="text-green-400 font-medium">Left click:</span> Select object<br />
                        <span className="text-red-400 font-medium">Right click:</span> Exclude area
                      </>
                    ) : (
                      <>Click and drag to draw a box around the object</>
                    )}
                  </p>
                </div>
                
                {(points.length > 0 || boxStart) && (
                  <button
                    onClick={clearSelection}
                    className="w-full mt-3 bg-white/5 hover:bg-white/10 text-purple-200 px-4 py-2 rounded-lg transition-all text-sm"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            )}

            {image && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  Describe Changes
                </h2>
                
                <textarea
                  value={modification}
                  onChange={(e) => setModification(e.target.value)}
                  placeholder="e.g., white marble table with gold veins"
                  className="w-full bg-black/30 text-white border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-purple-300/50 mb-3 min-h-[100px]"
                />

                <div className="mb-4">
                  <p className="text-purple-200 text-sm mb-2">Quick Presets:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => setModification(preset.value)}
                        className="bg-white/5 hover:bg-white/10 text-purple-200 px-3 py-2 rounded-lg text-xs transition-all border border-white/10"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={processImage}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2 font-semibold shadow-lg shadow-purple-500/50"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {processingStage || 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Visualization
                    </>
                  )}
                </button>
                
                {isProcessing && processingStage && (
                  <div className="mt-3">
                    <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full animate-pulse" style={{ width: '100%' }}></div>
                    </div>
                    <p className="text-purple-200 text-xs mt-2 text-center">{processingStage}</p>
                  </div>
                )}
              </div>
            )}

            {editedImage && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <button
                  onClick={downloadImage}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2 font-semibold shadow-lg shadow-green-500/50"
                >
                  <Download className="w-5 h-5" />
                  Download Result
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  {!image ? 'Preview' : editedImage ? 'Result' : 'Select Object'}
                </h2>
                {editedImage && (
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-white/20"
                  >
                    {showOriginal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {showOriginal ? 'Show Result' : 'Show Original'}
                  </button>
                )}
              </div>

              <div className="bg-black/30 rounded-xl overflow-hidden border border-white/20">
                {!image ? (
                  <div className="aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
                      <p className="text-purple-300/70">Upload an image to get started</p>
                    </div>
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    onContextMenu={handleCanvasRightClick}
                    className="w-full h-auto cursor-crosshair"
                  />
                )}
              </div>

              {image && !editedImage && (
                <div className="mt-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                  <p className="text-purple-200 text-sm">
                    💡 <span className="font-semibold">Tip:</span> Select the object you want to modify, then describe your desired changes above.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeVisualizationApp;
