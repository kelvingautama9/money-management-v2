import React, { useState, useRef } from 'react';
import {
  Transaction,
  BudgetCategory,
  AccountBalance,
  EmergencyFund,
  InvestmentAsset,
  InvestmentHistory,
  GlassSettings
} from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import {
  FileDown,
  Printer,
  X,
  Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface UnifiedMonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSheetName: string;
  totalAset: number;
  totalIncome: number;
  totalExpense: number;
  sisaSaldoIncome: number;
  cashStandbyDanaDarurat?: number;
  totalInvestment: number;
  transactions?: Transaction[];
  budgets?: BudgetCategory[];
  accounts?: AccountBalance[];
  assets?: InvestmentAsset[];
  history?: InvestmentHistory[];
  emergencyFund?: EmergencyFund;
  settings?: GlassSettings;
}

export const UnifiedMonthlyReportModal: React.FC<UnifiedMonthlyReportModalProps> = ({
  isOpen,
  onClose,
  currentSheetName,
  totalAset,
  totalIncome,
  totalExpense,
  sisaSaldoIncome,
  cashStandbyDanaDarurat = 0,
  totalInvestment,
  transactions = [],
  budgets = [],
  accounts = [],
  assets = [],
  history = [],
  emergencyFund
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeAssets = Array.isArray(assets) ? assets : [];
  const safeHistory = Array.isArray(history) ? history : [];

  // 1. Arus Kas Metrics
  const netSavings = totalIncome - totalExpense;
  const isSurplus = netSavings >= 0;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0';
  const spendRate = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : '0';

  // 2. Pos Pengeluaran Terbesar (Group by Category)
  const expenseByCategory: Record<string, number> = {};
  safeTransactions
    .filter((t) => t.tipe === 'Expense')
    .forEach((t) => {
      const cat = t.kategori?.trim() || 'Lain-lain';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(t.jumlah || 0);
    });

  const sortedCategories = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top 3 individual expenses
  const topIndividualExpenses = safeTransactions
    .filter((t) => t.tipe === 'Expense')
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 3);

  // 3. Pertumbuhan Aset & Investasi
  const latestMonthHistory = safeHistory.length > 0 ? safeHistory[safeHistory.length - 1] : null;
  const prevMonthHistory = safeHistory.length > 1 ? safeHistory[safeHistory.length - 2] : null;

  let momGrowthNominal = 0;
  let momGrowthPct = 0;
  if (latestMonthHistory && prevMonthHistory && prevMonthHistory.totalNetWorth > 0) {
    momGrowthNominal = latestMonthHistory.totalNetWorth - prevMonthHistory.totalNetWorth;
    momGrowthPct = (momGrowthNominal / prevMonthHistory.totalNetWorth) * 100;
  } else if (latestMonthHistory && latestMonthHistory.netProfitMoM !== undefined) {
    momGrowthNominal = latestMonthHistory.netProfitMoM;
  }

  // Top active brokers / assets
  const activeAssetsSorted = [...safeAssets]
    .filter((a) => (a.nilaiAkhirBulan || 0) > 0)
    .sort((a, b) => (b.nilaiAkhirBulan || 0) - (a.nilaiAkhirBulan || 0))
    .slice(0, 4);

  // 4. Cadangan Kas Likuid & Dana Darurat
  const liquidCash = cashStandbyDanaDarurat > 0
    ? cashStandbyDanaDarurat
    : safeAccounts
        .filter((a) => !a.nama.toLowerCase().includes('investasi') && !a.nama.toLowerCase().includes('rdn'))
        .reduce((sum, a) => sum + Math.max(0, a.totalSaldo), 0);

  const monthsRunway = totalExpense > 0 ? (liquidCash / totalExpense).toFixed(1) : '∞';

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  // Export to PDF
  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    triggerHaptic('medium');
    setIsExportingPdf(true);
    setExportError(null);

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, imgHeight), undefined, 'FAST');

      const fileName = `Laporan-${currentSheetName.toUpperCase()}-2026.pdf`;
      pdf.save(fileName);
      triggerHaptic('success');
    } catch (err: any) {
      console.error('Gagal membuat file PDF:', err);
      setExportError('Gagal memproses PDF. Silakan gunakan opsi Cetak Dokumen.');
      triggerHaptic('error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    triggerHaptic('medium');
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      {/* Strict Print CSS: Ensures 1 Clean Page */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
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
            visibility: hidden;
          }
          #unified-monthly-report-sheet, #unified-monthly-report-sheet * {
            visibility: visible;
          }
          #unified-monthly-report-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-[780px] my-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-slate-900">
        {/* Top Control Bar (Screen only) - Clean Navy, White, Light Grey */}
        <div className="no-print p-3 sm:p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Laporan Finansial Bulanan
            </h3>
            <p className="text-[11px] text-slate-400">
              Periode {currentSheetName} 2026
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer border border-slate-700"
              title="Cetak via dialog browser"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error notification if PDF rendering fails */}
        {exportError && (
          <div className="no-print mx-4 mt-3 p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center justify-between">
            <span>{exportError}</span>
            <button onClick={() => setExportError(null)} className="text-red-400 hover:text-white text-xs underline">
              Tutup
            </button>
          </div>
        )}

        {/* Scrollable Document Container */}
        <div className="p-3 sm:p-5 overflow-y-auto bg-slate-950 flex justify-center">
          {/* THE 1-PAGE REPORT CANVAS: Clean Minimalist Light Grey, Navy, White, Dark Red */}
          <div
            id="unified-monthly-report-sheet"
            ref={reportRef}
            className="w-full max-w-[720px] bg-white text-slate-900 p-6 sm:p-7 rounded-2xl shadow-xl space-y-4 font-sans border border-slate-200"
            style={{ minHeight: '890px' }}
          >
            {/* Header Document: Clean Minimalist, No Useless Badges */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 uppercase">
                  Laporan Finansial Bulanan
                </h1>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  Ringkasan Arus Kas, Pos Pengeluaran, & Pertumbuhan Aset
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-900">
                  {currentSheetName} 2026
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* PILAR 1: RINGKASAN ARUS KAS (Pemasukan vs Pengeluaran & Surplus/Defisit) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  1. Arus Kas Bulanan
                </h2>
                <span className="text-[11px] font-semibold text-slate-600">
                  Rasio Tabungan: <strong className={isSurplus ? 'text-slate-900' : 'text-red-800 font-black'}>{savingsRate}%</strong>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {/* Total Pemasukan: Clean Light Grey / White Card */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                    Pemasukan
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 block truncate">
                    {formatRupiah(totalIncome)}
                  </span>
                  <span className="text-[10px] text-slate-500">Total Arus Masuk</span>
                </div>

                {/* Total Pengeluaran: Dark Red for Spending */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                    Pengeluaran
                  </span>
                  <span className="text-base sm:text-lg font-black text-red-800 block truncate">
                    {formatRupiah(totalExpense)}
                  </span>
                  <span className="text-[10px] text-slate-500">{spendRate}% dari Pemasukan</span>
                </div>

                {/* Sisa / Surplus Bersih: Dark Red if Deficit, Navy if Surplus */}
                <div className={`p-3 rounded-xl border ${
                  isSurplus ? 'bg-slate-50 border-slate-200' : 'bg-red-50/70 border-red-200'
                }`}>
                  <span className={`text-[11px] font-semibold block mb-0.5 ${
                    isSurplus ? 'text-slate-700' : 'text-red-800'
                  }`}>
                    {isSurplus ? 'Surplus Bersih' : 'Defisit Bersih'}
                  </span>
                  <span className={`text-base sm:text-lg font-black block truncate ${
                    isSurplus ? 'text-slate-950' : 'text-red-800'
                  }`}>
                    {isSurplus ? '+' : ''}{formatRupiah(netSavings)}
                  </span>
                  <span className={`text-[10px] ${isSurplus ? 'text-slate-500' : 'text-red-700'}`}>
                    {isSurplus ? 'Tabungan Berjalan' : 'Defisit Terdeteksi'}
                  </span>
                </div>
              </div>
            </div>

            {/* PILAR 2: POS PENGELUARAN TERBESAR */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  2. Pos Pengeluaran Terbesar
                </h2>
                <span className="text-[10px] text-slate-500">
                  {sortedCategories.length} Kategori Utama
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category Progress Bars: Clean Navy / Slate Bars */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-800 block mb-1">
                    Beban Berdasarkan Kategori
                  </span>
                  {sortedCategories.length > 0 ? (
                    sortedCategories.map(([cat, amount]) => {
                      const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-800 truncate max-w-[140px]">{cat}</span>
                            <span className="font-mono text-slate-900">
                              <strong className="font-bold text-red-800">{formatRupiah(amount)}</strong> <span className="text-slate-500 font-normal">({pct.toFixed(0)}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-slate-900 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500 italic py-2 text-center">
                      Belum ada data pengeluaran di periode ini.
                    </p>
                  )}
                </div>

                {/* Top Individual Transactions: Dark Red for Amounts */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-800 block mb-2">
                    Transaksi Nilai Terbesar
                  </span>
                  <div className="space-y-1.5">
                    {topIndividualExpenses.length > 0 ? (
                      topIndividualExpenses.map((tx, idx) => (
                        <div
                          key={tx.id || idx}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold text-slate-900 truncate block">
                              {tx.catatan || tx.kategori}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {tx.kategori} · {tx.akun}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-red-800 text-xs shrink-0">
                            -{formatRupiah(tx.jumlah)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic py-2 text-center">
                        Tidak ada transaksi mutasi.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* PILAR 3: PERTUMBUHAN ASET & PORTOFOLIO INVESTASI */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  3. Portofolio & Pertumbuhan Aset Investasi
                </h2>
                <span className="text-[10px] text-slate-500">
                  Valuasi Real-time
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-3 gap-2 pb-2.5 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Net Worth</span>
                    <span className="text-sm sm:text-base font-black text-slate-950 block truncate">
                      {formatRupiah(totalAset)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Nilai Portofolio</span>
                    <span className="text-sm sm:text-base font-black text-slate-900 block truncate">
                      {formatRupiah(totalInvestment)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Pertumbuhan MoM</span>
                    <span className={`text-sm sm:text-base font-black block truncate ${
                      momGrowthNominal > 0
                        ? 'text-slate-900'
                        : momGrowthNominal < 0
                        ? 'text-red-800'
                        : 'text-slate-600 font-semibold'
                    }`}>
                      {momGrowthNominal !== 0 ? (
                        <>
                          {momGrowthNominal > 0 ? '+' : ''}{formatRupiah(momGrowthNominal)}
                          {momGrowthPct !== 0 && ` (${momGrowthPct > 0 ? '+' : ''}${momGrowthPct.toFixed(1)}%)`}
                        </>
                      ) : (
                        'Valuasi Berjalan'
                      )}
                    </span>
                  </div>
                </div>

                {/* Asset / Broker Breakdown: Clean White / Light Grey Cards */}
                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                    Alokasi Portofolio Berjalan
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {activeAssetsSorted.length > 0 ? (
                      activeAssetsSorted.map((asset) => {
                        const pct = totalInvestment > 0 ? ((asset.nilaiAkhirBulan || 0) / totalInvestment) * 100 : 0;
                        return (
                          <div key={asset.nama} className="p-2 rounded-lg bg-white border border-slate-200">
                            <span className="text-xs font-bold text-slate-900 truncate block">
                              {asset.nama}
                            </span>
                            <span className="text-xs font-bold text-slate-800 block">
                              {formatRupiah(asset.nilaiAkhirBulan)}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {pct.toFixed(1)}% alokasi
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-4 p-2 rounded-lg bg-white border border-slate-200 text-center text-xs text-slate-500">
                        Belum ada aset investasi terdaftar.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* PILAR 4: KETAHANAN FINANSIAL & KESIMPULAN - Clean Deep Navy & Subtle Red */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-100 block">
                  Cadangan Kas: {formatRupiah(liquidCash)}
                </span>
                <span className="text-[11px] text-slate-300 block mt-0.5">
                  Estimasi ketahanan sekitar <strong>{monthsRunway} bulan</strong> biaya operasional.
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block font-mono">Status Evaluasi</span>
                <span className={`text-xs font-black uppercase tracking-wider ${
                  isSurplus ? 'text-slate-100' : 'text-red-400'
                }`}>
                  {isSurplus ? 'Arus Kas Sehat' : 'Defisit Terdeteksi'}
                </span>
              </div>
            </div>

            {/* Footer: Clean, Minimalist */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
              <span>Laporan Finansial Pribadi · {currentSheetName} 2026</span>
              <span>1 Halaman</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
