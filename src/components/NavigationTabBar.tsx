import React from 'react';
import { GlassSettings } from '../types';
import { triggerHaptic } from '../lib/haptics';
import {
  LayoutDashboard,
  PieChart,
  TrendingUp,
  Landmark,
  Menu,
  Plus
} from 'lucide-react';

export type ActivePage = 'summary' | 'cashflow' | 'budgeting' | 'portfolio' | 'accounts' | 'journal' | 'calculator';

interface NavigationTabBarProps {
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  settings: GlassSettings;
  txCount?: number;
  onOpenMenu?: () => void;
  onOpenProjectManager?: () => void;
  onToggleTheme?: () => void;
}

export const NavigationTabBar: React.FC<NavigationTabBarProps> = ({
  activePage,
  onSelectPage,
  settings,
  onOpenMenu,
  onOpenProjectManager,
  onToggleTheme
}) => {
  const currentTheme = settings.themeMode || 'dark';

  let pillBg = 'rgba(12, 16, 32, 0.86)';
  let pillBorder = 'rgba(255, 255, 255, 0.14)';
  let pillShadow = '0 12px 36px -4px rgba(0, 0, 0, 0.65), 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)';
  let activePillBg = 'bg-white/18 text-white border border-white/25 shadow-md shadow-black/20';
  let activeTextClass = 'text-white';
  let inactiveTextClass = 'text-slate-400 hover:text-slate-200';

  if (currentTheme === 'light') {
    pillBg = 'rgba(255, 255, 255, 0.92)';
    pillBorder = 'rgba(226, 232, 240, 0.9)';
    pillShadow = '0 12px 30px -4px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.95)';
    activePillBg = 'bg-slate-900 text-white shadow-md';
    activeTextClass = 'text-white';
    inactiveTextClass = 'text-slate-500 hover:text-slate-800';
  } else if (currentTheme === 'beige') {
    pillBg = 'rgba(255, 253, 248, 0.94)';
    pillBorder = 'rgba(223, 213, 198, 0.95)';
    pillShadow = '0 12px 30px -4px rgba(60, 45, 30, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.95)';
    activePillBg = 'bg-[#2e261f] text-[#fdfbf7] shadow-md';
    activeTextClass = 'text-[#fdfbf7]';
    inactiveTextClass = 'text-[#877868] hover:text-[#2e261f]';
  } else if (currentTheme === 'midnight') {
    pillBg = 'rgba(4, 6, 12, 0.95)';
    pillBorder = 'rgba(255, 255, 255, 0.16)';
    pillShadow = '0 12px 36px -4px rgba(0, 0, 0, 0.9), inset 0 1px 1px rgba(255, 255, 255, 0.25)';
    activePillBg = 'bg-white/20 text-white border border-white/30 shadow-md';
    activeTextClass = 'text-white';
    inactiveTextClass = 'text-slate-400 hover:text-slate-200';
  }

  // 5 Main Navigation Items inside the Glass Pill (perfect odd symmetry & center balance)
  const navTabs: { id: ActivePage | 'menu'; label: string; icon: React.ReactNode; isAction?: boolean }[] = [
    {
      id: 'summary',
      label: 'Home',
      icon: <LayoutDashboard className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
    },
    {
      id: 'budgeting',
      label: 'Budget',
      icon: <PieChart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
    },
    {
      id: 'portfolio',
      label: 'Invest',
      icon: <TrendingUp className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
    },
    {
      id: 'accounts',
      label: 'Dompet',
      icon: <Landmark className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      isAction: true
    }
  ];

  const isCashflowActive = activePage === 'cashflow';

  return (
    <aside
      aria-label="Split Glass Bottom Navigation Bar"
      className="fixed bottom-3 sm:bottom-5 inset-x-0 z-40 flex items-center justify-center gap-2 sm:gap-3 px-3 pointer-events-none transition-all duration-300 pb-[max(0.25rem,env(safe-area-inset-bottom))]"
    >
      {/* 1. MAIN GLASS CAPSULE DOCK (Contains the 5 Navigation tabs with sliding liquid indicator) */}
      <div
        style={{
          background: pillBg,
          borderColor: pillBorder,
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          boxShadow: pillShadow
        }}
        className="pointer-events-auto flex items-center p-1.5 rounded-full border transition-all duration-300"
      >
        {navTabs.map((tab) => {
          const isActive = tab.id === activePage;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                if (tab.isAction) {
                  onOpenMenu?.();
                } else {
                  onSelectPage(tab.id as ActivePage);
                }
              }}
              className={`relative flex items-center justify-center rounded-full py-2 px-3 sm:px-3.5 transition-all duration-200 focus:outline-none touch-manipulation group ${
                isActive ? activeTextClass : inactiveTextClass
              }`}
            >
              {/* Liquid Sliding Indicator Pill */}
              {isActive && (
                <div
                  className={`absolute inset-0 rounded-full ${activePillBg} transition-all duration-300 animate-in fade-in zoom-in-95 duration-200`}
                />
              )}

              {/* Tab Content (Icon + dynamic label when active) */}
              <span className="relative z-10 flex items-center gap-1.5">
                <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">
                  {tab.icon}
                </span>

                {isActive && (
                  <span
                    className="text-xs font-bold tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-1 duration-200"
                  >
                    {tab.label}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. SPLIT GLASS FLOATING ACTION BUTTON (+) (Asymmetrical Modern Split Navigation from Image 4) */}
      <button
        onClick={() => {
          triggerHaptic('medium');
          onSelectPage('cashflow');
        }}
        aria-label="Input Transaksi Baru"
        className={`pointer-events-auto relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 active:scale-95 focus:outline-none touch-manipulation group ${
          isCashflowActive
            ? 'scale-105 ring-2 ring-rose-400/80 ring-offset-2 ring-offset-black/60 shadow-xl shadow-rose-500/50'
            : 'hover:scale-105 hover:shadow-rose-500/40'
        }`}
        style={{
          background: 'linear-gradient(135deg, #f43f5e 0%, #d946ef 50%, #6366f1 100%)',
          boxShadow: isCashflowActive
            ? '0 8px 24px -2px rgba(244, 63, 94, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.4)'
            : '0 8px 20px -2px rgba(244, 63, 94, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.35)'
        }}
      >
        {/* Soft Ambient Glow Halo behind the button */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-500 to-fuchsia-500 blur-md opacity-40 group-hover:opacity-70 transition-opacity -z-10" />

        <Plus className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${
          isCashflowActive ? 'rotate-90 scale-110' : 'group-hover:rotate-45'
        }`} />
      </button>
    </aside>
  );
};

