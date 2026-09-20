import React, { useState } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  ExternalLink,
  ChevronDown,
  CloudCheck,
  ShieldCheck,
  Wifi,
  WifiOff
} from 'lucide-react';
import { GlassSettings } from '../types';

interface SyncStatusHeaderBadgeProps {
  user: { email: string | null; displayName: string | null; isDevMode?: boolean } | null;
  spreadsheetId: string;
  sheetName: string;
  isSyncing: boolean;
  lastSynced: Date | null;
  txCount: number;
  onSyncNow: () => Promise<void>;
  settings: GlassSettings;
  onOpenProjectManager?: () => void;
}

export const SyncStatusHeaderBadge: React.FC<SyncStatusHeaderBadgeProps> = ({
  user,
  spreadsheetId,
  sheetName,
  isSyncing,
  lastSynced,
  txCount,
  onSyncNow,
  settings,
  onOpenProjectManager
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatLastSync = () => {
    if (!lastSynced) return 'Belum tersinkron';
    const diffMs = Date.now() - lastSynced.getTime();
    if (diffMs < 60000) return 'Baru saja';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)} menit lalu`;
    return lastSynced.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const isLight = settings.themeMode === 'light' || settings.themeMode === 'beige';
  const isDevMode = user?.isDevMode === true;

  return (
    <div className="relative">
      {/* Clickable Status Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border shadow-sm select-none ${
          isSyncing
            ? 'bg-blue-500/15 border-blue-400/40 text-blue-300 animate-pulse'
            : isDevMode
            ? isLight
              ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
              : 'bg-amber-500/15 border-amber-400/30 text-amber-300 hover:bg-amber-500/25'
            : user
            ? isLight
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/25'
            : isLight
            ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
            : 'bg-rose-500/15 border-rose-400/30 text-rose-300 hover:bg-rose-500/25'
        }`}
        title="Klik untuk melihat detail status sinkronisasi Google Sheets"
      >
        {/* Pulsing Dot */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {isSyncing ? (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          ) : isDevMode ? (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          ) : user ? (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          ) : (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isSyncing ? 'bg-blue-500' : isDevMode ? 'bg-amber-500' : user ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
        </span>

        {/* Status Text */}
        <div className="flex items-center gap-1.5 text-left">
          <span className="font-bold tracking-tight text-[11px] sm:text-xs">
            {isSyncing
              ? 'Menyinkronkan...'
              : isDevMode
              ? 'Dev Mode (Rp 0)'
              : user
              ? 'Tersinkronisasi'
              : 'Perlu Login'}
          </span>
          <span className="hidden md:inline opacity-70 text-[10px]">
            • {sheetName} ({formatLastSync()})
          </span>
        </div>

        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Diagnostic Dropdown Card */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`absolute top-full mt-2 left-0 sm:right-0 sm:left-auto w-72 sm:w-80 rounded-2xl p-4 shadow-2xl z-50 border backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 ${
              isLight
                ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/60'
                : 'bg-slate-900/95 border-white/15 text-slate-100 shadow-black/80'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  isDevMode ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
                }`}>
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">
                    {isDevMode ? 'Dev Mode (UI Inspection)' : 'Status Google Sheets Sync'}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {isDevMode ? 'Nilai Default 0 Tanpa Data Google' : 'Indikator Real-time Data'}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isDevMode
                    ? 'bg-amber-500/20 text-amber-500'
                    : user
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : 'bg-rose-500/20 text-rose-500'
                }`}
              >
                {isDevMode ? 'Dev Mode' : user ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Sync Details */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                <span className="text-slate-400 text-[11px]">Mode Sesi:</span>
                <span className="font-semibold truncate max-w-[170px]">
                  {isDevMode ? 'Developer Mode (Kode 0000)' : user?.email || 'Belum Terhubung'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                <span className="text-slate-400 text-[11px]">Tab Aktif:</span>
                <span className="font-mono font-bold text-blue-500">{sheetName}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                <span className="text-slate-400 text-[11px]">Terakhir Sinkron:</span>
                <span className="font-medium">{formatLastSync()}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                <span className="text-slate-400 text-[11px]">Data Terbaca:</span>
                <span className={`font-semibold ${isDevMode ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {isDevMode ? '0 (Dinormalkan untuk Dev)' : `${txCount} Rekapan Transaksi`}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-400 text-[11px]">ID Spreadsheet:</span>
                <span className="font-mono text-[10px] text-slate-500 truncate max-w-[160px]" title={spreadsheetId}>
                  {isDevMode ? '(Dinonaktifkan)' : `${spreadsheetId.slice(0, 14)}...`}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 flex items-center gap-2">
              <button
                onClick={async () => {
                  await onSyncNow();
                  setIsOpen(false);
                }}
                disabled={isSyncing || isDevMode}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : isDevMode ? 'Dev Mode (Rp 0)' : 'Sinkronkan Sekarang'}</span>
              </button>

              {onOpenProjectManager && !isDevMode && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenProjectManager();
                  }}
                  className="py-2 px-3 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold transition"
                  title="Ganti ID Spreadsheet atau Tab"
                >
                  Ganti
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

