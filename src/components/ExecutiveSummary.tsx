import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GlassContainer } from './GlassContainer';
import { InteractiveGlossyCard } from './InteractiveGlossyCard';
import { GlassSettings, BudgetCategory, AccountBalance, Transaction, InvestmentAsset, InvestmentHistory } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  PlusCircle,
  ArrowLeftRight,
  PieChart,
  RefreshCw,
  ChevronRight,
  CreditCard,
  Building2,
  Sparkles,
  Zap,
  Coffee,
  Heart,
  Car,
  TrendingUp,
  LineChart,
  FileSpreadsheet,
  Calculator
} from 'lucide-react';

interface ExecutiveSummaryProps {
  totalAset: number;
  cashStandbyDanaDarurat: number;
  totalInvestment: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  sisaSaldoIncome: number;
  settings: GlassSettings;
  budgets?: BudgetCategory[];
  accounts?: AccountBalance[];
  transactions?: Transaction[];
  assets?: InvestmentAsset[];
  history?: InvestmentHistory[];
  onNavigate?: (page: 'summary' | 'cashflow' | 'budgeting' | 'portfolio' | 'accounts' | 'journal') => void;
  onSyncGoogleSheets?: () => void;
  onOpenProjectManager?: () => void;
  onOpenCalculator?: () => void;
  isSyncing?: boolean;
  currentMonthSheet?: string;
  availableSheets?: string[];
  onSelectMonthSheet?: (name: string) => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  totalAset,
  cashStandbyDanaDarurat,
  totalInvestment,
  totalPemasukan,
  totalPengeluaran,
  sisaSaldoIncome,
  settings,
  budgets = [],
  accounts = [],
  transactions = [],
  assets = [],
  history = [],
  onNavigate,
  onSyncGoogleSheets,
  onOpenProjectManager,
  onOpenCalculator,
  isSyncing = false,
  currentMonthSheet = 'SEPTEMBER',
  availableSheets = [],
  onSelectMonthSheet
}) => {
  const [hideBalance, setHideBalance] = useState(false);
  const isDark = settings.themeMode !== 'light' && settings.themeMode !== 'beige';
  const [centerWalletIndex, setCenterWalletIndex] = useState(0);
  const walletScrollRef = useRef<HTMLDivElement>(null);

  // Dynamic center detection for cascade magnification effect
  const updateCenterWallet = useCallback(() => {
    if (!walletScrollRef.current) return;
    const container = walletScrollRef.current;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    const children = Array.from(container.children) as HTMLElement[];
    let closestIndex = 0;
    let minDistance = Infinity;

    children.forEach((child, index) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(containerCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    setCenterWalletIndex(closestIndex);
  }, []);

  useEffect(() => {
    const container = walletScrollRef.current;
    if (!container) return;
    updateCenterWallet();
    container.addEventListener('scroll', updateCenterWallet, { passive: true });
    window.addEventListener('resize', updateCenterWallet);
    return () => {
      container.removeEventListener('scroll', updateCenterWallet);
      window.removeEventListener('resize', updateCenterWallet);
    };
  }, [updateCenterWallet, accounts.length]);

  const scrollToWallet = (index: number) => {
    if (!walletScrollRef.current) return;
    const container = walletScrollRef.current;
    const child = container.children[index] as HTMLElement;
    if (child) {
      triggerHaptic('selection');
      child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const spendRatio = totalPemasukan > 0 ? ((totalPengeluaran / totalPemasukan) * 100).toFixed(1) : '0';
  const saveRatio = totalPemasukan > 0 ? ((sisaSaldoIncome / totalPemasukan) * 100).toFixed(1) : '0';

  // Format balance with privacy mask
  const displayMoney = (amount: number) => {
    if (hideBalance) return '••••••••';
    return formatRupiah(amount);
  };

  // Quick category icon helper
  const getCategoryIcon = (kategori: string) => {
    const k = kategori.toLowerCase();
    if (k.includes('listrik')) return <Zap className="w-4 h-4 text-amber-400" />;
    if (k.includes('transport')) return <Car className="w-4 h-4 text-blue-400" />;
    if (k.includes('dating')) return <Heart className="w-4 h-4 text-pink-400" />;
    if (k.includes('jajan') || k.includes('makan')) return <Coffee className="w-4 h-4 text-orange-400" />;
    return <CreditCard className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* HERO SECTION: Large Balance & Dual Frosted Cards (As in Image 3 & 4) */}
      <GlassContainer settings={settings} className="p-5 sm:p-8 relative overflow-hidden w-full max-w-full min-w-0">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full min-w-0">
          {/* Top Label & Actions (Rekapan September badge removed to save space and clean UI) */}
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Total Kekayaan Bersih (Net Worth)
            </span>
            <div className="flex items-center gap-2">
              {onOpenCalculator && (
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    onOpenCalculator();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 shadow-xs ${
                    isDark
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border-emerald-400/30 text-emerald-300'
                      : 'bg-emerald-100 hover:bg-emerald-200/90 border-emerald-300 text-emerald-950 font-bold'
                  }`}
                  title="Buka Kalkulator Pensiun & Target Finansial"
                >
                  <Calculator className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`} />
                  <span className={`hidden sm:inline ${isDark ? 'text-emerald-300' : 'text-emerald-950 font-bold'}`}>Kalkulator Pensiun</span>
                </button>
              )}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setHideBalance(!hideBalance);
                }}
                className={`p-2 rounded-xl border transition ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
                }`}
                title={hideBalance ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
              >
                {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Big Hero Number */}
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <h1 className={`text-3xl sm:text-5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {displayMoney(totalAset)}
            </h1>
            <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 inline-flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +Rp 1.148.790 MoM (+2.1%)
            </span>
          </div>

          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Kas Cair & Dana Darurat: <strong className={isDark ? "text-slate-200" : "text-slate-900"}>{displayMoney(cashStandbyDanaDarurat)}</strong> • Portofolio Investasi: <strong className={isDark ? "text-sky-300" : "text-sky-700 font-bold"}>{displayMoney(totalInvestment)}</strong>
          </p>

          {/* SPLIT ROW: INCOME (LEFT) & PENGELUARAN (RIGHT), THEN FULL-WIDTH PORTOFOLIO INVESTASI BELOW */}
          <div className="space-y-3 sm:space-y-4 mt-6 w-full min-w-0">
            {/* Top Row: 2-Column Split (Income vs Pengeluaran) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 w-full">
              {/* 1. Income Card (Left) */}
              <InteractiveGlossyCard
                accentColor="emerald"
                isDark={isDark}
                contentClassName="p-3.5 sm:p-5"
              >
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30' : 'bg-emerald-500/20 text-emerald-500'
                    }`}>
                      <ArrowDownLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <span
                      className={`text-[11px] sm:text-xs font-semibold truncate ${isDark ? '!text-white text-white' : 'text-slate-700'}`}
                      style={{ color: isDark ? '#ffffff' : undefined }}
                    >
                      Income Bulanan
                    </span>
                  </div>
                  <h3
                    className={`text-base sm:text-2xl font-bold tracking-tight truncate ${isDark ? '!text-white text-white' : 'text-slate-900'}`}
                    style={{ color: isDark ? '#ffffff' : undefined }}
                  >
                    {displayMoney(totalPemasukan)}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${
                        isDark
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                          : 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30'
                      }`}
                    >
                      ▲ 100% Gaji
                    </span>
                    <span className={`text-[10px] sm:text-[11px] capitalize font-medium hidden sm:inline ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      {currentMonthSheet.toLowerCase()} 2026
                    </span>
                  </div>
                </div>

                {/* Mint Sparkline Wave */}
                <div className="mt-2 sm:mt-4 pt-1 sm:pt-2">
                  <svg className="w-full h-8 sm:h-12 overflow-visible" viewBox="0 0 200 40">
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={isDark ? "0.35" : "0.22"} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 35 Q 30 30, 60 25 T 120 18 T 170 10 T 200 5 L 200 40 L 0 40 Z"
                      fill="url(#incomeGradient)"
                    />
                    <path
                      d="M 0 35 Q 30 30, 60 25 T 120 18 T 170 10 T 200 5"
                      fill="none"
                      stroke={isDark ? "#34D399" : "#059669"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </InteractiveGlossyCard>

              {/* 2. Spendings Card (Right) */}
              <InteractiveGlossyCard
                accentColor="rose"
                isDark={isDark}
                contentClassName="p-3.5 sm:p-5"
              >
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-rose-500/15 text-rose-300 border border-rose-400/30' : 'bg-rose-500/20 text-rose-500'
                    }`}>
                      <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <span
                      className={`text-[11px] sm:text-xs font-semibold truncate ${isDark ? '!text-white text-white' : 'text-slate-700'}`}
                      style={{ color: isDark ? '#ffffff' : undefined }}
                    >
                      Total Pengeluaran
                    </span>
                  </div>
                  <h3
                    className={`text-base sm:text-2xl font-bold tracking-tight truncate ${isDark ? '!text-white text-white' : 'text-rose-600'}`}
                    style={{ color: isDark ? '#ffffff' : undefined }}
                  >
                    {displayMoney(totalPengeluaran)}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${
                        isDark
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-400/30'
                          : 'bg-rose-500/20 text-rose-700 border border-rose-500/30'
                      }`}
                    >
                      {spendRatio}% Anggaran
                    </span>
                    <span className={`text-[10px] sm:text-[11px] truncate ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Sisa: <strong className={isDark ? "text-emerald-300 font-bold" : "text-emerald-600"}>{displayMoney(sisaSaldoIncome)}</strong>
                    </span>
                  </div>
                </div>

                {/* Coral/Orange Sparkline Wave */}
                <div className="mt-2 sm:mt-4 pt-1 sm:pt-2">
                  <svg className="w-full h-8 sm:h-12 overflow-visible" viewBox="0 0 200 40">
                    <defs>
                      <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F43F5E" stopOpacity={isDark ? "0.35" : "0.22"} />
                        <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 35 Q 40 28, 70 32 T 130 20 T 170 14 T 200 8 L 200 40 L 0 40 Z"
                      fill="url(#spendGradient)"
                    />
                    <path
                      d="M 0 35 Q 40 28, 70 32 T 130 20 T 170 14 T 200 8"
                      fill="none"
                      stroke={isDark ? "#FB7185" : "#E11D48"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </InteractiveGlossyCard>
            </div>

            {/* Bottom Row: Full-Width Portofolio Investasi Card */}
            <InteractiveGlossyCard
              accentColor="sky"
              isDark={isDark}
              onClick={() => onNavigate?.('portfolio')}
              contentClassName="p-4 sm:p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-sky-500/15 text-sky-300 border border-sky-400/30' : 'bg-sky-500/20 text-sky-500'
                    }`}>
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-semibold ${isDark ? '!text-white text-white' : 'text-slate-700'}`}
                      style={{ color: isDark ? '#ffffff' : undefined }}
                    >
                      Portofolio Investasi
                    </span>
                  </div>
                  <h3
                    className={`text-xl sm:text-3xl font-bold tracking-tight ${isDark ? '!text-white text-white' : 'text-sky-600'}`}
                    style={{ color: isDark ? '#ffffff' : undefined }}
                  >
                    {displayMoney(totalInvestment)}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isDark
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-400/30'
                          : 'bg-sky-500/20 text-sky-700 border border-sky-500/30'
                      }`}
                    >
                      <LineChart className="w-3 h-3" />
                      +3.90% MoM
                    </span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Pluang • Valas • USDT • Emas
                    </span>
                  </div>
                </div>

                <div
                  className={`hidden sm:flex items-center gap-1 text-xs font-semibold transition-colors ${
                    isDark ? 'text-sky-300 hover:text-sky-200' : 'text-sky-600 hover:text-sky-500'
                  }`}
                  style={{ color: isDark ? '#7dd3fc' : undefined }}
                >
                  <span>Lihat Detail</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>

              {/* Glowing Sky Blue Sparkline Wave for Investment Growth */}
              <div className="mt-3 sm:mt-4 pt-1 sm:pt-2">
                <svg className="w-full h-10 sm:h-14 overflow-visible" viewBox="0 0 200 40">
                  <defs>
                    <linearGradient id="investGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284C7" stopOpacity={isDark ? "0.35" : "0.20"} />
                      <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Data points reflecting growth: 48.5M -> 49.1M -> 50.0M -> 48.8M -> 51.7M -> 53.7M */}
                  <path
                    d="M 0 32 Q 35 29, 70 24 T 120 28 T 165 14 T 200 4 L 200 40 L 0 40 Z"
                    fill="url(#investGradient)"
                  />
                  <path
                    d="M 0 32 Q 35 29, 70 24 T 120 28 T 165 14 T 200 4"
                    fill="none"
                    stroke={isDark ? "#38BDF8" : "#0284C7"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </InteractiveGlossyCard>
          </div>
        </div>
      </GlassContainer>

      {/* QUICK ACTIONS ROW (Image 4 Clean Interface Match) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full min-w-0">
        <button
          onClick={() => {
            triggerHaptic('selection');
            onNavigate?.('cashflow');
          }}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 transition-all text-left active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block leading-tight">Input Transaksi</span>
            <span className="text-[10px] text-slate-400">Auto-sync Sheet</span>
          </div>
        </button>

        <button
          onClick={() => {
            triggerHaptic('selection');
            onNavigate?.('accounts');
          }}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 transition-all text-left active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block leading-tight">Transfer Saldo</span>
            <span className="text-[10px] text-slate-400">Antar 9 Rekening</span>
          </div>
        </button>

        <button
          onClick={() => {
            triggerHaptic('selection');
            onNavigate?.('budgeting');
          }}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 transition-all text-left active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block leading-tight">4 Pos Budget</span>
            <span className="text-[10px] text-slate-400">Kontrol Anggaran</span>
          </div>
        </button>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onSyncGoogleSheets?.();
          }}
          disabled={isSyncing}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 transition-all text-left active:scale-[0.98] disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block leading-tight">Sync Sheets</span>
            <span className="text-[10px] text-slate-400">{isSyncing ? 'Proses...' : 'Tarik Data'}</span>
          </div>
        </button>
      </div>

      {/* "MY WALLETS" DIRECT SWIPE CARDS CAROUSEL (Image 4 Match: No Scrollbar, Direct Smooth Swipe) */}
      <div className="space-y-3 w-full max-w-full min-w-0 overflow-hidden">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Dompet & Rekening Aktif
            </h3>
          </div>

          <button
            onClick={() => onNavigate?.('accounts')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
          >
            Kelola Rekening
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Swipe Carousel with touch-pan-x, direct horizontal swipe & Cascade Center Focus */}
        <div
          ref={walletScrollRef}
          className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar py-3 px-2 sm:px-4 w-full max-w-full min-w-0 touch-pan-x snap-x snap-mandatory"
          style={{
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {accounts.map((acc, idx) => {
            const isCenter = idx === centerWalletIndex;
            const isNegative = acc.totalSaldo < 0;

            return (
              <div
                key={acc.nama}
                onClick={() => scrollToWallet(idx)}
                style={{
                  background: isCenter
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)'
                }}
                className={`w-[172px] sm:w-[215px] h-[106px] sm:h-[114px] shrink-0 p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between snap-center transition-all duration-300 ease-out transform cursor-pointer select-none ${
                  isCenter
                    ? 'scale-[1.03] sm:scale-105 border-2 border-sky-400/60 shadow-xl shadow-sky-500/10 z-10 ring-2 ring-sky-400/20'
                    : 'scale-[0.95] border border-white/10 opacity-75 hover:opacity-100 hover:scale-[0.98]'
                }`}
              >
                {/* Top header row: Bank name + Badge/Status (fixed height, uniform) */}
                <div className="flex items-center justify-between text-xs gap-1">
                  <span className="font-semibold text-white tracking-tight flex items-center gap-1.5 truncate">
                    <CreditCard className={`w-3.5 h-3.5 shrink-0 ${isCenter ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span className="truncate">{acc.nama}</span>
                  </span>
                  <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                    isNegative 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                      : 'bg-white/10 text-slate-300'
                  }`}>
                    {isNegative ? 'Minus' : `#${idx + 1}`}
                  </span>
                </div>

                {/* Middle row: Saldo Terkini + Amount */}
                <div className="my-auto py-0.5">
                  <span className="text-[10px] text-slate-400 block leading-tight">Saldo Terkini</span>
                  <span className={`text-sm sm:text-base font-black tracking-tight truncate block ${isNegative ? 'text-rose-400' : 'text-white'}`}>
                    {displayMoney(acc.totalSaldo)}
                  </span>
                </div>

                {/* Bottom row: Uniform Serapan or Status (Guarantees mathematical symmetry for all cards) */}
                <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] leading-tight">
                  {acc.spendBulanIniPercent !== undefined && acc.spendBulanIniPercent > 0 ? (
                    <>
                      <span className="text-slate-400">Serapan:</span>
                      <span className="text-rose-300 font-bold">{acc.spendBulanIniPercent}%</span>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-400">Status:</span>
                      <span className="text-emerald-400 font-medium">Siap Pakai</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel indicator dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {accounts.map((acc, idx) => (
            <button
              key={acc.nama}
              onClick={() => scrollToWallet(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === centerWalletIndex
                  ? 'w-5 h-1.5 bg-sky-400'
                  : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Pilih ${acc.nama}`}
            />
          ))}
        </div>
      </div>

      {/* TWO COLUMNS: BUDGETING GOALS & RECENT TRANSACTIONS (Images 3 & 4 Match) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0">
        {/* Left: Goals & Budget Envelopes Snapshot */}
        <GlassContainer settings={settings} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-400" />
                Budgeting Envelopes (4 Kantong)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total Plafon: <strong className="text-slate-200">{formatRupiah(2450000)}</strong>
              </p>
            </div>

            <button
              onClick={() => onNavigate?.('budgeting')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1"
            >
              Rincian
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {budgets.slice(0, 4).map((b) => {
              const pct = b.totalSaldo > 0 ? Math.min(100, Math.round((b.actualSpend / b.totalSaldo) * 100)) : 0;
              return (
                <div key={b.id} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-2">
                      {getCategoryIcon(b.nama)}
                      {b.nama}
                    </span>
                    <span className="text-slate-300 font-mono">
                      {formatRupiah(b.actualSpend)} / {formatRupiah(b.totalSaldo)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct > 90
                          ? 'bg-rose-500'
                          : pct > 60
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Terpakai: {pct}%</span>
                    <span className="text-emerald-400 font-medium">Sisa: {formatRupiah(b.sisa)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassContainer>

        {/* Right: Recent Transactions (Image 3 & 4 Match) */}
        <GlassContainer settings={settings} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Aktivitas Transaksi Terkini
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sinkron dengan Google Sheets
              </p>
            </div>

            <button
              onClick={() => onNavigate?.('journal')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              Lihat Jurnal
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {transactions.slice(0, 5).map((t) => {
              const isIncome = t.tipe === 'Income' || t.tipe === 'Transfer Masuk';
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isIncome
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {t.kategori}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {t.catatan || t.akun} • <span className="text-slate-500">{t.akun}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-black tracking-tight ${
                        isIncome ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatRupiah(t.jumlah)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {t.bulan || 'September'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassContainer>
      </div>
    </div>
  );
};
