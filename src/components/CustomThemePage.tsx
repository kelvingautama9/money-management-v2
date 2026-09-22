import React from 'react';
import { GlassSettings, ThemeMode } from '../types';
import { triggerHaptic } from '../lib/haptics';
import {
  Palette,
  ArrowLeft,
  Sun,
  Moon,
  MoonStar,
  Check,
  Sparkles,
  Sliders,
  RotateCcw
} from 'lucide-react';

interface CustomThemePageProps {
  settings: GlassSettings;
  onUpdateSettings: (newSettings: GlassSettings) => void;
  onBack?: () => void;
}

export const CustomThemePage: React.FC<CustomThemePageProps> = ({
  settings,
  onUpdateSettings,
  onBack
}) => {
  const isDark = settings?.themeMode !== 'light' && settings?.themeMode !== 'beige';
  const currentTheme = settings.themeMode || 'dark';

  const presets = [
    { id: 'ios26', name: 'iOS 26 Liquid', desc: 'Blur tinggi, specular dinamis, translusen seimbang' },
    { id: 'frosted', name: 'Frosted Glass', desc: 'Blur lembut, gaya matte, elegan untuk fokus visual' },
    { id: 'deepDark', name: 'Deep Dark Glass', desc: 'Kontras tinggi, gelap pekat, bayangan mendalam' },
    { id: 'crystal', name: 'Crystal Clear', desc: 'Kilau reflektif maksimal, kejernihan visual transparan' }
  ];

  const handleApplyPreset = (presetId: 'ios26' | 'frosted' | 'deepDark' | 'crystal') => {
    triggerHaptic('selection');
    switch (presetId) {
      case 'ios26':
        onUpdateSettings({
          ...settings,
          blur: 24,
          translucency: 65,
          darkTint: 45,
          specularIntensity: 75,
          tilt3d: true,
          activePreset: 'ios26'
        });
        break;
      case 'frosted':
        onUpdateSettings({
          ...settings,
          blur: 32,
          translucency: 80,
          darkTint: 60,
          specularIntensity: 40,
          tilt3d: false,
          activePreset: 'frosted'
        });
        break;
      case 'deepDark':
        onUpdateSettings({
          ...settings,
          blur: 20,
          translucency: 50,
          darkTint: 80,
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
      icon: <Moon className="w-5 h-5 text-sky-400" />,
      color: 'from-slate-900 to-[#060713]'
    },
    {
      id: 'light',
      label: 'Light Apple',
      desc: 'Clean Minimal',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
      color: 'from-white to-slate-100'
    },
    {
      id: 'beige',
      label: 'Warm Beige',
      desc: 'Editorial Paper',
      icon: <Palette className="w-5 h-5 text-amber-700" />,
      color: 'from-[#fefcf8] to-[#f5f2eb]'
    },
    {
      id: 'midnight',
      label: 'Midnight OLED',
      desc: 'Pure Deep Black',
      icon: <MoonStar className="w-5 h-5 text-purple-400" />,
      color: 'from-black to-slate-950'
    }
  ];

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* TOP HEADER BAR */}
      <div
        style={
          isDark
            ? {
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.015) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderTop: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.45)'
              }
            : {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(226, 232, 240, 0.95)',
                boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.06)'
              }
        }
        className="p-4 sm:p-6 rounded-3xl relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            {onBack && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onBack();
                }}
                className={`p-2.5 rounded-2xl border transition active:scale-95 shrink-0 ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
                    : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-900 shadow-sm'
                }`}
                title="Kembali ke Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5 text-amber-400" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Custom Theme
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Estetika Liquid Glass
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Sesuaikan mode warna antarmuka, intensitas blur kaca frosted, pantulan specular, dan kedalaman 3D tilt
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('medium');
              handleApplyPreset('ios26');
            }}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs inline-flex items-center gap-2 transition active:scale-95 self-end sm:self-center border ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Default</span>
          </button>
        </div>
      </div>

      {/* THEME SELECTION & PRESETS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pilihan Mode Warna Tema */}
        <div
          style={
            isDark
              ? {
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }
              : {
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(226, 232, 240, 0.9)'
                }
          }
          className="p-6 rounded-3xl shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Palette className="w-4 h-4 text-sky-400" />
              Pilihan Mode Warna Tema
            </h3>
            <span className={`text-xs font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Mode Aktif: {currentTheme.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {themes.map((t) => {
              const isSelected = currentTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    triggerHaptic('selection');
                    onUpdateSettings({ ...settings, themeMode: t.id });
                  }}
                  className={`relative p-4 rounded-2xl border text-left transition-all active:scale-98 cursor-pointer flex flex-col justify-between min-h-[105px] ${
                    isSelected
                      ? 'border-sky-500 bg-sky-500/15 ring-2 ring-sky-400/50 shadow-lg'
                      : isDark
                      ? 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2 rounded-xl bg-white/10">{t.icon}</div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <span className={`text-sm font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.label}</span>
                    <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preset Efek Kaca */}
        <div
          style={
            isDark
              ? {
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }
              : {
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(226, 232, 240, 0.9)'
                }
          }
          className="p-6 rounded-3xl shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Sparkles className="w-4 h-4 text-amber-400" />
              Preset Efek Refleksi Kaca
            </h3>
            <span className={`text-xs font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {settings.activePreset.toUpperCase()}
            </span>
          </div>

          <div className="space-y-2.5">
            {presets.map((p) => {
              const isSelected = settings.activePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleApplyPreset(p.id as any)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all active:scale-98 cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-400/50 shadow-md'
                      : isDark
                      ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className={`text-sm font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.name}</span>
                    <span className={`text-xs block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{p.desc}</span>
                  </div>
                  {isSelected && (
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SLIDER CONTROLS FOR MANUAL FINE-TUNING */}
      <div
        style={
          isDark
            ? {
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }
            : {
                backgroundColor: '#ffffff',
                border: '1px solid rgba(226, 232, 240, 0.9)'
              }
        }
        className="p-6 rounded-3xl shadow-xs space-y-6"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10">
          <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Sliders className="w-4 h-4 text-emerald-400" />
            Parameter Optik & Transparansi Kaca
          </h3>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Pengaturan Presisi Manual
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Blur Intensity */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Intensitas Blur Kaca</span>
              <span className="font-mono text-sky-400">{settings.blur} px</span>
            </div>
            <input
              type="range"
              min="4"
              max="48"
              value={settings.blur}
              onChange={(e) => onUpdateSettings({ ...settings, blur: Number(e.target.value) })}
              className="w-full accent-sky-400 h-2 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Translucency */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Transparansi / Opacity</span>
              <span className="font-mono text-sky-400">{settings.translucency}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="95"
              value={settings.translucency}
              onChange={(e) => onUpdateSettings({ ...settings, translucency: Number(e.target.value) })}
              className="w-full accent-sky-400 h-2 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Specular Highlight */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Refleksi Kilau Specular</span>
              <span className="font-mono text-amber-400">{settings.specularIntensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.specularIntensity}
              onChange={(e) => onUpdateSettings({ ...settings, specularIntensity: Number(e.target.value) })}
              className="w-full accent-amber-400 h-2 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* 3D Tilt Effect */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Efek 3D Parallax & Gyro Tilt</span>
              <span className={`font-mono ${settings.tilt3d ? 'text-emerald-400' : 'text-slate-400'}`}>
                {settings.tilt3d ? 'AKTIF' : 'NONAKTIF'}
              </span>
            </div>
            <button
              onClick={() => {
                triggerHaptic('selection');
                onUpdateSettings({ ...settings, tilt3d: !settings.tilt3d });
              }}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                settings.tilt3d
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : isDark
                  ? 'bg-white/5 border-white/10 text-slate-400'
                  : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}
            >
              <span>Toggle 3D Mouse Tilt</span>
              <span className="text-[11px] font-mono">{settings.tilt3d ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
