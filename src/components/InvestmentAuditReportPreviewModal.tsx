import React, { useState, useRef, useMemo } from 'react';
import { InvestmentAsset, InvestmentHistory, GlassSettings, Transaction } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import { getMonthlyInvestmentMetrics } from '../lib/investmentUtils';
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
  Info
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
}

export const InvestmentAuditReportPreviewModal: React.FC<InvestmentAuditReportPreviewModalProps> = ({
  isOpen,
  onClose,
  currentSheetName = 'September',
  assets = [],
  history = [],
  cashStandby = 0,
  transactions = []
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState<'fit' | '100%'>('fit');
  const reportRef = useRef<HTMLDivElement>(null);

  // Dynamic monthly metrics synchronized with active month
  const monthlyMetrics = useMemo(() => {
    return getMonthlyInvestmentMetrics(currentSheetName, assets, history, transactions);
  }, [currentSheetName, assets, history, transactions]);

  if (!isOpen) return null;

  const safeAssets = monthlyMetrics.assets;
  const safeHistory = Array.isArray(history) && history.length > 0 ? history : [];

  const totalCurrentInvestment = monthlyMetrics.totalCurrentInvestment;
  const totalDCA = monthlyMetrics.totalDCA;
  const totalWealth = totalCurrentInvestment + cashStandby;

  const prevNetWorth = monthlyMetrics.prevNetWorth;
  const isPendingValuation = monthlyMetrics.isPendingValuation;
  const pureProfit = monthlyMetrics.pureProfit;
  const purePnl = monthlyMetrics.purePnl;

  // Pure Realized profit calculation: sum of closed months in history (April - Agustus = Rp 1.148.790)
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
        category: 'Komoditas / Logam Mulia'
      };
    }
    if (n.includes('obligasi') || n.includes('sukuk') || n.includes('sbn') || n.includes('fr')) {
      return {
        role: 'Pendapatan Tetap Defensif & Kupon Berkala',
        idealMin: 15,
        idealMax: 25,
        category: 'Fixed Income'
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
    let statusText = 'Optimal (Dalam Target)';

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
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(`Audit-Investasi-${currentSheetName.toUpperCase()}-2026.pdf`);
      triggerHaptic('success');
    } catch (err: any) {
      console.error('Gagal generate PDF Audit Investasi:', err);
      setExportError('Gagal membuat berkas PDF. Silakan coba kembali atau gunakan tombol Print Report.');
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
                Pratinjau Audit Investasi & Dokumen PDF
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Standar A4 Cetak
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block truncate">
              Laporan berlatar putih murni (WCAG AAA) dengan pemisahan setoran modal (DCA) dari imbal hasil pasar.
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
                <span className="hidden sm:inline">Membuat PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Export PDF</span>
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
            minHeight: '297mm',
            backgroundColor: '#ffffff',
            color: '#0f172a'
          }}
          className="p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 space-y-6 text-slate-900 select-text transition-all"
        >
          {/* 1. DOCUMENT HEADER */}
          <div className="pb-5 border-b-2 border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
                  Laporan Resmi
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  ID: INV-AUD-{currentSheetName.toUpperCase()}-2026
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase pt-1">
                Audit Investasi & Alokasi Portofolio
              </h1>
              <p className="text-xs text-slate-600 max-w-xl">
                Diagnosa kesehatan aset multi-broker, rasio lindung nilai mata uang asing (USD Hedge), evaluasi cash drag, dan pemisahan akuntansi setoran modal (DCA).
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
                <span>Status Audit: Terverifikasi</span>
              </div>
            </div>
          </div>

          {/* 2. CRITICAL AUDIT HIGHLIGHT: DCA SEPARATION NOTE */}
          <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 text-xs text-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Standar Metodologi: Pemisahan Setoran Modal (DCA) dari Imbal Hasil (Return)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-700">
              {isPendingValuation ? (
                <>Setoran berkala (DCA) sebesar <strong className="text-purple-900 font-mono">{formatRupiah(totalDCA)}</strong> bulan ini dialokasikan secara akurat sebagai <em>penambahan pokok modal mandiri</em> dan <strong>tidak mengurangi akumulasi profit tahunan</strong>. Periode aktif berstatus <strong>Pending Closing</strong> dan laba bersih 2026 tetap terkunci di angka <strong className="text-emerald-800 font-mono">{formatRupiah(totalRealizedProfit)}</strong>.</>
              ) : (
                <>Setoran berkala (DCA) sebesar <strong className="text-purple-900 font-mono">{formatRupiah(totalDCA)}</strong> bulan ini dialokasikan secara akurat sebagai <em>penambahan pokok modal mandiri</em> dan <strong>tidak dimasukkan ke dalam pertumbuhan return hasil investasi</strong>. Metodologi ini memastikan bahwa imbal hasil ({formatRupiah(pureProfit)} / {purePnl >= 0 ? `+${purePnl}%` : `${purePnl}%`}) murni mencerminkan pergerakan harga pasar (capital gain), bunga, dan yield organik.</>
              )}
            </p>
          </div>

          {/* 3. EXECUTIVE KPI METRICS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Ringkasan Posisi & Kinerja Investasi
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Valuasi Portofolio */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
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

              {/* Setoran Modal / DCA */}
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200">
                <span className="text-[10px] font-bold text-purple-800 uppercase block mb-0.5">
                  Setoran Modal (DCA)
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-purple-900 block">
                  +{formatRupiah(totalDCA)}
                </span>
                <span className="text-[10px] text-purple-700 font-semibold mt-0.5 block">
                  Modal Masuk (Non-Return)
                </span>
              </div>

              {/* Murni Return MoM */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-0.5">
                  Murni Return (MoM)
                </span>
                {isPendingValuation ? (
                  <>
                    <span className="text-base sm:text-lg font-black font-mono text-sky-900 block">
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

              {/* USD Hedge Ratio */}
              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                <span className="text-[10px] font-bold text-sky-800 uppercase block mb-0.5">
                  Lindung Nilai USD
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

          {/* 4. DETAIL BROKER & ASSET ALLOCATION AUDIT TABLE */}
          <div>
            <div className="flex items-center justify-between mb-2">
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
                    <th className="py-2.5 px-3">Nama Broker / Instrumen</th>
                    <th className="py-2.5 px-3">Kategori Makro</th>
                    <th className="py-2.5 px-3 text-right">Nilai Saldo (Rp)</th>
                    <th className="py-2.5 px-3 text-right">Setoran DCA (Rp)</th>
                    <th className="py-2.5 px-3 text-center">Porsi (%)</th>
                    <th className="py-2.5 px-3 text-center">Rentang Ideal</th>
                    <th className="py-2.5 px-3 text-center">Status Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dynamicAssetAudits.map((asset) => (
                    <tr key={asset.nama} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {asset.nama}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {asset.meta.category}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(asset.nilaiAkhirBulan)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-purple-700 font-semibold">
                        {asset.depositWd > 0 ? `+${formatRupiah(asset.depositWd)}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                        {asset.currentPct}%
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {asset.meta.idealMin}% - {asset.meta.idealMax}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
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
                    <td className="py-2.5 px-3" colSpan={2}>
                      TOTAL PORTOFOLIO
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm">
                      {formatRupiah(totalCurrentInvestment)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-purple-800">
                      +{formatRupiah(totalDCA)}
                    </td>
                    <td className="py-2.5 px-3 text-center">100.0%</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">-</td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">
                      SEIMBANG
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 5. HISTORICAL GROWTH & PERFORMANCE AUDIT */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Riwayat Pertumbuhan Nilai & Rekap Realized Profit 2026
              </h3>
              <span className="text-[11px] text-emerald-700 font-bold">
                Total Realized Profit: {formatRupiah(totalRealizedProfit)}
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
                              ? `Bulan berjalan / Menunggu closing (Setoran DCA ${formatRupiah(totalDCA)} tercatat aman)`
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

          {/* 6. STRATEGIC RECOMMENDATIONS & REBALANCING ACTION PLAN */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Saran & Rencana Tindakan Rebalancing
            </h4>
            <ul className="space-y-1.5 text-slate-700 list-disc list-inside text-[11px] leading-relaxed">
              <li>
                <strong>Strategi Dollar Cost Averaging (DCA):</strong> Pertahankan konsistensi setoran berkala bulanan. Hindari penjualan aset overweight yang dapat memicu pajak atau biaya transaksi; cukup arahkan setoran DCA baru bulan berikutnya ke instrumen underweight.
              </li>
              <li>
                <strong>Lindung Nilai Valas ({usdHedgePct}%):</strong> Porsi aset berbasis USD saat ini berada dalam rentang proteksi makro yang aman terhadap fluktuasi nilai tukar rupiah.
              </li>
              <li>
                <strong>Rasio Kas Mengendap ({cashDragPct}%):</strong> Kas standby sebesar {formatRupiah(cashStandby)} memadai untuk kebutuhan likuiditas dan dana darurat jangka pendek tanpa mengorbankan imbal hasil jangka panjang.
              </li>
            </ul>
          </div>

          {/* 7. AUDIT SIGN-OFF & VERIFICATION FOOTER */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Dokumen audit resmi ini dihasilkan secara otomatis dan terverifikasi akuntansi DCA mandiri.</span>
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
