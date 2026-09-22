import React from 'react';
import { User } from 'firebase/auth';
import { GlassSettings, PersistedUser } from '../types';
import { ProjectSyncManager } from './ProjectSyncManager';
import { FolderSync, ArrowLeft } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

interface SyncSheetPageProps {
  user: User | PersistedUser | null;
  currentSpreadsheetId: string;
  currentSheetName: string;
  onSaveProjectConfig: (spreadsheetId: string, sheetName: string, detectedSheets?: string[]) => void;
  onLogin: () => Promise<void>;
  onSyncNow: (targetId?: string, targetSheet?: string) => Promise<void>;
  isSyncing: boolean;
  settings: GlassSettings;
  onBack?: () => void;
}

export const SyncSheetPage: React.FC<SyncSheetPageProps> = ({
  user,
  currentSpreadsheetId,
  currentSheetName,
  onSaveProjectConfig,
  onLogin,
  onSyncNow,
  isSyncing,
  settings,
  onBack
}) => {
  const isDark = settings?.themeMode !== 'light' && settings?.themeMode !== 'beige';

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* TOP HEADER BAR (Liquid Glass Styling matching Kalkulator Investasi) */}
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

            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <FolderSync className="w-5 h-5 text-indigo-400" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Singkron Google Sheet
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Koneksi Realtime
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Hubungkan file Google Sheets, pilih lembar bulan aktif, dan kelola sinkronisasi otomatis mutasi dan pos anggaran
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PROJECT SYNC MANAGER EMBEDDED CONTAINER */}
      <div
        style={
          isDark
            ? {
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.35)'
              }
            : {
                backgroundColor: '#ffffff',
                border: '1px solid rgba(226, 232, 240, 0.95)',
                boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.06)'
              }
        }
        className="p-4 sm:p-6 rounded-3xl"
      >
        <ProjectSyncManager
          user={user}
          currentSpreadsheetId={currentSpreadsheetId}
          currentSheetName={currentSheetName}
          onSaveProjectConfig={onSaveProjectConfig}
          onLogin={onLogin}
          onSyncNow={onSyncNow}
          isSyncing={isSyncing}
          settings={settings}
        />
      </div>
    </div>
  );
};
