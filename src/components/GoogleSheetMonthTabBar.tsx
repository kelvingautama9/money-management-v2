import React, { useState } from 'react';
import { GlassSettings, PersistedUser } from '../types';
import { User } from 'firebase/auth';
import { triggerHaptic } from '../lib/haptics';
import { Calendar, RefreshCw, Plus, X } from 'lucide-react';

interface GoogleSheetMonthTabBarProps {
  currentSheet: string;
  onSelectSheet: (sheetName: string) => void;
  availableSheets: string[];
  onAddNewSheet?: (newSheetName: string) => void;
  isGoogleConnected: boolean;
  user: User | PersistedUser | null;
  isSyncing: boolean;
  onSyncCurrentSheet: () => void;
  onRefreshTabs?: () => void;
  settings: GlassSettings;
  txCountsByMonth?: Record<string, number>;
}

export const GoogleSheetMonthTabBar: React.FC<GoogleSheetMonthTabBarProps> = ({
  currentSheet,
  onSelectSheet,
  availableSheets,
  onAddNewSheet,
  isGoogleConnected,
  user,
  isSyncing,
  onSyncCurrentSheet,
  settings,
  txCountsByMonth = {}
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSheetInput, setNewSheetInput] = useState('');

  const isLight = settings.themeMode === 'light' || settings.themeMode === 'beige';

  const handleCreateNewSheet = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSheetInput.trim();
    if (!clean) return;

    triggerHaptic('success');
    if (onAddNewSheet) {
      onAddNewSheet(clean);
    } else {
      onSelectSheet(clean);
    }
    setNewSheetInput('');
    setIsAddingNew(false);
  };

  const sheetsList = availableSheets && availableSheets.length > 0
    ? availableSheets
    : [currentSheet || 'SEPTEMBER'];

  return (
    <div className="w-full flex items-center justify-between gap-3 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 shadow-xs">
      {/* Month Selector Dropdown */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
          Periode:
        </span>
        <select
          value={currentSheet}
          onChange={(e) => {
            triggerHaptic('selection');
            onSelectSheet(e.target.value);
          }}
          className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer py-1 pr-2 max-w-[200px] truncate"
        >
          {sheetsList.map((sheet) => {
            const count = txCountsByMonth[sheet] || txCountsByMonth[sheet.toUpperCase()] || 0;
            return (
              <option
                key={sheet}
                value={sheet}
                className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-1"
              >
                {sheet} {count > 0 ? `(${count} tx)` : ''}
              </option>
            );
          })}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => {
            triggerHaptic('light');
            onSyncCurrentSheet();
          }}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold transition active:scale-95 disabled:opacity-50 cursor-pointer"
          title={`Sinkronkan data ${currentSheet}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-500' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Sinkron...' : 'Sync'}</span>
        </button>

        <button
          onClick={() => setIsAddingNew(true)}
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs transition active:scale-95 cursor-pointer"
          title="Tambah Bulan Baru"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Minimal Add Sheet Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Tambah Tab Bulan Baru</h4>
              <button
                onClick={() => setIsAddingNew(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateNewSheet} className="space-y-3">
              <input
                type="text"
                placeholder="Contoh: OKTOBER / November"
                value={newSheetInput}
                onChange={(e) => setNewSheetInput(e.target.value)}
                autoFocus
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-xs font-bold"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
