import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface HUDProps {
  title: string;
  description: string;
}

export function HUD({ title, description }: HUDProps) {
  const { showHUD, toggleHUD } = useAppStore();

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 w-full sm:bottom-8 sm:right-8 sm:left-auto sm:w-80 max-h-[50vh] bg-[#111]/95 sm:bg-hud/95 backdrop-blur border-t border-accent/20 sm:border-t-0 sm:border-l-[3px] sm:border-accent rounded-t-3xl sm:rounded-lg shadow-[0_-10px_40px_rgba(0,0,0,0.5)] sm:shadow-2xl p-6 sm:p-5 font-mono z-50 overflow-y-auto",
        "transition-all duration-300 ease-out",
        !showHUD ? "translate-y-full sm:translate-y-4 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      )}
    >
      <div className="flex justify-between items-start mb-2 pb-2 border-b border-white/20">
        <h3 className="text-base font-bold text-accent uppercase">
          {title}
        </h3>
        <button onClick={toggleHUD} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs leading-relaxed text-gray-300 whitespace-pre-wrap">
        {description}
      </p>
    </div>
  );
}

interface ControlsPanelProps {
  children?: React.ReactNode;
}

export function ControlsPanel({ children }: ControlsPanelProps) {
  const { showControls, toggleControls, controlKeys, customParams, setCustomParam } = useAppStore();

  if (!showControls || controlKeys.length === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 w-full sm:top-20 sm:bottom-auto sm:right-5 sm:left-auto sm:w-64 bg-[#111]/95 sm:bg-hud/95 backdrop-blur border-t border-accent/20 sm:border-t-0 sm:border-r-[3px] sm:border-accent rounded-t-3xl sm:rounded-lg shadow-[0_-10px_40px_rgba(0,0,0,0.5)] sm:shadow-2xl p-6 sm:p-4 z-50 max-h-[50vh] overflow-y-auto",
      "transition-all duration-300 ease-out",
      !showControls ? "translate-y-full sm:translate-y-0 opacity-0 pointer-events-none sm:translate-x-full" : "translate-y-0 sm:translate-x-0 opacity-100"
    )}>
      <div className="flex justify-between items-start mb-4 pb-2 border-b border-gray-700">
        <h3 className="text-[10px] font-bold text-accent uppercase">
          Simulation Controls
        </h3>
        <button onClick={toggleControls} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-4">
        {controlKeys.map((key) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs text-accent">
              <span className="font-bold uppercase tracking-wider">{key}</span>
              <span className="text-white">{customParams[key]?.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={customParams[key] || 0}
              onChange={(e) => setCustomParam(key, Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

interface AnnotationLayerProps {
  annotations: Array<{ id: string; x: number; y: number; label: string; visible: boolean }>;
}

export function AnnotationLayer({ annotations }: AnnotationLayerProps) {
  const { showAnnotations } = useAppStore();

  return (
    <div 
      className={cn(
        "absolute inset-0 pointer-events-none z-30 transition-opacity",
        !showAnnotations && "opacity-0"
      )}
    >
      {annotations.map((anno) => (
        anno.visible && (
          <div
            key={anno.id}
            className="absolute flex items-center gap-2"
            style={{
              transform: `translate(${anno.x}px, ${anno.y}px) translate(-50%, -50%)`,
            }}
          >
            <div className="w-2 h-2 bg-accent rounded-full shadow-[0_0_10px_#00ff88]" />
            <div className="w-8 h-px bg-accent origin-left" />
            <div className="px-2 py-1 bg-black/80 border border-accent text-[10px] text-accent font-mono uppercase tracking-wider rounded">
              {anno.label}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
