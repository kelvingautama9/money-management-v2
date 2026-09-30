'use client';

import React, { useState, useEffect } from 'react';
import { TradeRecord, TradeType, TradeStatus } from '../../types';
import { calculateTradeMetrics, parseIndonesianNumber } from '../../lib/investingSheetsService';
import { formatRupiah } from '../../lib/sheetsApi';
import { X, Save, RefreshCw, Calculator, DollarSign, Calendar, TrendingUp } from 'lucide-react';

interface AddEditTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tradeData: TradeRecord) => Promise<void>;
  editTrade?: TradeRecord | null;
  isDark?: boolean;
}

export const AddEditTradeModal: React.FC<AddEditTradeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editTrade = null,
  isDark = true
}) => {
  const isEditing = Boolean(editTrade);

  // Form states
  const [type, setType] = useState<TradeType>('BUY');
  const [asset, setAsset] = useState('');
  const [nominalIdr, setNominalIdr] = useState<string>('10000000');
  const [kurs, setKurs] = useState<string>('17890');
  const [jumlah, setJumlah] = useState<string>('1');
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [exitDate, setExitDate] = useState<string>('');
  const [entryPrice, setEntryPrice] = useState<string>('100');
  const [exitPrice, setExitPrice] = useState<string>('');
  const [status, setStatus] = useState<TradeStatus>('Floating');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Populate data when editing
  useEffect(() => {
    if (editTrade) {
      setType(editTrade.type);
      setAsset(editTrade.asset);
      setNominalIdr(editTrade.nominalIdr.toString());
      setKurs(editTrade.kurs.toString());
      setJumlah(editTrade.jumlah.toString());
      setEntryDate(editTrade.entryDate || new Date().toISOString().slice(0, 10));
      setExitDate(editTrade.exitDate || '');
      setEntryPrice(editTrade.entryPrice.toString());
      setExitPrice(editTrade.exitPrice ? editTrade.exitPrice.toString() : '');
      setStatus(editTrade.status);
    } else {
      setType('BUY');
      setAsset('');
      setNominalIdr('10000000');
      setKurs('17890');
      setJumlah('1');
      setEntryDate(new Date().toISOString().slice(0, 10));
      setExitDate('');
      setEntryPrice('100');
      setExitPrice('');
      setStatus('Floating');
    }
    setErrorMsg(null);
  }, [editTrade, isOpen]);

  // Auto-switch status if exit date or exit price is populated
  useEffect(() => {
    if (exitDate && status === 'Floating') {
      setStatus('Realized');
    }
  }, [exitDate, status]);

  // Live calculation of preview metrics
  const numericNominal = parseIndonesianNumber(nominalIdr, { isCurrency: true });
  const numericEntryPrice = parseIndonesianNumber(entryPrice, { isDecimal: true });
  const numericExitPrice = parseIndonesianNumber(exitPrice, { isDecimal: true });
  const numericKurs = parseIndonesianNumber(kurs, { isKurs: true }) || 17890;
  const numericJumlah = parseIndonesianNumber(jumlah, { isDecimal: true }) || 1;

  const liveMetrics = calculateTradeMetrics({
    nominalIdr: numericNominal,
    entryPrice: numericEntryPrice,
    exitPrice: numericExitPrice,
    status
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset.trim()) {
      setErrorMsg('Simbol aset (Ticker) wajib diisi');
      return;
    }
    if (numericNominal <= 0) {
      setErrorMsg('Nominal modal IDR harus lebih dari 0');
      return;
    }
    if (numericEntryPrice <= 0) {
      setErrorMsg('Entry Price harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const tradeData: TradeRecord = {
        id: editTrade ? editTrade.id : `trade-${Date.now()}`,
        rowIndex: editTrade?.rowIndex,
        type,
        asset: asset.trim().toUpperCase(),
        nominalIdr: numericNominal,
        kurs: numericKurs,
        jumlah: numericJumlah,
        entryDate,
        exitDate: exitDate.trim() || undefined,
        entryPrice: numericEntryPrice,
        exitPrice: numericExitPrice,
        pnlPercent: liveMetrics.pnlPercent,
        spreadCost: liveMetrics.spreadCost,
        labaBersih: liveMetrics.labaBersih,
        status,
        nilaiAset: liveMetrics.nilaiAset
      };

      await onSave(tradeData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan transaksi ke Google Sheets');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-900 border-white/15 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-bold">
              {isEditing ? `Edit Posisi Trade (${editTrade?.asset})` : 'Tambah Posisi Investasi Baru'}
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Data akan tersinkronisasi otomatis ke baris tab <strong>INVESTING</strong> di Google Sheets.
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDark ? 'hover:bg-white/10 border-white/10 text-slate-400' : 'hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Row 1: Type & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Tipe Transaksi
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => setType('BUY')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    type === 'BUY'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setType('SELL')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    type === 'SELL'
                      ? 'bg-red-600 text-white shadow-xs'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600'
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Status Posisi
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => setStatus('Floating')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    status === 'Floating'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600'
                  }`}
                >
                  Floating
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Realized')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    status === 'Realized'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600'
                  }`}
                >
                  Realized
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Asset Ticker & Nominal (IDR) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Simbol Aset (Ticker) *
              </label>
              <input
                type="text"
                required
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                placeholder="e.g. NVDA, SPCX, GOLD, MSFT"
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border outline-none transition ${
                  isDark
                    ? 'bg-slate-800 border-white/10 text-white focus:border-blue-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
              />
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Nominal Modal (IDR) *
              </label>
              <input
                type="text"
                required
                value={nominalIdr}
                onChange={(e) => setNominalIdr(e.target.value)}
                placeholder="e.g. 10.000.000"
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono font-bold border outline-none transition ${
                  isDark
                    ? 'bg-slate-800 border-white/10 text-white focus:border-blue-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Row 3: Kurs IDR-USD & Jumlah (Lot / Lembar) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Kurs IDR-USD
              </label>
              <input
                type="text"
                value={kurs}
                onChange={(e) => setKurs(e.target.value)}
                placeholder="17890 (atau 1 jika IDR)"
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border outline-none transition ${
                  isDark
                    ? 'bg-slate-800 border-white/10 text-white focus:border-blue-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
              />
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Jumlah (Lot / Lembar)
              </label>
              <input
                type="text"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                placeholder="e.g. 0.635 atau 1.5"
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border outline-none transition ${
                  isDark
                    ? 'bg-slate-800 border-white/10 text-white focus:border-blue-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Row 4: Entry Date & Exit Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Entry Date *
              </label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border outline-none transition ${
                  isDark
                    ? 'bg-slate-800 border-white/10 text-white focus:border-blue-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
              />
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Exit Date (Kosongkan jika Floating)
              </label>
              <input
                type="date"
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border outline-none transition ${
                  isDark
                    ? 'bg-slate-800 border-white/10 text-white focus:border-blue-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Row 5: Entry Price & Exit Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Entry Price *
              </label>
              <input
                type="text"
                required
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="e.g. 195.4 atau 1380000"
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border outline-none transition ${
                  isDark
                    ? 'bg-slate-800 border-white/10 text-white focus:border-blue-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
              />
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Exit / Current Price
              </label>
              <input
                type="text"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="e.g. 218.6 atau 1425000"
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border outline-none transition ${
                  isDark
                    ? 'bg-slate-800 border-white/10 text-white focus:border-blue-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Live Auto-Calculations Preview Box */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] space-y-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Kalkulasi Finansial Otomatis
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">PnL (%)</span>
                <strong className={liveMetrics.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {liveMetrics.pnlPercent >= 0 ? `+${liveMetrics.pnlPercent}%` : `${liveMetrics.pnlPercent}%`}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Spread 0.5%</span>
                <span className="text-red-400">{formatRupiah(liveMetrics.spreadCost)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Laba Bersih</span>
                <strong className={liveMetrics.labaBersih >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {liveMetrics.labaBersih >= 0 ? `+${formatRupiah(liveMetrics.labaBersih)}` : formatRupiah(liveMetrics.labaBersih)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Nilai Aset</span>
                <span className={status === 'Floating' ? 'text-sky-300 font-bold' : 'text-slate-400'}>
                  {status === 'Floating' ? formatRupiah(liveMetrics.nilaiAset) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isDark ? 'hover:bg-white/10 border-white/10 text-slate-300' : 'hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition active:scale-95 shadow-md cursor-pointer ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white shadow-blue-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 border-blue-700 text-white shadow-blue-600/20'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan ke Sheets...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Perbarui Baris' : 'Simpan Transaksi'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
