import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { GlassSettings, ThemeMode, PersistedUser } from '../types';
import { ActivePage } from './NavigationTabBar';
import { User } from 'firebase/auth';
import { triggerHaptic } from '../lib/haptics';
import {
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
  FolderSync,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Calculator,
  Moon,
  Sun,
  Palette,
  X,
  Layers,
  ArrowRight,
  Menu
} from 'lucide-react';

interface LiquidSidebarProps {
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  settings: GlassSettings;
  txCount: number;
  // Modals & Tools
  onOpenReport: () => void;
  onOpenSmartAnalysis: () => void;
  onOpenCalculator: () => void;
  onOpenProjectManager: () => void;
  onOpenSettings: () => void;
  onOpenMenuPopup: () => void;
  onToggleTheme: () => void;
  // Google Sheets state
  user?: User | PersistedUser | null;
  currentSheetName: string;
  availableSheets?: string[];
  onSelectMonth?: (sheetName: string) => void;
  isSyncing: boolean;
  onSyncNow?: () => Promise<void>;
  // Collapse state
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  // Mobile drawer state
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const LiquidSidebar: React.FC<LiquidSidebarProps> = ({
  activePage,
  onSelectPage,
  settings,
  txCount,
  onOpenReport,
  onOpenSmartAnalysis,
  onOpenCalculator,
  onOpenProjectManager,
  onOpenSettings,
  onOpenMenuPopup,
  onToggleTheme,
  user,
  currentSheetName,
  availableSheets = [],
  onSelectMonth,
  isSyncing,
  onSyncNow,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) => {
  const isDark = settings.themeMode === 'dark' || settings.themeMode === 'midnight';
  const drawerScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobileOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      if (drawerScrollRef.current) {
        drawerScrollRef.current.scrollTop = 0;
      }
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isMobileOpen]);

  const navItems = [
    {
      id: 'summary' as ActivePage,
      label: 'Ringkasan',
      sublabel: 'Executive Overview',
      icon: LayoutDashboard,
      badge: 'Utama',
      color: 'from-blue-500/20 to-indigo-500/20',
      activeText: isDark ? 'text-blue-300' : 'text-blue-600',
      iconColor: isDark ? 'text-blue-400' : 'text-blue-500'
    },
    {
      id: 'cashflow' as ActivePage,
      label: 'Input Cashflow',
      sublabel: 'Mutasi & Auto-Sync',
      icon: PlusCircle,
      badge: '+ Baru',
      color: 'from-emerald-500/20 to-teal-500/20',
      activeText: isDark ? 'text-emerald-300' : 'text-emerald-600',
      iconColor: isDark ? 'text-emerald-400' : 'text-emerald-500'
    },
    {
      id: 'budgeting' as ActivePage,
      label: 'Budgeting Amplop',
      sublabel: '4 Kantong Keuangan',
      icon: PieChart,
      badge: '4 Pos',
      color: 'from-amber-500/20 to-orange-500/20',
      activeText: isDark ? 'text-amber-300' : 'text-amber-600',
      iconColor: isDark ? 'text-amber-400' : 'text-amber-500'
    },
    {
      id: 'portfolio' as ActivePage,
      label: 'Portofolio & Aset',
      sublabel: 'Investasi & Valas',
      icon: TrendingUp,
      badge: '+2.1%',
      color: 'from-sky-500/20 to-cyan-500/20',
      activeText: isDark ? 'text-sky-300' : 'text-sky-600',
      iconColor: isDark ? 'text-sky-400' : 'text-sky-500'
    },
    {
      id: 'accounts' as ActivePage,
      label: 'Saldo Rekening',
      sublabel: 'Dompet & Antar Bank',
      icon: Landmark,
      badge: '9 Akun',
      color: 'from-purple-500/20 to-pink-500/20',
      activeText: isDark ? 'text-purple-300' : 'text-purple-600',
      iconColor: isDark ? 'text-purple-400' : 'text-purple-500'
    },
    {
      id: 'journal' as ActivePage,
      label: 'Jurnal & Rekap',
      sublabel: 'Database Transaksi',
      icon: FileSpreadsheet,
      badge: txCount > 0 ? `${txCount}` : undefined,
      color: 'from-indigo-500/20 to-blue-500/20',
      activeText: isDark ? 'text-indigo-300' : 'text-indigo-600',
      iconColor: isDark ? 'text-indigo-400' : 'text-indigo-500'
    }
  ];

