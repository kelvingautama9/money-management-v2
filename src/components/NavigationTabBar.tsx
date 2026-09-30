import React from 'react';
import { GlassSettings, ActivePage } from '../types';
import { triggerHaptic } from '../lib/haptics';
import {
  LayoutDashboard,
  PlusCircle,
  PieChart,
  TrendingUp,
  Landmark,
  CandlestickChart
} from 'lucide-react';

export type { ActivePage };

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
  settings
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

  // 5 Main Navigation Items
  const navTabs: { id: ActivePage; label: string; icon: React.ReactNode }[] = [
    {
      id: 'summary',
      label: 'Ringkasan',
      icon: <LayoutDashboard className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
    },
    {
      id: 'cashflow',
      label: 'Mutasi',
      icon: <PlusCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
    },
    {
      id: 'budgeting',
      label: 'Dompet',
      icon: <PieChart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
    },
    {
      id: 'portfolio',
      label: 'Portofolio',
      icon: <TrendingUp className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
    },
    {
      id: 'accounts',
      label: 'Saldo',
      icon: <Landmark className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
    },
    {
      id: 'investing',
      label: 'Investing',
      icon: <CandlestickChart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
    }
  ];

  return (
    <aside
      aria-label="Bottom Navigation Bar"
      className="fixed bottom-3 sm:bottom-5 inset-x-0 z-40 flex items-center justify-center px-3 pointer-events-none transition-all duration-300 pb-[max(0.25rem,env(safe-area-inset-bottom))]"
    >
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
                onSelectPage(tab.id);
              }}
              className={`relative flex items-center justify-center rounded-full py-2 px-3 sm:px-3.5 transition-all duration-200 focus:outline-none touch-manipulation group ${
                isActive ? activeTextClass : inactiveTextClass
              }`}
            >
              {isActive && (
                <div
                  className={`absolute inset-0 rounded-full ${activePillBg} transition-all duration-300 animate-in fade-in zoom-in-95 duration-200`}
                />
              )}

              <span className="relative z-10 flex items-center gap-1.5">
                <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">
                  {tab.icon}
                </span>

                {isActive && (
                  <span className="text-xs font-bold tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-1 duration-200">
                    {tab.label}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

