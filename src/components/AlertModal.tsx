import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useAlertStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

export function AlertModal() {
  const { isOpen, title, message, type, closeAlert } = useAlertStore();

  if (!isOpen) return null;

  const icons = {
    info: <Info className="w-6 h-6 text-blue-400" />,
    success: <CheckCircle className="w-6 h-6 text-[#00ff88]" />,
    error: <AlertCircle className="w-6 h-6 text-red-500" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
  };

  const borders = {
    info: 'border-blue-500/30',
    success: 'border-[#00ff88]/30',
    error: 'border-red-500/30',
    warning: 'border-yellow-500/30',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className={cn(
          "relative w-full max-w-sm bg-[#0a0a0a] rounded-xl border p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200",
          borders[type]
        )}
      >
        <button
          onClick={closeAlert}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4">
          <div className="shrink-0 mt-1">
            {icons[type]}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-white/70 whitespace-pre-wrap break-words">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={closeAlert}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
