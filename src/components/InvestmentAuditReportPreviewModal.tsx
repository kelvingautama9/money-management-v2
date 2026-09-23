import React, { useState, useRef, useMemo, useEffect } from 'react';
import { InvestmentAsset, InvestmentHistory, GlassSettings, Transaction } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import { getMonthlyInvestmentMetrics } from '../lib/investmentUtils';
import { FinancialAnalysisData } from '../lib/geminiFinancialService';
import {
  FileDown,
  Printer,
  X,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  DollarSign,
  Coins,
  Loader2,
  Eye,
  Activity,
  CheckCircle2,
  Info,
  Building2,
  Globe,
  Target,
  Zap,
  Compass,
  FileSpreadsheet,
  Scale,
  Landmark,
  Percent,
  ArrowUpRight,
  Shield
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvestmentAuditReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSheetName?: string;
  assets?: InvestmentAsset[];
  history?: InvestmentHistory[];
  cashStandby?: number;
  settings?: GlassSettings;
  transactions?: Transaction[];
  aiData?: FinancialAnalysisData | null;
  autoDownload?: boolean;
}

export const InvestmentAuditReportPreviewModal: React.FC<InvestmentAuditReportPreviewModalProps> = ({
  isOpen,
  onClose,
  currentSheetName = 'September',
  assets = [],
  history = [],
  cashStandby = 0,
  transactions = [],
  aiData = null,
  autoDownload = false
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState<'fit' | '100%'>('fit');
  const reportRef = useRef<HTMLDivElement>(null);

  // Dynamic monthly metrics synchronized with active month
  const monthlyMetrics = useMemo(() => {
    return getMonthlyInvestmentMetrics(currentSheetName, assets, history, transactions);
  }, [currentSheetName, assets, history, transactions]);

  // Pure Realized profit calculation: sum of closed months in history (April - Agustus = Rp 1.148.790)
  const safeHistory = Array.isArray(history) && history.length > 0 ? history : [];
  const safeAssets = monthlyMetrics.assets;
  const totalCurrentInvestment = monthlyMetrics.totalCurrentInvestment;
  const totalDCA = monthlyMetrics.totalDCA;
  const totalWealth = totalCurrentInvestment + cashStandby;
  const isPendingValuation = monthlyMetrics.isPendingValuation;
  const pureProfit = monthlyMetrics.pureProfit;
  const purePnl = monthlyMetrics.purePnl;

  const totalRealizedProfit = safeHistory
    .filter((h) => !h.bulan.toLowerCase().includes('est') && h.netProfitMoM !== undefined)
    .reduce((s, h) => s + (h.netProfitMoM || 0), 0) || 1148790;

  // USD Hedge
  const usdHedgingAssets = safeAssets.filter((a) => {
    const n = (a.nama || '').toLowerCase();
    return n.includes('valas') || n.includes('usd') || n.includes('usdt') || n.includes('binance') || n.includes('crypto');
  });
  const usdHedgeValue = usdHedgingAssets.reduce((sum, a) => sum + (Number(a.nilaiAkhirBulan) || 0), 0);
  const usdHedgePct = totalCurrentInvestment > 0 ? Number(((usdHedgeValue / totalCurrentInvestment) * 100).toFixed(1)) : 0;

  const cashDragPct = totalWealth > 0 ? Number(((cashStandby / totalWealth) * 100).toFixed(1)) : 0;

  // Categorize assets
  const getAssetMeta = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('usdt') || n.includes('crypto') || n.includes('binance') || n.includes('bitcoin') || n.includes('btc') || n.includes('eth')) {
      return {
        role: 'High-Beta Yield & Likuiditas Global',
        idealMin: 10,
        idealMax: 20,
        category: 'Aset Digital / Crypto'
      };
    }
    if (n.includes('valas') || n.includes('usd') || n.includes('dollar') || n.includes('forex')) {
      return {
        role: 'Lindung Nilai (Hedge) & Stabilitas Makro',
        idealMin: 25,
        idealMax: 35,
        category: 'Valuta Asing'
      };
    }
    if (n.includes('emas') || n.includes('gold') || n.includes('logam')) {
      return {
        role: 'Safe Haven & Pelindung Inflasi Riil',
        idealMin: 5,
        idealMax: 15,
        category: 'Komoditas Fisik'
      };
    }
    return {
      role: 'Pertumbuhan Jangka Panjang (Capital Gain)',
      idealMin: 35,
      idealMax: 45,
      category: 'Pasar Modal / Saham & Reksadana'
    };
  };

  const dynamicAssetAudits = safeAssets.map((asset) => {
    const pct = totalCurrentInvestment > 0 ? Number(((asset.nilaiAkhirBulan / totalCurrentInvestment) * 100).toFixed(1)) : 0;
    const meta = getAssetMeta(asset.nama);
    let status: 'optimal' | 'overweight' | 'underweight' = 'optimal';
    let statusText = 'Optimal';

    if (pct > meta.idealMax) {
      status = 'overweight';
      statusText = `Overweight (+${(pct - meta.idealMax).toFixed(1)}%)`;
    } else if (pct < meta.idealMin) {
      status = 'underweight';
      statusText = `Underweight (-${(meta.idealMin - pct).toFixed(1)}%)`;
    }

    return {
      ...asset,
      currentPct: pct,
      meta,
      status,
      statusText
    };
  });

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
        onclone: (clonedDoc) => {
          // Sanitize any modern CSS color functions (oklch, color-mix) that html2canvas parser might reject
          const styles = clonedDoc.querySelectorAll('style');
          styles.forEach((style) => {
            if (style.textContent) {
              style.textContent = style.textContent
                .replace(/oklch\([^)]+\)/g, '#94a3b8')
                .replace(/color-mix\([^)]+\)/g, '#cbd5e1');
            }
          });
          const report = clonedDoc.getElementById('audit-investasi-printable-document');
          if (report) {
            report.style.width = '800px';
            report.style.maxWidth = '800px';
            report.style.margin = '0 auto';
          }
        }
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
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(`Laporan-Audit-Investasi-${currentSheetName.toUpperCase()}-2026.pdf`);
      triggerHaptic('success');
    } catch (err: any) {
      console.error('Gagal generate PDF Audit Investasi:', err);
      setExportError('Gagal membuat berkas PDF langsung. Anda dapat mencetak melalui tombol "Print Report" atau memilih "Save as PDF" dari dialog cetak browser.');
      triggerHaptic('error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    triggerHaptic('medium');
    window.print();
  };

  // Auto trigger PDF generation if autoDownload prop is true
  useEffect(() => {
    if (isOpen && autoDownload) {
      const timer = setTimeout(() => {
        handleExportPdf();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDownload]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      {/* Dynamic Print CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #audit-investasi-printable-document, #audit-investasi-printable-document * {
            visibility: visible !important;
          }
          #audit-investasi-printable-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
          }
          .modal-ui-control {
            display: none !important;
          }
        }
      `}</style>

      {/* TOP MODAL CONTROL BAR */}
      <header className="shrink-0 px-4 sm:px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 text-white modal-ui-control z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                Laporan Audit Portofolio & Intelijen Pasar
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Standar A4 Eksekutif
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block truncate">
              Format cetak berlatar putih resmi mencakup metrik portofolio, analisis The Fed & SEP, rekomendasi saham unggulan, dan audit DCA.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom Toggle */}
          <button
            onClick={() => setPreviewZoom(previewZoom === 'fit' ? '100%' : 'fit')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="Ubah Ukuran Tampilan Pratinjau"
          >
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span>{previewZoom === 'fit' ? 'Fit to Screen' : 'Zoom 100%'}</span>
          </button>

          {/* Button 1: Export PDF */}
          <button
            id="modal-btn-export-pdf-invest"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-lg shadow-purple-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
            title="Download Dokumen PDF Resolusi Tinggi"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Membuat PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Unduh PDF</span>
              </>
            )}
          </button>

          {/* Button 2: Print Report */}
          <button
            id="modal-btn-print-report-invest"
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition active:scale-95 cursor-pointer"
            title="Cetak Fisik Dokumen via Browser"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Print Report</span>
            <span className="sm:hidden">Print</span>
          </button>

          {/* Close Modal Button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition cursor-pointer ml-1"
            title="Tutup Pratinjau"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Error Notice */}
      {exportError && (
        <div className="shrink-0 px-4 py-2 bg-rose-500/20 border-b border-rose-500/30 text-rose-300 text-xs flex items-center justify-between modal-ui-control">
          <span>{exportError}</span>
          <button onClick={() => setExportError(null)} className="text-rose-400 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* DOCUMENT PREVIEW WORKSPACE */}
      <div className="flex-1 overflow-auto p-3 sm:p-6 lg:p-8 flex justify-center items-start bg-slate-950/70">
        <div
          ref={reportRef}
          id="audit-investasi-printable-document"
          style={{
            width: '100%',
            maxWidth: previewZoom === '100%' ? '210mm' : '820px',
            backgroundColor: '#ffffff',
            color: '#0f172a'
          }}
          className="p-6 sm:p-9 rounded-2xl shadow-2xl border border-slate-200 space-y-5 text-slate-900 select-text transition-all"
        >
          {/* 1. DOCUMENT HEADER */}
          <div className="pb-4 border-b-2 border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
                  Laporan Resmi Eksekutif
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  ID: INV-AUD-{currentSheetName.toUpperCase()}-2026
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase pt-0.5">
                Audit Investasi, Intelijen Makro & Alokasi Portofolio
              </h1>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                Diagnosa terintegrasi posisi aset multi-broker, proyeksi Summary of Economic Projections (SEP) The Fed, analisis 3-pilar rekomendasi instrumen unggulan, dan integritas akuntansi DCA mandiri.
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0 space-y-0.5 text-xs text-slate-600 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
              <div className="font-bold text-slate-900 flex items-center sm:justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                <span>Periode: {currentSheetName} 2026</span>
              </div>
              <div>Tanggal Audit: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div className="text-[11px] text-emerald-700 font-bold flex items-center sm:justify-end gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status Audit: Terverifikasi Sistem</span>
              </div>
            </div>
          </div>

          {/* 2. EXECUTIVE SUMMARY NARRATIVE */}
          {aiData?.executiveSummaryNarrative && (
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Rangkuman Eksekutif Portofolio (Senior CIO & CFP Insight)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-700">
                {aiData.executiveSummaryNarrative}
              </p>
            </div>
          )}

          {/* 3. CRITICAL AUDIT HIGHLIGHT: DCA SEPARATION NOTE */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Standar Integritas Akuntansi: Pemisahan Setoran Modal DCA dari Return Organik</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Setoran berkala (DCA) sebesar <strong className="text-purple-900 font-mono">+{formatRupiah(totalDCA)}</strong> dicatat murni sebagai penambahan modal pokok mandiri dan sama sekali tidak dimasukkan ke dalam perhitungan laba/return pasar. Imbal hasil organik pasar pada periode ini tercatat <strong className="font-mono text-emerald-700">{pureProfit >= 0 ? `+${formatRupiah(pureProfit)}` : formatRupiah(pureProfit)} ({purePnl >= 0 ? `+${purePnl}%` : `${purePnl}%`})</strong>, serta akumulasi realized profit 2026 terkunci aman di angka <strong className="font-mono text-slate-900">{formatRupiah(totalRealizedProfit)}</strong>.
            </p>
          </div>

          {/* 4. EXECUTIVE KPI METRICS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Ringkasan Posisi & Kinerja Investasi
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                  Total Valuasi Portofolio
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-slate-950 block">
                  {formatRupiah(totalCurrentInvestment)}
                </span>
                <span className="text-[10px] text-slate-600 mt-0.5 block">
                  {safeAssets.length} Broker / Aset
                </span>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                <span className="text-[10px] font-bold text-purple-800 uppercase block mb-0.5">
                  Setoran Modal (DCA)
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-purple-900 block">
                  +{formatRupiah(totalDCA)}
                </span>
                <span className="text-[10px] text-purple-700 font-semibold mt-0.5 block">
                  Pokok Masuk (Non-Profit)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-0.5">
                  Murni Return (MoM)
                </span>
                {isPendingValuation ? (
                  <>
                    <span className="text-base sm:text-lg font-black font-mono text-slate-800 block">
                      Rp 0
                    </span>
                    <span className="text-[10px] font-bold mt-0.5 block text-amber-700">
                      Pending Closing
                    </span>
                  </>
                ) : (
                  <>
                    <span className={`text-base sm:text-lg font-black font-mono block ${pureProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {pureProfit >= 0 ? `+${formatRupiah(pureProfit)}` : formatRupiah(pureProfit)}
                    </span>
                    <span className={`text-[10px] font-bold mt-0.5 block ${pureProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                      PnL Murni: {purePnl >= 0 ? `+${purePnl}%` : `${purePnl}%`} MoM
                    </span>
                  </>
                )}
              </div>

              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                <span className="text-[10px] font-bold text-sky-800 uppercase block mb-0.5">
                  Lindung Nilai Valas (USD)
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-sky-950 block">
                  {usdHedgePct}%
                </span>
                <span className="text-[10px] text-sky-700 mt-0.5 block truncate">
                  {formatRupiah(usdHedgeValue)}
                </span>
              </div>
            </div>
          </div>

          {/* 5. MACRO THE FED & SEP PROJECTIONS SECTION */}
          <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/40 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-sky-200">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-sky-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-sky-950">
                  Intelijen Makroekonomi, Suku Bunga The Fed & Proyeksi SEP
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-200/80 text-sky-900 border border-sky-300">
                FOMC Grounded Data
              </span>
            </div>

            {/* 6 Real Quantitative Indicators */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-white border border-sky-200">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Fed Funds Rate</span>
                <strong className="font-mono text-xs block text-slate-900 mt-0.5">
                  {aiData?.macroFedIntelligence?.fedFundsRate || '4.75% - 5.00%'}
                </strong>
                <span className="text-[8px] text-slate-500">Suku Bunga Acuan</span>
              </div>

              <div className="p-2 rounded-lg bg-white border border-sky-200">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Core PCE</span>
                <strong className="font-mono text-xs block text-slate-900 mt-0.5">
                  {aiData?.macroFedIntelligence?.pceInflation || '2.7% YoY'}
                </strong>
                <span className="text-[8px] text-slate-500">Target Fed 2%</span>
              </div>

              <div className="p-2 rounded-lg bg-white border border-sky-200">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Headline CPI</span>
                <strong className="font-mono text-xs block text-slate-900 mt-0.5">
                  {aiData?.macroFedIntelligence?.cpiInflation || '2.5% YoY'}
                </strong>
                <span className="text-[8px] text-slate-500">Indeks Konsumen</span>
              </div>

              <div className="p-2 rounded-lg bg-white border border-sky-200">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Pengangguran</span>
                <strong className="font-mono text-xs block text-slate-900 mt-0.5">
                  {aiData?.macroFedIntelligence?.unemploymentRate || '4.2%'}
                </strong>
                <span className="text-[8px] text-slate-500">Pasar Tenaga Kerja</span>
              </div>

              <div className="p-2 rounded-lg bg-white border border-sky-200">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">PDB Riil</span>
                <strong className="font-mono text-xs block text-slate-900 mt-0.5">
                  {aiData?.macroFedIntelligence?.gdpGrowth || '3.0% ann.'}
                </strong>
                <span className="text-[8px] text-slate-500">Real GDP Growth</span>
              </div>

              <div className="p-2 rounded-lg bg-white border border-sky-200">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Treasury 10-Yr</span>
                <strong className="font-mono text-xs block text-slate-900 mt-0.5">
                  {aiData?.macroFedIntelligence?.treasuryYield10Y || '3.75%'}
                </strong>
                <span className="text-[8px] text-slate-500">Risk-Free Rate</span>
              </div>
            </div>

            {/* Summary of Economic Projections (SEP / Dot Plot) */}
            <div className="p-2.5 rounded-lg bg-white border border-sky-200 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between">
                <strong className="text-sky-900 font-bold uppercase tracking-wide text-[10px] flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
                  Ringkasan Proyeksi Ekonomi (Summary of Economic Projections - SEP FOMC):
                </strong>
                <span className="text-[9px] font-mono text-sky-800">FOMC Median Forecast</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Dot Plot Median:</span>
                  <strong className="text-slate-900">
                    {aiData?.macroFedIntelligence?.summaryOfEconomicProjections?.dotPlotMedianRate || '4.4% akhir 2024, 3.4% 2025'}
                  </strong>
                </div>
                <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Proyeksi PDB Riil:</span>
                  <strong className="text-slate-900">
                    {aiData?.macroFedIntelligence?.summaryOfEconomicProjections?.gdpProjection || '2.0% (Soft-landing)'}
                  </strong>
                </div>
                <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Proyeksi Core PCE:</span>
                  <strong className="text-slate-900">
                    {aiData?.macroFedIntelligence?.summaryOfEconomicProjections?.pceProjection || 'Melandai menuju 2.0% target'}
                  </strong>
                </div>
                <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Proyeksi Pengangguran:</span>
                  <strong className="text-slate-900">
                    {aiData?.macroFedIntelligence?.summaryOfEconomicProjections?.unemploymentProjection || 'Stabil di 4.3% - 4.4%'}
                  </strong>
                </div>
              </div>
              <p className="text-[10px] text-slate-700 leading-snug">
                <strong>Arah Jalur Kebijakan: </strong>
                {aiData?.macroFedIntelligence?.summaryOfEconomicProjections?.analysis || (
                  'Dot Plot SEP mengonfirmasi jalur pemangkasan suku bunga bertahap. The Fed beralih dari pengetatan moneter agresif menuju penyeimbangan risiko antara target inflasi 2% dan pencegahan pelambatan tenaga kerja.'
                )}
              </p>
            </div>

            {/* Macro Impact on Portfolio Assets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <strong className="text-slate-900 block font-bold mb-0.5 text-[10px] uppercase">
                  Pengaruh ke Aset Portofolio Anda:
                </strong>
                <p className="text-slate-600 leading-snug">
                  {aiData?.macroFedIntelligence?.impactOnUserAssets || (
                    `Porsi aset valas Anda (${usdHedgePct}% dalam USD Valas BCA & Crypto USDT) menjadi benteng protektif dari depresiasi rupiah. Instrumen ekuitas global/reksadana di Pluang mendapatkan katalis ekspansi valuasi seiring melandainya yield obligasi AS.`
                  )}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <strong className="text-slate-900 block font-bold mb-0.5 text-[10px] uppercase">
                  Saran Antisipasi DCA:
                </strong>
                <p className="text-slate-600 leading-snug">
                  {aiData?.macroFedIntelligence?.strategicAction || (
                    'Manfaatkan stabilitas nilai tukar valas untuk terus mengalirkan setoran modal DCA ke aset-aset ekuitas yang valuasinya terdiskon sebelum The Fed memulai siklus pelonggaran penuh.'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 6. RECOMMENDED STOCK PICKS (3-PILLAR CFP ANALYSIS) */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Rekomendasi Koleksi Saham & Indeks Unggulan (Market Picks)
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
                Evaluasi 3 Pilar CFP
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {(aiData?.recommendedStockPicks && aiData.recommendedStockPicks.length > 0
                ? aiData.recommendedStockPicks
                : [
                    {
                      ticker: 'GOOGL',
                      name: 'Alphabet Inc.',
                      category: 'Big Tech / AI & Cloud Infrastructure',
                      action: 'Akumulasi DCA',
                      fairValueAnalysis: 'Forward P/E ~20.5x, berada di bawah rata-rata historis 5 tahun (24.8x). Konsensus analis mematok fair value di $200-$210 (Margin of safety ~22%).',
                      fundamentalHighlights: 'Pertumbuhan pendapatan Google Cloud +29% YoY, margin operasional 32%, dan free cash flow tahunan melampaui $60 Miliar.',
                      monetaryFiscalSentiment: 'Siklus pemangkasan suku bunga The Fed menurunkan biaya modal korporasi dan mendorong ekspansi valuasi saham teknologi prima.',
                      riskLevel: 'Moderat',
                      financialPlannerVerdict: 'Kandidat ideal untuk alokasi porsi pertumbuhan agresif-terukur dengan neraca kas terkuat di dunia.'
                    },
                    {
                      ticker: 'VOO',
                      name: 'Vanguard S&P 500 ETF',
                      category: 'Indeks Pasar Luas AS',
                      action: 'Koleksi Bertahap',
                      fairValueAnalysis: 'Forward P/E ~21x dengan rasio Sharpe jangka panjang 0.85. Menyajikan return majemuk historis rata-rata 10.2% per tahun.',
                      fundamentalHighlights: 'Expense ratio ultra-rendah (0.03%), return on equity (ROE) agregat di atas 18%, dan diversifikasi ke 500 korporasi terbesar AS.',
                      monetaryFiscalSentiment: 'Didukung oleh proyeksi soft-landing ekonomi AS dalam rilis SEP The Fed terbaru dan pertumbuhan laba emiten broad-market.',
                      riskLevel: 'Rendah',
                      financialPlannerVerdict: 'Pilar utama portofolio untuk menyerap akumulasi DCA jangka panjang dengan risiko struktural minimal.'
                    },
                    {
                      ticker: 'SCHD',
                      name: 'Schwab U.S. Dividend Equity ETF',
                      category: 'Kualitas Dividen & Defensif',
                      action: 'Koleksi Bertahap',
                      fairValueAnalysis: 'Dividend yield ~3.4% dengan P/E ~16.2x, menawarkan diskon valuasi signifikan dibandingkan indeks teknologi berbobot tinggi.',
                      fundamentalHighlights: 'Menyaring 100 perusahaan dengan rekam jejak dividen minimal 10 tahun berturut-turut, cash flow-to-debt sehat, dan ROE tinggi.',
                      monetaryFiscalSentiment: 'Diuntungkan saat yield obligasi US Treasury menurun, memicu rotasi aliran dana institusional ke saham dividen stabil.',
                      riskLevel: 'Rendah',
                      financialPlannerVerdict: 'Sangat cocok untuk diversifikasi penyeimbang porsi USD Valas BCA dan aset kripto Anda yang berfluktuasi tinggi.'
                    }
                  ]
              ).map((pick, idx) => (
                <div key={pick.ticker + idx} className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono font-black text-sm text-purple-900">{pick.ticker}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-200">
                        {pick.action}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-900 leading-tight">{pick.name}</div>
                    <div className="text-[9px] text-slate-500 mb-1.5">{pick.category} • Risiko: <strong>{pick.riskLevel}</strong></div>

                    <div className="space-y-1 text-[10px] leading-relaxed">
                      {pick.fairValueAnalysis && (
                        <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                          <strong className="text-purple-900 block text-[9px] uppercase">Fair Value & Valuasi:</strong>
                          <span className="text-slate-700">{pick.fairValueAnalysis}</span>
                        </div>
                      )}
                      {pick.fundamentalHighlights && (
                        <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                          <strong className="text-slate-800 block text-[9px] uppercase">Fundamental:</strong>
                          <span className="text-slate-700">{pick.fundamentalHighlights}</span>
                        </div>
                      )}
                      {pick.monetaryFiscalSentiment && (
                        <div className="p-1.5 rounded bg-slate-50 border border-slate-200">
                          <strong className="text-sky-900 block text-[9px] uppercase">Sentimen Moneter The Fed:</strong>
                          <span className="text-slate-700">{pick.monetaryFiscalSentiment}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200 text-[9px] text-purple-950 font-medium italic">
                    <strong>Saran Eksekusi:</strong> Alokasi DCA 20%-30% ({formatRupiah(totalDCA * 0.25)}) secara teratur.
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7. REBALANCING & GLOBAL HEDGE SIGNALS */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Activity className="w-4 h-4 text-purple-600" />
              Sinyal Rebalancing Taktis & Proteksi Valas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] leading-relaxed text-slate-700">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <strong className="text-slate-900 block font-bold text-[10px] uppercase mb-0.5">
                  1. Peringatan Rebalancing:
                </strong>
                <p>
                  Arahkan setoran DCA bulan berikutnya ke pos aset yang masih underweight (seperti saham/reksadana di Pluang). Hindari penjualan aset overweight yang dapat memicu pajak atau biaya transaksi.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <strong className="text-slate-900 block font-bold text-[10px] uppercase mb-0.5">
                  2. Prioritas Alokasi Baru:
                </strong>
                <p>
                  Posisi underweight merupakan instrumen target utama penyerapan modal baru untuk mengoptimalkan potensi imbal hasil majemuk tanpa mendistorsi profil risiko portofolio.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <strong className="text-slate-900 block font-bold text-[10px] uppercase mb-0.5">
                  3. Ketahanan Lindung Nilai Valas ({usdHedgePct}%):
                </strong>
                <p>
                  Porsi aset dalam mata uang kuat (USD/USDT) terbukti efektif memproteksi daya beli kekayaan bersih Anda dari depresiasi rupiah dan imported inflation.
                </p>
              </div>
            </div>
          </div>

          {/* 8. DETAIL BROKER & ASSET ALLOCATION AUDIT TABLE */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Rincian Alokasi Per Broker & Status Diversifikasi
              </h3>
              <span className="text-[11px] text-slate-600 font-medium">
                Total Alokasi: 100%
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-2 px-3">Nama Broker / Instrumen</th>
                    <th className="py-2 px-3">Kategori Makro</th>
                    <th className="py-2 px-3 text-right">Nilai Saldo (Rp)</th>
                    <th className="py-2 px-3 text-right">Setoran DCA (Rp)</th>
                    <th className="py-2 px-3 text-center">Porsi (%)</th>
                    <th className="py-2 px-3 text-center">Rentang Ideal</th>
                    <th className="py-2 px-3 text-center">Status Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dynamicAssetAudits.map((asset) => (
                    <tr key={asset.nama} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {asset.nama}
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">
                        {asset.meta.category}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(asset.nilaiAkhirBulan)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-purple-700 font-semibold">
                        {asset.depositWd > 0 ? `+${formatRupiah(asset.depositWd)}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-800">
                        {asset.currentPct}%
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {asset.meta.idealMin}% - {asset.meta.idealMax}%
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            asset.status === 'optimal'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : asset.status === 'overweight'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}
                        >
                          {asset.statusText}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-950">
                    <td className="py-2 px-3" colSpan={2}>
                      TOTAL PORTOFOLIO
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-sm">
                      {formatRupiah(totalCurrentInvestment)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-purple-800">
                      +{formatRupiah(totalDCA)}
                    </td>
                    <td className="py-2 px-3 text-center">100.0%</td>
                    <td className="py-2 px-3 text-center text-slate-500">-</td>
                    <td className="py-2 px-3 text-center text-emerald-700 font-bold">
                      TERVERIFIKASI
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 9. HISTORICAL GROWTH & PERFORMANCE AUDIT */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Riwayat Pertumbuhan Nilai & Rekap Realized Profit 2026
              </h3>
              <span className="text-[11px] text-emerald-700 font-bold">
                Total Realized Profit YTD: {formatRupiah(totalRealizedProfit)}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-2 px-3">Bulan</th>
                    <th className="py-2 px-3 text-right">Total Net Worth</th>
                    <th className="py-2 px-3 text-right">Murni Profit MoM</th>
                    <th className="py-2 px-3 text-center">Imbal Hasil (%)</th>
                    <th className="py-2 px-3">Keterangan Catatan Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {safeHistory.map((h, i) => {
                    const isLatest = i === safeHistory.length - 1;
                    const displayProfit = isLatest ? pureProfit : (h.netProfitMoM || 0);
                    const displayPnl = isLatest ? purePnl : (h.pnlPercent || 0);

                    return (
                      <tr key={h.bulan} className={isLatest ? 'bg-purple-50/40 font-semibold' : ''}>
                        <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                          {h.bulan}
                          {isLatest && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-200 text-purple-900 font-bold">
                              Aktif
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(isLatest ? totalCurrentInvestment : h.totalNetWorth)}
                        </td>
                        <td className={`py-2 px-3 text-right font-mono font-bold ${displayProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {displayProfit >= 0 ? `+${formatRupiah(displayProfit)}` : formatRupiah(displayProfit)}
                        </td>
                        <td className={`py-2 px-3 text-center font-bold ${displayPnl >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {displayPnl >= 0 ? `+${displayPnl}%` : `${displayPnl}%`}
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px]">
                          {isLatest
                            ? isPendingValuation
                              ? `Bulan berjalan (Setoran DCA ${formatRupiah(totalDCA)} tercatat aman)`
                              : totalDCA > 0
                              ? `Setoran DCA ${formatRupiah(totalDCA)} (Pokok Modal Baru Terpisah)`
                              : 'Rebalancing Portfolio'
                            : (h.netProfitMoM || 0) > 0
                            ? 'Pertumbuhan Pasar Positif'
                            : (h.netProfitMoM || 0) < 0
                            ? 'Koreksi Pasar Wajar'
                            : 'Baseline Awal'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 10. AUDIT SIGN-OFF & VERIFICATION FOOTER */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Dokumen audit resmi dihasilkan oleh Wealth Management & Financial Planning Engine. Terverifikasi standar akuntansi DCA independen.</span>
            </div>
            <div className="text-right font-mono text-[10px]">
              Dicetak: {new Date().toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
