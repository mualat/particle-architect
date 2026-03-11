import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Undo2, Redo2, Pen, Eraser, FlipHorizontal, Activity, Trash2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, useAlertStore } from '@/stores/appStore';

interface DrawingPadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (pixels: Array<{ x: number; y: number; r: number; g: number; b: number }>, depth: number, scale: number, rotation: number, fill: boolean) => void;
}

const MAX_HISTORY = 30;

export function DrawingPad({ isOpen, onClose, onUpdate }: DrawingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#00ff88');
  const [symmetry, setSymmetry] = useState(false);
  const [pulsar, setPulsar] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [depth, setDepth] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fill, setFill] = useState(false);
  
  const { setLastDraw, setCachedDrawPixels, setMode: setAppMode } = useAppStore();

  // Initialize canvas with black background
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    // Set canvas size to match container
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set default styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Fill with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save initial blank state
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([imageData]);
    setHistoryIndex(0);
    setIsInitialized(true);
    
    // Make available globally for compatibility
    (window as unknown as { dCanvas: HTMLCanvasElement }).dCanvas = canvas;
  }, []);

  // Handle resize and open state
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
      return;
    }
    
    // Multiple delays to ensure container is rendered
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => initCanvas(), 50));
    timers.push(setTimeout(() => initCanvas(), 150));
    timers.push(setTimeout(() => initCanvas(), 300));
    
    return () => timers.forEach(clearTimeout);
  }, [isOpen, initCanvas]);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(imageData);
      
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const restoreState = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas || index < 0 || index >= history.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.putImageData(history[index], 0, 0);
  }, [history]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      restoreState(newIndex);
    }
  }, [historyIndex, restoreState]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      restoreState(newIndex);
    }
  }, [historyIndex, history.length, restoreState]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, [saveState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, undo, redo]);

  // Get position from mouse or touch event
  const getPos = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return { x: 0, y: 0 };
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.preventDefault();
    if (!isInitialized) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const pos = getPos(e);
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    
    if (mode === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = 15;
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 30;
    }
    
    // Draw a single dot for click
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    // Handle symmetry for initial dot
    if (symmetry) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.restore();
    }
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.preventDefault();
    if (!isDrawing || !isInitialized) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const pos = getPos(e);
    
    if (pulsar && mode === 'pen') {
      ctx.lineWidth = 15 + Math.sin(Date.now() * 0.01) * 10;
    }
    
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    if (symmetry) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.restore();
    }
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const processDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary canvas for processing
    const procCanvas = document.createElement('canvas');
    const procCtx = procCanvas.getContext('2d');
    if (!procCtx) return;
    
    const w = 400;
    const h = Math.floor(400 * (canvas.height / canvas.width)) || 400;
    procCanvas.width = w;
    procCanvas.height = h;
    
    // Draw the original canvas onto processing canvas
    procCtx.drawImage(canvas, 0, 0, w, h);
    
    const data = procCtx.getImageData(0, 0, w, h).data;
    const pixels: Array<{ x: number; y: number; r: number; g: number; b: number }> = [];
    
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        
        // Check if pixel is visible (not black/transparent)
        if (a > 50 && (r > 15 || g > 15 || b > 15)) {
          pixels.push({
            x: (x / w - 0.5) * 60,
            y: ((1 - y / h) - 0.5) * 60 * (h / w),
            r, g, b
          });
        }
      }
    }
    
    if (pixels.length === 0) {
      useAlertStore.getState().openAlert('No Drawing', 'Please draw something first.', 'warning');
      return;
    }
    
    pixels.sort(() => Math.random() - 0.5);
    setCachedDrawPixels(pixels);
    setLastDraw(canvas);
    setAppMode('draw');
    onUpdate(pixels, depth, scale, rotation, fill);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#050505]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#111] border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2 text-[#00ff88] font-bold">
          <Pen className="w-4 h-4" />
          <span className="text-sm">DRAWING PAD</span>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="px-3 py-1.5 text-xs bg-[#222] border border-gray-700 rounded hover:bg-[#333] hover:text-white transition-colors"
        >
          CLOSE
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] border-b border-gray-800 overflow-x-auto flex-shrink-0">
        {/* Color */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-bold">COLOR</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer"
          />
        </div>

        <div className="w-px h-5 bg-gray-700 mx-1" />

        {/* Tools */}
        <button
          onClick={() => setMode('pen')}
          type="button"
          className={cn(
            'p-2 rounded transition-colors',
            mode === 'pen' ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'hover:bg-white/5 text-gray-400'
          )}
        >
          <Pen className="w-4 h-4" />
        </button>
        <button
          onClick={() => setMode('eraser')}
          type="button"
          className={cn(
            'p-2 rounded transition-colors',
            mode === 'eraser' ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'hover:bg-white/5 text-gray-400'
          )}
        >
          <Eraser className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-700 mx-1" />

        {/* Actions */}
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          type="button"
          className="p-2 rounded hover:bg-white/5 disabled:opacity-30 text-gray-400"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          type="button"
          className="p-2 rounded hover:bg-white/5 disabled:opacity-30 text-gray-400"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-700 mx-1" />

        {/* Effects */}
        <button
          onClick={() => setSymmetry(!symmetry)}
          type="button"
          className={cn(
            'p-2 rounded transition-colors',
            symmetry ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'hover:bg-white/5 text-gray-400'
          )}
          title="Mirror Symmetry"
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPulsar(!pulsar)}
          type="button"
          className={cn(
            'p-2 rounded transition-colors',
            pulsar ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'hover:bg-white/5 text-gray-400'
          )}
          title="Pulsing Line Width"
        >
          <Activity className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-700 mx-1" />

        <button
          onClick={clear}
          type="button"
          className="p-2 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors text-gray-400"
          title="Clear Canvas"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair bg-black"
          style={{ touchAction: 'none' }}
        />
        {symmetry && (
          <div className="absolute inset-y-0 left-1/2 w-px bg-[#00ff88]/30 pointer-events-none" />
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-[#111] border-t border-gray-800 flex-shrink-0">
        <div className="flex items-center flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fill}
              onChange={(e) => setFill(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600"
              style={{ accentColor: '#00ff88' }}
            />
            <span className="text-xs text-gray-400 font-bold">SOLID FILL</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold">DEPTH</span>
            <input
              type="range"
              min="0"
              max="100"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="w-20 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#00ff88' }}
            />
            <span className="text-xs text-[#00ff88] w-6">{depth}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold">SCALE</span>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-20 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#00ff88' }}
            />
            <span className="text-xs text-[#00ff88] w-8">{scale}x</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold">ROTATE</span>
            <input
              type="range"
              min="-180"
              max="180"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-20 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#00ff88' }}
            />
            <span className="text-xs text-[#00ff88] w-10">{rotation}°</span>
          </div>
        </div>

        <button
          onClick={processDrawing}
          disabled={!isInitialized}
          type="button"
          className="sm:ml-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88] rounded-lg hover:bg-[#00ff88]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Layers className="w-4 h-4" />
          <span className="text-sm font-medium">LIVE UPDATE</span>
        </button>
      </div>
    </div>
  );
}
