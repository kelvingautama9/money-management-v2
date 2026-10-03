'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/line-charts-9';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from 'recharts';
import { formatRupiah } from '../lib/sheetsApi';
import { InvestmentHistory, Transaction, SheetSummary } from '../types';

interface RingkasanLineChartProps {
  totalAset: number;
  totalInvestment: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  history?: InvestmentHistory[];
  transactions?: Transaction[];
  currentMonthSheet?: string;
  availableSheets?: string[];
  sheetSummaries?: Record<string, SheetSummary>;
  isDark?: boolean;
  hideBalance?: boolean;
  onNavigate?: (page: any) => void;
}

const MONTH_ORDER: Record<string, number> = {
  januari: 1, jan: 1,
  februari: 2, feb: 2,
  maret: 3, mar: 3,
  april: 4, apr: 4,
  mei: 5, may: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  agustus: 8, agu: 8, ags: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  oktober: 10, okt: 10, oct: 10,
  november: 11, nov: 11,
  desember: 12, des: 12, dec: 12
};

function getMonthIndex(name: string): number {
  const clean = (name || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 99;
  for (const [k, v] of Object.entries(MONTH_ORDER)) {
    if (clean === k || clean.startsWith(k)) return v;
  }
  return 99;
}

function formatMonthLabel(name: string): string {
  const clean = (name || '').trim();
  const idx = getMonthIndex(clean);
  const fullNames = [
    '',
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ];
  if (idx >= 1 && idx <= 12) return fullNames[idx];
  return clean || 'Bulan';
}

function formatShortMonth(name: string): string {
  const clean = (name || '').trim();
  const idx = getMonthIndex(clean);
  const shortNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  if (idx >= 1 && idx <= 12) return shortNames[idx];
  return clean.slice(0, 4) || 'Bln';
}

/**
 * Resolves Total Aset (Net Worth) for a given Google Sheet month tab
 * using:
 * 1. Active month live `totalAset` if `isCurrent`
 * 2. `sheetSummaries[tabName]` (`totalAset`, or `cashStandbyDanaDarurat + totalInvestment`, or sum of `accountBalances`)
 * 3. Cached transactions in `localStorage` (`kelvin_financial_txs_${tabName}`)
 * 4. Matching record in `history`
 */
function resolveTabTotalAset(
  tabName: string,
  isCurrent: boolean,
  liveTotalAset: number,
  sheetSummaries: Record<string, SheetSummary>,
  history: InvestmentHistory[]
): number {
  if (isCurrent && liveTotalAset !== 0) {
    return liveTotalAset;
  }

  const sumObj =
    sheetSummaries?.[tabName] ||
    sheetSummaries?.[tabName.toUpperCase()] ||
    sheetSummaries?.[tabName.toLowerCase()];

  if (sumObj) {
    if (typeof sumObj.totalAset === 'number' && sumObj.totalAset !== 0) {
      return sumObj.totalAset;
    }
    const combined = (Number(sumObj.cashStandbyDanaDarurat) || 0) + (Number(sumObj.totalInvestment) || 0);
    if (combined !== 0) {
      return combined;
    }
    if (sumObj.accountBalances && Object.keys(sumObj.accountBalances).length > 0) {
      const seen = new Set<string>();
      let accSum = 0;
      let hasBal = false;
      Object.entries(sumObj.accountBalances).forEach(([k, v]) => {
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (typeof v === 'number' && cleanK && !seen.has(cleanK)) {
          seen.add(cleanK);
          accSum += v;
          hasBal = true;
        }
      });
      if (hasBal && accSum !== 0) {
        return accSum;
      }
    }
  }

  // Fallback to cached transactions for this tab
  try {
    const cached =
      localStorage.getItem(`kelvin_financial_txs_${tabName}`) ||
      localStorage.getItem(`kelvin_financial_txs_${tabName.toUpperCase()}`) ||
      localStorage.getItem(`kelvin_financial_txs_${tabName.toLowerCase()}`);
    if (cached) {
      const parsed: Transaction[] = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let txNet = 0;
        parsed.forEach((t) => {
          const amt = Number(t.jumlah) || 0;
          if (t.tipe === 'Saldo Bulan Lalu' || (t.kategori || '').toLowerCase().includes('saldo awal')) {
            txNet += amt;
          } else if (t.tipe === 'Income') {
            txNet += amt;
          } else if (t.tipe === 'Transfer Masuk') {
            txNet += amt;
          } else if (t.tipe === 'Transfer Keluar') {
            txNet -= amt;
          } else if (t.tipe === 'Expense') {
            txNet -= amt;
          }
        });
        if (txNet !== 0) return txNet;
      }
    }
  } catch (e) {}

  // Fallback to history record matching this month
  const mIdx = getMonthIndex(tabName);
  if (Array.isArray(history) && history.length > 0) {
    const match = history.find((h) => {
      const hIdx = getMonthIndex(h.bulan);
      return (mIdx !== 99 && hIdx === mIdx) || h.bulan.toLowerCase().includes(tabName.toLowerCase());
    });
    if (match && Number(match.totalNetWorth) !== 0) {
      return Number(match.totalNetWorth);
    }
  }

  return isCurrent ? liveTotalAset : 0;
}

