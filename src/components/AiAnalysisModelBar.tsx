import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  ChevronDown,
  ShieldCheck,
  Check,
  Zap,
  SlidersHorizontal,
  Bot,
  Flame,
  Clock,
  Key
} from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';
import {
  GeminiModelOption,
  ModelCooldownStatus,
  getDetailedGeminiModels,
  getStoredModelPreference,
  setStoredModelPreference,
  getStoredAutoFallbackPreference,
  setStoredAutoFallbackPreference,
  hasCustomApiKey
} from '../lib/geminiFinancialService';

interface AiAnalysisModelBarProps {
  isDark: boolean;
  modelUsed?: string;
  fallbackOccurred?: boolean;
  analyzedAt?: string;
  isAnalyzing: boolean;
  onTriggerAnalysis: (selectedModelId?: string) => void;
  onOpenApiKeyModal?: () => void;
  className?: string;
}

export const AiAnalysisModelBar: React.FC<AiAnalysisModelBarProps> = ({
  isDark,
  modelUsed = 'Gemini 3.5 Flash',
  fallbackOccurred = false,
  analyzedAt,
  isAnalyzing,
  onTriggerAnalysis,
  onOpenApiKeyModal,
  className = ''
}) => {
  const [models, setModels] = useState<GeminiModelOption[]>([]);
  const [stickyHealthy, setStickyHealthy] = useState<string>('gemini-3.5-flash');
  const [cooldowns, setCooldowns] = useState<ModelCooldownStatus[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(getStoredModelPreference());
  const [autoFallback, setAutoFallback] = useState<boolean>(getStoredAutoFallbackPreference());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const customKeyActive = hasCustomApiKey();

  useEffect(() => {
    let isMounted = true;
    getDetailedGeminiModels().then((res) => {
      if (isMounted) {
        if (res.models.length > 0) setModels(res.models);
        if (res.stickyHealthyModel) setStickyHealthy(res.stickyHealthyModel);
        if (res.cooldowns) setCooldowns(res.cooldowns);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [isAnalyzing]);

  const handleSelectModel = (modelId: string) => {
    triggerHaptic('selection');
    setSelectedModel(modelId);
    setStoredModelPreference(modelId);
  };

  const handleToggleAutoFallback = () => {
    triggerHaptic('light');
    const next = !autoFallback;
    setAutoFallback(next);
    setStoredAutoFallbackPreference(next);
  };

  const handleRunAnalysis = () => {
    triggerHaptic('medium');
    setIsDropdownOpen(false);
    onTriggerAnalysis(selectedModel);
  };

  // Format time relative or concise
  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Baru saja';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Terkini';
    }
  };

  const activeModelObj = models.find((m) => m.id === selectedModel) || {
    id: selectedModel,
    displayName: selectedModel.replace(/^models\//, '').replace(/-/g, ' ').toUpperCase(),
    description: 'Model Gemini Flash'
  };

  return (
    <div
      className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
        isDark
          ? 'bg-gradient-to-r from-purple-950/30 via-slate-900/60 to-blue-950/30 border-purple-500/20 text-slate-200'
          : 'bg-gradient-to-r from-purple-50 via-white to-blue-50 border-purple-200 text-slate-800'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left info: Model badge & auto-sync info */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 font-bold text-xs shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>AI Copilot: {modelUsed || activeModelObj.displayName}</span>
          </div>

          {/* Sticky Healthy indicator */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold shrink-0" title="Model memori sehat aktif tanpa overhead latency">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sticky Sehat: {stickyHealthy.replace(/^gemini-/, '').replace(/-/g, ' ')}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate">
            <span>•</span>
            <span className="truncate">Auto-Generated Singkron Google Sheets</span>
            <span>•</span>
            <span className="text-slate-300 font-medium shrink-0">Pukul {formatTime(analyzedAt)}</span>
            {fallbackOccurred && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 text-[10px] font-bold border border-amber-500/25">
                Fallback Aktif
              </span>
            )}
            {cooldowns.length > 0 && (
              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 text-[10px] font-bold border border-rose-500/25" title={`${cooldowns.map(c => `${c.modelId}: ${c.remainingSec}s (${c.reason})`).join(', ')}`}>
                <Clock className="w-3 h-3 text-rose-400" />
                <span>{cooldowns.length} Cooldown</span>
              </span>
            )}
          </div>
        </div>

        {/* Right actions: Model selector dropdown trigger & Regenerate button */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* API Key (3-in-1) Button */}
          {onOpenApiKeyModal && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenApiKeyModal();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800 shadow-xs'
              }`}
              title="Kelola Google Gemini API Key: Import User (BYOK), Server Default & Vercel (3-in-1)"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline font-bold">API Key</span>
              <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                3-in-1
              </span>
              {customKeyActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Custom Key User Aktif" />
              )}
            </button>
          )}

          {/* Settings / Model selector toggle */}
          <div className="relative">
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
              }`}
              title="Pilih Model Gemini Flash & Pengaturan Fallback Otomatis"
            >
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span className="truncate max-w-[120px]">{activeModelObj.displayName}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div
                  className={`absolute right-0 top-full mt-2 w-72 sm:w-80 p-3 rounded-2xl border shadow-2xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 ${
                    isDark
                      ? 'bg-slate-900/95 border-purple-500/30 text-white'
                      : 'bg-white/95 border-purple-200 text-slate-900 shadow-purple-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-purple-400">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Pilih Versi Gemini Flash
                    </span>
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      100% Free Tier
                    </span>
                  </div>

                  {/* API Key quick button in dropdown */}
                  {onOpenApiKeyModal && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenApiKeyModal();
                      }}
                      className="w-full mb-2 p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-xs font-bold flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">Kelola API Key & Vercel (3-in-1)</span>
                      </div>
                      <span className="text-[10px] text-amber-400 underline font-semibold shrink-0">Buka &gt;</span>
                    </button>
                  )}

                  {/* Model List */}
                  <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar py-1">
                    {models.map((m) => {
                      const isSelected = m.id === selectedModel;
                      const isSticky = m.id === stickyHealthy;
                      const cdInfo = cooldowns.find((c) => c.modelId === m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleSelectModel(m.id)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-start justify-between gap-2 ${
                            isSelected
                              ? 'bg-purple-500/20 border-purple-500/40 text-purple-200'
                              : isDark
                              ? 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 text-slate-300'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white block">
                                {m.displayName}
                              </span>
                              {isSticky && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Sticky Sehat
                                </span>
                              )}
                              {cdInfo && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  Cooldown {cdInfo.remainingSec}s
                                </span>
                              )}
                              {m.isDefault && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  Default
                                </span>
                              )}
                              {m.isNewest && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Terbaru
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                              {m.description}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Auto Fallback Toggle */}
                  <div className="pt-2.5 mt-2 border-t border-white/10 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="text-left pr-2">
                        <span className="text-xs font-semibold block text-slate-200">
                          Auto-Fallback Cerdas & Sticky Pool
                        </span>
                        <span className="text-[10px] text-slate-400 block leading-tight">
                          Otomatis beralih ke Flash lain jika batas rate limit (429/503) tercapai dengan Smart Cooldown timer.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoFallback}
                        onChange={handleToggleAutoFallback}
                        className="rounded accent-purple-500 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <button
                      onClick={handleRunAnalysis}
                      disabled={isAnalyzing}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/20 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      <span>{isAnalyzing ? 'Menganalisis Real-Time...' : 'Terapkan & Analisis Ulang'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Regenerate Button */}
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-50 ${
              isDark
                ? 'bg-purple-600/30 hover:bg-purple-600/40 border-purple-500/40 text-purple-200'
                : 'bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-900 font-bold'
            }`}
            title="Analisis Ulang Finansial Bulan Ini dengan Gemini SSE Stream"
          >
            <RefreshCw className={`w-3 h-3 text-purple-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Menganalisis...' : 'Analisis Ulang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
