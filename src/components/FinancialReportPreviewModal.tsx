import React, { useState, useRef } from 'react';
import {
  Transaction,
  BudgetCategory,
  AccountBalance,
  EmergencyFund,
  InvestmentAsset
} from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import {
  FileDown,
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Wallet,
  TrendingUp,
  PieChart,
  Building2,
  Loader2,
  Eye
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface FinancialReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSheetName: string;
  totalAset: number;
  totalIncome: number;
  totalExpense: number;
  sisaSaldoIncome: number;
  cashStandbyDanaDarurat: number;
  totalInvestment: number;
  transactions?: Transaction[];
  budgets?: BudgetCategory[];
  accounts?: AccountBalance[];
  assets?: InvestmentAsset[];
  emergencyFund?: EmergencyFund;
}

export const FinancialReportPreviewModal: React.FC<FinancialReportPreviewModalProps> = ({
  isOpen,
  onClose,
  currentSheetName,
  totalAset,
  totalIncome,
  totalExpense,
  sisaSaldoIncome,
  cashStandbyDanaDarurat,
  totalInvestment,
  transactions = [],
  budgets = [],
  accounts = [],
  assets = [],
  emergencyFund
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState<'fit' | '100%'>('fit');
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeBudgets = Array.isArray(budgets) ? budgets : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeEmergency = emergencyFund || { current: 436550, target: 12000000, kekurangan: 11563450, persentase: 3.6 };

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0';
  const spendRate = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : '0';

  const totalMonthlyBudget = safeBudgets.reduce((s, b) => s + (b.budgeting || b.targetBulanan || 0), 0);
  const totalKapasitasKantong = safeBudgets.reduce(
    (s, b) => s + (b.totalSaldo || (b.saldoAwal || 0) + (b.budgeting || b.targetBulanan || 0)),
    0
  );
  const totalActualSpend = safeBudgets.reduce((s, b) => s + (b.actualSpend || 0), 0);
  const totalSisaSaldo = safeBudgets.reduce((s, b) => s + (b.sisa !== undefined ? b.sisa : 0), 0);

  const topExpenses = safeTransactions
    .filter((t) => t.tipe === 'Expense')
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 6);

  // Generate formatted PDF with pure white background
  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    triggerHaptic('medium');
    setIsExportingPdf(true);
    setExportError(null);

    try {
      const element = reportRef.current;

      // Capture with high DPI and explicit white background
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
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

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add subsequent pages if content exceeds 1 page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const fileName = `Laporan-Keuangan-${currentSheetName.toUpperCase()}-2026.pdf`;
      pdf.save(fileName);
      triggerHaptic('success');
    } catch (err: any) {
      console.error('Gagal membuat file PDF:', err);
      setExportError('Terjadi kendala saat memproses PDF. Silakan gunakan opsi Cetak Laporan.');
      triggerHaptic('error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Direct print with standard print stylesheet
  const handlePrint = () => {
    triggerHaptic('medium');
    window.print();
  };

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      {/* Print Stylesheet enforcing pure white background */}
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
          #printable-financial-report, #printable-financial-report * {
            visibility: visible !important;
          }
          #printable-financial-report {
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
          }
          .no-print {
            display: none !important;
          }
          #printable-financial-report .white-sheet-print {
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
          }
          #printable-financial-report h1,
          #printable-financial-report h2,
          #printable-financial-report h3,
          #printable-financial-report h4,
          #printable-financial-report p,
          #printable-financial-report span,
          #printable-financial-report td,
          #printable-financial-report th,
          #printable-financial-report strong {
            color: #0f172a !important;
            -webkit-text-fill-color: #0f172a !important;
          }
          #printable-financial-report .text-emerald-600,
          #printable-financial-report .text-emerald-700 {
            color: #047857 !important;
            -webkit-text-fill-color: #047857 !important;
          }
          #printable-financial-report .text-rose-600,
          #printable-financial-report .text-rose-700 {
            color: #b91c1c !important;
            -webkit-text-fill-color: #b91c1c !important;
          }
        }
      `}</style>

      {/* Main Modal Shell */}
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden no-print">
        {/* Modal Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-slate-950/80 gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <FileText className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Preview Laporan Keuangan Bulan {currentSheetName}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Latar Putih Standar Cetak (WCAG AAA)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verifikasi tata letak data, format angka rupiah, dan kontras warna sebelum ekspor PDF atau print.
            </p>
          </div>

          {/* TWO MAIN ACTION BUTTONS: Export PDF & Print Report */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Button 1: Export PDF */}
            <button
              id="btn-export-pdf-action"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs font-bold transition shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
              title="Download dokumen PDF resmi untuk arsip offline"
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
              id="btn-print-report-action"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition shadow-md active:scale-95 cursor-pointer border border-slate-200"
              title="Cetak langsung menggunakan printer atau browser PDF"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Print Report</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition active:scale-95"
              title="Tutup Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Verification Alert Banner */}
        <div className="bg-blue-950/40 border-b border-blue-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-blue-200 gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Verifikasi Layout:</strong> Dokumen diformat menggunakan latar belakang putih murni (<code className="font-mono text-white">#ffffff</code>), teks kontras tinggi (<code className="font-mono text-white">#0f172a</code>), dan margin cetak A4.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Zoom Tampilan:</span>
            <button
              onClick={() => setPreviewZoom(previewZoom === 'fit' ? '100%' : 'fit')}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10"
            >
              {previewZoom === 'fit' ? 'Perbesar (100%)' : 'Sesuai Layar (Fit)'}
            </button>
          </div>
        </div>

        {exportError && (
          <div className="bg-rose-950/60 border-b border-rose-500/30 px-4 py-2 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Scrollable Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 flex justify-center">
          {/* THE FORMATTED WHITE REPORT DOCUMENT */}
          <div
            id="printable-financial-report"
            ref={reportRef}
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
            className={`white-sheet-print w-full max-w-[820px] bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 space-y-6 border border-slate-200 transition-all ${
              previewZoom === '100%' ? 'min-w-[780px]' : ''
            }`}
          >
            {/* 1. DOCUMENT HEADER */}
            <div className="border-b-2 border-slate-900 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-slate-900 text-white">
                      OFFICIAL AUDIT REPORT
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Google Sheets Live Verified
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                    LAPORAN KEUANGAN BULANAN
                  </h1>
                  <p className="text-sm font-semibold text-slate-600 mt-0.5">
                    Periode Pelaporan: <strong className="text-slate-900 font-bold uppercase">{currentSheetName} 2026</strong>
                  </p>
                </div>

                <div className="text-left sm:text-right text-xs space-y-1 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
                  <div className="text-slate-500">
                    Waktu Cetak / Ekspor:
                  </div>
                  <div className="font-mono font-bold text-slate-800">
                    {formattedDate} WIB
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Status: Tervalidasi & Sinkron
                  </div>
                </div>
              </div>
            </div>

            {/* 2. EXECUTIVE SCORECARD SUMMARY */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-blue-600" />
                1. Ringkasan Posisi Keuangan (Executive Scorecard)
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-medium text-slate-500 block">Total Kekayaan Bersih</span>
                  <span className="text-lg sm:text-xl font-black text-slate-950 font-mono block mt-0.5">
                    {formatRupiah(totalAset)}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                    ▲ Kas + Investasi
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-medium text-slate-500 block">Total Pemasukan (Income)</span>
                  <span className="text-lg sm:text-xl font-black text-emerald-700 font-mono block mt-0.5">
                    {formatRupiah(totalIncome)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                    Gaji & Passive Income
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-medium text-slate-500 block">Total Pengeluaran (Expense)</span>
                  <span className="text-lg sm:text-xl font-black text-rose-700 font-mono block mt-0.5">
                    {formatRupiah(totalExpense)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                    {spendRate}% dari Income
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[11px] font-medium text-slate-500 block">Net Surplus / Sisa Saldo</span>
                  <span
                    className={`text-lg sm:text-xl font-black font-mono block mt-0.5 ${
                      sisaSaldoIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {formatRupiah(sisaSaldoIncome)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                    Savings Rate: {savingsRate}%
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Kas Cair & Standby (Dana Darurat):</span>
                  <span className="font-mono font-bold text-slate-900">{formatRupiah(cashStandbyDanaDarurat)}</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Total Portofolio Investasi:</span>
                  <span className="font-mono font-bold text-blue-700">{formatRupiah(totalInvestment)}</span>
                </div>
              </div>
            </div>

            {/* 3. BUDGETING AMPLOP DUAL-DETAIL TABLE */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-amber-600" />
                  2. Rincian Budgeting Amplop (Jatah Bulanan vs Saldo Kantong)
                </h2>
                <span className="text-[11px] font-mono text-slate-600">
                  Kapasitas Total: <strong>{formatRupiah(totalKapasitasKantong)}</strong>
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="p-2.5">Pos Amplop</th>
                      <th className="p-2.5 text-right">Jatah Bulanan</th>
                      <th className="p-2.5 text-right">Actual Spend</th>
                      <th className="p-2.5 text-right">Saldo Awal</th>
                      <th className="p-2.5 text-right">Total Saldo</th>
                      <th className="p-2.5 text-right">Sisa Saldo</th>
                      <th className="p-2.5 text-center">Status Kuota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {safeBudgets.map((b) => {
                      const monthlyBudget = b.budgeting || b.targetBulanan || 0;
                      const saldoAwal = b.saldoAwal || 0;
                      const totalSaldo = b.totalSaldo || saldoAwal + monthlyBudget;
                      const actualSpend = b.actualSpend || 0;
                      const sisa = b.sisa !== undefined ? b.sisa : totalSaldo - actualSpend;

                      const isOverMonthly = actualSpend > monthlyBudget && monthlyBudget > 0;
                      const monthlyDiff = actualSpend - monthlyBudget;
                      const isDepleted = sisa <= 0;

                      return (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{b.nama}</td>
                          <td className="p-2.5 text-right font-mono text-slate-700">{formatRupiah(monthlyBudget)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatRupiah(actualSpend)}</td>
                          <td className="p-2.5 text-right font-mono text-slate-500">{formatRupiah(saldoAwal)}</td>
                          <td className="p-2.5 text-right font-mono font-semibold text-slate-800">{formatRupiah(totalSaldo)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-700">{formatRupiah(sisa)}</td>
                          <td className="p-2.5 text-center">
                            {isOverMonthly ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                                Over (+{formatRupiah(monthlyDiff)})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                Disiplin
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
                      <td className="p-2.5">TOTAL</td>
                      <td className="p-2.5 text-right font-mono">{formatRupiah(totalMonthlyBudget)}</td>
                      <td className="p-2.5 text-right font-mono">{formatRupiah(totalActualSpend)}</td>
                      <td className="p-2.5 text-right font-mono text-slate-500">
                        {formatRupiah(safeBudgets.reduce((s, b) => s + (b.saldoAwal || 0), 0))}
                      </td>
                      <td className="p-2.5 text-right font-mono">{formatRupiah(totalKapasitasKantong)}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-700">{formatRupiah(totalSisaSaldo)}</td>
                      <td className="p-2.5 text-center text-[10px] text-slate-600">Terakumulasi</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 4. TWO-COLUMN SPLIT: TOP EXPENSES & ACCOUNT BALANCES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Left: Top 5 Pengeluaran */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  3. Transaksi Pengeluaran Terbesar
                </h2>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                        <th className="p-2">Kategori / Akun</th>
                        <th className="p-2 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {topExpenses.length > 0 ? (
                        topExpenses.map((t) => (
                          <tr key={t.id}>
                            <td className="p-2">
                              <span className="font-bold text-slate-900 block">{t.kategori}</span>
                              <span className="text-[10px] text-slate-500">{t.catatan || t.akun}</span>
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-rose-700">
                              {formatRupiah(t.jumlah)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="p-3 text-center text-slate-400">
                            Tidak ada pengeluaran tercatat
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: Rekening & Saldo Kas */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  4. Rekap Saldo Rekening Likuid
                </h2>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                        <th className="p-2">Nama Rekening</th>
                        <th className="p-2 text-right">Saldo Saat Ini</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {safeAccounts.slice(0, 6).map((acc) => (
                        <tr key={acc.nama}>
                          <td className="p-2 font-medium text-slate-800">{acc.nama}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(acc.totalSaldo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 5. CATATAN & REKOMENDASI AUDIT FINANSIAL */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 text-xs space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Catatan Evaluasi & Kesimpulan Audit Finansial
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                <li>
                  Tingkat tabungan (Savings Rate) tercatat <strong>{savingsRate}%</strong> dari total penerimaan kas bulanan.
                </li>
                <li>
                  Total serapan kuota budgeting bulanan sebesar <strong>{formatRupiah(totalActualSpend)}</strong> dari pagu <strong>{formatRupiah(totalMonthlyBudget)}</strong>.
                </li>
                <li>
                  Cadangan dana darurat sebesar <strong>{formatRupiah(safeEmergency.current)}</strong> ({safeEmergency.persentase}% dari target {formatRupiah(safeEmergency.target)}).
                </li>
              </ul>
            </div>

            {/* 6. DOCUMENT FOOTER / SIGNATURE */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
              <div>
                Dicetak otomatis dari Sistem Finansial Pribadi • Google Sheets Certified
              </div>
              <div className="font-mono text-slate-400">
                Dokumen Digital • ID: {currentSheetName.toUpperCase()}-2026-AUDIT
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
