import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GlassSettings, ThemeMode, PersistedUser } from '../types';
import { ActivePage } from './NavigationTabBar';
import { User } from 'firebase/auth';
import { triggerHaptic } from '../lib/haptics';
import {
  X,
  LayoutDashboard,
  PlusCircle,
  PieChart,
  TrendingUp,
  Landmark,
  FileSpreadsheet,
  FileText,
  Sliders,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  UploadCloud,
  LogOut,
  Layers,
  Eye,
  EyeOff,
  FolderSync,
  Sun,
  Moon,
  Palette,
  MoonStar,
  Calculator
} from 'lucide-react';

interface GlassMenuPopupProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  settings: GlassSettings;
  txCount: number;
  onOpenReport: () => void;
  onOpenInspector: () => void;
  onOpenProjectManager?: () => void;
  onOpenCalculator?: () => void;
  onSelectTheme?: (theme: ThemeMode) => void;
  isGoogleConnected: boolean;
  user?: User | PersistedUser | null;
  spreadsheetId?: string;
  sheetName?: string;
  isSyncing?: boolean;
  lastSynced?: Date | null;
  onLogin?: () => Promise<void>;
  onLogout?: () => Promise<void>;
  onUpdateSpreadsheetId?: (id: string) => void;
  onUpdateSheetName?: (name: string) => void;
  onSyncNow?: () => Promise<void>;
  onPushToSheet?: () => Promise<void>;
  showSyncBarOnDashboard?: boolean;
  onToggleSyncBarOnDashboard?: () => void;
}

