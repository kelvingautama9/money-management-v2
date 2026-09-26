import React from 'react';
import { GlassSettings, ThemeMode } from '../types';
import { Sparkles, Sliders, X, RotateCcw, Eye, ShieldCheck, Sun, Moon, Palette, MoonStar, Key, ExternalLink } from 'lucide-react';
import { GlassButton } from './GlassButton';

interface GlassSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlassSettings;
  onUpdateSettings: (newSettings: GlassSettings) => void;
  onOpenApiKeyModal?: () => void;
}

export const GlassSettingsModal: React.FC<GlassSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenApiKeyModal
}) => {
  if (!isOpen) return null;

  const currentTheme = settings.themeMode || 'dark';

  const handleSelectTheme = (mode: ThemeMode) => {
    onUpdateSettings({
      ...settings,
      themeMode: mode
    });
  };

  const handlePresetSelect = (preset: GlassSettings['activePreset']) => {
    switch (preset) {
      case 'ios26':
        onUpdateSettings({
          ...settings,
          blur: 24,
          translucency: 65,
          darkTint: 45,
          specularIntensity: 85,
          tilt3d: true,
          activePreset: 'ios26'
        });
        break;
      case 'frosted':
        onUpdateSettings({
          ...settings,
          blur: 36,
          translucency: 50,
          darkTint: 30,
          specularIntensity: 70,
          tilt3d: true,
          activePreset: 'frosted'
        });
        break;
      case 'deepDark':
        onUpdateSettings({
          ...settings,
          blur: 20,
          translucency: 80,
          darkTint: 75,
          specularIntensity: 90,
          tilt3d: true,
          activePreset: 'deepDark'
        });
        break;
      case 'crystal':
        onUpdateSettings({
          ...settings,
          blur: 14,
          translucency: 35,
          darkTint: 20,
          specularIntensity: 100,
          tilt3d: true,
          activePreset: 'crystal'
        });
        break;
    }
  };

  const themes: { id: ThemeMode; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'dark',
      label: 'Dark Glass',
      desc: 'Obsidian Neon',
      icon: <Moon className="w-4 h-4 text-sky-400" />,
      color: 'from-slate-900 to-[#060713]'
    },
    {
      id: 'light',
      label: 'Light Apple',
      desc: 'Clean Minimal',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      color: 'from-white to-slate-100'
    },
    {
      id: 'beige',
      label: 'Warm Beige',
      desc: 'Editorial Paper',
      icon: <Palette className="w-4 h-4 text-amber-700" />,
      color: 'from-[#fefcf8] to-[#f5f2eb]'
    },
    {
      id: 'midnight',
      label: 'Midnight OLED',
      desc: 'Pure Deep Black',
      icon: <MoonStar className="w-4 h-4 text-purple-400" />,
      color: 'from-black to-slate-950'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        style={{
          background: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.95)' : currentTheme === 'beige' ? 'rgba(255, 253, 248, 0.95)' : 'rgba(20, 24, 45, 0.92)',
          backdropFilter: 'blur(30px) saturate(190%)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.7), inset 0 1.5px 1px rgba(255,255,255,0.4)'
        }}
        className="relative w-full max-w-lg rounded-3xl border border-white/20 p-5 sm:p-6 text-slate-100 overflow-hidden max-h-[90vh] flex flex-col no-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-white/20 shadow-inner">
              <Sliders className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                iOS 26 Liquid Glass & Tema
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Ultra Responsive
                </span>
              </h3>
              <p className="text-xs text-slate-400">Pilih tema warna visual dan atur properti kaca secara real-time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto no-scrollbar py-4 space-y-5 flex-1">
          {/* 3-IN-1 GEMINI API KEY & VERCEL QUICK ACCESS */}
          {onOpenApiKeyModal && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 flex items-center justify-between gap-3 shadow-lg shadow-blue-950/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4 text-blue-300" />
                </div>
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white block">Google Gemini API Key</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      3-in-1
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300 block truncate">
                    Input manual user (BYOK), server default & siap deploy Vercel
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenApiKeyModal();
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition active:scale-95 shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Kelola Key
              </button>
            </div>
          )}

          {/* THEME MODE SELECTOR */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                Pilihan Tema Tampilan (Baru)
              </label>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                4 Tema Tersedia
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {themes.map((th) => {
                const isSelected = currentTheme === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => handleSelectTheme(th.id)}
                    className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-400 bg-blue-600/25 ring-2 ring-blue-500/40 shadow-lg'
                        : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center">
                        {th.icon}
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#38bdf8]" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block leading-tight">
                        {th.label}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {th.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Presets */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2">Preset Material Kaca</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'ios26', name: 'iOS 26 Liquid' },
                { id: 'frosted', name: 'Frosted Glass' },
                { id: 'deepDark', name: 'Deep Midnight' },
                { id: 'crystal', name: 'Crystal Sheen' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all text-center ${
                    settings.activePreset === p.id
                      ? 'bg-blue-500/30 border-blue-400/60 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            {/* Specular Rim */}
            <div className="space-y-1.5 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
              <div className="flex justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Specular Rim & Glare Intensity
                </span>
                <span className="font-mono text-blue-300">{settings.specularIntensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.specularIntensity}
                onChange={(e) => onUpdateSettings({ ...settings, specularIntensity: Number(e.target.value) })}
                className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Blur */}
            <div className="space-y-1.5 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
              <div className="flex justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Eye className="w-3.5 h-3.5 text-sky-300" />
                  Backdrop Blur (Frosted Diffusion)
                </span>
                <span className="font-mono text-blue-300">{settings.blur}px</span>
              </div>
              <input
                type="range"
                min="8"
                max="48"
                value={settings.blur}
                onChange={(e) => onUpdateSettings({ ...settings, blur: Number(e.target.value) })}
                className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Translucency */}
            <div className="space-y-1.5 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
              <div className="flex justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Glass Translucency & Opacity
                </span>
                <span className="font-mono text-blue-300">{settings.translucency}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                value={settings.translucency}
                onChange={(e) => onUpdateSettings({ ...settings, translucency: Number(e.target.value) })}
                className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Dark Tint */}
            <div className="space-y-1.5 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-200">Dark Tint Density</span>
                <span className="font-mono text-blue-300">{settings.darkTint}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="85"
                value={settings.darkTint}
                onChange={(e) => onUpdateSettings({ ...settings, darkTint: Number(e.target.value) })}
                className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* 3D Tilt Toggle */}
            <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/5">
              <div>
                <span className="text-xs font-medium text-slate-200 block">3D Parallax Tilt Effect</span>
                <span className="text-[11px] text-slate-400">Efek kemiringan 3D kartu saat kursor bergerak</span>
              </div>
              <button
                onClick={() => onUpdateSettings({ ...settings, tilt3d: !settings.tilt3d })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.tilt3d ? 'bg-blue-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.tilt3d ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/10 shrink-0">
          <button
            onClick={() => handlePresetSelect('ios26')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Default
          </button>
          <GlassButton size="md" variant="primary" onClick={onClose}>
            Terapkan Tampilan
          </GlassButton>
        </div>
      </div>
    </div>
  );
};