export const RingkasanLineChart: React.FC<RingkasanLineChartProps> = ({
  totalAset,
  totalInvestment,
  totalPemasukan,
  totalPengeluaran,
  history = [],
  transactions = [],
  currentMonthSheet = 'September',
  availableSheets = [],
  sheetSummaries = {},
  isDark = true,
  hideBalance = false,
  onNavigate
}) => {
  const [chartMode, setChartMode] = useState<'networth' | 'cashflow'>('networth');

  const chartConfig = useMemo(() => {
    return {
      value: {
        label: chartMode === 'networth' ? 'Total Aset' : 'Arus Kas Bersih',
        color: isDark ? '#38bdf8' : '#0284c7',
      },
    } satisfies ChartConfig;
  }, [isDark, chartMode]);

  // Build chart points directly from the user's detected Google Sheet month tabs (e.g. Januari, Februari, Maret, April, Juni, Agustus, etc.)
  const chartPoints = useMemo(() => {
    const cleanCurr = (currentMonthSheet || '').trim();
    const currMonthIdx = getMonthIndex(cleanCurr);

    // Filter detected tabs to real monthly recap tabs (excluding utility tabs like INVESTMENT/INVESTING/PREVIEW)
    const detectedMonthTabs = Array.from(
      new Set([...(availableSheets || []), ...(cleanCurr ? [cleanCurr] : [])])
    ).filter((tab) => {
      const up = (tab || '').trim().toUpperCase();
      return up && up !== 'INVESTMENT' && up !== 'INVESTING' && up !== 'PREVIEW';
    });

    if (chartMode === 'networth') {
      const pointMap = new Map<
        string,
        {
          monthOrder: number;
          tabOrder: number;
          tabName: string;
          date: string;
          fullDate: string;
          value: number;
          isCurrent: boolean;
        }
      >();

      detectedMonthTabs.forEach((tab, tabIdx) => {
        const mIdx = getMonthIndex(tab);
        const key = mIdx !== 99 ? `m-${mIdx}` : `tab-${tab.toLowerCase()}`;
        const isCurrent =
          tab.toLowerCase() === cleanCurr.toLowerCase() ||
          (mIdx !== 99 && mIdx === currMonthIdx);

        const val = resolveTabTotalAset(tab, isCurrent, totalAset, sheetSummaries, history);

        // Include tab if it has a valid non-zero totalAset, or if it's the currently selected tab with data
        if (val !== 0 || (isCurrent && totalAset > 0)) {
          pointMap.set(key, {
            monthOrder: mIdx,
            tabOrder: tabIdx,
            tabName: tab,
            date: mIdx !== 99 ? formatShortMonth(tab) : tab,
            fullDate: mIdx !== 99 ? `${formatMonthLabel(tab)} (Tab: ${tab})` : tab,
            value: val,
            isCurrent
          });
        }
      });

      // Also include any month in sheetSummaries that wasn't in availableSheets yet
      if (sheetSummaries && typeof sheetSummaries === 'object') {
        Object.keys(sheetSummaries).forEach((tabKey, idx) => {
          const mIdx = getMonthIndex(tabKey);
          if (mIdx === 99) return;
          const key = `m-${mIdx}`;
          if (pointMap.has(key)) return;
          const isCurrent = mIdx === currMonthIdx;
          const val = resolveTabTotalAset(tabKey, isCurrent, totalAset, sheetSummaries, history);
          if (val !== 0) {
            pointMap.set(key, {
              monthOrder: mIdx,
              tabOrder: 100 + idx,
              tabName: tabKey,
              date: formatShortMonth(tabKey),
              fullDate: `${formatMonthLabel(tabKey)} (Tab: ${tabKey})`,
              value: val,
              isCurrent
            });
          }
        });
      }

      // Sort chronologically by month index (Januari -> Februari -> Maret -> April -> Juni -> Agustus -> dst.)
      const sorted = Array.from(pointMap.values()).sort((a, b) => {
        if (a.monthOrder !== b.monthOrder) return a.monthOrder - b.monthOrder;
        return a.tabOrder - b.tabOrder;
      });

      return sorted.map((pt, idx) => {
        const prev = idx > 0 ? sorted[idx - 1] : null;
        const profit = prev ? pt.value - prev.value : 0;
        const pnl =
          prev && prev.value !== 0
            ? Number((((pt.value - prev.value) / Math.abs(prev.value)) * 100).toFixed(1))
            : 0;
        const isLatest = idx === sorted.length - 1;
        return {
          ...pt,
          profit,
          pnl,
          isLatest,
          isKey: true // Mark every detected monthly recap tab clearly on the line chart
        };
      });
    } else {
      // Cashflow mode: Net Cashflow (Pemasukan - Pengeluaran) for each detected month tab
      const cashflowMap = new Map<
        string,
        {
          monthOrder: number;
          tabOrder: number;
          tabName: string;
          date: string;
          fullDate: string;
          income: number;
          expense: number;
          value: number;
          isCurrent: boolean;
        }
      >();

      detectedMonthTabs.forEach((tab, tabIdx) => {
        const mIdx = getMonthIndex(tab);
        const key = mIdx !== 99 ? `m-${mIdx}` : `tab-${tab.toLowerCase()}`;
        const isCurrent =
          tab.toLowerCase() === cleanCurr.toLowerCase() ||
          (mIdx !== 99 && mIdx === currMonthIdx);

        if (isCurrent && (totalPemasukan > 0 || totalPengeluaran > 0 || transactions.length > 0)) {
          cashflowMap.set(key, {
            monthOrder: mIdx,
            tabOrder: tabIdx,
            tabName: tab,
            date: mIdx !== 99 ? formatShortMonth(tab) : tab,
            fullDate: mIdx !== 99 ? `${formatMonthLabel(tab)} (Tab: ${tab})` : tab,
            income: totalPemasukan,
            expense: totalPengeluaran,
            value: totalPemasukan - totalPengeluaran,
            isCurrent: true
          });
          return;
        }

        try {
          const cached =
            localStorage.getItem(`kelvin_financial_txs_${tab}`) ||
            localStorage.getItem(`kelvin_financial_txs_${tab.toUpperCase()}`) ||
            localStorage.getItem(`kelvin_financial_txs_${tab.toLowerCase()}`);
          if (cached) {
            const parsed: Transaction[] = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const inc = parsed
                .filter((t) => t.tipe === 'Income')
                .reduce((s, t) => s + (Number(t.jumlah) || 0), 0);
              const exp = parsed
                .filter((t) => t.tipe === 'Expense')
                .reduce((s, t) => s + (Number(t.jumlah) || 0), 0);
              if (inc > 0 || exp > 0) {
                cashflowMap.set(key, {
                  monthOrder: mIdx,
                  tabOrder: tabIdx,
                  tabName: tab,
                  date: mIdx !== 99 ? formatShortMonth(tab) : tab,
                  fullDate: mIdx !== 99 ? `${formatMonthLabel(tab)} (Tab: ${tab})` : tab,
                  income: inc,
                  expense: exp,
                  value: inc - exp,
                  isCurrent
                });
              }
            }
          }
        } catch (e) {}
      });

      const sorted = Array.from(cashflowMap.values()).sort((a, b) => {
        if (a.monthOrder !== b.monthOrder) return a.monthOrder - b.monthOrder;
        return a.tabOrder - b.tabOrder;
      });

      return sorted.map((pt, idx) => {
        const prev = idx > 0 ? sorted[idx - 1] : null;
        const profit = prev ? pt.value - prev.value : pt.value;
        const pnl =
          prev && prev.value !== 0
            ? Number((((pt.value - prev.value) / Math.abs(prev.value)) * 100).toFixed(1))
            : pt.income > 0
              ? Number(((pt.value / pt.income) * 100).toFixed(1))
              : 0;
        const isLatest = idx === sorted.length - 1;
        return {
          ...pt,
          profit,
          pnl,
          isLatest,
          isKey: true
        };
      });
    }
  }, [
    chartMode,
    availableSheets,
    sheetSummaries,
    history,
    transactions,
    totalAset,
    totalPemasukan,
    totalPengeluaran,
    currentMonthSheet
  ]);

  const values = chartPoints.map((p) => p.value);
  const netCashflow = totalPemasukan - totalPengeluaran;

  // Headline value reflects active month or latest recap month in the series
  const displayMainValue = useMemo(() => {
    if (chartMode === 'networth') {
      if (totalAset !== 0) return totalAset;
      if (chartPoints.length > 0) return chartPoints[chartPoints.length - 1].value;
      return 0;
    }
    return netCashflow;
  }, [chartMode, totalAset, netCashflow, chartPoints]);

  const highPoint = useMemo(() => {
    if (chartPoints.length === 0) return null;
    return chartPoints.reduce((best, p) => (p.value > best.value ? p : best), chartPoints[0]);
  }, [chartPoints]);

  const lowPoint = useMemo(() => {
    if (chartPoints.length === 0) return null;
    return chartPoints.reduce((worst, p) => (p.value < worst.value ? p : worst), chartPoints[0]);
  }, [chartPoints]);

  const highValue = highPoint ? highPoint.value : displayMainValue;
  const lowValue = lowPoint ? lowPoint.value : displayMainValue;

  // Calculate MoM change percentage for active month (or latest month in the recap) vs its preceding recap month
  const { changePct, changeDiff, prevMonthLabel, activeMonthLabel, hasComparison } = useMemo(() => {
    if (chartPoints.length >= 2) {
      const currIdx = chartPoints.findIndex((p) => p.isCurrent);
      const targetIdx = currIdx >= 1 ? currIdx : chartPoints.length - 1;
      const currentPt = chartPoints[targetIdx];
      const prevPt = chartPoints[targetIdx - 1];
      if (currentPt && prevPt && prevPt.value !== 0) {
        const diff = currentPt.value - prevPt.value;
        const pct = Number(((diff / Math.abs(prevPt.value)) * 100).toFixed(1));
        return {
          changePct: pct,
          changeDiff: diff,
          prevMonthLabel: prevPt.date,
          activeMonthLabel: currentPt.date,
          hasComparison: true
        };
      }
    }
    return {
      changePct: 0,
      changeDiff: 0,
      prevMonthLabel: '',
      activeMonthLabel: '',
      hasComparison: false
    };
  }, [chartPoints]);

  // Dynamic Y-Axis domain with proportional padding so lines never clip or flatten
  const yAxisDomain = useMemo<[number, number]>(() => {
    if (values.length === 0) return [0, 10_000_000];
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) {
      const pad = Math.max(Math.abs(max) * 0.15, 500_000);
      return [chartMode === 'networth' && min >= 0 ? Math.max(0, min - pad) : min - pad, max + pad];
    }
    const span = max - min;
    const pad = Math.max(span * 0.2, 250_000);
    const lower = chartMode === 'networth' && min >= 0 ? Math.max(0, Math.floor(min - pad)) : Math.floor(min - pad);
    const upper = Math.ceil(max + pad);
    return [lower, upper];
  }, [values, chartMode]);

  const activeRefDate = useMemo(() => {
    if (chartPoints.length === 0) return undefined;
    const curr = chartPoints.find((p) => p.isCurrent);
    if (curr) return curr.date;
    return chartPoints[chartPoints.length - 1]?.date;
  }, [chartPoints]);

  const displayMoney = (val: number) => {
    if (hideBalance) return '••••••••';
    return formatRupiah(val);
  };

  const formatCondensedRupiah = (val: number) => {
    if (hideBalance) return '•••';
    const sign = val < 0 ? '-' : '';
    const abs = Math.abs(val);
    if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}M`;
    if (abs >= 1_000_000) {
      const jt = abs / 1_000_000;
      return `${sign}${jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1)}jt`;
    }
    if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}rb`;
    return `${sign}${Math.round(abs)}`;
  };

  const secondaryRatioPct = useMemo(() => {
    if (chartMode === 'networth') {
      return displayMainValue > 0 ? Number(((totalInvestment / displayMainValue) * 100).toFixed(1)) : 0;
    }
    return totalPemasukan > 0 ? Number(((netCashflow / totalPemasukan) * 100).toFixed(1)) : 0;
  }, [chartMode, displayMainValue, totalInvestment, totalPemasukan, netCashflow]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className={`p-3 rounded-xl border text-xs shadow-lg ${
            isDark
              ? 'bg-slate-900/95 border-white/15 text-white'
              : 'bg-white/95 border-slate-200 text-slate-900'
          }`}
        >
          <div className={`text-[11px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {data.fullDate || data.date}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold font-mono tabular-nums">
              {displayMoney(data.value)}
            </div>
            {data.pnl !== 0 && (
              <div
                className={`text-[11px] font-semibold font-mono ${
                  data.pnl >= 0
                    ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                    : isDark ? 'text-rose-400' : 'text-rose-600'
                }`}
              >
                {data.pnl >= 0 ? `+${data.pnl}%` : `${data.pnl}%`}
              </div>
            )}
          </div>
          {data.profit !== 0 && (
            <div className={`text-[10px] mt-0.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Selisih vs bulan sebelumnya: {data.profit >= 0 ? `+${displayMoney(data.profit)}` : displayMoney(data.profit)}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const recapRangeLabel = useMemo(() => {
    if (chartPoints.length === 0) return `Periode ${currentMonthSheet}`;
    if (chartPoints.length === 1) return `Rekap ${chartPoints[0].date}`;
    return `${chartPoints[0].date} – ${chartPoints[chartPoints.length - 1].date} (${chartPoints.length} Bulan Rekap)`;
  }, [chartPoints, currentMonthSheet]);

  return (
    <Card
      className={`w-full overflow-hidden border transition-all duration-300 rounded-2xl ${
        isDark
          ? 'bg-slate-900/70 border-white/10 shadow-lg text-white'
          : 'bg-white border-slate-200 shadow-xs text-slate-900'
      }`}
    >
      <CardContent className="flex flex-col items-stretch gap-4 p-5 sm:p-6">
        {/* Header: Title, Metric, Growth Indicator, and Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className={`flex items-center flex-wrap gap-2 text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="uppercase tracking-wider font-semibold">
                {chartMode === 'networth' ? 'Tren Total Aset Lintas Bulan' : 'Arus Kas Bersih Lintas Bulan'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{recapRangeLabel}</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {displayMoney(displayMainValue)}
              </span>

              {hasComparison && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold font-mono ${
                    changePct >= 0
                      ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                      : isDark ? 'text-rose-400' : 'text-rose-600'
                  }`}
                >
                  {changePct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>
                    {changeDiff >= 0 ? `+${displayMoney(changeDiff)}` : displayMoney(changeDiff)} ({changePct >= 0 ? `+${changePct}%` : `${changePct}%`})
                  </span>
                  <span className="font-normal opacity-75 text-[11px]">
                    {prevMonthLabel} → {activeMonthLabel}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Right Action: Mode Switcher & Portfolio Shortcut */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className={`p-1 rounded-xl border flex items-center gap-1 ${
              isDark ? 'bg-slate-800/80 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setChartMode('networth')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'networth'
                    ? isDark
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Total Aset
              </button>
              <button
                onClick={() => setChartMode('cashflow')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'cashflow'
                    ? isDark
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Arus Kas
              </button>
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate('portfolio')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/15 border-white/15 text-slate-200 hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
                }`}
              >
                <span>Aset</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Summary Metrics Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 text-xs pb-3 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              {chartMode === 'networth' ? `Portofolio (${currentMonthSheet}):` : `Surplus (${currentMonthSheet}):`}
            </span>
            <span className="font-semibold font-mono tabular-nums">
              {displayMoney(chartMode === 'networth' ? totalInvestment : netCashflow)}
            </span>
            <span className={`font-mono text-[11px] ${
              secondaryRatioPct >= 0
                ? isDark ? 'text-sky-400' : 'text-sky-600'
                : isDark ? 'text-rose-400' : 'text-rose-600'
            }`}>
              ({chartMode === 'networth' ? `${secondaryRatioPct}% Aset` : `${secondaryRatioPct >= 0 ? '+' : ''}${secondaryRatioPct}% Income`})
            </span>
          </div>

          <div className={`flex items-center flex-wrap gap-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>
              Tertinggi{highPoint ? ` (${highPoint.date})` : ''}:{' '}
              <span className={`font-semibold font-mono tabular-nums ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                {formatCondensedRupiah(highValue)}
              </span>
            </span>
            <span>
              Terendah{lowPoint ? ` (${lowPoint.date})` : ''}:{' '}
              <span className={`font-semibold font-mono tabular-nums ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {formatCondensedRupiah(lowValue)}
              </span>
            </span>
            <span>
              Perubahan:{' '}
              <span className={`font-semibold font-mono tabular-nums ${
                changePct >= 0
                  ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                  : isDark ? 'text-rose-400' : 'text-rose-600'
              }`}>
                {changePct >= 0 ? `+${changePct}%` : `${changePct}%`}
              </span>
            </span>
          </div>
        </div>

        {/* Chart Area or Honest Empty State */}
        {chartPoints.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="h-64 sm:h-80 w-full !aspect-auto [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
          >
            <ComposedChart
              data={chartPoints}
              margin={{
                top: 16,
                right: 18,
                left: 4,
                bottom: 8,
              }}
            >
              <defs>
                <linearGradient id="ringkasanAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartConfig.value.color} stopOpacity={isDark ? 0.22 : 0.15} />
                  <stop offset="100%" stopColor={chartConfig.value.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 6"
                stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)'}
                horizontal={true}
                vertical={false}
              />

              {activeRefDate && (
                <ReferenceLine
                  x={activeRefDate}
                  stroke={isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.4)'}
                  strokeDasharray="3 3"
                  strokeWidth={1.2}
                />
              )}

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                tickMargin={10}
                interval={0}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                width={56}
                tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                tickFormatter={(value) => formatCondensedRupiah(value)}
                tickMargin={8}
                domain={yAxisDomain}
              />

              <ChartTooltip
                content={<CustomTooltip />}
                cursor={{
                  strokeDasharray: '3 3',
                  stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.2)',
                }}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill="url(#ringkasanAreaGrad)"
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke={chartConfig.value.color}
                strokeWidth={2.5}
                isAnimationActive={false}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (cx === undefined || cy === undefined) return <g key={`empty-${payload?.date}`} />;
                  const isCurr = Boolean(payload?.isCurrent);
                  return (
                    <circle
                      key={`dot-${payload.date}`}
                      cx={cx}
                      cy={cy}
                      r={isCurr ? 6 : 4.5}
                      fill={isCurr ? (isDark ? '#38bdf8' : '#0284c7') : chartConfig.value.color}
                      stroke={isDark ? '#0f172a' : '#ffffff'}
                      strokeWidth={isCurr ? 2.5 : 2}
                    />
                  );
                }}
                activeDot={{
                  r: 6.5,
                  fill: chartConfig.value.color,
                  stroke: isDark ? '#0f172a' : '#ffffff',
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div
            className={`h-56 sm:h-64 rounded-xl border flex flex-col items-center justify-center text-center p-6 ${
              isDark ? 'bg-white/[0.02] border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200/80 text-slate-500'
            }`}
          >
            <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {chartMode === 'networth'
                ? 'Belum ada rekapan total aset lintas bulan yang terdeteksi'
                : 'Belum ada transaksi pemasukan atau pengeluaran pada tab bulan ini'}
            </p>
            <p className="text-[11px] max-w-md mb-3">
              {chartMode === 'networth'
                ? 'Klik tombol Sync Sheets untuk menarik seluruh tab bulan rekapan dari Google Sheet Anda.'
                : 'Catat transaksi pemasukan atau pengeluaran terlebih dahulu untuk melihat grafik arus kas bersih.'}
            </p>
            {onNavigate && (
              <button
                onClick={() => onNavigate(chartMode === 'networth' ? 'portfolio' : 'cashflow')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                    : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                }`}
              >
                {chartMode === 'networth' ? 'Kelola Portofolio' : 'Input Transaksi'}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
