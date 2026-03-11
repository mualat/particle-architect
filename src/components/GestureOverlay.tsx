import { useRef, useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { useCameraCheck } from '@/hooks/useCameraCheck';
import { AlertCircle, Camera, Hand, Info } from 'lucide-react';

interface GestureOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function GestureOverlay({ videoRef, canvasRef }: GestureOverlayProps) {
  const { handControlEnabled, speed } = useAppStore();
  const { hasCamera, error: cameraError, isChecking } = useCameraCheck();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }, [canvasRef]);

  // Show error when trying to enable without camera
  useEffect(() => {
    if (handControlEnabled && !hasCamera && !isChecking) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [handControlEnabled, hasCamera, isChecking]);

  // Auto-disable if camera becomes unavailable
  useEffect(() => {
    if (!hasCamera && !isChecking && handControlEnabled) {
      useAppStore.getState().toggleHandControl();
    }
  }, [hasCamera, isChecking, handControlEnabled]);

  return (
    <>
      {/* Hidden video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />

      {/* Gesture canvas overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[998] pointer-events-none transition-opacity",
          !handControlEnabled && "opacity-0"
        )}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full transform -scale-x-100"
          style={{ opacity: 0.6 }}
        />
      </div>

      {/* Status indicator - only show when enabled and camera is working */}
      {handControlEnabled && hasCamera && (
        <div
          className={cn(
            "fixed bottom-8 left-1/2 -translate-x-1/2 z-[999] px-6 py-3",
            "bg-black/80 border-2 border-accent text-accent",
            "rounded-full font-bold uppercase tracking-wider text-sm",
            "shadow-[0_0_20px_#00ff88] transition-all animate-pulse"
          )}
        >
          GESTURE OS ACTIVE | SPD: {speed.toFixed(1)}
        </div>
      )}

      {/* Camera Error Toast */}
      {showError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] px-6 py-4 bg-red-500/90 text-white rounded-lg shadow-lg max-w-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Camera Error</p>
              <p className="text-xs text-white/90 mt-1">{cameraError || 'Camera not available'}</p>
              <p className="text-xs text-white/70 mt-2">Neural Navigation has been disabled.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function GestureGuide({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-black/90 border border-accent rounded-xl p-6 shadow-[0_0_50px_rgba(0,255,136,0.2)]">
        <h3 className="text-accent font-bold text-lg text-center mb-6 flex items-center justify-center gap-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-accent">
            <path d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.86 4.63l-1.91-.36a5.52 5.52 0 0 0-1.28-.15c-.6 0-1.18.13-1.72.35l-.17.07.17-.07c-.47-.2-.96-.31-1.45-.31-.96 0-1.87.38-2.54 1.06L6 12.56c-.36-.36-.86-.56-1.37-.56-.51 0-1.02.2-1.38.56a1.95 1.95 0 0 0 0 2.76l4.24 4.24c.73.73 1.7 1.13 2.73 1.13h7.24c1.1 0 2-.9 2-2v-1.31c0-.58-.25 1.13-.68 1.52z" />
          </svg>
          NEURAL NAVIGATION
        </h3>

        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white/80">
                <path d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74z" />
              </svg>
            </div>
            <div>
              <strong className="text-white block">SIMPLIFIED ROTATION</strong>
              <span>One Finger: Look Around</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white/80">
                <path d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.86 4.63l-1.91-.36a5.52 5.52 0 0 0-1.28-.15c-.6 0-1.18.13-1.72.35l-.17.07.17-.07c-.47-.2-.96-.31-1.45-.31-.96 0-1.87.38-2.54 1.06L6 12.56c-.36-.36-.86-.56-1.37-.56-.51 0-1.02.2-1.38.56a1.95 1.95 0 0 0 0 2.76l4.24 4.24c.73.73 1.7 1.13 2.73 1.13h7.24c1.1 0 2-.9 2-2v-1.31c0-.58-.25 1.13-.68 1.52z" />
              </svg>
            </div>
            <div>
              <strong className="text-white block">OPEN PALM: ZOOM</strong>
              <span>Swipe Left/Right: Zoom In/Out</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white/80">
                <path d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.86 4.63l-1.91-.36a5.52 5.52 0 0 0-1.28-.15c-.6 0-1.18.13-1.72.35l-.17.07.17-.07c-.47-.2-.96-.31-1.45-.31-.96 0-1.87.38-2.54 1.06L6 12.56c-.36-.36-.86-.56-1.37-.56-.51 0-1.02.2-1.38.56a1.95 1.95 0 0 0 0 2.76l4.24 4.24c.73.73 1.7 1.13 2.73 1.13h7.24c1.1 0 2-.9 2-2v-1.31c0-.58-.25 1.13-.68 1.52z" />
              </svg>
            </div>
            <div>
              <strong className="text-white block">PEACE SIGN: SPEED</strong>
              <span>Swipe Left/Right: Change Speed</span>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-accent/10 border border-accent/30 rounded-lg">
          <p className="text-xs text-accent/80">
            <Info className="w-4 h-4 inline mr-1" />
            Make sure your camera is enabled and not in use by another application.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-accent text-black font-bold rounded-lg hover:bg-accent/90 transition-colors"
        >
          GOT IT
        </button>
      </div>
    </div>
  );
}
