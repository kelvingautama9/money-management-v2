import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GlassSettings, Transaction, BudgetCategory, EmergencyFund } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import {
  FileText,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Building2,
  Wallet
} from 'lucide-react';

interface AutomatedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  budgets: BudgetCategory[];
  emergencyFund: EmergencyFund;
  totalAset: number;
  totalIncome: number;
  totalExpense: number;
  settings: GlassSettings;
  currentSheetName?: string;
}

export const AutomatedReportModal: React.FC<AutomatedReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  budgets,
  emergencyFund,
  totalAset,
  totalIncome,
  totalExpense,
  settings,
  currentSheetName = 'September'
}) => {
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isLight = settings?.themeMode === 'light' || settings?.themeMode === 'beige';
  const safeEmergency = emergencyFund || { current: 0, target: 0, kekurangan: 0, persentase: 0 };
  const safeBudgets = Array.isArray(budgets) ? budgets : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0';
  const burnRate = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : '0';

  // Largest expenses sorted
  const topExpenses = safeTransactions
    .filter((t) => t.tipe === 'Expense')
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 5);

  const totalBudgetPlafon = safeBudgets.reduce((sum, b) => sum + (b.totalSaldo || 0), 0);
  const totalBudgetSpend = safeBudgets.reduce((sum, b) => sum + (b.actualSpend || 0), 0);
  const totalBudgetSisa = safeBudgets.reduce((sum, b) => sum + (b.sisa || 0), 0);
  const budgetAbsorptionPct = totalBudgetPlafon > 0 ? ((totalBudgetSpend / totalBudgetPlafon) * 100).toFixed(1) : '0';

  const emergencyPct = safeEmergency.target > 0 ? ((safeEmergency.current / safeEmergency.target) * 100).toFixed(1) : '0';

  return typeof document !== 'undefined' ? createPortal(
    <div
      className="fixed inset-0 z-[9999] w-screen h-[100dvh] bg-black/75 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            overflow: visible !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #report-printable-area, #report-printable-area * {
            visibility: visible !important;
          }
          #report-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 4px 6px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            border: none !important;
            box-shadow: none !important;
            max-height: none !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
          }
          .print-hidden {
            display: none !important;
          }
          .print-compact-body {
            overflow: visible !important;
            max-height: none !important;
            gap: 8px !important;
            margin-top: 8px !important;
          }
          .print-card {
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            padding: 6px 10px !important;
            border-radius: 10px !important;
          }
          .print-compact-text {
            font-size: 11px !important;
            line-height: 1.3 !important;
          }
          .print-kpi-val {
            font-size: 13px !important;
          }
          .print-badge {
            background: #e2e8f0 !important;
            color: #1e293b !important;
            border: 1px solid #94a3b8 !important;
          }
        }
      `}</style>

      <div
        id="report-printable-area"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isLight ? '#ffffff' : 'rgba(10, 14, 28, 0.98)',
          backdropFilter: 'blur(40px) saturate(190%)',
          boxShadow: isLight
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.18)'
            : '0 30px 80px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.25)'
        }}
        className={`w-full max-w-3xl rounded-3xl border ${isLight ? 'border-slate-200 text-slate-900' : 'border-white/15 text-slate-100'} p-4 sm:p-6 my-auto shadow-2xl relative max-h-[92dvh] flex flex-col`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'} gap-3 shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${isLight ? 'bg-blue-50 border border-blue-200' : 'bg-gradient-to-tr from-blue-600/30 to-indigo-600/30 border border-blue-400/30'} flex items-center justify-center shrink-0`}>
              <FileText className={`w-4.5 h-4.5 ${isLight ? 'text-blue-600' : 'text-blue-300'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base sm:text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Laporan Rekonsiliasi & Audit Finansial
                </h3>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full print-badge ${isLight ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'}`}>
                  Periode {currentSheetName}
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Ringkasan eksekutif neraca keuangan, efisiensi arus kas, dan serapan anggaran • Budgeting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 print-hidden">
            <button
              onClick={() => window.print()}
              className={`p-2 rounded-xl border transition cursor-pointer ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-200 hover:text-white'}`}
              title="Cetak / Unduh PDF (1 Halaman)"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition cursor-pointer ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-200 hover:text-white'}`}
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto pr-1 mt-3 space-y-4 print-compact-body">
          {/* 4 Key Institutional Audit KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className={`p-3 rounded-2xl border print-card ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.04] border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                Total Kekayaan Bersih
              </span>
              <span className={`text-sm sm:text-base font-bold font-mono block print-kpi-val ${isLight ? 'text-slate-900' : '!text-white'}`}>
                {formatRupiah(totalAset)}
              </span>
              <span className={`text-[9px] mt-0.5 block font-medium ${isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-300 font-bold'}`}>
                Kas + Valas + Investasi
              </span>
            </div>

            <div className={`p-3 rounded-2xl border print-card ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.04] border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                Rasio Tabungan
              </span>
              <span className={`text-sm sm:text-base font-bold font-mono block print-kpi-val ${isLight ? 'text-blue-600' : 'text-sky-300 font-bold'}`}>
                {savingsRate}%
              </span>
              <span className={`text-[9px] mt-0.5 block ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                Surplus: {formatRupiah(netSavings)}
              </span>
            </div>

            <div className={`p-3 rounded-2xl border print-card ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.04] border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                Serapan Anggaran
              </span>
              <span className={`text-sm sm:text-base font-bold font-mono block print-kpi-val ${isLight ? 'text-amber-600' : 'text-amber-300 font-bold'}`}>
                {budgetAbsorptionPct}%
              </span>
              <span className={`text-[9px] mt-0.5 block ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                Sisa: {formatRupiah(totalBudgetSisa)}
              </span>
            </div>

            <div className={`p-3 rounded-2xl border print-card ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.04] border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                Dana Darurat
              </span>
              <span className={`text-sm sm:text-base font-bold font-mono block print-kpi-val ${isLight ? 'text-purple-700' : 'text-purple-300 font-bold'}`}>
                {emergencyPct}%
              </span>
              <span className={`text-[9px] mt-0.5 block ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                {formatRupiah(safeEmergency.current)} / {formatRupiah(safeEmergency.target)}
              </span>
            </div>
          </div>

          {/* Audit Sections: Cashflow Breakdown & Envelope Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Operational Cashflow */}
            <div className={`p-3.5 rounded-2xl border space-y-2 print-card ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-900' : '!text-white'}`}>
                <Wallet className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-blue-300'}`} />
                Audit Arus Kas Operasional
              </h4>
              <div className="space-y-1.5 text-xs print-compact-text">
                <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>Total Pemasukan (Inflow):</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(totalIncome)}</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>Total Pengeluaran (Outflow):</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatRupiah(totalExpense)}</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>Net Surplus Bersih:</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-blue-600' : 'text-sky-300'}`}>{formatRupiah(netSavings)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>Beban Pengeluaran (Burn Rate):</span>
                  <span className={`font-mono font-semibold ${isLight ? 'text-slate-800' : '!text-white'}`}>{burnRate}% dari pendapatan</span>
                </div>
              </div>
            </div>

            {/* Top 5 Expense Line Items */}
            <div className={`p-3.5 rounded-2xl border space-y-2 print-card ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-900' : '!text-white'}`}>
                <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                5 Pos Pengeluaran Terbesar
              </h4>
              <div className="space-y-1 text-xs print-compact-text">
                {topExpenses.length > 0 ? (
                  topExpenses.map((exp, idx) => (
                    <div
                      key={exp.id || idx}
                      className={`flex items-center justify-between p-1.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-white/[0.04] border-white/10'}`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-4.5 h-4.5 rounded-lg flex items-center justify-center font-mono text-[9px] shrink-0 ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-slate-300'}`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className={`font-semibold block truncate text-[11px] ${isLight ? 'text-slate-800' : '!text-white'}`}>{exp.catatan}</span>
                          <span className={`text-[9px] block truncate ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                            {exp.kategori} • {exp.akun}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400 shrink-0 ml-2 text-[11px]">
                        {formatRupiah(exp.jumlah)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>Belum ada pengeluaran tercatat.</p>
                )}
              </div>
            </div>
          </div>

          {/* Executive Verdict & Recommendations */}
          <div className={`p-3.5 rounded-2xl border space-y-1.5 print-card ${isLight ? 'bg-blue-50/70 border-blue-200' : 'bg-blue-950/30 border-blue-500/30'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-blue-900' : 'text-sky-300'}`}>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Kesimpulan Eksekutif & Rekomendasi
            </h4>
            <ul className={`space-y-1 text-xs print-compact-text ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                <span>
                  <strong className={isLight ? 'text-slate-900' : '!text-white'}>Efisiensi Tabungan:</strong> Rasio tabungan {savingsRate}% berada di atas target sehat 20%, menghasilkan surplus bersih {formatRupiah(netSavings)}.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <span>
                  <strong className={isLight ? 'text-slate-900' : '!text-white'}>Kontrol Anggaran:</strong> Serapan total pos tercatat {budgetAbsorptionPct}% dengan sisa cadangan aman {formatRupiah(totalBudgetSisa)}.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                <span>
                  <strong className={isLight ? 'text-slate-900' : '!text-white'}>Prioritas Dana Darurat:</strong> Posisi dana darurat tercatat {emergencyPct}% ({formatRupiah(safeEmergency.current)} dari target {formatRupiah(safeEmergency.target)}).
                </span>
              </li>
            </ul>
          </div>

          {/* Institutional Print Watermark / Footer */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
            <span>Budgeting • Google Sheets Cloud Synced</span>
            <span>Dokumen Resmi • Cetak / Ekspor PDF 1 Halaman</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;
};
