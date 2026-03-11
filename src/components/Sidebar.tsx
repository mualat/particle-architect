import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Image as ImageIcon, Video, Box, FileImage,
  PenTool, Save, Cloud, Search, Copy, Trash2,
  ChevronLeft, ChevronRight, Sparkles, Zap, Palette,
  Hexagon, Square, Circle, Type, Grid3X3,
  Shapes, Database, Code2, Pencil, X, Menu, Loader2, Globe, Github
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, useAlertStore } from '@/stores/appStore';
import { fetchFormations, createFormation, checkFormationExists } from '@/lib/api';
import { validateUserCode } from '@/lib/validation';
import type { Formation, ShapeMode, RenderStyle, TextAnimation } from '@/types';

interface SidebarProps {
  currentMode: ShapeMode;
  onOpenDrawing: () => void;
  onShapeChange: (mode: ShapeMode, code?: string | null, name?: string | null) => void;
  onTextProcess: (text: string, fontSize: number, font: string, anim: TextAnimation) => void;
  onImageProcess: (image: HTMLImageElement) => void;
  onVideoProcess: (video: HTMLVideoElement) => void;
  onModelProcess: (file: File) => void;
  onBlueprintProcess: () => void;
  particleCount: number;
  onParticleCountChange: (count: number) => void;
}

const tabs = [
  { id: 'shapes', label: 'Shapes', icon: Shapes },
  { id: 'create', label: 'Create', icon: Pencil },
  { id: 'import', label: 'Import', icon: Upload },
  { id: 'library', label: 'Library', icon: Database },
] as const;

type TabId = typeof tabs[number]['id'];

const renderStyles: { id: RenderStyle; icon: React.ReactNode }[] = [
  { id: 'spark', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'plasma', icon: <Zap className="w-4 h-4" /> },
  { id: 'ink', icon: <Palette className="w-4 h-4" /> },
  { id: 'paint', icon: <Palette className="w-4 h-4" /> },
  { id: 'steel', icon: <Hexagon className="w-4 h-4" /> },
  { id: 'glass', icon: <Hexagon className="w-4 h-4" /> },
  { id: 'vector', icon: <Grid3X3 className="w-4 h-4" /> },
  { id: 'cyber', icon: <Box className="w-4 h-4" /> },
];

const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Impact'];
const textAnimations: { value: TextAnimation; label: string }[] = [
  { value: 'static', label: 'Static' },
  { value: 'scroll', label: 'Scroll' },
  { value: 'wave', label: 'Wave' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'rain', label: 'Matrix' },
];

