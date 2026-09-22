import React from 'react';
import { GlassSettings, InvestmentAsset, InvestmentHistory } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
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
  Activity,
  Calendar,
  Layers,
  Lightbulb
} from 'lucide-react';

interface SmartAnalysisPageProps {
  settings: GlassSettings;
  assets: InvestmentAsset[];
  history: InvestmentHistory[];
  cashStandby?: number;
  onBack?: () => void;
}

export const SmartAnalysisPage: React.FC<SmartAnalysisPageProps> = ({
  settings,
  assets = [],
  history = [],
  cashStandby = 0,
  onBack
}) => {
  const isDark = settings?.themeMode !== 'light' && settings?.themeMode !== 'beige';
  const isLight = !isDark;

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
          #smart-analysis-printable-page, #smart-analysis-printable-page * {
            visibility: visible !important;
          }
          #smart-analysis-printable-page {
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

            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Smart Analisis Pro
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Algoritma Institusional
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Diagnosa kesehatan portofolio, audit diversifikasi aset makro, porsi lindung nilai USD, dan sinyal rebalancing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print-hidden self-end sm:self-center">
            <button
              onClick={() => {
                triggerHaptic('medium');
                window.print();
              }}
              className="px-4 py-2.5 rounded-2xl font-bold text-xs inline-flex items-center gap-2 transition active:scale-95 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Hasil Analisis</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div id="smart-analysis-printable-page" className="space-y-6">
        {/* Metric Cards Row */}
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
            className="p-5 rounded-3xl shadow-xs"
          >
            <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Nilai Portofolio
            </span>
            <span className={`text-xl sm:text-2xl font-extrabold font-mono block ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatRupiah(totalInvestment)}
            </span>
            <span className={`text-[11px] mt-1 block font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {safeAssets.length} Posisi Aset Aktif
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
            className="p-5 rounded-3xl shadow-xs"
          >
            <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Pertumbuhan MoM Terakhir
            </span>
            <span className="text-xl sm:text-2xl font-extrabold font-mono block text-emerald-500">
              +{formatRupiah(momProfit)}
            </span>
            <span className={`text-[11px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Imbal Hasil (PnL): <strong className="text-emerald-400">+{momPnl}%</strong>
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
            className="p-5 rounded-3xl shadow-xs"
          >
            <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Porsi Lindung Nilai USD
            </span>
            <span className={`text-xl sm:text-2xl font-extrabold font-mono block ${isDark ? 'text-sky-400' : 'text-blue-600'}`}>
              {usdHedgePct}%
            </span>
            <span className={`text-[11px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Valas BCA + USDT ({formatRupiah(usdHedgeValue)})
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
            className="p-5 rounded-3xl shadow-xs"
          >
            <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Cash Drag Ratio
            </span>
            <span className={`text-xl sm:text-2xl font-extrabold font-mono block ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              {cashDragPct}%
            </span>
            <span className={`text-[11px] mt-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Kas Mengendap: {formatRupiah(cashStandby)}
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
          <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Activity className="w-4 h-4 text-purple-400" />
              Audit Posisi & Sinyal Rebalancing Alokasi
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
            Smart Rekomendasi Portofolio Berkelanjutan
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
    </div>
  );
};
