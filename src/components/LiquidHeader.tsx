import React from 'react';
import { ActivePage } from './NavigationTabBar';
import { GlassSettings, ThemeMode, PersistedUser } from '../types';
import { User } from 'firebase/auth';
import { triggerHaptic } from '../lib/haptics';
import {
  Menu,
  Sparkles,
  RefreshCw,
  Plus,
  Calendar,
  FolderSync,
  Sliders,
  ShieldCheck,
  Sun,
  Moon,
  ChevronDown
} from 'lucide-react';

interface LiquidHeaderProps {
  activePage: ActivePage;
  onOpenMobileSidebar: () => void;
  onOpenMenuPopup: () => void;
  onOpenProjectManager: () => void;
  onOpenCalculator: () => void;
  onNavigateToCashflow: () => void;
  settings: GlassSettings;
  onToggleTheme: () => void;
  // Google Sheets state
  currentSheetName: string;
  availableSheets?: string[];
  onSelectMonth?: (sheetName: string) => void;
  user?: User | PersistedUser | null;
  isSyncing: boolean;
  onSyncNow?: () => Promise<void>;
  txCountsByMonth?: Record<string, number>;
}

const PAGE_TITLES: Record<ActivePage, { title: string; subtitle: string }> = {
  summary: { title: 'Executive Summary', subtitle: 'Overview Portofolio & Arus Kas' },
  cashflow: { title: 'Input Cashflow', subtitle: 'Catat Pengeluaran & Pemasukan' },
  budgeting: { title: 'Budgeting Amplop', subtitle: 'Sinking Fund & Alokasi Pos' },
  portfolio: { title: 'Portofolio & Investasi', subtitle: 'Valuasi Aset, PnL & Dana Darurat' },
  accounts: { title: 'Saldo by Rekening', subtitle: 'Multi-Rekening & Transfer Saldo' },
  journal: { title: 'Jurnal & Rekap Data', subtitle: 'Tabel Mutasi Google Sheets' }
};

export const LiquidHeader: React.FC<LiquidHeaderProps> = ({
  activePage,
  onOpenMobileSidebar,
  onOpenMenuPopup,
  onOpenProjectManager,
  onOpenCalculator,
  onNavigateToCashflow,
  settings,
  onToggleTheme,
  currentSheetName,
  availableSheets = [],
  onSelectMonth,
  user,
  isSyncing,
  onSyncNow,
  txCountsByMonth = {}
}) => {
  const isDark = settings.themeMode === 'dark' || settings.themeMode === 'midnight';
  const pageInfo = PAGE_TITLES[activePage] || { title: 'Dashboard', subtitle: 'Financial Tracker' };

  return (
    <header
      className="sticky top-3 sm:top-4 z-30 rounded-3xl p-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 transition-all duration-300"
      style={{
        background: isDark
          ? 'rgba(15, 23, 42, 0.72)'
          : 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        border: isDark
          ? '1px solid rgba(255, 255, 255, 0.12)'
          : '1px solid rgba(226, 232, 240, 0.85)',
        boxShadow: isDark
          ? '0 12px 32px -8px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
          : '0 10px 30px -8px rgba(99, 102, 241, 0.08), inset 0 1.5px 1px rgba(255, 255, 255, 0.95)'
      }}
    >
      {/* Top Rim Highlight */}
      <div
        className="absolute top-0 inset-x-6 h-[1.5px] pointer-events-none"
        style={{
          background: isDark
            ? 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.95) 50%, transparent 100%)'
        }}
      />

      {/* Left: Mobile Drawer Trigger + Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenMobileSidebar();
          }}
          className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-slate-200/80 dark:border-white/15 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-sm transition active:scale-95 shrink-0"
          title="Buka Menu & Halaman"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
              {pageInfo.title}
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-400/20">
              Live
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden md:block">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Center / Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Month Selector Pill (Visible on tablet/desktop to avoid mobile redundancy with GoogleSheetMonthTabBar) */}
        {availableSheets.length > 0 && onSelectMonth ? (
          <div className="relative hidden md:flex items-center">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-slate-100/80 dark:bg-white/10 border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <select
                value={currentSheetName}
                onChange={(e) => {
                  triggerHaptic('light');
                  onSelectMonth(e.target.value);
                }}
                className="bg-transparent font-bold text-xs outline-none cursor-pointer pr-1"
              >
                {availableSheets.map((sh) => (
                  <option key={sh} value={sh} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                    {sh} {txCountsByMonth[sh] ? `(${txCountsByMonth[sh]})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>{currentSheetName}</span>
          </div>
        )}

        {/* Sync Now Action */}
        {onSyncNow && (
          <button
            onClick={() => {
              triggerHaptic('light');
              onSyncNow();
            }}
            disabled={isSyncing}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition active:scale-95 disabled:opacity-50"
            title="Tarik data terbaru dari Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sinkron...' : 'Sync'}</span>
          </button>
        )}

        {/* + Transaksi Liquid Glass Button */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onNavigateToCashflow();
          }}
          className="relative inline-flex items-center gap-1 sm:gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold !text-white text-white-force bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-indigo-500/25 transition-all duration-200 active:scale-95 group overflow-hidden shrink-0 border border-white/30 cursor-pointer"
        >
          {/* Subtle specular rim highlight */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-white/60 pointer-events-none" />
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 !text-white transition-transform duration-200 group-hover:rotate-90" />
          <span className="!text-white font-semibold tracking-tight">Tambah</span>
        </button>

        {/* Quick Menu Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenMenuPopup();
          }}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-sm transition active:scale-95 shrink-0"
          title="Buka Menu Cepat & Navigasi"
        >
          <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </header>
  );
};