export const GlassMenuPopup: React.FC<GlassMenuPopupProps> = ({
  isOpen,
  onClose,
  activePage,
  onSelectPage,
  settings,
  txCount,
  onOpenReport,
  onOpenInspector,
  onOpenProjectManager,
  onOpenCalculator,
  onSelectTheme,
  isGoogleConnected,
  user,
  spreadsheetId = '',
  sheetName = 'Sheet1',
  isSyncing = false,
  lastSynced,
  onLogin,
  onLogout,
  onUpdateSpreadsheetId,
  onUpdateSheetName,
  onSyncNow,
  onPushToSheet,
  showSyncBarOnDashboard = false,
  onToggleSyncBarOnDashboard
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [tempId, setTempId] = useState(spreadsheetId);
  const [tempSheetName, setTempSheetName] = useState(sheetName);

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDark = settings.themeMode === 'dark' || settings.themeMode === 'midnight';

  const handleSaveConfig = () => {
    onUpdateSpreadsheetId?.(tempId);
    onUpdateSheetName?.(tempSheetName);
    setShowConfig(false);
  };

  const mainMenus = [
    {
      id: 'summary' as ActivePage,
      title: 'Executive Summary',
      description: 'Dashboard Net Worth, arus kas bulanan & ringkasan aset',
      icon: <LayoutDashboard className="w-5 h-5 text-blue-500" />,
      badge: 'Utama'
    },
    {
      id: 'cashflow' as ActivePage,
      title: 'Input Cashflow',
      description: 'Pencatatan Pemasukan & Pengeluaran auto-sync Google Sheets',
      icon: <PlusCircle className="w-5 h-5 text-emerald-500" />,
      badge: 'Auto-Sync'
    },
    {
      id: 'budgeting' as ActivePage,
      title: 'Budgeting Amplop',
      description: '4 Kantong Anggaran: Listrik, Transport, Dating, Entertainment',
      icon: <PieChart className="w-5 h-5 text-amber-500" />,
      badge: '4 Pos'
    },
    {
      id: 'portfolio' as ActivePage,
      title: 'Portofolio & Investasi',
      description: 'Pluang, Valas BCA, Binance USDT & Progres Dana Darurat',
      icon: <TrendingUp className="w-5 h-5 text-sky-500" />,
      badge: '+2.1% MoM'
    },
    {
      id: 'accounts' as ActivePage,
      title: 'Saldo by Rekening',
      description: 'Pantau saldo 9 akun rekening & Transfer Antar Bank',
      icon: <Landmark className="w-5 h-5 text-purple-500" />,
      badge: '9 Akun'
    },
    {
      id: 'journal' as ActivePage,
      title: 'Jurnal & Rekap Data',
      description: 'Tabel lengkap mutasi spreadsheet, filter, edit & ekspor',
      icon: <FileSpreadsheet className="w-5 h-5 text-indigo-500" />,
      badge: txCount > 0 ? `${txCount} Baris` : undefined
    }
  ];

  const handleSelect = (page: ActivePage) => {
    triggerHaptic('light');
    onSelectPage(page);
    onClose();
  };

  return typeof document !== 'undefined' ? createPortal(
    <div className="fixed inset-0 z-[9999] w-screen h-[100dvh] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 overflow-hidden">
      {/* Frosted Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/75 backdrop-blur-md transition-opacity"
      />

      {/* Liquid Glass Popup Container */}
      <div
        style={{
          backgroundColor: isDark
            ? 'rgba(15, 23, 42, 0.92)'
            : 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(32px) saturate(190%)',
          WebkitBackdropFilter: 'blur(32px) saturate(190%)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(226, 232, 240, 0.9)',
          boxShadow: isDark
            ? '0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1.5px 1px rgba(255, 255, 255, 0.25)'
            : '0 24px 60px -12px rgba(99, 102, 241, 0.15), 0 8px 24px -4px rgba(0, 0, 0, 0.05), inset 0 1.5px 1px rgba(255, 255, 255, 0.95)'
        }}
        className="relative z-10 w-full max-w-2xl rounded-3xl border overflow-hidden p-4 sm:p-6 max-h-[90dvh] my-auto flex flex-col no-scrollbar shadow-2xl text-slate-900 dark:text-white"
      >
        {/* Top Rim Specular Highlight Bar */}
        <div
          className="absolute top-0 inset-x-6 h-[1.5px] pointer-events-none"
          style={{
            background: isDark
              ? 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.95) 50%, transparent 100%)'
          }}
        />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/70 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(147, 51, 234, 0.9) 100%)',
                boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.7)'
              }}
            >
              <Sparkles className="w-5 h-5 text-white drop-shadow" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                Menu & Fitur Cepat
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isGoogleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>
                  {isGoogleConnected ? 'Google Sheets Terkoneksi' : 'Penyimpanan Lokal Aktif'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-600 dark:text-slate-300 transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="py-4 overflow-y-auto no-scrollbar space-y-4 flex-1">
          {/* GOOGLE SHEETS LIVE SYNC ENGINE PANEL */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                      Google Sheets Sync Engine
                    </h4>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        user
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {user ? 'Online' : 'Standalone'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {user ? (
                      <span>
                        Akun: <strong className="text-slate-800 dark:text-slate-200">{user.email}</strong>
                        {lastSynced && ` • ${lastSynced.toLocaleTimeString('id-ID')}`}
                      </span>
                    ) : (
                      'Hubungkan akun Google untuk sinkronisasi dua arah real-time'
                    )}
                  </p>
                </div>
              </div>

              {/* Login or Action buttons */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {!user ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {onOpenProjectManager && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenProjectManager();
                        }}
                        className="px-3 py-1.5 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-xs font-semibold text-indigo-700 dark:text-indigo-200 flex items-center gap-1.5 transition active:scale-95"
                      >
                        <FolderSync className="w-3.5 h-3.5" />
                        <span>Project Sheet</span>
                      </button>
                    )}
                    <button
                      onClick={() => onLogin?.()}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md active:scale-95 transition disabled:opacity-50"
                    >
                      Sign in with Google
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onSyncNow?.()}
                      disabled={isSyncing}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/30 text-xs font-semibold text-blue-700 dark:text-blue-200 flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Sync...' : 'Tarik'}</span>
                    </button>

                    <button
                      onClick={() => onPushToSheet?.()}
                      disabled={isSyncing}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-xs font-semibold text-emerald-700 dark:text-emerald-200 flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Kirim</span>
                    </button>

                    {onOpenProjectManager && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenProjectManager();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-xs font-semibold text-indigo-700 dark:text-indigo-200 flex items-center gap-1 transition active:scale-95"
                      >
                        <FolderSync className="w-3.5 h-3.5" />
                        <span>Project</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowConfig(!showConfig)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-200/70 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 border border-slate-300 dark:border-white/15 text-xs font-medium text-slate-700 dark:text-slate-300 transition"
                      title="Atur ID & Tab Sheet Cepat"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onLogout?.();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-300 transition flex items-center gap-1.5 active:scale-95"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Config Drawer */}
            {showConfig && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-white/10 space-y-2 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold block mb-1">
                      Link URL atau ID Google Spreadsheet:
                    </label>
                    <input
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      value={tempId}
                      onChange={(e) => setTempId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white font-mono focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold block mb-1">
                      Nama Tab Sheet:
                    </label>
                    <input
                      type="text"
                      placeholder="Sheet1"
                      value={tempSheetName}
                      onChange={(e) => setTempSheetName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:border-blue-400 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    ID Sheet tersimpan secara persisten
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowConfig(false)}
                      className="px-2 py-1 rounded-lg bg-slate-200/60 dark:bg-white/5 text-[11px] text-slate-700 dark:text-slate-300"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveConfig}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-[11px] font-bold text-white shadow"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block px-1">
            Navigasi Halaman
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {mainMenus.map((menu) => {
              const isActive = activePage === menu.id;
              return (
                <button
                  key={menu.id}
                  onClick={() => handleSelect(menu.id)}
                  className={`group flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-600/25 border-blue-300 dark:border-blue-400/40 shadow-md'
                      : 'bg-white/70 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] border-slate-200/80 dark:border-white/10'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {menu.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={`text-sm font-bold truncate ${
                          isActive ? 'text-blue-600 dark:text-blue-300' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {menu.title}
                      </span>
                      {menu.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0">
                          {menu.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {menu.description}
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 mt-2 transition-transform ${
                      isActive
                        ? 'text-blue-500 translate-x-0.5'
                        : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Quick Utility Tools */}
          <div className="pt-3 border-t border-slate-200/70 dark:border-white/10 mt-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block px-1 mb-2">
              Utilitas Finansial & Laporan
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {onOpenProjectManager && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenProjectManager();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.09] border border-slate-200/80 dark:border-white/10 text-left transition active:scale-[0.98]"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <FolderSync className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">Project Sheets</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Pilih akun & spreadsheet</p>
                  </div>
                </button>
              )}

              {onOpenCalculator && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCalculator();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.09] border border-slate-200/80 dark:border-white/10 text-left transition active:scale-[0.98]"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">Kalkulator Pensiun</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Simulasi target & FIRE</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  onOpenReport();
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.09] border border-slate-200/80 dark:border-white/10 text-left transition active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Laporan Otomatis</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Analisis keuangan & cetak</p>
                </div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenInspector();
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.09] border border-slate-200/80 dark:border-white/10 text-left transition active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">Kustomisasi Kaca</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Atur blur & specular</p>
                </div>
              </button>
            </div>
          </div>

          {/* THEME SELECTION PALETTE */}
          {onSelectTheme && (
            <div className="pt-3 border-t border-slate-200/70 dark:border-white/10 mt-3">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-500" />
                  Pilihan Tema
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Aktif: <strong className="text-blue-600 dark:text-blue-300 capitalize">{settings.themeMode || 'Light'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'light' as ThemeMode, name: 'Liquid Glass (Light)', icon: <Sun className="w-4 h-4 text-amber-500" />, desc: 'Pastel Clean' },
                  { id: 'dark' as ThemeMode, name: 'Dark Obsidian', icon: <Moon className="w-4 h-4 text-sky-400" />, desc: 'Neon Cyber' },
                  { id: 'beige' as ThemeMode, name: 'Warm Editorial', icon: <Palette className="w-4 h-4 text-amber-700" />, desc: 'Paper Tone' },
                  { id: 'midnight' as ThemeMode, name: 'Midnight OLED', icon: <MoonStar className="w-4 h-4 text-purple-400" />, desc: 'Deep Black' },
                ].map((th) => {
                  const isActive = (settings.themeMode || 'light') === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => onSelectTheme(th.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-600/30 border-blue-400 ring-1 ring-blue-400 text-blue-900 dark:text-white shadow-sm'
                          : 'bg-white/60 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.08] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                          {th.icon}
                        </div>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold block leading-tight">{th.name}</span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">{th.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Kelvin Gautama • Google Sheets Engine
          </span>
          <button
            onClick={onClose}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;
};
