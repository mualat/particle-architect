import { useState, useMemo } from 'react';
import { X, Copy, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExportStore, useAppStore } from '@/stores/appStore';
import { generateExport, downloadExport } from '@/lib/exportTemplates';
import { materialDefinitions } from '@/lib/materials';
import type { ExportSettings } from '@/types';

const platforms = [
  { id: 'vanilla', label: 'Vanilla JS', icon: 'JS' },
  { id: 'react', label: 'React', icon: '⚛' },
  { id: 'three', label: 'Three.js', icon: '△' },
] as const;

export function ExportModal() {
  const { isOpen, close, platform, setPlatform, optimization } = useExportStore();
  const { 
    renderStyle, 
    speed, 
    autoSpin, 
    customParams, 
    activeCustomCode,
    mode,
    customName,
  } = useAppStore();
  
  const [copied, setCopied] = useState(false);

  // Generate export settings
  const settings: ExportSettings = useMemo(() => ({
    count: 20000,
    speed,
    autoSpin,
    renderStyle,
    geoCode: materialDefinitions[renderStyle].geoCode,
    matCode: materialDefinitions[renderStyle].matCode,
    customParams,
  }), [speed, autoSpin, renderStyle, customParams]);

  // Generate code to export
  const exportCode = useMemo(() => {
    // Use active custom code or generate based on mode
    let code = '';
    
    if (mode === 'custom' && activeCustomCode) {
      code = activeCustomCode;
    } else {
      switch (mode) {
        case 'sphere':
          code = `const r = 30;
const phi = Math.acos(-1 + (2 * i) / count);
const theta = Math.sqrt(count * Math.PI) * phi;
target.set(r * Math.cos(theta) * Math.sin(phi), r * Math.sin(theta) * Math.sin(phi), r * Math.cos(phi));
color.setHex(0x00ff88);`;
          break;
        case 'cube':
          code = `const s = Math.ceil(Math.pow(count, 1/3));
const sep = 2.5; const off = (s * sep) / 2;
let z = Math.floor(i / (s*s));
let y = Math.floor((i % (s*s)) / s);
let x = i % s;
target.set(x * sep - off, y * sep - off, z * sep - off);
color.setHex(0x00aaff);`;
          break;
        case 'helix':
          code = `const r = 15;
const h = count * 0.003;
const off = h / 2;
const t = i * 0.05;
target.set(Math.cos(t) * r, (i * 0.003) - off, Math.sin(t) * r);
color.setHSL((i / count), 1, 0.5);`;
          break;
        case 'torus':
          code = `const R = 25; const r = 8;
const u = (i / count) * Math.PI * 2 * 40;
const v = (i / count) * Math.PI * 2;
target.set((R + r * Math.cos(u)) * Math.cos(v), (R + r * Math.cos(u)) * Math.sin(v), r * Math.sin(u));
color.setHex(0xff0055);`;
          break;
        default:
          code = `const t = time + i * 0.0001;
target.set(Math.cos(t * 3) * 30, Math.sin(t * 2) * 30, Math.sin(t * 5) * 30);
color.setHSL(i/count, 1, 0.5);`;
      }
    }
    
    return code;
  }, [activeCustomCode, mode]);

  const fullCode = useMemo(() => 
    generateExport(exportCode, settings, platform),
    [exportCode, settings, platform]
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = customName || mode || 'formation';
    downloadExport(exportCode, settings, platform, filename);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-[#111] border border-accent rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-accent">📦 Export Formation</h3>
            <p className="text-xs text-gray-400 mt-1">
              Export your particle swarm logic for production apps.
            </p>
          </div>
          <button
            onClick={close}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Platform Selection */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase mb-3">Export As</p>
            <div className="grid grid-cols-3 gap-3">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                    platform === p.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-gray-700 hover:border-gray-500"
                  )}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-xs font-medium">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optimization */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase mb-3">Optimization</p>
            <select
              className="w-full bg-[#222] border border-gray-700 rounded p-2 text-sm text-white"
              defaultValue={optimization}
            >
              <option value="max">Max Performance (No Checks)</option>
              <option value="safe">Safe Mode (Error Handling)</option>
            </select>
          </div>

          {/* Code Preview */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase mb-3">Preview</p>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 max-h-60 overflow-auto">
              <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                {fullCode}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-800">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 border border-gray-600 rounded-lg hover:border-white transition-colors text-sm"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 border border-accent text-accent rounded-lg hover:bg-accent/10 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Download Code
          </button>
          <button
            onClick={close}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