export function Sidebar({
  currentMode,
  onOpenDrawing,
  onShapeChange,
  onTextProcess,
  onImageProcess,
  onVideoProcess,
  onModelProcess,
  onBlueprintProcess,
  particleCount,
  onParticleCountChange,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>('shapes');

  // No longer auto-switching tabs to allow user persistence

  const {
    renderStyle,
    setRenderStyle,
    speed,
    setSpeed,
    bloomStrength,
    setBloomStrength,
    sidebarCollapsed,
    toggleSidebar,
    customShapes,
    addCustomShape,
    deleteCustomShape,
    blueprintState,
    setBlueprintSource,
    setBlueprintThreshold,
    setBlueprintScale,
    setBlueprintFill,
    controlKeys,
  } = useAppStore();

  // Local state
  const [customName, setCustomName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [publisherName, setPublisherName] = useState('');
  const [textInput, setTextInput] = useState('PHYSICS');
  const [textSize, setTextSize] = useState(150);
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [textAnim, setTextAnim] = useState<TextAnimation>('static');
  const [communityFormations, setCommunityFormations] = useState<Formation[]>([]);
  const [communitySearch, setCommunitySearch] = useState('');
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);
  const [communityOffset, setCommunityOffset] = useState(0);
  const [communityHasMore, setCommunityHasMore] = useState(true);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showTurnstileModal, setShowTurnstileModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const imgInputRef = useRef<HTMLInputElement>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const blueprintInputRef = useRef<HTMLInputElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);

  // Turnstile site key from env
  const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

  // Initialize Turnstile widget
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !showTurnstileModal || !turnstileRef.current) return;

    let isMounted = true;
    let widgetId: any;
    let checkInterval: any;

    // Load Turnstile script if not already loaded
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    // Render Turnstile widget when script is ready
    const renderWidget = () => {
      if (!isMounted) return;
      if (window.turnstile && turnstileRef.current) {
        try {
          turnstileRef.current.innerHTML = '';
          widgetId = window.turnstile.render(turnstileRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            callback: (token: string) => setTurnstileToken(token),
            'expired-callback': () => setTurnstileToken(null),
            theme: 'dark',
          });
        } catch (e) {
          console.error("Turnstile render error", e);
        }
      }
    };

    // Try to render immediately or wait for script load
    if (window.turnstile) {
      renderWidget();
    } else {
      checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          renderWidget();
        }
      }, 100);
      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);
    }

    return () => {
      isMounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      if (widgetId !== undefined && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch (e) {
          console.error("Turnstile cleanup error", e);
        }
      }
    };
  }, [TURNSTILE_SITE_KEY, showTurnstileModal]);

  // Auto layout handling for community ... (kept loadCommunity)

  const loadCommunity = useCallback(async (reset = false) => {
    setIsLoadingCommunity(true);
    let offsetToUse = 0;
    setCommunityOffset(prev => {
      offsetToUse = reset ? 0 : prev;
      return prev;
    });

    try {
      const limit = 20;
      const formations = await fetchFormations(communitySearch, offsetToUse, limit);

      if (reset) {
        setCommunityFormations(formations);
      } else {
        setCommunityFormations(prev => {
          const newItems = formations.filter(f => !prev.some(p => p.id === f.id));
          return [...prev, ...newItems];
        });
      }

      setCommunityHasMore(formations.length === limit);
      setCommunityOffset(offsetToUse + limit);
    } catch (e) {
      console.error('Failed to load community formations:', e);
    } finally {
      setIsLoadingCommunity(false);
    }
  }, [communitySearch]);

  // Debounce search and auto-load on tab open
  useEffect(() => {
    if (activeTab === 'library') {
      const timer = setTimeout(() => {
        loadCommunity(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [communitySearch, activeTab, loadCommunity]);

  const handleShapeClick = (shape: ShapeMode, code?: string, name?: string) => {
    onShapeChange(shape, code, name);
  };

  const handleSaveCustom = () => {
    if (!customName.trim() || !customCode.trim()) return;

    const validation = validateUserCode(customCode);
    if (!validation.ok) {
      useAlertStore.getState().openAlert('Validation Error', validation.reason || 'Invalid Code', 'warning');
      return;
    }

    addCustomShape(customName.toUpperCase(), customCode);
    setCustomName('');
    setCustomCode('');
  };

  const handlePublish = async () => {
    if (!customName.trim() || !customCode.trim() || !publisherName.trim()) {
      useAlertStore.getState().openAlert('Missing Fields', 'Name, code, and publisher are required', 'warning');
      return;
    }

    const nameRegex = /^[A-Z0-9_]+$/;
    if (!nameRegex.test(customName.trim().toUpperCase())) {
      useAlertStore.getState().openAlert('Validation Error', 'Name must be alphanumeric with underscores only', 'warning');
      return;
    }

    const validation = validateUserCode(customCode);
    if (!validation.ok) {
      useAlertStore.getState().openAlert('Validation Error', validation.reason || 'Invalid code', 'warning');
      return;
    }

    // Check Turnstile token if configured
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setShowTurnstileModal(true);
      return;
    }

    await performPublish();
  };

  const performPublish = async () => {
    const name = customName.toUpperCase();
    setIsPublishing(true);

    try {
      const exists = await checkFormationExists(name);
      if (exists) {
        useAlertStore.getState().openAlert('Name Taken', `The name "${name}" already exists. Choose a unique name.`, 'warning');
        setShowTurnstileModal(false);
        setTurnstileToken(null);
        if (window.turnstile && turnstileRef.current) {
          window.turnstile.reset(turnstileRef.current);
        }
        setIsPublishing(false);
        return;
      }

      await createFormation(name, customCode, publisherName, turnstileToken);
      setPublishError(null);
      setCustomName('');
      setCustomCode('');
      setTurnstileToken(null);
      setShowTurnstileModal(false);
      // Reset Turnstile widget
      if (window.turnstile && turnstileRef.current) {
        window.turnstile.reset(turnstileRef.current);
      }
      loadCommunity(true);
      useAlertStore.getState().openAlert('Publish Success', 'Successfully published!', 'success');
    } catch (e) {
      useAlertStore.getState().openAlert('Publish Failed', (e as Error).message, 'error');
      setTurnstileToken(null);
      if (window.turnstile && turnstileRef.current) {
        window.turnstile.reset(turnstileRef.current);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => onImageProcess(img);
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.loop = true;
    video.volume = 0.5;
    video.onloadedmetadata = () => {
      onVideoProcess(video);
      video.play().catch(() => { });
    };
  };

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onModelProcess(file);
  };

  const handleBlueprintUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        setBlueprintSource(img);
        onBlueprintProcess();
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleTextProcess = () => {
    onTextProcess(textInput, textSize, selectedFont, textAnim);
  };

  // filteredCommunity is now just communityFormations since search is server-side
  const filteredCommunity = communityFormations;

  return (
    <>
      {/* Turnstile Modal */}
      {showTurnstileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 relative max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => {
                setShowTurnstileModal(false);
                if (window.turnstile && turnstileRef.current) {
                  window.turnstile.reset(turnstileRef.current);
                }
              }}
              className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Security Check</h3>
            <p className="text-sm text-white/60 mb-6">
              Please complete the CAPTCHA to publish your formation.
            </p>

            <div className="flex justify-center min-h-[65px] mb-6">
              <div ref={turnstileRef} />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowTurnstileModal(false);
                  if (window.turnstile && turnstileRef.current) {
                    window.turnstile.reset(turnstileRef.current);
                  }
                }}
                className="px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={performPublish}
                disabled={!turnstileToken || isPublishing}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
                  turnstileToken
                    ? "bg-[#00ff88]/20 text-[#00ff88] hover:bg-[#00ff88]/30"
                    : "bg-white/5 text-white/30 cursor-not-allowed",
                  isPublishing && "opacity-70 cursor-wait"
                )}
              >
                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                {isPublishing ? 'Publishing...' : 'Confirm Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile Top Bar - Only visible when sidebar is collapsed */}
      {sidebarCollapsed && (
        <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-[#0a0a0a]/90 backdrop-blur border-b border-white/[0.06] lg:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00ff88]" />
            <h1 className="text-sm font-semibold text-white/90 tracking-wide">Particle Architect</h1>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
            type="button"
          >
            <Menu className="w-4 h-4 text-white/60" />
          </button>
        </header>
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 bottom-0 flex flex-col",
        "bg-[#0a0a0a] border-r border-white/[0.06]",
        "w-[85vw] max-w-[320px] lg:w-80",
        "transition-transform duration-300 ease-out",
        sidebarCollapsed ? "-translate-x-full z-40" : "z-[70] lg:z-40"
      )}>
        {/* Top Header - Name + Hamburger */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0a0a0a] shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00ff88]" />
            <h1 className="text-sm font-semibold text-white/90 tracking-wide">Particle Architect</h1>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-white/[0.06] rounded-lg transition-colors lg:hidden"
            type="button"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
          <button
            onClick={toggleSidebar}
            className="hidden lg:block p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
            type="button"
          >
            <Menu className="w-4 h-4 text-white/60" />
          </button>
        </header>

        {/* Mode Bar */}
        <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Current Mode</span>
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider",
            currentMode === 'custom' && "bg-[#00ff88]/20 text-[#00ff88]",
            currentMode === 'draw' && "bg-[#ff0066]/20 text-[#ff6699]",
            currentMode === 'text' && "bg-blue-500/20 text-blue-400",
            currentMode === 'image' && "bg-purple-500/20 text-purple-400",
            currentMode === 'video' && "bg-orange-500/20 text-orange-400",
            currentMode === 'blueprint' && "bg-cyan-500/20 text-cyan-400",
            ['sphere', 'cube', 'helix', 'torus'].includes(currentMode) && "bg-white/10 text-white/70",
            currentMode === 'model' && "bg-yellow-500/20 text-yellow-400"
          )}>
            {currentMode}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.06] bg-[#0a0a0a] shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] transition-colors relative min-h-[60px]",
                activeTab === tab.id
                  ? "text-[#00ff88] bg-white/[0.03]"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]"
              )}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#00ff88] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {/* SHAPES TAB */}
          {activeTab === 'shapes' && (
            <div className="space-y-6">
              {/* Custom Controls Notification */}
              {controlKeys.length > 0 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <p className="text-xs text-blue-400">
                      <strong>{controlKeys.length} Custom Control{controlKeys.length > 1 ? 's' : ''} Active</strong>
                    </p>
                  </div>
                  <p className="text-[10px] text-white/60 mt-1">
                    Open Settings → Controls tab to adjust parameters
                  </p>
                </div>
              )}

              {/* Basic Shapes */}
              <section>
                <h3 className="text-xs font-semibold tracking-wide text-white/60 uppercase mb-3">
                  Basic Forms
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sphere', label: 'Sphere', icon: Circle },
                    { id: 'cube', label: 'Cube', icon: Square },
                    { id: 'helix', label: 'Helix', icon: Hexagon },
                    { id: 'torus', label: 'Torus', icon: Circle },
                  ].map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => handleShapeClick(shape.id as ShapeMode)}
                      type="button"
                      className="flex items-center gap-2 px-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.1] rounded-lg transition-colors text-sm text-white/90"
                    >
                      <shape.icon className="w-4 h-4 text-[#00ff88]" />
                      {shape.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Visual Style */}
              <section>
                <h3 className="text-xs font-semibold tracking-wide text-white/60 uppercase mb-3">
                  Visual Style
                </h3>
                <div className="grid grid-cols-4 gap-1.5">
                  {renderStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setRenderStyle(style.id)}
                      type="button"
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                        renderStyle === style.id
                          ? "bg-[#00ff88]/10 text-[#00ff88]"
                          : "bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                      )}
                    >
                      {style.icon}
                      <span className="text-[10px] uppercase">{style.id}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Core Settings */}
              <section>
                <h3 className="text-xs font-semibold tracking-wide text-white/60 uppercase mb-3">
                  Core Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70">Particles</span>
                      <span className="text-[#00ff88] tabular-nums">{particleCount.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="5000"
                      max="50000"
                      step="5000"
                      value={particleCount}
                      onChange={(e) => onParticleCountChange(Number(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#00ff88' }}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70">Speed</span>
                      <span className="text-[#00ff88] tabular-nums">{speed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="2"
                      step="0.1"
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#00ff88' }}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70">Glow</span>
                      <span className="text-[#00ff88] tabular-nums">{bloomStrength.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={bloomStrength}
                      onChange={(e) => setBloomStrength(Number(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#00ff88' }}
                    />
                  </div>
                </div>
              </section>

              {/* Drawing */}
              <section>
                <h3 className="text-xs font-semibold tracking-wide text-white/60 uppercase mb-3">
                  Manual Draw
                </h3>
                <button
                  onClick={onOpenDrawing}
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#ff0066]/10 hover:bg-[#ff0066]/15 active:bg-[#ff0066]/20 text-[#ff6699] rounded-lg transition-colors text-sm"
                >
                  <Pencil className="w-4 h-4" />
                  Open Drawing Pad
                </button>
              </section>

              {/* Footer */}
              <div className="pt-4 text-center mt-auto shrink-0">
                <p className="text-[10px] text-white/30 mb-1.5">Made with ❤️ by Mualat</p>
                <div className="flex items-center justify-center gap-3">
                  <a
                    href="https://mualat.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Website"
                    className="p-1.5 rounded-md text-[#00ff88]/60 hover:text-[#00ff88] hover:bg-white/[0.05] transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://github.com/mualat/particle-architect"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="p-1.5 rounded-md text-[#60a5fa]/60 hover:text-[#60a5fa] hover:bg-white/[0.05] transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* CREATE TAB */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              {/* Mode-specific banner */}
              {currentMode === 'custom' && (
                <div className="p-3 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-lg">
                  <p className="text-xs text-[#00ff88]">
                    <strong>Custom Code Active</strong>
                  </p>
                  <p className="text-[10px] text-white/60 mt-1">
                    Use addControl() in your code to create dynamic sliders below. Check Settings → Controls to see them.
                  </p>
                </div>
              )}
              {currentMode === 'draw' && (
                <div className="p-3 bg-[#ff0066]/10 border border-[#ff0066]/20 rounded-lg">
                  <p className="text-xs text-[#ff6699]">
                    <strong>Drawing Mode Active</strong>
                  </p>
                  <p className="text-[10px] text-white/60 mt-1">
                    Your drawing has been converted to particles. Use the Drawing Pad to create new shapes.
                  </p>
                </div>
              )}

              {/* Text Engine */}
              <section>
                <h3 className="text-xs font-semibold tracking-wide text-white/60 uppercase mb-3">
                  Text Engine
                </h3>
                <div className="space-y-3">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type text..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/30 focus:border-[#00ff88]/50 focus:outline-none resize-y min-h-[60px]"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedFont}
                      onChange={(e) => setSelectedFont(e.target.value)}
                      className="bg-white/[0.03] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#00ff88]/50 focus:outline-none"
                    >
                      {fonts.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select
                      value={textAnim}
                      onChange={(e) => setTextAnim(e.target.value as TextAnimation)}
                      className="bg-white/[0.03] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#00ff88]/50 focus:outline-none"
                    >
                      {textAnimations.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70">Size</span>
                      <span className="text-[#00ff88] tabular-nums">{textSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="400"
                      step="10"
                      value={textSize}
                      onChange={(e) => setTextSize(Number(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#00ff88' }}
                    />
                  </div>

                  <button
                    onClick={handleTextProcess}
                    type="button"
                    className="w-full py-2.5 bg-[#00ff88]/10 hover:bg-[#00ff88]/15 active:bg-[#00ff88]/20 text-[#00ff88] rounded-lg text-sm font-medium transition-colors"
                  >
                    Visualize Text
                  </button>
                </div>
              </section>

              {/* Code Editor */}
              <section>
                <h3 className="text-xs font-semibold tracking-wide text-white/60 uppercase mb-3">
                  Code Editor
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="SHAPE NAME"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg p-2.5 text-xs text-white uppercase font-mono placeholder-white/30 focus:border-[#00ff88]/50 focus:outline-none"
                  />

                  <textarea
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    placeholder="// Paste AI code here..."
                    className="w-full h-24 bg-white/[0.03] border border-white/10 rounded-lg p-2.5 text-xs text-[#4ade80] font-mono resize-none focus:border-[#00ff88]/50 focus:outline-none placeholder-white/30"
                  />

                  <input
                    type="text"
                    value={publisherName}
                    onChange={(e) => setPublisherName(e.target.value)}
                    placeholder="YOUR NAME (to publish)"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-white/30 focus:border-[#00ff88]/50 focus:outline-none"
                  />

                  {publishError && (
                    <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded">{publishError}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleSaveCustom}
                      type="button"
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.1] rounded-lg text-xs text-white/80 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Local
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={!publisherName.trim()}
                      type="button"
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs transition-colors",
                        publisherName.trim()
                          ? "bg-[#3b82f6]/10 hover:bg-[#3b82f6]/15 active:bg-[#3b82f6]/20 text-[#60a5fa]"
                          : "bg-white/[0.03] text-white/30 cursor-not-allowed"
                      )}
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      Publish
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* IMPORT TAB */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              {/* Media */}
              <section>
                <h3 className="text-xs font-semibold tracking-wide text-white/60 uppercase mb-3">
                  Media
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => imgInputRef.current?.click()}
                    type="button"
                    className="w-full flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.1] rounded-lg transition-colors text-left"
                  >
                    <ImageIcon className="w-5 h-5 text-[#00ff88]" />
                    <div>
                      <p className="text-sm text-white/90">Image</p>
                      <p className="text-[10px] text-white/40">JPG, PNG, WebP</p>
                    </div>
                    <input ref={imgInputRef} type="file" accept="image/*" onChange={handleImageUpload} onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} className="hidden" />
                  </button>

                  <button
                    onClick={() => vidInputRef.current?.click()}
                    type="button"
                    className="w-full flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.1] rounded-lg transition-colors text-left"
                  >
                    <Video className="w-5 h-5 text-[#a855f7]" />
                    <div>
                      <p className="text-sm text-white/90">Video</p>
                      <p className="text-[10px] text-white/40">MP4, WebM</p>
                    </div>
                    <input ref={vidInputRef} type="file" accept="video/*" onChange={handleVideoUpload} onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} className="hidden" />
                  </button>

                  <button
                    onClick={() => modelInputRef.current?.click()}
                    type="button"
                    className="w-full flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.1] rounded-lg transition-colors text-left"
                  >
                    <Box className="w-5 h-5 text-[#f97316]" />
                    <div>
                      <p className="text-sm text-white/90">3D Model</p>
                      <p className="text-[10px] text-white/40">GLB, OBJ, PDB</p>
                    </div>
                    <input ref={modelInputRef} type="file" accept=".glb,.gltf,.obj" onChange={handleModelUpload} className="hidden" onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} />
                  </button>
                </div>
              </section>

              {/* Blueprint */}
              <section>
                <h3 className="text-xs font-semibold tracking-wide text-white/60 uppercase mb-3">
                  Blueprint
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => blueprintInputRef.current?.click()}
                    type="button"
                    className="w-full flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.1] rounded-lg transition-colors text-left"
                  >
                    <FileImage className="w-5 h-5 text-[#06b6d4]" />
                    <div>
                      <p className="text-sm text-white/90">Upload Blueprint</p>
                      <p className="text-[10px] text-white/40">Technical drawings, CAD</p>
                    </div>
                    <input ref={blueprintInputRef} type="file" accept="image/*" onChange={handleBlueprintUpload} onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} className="hidden" />
                  </button>

                  {blueprintState.source && (
                    <div className="space-y-3 p-3 bg-white/[0.02] rounded-lg">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/60">Threshold</span>
                          <span className="text-[#00ff88] tabular-nums">{blueprintState.threshold}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="255"
                          value={blueprintState.threshold}
                          onChange={(e) => {
                            setBlueprintThreshold(Number(e.target.value));
                            onBlueprintProcess();
                          }}
                          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                          style={{ accentColor: '#00ff88' }}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/60">Scale</span>
                          <span className="text-[#00ff88] tabular-nums">{blueprintState.scale.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="3"
                          step="0.1"
                          value={blueprintState.scale}
                          onChange={(e) => {
                            setBlueprintScale(Number(e.target.value));
                            onBlueprintProcess();
                          }}
                          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                          style={{ accentColor: '#00ff88' }}
                        />
                      </div>

                      <label className="flex items-center justify-between">
                        <span className="text-xs text-white/60">Fill Geometry</span>
                        <input
                          type="checkbox"
                          checked={blueprintState.fill}
                          onChange={(e) => {
                            setBlueprintFill(e.target.checked);
                            onBlueprintProcess();
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-white/[0.03] text-[#00ff88] focus:ring-[#00ff88]/50"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* LIBRARY TAB */}
          {activeTab === 'library' && (
            <div className="flex flex-col flex-1 gap-6">
              {/* Local */}
              {Object.entries(customShapes).length > 0 && (
                <section className="shrink-0">
                  <h3 className="text-xs font-semibold tracking-wide text-white/60 uppercase mb-3">
                    My Formations ({Object.entries(customShapes).length})
                  </h3>
                  <div className="space-y-1.5">
                    {Object.entries(customShapes).map(([name, code]) => (
                      <div key={name} className="flex gap-1">
                        <button
                          onClick={() => handleShapeClick('custom', code, name)}
                          type="button"
                          className="flex-1 flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.1] rounded-lg text-left transition-colors"
                        >
                          <Code2 className="w-3.5 h-3.5 text-[#00ff88]" />
                          <span className="text-xs text-white/80 font-mono">{name}</span>
                        </button>
                        <button
                          onClick={() => {
                            setCustomName(name);
                            setCustomCode(code);
                            setActiveTab('create');
                          }}
                          type="button"
                          className="p-2 bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.1] rounded-lg transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5 text-white/60" />
                        </button>
                        <button
                          onClick={() => deleteCustomShape(name)}
                          type="button"
                          className="p-2 bg-white/[0.03] hover:bg-red-500/10 active:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white/60 hover:text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Community */}
              <section className="flex flex-col flex-1 min-h-0">
                <h3 className="text-xs font-semibold tracking-wide text-white/60 uppercase mb-3 shrink-0">
                  Community Cloud
                </h3>
                <div className="flex flex-col flex-1 min-h-0 gap-3">
                  <div className="relative shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      value={communitySearch}
                      onChange={(e) => setCommunitySearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#00ff88]/50 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => loadCommunity(true)}
                    disabled={isLoadingCommunity}
                    type="button"
                    className="w-full py-2.5 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/15 active:bg-[#3b82f6]/20 disabled:opacity-50 text-[#60a5fa] rounded-lg text-xs transition-colors shrink-0"
                  >
                    {isLoadingCommunity ? 'Loading...' : 'Refresh Cloud Shapes'}
                  </button>

                  {filteredCommunity.length > 0 && (
                    <div className="space-y-1.5 flex-1 min-h-[200px] overflow-y-auto pr-1">
                      {filteredCommunity.map((formation) => (
                        <div key={formation.id} className="flex gap-1">
                          <button
                            onClick={() => handleShapeClick('custom', formation.code, formation.name)}
                            type="button"
                            className="flex-1 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.1] border-l-2 border-l-[#3b82f6] rounded-lg text-left transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Cloud className="w-3.5 h-3.5 text-[#60a5fa]" />
                              <span className="text-xs text-white/80">{formation.name}</span>
                            </div>
                            {formation.publisher && (
                              <p className="text-[10px] text-white/40 mt-0.5">by {formation.publisher}</p>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setCustomName(formation.name);
                              setCustomCode(formation.code);
                              setActiveTab('create');
                            }}
                            type="button"
                            className="p-2 bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.1] rounded-lg transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5 text-white/60" />
                          </button>
                        </div>
                      ))}
                      {communityHasMore && (
                        <button
                          onClick={() => loadCommunity(false)}
                          disabled={isLoadingCommunity}
                          type="button"
                          className="w-full py-2 bg-white/5 hover:bg-white/10 active:bg-white/15 disabled:opacity-50 text-white/70 rounded-lg text-xs transition-colors mt-2"
                        >
                          {isLoadingCommunity ? 'Loading...' : 'Load More'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </aside>

      {/* Desktop Toggle - Only visible on desktop when sidebar is collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          type="button"
          className="hidden lg:block fixed top-4 left-4 z-50 p-2.5 bg-[#0a0a0a]/90 backdrop-blur border border-white/[0.08] rounded-lg shadow-lg shadow-black/20 hover:border-[#00ff88]/30 transition-all"
        >
          <Menu className="w-4 h-4 text-[#00ff88]" />
        </button>
      )}
    </>
  );
}
