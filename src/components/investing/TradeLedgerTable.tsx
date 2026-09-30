'use client';

import React, { useState, useMemo } from 'react';
import { TradeRecord, TradeType, TradeStatus } from '../../types';
import { formatRupiah } from '../../lib/sheetsApi';
import {
  Search,
  Download,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronDown,
  Filter
} from 'lucide-react';

interface TradeLedgerTableProps {
  trades: TradeRecord[];
  isDark?: boolean;
  sheetTitle?: string;
  sheetConnected?: boolean;
  selectedAssetFilter?: string | null;
  onClearAssetFilter?: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (trade: TradeRecord) => void;
  onOpenDeleteModal: (trade: TradeRecord) => void;
}

export const TradeLedgerTable: React.FC<TradeLedgerTableProps> = ({
  trades = [],
  isDark = true,
  sheetTitle = 'INVESTING',
  sheetConnected = false,
  selectedAssetFilter = null,
  onClearAssetFilter,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeleteModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TradeStatus>('ALL');

  // Filtered rows
  const filteredRows = useMemo(() => {
    return trades.filter((t) => {
      // Asset filter from Heatmap / Summary click
      if (selectedAssetFilter && t.asset.toUpperCase() !== selectedAssetFilter.toUpperCase()) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAsset = t.asset.toLowerCase().includes(q);
        const matchesType = t.type.toLowerCase().includes(q);
        const matchesDate = (t.entryDate || '').includes(q) || (t.exitDate || '').includes(q);
        const matchesStatus = t.status.toLowerCase().includes(q);
        return matchesAsset || matchesType || matchesDate || matchesStatus;
      }
      return true;
    });
  }, [trades, selectedAssetFilter, statusFilter, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    if (trades.length === 0) return;
    const headers = [
      'Type',
      'Asset',
      'Nominal (IDR)',
      'Kurs IDR-USD',
      'Jumlah',
      'Entry Date',
      'Exit Date',
      'Entry Price',
      'Exit Price',
      'PnL (%)',
      'Spread 0.5%',
      'Laba Bersih',
      'Status',
      'Nilai Aset'
    ];

    const rows = filteredRows.map((t) => [
      t.type,
      t.asset,
      t.nominalIdr,
      t.kurs > 1 ? t.kurs : '',
      t.jumlah,
      t.entryDate,
      t.exitDate || '',
      t.entryPrice,
      t.exitPrice || '',
      `${t.pnlPercent}%`,
      t.spreadCost,
      t.labaBersih,
      t.status,
      t.status === 'Floating' ? t.nilaiAset : ''
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Jurnal_${sheetTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatPrice = (trade: TradeRecord, price: number | undefined) => {
    if (!price || price === 0) return '—';
    if (trade.asset === 'GOLD' || trade.kurs <= 1) {
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
      {/* Table Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Rekap Transaksi Tab {sheetTitle}
          </h2>
          <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
            isDark ? 'bg-sky-500/15 border-sky-500/30 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-700'
          }`}>
            {trades.length} baris transaksi
          </span>
          {selectedAssetFilter && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30 text-xs font-mono font-semibold">
              <Filter className="w-3 h-3" />
              <span>Filter: {selectedAssetFilter}</span>
              {onClearAssetFilter && (
                <button
                  onClick={onClearAssetFilter}
                  className="hover:text-white cursor-pointer ml-1 font-bold"
                  title="Hapus filter aset"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>

        {/* Controls: Search, Status Dropdown, Download, Add */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
          {/* Search Input */}
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aset (NVDA, GOLD)..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border font-medium outline-none transition ${
                isDark
                  ? 'bg-slate-950 border-white/10 text-white placeholder-slate-500 focus:border-sky-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`border text-xs rounded-xl px-3 py-1.5 outline-none font-semibold cursor-pointer appearance-none pr-7 ${
                isDark
                  ? 'bg-slate-950 border-white/10 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="ALL">Semua Status</option>
              <option value="Floating">Floating Saja</option>
              <option value="Realized">Realized Saja</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Download CSV Icon Button */}
          <button
            onClick={handleExportCSV}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDark
                ? 'bg-slate-950 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Unduh seluruh rekap CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Add Trade Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition active:scale-95 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Posisi</span>
          </button>
        </div>
      </div>

      {/* Table Canvas */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs whitespace-nowrap font-mono">
          <thead className={`border-b uppercase tracking-wider text-[11px] ${
            isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <tr>
              <th className="py-3 px-3 font-semibold">Type</th>
              <th className="py-3 px-3 font-semibold">Asset</th>
              <th className="py-3 px-3 font-semibold text-right">Nominal (IDR)</th>
              <th className="py-3 px-3 font-semibold text-center">Kurs IDR-USD</th>
              <th className="py-3 px-3 font-semibold text-right">Jumlah</th>
              <th className="py-3 px-3 font-semibold">Entry Date</th>
              <th className="py-3 px-3 font-semibold">Exit Date</th>
              <th className="py-3 px-3 font-semibold text-right">Entry Price</th>
              <th className="py-3 px-3 font-semibold text-right">Exit Price</th>
              <th className="py-3 px-3 font-semibold text-right">PnL (%)</th>
              <th className="py-3 px-3 font-semibold text-right">Spread 0.5%</th>
              <th className="py-3 px-3 font-semibold text-right">Laba Bersih</th>
              <th className="py-3 px-3 font-semibold text-center">Status</th>
              <th className="py-3 px-3 font-semibold text-right">Nilai Aset</th>
              <th className="py-3 px-3 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-8 text-center text-slate-400 font-sans text-xs">
                  {sheetConnected
                    ? 'Tidak ada data transaksi yang sesuai filter atau pencarian.'
                    : 'Google Sheets Terputus / Belum Terhubung (Default: 0 transaksi).'}
                </td>
              </tr>
            ) : (
              filteredRows.map((t) => {
                const isProfit = t.labaBersih >= 0;
                const isRealized = t.status === 'Realized';

                return (
                  <tr
                    key={t.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Type */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          t.type === 'BUY'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>

                    {/* Asset */}
                    <td className={`py-3 px-3 font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {t.asset}
                    </td>

                    {/* Nominal (IDR) */}
                    <td className={`py-3 px-3 text-right ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {formatRupiah(t.nominalIdr)}
                    </td>

                    {/* Kurs */}
                    <td className="py-3 px-3 text-center text-slate-400">
                      {t.kurs > 1 ? t.kurs.toLocaleString() : '—'}
                    </td>

                    {/* Jumlah */}
                    <td className={`py-3 px-3 text-right ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {t.jumlah.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 3 })}
                    </td>

                    {/* Entry Date */}
                    <td className={`py-3 px-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {t.entryDate || '—'}
                    </td>

                    {/* Exit Date */}
                    <td className={`py-3 px-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {t.exitDate || '—'}
                    </td>

                    {/* Entry Price */}
                    <td className={`py-3 px-3 text-right ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {formatPrice(t, t.entryPrice)}
                    </td>

                    {/* Exit Price */}
                    <td className={`py-3 px-3 text-right ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {formatPrice(t, t.exitPrice)}
                    </td>

                    {/* PnL (%) */}
                    <td className={`py-3 px-3 text-right font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.pnlPercent >= 0 ? `+${t.pnlPercent}%` : `${t.pnlPercent}%`}
                    </td>

                    {/* Spread 0.5% */}
                    <td className="py-3 px-3 text-right text-red-400">
                      {formatRupiah(t.spreadCost)}
                    </td>

                    {/* Laba Bersih */}
                    <td className={`py-3 px-3 text-right font-black ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isProfit ? `+${formatRupiah(t.labaBersih)}` : formatRupiah(t.labaBersih)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      {isRealized ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-500/40 text-blue-400 bg-blue-500/10">
                          <CheckCircle2 className="w-3 h-3 text-blue-400" />
                          <span>Realized</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-sky-400/30 text-sky-400 bg-sky-500/15">
                          <Clock className="w-3 h-3 text-sky-400" />
                          <span>Floating</span>
                        </span>
                      )}
                    </td>

                    {/* Nilai Aset */}
                    <td className={`py-3 px-3 text-right font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {!isRealized && t.nilaiAset > 0 ? formatRupiah(t.nilaiAset) : '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenEditModal(t)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isDark
                              ? 'border-white/10 hover:bg-white/10 text-slate-300 hover:text-white'
                              : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                          }`}
                          title="Edit baris di Google Sheet"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onOpenDeleteModal(t)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isDark
                              ? 'border-white/10 hover:bg-red-500/20 text-red-400 hover:text-red-300'
                              : 'border-slate-200 hover:bg-red-50 text-red-600 hover:text-red-700'
                          }`}
                          title="Hapus baris dari Google Sheet"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
