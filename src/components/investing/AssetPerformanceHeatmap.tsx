'use client';

import React, { useState, useMemo } from 'react';
import { TradeRecord } from '../../types';
import { formatRupiah } from '../../lib/sheetsApi';
import {
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Percent,
  DollarSign,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  Filter
} from 'lucide-react';

interface AssetPerformanceHeatmapProps {
  trades: TradeRecord[];
  isDark?: boolean;
  selectedAssetFilter?: string | null;
  onSelectAsset?: (asset: string | null) => void;
}

export type HeatmapScope = 'all' | 'floating' | 'realized';
export type SortOption = 'roi_desc' | 'roi_asc' | 'nominal_desc';

export const AssetPerformanceHeatmap: React.FC<AssetPerformanceHeatmapProps> = ({
  trades = [],
  isDark = true,
  selectedAssetFilter = null,
  onSelectAsset
}) => {
  const [scope, setScope] = useState<HeatmapScope>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [metricDisplay, setMetricDisplay] = useState<'percent' | 'nominal'>('percent');
  const [sortBy, setSortBy] = useState<SortOption>('roi_desc');

  // Filter trades by scope
  const filteredTrades = useMemo(() => {
    if (scope === 'floating') return trades.filter((t) => t.status === 'Floating');
    if (scope === 'realized') return trades.filter((t) => t.status === 'Realized');
    return trades;
  }, [trades, scope]);

  // Aggregate by Ticker Asset
  const assetGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        asset: string;
        totalNominal: number;
        totalLaba: number;
        tradesCount: number;
        floatingCount: number;
        realizedCount: number;
      }
    >();

    filteredTrades.forEach((t) => {
      const asset = t.asset.toUpperCase();
      const existing = map.get(asset) || {
        asset,
        totalNominal: 0,
        totalLaba: 0,
        tradesCount: 0,
        floatingCount: 0,
        realizedCount: 0
      };

      existing.totalNominal += t.nominalIdr;
      existing.totalLaba += t.labaBersih;
      existing.tradesCount += 1;
      if (t.status === 'Floating') existing.floatingCount += 1;
      if (t.status === 'Realized') existing.realizedCount += 1;

      map.set(asset, existing);
    });

    const totalPortfolioNominal = Array.from(map.values()).reduce((sum, g) => sum + g.totalNominal, 0);

    const list = Array.from(map.values()).map((g) => {
      const roiPercent = g.totalNominal > 0 ? (g.totalLaba / g.totalNominal) * 100 : 0;
      const allocationPercent = totalPortfolioNominal > 0 ? (g.totalNominal / totalPortfolioNominal) * 100 : 0;

      return {
        ...g,
        roiPercent: Number(roiPercent.toFixed(2)),
        allocationPercent: Number(allocationPercent.toFixed(1))
      };
    });

    // Sorting
    if (sortBy === 'roi_desc') {
      return list.sort((a, b) => b.roiPercent - a.roiPercent);
    }
    if (sortBy === 'roi_asc') {
      return list.sort((a, b) => a.roiPercent - b.roiPercent);
    }
    return list.sort((a, b) => b.totalNominal - a.totalNominal);
  }, [filteredTrades, sortBy]);

  // Top Performer & Underperformer calculation
  const summaryStats = useMemo(() => {
    if (assetGroups.length === 0) return null;
    const sortedByRoi = [...assetGroups].sort((a, b) => b.roiPercent - a.roiPercent);
    const topPerformer = sortedByRoi[0];
    const underperformer = sortedByRoi[sortedByRoi.length - 1];
    const totalPnl = assetGroups.reduce((acc, g) => acc + g.totalLaba, 0);
    const positiveCount = assetGroups.filter((g) => g.roiPercent >= 0).length;
    const positivePct = assetGroups.length > 0 ? Math.round((positiveCount / assetGroups.length) * 100) : 50;

    return {
      topPerformer,
      underperformer,
      totalPnl,
      positivePct
    };
  }, [assetGroups]);

  // Condensed format helper (e.g. "+Rp 2,24 Jt", "-Rp 1,4 Jt", "+Rp 431 Rb")
  const formatCondensed = (val: number) => {
    const absVal = Math.abs(val);
    const sign = val >= 0 ? '+' : '-';
    if (absVal >= 1_000_000) {
      const jt = (absVal / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 });
      return `${sign}Rp ${jt} Jt`;
    }
    if (absVal >= 1_000) {
      const rb = Math.round(absVal / 1_000);
      return `${sign}Rp ${rb} Rb`;
    }
    return `${sign}Rp ${absVal}`;
  };

  // Card color styling strictly avoiding yellow/amber
  const getCardStyle = (roi: number, isSelected: boolean) => {
    let classes = '';

    if (roi >= 20) {
      classes = isDark
        ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-400'
        : 'bg-emerald-50 border-emerald-300 text-emerald-800';
    } else if (roi >= 10) {
      classes = isDark
        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
        : 'bg-emerald-50/60 border-emerald-200 text-emerald-700';
    } else if (roi >= 0) {
      classes = isDark
        ? 'bg-teal-950/20 border-teal-500/30 text-teal-300'
        : 'bg-teal-50 border-teal-200 text-teal-800';
    } else if (roi >= -8) {
      classes = isDark
        ? 'bg-slate-850/60 border-slate-600/40 text-slate-300'
        : 'bg-slate-100 border-slate-300 text-slate-700';
    } else {
      classes = isDark
        ? 'bg-red-950/25 border-red-500/50 text-red-400'
        : 'bg-red-50 border-red-200 text-red-700';
    }

    const ring = isSelected ? 'ring-2 ring-sky-400 scale-[1.02]' : '';
    return `${classes} ${ring}`;
  };

  return (
    <div
      className={`w-full rounded-2xl sm:rounded-3xl p-5 sm:p-7 border transition-all duration-300 shadow-xl overflow-hidden ${
        isDark
          ? 'bg-slate-900/80 border-white/10 text-white backdrop-blur-md'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-400/30">
            <LayoutGrid className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Sebaran Alokasi & Kinerja Aset
              </h3>
              {selectedAssetFilter && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/30">
                  Filter: {selectedAssetFilter}
                </span>
              )}
            </div>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Klik kartu aset untuk memfilter daftar transaksi di bawah
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          {/* Scope Selector */}
          <div className={`p-0.5 rounded-xl border flex items-center text-xs font-semibold ${
            isDark ? 'bg-slate-950 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setScope('all')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                scope === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setScope('floating')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                scope === 'floating'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Floating
            </button>
            <button
              onClick={() => setScope('realized')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                scope === 'realized'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Realized
            </button>
          </div>

          {/* Metric Toggle (% vs Nominal) */}
          <button
            onClick={() => setMetricDisplay(metricDisplay === 'percent' ? 'nominal' : 'percent')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-mono font-semibold transition cursor-pointer ${
              isDark
                ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Ganti tampilan metrik utama kartu (% ROI vs Nominal Rupiah)"
          >
            {metricDisplay === 'percent' ? <Percent className="w-3 h-3 text-sky-400" /> : <DollarSign className="w-3 h-3 text-emerald-400" />}
            <span>{metricDisplay === 'percent' ? 'ROI (%)' : 'Laba (IDR)'}</span>
          </button>

          {/* Compact View Toggle */}
          <button
            onClick={() => setIsCompact(!isCompact)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isDark
                ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title={isCompact ? 'Tampilan Detail' : 'Tampilan Kompak'}
          >
            {isCompact ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isDark
                ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title={isCollapsed ? 'Buka Panel' : 'Ciutkan Panel'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Summary Highlight Badges */}
      {summaryStats && (
        <div className={`flex items-center gap-2 sm:gap-3 flex-wrap text-xs font-mono mb-4 pt-2 border-t ${
          isDark ? 'border-white/5' : 'border-slate-100'
        }`}>
          {summaryStats.topPerformer && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border ${
              isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Top: <strong>{summaryStats.topPerformer.asset}</strong> (+{summaryStats.topPerformer.roiPercent}%)</span>
            </div>
          )}

          {summaryStats.underperformer && summaryStats.underperformer.roiPercent < 0 && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border ${
              isDark ? 'bg-red-950/20 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Lag: <strong>{summaryStats.underperformer.asset}</strong> ({summaryStats.underperformer.roiPercent}%)</span>
            </div>
          )}

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border ${
            isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <span>Win Rate Aset: <strong>{summaryStats.positivePct}%</strong></span>
          </div>

          {selectedAssetFilter && (
            <button
              onClick={() => onSelectAsset && onSelectAsset(null)}
              className="flex items-center gap-1 px-3 py-1 rounded-xl border text-xs font-mono font-bold bg-sky-500/20 text-sky-400 border-sky-400/30 hover:bg-sky-500/30 transition cursor-pointer ml-auto"
            >
              <Filter className="w-3 h-3" />
              <span>Hapus Filter ({selectedAssetFilter})</span>
            </button>
          )}
        </div>
      )}

      {/* Grid of Asset Cards */}
      {!isCollapsed && assetGroups.length === 0 && (
        <div className={`p-8 text-center rounded-2xl border text-xs font-sans ${
          isDark ? 'border-white/10 bg-white/[0.02] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
        }`}>
          Tidak ada sebaran aset aktif saat ini (Google Sheets Terputus atau belum ada trade). Alokasi & Kinerja Aset: <strong>0% (Rp 0)</strong>.
        </div>
      )}

      {!isCollapsed && assetGroups.length > 0 && (
        <div className={`grid gap-3 sm:gap-3.5 ${
          isCompact
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}>
          {assetGroups.map((group) => {
            const isSelected = selectedAssetFilter === group.asset;
            const isProfit = group.roiPercent >= 0;

            return (
              <div
                key={group.asset}
                onClick={() => onSelectAsset && onSelectAsset(isSelected ? null : group.asset)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none relative overflow-hidden flex flex-col justify-between ${getCardStyle(
                  group.roiPercent,
                  isSelected
                )}`}
              >
                {/* Header: Ticker & Allocation % */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base sm:text-lg font-black tracking-tight font-mono">
                    {group.asset}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    {group.allocationPercent}% Alokasi
                  </span>
                </div>

                {/* Primary Metric */}
                <div className="my-1">
                  {metricDisplay === 'percent' ? (
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono tracking-tight flex items-center gap-1">
                        {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{isProfit ? `+${group.roiPercent}%` : `${group.roiPercent}%`}</span>
                      </div>
                      <span className={`text-[11px] font-mono block mt-0.5 opacity-80`}>
                        {formatCondensed(group.totalLaba)}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xl sm:text-2xl font-black font-mono tracking-tight">
                        {formatCondensed(group.totalLaba)}
                      </div>
                      <span className={`text-[11px] font-mono block mt-0.5 opacity-80`}>
                        {isProfit ? `+${group.roiPercent}%` : `${group.roiPercent}%`} ROI
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer: Position stats & nominal */}
                {!isCompact && (
                  <div className={`pt-2.5 mt-2 border-t text-[10px] font-mono flex items-center justify-between ${
                    isDark ? 'border-white/10 opacity-75' : 'border-slate-200/80 opacity-90'
                  }`}>
                    <span>{group.tradesCount} Trx ({group.floatingCount} Flt • {group.realizedCount} Rlz)</span>
                    <span>{formatCondensed(group.totalNominal)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
