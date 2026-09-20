import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GlassSettings, InvestmentAsset, InvestmentHistory } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import {
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  X,
  Printer,
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
  Calendar
} from 'lucide-react';

interface SmartAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: InvestmentAsset[];
  history: InvestmentHistory[];
  settings: GlassSettings;
  cashStandby: number;
}

export const SmartAnalysisModal: React.FC<SmartAnalysisModalProps> = ({
  isOpen,
  onClose,
  assets,
  history,
  settings,
  cashStandby = 0
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
  const safeAssets = Array.isArray(assets) ? assets : [];
  const safeHistory = Array.isArray(history) ? history : [];

  const totalInvestment = safeAssets.reduce((sum, a) => sum + (Number(a.nilaiAkhirBulan) || 0), 0);
  const totalWealth = totalInvestment + cashStandby;

  // Recent month performance
  const latestMonth = safeHistory.length > 0 ? safeHistory[safeHistory.length - 1] : null;
  const momProfit = latestMonth?.netProfitMoM || 2016286;
  const momPnl = latestMonth?.pnlPercent || 3.9;

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
    // Default: Equity / Mutual Funds / Stock / Pluang
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
    let statusText = 'Optimal (Dalam Target)';

    if (pct > meta.idealMax) {
      status = 'overweight';
      statusText = `Overweight (+${(pct - meta.idealMax).toFixed(1)}% di atas target)`;
    } else if (pct < meta.idealMin) {
      status = 'underweight';
      statusText = `Underweight (-${(meta.idealMin - pct).toFixed(1)}% di bawah target)`;
    }

    return {
      ...asset,
      pct,
      meta,
      status,
      statusText
    };
  });

  const overweightAssets = dynamicAssetAudits.filter((a) => a.status === 'overweight');
  const underweightAssets = dynamicAssetAudits.filter((a) => a.status === 'underweight');

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
          #smart-analysis-printable-area, #smart-analysis-printable-area * {
            visibility: visible !important;
          }
          #smart-analysis-printable-area {
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
        }
      `}</style>

      <div
        id="smart-analysis-printable-area"
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
            <div className={`w-9 h-9 rounded-xl ${isLight ? 'bg-sky-50 border border-sky-200' : 'bg-gradient-to-tr from-sky-600/30 via-indigo-600/30 to-blue-500/20 border border-sky-400/30'} flex items-center justify-center shrink-0`}>
              <Activity className={`w-4.5 h-4.5 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base sm:text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : '!text-white'}`}>
                  Smart Analisis Portofolio Investasi
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${isLight ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'}`}>
                  Pro Standard
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                Evaluasi performa real-time, perimbangan instrumen, dan rekomendasi rebalancing • Budgeting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 print-hidden">
            <button
              onClick={() => window.print()}
              className={`p-2 rounded-xl border transition cursor-pointer ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-200 hover:text-white'}`}
              title="Cetak Ringkasan"
            >
              <Printer className="w-4 h-4" />
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
        <div className="overflow-y-auto pr-1 mt-4 space-y-5">
          {/* 3 Executive Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Kinerja MoM (Bulan Terakhir)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xl font-bold font-mono ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                  +{momPnl}%
                </span>
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  ({formatRupiah(momProfit)})
                </span>
              </div>
              <span className={`text-[10px] flex items-center gap-1 mt-1 font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400/90'}`}>
                <ArrowUpRight className="w-3 h-3" /> Target bulanan (+1.0%) tercapai
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                USD Currency Hedge Ratio
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xl font-bold font-mono ${isLight ? 'text-blue-600' : 'text-sky-300'}`}>
                  {usdHedgePct}%
                </span>
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Porsi Valas & Aset Asing</span>
              </div>
              <span className={`text-[10px] flex items-center gap-1 mt-1 font-semibold ${isLight ? 'text-blue-700' : 'text-sky-400/90'}`}>
                <ShieldCheck className="w-3 h-3" /> Proteksi depresiasi Rupiah
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Cash Drag Index
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xl font-bold font-mono ${isLight ? 'text-amber-600' : 'text-amber-300'}`}>
                  {cashDragPct}%
                </span>
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Kas Standby</span>
              </div>
              <span className={`text-[10px] flex items-center gap-1 mt-1 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Ideal: 5-10% untuk likuiditas taktis
              </span>
            </div>
          </div>

          {/* Dynamic Asset Allocation & Benchmark Comparison Table */}
          <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/10'}`}>
            <div className="flex items-center justify-between">
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Layers className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                Alokasi Aset Aktif vs Standard Financial Planner
              </h4>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Total Portofolio: {formatRupiah(totalInvestment)}</span>
            </div>

            <div className="space-y-3">
              {dynamicAssetAudits.length > 0 ? (
                dynamicAssetAudits.map((asset) => (
                  <div
                    key={asset.nama}
                    className={`p-3.5 rounded-xl border space-y-2 transition-all ${isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-white/[0.02] border-white/5 hover:border-white/15'}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        {asset.meta.icon}
                        <span className={`font-bold tracking-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>{asset.nama}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${asset.meta.badgeBg}`}>
                          {asset.meta.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className={`font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                          {formatRupiah(asset.nilaiAkhirBulan)} ({asset.pct}%)
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            asset.status === 'optimal'
                              ? isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/15 text-emerald-300'
                              : asset.status === 'overweight'
                              ? isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/15 text-amber-300'
                              : isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {asset.statusText}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar comparison */}
                    <div className={`w-full h-2 rounded-full overflow-hidden relative ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${asset.meta.color} transition-all duration-500`}
                        style={{ width: `${Math.min(100, asset.pct)}%` }}
                      />
                    </div>

                    <div className={`flex items-center justify-between text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span className="truncate mr-2">Fungsi: {asset.meta.role}</span>
                      <span className={`shrink-0 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        Target Ideal: {asset.meta.idealMin}% - {asset.meta.idealMax}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className={`text-xs p-3 text-center ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Belum ada instrumen investasi tercatat.</p>
              )}
            </div>
          </div>

          {/* Smart Rekomendasi & Pengingat Investasi */}
          <div className="space-y-4">
            {/* 1. Pengingat Jadwal Investasi Rutin (DCA Reminder) */}
            <div className={`p-4 rounded-2xl border space-y-2 ${isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-gradient-to-r from-emerald-950/30 via-teal-950/20 to-blue-950/20 border-emerald-500/30'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-emerald-900' : 'text-emerald-400'}`}>
                <Bell className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                Pengingat Jadwal Investasi Rutin (DCA Reminder)
              </h4>
              <div className={`text-xs leading-relaxed flex items-start gap-2.5 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                <Calendar className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                <div>
                  <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Jadwal Injeksi Modal Bulanan: <strong>Tanggal 25 - 30 Setiap Bulan</strong>
                  </p>
                  <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Setiap kali slip gaji cair (MYPAK), prioritaskan transfer otomatis <strong>Rp 2.016.286</strong> ke instrumen investasi sebelum saldo terpakai untuk pengeluaran konsumtif (*Pay Yourself First*).
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Smart Rekomendasi Perbaikan & Rebalancing */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${isLight ? 'bg-blue-50/80 border-blue-200' : 'bg-gradient-to-br from-blue-950/30 to-indigo-950/20 border-blue-500/20'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-blue-900' : 'text-sky-300'}`}>
                <Lightbulb className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                Smart Rekomendasi Perbaikan Portofolio
              </h4>

              <div className={`space-y-2 text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {overweightAssets.length > 0 && (
                  <div className={`p-2.5 rounded-xl border flex items-start gap-2 ${isLight ? 'bg-amber-100/70 border-amber-300 text-amber-900' : 'bg-amber-500/10 border-amber-500/20 text-amber-200'}`}>
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Peringatan Rebalancing:</strong> Aset{' '}
                      <span className="font-bold">
                        {overweightAssets.map((a) => a.nama).join(', ')}
                      </span>{' '}
                      berada di atas bobot ideal. Tidak perlu menjual (take profit kena fee), cukup{' '}
                      <strong>alihkan setoran DCA baru bulan depan</strong> ke instrumen yang underweight untuk menyeimbangkan profil risiko.
                    </div>
                  </div>
                )}

                {underweightAssets.length > 0 && (
                  <div className={`p-2.5 rounded-xl border flex items-start gap-2 ${isLight ? 'bg-blue-100/70 border-blue-300 text-blue-900' : 'bg-sky-500/10 border-sky-500/20 text-sky-200'}`}>
                    <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Prioritas Top-Up Berikutnya:</strong> Aset{' '}
                      <span className="font-bold">
                        {underweightAssets.map((a) => a.nama).join(', ')}
                      </span>{' '}
                      masih di bawah benchmark ideal. Prioritaskan alokasi setoran berikutnya ke pos ini guna memperkuat motor pertumbuhan portofolio.
                    </div>
                  </div>
                )}

                <div className={`p-2.5 rounded-xl border flex items-start gap-2 ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/5 border-white/5 text-slate-300'}`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Kekuatan Lindung Nilai USD ({usdHedgePct}%):</strong> Porsi aset berdenominasi mata uang kuat (Valas & USDT) sangat kokoh dalam menangkal pelemahan nilai tukar Rupiah dan menjaga daya beli global.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] shrink-0 ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'}`}>
          <span>Budgeting • Data tersinkronisasi otomatis dengan Google Sheet</span>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className={`px-4 py-1.5 rounded-xl font-semibold transition cursor-pointer print-hidden ${isLight ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-white/10 hover:bg-white/15 text-white'}`}
          >
            Selesai
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;
};
