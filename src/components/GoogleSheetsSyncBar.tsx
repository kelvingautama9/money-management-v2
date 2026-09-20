import React, { useState } from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassButton } from './GlassButton';
import { GlassSettings } from '../types';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LogOut,
  UploadCloud,
  Layers
} from 'lucide-react';

interface GoogleSheetsSyncBarProps {
  user: User | null;
  spreadsheetId: string;
  sheetName: string;
  isSyncing: boolean;
  lastSynced: Date | null;
  settings: GlassSettings;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  onUpdateSpreadsheetId: (id: string) => void;
  onUpdateSheetName: (name: string) => void;
  onSyncNow: () => Promise<void>;
  onPushToSheet: () => Promise<void>;
  onHideToMenu?: () => void;
}

export const GoogleSheetsSyncBar: React.FC<GoogleSheetsSyncBarProps> = ({
  user,
  spreadsheetId,
  sheetName,
  isSyncing,
  lastSynced,
  settings,
  onLogin,
  onLogout,
  onUpdateSpreadsheetId,
  onUpdateSheetName,
  onSyncNow,
  onPushToSheet,
  onHideToMenu
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [tempId, setTempId] = useState(spreadsheetId);
  const [tempSheetName, setTempSheetName] = useState(sheetName);

  const handleSaveConfig = () => {
    onUpdateSpreadsheetId(tempId);
    onUpdateSheetName(tempSheetName);
    setShowConfig(false);
  };

  return (
    <GlassContainer settings={settings} className="p-4 sm:p-5" enableTilt={false}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Status & Google Account info */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-tight">
                Google Sheets Live Sync Engine
              </h4>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  user
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    user ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {user ? 'Terhubung (Online)' : 'Mode Lokal (Siap Hubungkan)'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-0.5">
              {user ? (
                <span>
                  Akun: <strong className="text-slate-200 font-medium">{user.email}</strong>
                </span>
              ) : (
                <span>Hubungkan akun Google untuk sinkronisasi otomatis dua arah</span>
              )}
              {lastSynced && (
                <span>
                  Terakhir sinkron: <strong className="text-slate-300">{lastSynced.toLocaleTimeString('id-ID')}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {!user ? (
            <button
              onClick={onLogin}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-medium text-xs shadow-md active:scale-95 transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Sign in with Google
            </button>
          ) : (
            <>
              <GlassButton
                size="sm"
                variant="secondary"
                onClick={() => setShowConfig(!showConfig)}
                icon={<Layers className="w-3.5 h-3.5" />}
              >
                {showConfig ? 'Tutup Konfigurasi' : 'ID Spreadsheet'}
              </GlassButton>

              <GlassButton
                size="sm"
                variant="primary"
                onClick={onSyncNow}
                disabled={isSyncing}
                settings={settings}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
              >
                {isSyncing ? 'Menyinkronkan...' : 'Tarik dari Sheets'}
              </GlassButton>

              <GlassButton
                size="sm"
                variant="secondary"
                onClick={onPushToSheet}
                disabled={isSyncing}
                icon={<UploadCloud className="w-3.5 h-3.5 text-blue-400" />}
              >
                Kirim ke Sheets
              </GlassButton>

              <GlassButton size="sm" variant="ghost" onClick={onLogout} icon={<LogOut className="w-3.5 h-3.5" />}>
                Keluar
              </GlassButton>
            </>
          )}

          {onHideToMenu && (
            <button
              onClick={onHideToMenu}
              className="text-slate-400 hover:text-white text-xs px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 transition active:scale-95"
              title="Pindahkan ke Menu agar tampilan lebih lega dan summary naik ke atas"
            >
              <span className="text-[10px] hidden sm:inline font-medium">Pindahkan ke Menu</span>
              <span className="text-slate-300 font-bold text-xs leading-none">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Spreadsheet ID / Tab Drawer */}
      {showConfig && (
        <div className="mt-4 pt-4 border-t border-white/10 bg-white/[0.02] p-4 rounded-2xl border border-white/5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Link atau ID Google Spreadsheet (URL / Spreadsheet ID)
              </label>
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/1abc.../edit atau ID saja"
                value={tempId}
                onChange={(e) => setTempId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Nama Tab Sheet (Contoh: Sheet1)
              </label>
              <input
                type="text"
                placeholder="Sheet1"
                value={tempSheetName}
                onChange={(e) => setTempSheetName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-between items-center text-xs">
            <span className="text-slate-400 text-[11px]">
              Tip: Buka file Google Sheets Anda lalu salin link URL dari address bar browser.
            </span>
            <div className="flex gap-2">
              <GlassButton size="sm" variant="ghost" onClick={() => setShowConfig(false)}>
                Batal
              </GlassButton>
              <GlassButton size="sm" variant="primary" onClick={handleSaveConfig} settings={settings}>
                Simpan Konfigurasi
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </GlassContainer>
  );
};