  const quickTools = [
    {
      id: 'audit' as ActivePage,
      label: 'Audit Financial',
      sublabel: 'Ekspor PDF & Neraca',
      icon: FileText,
      badge: 'Audit',
      color: 'from-blue-500/20 to-cyan-500/20',
      activeText: isDark ? 'text-blue-300' : 'text-blue-600',
      iconColor: isDark ? 'text-blue-400' : 'text-blue-500'
    },
    {
      id: 'analysis' as ActivePage,
      label: 'Smart Analisis Pro',
      sublabel: 'Rebalancing & Portofolio',
      icon: Sparkles,
      badge: 'Pro',
      color: 'from-purple-500/20 to-pink-500/20',
      activeText: isDark ? 'text-purple-300' : 'text-purple-600',
      iconColor: isDark ? 'text-purple-400' : 'text-purple-500'
    },
    {
      id: 'sync' as ActivePage,
      label: 'Singkron Google Sheet',
      sublabel: 'Mutasi & Live Data',
      icon: FolderSync,
      badge: 'Live',
      color: 'from-indigo-500/20 to-blue-500/20',
      activeText: isDark ? 'text-indigo-300' : 'text-indigo-600',
      iconColor: isDark ? 'text-indigo-400' : 'text-indigo-500'
    },
    {
      id: 'theme' as ActivePage,
      label: 'Custom Theme',
      sublabel: 'Liquid Glass & Presets',
      icon: Sliders,
      badge: undefined,
      color: 'from-amber-500/20 to-yellow-500/20',
      activeText: isDark ? 'text-amber-300' : 'text-amber-600',
      iconColor: isDark ? 'text-amber-400' : 'text-amber-500'
    }
  ];

