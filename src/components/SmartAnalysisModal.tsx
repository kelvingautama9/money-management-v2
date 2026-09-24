import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { GlassSettings, InvestmentAsset, InvestmentHistory, Transaction } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import { getMonthlyInvestmentMetrics } from '../lib/investmentUtils';
import {
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  X,
  Printer,
  FileDown,
  DollarSign,
  Coins,
  ArrowUpRight,
  Activity,
  Layers,
  Scale,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Calendar,
  Info,
  Eye
} from 'lucide-react';
import { InvestmentAuditReportPreviewModal } from './InvestmentAuditReportPreviewModal';

interface SmartAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: InvestmentAsset[];
  history: InvestmentHistory[];
  settings: GlassSettings;
  cashStandby: number;
  currentSheetName?: string;
  transactions?: Transaction[];
}

export const SmartAnalysisModal: React.FC<SmartAnalysisModalProps> = ({
  isOpen,
  onClose,
  assets,
  history,
  settings,
  cashStandby = 0,
  currentSheetName = 'September',
  transactions = []
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Dynamic monthly metrics synchronized with active month
  const monthlyMetrics = useMemo(() => {
    return getMonthlyInvestmentMetrics(currentSheetName, assets, history, transactions);
  }, [currentSheetName, assets, history, transactions]);

  if (!isOpen) return null;

  const isLight = settings?.themeMode === 'light' || settings?.themeMode === 'beige';
  const safeAssets = monthlyMetrics.assets;
  const safeHistory = Array.isArray(history) && history.length > 0 ? history : [];

  const totalInvestment = monthlyMetrics.totalCurrentInvestment;
  const totalDCA = monthlyMetrics.totalDCA;
  const totalWealth = totalInvestment + cashStandby;

  const prevNetWorth = monthlyMetrics.prevNetWorth;
  const isPendingValuation = monthlyMetrics.isPendingValuation;
  const pureProfit = monthlyMetrics.pureProfit;
  const purePnl = monthlyMetrics.purePnl;

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
        badgeBg: isLight ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-blue-500/20 text-blue-300 border-blue-400/30',
        role: 'Pendapatan Tetap Defensif & Kupon Berkala',
        idealMin: 15,
        idealMax: 25,
        category: 'Fixed Income'
      };
    }
    return {
      icon: <TrendingUp className="w-4 h-4 text-sky-500" />,
      color: 'from-sky-500 to-blue-500',
      badgeBg: isLight ? 'bg-sky-100 text-sky-900 border-sky-300' : 'bg-sky-500/20 text-sky-300 border-sky-400/30',
      role: 'Akselerator Pertumbuhan Jangka Panjang (Capital Gain)',
      idealMin: 35,
      idealMax: 45,
      category: 'Pasar Modal / Saham & Reksadana'
    };
  };

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

  return createPortal(
    <div
      onClick={() => {
        triggerHaptic('light');
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="audit-investasi-modal-area"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isLight ? '#ffffff' : 'rgba(10, 14, 28, 0.98)',
          backdropFilter: 'blur(40px) saturate(190%)',
          boxShadow: isLight
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.18)'
            : '0 30px 80px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.25)'
        }}
        className={`w-full max-w-4xl rounded-3xl border ${isLight ? 'border-slate-200 text-slate-900' : 'border-white/15 text-slate-100'} p-4 sm:p-6 my-auto shadow-2xl relative max-h-[92dvh] flex flex-col`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'} gap-3 shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${isLight ? 'bg-purple-50 border border-purple-200' : 'bg-gradient-to-tr from-purple-600/30 via-indigo-600/30 to-blue-500/20 border border-purple-400/30'} flex items-center justify-center shrink-0`}>
              <Activity className={`w-4.5 h-4.5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-base sm:text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : '!text-white'}`}>
                  Audit Investasi & Portofolio
                </h3>
              </div>
              <p className={`text-[11px] sm:text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                Evaluasi kinerja organik real-time, perimbangan instrumen, dan pemisahan setoran DCA dari imbal hasil.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 print-hidden">
            {/* Button: Export PDF */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                setIsPreviewOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              title="Ekspor PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            {/* Button: Print */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                window.print();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer text-xs font-bold ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-200 hover:text-white'}`}
              title="Cetak Ringkasan Audit"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Report</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className={`p-2 rounded-xl border transition cursor-pointer ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-200 hover:text-white'}`}
              title="Tutup Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto pr-1 mt-4 space-y-4">
          {/* DCA Notice */}
          <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 ${
            isLight ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-purple-950/30 border-purple-500/30 text-purple-200'
          }`}>
            <Info className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-[11px] leading-relaxed">
              <strong>Audit Metodologi:</strong> Setoran berkala DCA (+{formatRupiah(totalDCA)}) dialokasikan sebagai <em>penambahan pokok modal mandiri</em> dan <strong>tidak dimasukkan ke dalam return hasil investasi</strong>.
            </span>
          </div>

          {/* 4 Executive Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Valuasi */}
            <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Total Valuasi Portofolio
              </span>
              <span className={`text-base sm:text-lg font-bold font-mono block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {formatRupiah(totalInvestment)}
              </span>
              <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {safeAssets.length} Posisi Aset
              </span>
            </div>

            {/* Setoran DCA */}
            <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-purple-50/70 border-purple-200' : 'bg-purple-950/20 border-purple-500/20'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isLight ? 'text-purple-800' : 'text-purple-300'}`}>
                Setoran Modal (DCA)
              </span>
              <span className="text-base sm:text-lg font-bold font-mono block text-purple-500">
                +{formatRupiah(totalDCA)}
              </span>
              <span className={`text-[10px] block mt-0.5 font-medium ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>
                Modal Baru (Non-Return)
              </span>
            </div>

            {/* Murni Return MoM */}
            <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Murni Return MoM
              </span>
              {isPendingValuation ? (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-base sm:text-lg font-bold font-mono ${isLight ? 'text-sky-600' : 'text-sky-400'}`}>
                      0.00%
                    </span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      (Rp 0)
                    </span>
                  </div>
                  <span className="text-[10px] block mt-0.5 font-medium text-amber-500">
                    Menunggu Closing
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-base sm:text-lg font-bold font-mono ${pureProfit >= 0 ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : 'text-rose-500'}`}>
                      {pureProfit >= 0 ? `+${purePnl}%` : `${purePnl}%`}
                    </span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      ({pureProfit >= 0 ? `+${formatRupiah(pureProfit)}` : formatRupiah(pureProfit)})
                    </span>
                  </div>
                  <span className={`text-[10px] flex items-center gap-1 mt-0.5 font-semibold ${pureProfit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    <ArrowUpRight className="w-3 h-3" /> {pureProfit >= 0 ? 'Pertumbuhan Organik' : 'Koreksi Pasar'}
                  </span>
                </>
              )}
            </div>

            {/* USD Hedge Ratio */}
            <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Lindung Nilai USD
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-base sm:text-lg font-bold font-mono ${isLight ? 'text-blue-600' : 'text-sky-400'}`}>
                  {usdHedgePct}%
                </span>
                <span className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  ({formatRupiah(usdHedgeValue)})
                </span>
              </div>
              <span className={`text-[10px] flex items-center gap-1 mt-0.5 font-semibold ${isLight ? 'text-blue-700' : 'text-sky-400/90'}`}>
                <ShieldCheck className="w-3 h-3" /> Proteksi Mata Uang
              </span>
            </div>
          </div>

          {/* Allocation & Audit Breakdown */}
          <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/10'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-white'}`}>
                Audit Posisi Broker & Instrumen
              </span>
              <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Target Seimbang 100%
              </span>
            </div>

            <div className="space-y-2.5">
              {dynamicAssetAudits.map((item) => (
                <div
                  key={item.nama}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-white/[0.03] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white/10">{item.meta.icon}</div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.nama}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
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
                      <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.meta.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono justify-between sm:justify-end">
                    <div className="text-right">
                      <span className={`block font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {formatRupiah(item.nilaiAkhirBulan)}
                      </span>
                      {item.depositWd > 0 && (
                        <span className="text-[10px] text-purple-500 block">
                          DCA: +{formatRupiah(item.depositWd)}
                        </span>
                      )}
                    </div>
                    <div className="w-12 text-right">
                      <span className="font-bold text-sky-400">{item.currentPct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Rebalancing Plan */}
          <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
            isLight ? 'bg-purple-50/50 border-purple-200 text-purple-900' : 'bg-purple-950/20 border-purple-500/20 text-purple-200'
          }`}>
            <h4 className="font-bold flex items-center gap-1.5 text-xs">
              <Lightbulb className="w-4 h-4 text-purple-400" />
              Saran Rebalancing Cerdas
            </h4>
            <p className="text-[11px] leading-relaxed opacity-90">
              {overweightAssets.length > 0 ? (
                <>
                  Pos <strong>{overweightAssets.map((a) => a.nama).join(', ')}</strong> berbobot tinggi. Alihkan setoran DCA bulanan berikutnya ke pos yang masih underweight tanpa perlu menjual aset yang ada.
                </>
              ) : (
                <>
                  Seluruh alokasi portofolio berada dalam batas diversifikasi yang ideal dan seimbang. Pertahankan kedisiplinan setoran DCA bulanan.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Modal Preview for PDF Export */}
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
    </div>,
    document.body
  );
};

// Aliases for seamless backwards compatibility
export const AuditInvestasiModal = SmartAnalysisModal;
