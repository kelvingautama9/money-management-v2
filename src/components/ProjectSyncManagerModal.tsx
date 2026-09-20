import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User } from 'firebase/auth';
import { GlassSettings, PersistedUser } from '../types';
import { ProjectSyncManager } from './ProjectSyncManager';
import { X, FolderSync, ShieldCheck } from 'lucide-react';

interface ProjectSyncManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | PersistedUser | null;
  spreadsheetId: string;
  sheetName: string;
  onSaveProjectConfig: (spreadsheetId: string, sheetName: string, detectedSheets?: string[]) => void;
  onLogin: () => Promise<void>;
  onSyncNow: (targetId?: string, targetSheet?: string) => Promise<void>;
  isSyncing: boolean;
  settings: GlassSettings;
}

export const ProjectSyncManagerModal: React.FC<ProjectSyncManagerModalProps> = ({
  isOpen,
  onClose,
  user,
  spreadsheetId,
  sheetName,
  onSaveProjectConfig,
  onLogin,
  onSyncNow,
  isSyncing,
  settings
}) => {
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

  const isLight = settings?.themeMode === 'light';
  const isBeige = settings?.themeMode === 'beige';
  const isBright = isLight || isBeige;

  return typeof document !== 'undefined' ? createPortal(
    <div
      className="fixed inset-0 z-[9999] w-screen h-[100dvh] flex items-center justify-center p-3 sm:p-4 overflow-hidden"
      style={{
        backgroundColor: isBright ? 'rgba(15, 23, 42, 0.45)' : 'rgba(5, 8, 16, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-2xl rounded-3xl border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[92dvh] my-auto ${
          isLight
            ? 'bg-white/95 text-slate-900 border-slate-200/80 shadow-slate-900/10'
            : isBeige
            ? 'bg-[#f8f5ee]/95 text-[#29231c] border-[#dfd5c6] shadow-[#29231c]/10'
            : 'bg-slate-900/90 text-white border-white/15 shadow-black/80'
        }`}
        style={{
          backdropFilter: `blur(${Math.max(settings.blur, 24)}px) saturate(180%)`,
          WebkitBackdropFilter: `blur(${Math.max(settings.blur, 24)}px) saturate(180%)`,
          boxShadow: isBright
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
            : '0 25px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Modal Top Header */}
        <div
          className={`flex items-center justify-between p-4 sm:p-5 border-b shrink-0 ${
            isLight
              ? 'border-slate-200/80 bg-slate-50/80'
              : isBeige
              ? 'border-[#dfd5c6] bg-[#efe9dc]/80'
              : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center shadow-sm ${
                isLight
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : isBeige
                  ? 'bg-amber-100/80 border-amber-300 text-amber-800'
                  : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
              }`}
            >
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`text-base font-bold tracking-tight ${
                    isLight ? 'text-slate-900' : isBeige ? 'text-[#29231c]' : 'text-white'
                  }`}
                >
                  Sinkronisasi Project Google Sheet
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : isBeige
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}
                >
                  Multi-Account / Project
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isLight ? 'text-slate-500' : isBeige ? 'text-[#6e6355]' : 'text-slate-400'
                }`}
              >
                Pilih file dari Drive, input link manual, atau buat spreadsheet baru dengan template siap pakai tanpa coding.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition active:scale-90 shrink-0 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 border-slate-200'
                : isBeige
                ? 'bg-[#e8e2d4] hover:bg-[#ded6c5] text-[#4f4437] hover:text-[#29231c] border-[#dfd5c6]'
                : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border-white/15'
            }`}
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          <ProjectSyncManager
            user={user}
            currentSpreadsheetId={spreadsheetId}
            currentSheetName={sheetName}
            onSaveProjectConfig={onSaveProjectConfig}
            onLogin={onLogin}
            onSyncNow={onSyncNow}
            isSyncing={isSyncing}
            settings={settings}
            onClose={onClose}
          />
        </div>

        {/* Modal Footer Note */}
        <div
          className={`p-3.5 border-t flex items-center justify-between text-[11px] shrink-0 px-5 ${
            isLight
              ? 'bg-slate-50/90 border-slate-200/80 text-slate-600'
              : isBeige
              ? 'bg-[#ece5d7] border-[#dfd5c6] text-[#554a3d]'
              : 'bg-black/40 border-white/10 text-slate-400'
          }`}
        >
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Format Template Standar (Bulan, Kategori, Akun, Tipe, Jumlah, Catatan)
          </span>
          <button
            onClick={onClose}
            className={`px-3 py-1 rounded-xl font-medium text-xs transition cursor-pointer ${
              isLight
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                : isBeige
                ? 'bg-[#dfd5c6] hover:bg-[#d0c5b3] text-[#29231c]'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;
};