  // Render Inner Content of the Liquid Glass Sidebar
  const renderSidebarContent = (inMobileDrawer: boolean = false) => {
    const collapsed = inMobileDrawer ? false : isCollapsed;

    return (
      <div className="h-full flex flex-col justify-between select-none relative z-20">
        {/* Top Header / App Brand */}
        <div className="shrink-0 p-4 pb-3 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center justify-between min-w-0">
            {(!collapsed || inMobileDrawer) ? (
              <div className="flex items-center justify-between w-full min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold tracking-tight truncate text-slate-900 dark:text-white">
                      Budgeting
                    </h2>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-400/25 shrink-0">
                      PRO
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${user ? 'bg-emerald-500 shadow-xs shadow-emerald-500/40' : 'bg-amber-400'}`} />
                    <span className="truncate">{user ? 'Cloud Sheets Active' : 'Offline / Standalone'}</span>
                  </p>
                </div>

                {inMobileDrawer ? (
                  <button
                    onClick={onCloseMobile}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-600 dark:text-slate-300 transition shrink-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onToggleCollapse}
                    title="Ciutkan Sidebar"
                    className="hidden lg:flex w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 transition active:scale-95 shrink-0 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              /* When collapsed: Removed colliding KF logo, center the toggle button alone */
              <div className="w-full flex items-center justify-center py-0.5">
                <button
                  onClick={onToggleCollapse}
                  title="Perluas Sidebar"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-300 border border-slate-200/80 dark:border-white/15 shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Month Indicator & Sync Button in Sidebar (Clean Spacing & No Collisions) */}
          {(!collapsed || inMobileDrawer) && (
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider shrink-0">
                  Bulan:
                </span>

                <div className="flex-1 min-w-0">
                  {availableSheets.length > 0 && onSelectMonth ? (
                    <div className="relative flex items-center">
                      <select
                        value={currentSheetName}
                        onChange={(e) => {
                          triggerHaptic('light');
                          onSelectMonth(e.target.value);
                        }}
                        className="w-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100/90 dark:bg-white/10 hover:bg-slate-200/70 dark:hover:bg-white/15 border border-slate-200/90 dark:border-white/15 rounded-xl pl-2.5 pr-6 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 transition appearance-none truncate"
                      >
                        {availableSheets.map((sh) => (
                          <option key={sh} value={sh} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-medium">
                            {sh}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2 rotate-90" />
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 px-2.5 py-1.5 bg-slate-100/90 dark:bg-white/10 border border-slate-200/90 dark:border-white/15 rounded-xl truncate">
                      {currentSheetName}
                    </div>
                  )}
                </div>

                {onSyncNow && (
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      onSyncNow();
                    }}
                    disabled={isSyncing}
                    title="Sinkronisasi dengan Google Sheet"
                    className="shrink-0 p-2 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-600 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 dark:text-blue-300 border border-blue-200/80 dark:border-blue-400/30 shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Middle Section */}
        <div
          ref={inMobileDrawer ? drawerScrollRef : undefined}
          className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-6"
        >
          {/* Main Pages Group */}
          <div>
            {(!collapsed || inMobileDrawer) && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-3 block mb-1.5 ${
                isDark ? 'text-slate-300' : 'text-slate-500'
              }`}>
                Halaman Utama
              </span>
            )}

            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = activePage === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      triggerHaptic('light');
                      onSelectPage(item.id);
                      if (inMobileDrawer) onCloseMobile();
                    }}
                    title={item.label}
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group text-left ${
                      isActive
                        ? isDark
                          ? '!text-white text-white-force font-bold'
                          : 'text-slate-900 font-bold'
                        : isDark
                          ? 'text-slate-200 hover:!text-white hover:text-white-force hover:bg-white/10'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    } ${collapsed && !inMobileDrawer ? 'justify-center px-2' : ''}`}
                  >
                    {/* Active Sliding Liquid Glass Pill Background */}
                    {isActive && (
                      <motion.div
                        layoutId="active-sidebar-pill"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                          background: isDark
                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(147, 51, 234, 0.3) 100%)'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 246, 255, 0.95) 100%)',
                          border: isDark
                            ? '1px solid rgba(147, 197, 253, 0.45)'
                            : '1px solid rgba(203, 213, 225, 0.8)',
                          boxShadow: isDark
                            ? '0 8px 24px -4px rgba(59, 130, 246, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
                            : '0 8px 20px -4px rgba(99, 102, 241, 0.12), inset 0 1.5px 1px rgba(255, 255, 255, 1)'
                        }}
                      />
                    )}

                    {/* Left Icon with subtle 3D highlight */}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isActive
                          ? 'scale-105 bg-blue-500/20 dark:bg-white/20'
                          : 'group-hover:scale-105'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 ${isActive ? item.iconColor : isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-500'}`} />
                    </div>

                    {/* Text labels (hidden when collapsed) */}
                    {(!collapsed || inMobileDrawer) && (
                      <div className="relative z-10 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs truncate ${
                            isActive
                              ? isDark ? '!text-white text-white-force font-bold' : 'text-slate-900 font-bold'
                              : isDark ? 'text-slate-100 group-hover:!text-white font-medium' : 'text-slate-700 font-medium'
                          }`}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 border transition-colors ${
                                isActive
                                  ? 'bg-blue-600 !text-white text-white-force border-blue-600 shadow-xs'
                                  : isDark
                                    ? 'bg-white/15 !text-white text-white-force border-white/20'
                                    : 'bg-slate-100 text-slate-700 border-slate-200/80'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] truncate block ${
                          isDark ? 'text-slate-300 group-hover:text-slate-100' : 'text-slate-400'
                        }`}>
                          {item.sublabel}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Tools & Utilities Group */}
          <div>
            {(!collapsed || inMobileDrawer) && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-3 block mb-1.5 ${
                isDark ? 'text-slate-300' : 'text-slate-500'
              }`}>
                Alat & Laporan
              </span>
            )}

            <div className="space-y-1">
              {/* Kalkulator Investasi (Pindahan dari Halaman Utama - Isi Lengkap & Active State) */}
              {(() => {
                const isCalcActive = activePage === 'calculator';
                return (
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      onSelectPage('calculator');
                      if (inMobileDrawer) onCloseMobile();
                    }}
                    title="Kalkulator Investasi (Dana Pensiun & 4% Rule)"
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group text-left ${
                      isCalcActive
                        ? isDark
                          ? '!text-white text-white-force font-bold'
                          : 'text-slate-900 font-bold'
                        : isDark
                          ? 'text-slate-200 hover:!text-white hover:text-white-force hover:bg-white/10'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    } ${collapsed && !inMobileDrawer ? 'justify-center px-2' : ''}`}
                  >
                    {/* Active Sliding Liquid Glass Pill Background */}
                    {isCalcActive && (
                      <motion.div
                        layoutId="active-sidebar-pill"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                          background: isDark
                            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(217, 119, 6, 0.25) 100%)'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(254, 243, 199, 0.95) 100%)',
                          border: isDark
                            ? '1px solid rgba(251, 191, 36, 0.5)'
                            : '1px solid rgba(245, 158, 11, 0.5)',
                          boxShadow: isDark
                            ? '0 8px 24px -4px rgba(245, 158, 11, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
                            : '0 8px 20px -4px rgba(245, 158, 11, 0.15), inset 0 1.5px 1px rgba(255, 255, 255, 1)'
                        }}
                      />
                    )}

                    {/* Left Icon with subtle 3D highlight */}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isCalcActive
                          ? 'scale-105 bg-amber-500/25 dark:bg-amber-500/30'
                          : 'group-hover:scale-105 bg-amber-500/10 dark:bg-white/10'
                      }`}
                    >
                      <Calculator className={`w-4.5 h-4.5 ${isCalcActive ? 'text-amber-500 dark:text-amber-400' : isDark ? 'text-amber-400 group-hover:text-amber-300' : 'text-amber-600'}`} />
                    </div>

                    {/* Text labels (hidden when collapsed) */}
                    {(!collapsed || inMobileDrawer) && (
                      <div className="relative z-10 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs truncate ${
                            isCalcActive
                              ? isDark ? '!text-white text-white-force font-bold' : 'text-slate-900 font-bold'
                              : isDark ? 'text-slate-100 group-hover:!text-white font-medium' : 'text-slate-800 font-semibold'
                          }`}>
                            Kalkulator Investasi
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 border transition-colors ${
                              isCalcActive
                                ? 'bg-amber-500 !text-white text-white-force border-amber-500 shadow-xs'
                                : isDark
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            }`}
                          >
                            4% Rule
                          </span>
                        </div>
                        <span className={`text-[10px] truncate block ${
                          isDark ? 'text-slate-300 group-hover:text-slate-100' : 'text-slate-500'
                        }`}>
                          Dana Pensiun & 4% Rule
                        </span>
                      </div>
                    )}
                  </button>
                );
              })()}

              {quickTools.map((tool) => {
                const Icon = tool.icon;
                const isToolActive = activePage === tool.id;

                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      triggerHaptic('light');
                      onSelectPage(tool.id);
                      if (inMobileDrawer) onCloseMobile();
                    }}
                    title={tool.label}
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group text-left ${
                      isToolActive
                        ? isDark
                          ? '!text-white text-white-force font-bold'
                          : 'text-slate-900 font-bold'
                        : isDark
                          ? 'text-slate-200 hover:!text-white hover:text-white-force hover:bg-white/10'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    } ${collapsed && !inMobileDrawer ? 'justify-center px-2' : ''}`}
                  >
                    {/* Active Sliding Liquid Glass Pill Background */}
                    {isToolActive && (
                      <motion.div
                        layoutId="active-sidebar-pill"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                          background: isDark
                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(147, 51, 234, 0.3) 100%)'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 246, 255, 0.95) 100%)',
                          border: isDark
                            ? '1px solid rgba(147, 197, 253, 0.45)'
                            : '1px solid rgba(203, 213, 225, 0.8)',
                          boxShadow: isDark
                            ? '0 8px 24px -4px rgba(59, 130, 246, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
                            : '0 8px 20px -4px rgba(99, 102, 241, 0.12), inset 0 1.5px 1px rgba(255, 255, 255, 1)'
                        }}
                      />
                    )}

                    {/* Left Icon with subtle 3D highlight */}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isToolActive
                          ? 'scale-105 bg-blue-500/20 dark:bg-white/20'
                          : 'group-hover:scale-105'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 ${isToolActive ? tool.iconColor : isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-500'}`} />
                    </div>

                    {/* Text labels (hidden when collapsed) */}
                    {(!collapsed || inMobileDrawer) && (
                      <div className="relative z-10 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs truncate ${
                            isToolActive
                              ? isDark ? '!text-white text-white-force font-bold' : 'text-slate-900 font-bold'
                              : isDark ? 'text-slate-100 group-hover:!text-white font-medium' : 'text-slate-700 font-medium'
                          }`}>
                            {tool.label}
                          </span>
                          {tool.badge && (
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 border transition-colors ${
                                isToolActive
                                  ? 'bg-blue-600 !text-white text-white-force border-blue-600 shadow-xs'
                                  : isDark
                                    ? 'bg-white/15 !text-white text-white-force border-white/20'
                                    : 'bg-slate-100 text-slate-700 border-slate-200/80'
                              }`}
                            >
                              {tool.badge}
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] truncate block ${
                          isDark ? 'text-slate-300 group-hover:text-slate-100' : 'text-slate-400'
                        }`}>
                          {tool.sublabel}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar / Quick Profile & Theme Switcher */}
        <div className="shrink-0 p-3 border-t border-slate-200/60 dark:border-white/10 space-y-2">
          {(!collapsed || inMobileDrawer) ? (
            <div
              className="flex items-center justify-between gap-2 p-2.5 rounded-2xl relative overflow-hidden transition-all"
              style={
                isDark
                  ? {
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                      backdropFilter: 'blur(24px) saturate(190%)',
                      WebkitBackdropFilter: 'blur(24px) saturate(190%)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.4), inset 0 1px 1.5px rgba(255, 255, 255, 0.25), inset 0 -1px 1px rgba(0, 0, 0, 0.3)'
                    }
                  : {
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.65) 100%)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(226, 232, 240, 0.9)',
                      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
                    }
              }
            >
              {/* Subtle top specular highlight */}
              <div
                className="absolute top-0 inset-x-2 h-[1px] pointer-events-none"
                style={{
                  background: isDark
                    ? 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)'
                    : 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.9) 50%, transparent 100%)'
                }}
              />

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'K'}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${
                    isDark ? '!text-white text-white-force' : 'text-slate-900'
                  }`}>
                    {user?.displayName || 'Kelvin Gautama'}
                  </p>
                  <p className={`text-[10px] truncate ${
                    isDark ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {user?.email || 'Standalone Mode'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onToggleTheme();
                  }}
                  title="Ganti Tema (Light / Dark)"
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-transparent dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 transition"
                >
                  {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                </button>

                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onOpenMenuPopup();
                  }}
                  title="Buka Menu Lengkap"
                  className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 dark:bg-white/10 dark:hover:bg-white/20 border border-transparent dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-sky-300 transition"
                >
                  <Menu className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onToggleTheme();
                }}
                title="Ganti Tema"
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 flex items-center justify-center text-slate-600 dark:text-slate-300 transition"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenMenuPopup();
                }}
                title="Buka Menu Lengkap"
                className="w-8 h-8 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 transition"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. DESKTOP PERMANENT / COLLAPSIBLE LIQUID GLASS SIDEBAR */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 76 : 260
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="hidden lg:block shrink-0 h-full max-h-[calc(100vh-2rem)] rounded-3xl relative overflow-hidden transition-all duration-300 select-none"
        style={{
          background: isDark
            ? 'rgba(15, 23, 42, 0.72)'
            : 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(30px) saturate(190%)',
          WebkitBackdropFilter: 'blur(30px) saturate(190%)',
          border: isDark
            ? '1px solid rgba(255, 255, 255, 0.12)'
            : '1px solid rgba(226, 232, 240, 0.85)',
          boxShadow: isDark
            ? '0 20px 50px -12px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
            : '0 16px 40px -12px rgba(99, 102, 241, 0.1), inset 0 1.5px 1px rgba(255, 255, 255, 0.95)'
        }}
      >
        {/* Top Rim Specular Glare Reflection */}
        <div
          className="absolute top-0 inset-x-4 h-[1.5px] pointer-events-none z-30"
          style={{
            background: isDark
              ? 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.95) 50%, transparent 100%)'
          }}
        />

        {renderSidebarContent(false)}
      </motion.aside>

      {/* 2. MOBILE SLIDE-OVER LIQUID GLASS DRAWER (PORTAL TO DOCUMENT.BODY) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isMobileOpen && (
            <div className="fixed inset-0 z-[9999] lg:hidden w-screen h-[100dvh] overflow-hidden">
              {/* Backdrop with soft blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={onCloseMobile}
                className="absolute inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm"
              />

              {/* Slide-out Drawer Panel */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                className="absolute top-0 bottom-0 left-0 w-[295px] max-w-[85vw] h-full p-2 flex flex-col"
              >
                <div
                  className="w-full h-full rounded-3xl relative overflow-hidden flex flex-col shadow-2xl"
                  style={{
                    background: isDark
                      ? 'rgba(11, 15, 29, 0.96)'
                      : 'rgba(255, 255, 255, 0.96)',
                    backdropFilter: 'blur(32px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                    border: isDark
                      ? '1px solid rgba(255, 255, 255, 0.18)'
                      : '1px solid rgba(226, 232, 240, 0.95)',
                    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), inset 0 1.5px 1px rgba(255, 255, 255, 0.9)'
                  }}
                >
                  {/* Top Rim Highlight */}
                  <div
                    className="absolute top-0 inset-x-6 h-[1.5px] pointer-events-none z-30"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.9) 50%, transparent 100%)'
                    }}
                  />

                  {renderSidebarContent(true)}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
