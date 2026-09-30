'use client';

import React, { useState } from 'react';
import { TradeRecord } from '../../types';
import { formatRupiah } from '../../lib/sheetsApi';
import { AlertTriangle, Trash2, RefreshCw, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  trade: TradeRecord | null;
  isDark?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  trade,
  isDark = true
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !trade) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menghapus baris dari Google Sheets');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-900 border-white/15 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto shadow-md">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold">Hapus Transaksi Investasi?</h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Tindakan ini akan menghapus baris transaksi dari spreadsheet Google Sheets dan memperbarui seluruh rekalkulasi.
            </p>
          </div>

          {/* Trade Details Preview */}
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-left text-xs font-mono space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Instrumen:</span>
              <strong className="text-white">{trade.asset} ({trade.type})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Modal:</span>
              <span>{formatRupiah(trade.nominalIdr)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span>{trade.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tanggal Entry:</span>
              <span>{trade.entryDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Baris Google Sheet:</span>
              <span className="text-sky-400 font-bold">Baris #{trade.rowIndex || 'Baru'}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isDark ? 'hover:bg-white/10 border-white/10 text-slate-300' : 'hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              Batal
            </button>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition active:scale-95 shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Baris</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
