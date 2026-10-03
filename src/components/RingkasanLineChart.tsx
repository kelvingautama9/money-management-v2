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
  cashStandbyDanaDarurat?: number;
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

/**
 * Extracts year (if specified in tab name e.g. "Januari 2027") and month index (1..12)
 * so cross-year tabs sort accurately and never collide.
 */
function parseMonthAndYear(name: string): { year: number; month: number; sortKey: number } {
  const raw = (name || '').trim();
  const yearMatch = raw.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : 2026;
  const cleanAlpha = raw.toLowerCase().replace(/[^a-z]/g, '');

  let month = 99;
  if (cleanAlpha) {
    for (const [k, v] of Object.entries(MONTH_ORDER)) {
      if (cleanAlpha === k || cleanAlpha.startsWith(k)) {
        month = v;
        break;
      }
    }
  }
  const sortKey = month !== 99 ? year * 100 + month : 999999;
  return { year, month, sortKey };
}

function formatMonthLabel(name: string): string {
  const clean = (name || '').trim();
  const { year, month } = parseMonthAndYear(clean);
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
  if (month >= 1 && month <= 12) {
    return /\b20\d{2}\b/.test(clean) ? `${fullNames[month]} ${year}` : fullNames[month];
  }
  return clean || 'Bulan';
}

function formatShortMonth(name: string): string {
  const clean = (name || '').trim();
  const { year, month } = parseMonthAndYear(clean);
  const shortNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  if (month >= 1 && month <= 12) {
    return /\b20\d{2}\b/.test(clean) && year !== 2026
      ? `${shortNames[month]} '${String(year).slice(-2)}`
      : shortNames[month];
  }
  return clean.slice(0, 4) || 'Bln';
}

interface ResolvedTabSnapshot {
  totalAset: number;
  kasCair: number;
  investasi: number;
  sourceLabel: string;
  hasRealActivity: boolean;
}

/**
 * Strictly resolves Net Worth (Total Aset) and its components (Kas Cair vs Investasi)
 * from the Account Snapshot / Summary Table (NEVER from raw transaction flow),
 * with audit metadata indicating the exact source cell/method.
 */
function resolveTabNetWorthSnapshot(
  tabName: string,
  isCurrent: boolean,
  liveTotalAset: number,
  liveKasCair: number,
  liveInvestasi: number,
  sheetSummaries: Record<string, SheetSummary>,
  history: InvestmentHistory[]
): ResolvedTabSnapshot {
  const sumObj =
    sheetSummaries?.[tabName] ||
    sheetSummaries?.[tabName.toUpperCase()] ||
    sheetSummaries?.[tabName.toLowerCase()];

  if (isCurrent && liveTotalAset !== 0) {
    const cellRef = sumObj?.sourceCell ? `Sel ${sumObj.sourceCell} (Tab ${tabName})` : `Tab Aktif (${tabName})`;
    return {
      totalAset: liveTotalAset,
      kasCair: liveKasCair || Math.max(0, liveTotalAset - liveInvestasi),
      investasi: liveInvestasi,
      sourceLabel: cellRef,
      hasRealActivity: true
    };
  }

  if (sumObj) {
    let resolvedTotal = 0;
    let sourceLabel = `Ringkasan Tab ${tabName}`;

    if (typeof sumObj.totalAset === 'number' && sumObj.totalAset !== 0) {
      resolvedTotal = sumObj.totalAset;
      if (sumObj.sourceMethod === 'cell_anchor' && sumObj.sourceCell) {
        sourceLabel = `Formula Sel ${sumObj.sourceCell} (Tab ${tabName})`;
      } else if (sumObj.sourceMethod === 'account_table') {
        sourceLabel = `Tabel Nama Akun (Tab ${tabName})`;
      } else if (sumObj.sourceMethod === 'component_sum') {
        sourceLabel = `Kas + Investasi (Tab ${tabName})`;
      }
    } else {
      const combined = (Number(sumObj.cashStandbyDanaDarurat) || 0) + (Number(sumObj.totalInvestment) || 0);
      if (combined !== 0) {
        resolvedTotal = combined;
        sourceLabel = `Kas + Investasi (Tab ${tabName})`;
      } else if (sumObj.accountBalances && Object.keys(sumObj.accountBalances).length > 0) {
        const seen = new Set<string>();
        let accSum = 0;
        let hasBal = false;
        Object.entries(sumObj.accountBalances).forEach(([k, v]) => {
          const lowerK = k.toLowerCase().trim();
          const cleanK = lowerK.replace(/[^a-z0-9]/g, '');
          if (
            typeof v === 'number' &&
            cleanK &&
            !seen.has(cleanK) &&
            !lowerK.startsWith('total') &&
            !lowerK.startsWith('subtotal') &&
            !lowerK.startsWith('grand total')
          ) {
            seen.add(cleanK);
            accSum += v;
            hasBal = true;
          }
        });
        if (hasBal && accSum !== 0) {
          resolvedTotal = accSum;
          sourceLabel = `Tabel Nama Akun (Tab ${tabName})`;
        }
      }
    }

    if (resolvedTotal !== 0) {
      let kas = Number(sumObj.cashStandbyDanaDarurat) || 0;
      let inv = Number(sumObj.totalInvestment) || 0;
      if (kas === 0 && inv === 0) {
        kas = resolvedTotal;
      } else if (kas !== 0 && inv === 0 && resolvedTotal > kas) {
        inv = resolvedTotal - kas;
      } else if (inv !== 0 && kas === 0) {
        kas = resolvedTotal - inv;
      }

      return {
        totalAset: resolvedTotal,
        kasCair: kas,
        investasi: inv,
        sourceLabel,
        hasRealActivity: sumObj.hasRealActivity !== false
      };
    }
  }

  // Fallback to InvestmentHistory snapshot if available for this month
  const { month } = parseMonthAndYear(tabName);
  if (Array.isArray(history) && history.length > 0) {
    const match = history.find((h) => {
      const hParsed = parseMonthAndYear(h.bulan);
      return (month !== 99 && hParsed.month === month) || h.bulan.toLowerCase().includes(tabName.toLowerCase());
    });
    if (match && Number(match.totalNetWorth) !== 0) {
      const inv = (Number(match.pluang) || 0) + (Number(match.valasBca) || 0) + (Number(match.usdtBinance) || 0);
      const total = Number(match.totalNetWorth);
      return {
        totalAset: total,
        kasCair: Math.max(0, total - inv),
        investasi: inv > 0 ? inv : total,
        sourceLabel: `Rekap Historis (${match.bulan})`,
        hasRealActivity: true
      };
    }
  }

  return {
    totalAset: 0,
    kasCair: 0,
    investasi: 0,
    sourceLabel: '-',
    hasRealActivity: false
  };
}

