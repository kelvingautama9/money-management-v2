import React, { useState } from 'react';
import { GlassSettings, Transaction, BudgetCategory, EmergencyFund } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  FileText,
  Printer,
  FileDown,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Wallet,
  ArrowLeft,
  Calendar,
  Sparkles,
  PieChart,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AuditFinancialPageProps {
  settings: GlassSettings;
  totalAset: number;
  totalIncome: number;
  totalExpense: number;
  transactions: Transaction[];
  budgets: BudgetCategory[];
  emergencyFund?: EmergencyFund;
  currentSheetName: string;
  onBack?: () => void;
}

export const AuditFinancialPage: React.FC<AuditFinancialPageProps> = ({
  settings,
  totalAset,
  totalIncome,
  totalExpense,
  transactions = [],
  budgets = [],
  emergencyFund,
  currentSheetName,
  onBack
}) => {
  const isDark = settings?.themeMode !== 'light' && settings?.themeMode !== 'beige';
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeBudgets = Array.isArray(budgets) ? budgets : [];
  const safeEmergency = emergencyFund || { current: 436550, target: 12000000 };

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0';
  const burnRate = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : '0';

  const topExpenses = safeTransactions
    .filter((t) => t.tipe === 'Expense')
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 5);

  const totalBudgetPlafon = safeBudgets.reduce((sum, b) => sum + (b.totalSaldo || 0), 0);
  const totalBudgetSpend = safeBudgets.reduce((sum, b) => sum + (b.actualSpend || 0), 0);
  const totalBudgetSisa = safeBudgets.reduce((sum, b) => sum + (b.sisa || 0), 0);
  const budgetAbsorptionPct = totalBudgetPlafon > 0 ? ((totalBudgetSpend / totalBudgetPlafon) * 100).toFixed(1) : '0';

  const emergencyPct = safeEmergency.target > 0 ? ((safeEmergency.current / safeEmergency.target) * 100).toFixed(1) : '0';

  const handleExportPdf = async () => {
    const element = document.getElementById('audit-financial-printable-area');
    if (!element) return;
    triggerHaptic('medium');
    setIsExportingPdf(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(`Audit-Finansial-${currentSheetName.toUpperCase()}-2026.pdf`);
      triggerHaptic('success');
    } catch (err) {
      console.error('Gagal export PDF:', err);
      triggerHaptic('error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
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
          #audit-financial-printable-area, #audit-financial-printable-area * {
            visibility: visible !important;
          }
          #audit-financial-printable-area {
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
          }
          .print-hidden {
            display: none !important;
          }
          .print-card {
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            padding: 8px 12px !important;
            border-radius: 12px !important;
          }
          #audit-financial-printable-area h1,
          #audit-financial-printable-area h2,
          #audit-financial-printable-area h3,
          #audit-financial-printable-area h4,
          #audit-financial-printable-area p,
          #audit-financial-printable-area span,
          #audit-financial-printable-area li,
          #audit-financial-printable-area strong {
            color: #0f172a !important;
            -webkit-text-fill-color: #0f172a !important;
          }
          #audit-financial-printable-area .text-emerald-400,
          #audit-financial-printable-area .text-emerald-500,
          #audit-financial-printable-area .text-emerald-600 {
            color: #047857 !important;
            -webkit-text-fill-color: #047857 !important;
          }
          #audit-financial-printable-area .text-rose-400,
          #audit-financial-printable-area .text-rose-500,
          #audit-financial-printable-area .text-rose-600 {
            color: #b91c1c !important;
            -webkit-text-fill-color: #b91c1c !important;
          }
          #audit-financial-printable-area .text-blue-400,
          #audit-financial-printable-area .text-blue-600 {
            color: #1d4ed8 !important;
            -webkit-text-fill-color: #1d4ed8 !important;
          }
          #audit-financial-printable-area .text-amber-400,
          #audit-financial-printable-area .text-amber-600 {
            color: #b45309 !important;
            -webkit-text-fill-color: #b45309 !important;
          }
          #audit-financial-printable-area .text-purple-400,
          #audit-financial-printable-area .text-purple-700 {
            color: #6b21a8 !important;
            -webkit-text-fill-color: #6b21a8 !important;
          }
        }
      `}</style>

      {/* TOP HEADER BAR (Liquid Glass Styling matching Kalkulator Investasi) */}
      <div
        style={
          isDark
            ? {
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.015) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderTop: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.45)'
              }
            : {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(226, 232, 240, 0.95)',
                boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.06)'
              }
        }
        className="p-4 sm:p-6 rounded-3xl relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            {onBack && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onBack();
                }}
                className={`p-2.5 rounded-2xl border transition active:scale-95 shrink-0 ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
                    : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-900 shadow-sm'
                }`}
                title="Kembali ke Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Audit Financial
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Periode {currentSheetName}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Laporan rekonsiliasi neraca, audit arus kas masuk-keluar, serapan anggaran amplop, dan kesehatan dana darurat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print-hidden self-end sm:self-center flex-wrap">
            {/* Button 1: Export PDF */}
            <button
              id="audit-page-btn-export-pdf"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-4 py-2.5 rounded-2xl font-bold text-xs inline-flex items-center gap-2 transition active:scale-95 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              title="Download format PDF berlatar putih resmi"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuat PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Export PDF</span>
                </>
              )}
            </button>

            {/* Button 2: Print Report */}
            <button
              id="audit-page-btn-print-report"
              onClick={() => {
                triggerHaptic('medium');
                window.print();
              }}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs inline-flex items-center gap-2 transition active:scale-95 cursor-pointer border ${
                isDark
                  ? 'bg-white/10 hover:bg-white/15 text-white border-white/20'
                  : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300 shadow-sm'
              }`}
              title="Cetak langsung menggunakan browser print"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRINTABLE BODY / MAIN AUDIT CONTENT */}
      <div id="audit-financial-printable-area" className="space-y-6">
        {/* 4 Core Financial Health Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            style={
              isDark
                ? {
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }
                : {
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(226, 232, 240, 0.9)'
                  }
            }
            className="p-5 rounded-3xl print-card transition hover:border-white/20 shadow-xs"
          >
            <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Kekayaan Bersih
            </span>
            <span className={`text-xl sm:text-2xl font-extrabold font-mono block ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatRupiah(totalAset)}
            </span>
            <span className={`text-[11px] mt-1 block font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              Kas Standby + Valas + Investasi
            </span>
          </div>

          <div
            style={
              isDark
                ? {
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }
                : {
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(226, 232, 240, 0.9)'
                  }
            }
            className="p-5 rounded-3xl print-card transition hover:border-white/20 shadow-xs"
          >
            <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Rasio Tabungan (Savings Rate)
            </span>
            <span className={`text-xl sm:text-2xl font-extrabold font-mono block ${isDark ? 'text-sky-400' : 'text-blue-600'}`}>
              {savingsRate}%
            </span>
            <span className={`text-[11px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Surplus Bersih: {formatRupiah(netSavings)}
            </span>
          </div>

          <div
            style={
              isDark
                ? {
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }
                : {
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(226, 232, 240, 0.9)'
                  }
            }
            className="p-5 rounded-3xl print-card transition hover:border-white/20 shadow-xs"
          >
            <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Serapan Anggaran Pos
            </span>
            <span className={`text-xl sm:text-2xl font-extrabold font-mono block ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              {budgetAbsorptionPct}%
            </span>
            <span className={`text-[11px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Sisa Plafon Aman: {formatRupiah(totalBudgetSisa)}
            </span>
          </div>

          <div
            style={
              isDark
                ? {
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }
                : {
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(226, 232, 240, 0.9)'
                  }
            }
            className="p-5 rounded-3xl print-card transition hover:border-white/20 shadow-xs"
          >
            <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Kecukupan Dana Darurat
            </span>
            <span className={`text-xl sm:text-2xl font-extrabold font-mono block ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              {emergencyPct}%
            </span>
            <span className={`text-[11px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {formatRupiah(safeEmergency.current)} / {formatRupiah(safeEmergency.target)}
            </span>
          </div>
        </div>

        {/* Operational Cashflow Breakdown & Top 5 Expense Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Arus Kas Operasional */}
          <div
            style={
              isDark
                ? {
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }
                : {
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(226, 232, 240, 0.9)'
                  }
            }
            className="p-6 rounded-3xl print-card space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10">
              <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Wallet className="w-4 h-4 text-blue-400" />
                Audit Arus Kas Operasional
              </h3>
              <span className={`text-xs font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Bulan {currentSheetName}
              </span>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Total Pemasukan (Inflow):</span>
                <span className="font-mono font-bold text-emerald-500 dark:text-emerald-400">{formatRupiah(totalIncome)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Total Pengeluaran (Outflow):</span>
                <span className="font-mono font-bold text-rose-500 dark:text-rose-400">{formatRupiah(totalExpense)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Net Surplus Bersih:</span>
                <span className={`font-mono font-bold ${isDark ? 'text-sky-300' : 'text-blue-600'}`}>{formatRupiah(netSavings)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>Beban Pengeluaran (Burn Rate):</span>
                <span className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{burnRate}% dari pendapatan</span>
              </div>
            </div>
          </div>

          {/* 5 Pos Pengeluaran Terbesar */}
          <div
            style={
              isDark
                ? {
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }
                : {
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(226, 232, 240, 0.9)'
                  }
            }
            className="p-6 rounded-3xl print-card space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10">
              <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <TrendingUp className="w-4 h-4 text-rose-500" />
                5 Pos Pengeluaran Terbesar
              </h3>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Audit Transaksi Terbesar
              </span>
            </div>

            <div className="space-y-2">
              {topExpenses.length > 0 ? (
                topExpenses.map((exp, idx) => (
                  <div
                    key={exp.id || idx}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition ${
                      isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-xl flex items-center justify-center font-mono text-xs shrink-0 ${
                          isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className={`font-semibold block truncate text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {exp.catatan || exp.kategori}
                        </span>
                        <span className={`text-[10px] block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {exp.kategori} • {exp.akun}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-rose-500 dark:text-rose-400 shrink-0 ml-3 text-xs sm:text-sm">
                      {formatRupiah(exp.jumlah)}
                    </span>
                  </div>
                ))
              ) : (
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Belum ada transaksi pengeluaran tercatat pada bulan ini.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Envelope Budget Status Overview */}
        <div
          style={
            isDark
              ? {
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }
              : {
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(226, 232, 240, 0.9)'
                }
          }
          className="p-6 rounded-3xl print-card space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <PieChart className="w-4 h-4 text-amber-400" />
              Status Budgeting Amplop ({safeBudgets.length} Pos Aktif)
            </h3>
            <span className={`text-xs font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Target Bulanan: {formatRupiah(safeBudgets.reduce((s, b) => s + (b.budgeting || b.targetBulanan || 0), 0))} • Kapasitas: {formatRupiah(safeBudgets.reduce((s, b) => s + (b.totalSaldo || (b.saldoAwal || 0) + (b.budgeting || b.targetBulanan || 0)), 0))}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {safeBudgets.map((b) => {
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
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border space-y-2.5 ${
                    isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs gap-1.5">
                    <span className={`font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{b.nama}</span>
                    {isOverMonthly ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                        Over (+{formatRupiah(monthlyDiff)})
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                        Aman ({monthlySpendPct}%)
                      </span>
                    )}
                  </div>

                  {/* Detail 1: Jatah Bulanan */}
                  <div className="text-[10px] text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Jatah Bulanan:</span>
                      <span className="font-mono text-slate-300">{formatRupiah(monthlyBudget)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 dark:bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverMonthly ? 'bg-rose-500' : 'bg-blue-400'
                        }`}
                        style={{ width: `${Math.min(100, monthlySpendPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Detail 2: Total Saldo Kantong */}
                  <div className="text-[10px] text-slate-400 space-y-1 pt-0.5 border-t border-white/5">
                    <div className="flex justify-between">
                      <span>Total Kapasitas:</span>
                      <span className="font-mono text-slate-300">{formatRupiah(totalSaldo)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spend: <strong className="text-slate-200">{formatRupiah(actualSpend)}</strong></span>
                      <span>Sisa: <strong className={isDepleted ? 'text-rose-400' : 'text-emerald-400'}>{formatRupiah(sisa)}</strong></span>
                    </div>
                  </div>

                  {isOverMonthly && !isDepleted && (
                    <div className="text-[9px] text-amber-300/90 leading-tight pt-1">
                      ⚠️ Over kuota bulanan, namun saldo kantong belum defisit (sisa bulan lalu: {formatRupiah(saldoAwal)}).
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Executive Verdict & Recommendations */}
        <div
          style={
            isDark
              ? {
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(59, 130, 246, 0.25)'
                }
              : {
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe'
                }
          }
          className="p-6 rounded-3xl print-card space-y-3 shadow-xs"
        >
          <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-sky-300' : 'text-blue-900'}`}>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            Kesimpulan Eksekutif & Rekomendasi Audit
          </h3>

          <ul className={`space-y-2 text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>Efisiensi Tabungan:</strong> Rasio tabungan Anda tercatat{' '}
                <span className="font-bold text-emerald-400">{savingsRate}%</span>, menghasilkan surplus bersih sebesar{' '}
                <span className="font-mono font-bold">{formatRupiah(netSavings)}</span>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>Kontrol Anggaran:</strong> Serapan total pos belanja tercatat{' '}
                <span className="font-bold text-amber-400">{budgetAbsorptionPct}%</span> dengan sisa cadangan aman sebesar{' '}
                <span className="font-mono font-bold">{formatRupiah(totalBudgetSisa)}</span>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>Prioritas Dana Darurat:</strong> Posisi dana darurat saat ini mencapai{' '}
                <span className="font-bold text-purple-400">{emergencyPct}%</span> ({formatRupiah(safeEmergency.current)} dari target{' '}
                {formatRupiah(safeEmergency.target)}).
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
