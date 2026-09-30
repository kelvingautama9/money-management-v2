'use client';

import React from 'react';
import { ActiveAssetSummary, TradeRecord } from '../../types';
import { formatRupiah } from '../../lib/sheetsApi';
import { Clock, Filter, ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';

interface ActiveAssetsSummaryTableProps {
  summaries?: ActiveAssetSummary[];
  trades?: TradeRecord[];
  isDark?: boolean;
  selectedAssetFilter?: string | null;
  onSelectAsset?: (asset: string | null) => void;
}

export const ActiveAssetsSummaryTable: React.FC<ActiveAssetsSummaryTableProps> = ({
  summaries = [],
  trades = [],
  isDark = true,
  selectedAssetFilter = null,
  onSelectAsset
}) => {
  // Compute active summaries from floating trades if summaries array is empty
  const activeItems = React.useMemo(() => {
    if (summaries && summaries.length > 0) return summaries;

    const floatingTrades = trades.filter((t) => t.status === 'Floating');
    const assetMap = new Map<
      string,
      { totalNominal: number; totalUnits: number; latestPrice: number; totalValue: number }
    >();

    floatingTrades.forEach((t) => {
      const asset = t.asset.toUpperCase();
      const existing = assetMap.get(asset) || {
        totalNominal: 0,
        totalUnits: 0,
        latestPrice: 0,
        totalValue: 0
      };
      existing.totalNominal += t.nominalIdr;
      existing.totalUnits += t.jumlah || 1;
      existing.latestPrice = t.exitPrice || t.entryPrice;
      existing.totalValue += t.nilaiAset || t.nominalIdr;
      assetMap.set(asset, existing);
    });

    return Array.from(assetMap.entries()).map(([asset, data]) => {
      // Weighted average buy price
      const avgBuy = data.totalUnits > 0 ? data.totalNominal / data.totalUnits : 100;
      const priceNow = data.latestPrice;
      const pnlPercent = avgBuy > 0 ? ((priceNow - avgBuy) / avgBuy) * 100 : 0;

      return {
        asset,
        avgBuy: Number(avgBuy.toFixed(1)),
        priceNow: Number(priceNow.toFixed(1)),
        pnlPercent: Number(pnlPercent.toFixed(2)),
        valueTotalIdr: data.totalValue
      };
    });
  }, [summaries, trades]);

  const grandTotalValue = React.useMemo(() => {
    return activeItems.reduce((acc, item) => acc + item.valueTotalIdr, 0);
  }, [activeItems]);

  const formatPrice = (asset: string, price: number) => {
    if (!price || price === 0) return '—';
    if (asset === 'GOLD') {
      return formatRupiah(price);
    }
    return `$${price.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;
  };

  return (
    <div
      className={`w-full rounded-2xl sm:rounded-3xl p-5 sm:p-7 border transition-all duration-300 shadow-xl overflow-hidden ${
        isDark
          ? 'bg-slate-900/80 border-white/10 text-white backdrop-blur-md'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-400/30">
            <Clock className="w-4 h-4" />
          </span>
          <div>
            <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Ringkasan Aset Portofolio Aktif (Floating)
            </h3>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tabel Rekapitulasi Kolom P~S Google Sheet
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedAssetFilter && (
            <button
              onClick={() => onSelectAsset && onSelectAsset(null)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-400/30 hover:bg-sky-500/30 transition cursor-pointer"
            >
              <Filter className="w-3 h-3" />
              <span>Reset Filter: {selectedAssetFilter}</span>
            </button>
          )}
          <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
            isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            {activeItems.length} Aset Terbuka
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs whitespace-nowrap font-mono">
          <thead className={`border-b uppercase tracking-wider text-[11px] ${
            isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <tr>
              <th className="py-3 px-4 font-semibold">ASSET</th>
              <th className="py-3 px-4 font-semibold text-right">AVERAGE BUY</th>
              <th className="py-3 px-4 font-semibold text-right">PRICE NOW</th>
              <th className="py-3 px-4 font-semibold text-right">PnL (%)</th>
              <th className="py-3 px-4 font-semibold text-right">VALUE TOTAL (IDR)</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
            {activeItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-sans text-xs">
                  Tidak ada posisi floating aktif saat ini. Seluruh posisi telah ditutup (Realized).
                </td>
              </tr>
            ) : (
              activeItems.map((item) => {
                const isSelected = selectedAssetFilter === item.asset;
                const isProfit = item.pnlPercent >= 0;

                return (
                  <tr
                    key={item.asset}
                    onClick={() => onSelectAsset && onSelectAsset(isSelected ? null : item.asset)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-sky-500/20'
                          : 'bg-sky-50'
                        : isDark
                        ? 'hover:bg-white/[0.04]'
                        : 'hover:bg-slate-50'
                    }`}
                    title={`Klik untuk memfilter transaksi ${item.asset}`}
                  >
                    <td className="py-3.5 px-4 font-bold text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                          isSelected
                            ? 'bg-sky-500 text-white border-sky-400'
                            : isDark
                            ? 'bg-white/10 text-white border-white/10'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {item.asset}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] text-sky-400 font-sans font-semibold">
                            (Terpilih)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-3.5 px-4 text-right ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {formatPrice(item.asset, item.avgBuy)}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {formatPrice(item.asset, item.priceNow)}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold ${
                      isProfit ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      <div className="inline-flex items-center gap-1 justify-end">
                        {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{isProfit ? `+${item.pnlPercent}%` : `${item.pnlPercent}%`}</span>
                      </div>
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatRupiah(item.valueTotalIdr)}
                    </td>
                  </tr>
                );
              })
            )}

            {/* Grand Total Row */}
            <tr className={`border-t-2 ${isDark ? 'border-white/15 bg-white/[0.02]' : 'border-slate-300 bg-slate-50'}`}>
              <td colSpan={4} className={`py-4 px-4 font-black uppercase tracking-wider text-xs ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                GRAND TOTAL NILAI ASET
              </td>
              <td className={`py-4 px-4 text-right font-black text-base sm:text-lg font-mono ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`}>
                {formatRupiah(grandTotalValue)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
