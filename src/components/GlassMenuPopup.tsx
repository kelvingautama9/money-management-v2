import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GlassSettings, ThemeMode, PersistedUser } from '../types';
import { ActivePage } from './NavigationTabBar';
import { User } from 'firebase/auth';
import { triggerHaptic } from '../lib/haptics';
import {
  X,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  UploadCloud,
  LogOut,
  FolderSync,
  Sun,
  Moon,
  Palette,
  MoonStar,
  Settings,
  ExternalLink,
  CheckCircle2,
  Key
} from 'lucide-react';

interface GlassMenuPopupProps {
  isOpen: boolean;
  onClose: () => void;
  activePage?: ActivePage;
  onSelectPage?: (page: ActivePage) => void;
  settings: GlassSettings;
  txCount?: number;
  onOpenReport?: () => void;
  onOpenInspector?: () => void;
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
  onOpenApiKeyModal?: () => void;
}

export const GlassMenuPopup: React.FC<GlassMenuPopupProps> = ({
  isOpen,
  onClose,
  settings,
  onOpenProjectManager,
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
  onOpenApiKeyModal
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [tempId, setTempId] = useState(spreadsheetId);
  const [tempSheetName, setTempSheetName] = useState(sheetName);

  useEffect(() => {
    setTempId(spreadsheetId);
  }, [spreadsheetId]);

  useEffect(() => {
    setTempSheetName(sheetName);
  }, [sheetName]);

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

  const isDark = settings.themeMode !== 'light' && settings.themeMode !== 'beige';

  const handleSaveConfig = () => {
    onUpdateSpreadsheetId?.(tempId);
    onUpdateSheetName?.(tempSheetName);
    setShowConfig(false);
  };

  const getSpreadsheetUrl = (id: string) => {
    if (!id) return null;
    if (id.startsWith('http')) return id;
    return `https://docs.google.com/spreadsheets/d/${id}/edit`;
  };

  const sheetUrl = getSpreadsheetUrl(spreadsheetId);

  return typeof document !== 'undefined' ? createPortal(
    <div className={`fixed inset-0 z-[9999] w-screen h-[100dvh] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 overflow-hidden ${isDark ? 'dark' : ''}`}>
      {/* Frosted Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Liquid Glass Popup Container */}
      <div
        style={{
          backgroundColor: isDark
            ? 'rgba(11, 17, 33, 0.92)'
            : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(36px) saturate(190%)',
          WebkitBackdropFilter: 'blur(36px) saturate(190%)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(203, 213, 225, 0.95)',
          boxShadow: isDark
            ? '0 32px 64px -16px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.22)'
            : '0 24px 60px -12px rgba(15, 23, 42, 0.18), 0 8px 24px -4px rgba(0, 0, 0, 0.08), inset 0 1.5px 1px rgba(255, 255, 255, 1)'
        }}
        className="relative z-10 w-full max-w-xl rounded-3xl border overflow-hidden p-5 sm:p-6 max-h-[92dvh] my-auto flex flex-col no-scrollbar shadow-2xl text-slate-900 dark:text-white"
      >
        {/* Top Rim Specular Highlight Bar */}
        <div
          className="absolute top-0 inset-x-6 h-[1.5px] pointer-events-none"
          style={{
            background: isDark
              ? 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.45) 50%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.95) 50%, transparent 100%)'
          }}
        />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10 shrink-0">
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
                Menu
              </h3>
              <p className={`text-xs flex items-center gap-1.5 mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isGoogleConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span className="font-medium">
                  {isGoogleConnected ? 'Google Sheets Terkoneksi' : 'Penyimpanan Lokal Aktif'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition active:scale-95 ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-200 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 shadow-xs'
            }`}
            title="Tutup Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="py-4 overflow-y-auto no-scrollbar space-y-5 flex-1">
          {/* SECTION: PENGATURAN AKUN GOOGLE SHEETS (OPTIMIZED LAYOUT) */}
          <div className="space-y-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider block px-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Pengaturan Akun & Sinkronisasi
            </span>

            <div
              style={
                isDark
                  ? {
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      borderColor: 'rgba(255, 255, 255, 0.14)',
                      boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    }
                  : undefined
              }
              className={`p-4 rounded-2xl border relative overflow-hidden transition-all ${
                isDark
                  ? 'text-white'
                  : 'bg-white border-slate-200 shadow-sm text-slate-900'
              }`}
            >
              {/* Account Status Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* User Avatar or Google Sheets icon */}
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Akun'}
                      className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-400 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isDark
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                    }`}>
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-extrabold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {user?.displayName || (user ? 'Google Cloud Connected' : 'Google Sheets Engine')}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          user
                            ? isDark
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                            : isDark
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                              : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                        }`}
                      >
                        {user ? 'Online' : 'Mode Offline'}
                      </span>
                    </div>

                    <p className={`text-xs truncate font-medium mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {user ? (
                        <span>
                          {user.email}
                          {lastSynced && ` • ${lastSynced.toLocaleTimeString('id-ID')}`}
                        </span>
                      ) : (
                        'Belum ada akun Google terhubung. Sinkronisasi berjalan di penyimpanan browser lokal.'
                      )}
                    </p>
                  </div>
                </div>

                {/* Logout button (if logged in) */}
                {user && (
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      onClose();
                      onLogout?.();
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shrink-0 ${
                      isDark
                        ? 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-400/40 text-rose-200'
                        : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800 shadow-xs'
                    }`}
                    title="Keluar dari Akun Google"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-300" />
                    <span>Keluar</span>
                  </button>
                )}
              </div>

              {/* Connected Details & Actions */}
              {user ? (
                <div className="mt-3.5 pt-3.5 border-t border-slate-200/80 dark:border-white/10 space-y-3">
                  {/* Spreadsheet & Sheet Tab Info Card */}
                  <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isDark
                      ? 'bg-white/[0.04] border-white/10'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Aktif:
                        </span>
                        <span className={`text-xs font-bold truncate ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                          Tab: {sheetName || 'Sheet1'}
                        </span>
                      </div>
                      <p className={`text-[11px] font-mono truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {spreadsheetId ? `ID: ${spreadsheetId.slice(0, 16)}...${spreadsheetId.slice(-8)}` : 'Menggunakan default spreadsheet'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {sheetUrl && (
                        <a
                          href={sheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                            isDark
                              ? 'bg-white/10 hover:bg-white/15 border-white/20 text-slate-200'
                              : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs'
                          }`}
                          title="Buka Google Sheets di tab baru"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                          <span className="hidden sm:inline">Buka Sheet</span>
                        </a>
                      )}

                      <button
                        onClick={() => setShowConfig(!showConfig)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                          showConfig
                            ? isDark ? 'bg-blue-500/30 border-blue-400 text-blue-200' : 'bg-blue-100 border-blue-400 text-blue-900 font-bold'
                            : isDark ? 'bg-white/10 hover:bg-white/15 border-white/20 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs'
                        }`}
                        title="Atur ID & Nama Tab Sheet"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Atur Sheet</span>
                      </button>
                    </div>
                  </div>

                  {/* Primary Sync Action Toolbar */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Tarik Data (Sync In) */}
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        onSyncNow?.();
                      }}
                      disabled={isSyncing}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition active:scale-95 disabled:opacity-50 ${
                        isDark
                          ? 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-400/40 text-blue-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                          : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-900 font-bold shadow-xs'
                      }`}
                    >
                      <RefreshCw className={`w-4 h-4 text-blue-600 dark:text-blue-300 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Sinkron...' : 'Tarik Data'}</span>
                    </button>

                    {/* Kirim Data (Sync Out) */}
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        onPushToSheet?.();
                      }}
                      disabled={isSyncing}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition active:scale-95 disabled:opacity-50 ${
                        isDark
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/40 text-emerald-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                          : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                      }`}
                    >
                      <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                      <span>Kirim Data</span>
                    </button>

                    {/* Pilih Project */}
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        onClose();
                        onOpenProjectManager?.();
                      }}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
                        isDark
                          ? 'bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-400/40 text-indigo-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                          : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-950 font-bold shadow-xs'
                      }`}
                    >
                      <FolderSync className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                      <span>Ganti Project</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Connect Google Sheet Prompt when logged out */
                <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-white/10 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      onLogin?.();
                    }}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md active:scale-95 transition disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Hubungkan Akun Google</span>
                  </button>

                  {onOpenProjectManager && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenProjectManager();
                      }}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                        isDark
                          ? 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-200'
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                      }`}
                    >
                      <FolderSync className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Pilih Project Spreadsheet</span>
                    </button>
                  )}
                </div>
              )}

              {/* Config Drawer for custom ID / Tab */}
              {showConfig && (
                <div className="mt-3.5 pt-3.5 border-t border-slate-200/80 dark:border-white/10 space-y-3 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-700 dark:text-slate-300 font-bold block mb-1">
                        Link URL atau ID Google Spreadsheet:
                      </label>
                      <input
                        type="text"
                        placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                        value={tempId}
                        onChange={(e) => setTempId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-700 dark:text-slate-300 font-bold block mb-1">
                        Nama Tab Sheet:
                      </label>
                      <input
                        type="text"
                        placeholder="Sheet1"
                        value={tempSheetName}
                        onChange={(e) => setTempSheetName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">
                      Konfigurasi tersimpan otomatis ke browser
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowConfig(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSaveConfig}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm transition"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3-IN-1 GEMINI API KEY & VERCEL QUICK ACCESS */}
          {onOpenApiKeyModal && (
            <button
              onClick={() => {
                onClose();
                onOpenApiKeyModal();
              }}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition active:scale-[0.99] cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-indigo-950/40 border-blue-500/30 hover:border-blue-400 text-white'
                  : 'bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 border-blue-200 hover:border-blue-300 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">Google Gemini API Key (3-in-1)</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-400/30">
                      Universal
                    </span>
                  </div>
                  <span className={`text-[11px] block truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Input manual user (BYOK), server default & Vercel deployment
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-400 pl-2">&gt;</span>
            </button>
          )}

          {/* SECTION: PILIHAN TEMA (TETAP ADA) */}
          {onSelectTheme && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Palette className="w-3.5 h-3.5 text-blue-500" />
                  Pilihan Tema
                </span>
                <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Aktif: <strong className={`capitalize ${isDark ? 'text-blue-300' : 'text-blue-700 font-bold'}`}>{settings.themeMode || 'Light'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                      onClick={() => {
                        triggerHaptic('light');
                        onSelectTheme(th.id);
                      }}
                      style={
                        isDark
                          ? isActive
                            ? {
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.28) 0%, rgba(37, 99, 235, 0.12) 100%)',
                                borderColor: 'rgba(96, 165, 250, 0.5)',
                                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                              }
                            : {
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                                borderColor: 'rgba(255, 255, 255, 0.14)',
                                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                              }
                          : undefined
                      }
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isActive
                          ? isDark
                            ? 'text-white'
                            : 'bg-blue-50 border-blue-500 ring-2 ring-blue-500 text-blue-950 font-bold shadow-sm'
                          : isDark
                            ? 'hover:border-white/25 hover:bg-white/[0.08] text-white'
                            : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-slate-100 border border-slate-200'}`}>
                          {th.icon}
                        </div>
                        {isActive && (
                          <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <span className={`text-xs font-bold block leading-tight ${
                          isActive
                            ? isDark ? 'text-white font-black' : 'text-blue-950 font-black'
                            : isDark ? 'text-slate-100' : 'text-slate-900'
                        }`}>
                          {th.name}
                        </span>
                        <span className={`text-[10px] block mt-1 font-medium ${
                          isActive
                            ? isDark ? 'text-blue-200' : 'text-blue-800'
                            : isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          {th.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs shrink-0">
          <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Kelvin Gautama • Financial System
          </span>
          <button
            onClick={onClose}
            className={`font-bold transition ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:underline'}`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;
};