export const RingkasanLineChart: React.FC<RingkasanLineChartProps> = ({
  totalAset,
  cashStandbyDanaDarurat = 0,
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
  const [sortOrderMode, setSortOrderMode] = useState<'calendar' | 'sheet_order'>('calendar');
  const [showComponentLines, setShowComponentLines] = useState<boolean>(true);

  const chartConfig = useMemo(() => {
    return {
      value: {
        label: chartMode === 'networth' ? 'Total Aset' : 'Arus Kas Bersih',
        color: isDark ? '#38bdf8' : '#0284c7',
      },
      kasCair: {
        label: 'Kas & Rekening',
        color: isDark ? '#34d399' : '#059669',
      },
      investasi: {
        label: 'Portofolio Investasi',
        color: isDark ? '#818cf8' : '#4f46e5',
      }
    } satisfies ChartConfig;
  }, [isDark, chartMode]);

  // Build 100% deterministic chart points from detected Google Sheet month tabs
  const chartPoints = useMemo(() => {
    const cleanCurr = (currentMonthSheet || '').trim();
    const currParsed = parseMonthAndYear(cleanCurr);

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
          sortKey: number;
          tabOrder: number;
          tabName: string;
          date: string;
          fullDate: string;
          value: number;
          kasCair: number;
          investasi: number;
          sourceLabel: string;
          isCurrent: boolean;
        }
      >();

      detectedMonthTabs.forEach((tab, tabIdx) => {
        const parsed = parseMonthAndYear(tab);
        const key = parsed.month !== 99 ? `m-${parsed.sortKey}` : `tab-${tab.toLowerCase()}`;
        const isCurrent =
          tab.toLowerCase() === cleanCurr.toLowerCase() ||
          (parsed.month !== 99 && parsed.sortKey === currParsed.sortKey);

        const snap = resolveTabNetWorthSnapshot(
          tab,
          isCurrent,
          totalAset,
          cashStandbyDanaDarurat,
          totalInvestment,
          sheetSummaries,
          history
        );

        // Filter out future empty template tabs (where totalAset === 0 and no real activity)
        if (snap.hasRealActivity && snap.totalAset !== 0) {
          pointMap.set(key, {
            sortKey: parsed.sortKey,
            tabOrder: tabIdx,
            tabName: tab,
            date: parsed.month !== 99 ? formatShortMonth(tab) : tab,
            fullDate: parsed.month !== 99 ? `${formatMonthLabel(tab)} (Tab: ${tab})` : tab,
            value: snap.totalAset,
            kasCair: snap.kasCair,
            investasi: snap.investasi,
            sourceLabel: snap.sourceLabel,
            isCurrent
          });
        }
      });

      // Also include any month in sheetSummaries that wasn't in availableSheets yet
      if (sheetSummaries && typeof sheetSummaries === 'object') {
        Object.keys(sheetSummaries).forEach((tabKey, idx) => {
          const parsed = parseMonthAndYear(tabKey);
          if (parsed.month === 99) return;
          const key = `m-${parsed.sortKey}`;
          if (pointMap.has(key)) return;
          const isCurrent = parsed.sortKey === currParsed.sortKey;
          const snap = resolveTabNetWorthSnapshot(
            tabKey,
            isCurrent,
            totalAset,
            cashStandbyDanaDarurat,
            totalInvestment,
            sheetSummaries,
            history
          );
          if (snap.hasRealActivity && snap.totalAset !== 0) {
            pointMap.set(key, {
              sortKey: parsed.sortKey,
              tabOrder: 100 + idx,
              tabName: tabKey,
              date: formatShortMonth(tabKey),
              fullDate: `${formatMonthLabel(tabKey)} (Tab: ${tabKey})`,
              value: snap.totalAset,
              kasCair: snap.kasCair,
              investasi: snap.investasi,
              sourceLabel: snap.sourceLabel,
              isCurrent
            });
          }
        });
      }

      const sorted = Array.from(pointMap.values()).sort((a, b) => {
        if (sortOrderMode === 'sheet_order') {
          return a.tabOrder - b.tabOrder;
        }
        if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
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
          isKey: true
        };
      });
    } else {
      // Cashflow mode: 100% pure Income minus pure Expense per month tab (ignoring Saldo Bulan Lalu & Transfer Internal)
      const cashflowMap = new Map<
        string,
        {
          sortKey: number;
          tabOrder: number;
          tabName: string;
          date: string;
          fullDate: string;
          income: number;
          expense: number;
          value: number;
          kasCair: number;
          investasi: number;
          sourceLabel: string;
          isCurrent: boolean;
        }
      >();

      detectedMonthTabs.forEach((tab, tabIdx) => {
        const parsed = parseMonthAndYear(tab);
        const key = parsed.month !== 99 ? `m-${parsed.sortKey}` : `tab-${tab.toLowerCase()}`;
        const isCurrent =
          tab.toLowerCase() === cleanCurr.toLowerCase() ||
          (parsed.month !== 99 && parsed.sortKey === currParsed.sortKey);

        if (isCurrent && (totalPemasukan > 0 || totalPengeluaran > 0)) {
          cashflowMap.set(key, {
            sortKey: parsed.sortKey,
            tabOrder: tabIdx,
            tabName: tab,
            date: parsed.month !== 99 ? formatShortMonth(tab) : tab,
            fullDate: parsed.month !== 99 ? `${formatMonthLabel(tab)} (Tab: ${tab})` : tab,
            income: totalPemasukan,
            expense: totalPengeluaran,
            value: totalPemasukan - totalPengeluaran,
            kasCair: totalPemasukan,
            investasi: totalPengeluaran,
            sourceLabel: `Mutasi Murni Tab ${tab}`,
            isCurrent: true
          });
          return;
        }

        // Check precomputed pure cashflow in sheetSummaries first
        const sumObj =
          sheetSummaries?.[tab] ||
          sheetSummaries?.[tab.toUpperCase()] ||
          sheetSummaries?.[tab.toLowerCase()];

        if (sumObj && ((sumObj.totalPemasukan ?? 0) > 0 || (sumObj.totalPengeluaran ?? 0) > 0)) {
          const inc = Number(sumObj.totalPemasukan) || 0;
          const exp = Number(sumObj.totalPengeluaran) || 0;
          cashflowMap.set(key, {
            sortKey: parsed.sortKey,
            tabOrder: tabIdx,
            tabName: tab,
            date: parsed.month !== 99 ? formatShortMonth(tab) : tab,
            fullDate: parsed.month !== 99 ? `${formatMonthLabel(tab)} (Tab: ${tab})` : tab,
            income: inc,
            expense: exp,
            value: inc - exp,
            kasCair: inc,
            investasi: exp,
            sourceLabel: `Mutasi Murni Tab ${tab}`,
            isCurrent
          });
          return;
        }

        // Fallback to cached transactions for this tab
        try {
          const cached =
            localStorage.getItem(`kelvin_financial_txs_${tab}`) ||
            localStorage.getItem(`kelvin_financial_txs_${tab.toUpperCase()}`) ||
            localStorage.getItem(`kelvin_financial_txs_${tab.toLowerCase()}`);
          if (cached) {
            const parsedTxs: Transaction[] = JSON.parse(cached);
            if (Array.isArray(parsedTxs) && parsedTxs.length > 0) {
              const inc = parsedTxs
                .filter((t) => t.tipe === 'Income')
                .reduce((s, t) => s + (Number(t.jumlah) || 0), 0);
              const exp = parsedTxs
                .filter((t) => t.tipe === 'Expense')
                .reduce((s, t) => s + (Number(t.jumlah) || 0), 0);
              if (inc > 0 || exp > 0) {
                cashflowMap.set(key, {
                  sortKey: parsed.sortKey,
                  tabOrder: tabIdx,
                  tabName: tab,
                  date: parsed.month !== 99 ? formatShortMonth(tab) : tab,
                  fullDate: parsed.month !== 99 ? `${formatMonthLabel(tab)} (Tab: ${tab})` : tab,
                  income: inc,
                  expense: exp,
                  value: inc - exp,
                  kasCair: inc,
                  investasi: exp,
                  sourceLabel: `Mutasi Murni Tab ${tab}`,
                  isCurrent
                });
              }
            }
          }
        } catch (e) {}
      });

      const sorted = Array.from(cashflowMap.values()).sort((a, b) => {
        if (sortOrderMode === 'sheet_order') {
          return a.tabOrder - b.tabOrder;
        }
        if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
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
    sortOrderMode,
    availableSheets,
    sheetSummaries,
    history,
    transactions,
    totalAset,
    cashStandbyDanaDarurat,
    totalInvestment,
    totalPemasukan,
    totalPengeluaran,
    currentMonthSheet
  ]);

  const values = chartPoints.map((p) => p.value);
  const netCashflow = totalPemasukan - totalPengeluaran;

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

  // Dynamic Y-Axis domain accounting for both Total Aset and component breakdown lines if visible
  const yAxisDomain = useMemo<[number, number]>(() => {
    if (chartPoints.length === 0) return [0, 10_000_000];
    const allNums: number[] = [];
    chartPoints.forEach((p) => {
      allNums.push(p.value);
      if (chartMode === 'networth' && showComponentLines) {
        allNums.push(p.kasCair, p.investasi);
      }
    });
    const min = Math.min(...allNums);
    const max = Math.max(...allNums);
    if (min === max) {
      const pad = Math.max(Math.abs(max) * 0.15, 500_000);
      return [chartMode === 'networth' && min >= 0 ? Math.max(0, min - pad) : min - pad, max + pad];
    }
    const span = max - min;
    const pad = Math.max(span * 0.18, 250_000);
    const lower = chartMode === 'networth' && min >= 0 ? Math.max(0, Math.floor(min - pad)) : Math.floor(min - pad);
    const upper = Math.ceil(max + pad);
    return [lower, upper];
  }, [chartPoints, chartMode, showComponentLines]);

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

  // Self-Auditing Tooltip with Kas Cair + Investasi breakdown and exact Sheet Source Cell
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className={`p-3 rounded-xl border text-xs shadow-lg min-w-[215px] ${
            isDark
              ? 'bg-slate-900/95 border-white/15 text-white'
              : 'bg-white/95 border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {data.fullDate || data.date}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3 pt-0.5">
            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {chartMode === 'networth' ? 'Total Aset:' : 'Net Cashflow:'}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold font-mono tabular-nums">
                {displayMoney(data.value)}
              </span>
              {data.pnl !== 0 && (
                <span
                  className={`text-[10px] font-semibold font-mono ${
                    data.pnl >= 0
                      ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                      : isDark ? 'text-rose-400' : 'text-rose-600'
                  }`}
                >
                  ({data.pnl >= 0 ? `+${data.pnl}%` : `${data.pnl}%`})
                </span>
              )}
            </div>
          </div>

          {/* Component Breakdown: Kas Cair vs Portofolio Investasi (or Income vs Expense) */}
          <div className={`mt-2 pt-2 border-t space-y-1 text-[11px] ${isDark ? 'border-white/10' : 'border-slate-200/80'}`}>
            <div className="flex items-center justify-between gap-3">
              <span className={`inline-flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="w-2 h-2 rounded-xs bg-emerald-500 inline-block" />
                {chartMode === 'networth' ? 'Kas & Rekening:' : 'Pemasukan Murni:'}
              </span>
              <span className="font-mono font-medium tabular-nums">
                {displayMoney(data.kasCair || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className={`inline-flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="w-2 h-2 rounded-xs bg-indigo-400 inline-block" />
                {chartMode === 'networth' ? 'Portofolio Investasi:' : 'Pengeluaran Murni:'}
              </span>
              <span className="font-mono font-medium tabular-nums">
                {displayMoney(data.investasi || 0)}
              </span>
            </div>
          </div>

          {data.profit !== 0 && (
            <div className={`text-[10px] mt-1.5 pt-1.5 border-t font-mono ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200/80 text-slate-500'}`}>
              Selisih vs rekap sebelumnya: {data.profit >= 0 ? `+${displayMoney(data.profit)}` : displayMoney(data.profit)}
            </div>
          )}

          {data.sourceLabel && (
            <div className={`text-[10px] mt-1 font-mono ${isDark ? 'text-sky-400/90' : 'text-sky-700'}`}>
              Sumber: {data.sourceLabel}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const detectedTabsListText = useMemo(() => {
    if (chartPoints.length === 0) return `Periode ${currentMonthSheet}`;
    const names = chartPoints.map((p) => p.date).join(', ');
    return `${chartPoints.length} Tab Rekap Terbaca (${names})`;
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
        {/* Header: Title, Metric, Growth Indicator, and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className={`flex items-center flex-wrap gap-2 text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="uppercase tracking-wider font-semibold">
                {chartMode === 'networth' ? 'Tren Total Aset Lintas Bulan' : 'Arus Kas Bersih Lintas Bulan'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[11px]">{detectedTabsListText}</span>
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

          {/* Right Action: Mode Switcher, Sort Order Toggle, & Portfolio Shortcut */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* Primary Chart Mode: Total Aset vs Arus Kas */}
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

            {/* X-Axis Order Toggle: Kalender vs Urutan Tab Sheet */}
            <button
              onClick={() => setSortOrderMode((prev) => (prev === 'calendar' ? 'sheet_order' : 'calendar'))}
              className={`text-xs font-medium px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              title="Ubah urutan sumbu X antara urutan Kalender atau urutan posisi Tab di Google Sheet"
            >
              Urutan: {sortOrderMode === 'calendar' ? 'Kalender' : 'Tab Sheet'}
            </button>

            {chartMode === 'networth' && (
              <button
                onClick={() => setShowComponentLines((prev) => !prev)}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
                  showComponentLines
                    ? isDark
                      ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                      : 'bg-sky-50 border-sky-200 text-sky-700'
                    : isDark
                      ? 'bg-white/5 border-white/10 text-slate-400'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
                title="Tampilkan/sembunyikan garis rincian Kas Cair vs Portofolio Investasi"
              >
                Rincian Kas & Investasi
              </button>
            )}

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

        {/* Summary Metrics & Legend Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 text-xs pb-3 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center flex-wrap gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-500 inline-block" />
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                {chartMode === 'networth' ? 'Total Aset' : 'Arus Kas Bersih'}
              </span>
            </div>

            {chartMode === 'networth' && showComponentLines && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" />
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    Kas & Rekening: <strong className="font-mono">{displayMoney(cashStandbyDanaDarurat)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-indigo-400 inline-block" />
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    Investasi: <strong className="font-mono">{displayMoney(totalInvestment)}</strong> ({secondaryRatioPct}%)
                  </span>
                </div>
              </>
            )}

            {chartMode === 'cashflow' && (
              <div className="flex items-center gap-2">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  Surplus ({currentMonthSheet}):
                </span>
                <span className="font-semibold font-mono tabular-nums">
                  {displayMoney(netCashflow)}
                </span>
                <span className={`font-mono text-[11px] ${
                  secondaryRatioPct >= 0
                    ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                    : isDark ? 'text-rose-400' : 'text-rose-600'
                }`}>
                  ({secondaryRatioPct >= 0 ? '+' : ''}{secondaryRatioPct}% Income)
                </span>
              </div>
            )}
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

              {/* Secondary Component Breakdown Lines: Kas Cair & Portofolio Investasi */}
              {chartMode === 'networth' && showComponentLines && (
                <>
                  <Line
                    type="monotone"
                    dataKey="kasCair"
                    stroke={chartConfig.kasCair.color}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="investasi"
                    stroke={chartConfig.investasi.color}
                    strokeWidth={1.5}
                    strokeDasharray="2 3"
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}

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
                      key={`dot-${payload.date}-${payload.tabName}`}
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
