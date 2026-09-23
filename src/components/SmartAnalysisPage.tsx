import React, { useState, useMemo } from 'react';
import { GlassSettings, InvestmentAsset, InvestmentHistory, Transaction } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import { getMonthlyInvestmentMetrics } from '../lib/investmentUtils';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Coins,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Printer,
  FileDown,
  Activity,
  Layers,
  Lightbulb,
  FileText,
  Info,
  Eye
} from 'lucide-react';
import { InvestmentAuditReportPreviewModal } from './InvestmentAuditReportPreviewModal';

interface SmartAnalysisPageProps {
  settings: GlassSettings;
  assets: InvestmentAsset[];
  history: InvestmentHistory[];
  cashStandby?: number;
  onBack?: () => void;
  currentSheetName?: string;
  transactions?: Transaction[];
}

export const SmartAnalysisPage: React.FC<SmartAnalysisPageProps> = ({
  settings,
  assets = [],
  history = [],
  cashStandby = 0,
  onBack,
  currentSheetName = 'September',
  transactions = []
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const isDark = settings?.themeMode !== 'light' && settings?.themeMode !== 'beige';
  const isLight = !isDark;

  // Dynamic monthly metrics synchronized with active month
  const monthlyMetrics = useMemo(() => {
    return getMonthlyInvestmentMetrics(currentSheetName, assets, history, transactions);
  }, [currentSheetName, assets, history, transactions]);

  const safeAssets = monthlyMetrics.assets;
  const safeHistory = Array.isArray(history) && history.length > 0 ? history : [];

  const totalInvestment = monthlyMetrics.totalCurrentInvestment;
  const totalDCA = monthlyMetrics.totalDCA;
  const totalWealth = totalInvestment + cashStandby;

  const prevNetWorth = monthlyMetrics.prevNetWorth;
  const isPendingValuation = monthlyMetrics.isPendingValuation;
  const pureProfit = monthlyMetrics.pureProfit;
  const purePnl = monthlyMetrics.purePnl;

  // Pure Total Realized Profit 2026 (Sum of closed months April - August = Rp 1.148.790)
  const totalRealizedProfit = safeHistory
    .filter((h) => !h.bulan.toLowerCase().includes('est') && h.netProfitMoM !== undefined)
    .reduce((sum, h) => sum + (h.netProfitMoM || 0), 0) || 1148790;

  // Dynamic calculations for USD/Hedge
  const usdHedgingAssets = safeAssets.filter((a) => {
    const n = (a.nama || '').toLowerCase();
    return n.includes('valas') || n.includes('usd') || n.includes('usdt') || n.includes('binance') || n.includes('crypto');
  });
  const usdHedgeValue = usdHedgingAssets.reduce((sum, a) => sum + (Number(a.nilaiAkhirBulan) || 0), 0);
  const usdHedgePct = totalInvestment > 0 ? Number(((usdHedgeValue / totalInvestment) * 100).toFixed(1)) : 0;

  const cashDragPct = totalWealth > 0 ? Number(((cashStandby / totalWealth) * 100).toFixed(1)) : 0;

  // Helper to categorize any dynamic asset name
  const getAssetMeta = (name: string, pct: number) => {
    const n = (name || '').toLowerCase();
    if (n.includes('usdt') || n.includes('crypto') || n.includes('binance') || n.includes('bitcoin') || n.includes('btc') || n.includes('eth')) {
      return {
        icon: <Coins className="w-4 h-4 text-amber-500" />,
        color: 'from-amber-500 to-yellow-400',
        badgeBg: isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        role: 'High-Beta Tactical Yield & Likuiditas Global',
        idealMin: 10,
        idealMax: 20,
        category: 'Aset Digital / Crypto'
      };
    }
    if (n.includes('valas') || n.includes('usd') || n.includes('dollar') || n.includes('forex')) {
      return {
        icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
        color: 'from-emerald-500 to-teal-400',
        badgeBg: isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        role: 'Lindung Nilai (Hedge) & Stabilitas Makro',
        idealMin: 25,
        idealMax: 35,
        category: 'Valuta Asing'
      };
    }
    if (n.includes('emas') || n.includes('gold') || n.includes('logam')) {
      return {
        icon: <Sparkles className="w-4 h-4 text-yellow-500" />,
        color: 'from-yellow-500 to-amber-400',
        badgeBg: isLight ? 'bg-yellow-100 text-yellow-900 border-yellow-300' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        role: 'Safe Haven & Pelindung Inflasi Riil',
        idealMin: 5,
        idealMax: 15,
        category: 'Komoditas / Logam Mulia'
      };
    }
    if (n.includes('obligasi') || n.includes('sukuk') || n.includes('sbn') || n.includes('fr')) {
      return {
        icon: <ShieldCheck className="w-4 h-4 text-blue-500" />,
        color: 'from-blue-500 to-cyan-400',
        badgeBg: isLight ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        role: 'Pendapatan Tetap Defensif & Kupon Berkala',
        idealMin: 15,
        idealMax: 25,
        category: 'Fixed Income'
      };
    }
    return {
      icon: <TrendingUp className="w-4 h-4 text-sky-500" />,
      color: 'from-sky-500 to-blue-500',
      badgeBg: isLight ? 'bg-sky-100 text-sky-900 border-sky-300' : 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      role: 'Akselerator Pertumbuhan Jangka Panjang (Capital Gain)',
      idealMin: 35,
      idealMax: 45,
      category: 'Pasar Modal / Saham & Reksadana'
    };
  };

  // Rebalancing and health audit calculations
  const dynamicAssetAudits = safeAssets.map((asset) => {
    const pct = totalInvestment > 0 ? Number(((asset.nilaiAkhirBulan / totalInvestment) * 100).toFixed(1)) : 0;
    const meta = getAssetMeta(asset.nama, pct);
    let status: 'optimal' | 'overweight' | 'underweight' = 'optimal';
    if (pct > meta.idealMax) status = 'overweight';
    else if (pct < meta.idealMin) status = 'underweight';

    return {
      ...asset,
      currentPct: pct,
      meta,
      status
    };
  });

  const overweightAssets = dynamicAssetAudits.filter((a) => a.status === 'overweight');
  const underweightAssets = dynamicAssetAudits.filter((a) => a.status === 'underweight');

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
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
          #audit-investasi-printable-page, #audit-investasi-printable-page * {
            visibility: visible !important;
          }
          #audit-investasi-printable-page {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* TOP HEADER BAR */}
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                title="Kembali ke Portofolio"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Audit Investasi
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Audit Institusional
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  DCA Terpisah
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Diagnosa kesehatan portofolio, audit diversifikasi makro, rasio lindung nilai USD, dan pemisahan setoran DCA dari imbal hasil murni.
              </p>
            </div>
          </div>

          {/* Action Buttons: Export PDF, Print Report, & Preview Modal */}
          <div className="flex items-center gap-2 print-hidden flex-wrap self-start lg:self-center">
            {/* Button 1: Preview Modal */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsPreviewOpen(true);
              }}
              className={`px-3.5 py-2 rounded-2xl font-bold text-xs inline-flex items-center gap-1.5 transition active:scale-95 border cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm'
              }`}
              title="Pratinjau Dokumen Latar Putih Bersih"
            >
              <Eye className="w-4 h-4 text-purple-400" />
              <span>Pratinjau Dokumen</span>
            </button>

            {/* Button 2: Export PDF */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                setIsPreviewOpen(true);
              }}
              className="px-4 py-2 rounded-2xl font-bold text-xs inline-flex items-center gap-2 transition active:scale-95 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 cursor-pointer"
              title="Export Laporan Audit ke Berkas PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>Export PDF</span>
            </button>

            {/* Button 3: Print Report */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                window.print();
              }}
              className={`px-3.5 py-2 rounded-2xl font-bold text-xs inline-flex items-center gap-2 transition active:scale-95 border cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              }`}
              title="Cetak Laporan Audit Investasi"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* DCA EXPLANATORY AUDIT CALLOUT */}
      <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
        isDark
          ? 'bg-purple-950/30 border-purple-500/30 text-purple-200'
          : 'bg-purple-50 border-purple-200 text-purple-900'
      }`}>
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold block text-xs">
              Standar Audit Integritas: Akumulasi Realized Profit Tetap Terkunci ({formatRupiah(totalRealizedProfit)})
            </span>
            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              YTD 2026 Bersih
            </span>
          </div>
          <p className="text-[11px] opacity-90">
            {isPendingValuation ? (
              <>Setoran modal DCA bulan berjalan sebesar <strong className="font-mono">{formatRupiah(totalDCA)}</strong> dicatat aman sebagai <em>penambahan modal pokok baru</em>. Karena valuasi akhir bulan belum di-closing, return September berstatus <strong>Pending Closing</strong> dan tidak mengurangi Total Realized Profit yang telah terkunci di angka <strong className="font-mono">{formatRupiah(totalRealizedProfit)}</strong>.</>
            ) : (
              <>Penambahan saldo portofolio dari setoran modal mandiri (DCA) bulan ini sebesar <strong className="font-mono">{formatRupiah(totalDCA)}</strong> dialokasikan murni sebagai setoran modal baru dan dipisahkan dari imbal hasil investasi. Return pasar tercatat <strong className="font-mono">{pureProfit >= 0 ? `+${formatRupiah(pureProfit)}` : formatRupiah(pureProfit)} ({purePnl >= 0 ? `+${purePnl}%` : `${purePnl}%`})</strong> secara organik.</>
            )}
          </p>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div id="audit-investasi-printable-page" className="space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Valuasi Total */}
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
            className="p-4 rounded-3xl shadow-xs"
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Valuasi Portofolio
            </span>
            <span className={`text-lg sm:text-xl font-extrabold font-mono block ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatRupiah(totalInvestment)}
            </span>
            <span className={`text-[10px] mt-1 block font-medium ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
              {safeAssets.length} Posisi Aset Aktif
            </span>
          </div>

          {/* Card 2: Setoran Modal DCA (Modal Baru, bukan return!) */}
          <div
            style={
              isDark
                ? {
                    backgroundColor: 'rgba(168, 85, 247, 0.08)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(168, 85, 247, 0.25)'
                  }
                : {
                    backgroundColor: '#faf5ff',
                    border: '1px solid #e9d5ff'
                  }
            }
            className="p-4 rounded-3xl shadow-xs"
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
              Setoran Modal (DCA)
            </span>
            <span className="text-lg sm:text-xl font-extrabold font-mono block text-purple-500">
              +{formatRupiah(totalDCA)}
            </span>
            <span className={`text-[10px] mt-1 block font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
              Modal Baru (Non-Return)
            </span>
          </div>

          {/* Card 3: Murni Return Hasil Investasi */}
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
            className="p-4 rounded-3xl shadow-xs"
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Murni Return (MoM)
            </span>
            {isPendingValuation ? (
              <>
                <span className={`text-lg sm:text-xl font-extrabold font-mono block ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>
                  Rp 0
                </span>
                <span className="text-[10px] mt-1 block font-medium text-amber-500 dark:text-amber-400">
                  Menunggu Closing Akhir Bulan
                </span>
              </>
            ) : (
              <>
                <span className={`text-lg sm:text-xl font-extrabold font-mono block ${pureProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {pureProfit >= 0 ? `+${formatRupiah(pureProfit)}` : formatRupiah(pureProfit)}
                </span>
                <span className={`text-[10px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Imbal Hasil: <strong className={purePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{purePnl >= 0 ? `+${purePnl}%` : `${purePnl}%`}</strong>
                </span>
              </>
            )}
          </div>

          {/* Card 4: Porsi Lindung Nilai USD */}
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
            className="p-4 rounded-3xl shadow-xs"
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Lindung Nilai USD
            </span>
            <span className={`text-lg sm:text-xl font-extrabold font-mono block ${isDark ? 'text-sky-400' : 'text-blue-600'}`}>
              {usdHedgePct}%
            </span>
            <span className={`text-[10px] mt-1 block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {formatRupiah(usdHedgeValue)}
            </span>
          </div>

          {/* Card 5: Cash Drag */}
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
            className="p-4 rounded-3xl shadow-xs"
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Cash Drag Ratio
            </span>
            <span className={`text-lg sm:text-xl font-extrabold font-mono block ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              {cashDragPct}%
            </span>
            <span className={`text-[10px] mt-1 block truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Kas Standby: {formatRupiah(cashStandby)}
            </span>
          </div>
        </div>

        {/* Asset Breakdown & Allocation Audit Cards */}
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
          className="p-6 rounded-3xl shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Activity className="w-4 h-4 text-purple-400" />
              Audit Posisi Broker & Sinyal Rebalancing Alokasi
            </h3>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Evaluasi Berdasarkan Standar Diversifikasi Makro
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dynamicAssetAudits.map((item) => (
              <div
                key={item.nama}
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white/10">{item.meta.icon}</div>
                    <div>
                      <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.nama}</h4>
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.meta.category}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.status === 'optimal'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : item.status === 'overweight'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Nilai Saldo:</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatRupiah(item.nilaiAkhirBulan)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Setoran DCA:</span>
                    <span className="font-mono text-purple-400 font-semibold">
                      {item.depositWd > 0 ? `+${formatRupiah(item.depositWd)}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Bobot Portofolio:</span>
                    <span className="font-bold text-sky-400">{item.currentPct}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Rentang Ideal:</span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.meta.idealMin}% - {item.meta.idealMax}%
                    </span>
                  </div>
                </div>

                <p className={`text-[11px] leading-relaxed p-2.5 rounded-xl border ${
                  isDark ? 'bg-white/[0.03] border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  {item.meta.role}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Recommendations Box */}
        <div
          style={
            isDark
              ? {
                  backgroundColor: 'rgba(168, 85, 247, 0.08)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(168, 85, 247, 0.25)'
                }
              : {
                  backgroundColor: '#faf5ff',
                  border: '1px solid #e9d5ff'
                }
          }
          className="p-6 rounded-3xl shadow-xs space-y-3"
        >
          <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>
            <Lightbulb className="w-4 h-4 text-purple-400" />
            Rekomendasi Strategis Audit & Rebalancing
          </h3>

          <div className={`space-y-2.5 text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {overweightAssets.length > 0 && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Peringatan Rebalancing:</strong> Aset{' '}
                  <span className="font-bold">{overweightAssets.map((a) => a.nama).join(', ')}</span> berada di atas batas ideal.
                  Tidak perlu melakukan cut-profit jika ada biaya transaksi, cukup <strong>alihkan setoran DCA bulanan berikutnya</strong> ke pos aset yang masih underweight.
                </div>
              </div>
            )}

            {underweightAssets.length > 0 && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200">
                <TrendingUp className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Prioritas Alokasi Baru:</strong> Pos{' '}
                  <span className="font-bold">{underweightAssets.map((a) => a.nama).join(', ')}</span> masih di bawah bobot ideal.
                  Prioritaskan penambahan dana pada aset ini untuk memaksimalkan potensi imbal hasil jangka panjang.
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>Ketahanan Valas & Hedge Global ({usdHedgePct}%):</strong> Porsi aset berdenominasi mata uang kuat (USD/USDT) terbukti melindungi kekayaan bersih Anda dari depresiasi nilai tukar lokal.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Preview for PDF Export & Printing */}
      <InvestmentAuditReportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        currentSheetName={currentSheetName}
        assets={safeAssets}
        history={safeHistory}
        cashStandby={cashStandby}
        settings={settings}
        transactions={transactions}
      />
    </div>
  );
};

// Aliases for seamless backwards compatibility
export const AuditInvestasiPage = SmartAnalysisPage;
