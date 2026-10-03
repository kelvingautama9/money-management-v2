import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GlassContainer } from './GlassContainer';
import { InteractiveGlossyCard } from './InteractiveGlossyCard';
import { GlassSettings, BudgetCategory, AccountBalance, Transaction, InvestmentAsset, InvestmentHistory, EmergencyFund, ActivePage } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import { UnifiedMonthlyReportModal } from './UnifiedMonthlyReportModal';
import { RingkasanLineChart } from './RingkasanLineChart';
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
  Calculator,
  FileText,
  FileDown,
  Printer
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
  emergencyFund?: EmergencyFund;
  onNavigate?: (page: ActivePage) => void;
  onSyncGoogleSheets?: () => void;
  onOpenProjectManager?: () => void;
  onOpenCalculator?: () => void;
  isSyncing?: boolean;
  currentMonthSheet?: string;
  availableSheets?: string[];
  onSelectMonthSheet?: (name: string) => void;
  sheetSummaries?: Record<string, any>;
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
  emergencyFund,
  onNavigate,
  onSyncGoogleSheets,
  onOpenProjectManager,
  onOpenCalculator,
  isSyncing = false,
  currentMonthSheet = 'SEPTEMBER',
  availableSheets = [],
  onSelectMonthSheet,
  sheetSummaries = {}
}) => {
  const [hideBalance, setHideBalance] = useState(false);
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);
  const isDark = settings.themeMode !== 'light' && settings.themeMode !== 'beige';
  const isLight = !isDark;
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

  // Dynamic MoM growth calculation across all detected Google Sheet month tabs
  const momGrowth = useMemo(() => {
    const monthOrder: Record<string, number> = {
      januari: 1, jan: 1, februari: 2, feb: 2, maret: 3, mar: 3, april: 4, apr: 4,
      mei: 5, may: 5, juni: 6, jun: 6, juli: 7, jul: 7, agustus: 8, agu: 8, ags: 8, aug: 8,
      september: 9, sep: 9, sept: 9, oktober: 10, okt: 10, oct: 10, november: 11, nov: 11, desember: 12, des: 12, dec: 12
    };
    const getIdx = (s: string) => {
      const c = (s || '').toLowerCase().replace(/[^a-z]/g, '');
      for (const [k, v] of Object.entries(monthOrder)) {
        if (c === k || c.startsWith(k)) return v;
      }
      return 99;
    };

    const currIdx = getIdx(currentMonthSheet);
    const tabs = Array.from(new Set([...(availableSheets || []), currentMonthSheet])).filter((t) => {
      const u = (t || '').toUpperCase().trim();
      return u && u !== 'INVESTMENT' && u !== 'INVESTING' && u !== 'PREVIEW';
    });

    const points: Array<{ order: number; val: number; isCurr: boolean }> = [];
    const seen = new Set<number>();

    tabs.forEach((tab) => {
      const idx = getIdx(tab);
      if (idx !== 99 && seen.has(idx)) return;
      const isCurr = tab.toLowerCase() === (currentMonthSheet || '').toLowerCase() || (idx !== 99 && idx === currIdx);
      let val = isCurr && totalAset !== 0 ? totalAset : 0;
      if (val === 0) {
        const sum = sheetSummaries?.[tab] || sheetSummaries?.[tab.toUpperCase()] || sheetSummaries?.[tab.toLowerCase()];
        if (sum) {
          val = Number(sum.totalAset) || ((Number(sum.cashStandbyDanaDarurat) || 0) + (Number(sum.totalInvestment) || 0));
        }
      }
      if (val !== 0) {
        if (idx !== 99) seen.add(idx);
        points.push({ order: idx, val, isCurr });
      }
    });

    points.sort((a, b) => a.order - b.order);
    if (points.length >= 2) {
      const activePos = points.findIndex((p) => p.isCurr);
      const targetPos = activePos >= 1 ? activePos : points.length - 1;
      const currVal = points[targetPos].val;
      const prevVal = points[targetPos - 1].val;
      if (prevVal !== 0) {
        const diff = currVal - prevVal;
        const pct = Number(((diff / Math.abs(prevVal)) * 100).toFixed(1));
        return { diff, pct };
      }
    }
    return null;
  }, [availableSheets, sheetSummaries, currentMonthSheet, totalAset]);

  // Format balance with privacy mask
  const displayMoney = (amount: number) => {
    if (hideBalance) return '••••••••';
    return formatRupiah(amount);
  };

  // Quick category icon helper
  const getCategoryIcon = (kategori: string) => {
    const k = kategori.toLowerCase();
    if (k.includes('listrik')) return <Zap className="w-4 h-4 text-blue-400" />;
    if (k.includes('transport')) return <Car className="w-4 h-4 text-slate-400" />;
    if (k.includes('dating')) return <Heart className="w-4 h-4 text-slate-400" />;
    if (k.includes('jajan') || k.includes('makan')) return <Coffee className="w-4 h-4 text-slate-400" />;
    return <CreditCard className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* HERO SECTION: Large Balance & Dual Frosted Cards */}
      <GlassContainer settings={settings} className="p-5 sm:p-7 relative overflow-hidden w-full max-w-full min-w-0">
        <div className="relative z-10 w-full min-w-0">
          {/* Top Label & Actions */}
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Total Kekayaan Bersih (Net Worth)
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Single Consolidated Action Button: Ekspor Laporan Bulanan (PDF) */}
              <button
                id="btn-hero-export-pdf"
                onClick={() => {
                  triggerHaptic('medium');
                  setIsReportPreviewOpen(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 cursor-pointer ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white shadow-xs'
                }`}
                title="Ekspor Laporan Bulanan (PDF) & Cetak Resmi"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-300" />
                <span>Ekspor PDF</span>
              </button>

              {onOpenCalculator && (
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    onOpenCalculator();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  }`}
                  title="Buka Kalkulator Pensiun"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kalkulator</span>
                </button>
              )}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setHideBalance(!hideBalance);
                }}
                className={`p-2 rounded-xl border transition cursor-pointer ${
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
            {momGrowth ? (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border inline-flex items-center gap-1 ${
                momGrowth.diff >= 0
                  ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-rose-500 bg-rose-500/10 border-rose-500/20'
              }`}>
                <ArrowUpRight className="w-3.5 h-3.5" />
                {momGrowth.diff >= 0 ? `+${formatRupiah(momGrowth.diff)}` : formatRupiah(momGrowth.diff)} ({momGrowth.pct >= 0 ? `+${momGrowth.pct}%` : `${momGrowth.pct}%`})
              </span>
            ) : totalAset > 0 ? (
              <span className="text-xs font-medium text-slate-400 px-2 py-0.5 rounded-lg bg-slate-500/10 border border-slate-500/20">
                {currentMonthSheet}
              </span>
            ) : null}
          </div>

          <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Kas Cair & Dana Darurat: <strong className={isDark ? "text-slate-200" : "text-slate-900"}>{displayMoney(cashStandbyDanaDarurat)}</strong> • Portofolio Investasi: <strong className={isDark ? "text-slate-200" : "text-slate-900"}>{displayMoney(totalInvestment)}</strong>
          </p>

          {/* SPLIT ROW: INCOME (LEFT) & PENGELUARAN (RIGHT) */}
          <div className="mt-5 w-full min-w-0">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 w-full">
              {/* 1. Income Card (Left) */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50/90 border-slate-200/90 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <ArrowDownLeft className="w-3 h-3" />
                  </div>
                  <span className={`text-[11px] sm:text-xs font-semibold truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Income Bulanan
                  </span>
                </div>
                <h3 className={`text-base sm:text-2xl font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {displayMoney(totalPemasukan)}
                </h3>
                <span className={`text-[10px] sm:text-[11px] block mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Periode {currentMonthSheet}
                </span>
              </div>

              {/* 2. Spendings Card (Right) */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50/90 border-slate-200/90 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-100 text-rose-700'
                  }`}>
                    <ArrowUpRight className="w-3 h-3" />
                  </div>
                  <span className={`text-[11px] sm:text-xs font-semibold truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Total Pengeluaran
                  </span>
                </div>
                <h3 className={`text-base sm:text-2xl font-bold tracking-tight truncate ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                  {displayMoney(totalPengeluaran)}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px]">
                  <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {spendRatio}% Income
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className={`truncate ${
                    sisaSaldoIncome >= 0
                      ? isDark ? 'text-emerald-400' : 'text-emerald-700 font-medium'
                      : isDark ? 'text-rose-400' : 'text-rose-600 font-medium'
                  }`}>
                    {sisaSaldoIncome >= 0 ? `Surplus: +${displayMoney(sisaSaldoIncome)}` : `Defisit: -${displayMoney(Math.abs(sisaSaldoIncome))}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassContainer>

      {/* LINE-CHARTS-9 FINANCIAL PERFORMANCE & VALUATION CONTAINER */}
      <RingkasanLineChart
        totalAset={totalAset}
        totalInvestment={totalInvestment}
        totalPemasukan={totalPemasukan}
        totalPengeluaran={totalPengeluaran}
        history={history}
        transactions={transactions}
        currentMonthSheet={currentMonthSheet}
        availableSheets={availableSheets}
        sheetSummaries={sheetSummaries}
        isDark={isDark}
        hideBalance={hideBalance}
        onNavigate={onNavigate}
      />

      {/* QUICK ACTIONS ROW (Light grey, navy, white, black, dark red palette) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full min-w-0">
        <button
          onClick={() => {
            triggerHaptic('selection');
            onNavigate?.('cashflow');
          }}
          className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left active:scale-[0.98] cursor-pointer ${
            isLight
              ? 'bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm shadow-slate-900/5'
              : 'bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 shadow-lg shadow-black/20'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${
            isLight
              ? 'bg-slate-100 border-slate-200 text-slate-900'
              : 'bg-white/10 border-white/15 text-white'
          }`}>
            <PlusCircle className={`w-5 h-5 ${isLight ? 'text-slate-900' : 'text-white'}`} />
          </div>
          <div>
            <span className={`text-xs font-bold block leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Input Transaksi
            </span>
            <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Auto-sync Sheet
            </span>
          </div>
        </button>

        <button
          onClick={() => {
            triggerHaptic('selection');
            onNavigate?.('accounts');
          }}
          className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left active:scale-[0.98] cursor-pointer ${
            isLight
              ? 'bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm shadow-slate-900/5'
              : 'bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 shadow-lg shadow-black/20'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${
            isLight
              ? 'bg-slate-100 border-slate-200 text-slate-900'
              : 'bg-white/10 border-white/15 text-white'
          }`}>
            <ArrowLeftRight className={`w-5 h-5 ${isLight ? 'text-slate-900' : 'text-white'}`} />
          </div>
          <div>
            <span className={`text-xs font-bold block leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Transfer Saldo
            </span>
            <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {accounts.length > 0 ? `Antar ${accounts.length} Rekening` : 'Antar Rekening'}
            </span>
          </div>
        </button>

        <button
          onClick={() => {
            triggerHaptic('selection');
            onNavigate?.('budgeting');
          }}
          className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left active:scale-[0.98] cursor-pointer ${
            isLight
              ? 'bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm shadow-slate-900/5'
              : 'bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 shadow-lg shadow-black/20'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${
            isLight
              ? 'bg-slate-100 border-slate-200 text-slate-900'
              : 'bg-white/10 border-white/15 text-white'
          }`}>
            <PieChart className={`w-5 h-5 ${isLight ? 'text-slate-900' : 'text-white'}`} />
          </div>
          <div>
            <span className={`text-xs font-bold block leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {budgets.length > 0 ? `${budgets.length} Pos Budget` : 'Pos Budget'}
            </span>
            <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Kontrol Anggaran
            </span>
          </div>
        </button>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onSyncGoogleSheets?.();
          }}
          disabled={isSyncing}
          className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left active:scale-[0.98] disabled:opacity-50 cursor-pointer ${
            isLight
              ? 'bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm shadow-slate-900/5'
              : 'bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 shadow-lg shadow-black/20'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${
            isLight
              ? 'bg-slate-100 border-slate-200 text-slate-900'
              : 'bg-white/10 border-white/15 text-white'
          }`}>
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''} ${isLight ? 'text-slate-900' : 'text-white'}`} />
          </div>
          <div>
            <span className={`text-xs font-bold block leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Sync Sheets
            </span>
            <span className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isSyncing ? 'Proses...' : 'Tarik Data'}
            </span>
          </div>
        </button>
      </div>

      {/* "MY WALLETS" DIRECT SWIPE CARDS CAROUSEL */}
      <div className="space-y-3 w-full max-w-full min-w-0 overflow-hidden">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Building2 className={`w-4 h-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`} />
            <h3 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Dompet & Rekening Aktif
            </h3>
          </div>

          <button
            onClick={() => onNavigate?.('accounts')}
            className={`text-xs font-medium inline-flex items-center gap-1 ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'}`}
          >
            Kelola Rekening
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Swipe Carousel with touch-pan-x, direct horizontal swipe & Cascade Center Focus */}
        {accounts.length > 0 ? (
          <>
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
                    className={`w-[172px] sm:w-[215px] h-[106px] sm:h-[114px] shrink-0 p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between snap-center transition-all duration-200 transform cursor-pointer select-none ${
                      isLight
                        ? isCenter
                          ? 'bg-white scale-[1.02] sm:scale-105 border-2 border-slate-900 shadow-md z-10'
                          : 'bg-slate-100/90 scale-[0.96] border border-slate-200/90 opacity-90 hover:opacity-100 hover:scale-[0.98]'
                        : isCenter
                          ? 'bg-slate-800/95 scale-[1.02] sm:scale-105 border-2 border-slate-400 shadow-lg z-10'
                          : 'bg-slate-900/90 scale-[0.96] border border-white/10 opacity-80 hover:opacity-100 hover:scale-[0.98]'
                    }`}
                  >
                    {/* Top header row: Bank name + Badge/Status (fixed height, uniform) */}
                    <div className="flex items-center justify-between text-xs gap-1">
                      <span className={`font-semibold tracking-tight flex items-center gap-1.5 truncate ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        <CreditCard className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-slate-700' : 'text-slate-300'}`} />
                        <span className="truncate">{acc.nama}</span>
                      </span>
                      {isNegative && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30">
                          Minus
                        </span>
                      )}
                    </div>

                    {/* Middle row: Saldo Terkini + Amount */}
                    <div className="my-auto py-0.5">
                      <span className={`text-[10px] block leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Saldo Terkini</span>
                      <span className={`text-sm sm:text-base font-black tracking-tight truncate block ${
                        isNegative
                          ? isLight ? 'text-red-700' : 'text-red-400'
                          : isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        {displayMoney(acc.totalSaldo)}
                      </span>
                    </div>

                    {/* Bottom row */}
                    <div className={`pt-1.5 border-t flex items-center justify-between text-[10px] leading-tight ${
                      isLight ? 'border-slate-200' : 'border-white/10'
                    }`}>
                      {acc.spendBulanIniPercent !== undefined && acc.spendBulanIniPercent > 0 ? (
                        <>
                          <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Serapan:</span>
                          <span className={`font-bold ${isLight ? 'text-red-700' : 'text-red-400'}`}>{acc.spendBulanIniPercent}%</span>
                        </>
                      ) : (
                        <>
                          <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Status:</span>
                          <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Siap Pakai</span>
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
                      ? isLight ? 'w-5 h-1.5 bg-slate-900' : 'w-5 h-1.5 bg-white'
                      : isLight ? 'w-1.5 h-1.5 bg-slate-300' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Pilih ${acc.nama}`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className={`p-4 rounded-2xl border text-center text-xs ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white/[0.03] border-white/10 text-slate-400'
          }`}>
            Belum ada rekening aktif. Buka tab <strong className={`cursor-pointer hover:underline ${isLight ? 'text-slate-900' : 'text-white'}`} onClick={() => onNavigate?.('accounts')}>Saldo Rekening</strong> untuk menambahkan rekening bank atau dompet digital.
          </div>
        )}
      </div>

      {/* TWO COLUMNS: BUDGETING GOALS & RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0">
        {/* Left: Goals & Budget Envelopes Snapshot */}
        <GlassContainer settings={settings} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <PieChart className={`w-4 h-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`} />
                Budgeting Envelopes ({budgets.length} Kantong)
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Target Kuota: <strong className={isLight ? "text-slate-800" : "text-slate-200"}>{formatRupiah(budgets.reduce((s, b) => s + (b.budgeting || b.targetBulanan || 0), 0))}</strong> • Kapasitas: <strong className={isLight ? "text-slate-800" : "text-slate-200"}>{formatRupiah(budgets.reduce((s, b) => s + (b.totalSaldo || (b.saldoAwal || 0) + (b.budgeting || b.targetBulanan || 0)), 0))}</strong>
              </p>
            </div>

            <button
              onClick={() => onNavigate?.('budgeting')}
              className={`text-xs font-medium inline-flex items-center gap-1 cursor-pointer ${isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-300 hover:text-white'}`}
            >
              Rincian
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {budgets.length > 0 ? (
              budgets.slice(0, 4).map((b) => {
                const monthlyBudget = b.budgeting || b.targetBulanan || 0;
                const saldoAwal = b.saldoAwal || 0;
                const totalSaldo = b.totalSaldo || saldoAwal + monthlyBudget;
                const actualSpend = b.actualSpend || 0;
                const sisa = b.sisa !== undefined ? b.sisa : totalSaldo - actualSpend;

                const monthlySpendPct =
                  monthlyBudget > 0 ? Number(((actualSpend / monthlyBudget) * 100).toFixed(1)) : 0;
                const isOverMonthly = actualSpend > monthlyBudget && monthlyBudget > 0;
                const monthlyDiff = actualSpend - monthlyBudget;
                const totalSpendPct =
                  totalSaldo > 0 ? Number(((actualSpend / totalSaldo) * 100).toFixed(1)) : 0;
                const isDepleted = sisa <= 0;

                return (
                  <div key={b.id} className={`p-3 rounded-xl border space-y-2 ${
                    isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/[0.03] border-white/10'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold flex items-center gap-2 truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {getCategoryIcon(b.nama)}
                        <span className="truncate">{b.nama}</span>
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono">
                        <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                          {formatRupiah(actualSpend)} / {formatRupiah(monthlyBudget)}
                        </span>
                        {isOverMonthly && (
                          <span className="text-[10px] font-bold text-rose-500">
                            (+{formatRupiah(monthlyDiff)})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Clean Single Progress Bar */}
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverMonthly ? 'bg-rose-500' : isLight ? 'bg-slate-800' : 'bg-slate-300'
                        }`}
                        style={{ width: `${Math.min(100, monthlySpendPct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                        {monthlySpendPct}% terpakai
                      </span>
                      <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                        Sisa Kantong: <strong className={isDepleted ? 'text-rose-500 font-bold' : isLight ? 'text-slate-900' : 'text-white'}>{formatRupiah(sisa)}</strong>
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={`p-4 rounded-2xl border text-center text-xs ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white/[0.03] border-white/10 text-slate-400'
              }`}>
                Belum ada pos budget terdaftar. Buka tab <strong className={`cursor-pointer hover:underline ${isLight ? 'text-slate-900' : 'text-white'}`} onClick={() => onNavigate?.('budgeting')}>Dompet & Rekening</strong> untuk membuat kantong anggaran.
              </div>
            )}
          </div>
        </GlassContainer>

        {/* Right: Recent Transactions */}
        <GlassContainer settings={settings} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <FileText className={`w-4 h-4 ${isLight ? 'text-slate-700' : 'text-slate-300'}`} />
                Aktivitas Transaksi Terkini
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Sinkron dengan Google Sheets
              </p>
            </div>

            <button
              onClick={() => onNavigate?.('cashflow')}
              className={`text-xs font-medium inline-flex items-center gap-1 cursor-pointer ${isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-300 hover:text-white'}`}
            >
              Lihat Mutasi
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((t) => {
                const isIncome = t.tipe === 'Income' || t.tipe === 'Transfer Masuk';
                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                      isLight
                        ? 'bg-slate-50/80 hover:bg-white border-slate-200/90'
                        : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isIncome
                            ? isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-white/10 text-white border-white/15'
                            : isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/15 text-red-300 border-red-500/30'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {t.kategori}
                        </span>
                        <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {t.catatan || t.akun} • <span className={isLight ? 'text-slate-600' : 'text-slate-500'}>{t.akun}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-black tracking-tight ${
                          isIncome
                            ? isLight ? 'text-slate-900' : 'text-white'
                            : isLight ? 'text-red-700' : 'text-red-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatRupiah(t.jumlah)}
                      </span>
                      <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                        {t.bulan || currentMonthSheet}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={`p-4 rounded-2xl border text-center text-xs ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white/[0.03] border-white/10 text-slate-400'
              }`}>
                Belum ada transaksi di periode {currentMonthSheet}. Klik <strong className={`cursor-pointer hover:underline ${isLight ? 'text-slate-900' : 'text-white'}`} onClick={() => onNavigate?.('cashflow')}>Input Transaksi</strong> untuk mulai mencatat arus kas.
              </div>
            )}
          </div>
        </GlassContainer>
      </div>

      {/* MODAL PREVIEW FOR UNIFIED 1-PAGE MONTHLY REPORT (Export PDF & Print) */}
      <UnifiedMonthlyReportModal
        isOpen={isReportPreviewOpen}
        onClose={() => setIsReportPreviewOpen(false)}
        currentSheetName={currentMonthSheet}
        totalAset={totalAset}
        totalIncome={totalPemasukan}
        totalExpense={totalPengeluaran}
        sisaSaldoIncome={sisaSaldoIncome}
        cashStandbyDanaDarurat={cashStandbyDanaDarurat}
        totalInvestment={totalInvestment}
        transactions={transactions}
        budgets={budgets}
        accounts={accounts}
        assets={assets}
        history={history}
        emergencyFund={emergencyFund}
        settings={settings}
      />
    </div>
  );
};
