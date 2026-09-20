import React, { useState, useMemo, useEffect } from 'react';
import { GlassSettings } from '../types';
import { triggerHaptic } from '../lib/haptics';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Coins,
  Clock,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Flame,
  PieChart,
  HelpCircle,
  RotateCcw,
  DollarSign,
  ArrowLeft,
  ChevronRight,
  Sliders,
  Wallet,
  Building2,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';

interface RetirementInvestmentCalculatorProps {
  settings: GlassSettings;
  currentNetWorth?: number;
  currentInvestment?: number;
  onBack?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

// Utility formatting
const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Math.round(val));
};

const formatCommas = (val: number | string): string => {
  if (val === '' || val === null || val === undefined) return '';
  const num = typeof val === 'number' ? val : Number(String(val).replace(/,/g, ''));
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-US').format(Math.round(num));
};

const parseCommas = (str: string): number => {
  const clean = str.replace(/[^0-9]/g, '');
  return clean === '' ? 0 : Number(clean);
};

export const RetirementInvestmentCalculator: React.FC<RetirementInvestmentCalculatorProps> = ({
  settings,
  currentNetWorth = 0,
  currentInvestment = 0,
  onBack,
  isOpen,
  onClose
}) => {
  // If isOpen is explicitly passed as false (legacy modal usage), don't render
  if (isOpen === false) return null;

  // Dark vs Light Mode
  // User directive:
  // - "color palette pada dark mode khusus kalkulator investasi sudah bagus jangan dirubah"
  // - "color palette pada light mode khusus kalkulator investasi berbentrokan dan sulit dilihat. perbaiki kobinasi warnanya agar mudah dibaca, dan ditandai user apabaila minus atau kuranga, maka angka jadi merah jika surplus maka angka jadi hijau. text biasa warnanya hitam"
  const isDark = settings?.themeMode !== 'light' && settings?.themeMode !== 'beige';

  // Active view tab for the results side: 'overview' | 'timeline' | 'insights'
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'insights'>('overview');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // --- CORE PARAMETERS (Mathematical Model) ---
  // Step 1: Pengeluaran Saat Ini
  const [monthlyExpense, setMonthlyExpense] = useState<number>(4000000);

  // Step 2: Horizon Usia & Inflasi
  const [currentAge, setCurrentAge] = useState<number>(25);
  const [retirementAge, setRetirementAge] = useState<number>(60);
  const [inflationRate, setInflationRate] = useState<number>(4);

  // Step 3: Investasi & Portofolio
  const [initialFund, setInitialFund] = useState<number>(50000000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(2000000);
  const [expectedReturnRate, setExpectedReturnRate] = useState<number>(8);

  // Click outside tooltip dismisser
  useEffect(() => {
    const handleGlobalClick = () => {
      if (activeTooltip) setActiveTooltip(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [activeTooltip]);

  // Quick Preset Handlers
  const applyPreset = (type: 'fire' | 'standard' | 'relaxed') => {
    triggerHaptic('medium');
    if (type === 'fire') {
      // Early retirement FIRE at 45
      setCurrentAge(25);
      setRetirementAge(45);
      setMonthlyContribution(4000000);
      setExpectedReturnRate(10);
      setMonthlyExpense(5000000);
    } else if (type === 'standard') {
      // Standard retirement at 55
      setCurrentAge(26);
      setRetirementAge(55);
      setMonthlyContribution(2500000);
      setExpectedReturnRate(8);
      setMonthlyExpense(4500000);
    } else {
      // Relaxed retirement at 60
      setCurrentAge(28);
      setRetirementAge(60);
      setMonthlyContribution(2000000);
      setExpectedReturnRate(7);
      setMonthlyExpense(4000000);
    }
  };

  // Sync with real app portfolio asset
  const handleSyncRealPortfolio = () => {
    triggerHaptic('success');
    if (currentInvestment > 0) {
      setInitialFund(currentInvestment);
    } else if (currentNetWorth > 0) {
      setInitialFund(currentNetWorth);
    }
  };

  // Reset to default
  const handleReset = () => {
    triggerHaptic('light');
    setMonthlyExpense(4000000);
    setCurrentAge(25);
    setRetirementAge(60);
    setInflationRate(4);
    setInitialFund(50000000);
    setMonthlyContribution(2000000);
    setExpectedReturnRate(8);
  };

  // --- MATHEMATICAL FORMULAS (4% Rule, Inflation & Annuity Compounding) ---
  const calculations = useMemo(() => {
    const yearsToRetire = Math.max(1, retirementAge - currentAge);
    const monthsToRetire = yearsToRetire * 12;

    // 1. Inflasi tahunan ke pengeluaran bulanan saat pensiun nanti:
    // Future Monthly Expense = Monthly Expense * (1 + inflation/100)^years
    const futureMonthlyExpense = monthlyExpense * Math.pow(1 + inflationRate / 100, yearsToRetire);
    const futureAnnualExpense = futureMonthlyExpense * 12;

    // 2. Kebutuhan Dana Pensiun berdasarkan Aturan 4% (The 4% Rule / Trinity Study):
    // Target = Pengeluaran Tahunan Saat Pensiun * 25 (atau dibagi 0.04)
    const retirementFundNeeded = futureAnnualExpense * 25;

    // 3. Proyeksi Akumulasi Investasi dengan Bunga Majemuk (Compound Interest):
    // Menggunakan Annuity Due (investasi disetor awal bulan)
    const monthlyRate = expectedReturnRate / 100 / 12;

    // Pertumbuhan modal awal (Lump-sum compounding)
    const futureInitialFund = initialFund * Math.pow(1 + monthlyRate, monthsToRetire);

    // Pertumbuhan setoran bulanan rutin (Annuity Due compounding)
    let futureContributions = 0;
    if (monthlyRate > 0) {
      futureContributions =
        monthlyContribution *
        ((Math.pow(1 + monthlyRate, monthsToRetire) - 1) / monthlyRate) *
        (1 + monthlyRate);
    } else {
      futureContributions = monthlyContribution * monthsToRetire;
    }

    const totalAccumulated = futureInitialFund + futureContributions;
    const totalPrincipal = initialFund + monthlyContribution * monthsToRetire;
    const totalInterest = Math.max(0, totalAccumulated - totalPrincipal);

    const principalPct = totalAccumulated > 0 ? Math.round((totalPrincipal / totalAccumulated) * 100) : 0;
    const interestPct = totalAccumulated > 0 ? Math.max(0, 100 - principalPct) : 0;

    // 4. Selisih dan Rasio Pencapaian Target
    const difference = totalAccumulated - retirementFundNeeded;
    const isTargetAchieved = difference >= 0;
    const coverageRatio =
      retirementFundNeeded > 0
        ? Math.min(999, Math.round((totalAccumulated / retirementFundNeeded) * 100))
        : 100;

    // Rekomendasi tambahan setoran bulanan jika target belum tercapai (Defisit)
    let additionalMonthlyNeeded = 0;
    if (!isTargetAchieved && difference < 0) {
      const deficit = Math.abs(difference);
      if (monthlyRate > 0) {
        additionalMonthlyNeeded =
          deficit /
          (((Math.pow(1 + monthlyRate, monthsToRetire) - 1) / monthlyRate) * (1 + monthlyRate));
      } else {
        additionalMonthlyNeeded = deficit / monthsToRetire;
      }
    }

    // Safe Monthly Withdrawal Rate (4% per tahun / 12 bulan dari total hasil akumulasi)
    const safeMonthlyWithdrawalAtRetirement = (totalAccumulated * 0.04) / 12;

    return {
      yearsToRetire,
      monthsToRetire,
      monthlyExpenseAtRetirement: futureMonthlyExpense,
      annualExpenseAtRetirement: futureAnnualExpense,
      retirementFundNeeded,
      totalAccumulated,
      totalPrincipal,
      totalInterest,
      principalPct,
      interestPct,
      difference,
      isTargetAchieved,
      coverageRatio,
      additionalMonthlyNeeded,
      safeMonthlyWithdrawalAtRetirement
    };
  }, [
    monthlyExpense,
    currentAge,
    retirementAge,
    inflationRate,
    initialFund,
    monthlyContribution,
    expectedReturnRate
  ]);

  // Timeline Projection Milestones (per 5 years or key intervals)
  const timelineMilestones = useMemo(() => {
    const points: Array<{
      year: number;
      age: number;
      total: number;
      pokok: number;
      bunga: number;
      pctOfTarget: number;
    }> = [];

    const years = calculations.yearsToRetire;
    const monthlyRate = expectedReturnRate / 100 / 12;

    // Select suitable intervals (1, 3, 5, 10, 15, ..., final)
    const step = years <= 10 ? 2 : years <= 20 ? 5 : 5;

    for (let y = 1; y <= years; y++) {
      if (y === 1 || y % step === 0 || y === years) {
        const m = y * 12;
        const lump = initialFund * Math.pow(1 + monthlyRate, m);
        let cont = 0;
        if (monthlyRate > 0) {
          cont =
            monthlyContribution *
            ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) *
            (1 + monthlyRate);
        } else {
          cont = monthlyContribution * m;
        }
        const tot = lump + cont;
        const pok = initialFund + monthlyContribution * m;
        const bng = Math.max(0, tot - pok);
        const pct =
          calculations.retirementFundNeeded > 0
            ? Math.round((tot / calculations.retirementFundNeeded) * 100)
            : 0;

        points.push({
          year: y,
          age: currentAge + y,
          total: tot,
          pokok: pok,
          bunga: bng,
          pctOfTarget: pct
        });
      }
    }
    return points;
  }, [
    calculations.yearsToRetire,
    calculations.retirementFundNeeded,
    initialFund,
    monthlyContribution,
    expectedReturnRate,
    currentAge
  ]);

  // Handle Clipboard Copy
  const handleCopySummary = () => {
    const text = `🎯 STRATEGI DANA PENSIUN & INVESTASI (ATURAN 4%)
--------------------------------------------------
Usia: ${currentAge} tahun -> Target Pensiun: ${retirementAge} tahun (Sisa ${calculations.yearsToRetire} tahun)
Pengeluaran Sekarang: ${formatRupiah(monthlyExpense)}/bulan
Asumsi Inflasi: ${inflationRate}%/tahun
Pengeluaran Saat Pensiun: ${formatRupiah(calculations.monthlyExpenseAtRetirement)}/bulan

💰 KEBUTUHAN DANA PENSIUN (4% RULE):
Target Modal Pokok: ${formatRupiah(calculations.retirementFundNeeded)}

📈 PROYEKSI AKUMULASI INVESTASI:
Modal Awal: ${formatRupiah(initialFund)}
Setoran Rutin: ${formatRupiah(monthlyContribution)}/bulan (${expectedReturnRate}% return/thn)
Hasil Akumulasi: ${formatRupiah(calculations.totalAccumulated)}
- Modal Disetor: ${formatRupiah(calculations.totalPrincipal)} (${calculations.principalPct}%)
- Bunga Majemuk: ${formatRupiah(calculations.totalInterest)} (${calculations.interestPct}%)

📊 KESIMPULAN STATUS:
${calculations.isTargetAchieved ? '✅ SURPLUS (Target Tercapai)' : '⚠️ KURANG / DEFISIT'}
Selisih: ${calculations.isTargetAchieved ? '+' : '-'}${formatRupiah(Math.abs(calculations.difference))}
Cakupan Target: ${calculations.coverageRatio}%
Tarik Pasif Bulanan Aman: ${formatRupiah(calculations.safeMonthlyWithdrawalAtRetirement)}/bulan
--------------------------------------------------
Dihitung via Kelvin Financial Liquid Engine`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      triggerHaptic('success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Download Plain Text Plan
  const handleDownload = () => {
    const text = `LAPORAN STRATEGI DANA PENSIUN & SIMULASI INVESTASI
Dibuat pada: ${new Date().toLocaleDateString('id-ID')}
Target Usia Pensiun: ${retirementAge} Tahun (Horizon ${calculations.yearsToRetire} Tahun)
==================================================

1. PARAMETER BIAYA & INFLASI:
- Pengeluaran Saat Ini: ${formatRupiah(monthlyExpense)} / bulan (${formatRupiah(monthlyExpense * 12)} / tahun)
- Tingkat Inflasi: ${inflationRate}% / tahun
- Estimasi Pengeluaran Bulanan Saat Pensiun: ${formatRupiah(calculations.monthlyExpenseAtRetirement)} / bulan
- Estimasi Pengeluaran Tahunan Saat Pensiun: ${formatRupiah(calculations.annualExpenseAtRetirement)} / tahun

2. TARGET KEBUTUHAN DANA PENSIUN (THE 4% RULE):
- Formula: Pengeluaran Tahunan Pensiun x 25
- KEBUTUHAN TOTAL DANA PENSIUN: ${formatRupiah(calculations.retirementFundNeeded)}

3. STRATEGI & PROYEKSI AKUMULASI INVESTASI:
- Modal Investasi Awal: ${formatRupiah(initialFund)}
- Rencana Investasi Bulanan: ${formatRupiah(monthlyContribution)} / bulan
- Target Imbal Hasil (Return): ${expectedReturnRate}% / tahun
- TOTAL HASIL INVESTASI SAAT PENSIUN: ${formatRupiah(calculations.totalAccumulated)}
- Komposisi Modal Pokok Disetor: ${formatRupiah(calculations.totalPrincipal)} (${calculations.principalPct}%)
- Komposisi Bunga Majemuk (Compounding Gain): ${formatRupiah(calculations.totalInterest)} (${calculations.interestPct}%)

4. KESIMPULAN STRATEGIS:
Status: ${calculations.isTargetAchieved ? 'LAYAK & MENCAPAI TARGET (SURPLUS)' : 'PERLU OPTIMALISASI (DEFISIT)'}
Selisih: ${calculations.isTargetAchieved ? '+' : '-'}${formatRupiah(Math.abs(calculations.difference))}
Cakupan Portofolio: ${calculations.coverageRatio}%
Potensi Penarikan Bulanan Aman: ${formatRupiah(calculations.safeMonthlyWithdrawalAtRetirement)}/bulan
`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Strategi-Pensiun-${retirementAge}Thn.txt`;
    a.click();
    URL.revokeObjectURL(url);
    triggerHaptic('success');
  };

  // Clockwise rotating border highlight gradient: (grey -> light grey -> grey) in ALL themes, matching summary in total asset
  const beamGradient = isDark
    ? 'conic-gradient(from 0deg, transparent 0deg, transparent 250deg, rgba(148, 163, 184, 0) 255deg, rgba(148, 163, 184, 0.40) 280deg, rgba(203, 213, 225, 0.85) 310deg, rgba(241, 245, 249, 0.98) 325deg, #f8fafc 330deg, rgba(241, 245, 249, 0.98) 335deg, rgba(203, 213, 225, 0.85) 345deg, rgba(148, 163, 184, 0.40) 355deg, rgba(148, 163, 184, 0) 360deg)'
    : 'conic-gradient(from 0deg, transparent 0deg, transparent 250deg, rgba(100, 116, 139, 0) 255deg, rgba(100, 116, 139, 0.40) 280deg, rgba(148, 163, 184, 0.80) 310deg, rgba(203, 213, 225, 0.98) 325deg, #cbd5e1 330deg, rgba(203, 213, 225, 0.98) 335deg, rgba(148, 163, 184, 0.80) 345deg, rgba(100, 116, 139, 0.40) 355deg, rgba(100, 116, 139, 0) 360deg)';

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* ================= TOP PAGE HEADER & NAVIGATION BAR ================= */}
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Back button & Title */}
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
                title="Kembali ke Portofolio / Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(251, 191, 36, 0.15) 100%)',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                boxShadow: '0 8px 18px -4px rgba(245, 158, 11, 0.25)'
              }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-amber-500 shrink-0"
            >
              <Flame className="w-6 h-6 text-amber-500 fill-amber-500/20" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className={`text-xl sm:text-2xl font-black tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Kalkulator Investasi & Dana Pensiun
                </h1>
                <span
                  style={{
                    background: isDark
                      ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.18) 0%, rgba(251, 191, 36, 0.12) 100%)'
                      : 'rgba(254, 243, 199, 0.95)',
                    border: isDark ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #fde68a'
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? 'text-amber-400' : 'text-amber-900'
                  }`}
                >
                  4% RULE • LIQUID ENGINE
                </span>
              </div>
              <p
                className={`text-xs sm:text-sm mt-0.5 ${
                  isDark ? 'text-slate-300' : 'text-slate-700 font-medium'
                }`}
              >
                Simulasi matematis independensi finansial (FIRE) berbasis Aturan 4% & Bunga Majemuk
              </p>
            </div>
          </div>

          {/* Right: Quick Action Presets & Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[11px] font-semibold hidden lg:inline ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              Preset:
            </span>
            <button
              onClick={() => applyPreset('fire')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 ${
                retirementAge === 45
                  ? 'bg-amber-500 text-white border-amber-400 shadow'
                  : isDark
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300 shadow-sm'
              }`}
              title="FIRE: Pensiun Dini di usia 45 tahun"
            >
              FIRE 45
            </button>
            <button
              onClick={() => applyPreset('standard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 ${
                retirementAge === 55
                  ? 'bg-amber-500 text-white border-amber-400 shadow'
                  : isDark
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300 shadow-sm'
              }`}
              title="Standar: Pensiun nyaman di usia 55 tahun"
            >
              Standar 55
            </button>
            <button
              onClick={() => applyPreset('relaxed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 ${
                retirementAge === 60
                  ? 'bg-amber-500 text-white border-amber-400 shadow'
                  : isDark
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300 shadow-sm'
              }`}
              title="Santai: Pensiun di usia 60 tahun"
            >
              Santai 60
            </button>
            <button
              onClick={handleReset}
              className={`p-2 rounded-xl border transition active:scale-95 ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-900 shadow-sm'
              }`}
              title="Reset ke Nilai Standar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MAIN 2-COLUMN STUDIO LAYOUT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0">
        {/* ================= LEFT COLUMN: INPUT PARAMETERS (5 COLS) ================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between px-1">
            <h3
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-amber-400' : 'text-amber-800'
              }`}
            >
              Parameter Finansial & Target
            </h3>
            {currentInvestment > 0 && (
              <button
                onClick={handleSyncRealPortfolio}
                className={`text-[11px] font-bold flex items-center gap-1 transition ${
                  isDark ? 'text-sky-300 hover:text-sky-200' : 'text-blue-700 hover:text-blue-900'
                }`}
                title="Terapkan total portofolio aset riil kamu ke modal awal"
              >
                <RefreshCw className="w-3 h-3" />
                Gunakan Portofolio ({formatRupiah(currentInvestment)})
              </button>
            )}
          </div>

          {/* CARD 1: Pengeluaran Bulanan & Inflasi */}
          <div
            style={
              isDark
                ? {
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.015) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.4)'
                  }
                : {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(226, 232, 240, 0.95)',
                    boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.06)'
                  }
            }
            className="p-4 sm:p-5 rounded-3xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <label
                className={`text-xs font-bold flex items-center gap-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-900'
                }`}
              >
                <Coins className="w-4 h-4 text-amber-500" />
                Pengeluaran Bulanan Saat Ini
              </label>
              <span
                className={`text-[11px] font-bold ${
                  isDark ? 'text-amber-400' : 'text-amber-700'
                }`}
              >
                {formatRupiah(monthlyExpense * 12)} / thn
              </span>
            </div>

            {/* Input field with Rupiah prefix */}
            <div
              className={`flex items-center rounded-2xl border px-3.5 py-2.5 transition ${
                isDark
                  ? 'bg-black/40 border-white/15 focus-within:border-amber-400/80 focus-within:ring-2 focus-within:ring-amber-400/20'
                  : 'bg-white border-slate-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 shadow-sm'
              }`}
            >
              <span
                className={`text-sm font-bold mr-2 select-none ${
                  isDark ? 'text-slate-400' : 'text-slate-900'
                }`}
              >
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={formatCommas(monthlyExpense)}
                onChange={(e) => setMonthlyExpense(parseCommas(e.target.value))}
                className={`w-full bg-transparent font-black text-lg outline-none ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
                placeholder="4,000,000"
              />
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {[3000000, 5000000, 7500000, 10000000, 15000000].map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    triggerHaptic('light');
                    setMonthlyExpense(val);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] transition ${
                    monthlyExpense === val
                      ? 'bg-amber-500 text-white font-bold shadow-sm'
                      : isDark
                      ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 font-semibold'
                  }`}
                >
                  {val >= 10000000 ? `${val / 1000000} Jt` : `${val / 1000000} Jt`}
                </button>
              ))}
            </div>

            {/* Inflasi Tahunan */}
            <div
              className={`pt-3 border-t space-y-2 ${
                isDark ? 'border-white/10' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                  Asumsi Inflasi Tahunan
                </span>
                <span className="font-bold text-rose-600">{inflationRate}% / tahun</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={inflationRate}
                onChange={(e) => setInflationRate(Number(e.target.value))}
                className={`w-full accent-amber-500 h-2 rounded-lg cursor-pointer ${
                  isDark ? 'bg-slate-700' : 'bg-slate-200'
                }`}
              />
              <div
                className={`flex justify-between text-[10px] font-semibold ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                <span>Rendah (2%)</span>
                <span>Historis RI (~4%)</span>
                <span>Tinggi (8%)</span>
              </div>
            </div>
          </div>

          {/* CARD 2: Horizon Usia & Waktu */}
          <div
            style={
              isDark
                ? {
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.015) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.4)'
                  }
                : {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(226, 232, 240, 0.95)',
                    boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.06)'
                  }
            }
            className="p-4 sm:p-5 rounded-3xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <label
                className={`text-xs font-bold flex items-center gap-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-900'
                }`}
              >
                <Clock className="w-4 h-4 text-sky-500" />
                Horizon Waktu & Usia
              </label>
              <span
                style={{
                  background: isDark
                    ? 'linear-gradient(90deg, rgba(14, 165, 233, 0.15) 0%, rgba(56, 189, 248, 0.15) 100%)'
                    : 'rgba(224, 242, 254, 0.95)',
                  border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #bae6fd'
                }}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                  isDark ? 'text-sky-300' : 'text-sky-800'
                }`}
              >
                Sisa {calculations.yearsToRetire} Tahun ({calculations.monthsToRetire} Bulan)
              </span >
            </div>

            {/* Dual Sliders: Usia Sekarang & Usia Pensiun */}
            <div className="grid grid-cols-2 gap-3">
              {/* Usia Sekarang */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span
                  className={`text-[11px] block mb-1 font-semibold ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Usiamu Sekarang
                </span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min="15"
                    max="80"
                    value={currentAge}
                    onChange={(e) => setCurrentAge(Math.max(1, Number(e.target.value)))}
                    className={`w-14 bg-transparent font-black text-xl outline-none ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    tahun
                  </span>
                </div>
                <input
                  type="range"
                  min="17"
                  max="70"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                  className={`w-full accent-sky-500 h-2 rounded-lg mt-2.5 cursor-pointer ${
                    isDark ? 'bg-slate-700' : 'bg-slate-200'
                  }`}
                />
              </div>

              {/* Usia Pensiun */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span
                  className={`text-[11px] block mb-1 font-semibold ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Target Pensiun
                </span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min={currentAge + 1}
                    max="90"
                    value={retirementAge}
                    onChange={(e) =>
                      setRetirementAge(Math.max(currentAge + 1, Number(e.target.value)))
                    }
                    className={`w-14 bg-transparent font-black text-xl outline-none ${
                      isDark ? 'text-amber-400' : 'text-amber-600'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    tahun
                  </span>
                </div>
                <input
                  type="range"
                  min={currentAge + 1}
                  max="80"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(Number(e.target.value))}
                  className={`w-full accent-amber-500 h-2 rounded-lg mt-2.5 cursor-pointer ${
                    isDark ? 'bg-slate-700' : 'bg-slate-200'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* CARD 3: Modal Awal & Rencana Investasi Rutin */}
          <div
            style={
              isDark
                ? {
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.015) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.4)'
                  }
                : {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(226, 232, 240, 0.95)',
                    boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.06)'
                  }
            }
            className="p-4 sm:p-5 rounded-3xl space-y-4"
          >
            {/* Modal Investasi Awal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className={`text-xs font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-900'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  Investasi / Tabungan Awal Saat Ini
                </label>
              </div>

              <div
                className={`flex items-center rounded-2xl border px-3.5 py-2.5 transition ${
                  isDark
                    ? 'bg-black/40 border-white/15 focus-within:border-emerald-400/80 focus-within:ring-2 focus-within:ring-emerald-400/20'
                    : 'bg-white border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-sm'
                }`}
              >
                <span
                  className={`text-sm font-bold mr-2 select-none ${
                    isDark ? 'text-slate-400' : 'text-slate-900'
                  }`}
                >
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatCommas(initialFund)}
                  onChange={(e) => setInitialFund(parseCommas(e.target.value))}
                  className={`w-full bg-transparent font-black text-lg outline-none ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                  placeholder="50,000,000"
                />
              </div>

              {/* Chips Modal Awal */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[0, 25000000, 50000000, 100000000, 250000000].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      triggerHaptic('light');
                      setInitialFund(val);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] transition ${
                      initialFund === val
                        ? 'bg-emerald-500 text-white font-bold'
                        : isDark
                        ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 font-semibold'
                    }`}
                  >
                    {val === 0 ? 'Mulai Rp0' : `${val / 1000000} Jt`}
                  </button>
                ))}
              </div>
            </div>

            {/* Setoran Investasi Rutin Bulanan */}
            <div
              className={`pt-3 border-t space-y-2 ${
                isDark ? 'border-white/10' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <label
                  className={`text-xs font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-900'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-indigo-500" />
                  Rencana Nabung Rutin per Bulan
                </label>
                <span
                  className={`text-[11px] font-bold ${
                    isDark ? 'text-indigo-300' : 'text-indigo-700'
                  }`}
                >
                  {formatRupiah(monthlyContribution * 12)} / thn
                </span>
              </div>

              <div
                className={`flex items-center rounded-2xl border px-3.5 py-2.5 transition ${
                  isDark
                    ? 'bg-black/40 border-white/15 focus-within:border-indigo-400/80 focus-within:ring-2 focus-within:ring-indigo-400/20'
                    : 'bg-white border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-sm'
                }`}
              >
                <span
                  className={`text-sm font-bold mr-2 select-none ${
                    isDark ? 'text-slate-400' : 'text-slate-900'
                  }`}
                >
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatCommas(monthlyContribution)}
                  onChange={(e) => setMonthlyContribution(parseCommas(e.target.value))}
                  className={`w-full bg-transparent font-black text-lg outline-none ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                  placeholder="2,000,000"
                />
              </div>

              {/* Chips Setoran */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[1000000, 2000000, 3000000, 5000000, 10000000].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      triggerHaptic('light');
                      setMonthlyContribution(val);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] transition ${
                      monthlyContribution === val
                        ? 'bg-indigo-500 text-white font-bold'
                        : isDark
                        ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 font-semibold'
                    }`}
                  >
                    +{val / 1000000} Jt
                  </button>
                ))}
              </div>
            </div>

            {/* Return Ekspektasi Tahunan */}
            <div
              className={`pt-3 border-t space-y-2 ${
                isDark ? 'border-white/10' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-slate-200' : 'text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  Target Imbal Hasil (Return Portofolio)
                </span>
                <span className="font-black text-emerald-600 text-sm">
                  {expectedReturnRate}% / tahun
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="18"
                step="0.5"
                value={expectedReturnRate}
                onChange={(e) => setExpectedReturnRate(Number(e.target.value))}
                className={`w-full accent-emerald-500 h-2 rounded-lg cursor-pointer ${
                  isDark ? 'bg-slate-700' : 'bg-slate-200'
                }`}
              />

              {/* Benchmark labels */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[
                  { label: 'SBN / Depo (~6%)', rate: 6 },
                  { label: 'Reksadana (~8%)', rate: 8 },
                  { label: 'Saham / IHSG (~12%)', rate: 12 }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      triggerHaptic('light');
                      setExpectedReturnRate(item.rate);
                    }}
                    className={`py-1 px-1.5 rounded-lg text-[10px] text-center transition ${
                      expectedReturnRate === item.rate
                        ? 'bg-emerald-500 text-white font-bold shadow-sm'
                        : isDark
                        ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 font-semibold'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: PROJECTION STUDIO & WEALTH ENGINE (7 COLS) ================= */}
        <div className="lg:col-span-7 space-y-4 min-w-0">
          {/* Panel Section Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div
              className={`flex items-center gap-1 p-1 rounded-2xl border ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200 shadow-inner'
              }`}
            >
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab('overview');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'overview'
                    ? 'bg-amber-500 text-white shadow-md'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                Ringkasan
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab('timeline');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'timeline'
                    ? 'bg-amber-500 text-white shadow-md'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Timeline Proyeksi
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab('insights');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'insights'
                    ? 'bg-amber-500 text-white shadow-md'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Tips & AI Insights
              </button>
            </div>

            {/* Status Pill Badge: Green for Surplus, Red for Deficit */}
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 border shadow-sm ${
                calculations.isTargetAchieved
                  ? isDark
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : isDark
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}
            >
              {calculations.isTargetAchieved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Cakupan {calculations.coverageRatio}% (Surplus)
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Cakupan {calculations.coverageRatio}% (Kurang / Defisit)
                </>
              )}
            </span>
          </div>

          {/* ================= HERO CONTAINER: KEBUTUHAN DANA PENSIUN (ATURAN 4%) ================= */}
          {/* User directive:
              "buatkan efek gerak searah jarum jam juga persis pada bagian summarty di total aset,
               terapkan pada container kebutuhan dana pension (Aturan 4%) di dalam page kalkulator investasi.
               kombinasi warnanya sama seeperti bagian summarty di total aset"
          */}
          <div
            style={
              isDark
                ? {
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    backgroundImage: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(15, 23, 42, 0.7) 100%)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(251, 191, 36, 0.25)'
                  }
                : {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.92) 100%)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(226, 232, 240, 0.95)',
                    boxShadow: '0 12px 30px -10px rgba(15, 23, 42, 0.08), 0 4px 12px -3px rgba(15, 23, 42, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.95)'
                  }
            }
            className="p-5 sm:p-7 rounded-3xl relative overflow-hidden"
          >
            {/* 0. Clockwise Moving Border Stroke Highlight (Exact same as summary card in total assets) */}
            <div
              className="absolute inset-0 rounded-[inherit] pointer-events-none z-[5] overflow-hidden"
              style={{
                boxSizing: 'border-box',
                padding: '1.5px',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude'
              }}
            >
              <div
                className="absolute left-1/2 top-1/2 animate-border-beam-clockwise pointer-events-none"
                style={{
                  width: '350%',
                  aspectRatio: '1 / 1',
                  background: beamGradient
                }}
              />
            </div>

            {/* 1. Diagonal Sheen Reflection */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.015) 35%, transparent 65%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.50) 0%, rgba(255, 255, 255, 0.08) 35%, transparent 65%)'
              }}
            />

            {/* 2. Top Specular Rim Highlight Bar */}
            <div
              className="absolute top-0 inset-x-5 h-[1px] pointer-events-none"
              style={{
                background: isDark
                  ? 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 100%)'
                  : 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.95) 50%, transparent 100%)'
              }}
            />

            {/* 3. Atmospheric Soft Amber Corner Glow */}
            <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full pointer-events-none blur-3xl bg-amber-500/15" />

            {/* Card Content */}
            <div className="relative z-10 space-y-4">
              {/* Top Header Row of Hero Card */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-amber-400' : 'text-amber-700'
                    }`}
                  >
                    Kebutuhan Dana Pensiun (Aturan 4%)
                  </span>
                </div>
                <span
                  className={`text-xs font-bold ${
                    isDark ? 'text-slate-300' : 'text-slate-800'
                  }`}
                >
                  Pengeluaran Pensiun: <strong>{formatRupiah(calculations.annualExpenseAtRetirement)}/thn</strong>
                </span>
              </div>

              {/* Main Big Target Amount */}
              <div>
                <div
                  className={`text-3xl sm:text-5xl font-black tracking-tight font-sans ${
                    isDark ? 'text-amber-400' : 'text-slate-900'
                  }`}
                >
                  {formatRupiah(calculations.retirementFundNeeded)}
                </div>
                <p
                  className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                    isDark ? 'text-slate-300' : 'text-slate-700 font-medium'
                  }`}
                >
                  Jumlah dana yang harus terkumpul saat kamu berusia{' '}
                  <strong className={isDark ? 'text-amber-400' : 'text-slate-900 font-bold'}>
                    {retirementAge} tahun
                  </strong>{' '}
                  agar bisa hidup mandiri selamanya tanpa menggerus modal pokok.
                </p>
              </div>

              {/* Comparison Bar: Proyeksi Hasil Akumulasi vs Target */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-black/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
              >
                <div>
                  <span
                    className={`text-[11px] block font-semibold ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    Proyeksi Akumulasi Portofoliomu
                  </span>
                  <span
                    className={`text-xl sm:text-2xl font-black ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {formatRupiah(calculations.totalAccumulated)}
                  </span>
                </div>

                <div className="sm:text-right">
                  <span
                    className={`text-[11px] block font-semibold ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    Status Kelayakan
                  </span>
                  {/* Conditional coloring: Red for Minus/Kurang, Green for Surplus */}
                  <span
                    className={`text-sm sm:text-base font-black inline-flex items-center gap-1.5 ${
                      calculations.isTargetAchieved
                        ? isDark
                          ? 'text-emerald-400'
                          : 'text-emerald-700'
                        : isDark
                        ? 'text-rose-400'
                        : 'text-rose-700'
                    }`}
                  >
                    {calculations.isTargetAchieved ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Surplus +{formatRupiah(calculations.difference)}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        Kurang -{formatRupiah(Math.abs(calculations.difference))}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Liquid Compound Breakdown Bar */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`font-bold flex items-center gap-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    Struktur Komposisi Aset
                  </span>
                  <span
                    className={`text-[11px] font-bold ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Modal Pokok: {calculations.principalPct}% | Bunga Majemuk: {calculations.interestPct}%
                  </span>
                </div>

                {/* Segmented Liquid Progress Bar */}
                <div
                  className={`w-full h-4 rounded-full p-0.5 border flex overflow-hidden shadow-inner ${
                    isDark ? 'bg-black/50 border-white/10' : 'bg-slate-200 border-slate-300'
                  }`}
                >
                  <div
                    style={{ width: `${Math.max(5, calculations.principalPct)}%` }}
                    className="h-full rounded-l-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500 relative group"
                    title={`Modal Pokok: ${formatRupiah(calculations.totalPrincipal)} (${calculations.principalPct}%)`}
                  />
                  <div
                    style={{ width: `${Math.max(5, calculations.interestPct)}%` }}
                    className="h-full rounded-r-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500 relative group"
                    title={`Bunga Majemuk: ${formatRupiah(calculations.totalInterest)} (${calculations.interestPct}%)`}
                  />
                </div>

                {/* Bar Legend */}
                <div className="flex flex-wrap items-center justify-between text-[11px] pt-1 gap-2">
                  <div
                    className={`flex items-center gap-1.5 ${
                      isDark ? 'text-sky-300' : 'text-sky-800 font-bold'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-sky-500 to-indigo-500" />
                    <span>
                      Modal Pokok: <strong>{formatRupiah(calculations.totalPrincipal)}</strong>
                    </span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      isDark ? 'text-emerald-300' : 'text-emerald-800 font-bold'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-amber-500 to-emerald-400" />
                    <span>
                      Bunga Majemuk: <strong>{formatRupiah(calculations.totalInterest)}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= TAB 1: OVERVIEW 4 METRIC CARDS ================= */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-in fade-in duration-200">
              {/* Metric 1 */}
              <div
                style={
                  isDark
                    ? {
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }
                    : {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(226, 232, 240, 0.95)',
                        boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.05)'
                      }
                }
                className="p-4 rounded-2xl space-y-1"
              >
                <span
                  className={`text-xs font-semibold ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Passive Income Bulanan Aman
                </span>
                <div
                  className={`text-xl font-black font-sans ${
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}
                >
                  {formatRupiah(calculations.safeMonthlyWithdrawalAtRetirement)}
                </div>
                <span
                  className={`text-[11px] block ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Ditarik rutin setiap bulan via Aturan 4%
                </span>
              </div>

              {/* Metric 2 */}
              <div
                style={
                  isDark
                    ? {
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }
                    : {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(226, 232, 240, 0.95)',
                        boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.05)'
                      }
                }
                className="p-4 rounded-2xl space-y-1"
              >
                <span
                  className={`text-xs font-semibold ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Compounding Multiplier
                </span>
                <div
                  className={`text-xl font-black font-sans ${
                    isDark ? 'text-amber-400' : 'text-amber-700'
                  }`}
                >
                  {(calculations.totalAccumulated / Math.max(1, calculations.totalPrincipal)).toFixed(1)}x Lipat
                </div>
                <span
                  className={`text-[11px] block ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Uang bertumbuh berkat bunga majemuk
                </span>
              </div>

              {/* Metric 3 */}
              <div
                style={
                  isDark
                    ? {
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }
                    : {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(226, 232, 240, 0.95)',
                        boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.05)'
                      }
                }
                className="p-4 rounded-2xl space-y-1"
              >
                <span
                  className={`text-xs font-semibold ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Pengeluaran Saat Pensiun
                </span>
                <div
                  className={`text-xl font-black font-sans ${
                    isDark ? 'text-sky-400' : 'text-sky-800'
                  }`}
                >
                  {formatRupiah(calculations.monthlyExpenseAtRetirement)}/bln
                </div>
                <span
                  className={`text-[11px] block ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Sudah disesuaikan inflasi {inflationRate}% / thn
                </span>
              </div>

              {/* Metric 4 */}
              <div
                style={
                  isDark
                    ? {
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }
                    : {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(226, 232, 240, 0.95)',
                        boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.05)'
                      }
                }
                className="p-4 rounded-2xl space-y-1"
              >
                <span
                  className={`text-xs font-semibold ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Total Periode Setoran
                </span>
                <div
                  className={`text-xl font-black font-sans ${
                    isDark ? 'text-indigo-400' : 'text-indigo-800'
                  }`}
                >
                  {calculations.monthsToRetire} Kali Setoran
                </div>
                <span
                  className={`text-[11px] block ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Disiplin menabung rutin bulanan
                </span>
              </div>
            </div>
          )}

          {/* ================= TAB 2: TIMELINE TRAJECTORY MILESTONES ================= */}
          {activeTab === 'timeline' && (
            <div
              style={
                isDark
                  ? {
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }
                  : {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(226, 232, 240, 0.95)',
                      boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.05)'
                    }
              }
              className="p-4 sm:p-5 rounded-2xl space-y-3 max-h-80 overflow-y-auto animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'text-amber-400' : 'text-amber-800'
                  }`}
                >
                  Pencapaian Akumulasi Portofolio per Periode
                </span>
                <span
                  className={`text-[11px] font-semibold ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Progress Menuju Target
                </span>
              </div>

              <div className="space-y-2">
                {timelineMilestones.map((m) => {
                  const isAchieved = m.pctOfTarget >= 100;
                  return (
                    <div
                      key={m.year}
                      className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs transition ${
                        isDark
                          ? 'bg-black/30 border-white/5 hover:border-white/15'
                          : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black ${
                              isDark ? 'text-amber-400' : 'text-slate-900 font-bold'
                            }`}
                          >
                            Tahun ke-{m.year}
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            (Usia {m.age} thn)
                          </span>
                        </div>
                        <div
                          className={`text-[11px] ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          Pokok: <strong>{formatRupiah(m.pokok)}</strong> • Bunga: <strong>{formatRupiah(m.bunga)}</strong>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-sm font-black ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {formatRupiah(m.total)}
                        </div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                            isAchieved
                              ? isDark
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-emerald-100 text-emerald-800'
                              : isDark
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {m.pctOfTarget}% target
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 3: AI INSIGHTS & STRATEGIC RECOMMENDATIONS ================= */}
          {activeTab === 'insights' && (
            <div
              style={
                isDark
                  ? {
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }
                  : {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(226, 232, 240, 0.95)',
                      boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.05)'
                    }
              }
              className="p-4 sm:p-5 rounded-2xl space-y-3.5 animate-in fade-in duration-200 text-xs"
            >
              <div
                className={`font-bold flex items-center gap-1.5 text-sm ${
                  isDark ? 'text-amber-400' : 'text-amber-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Rekomendasi Optimalisasi Finansial
              </div>

              <div className="space-y-3">
                {calculations.isTargetAchieved ? (
                  <div
                    className={`p-3.5 rounded-xl border leading-relaxed ${
                      isDark
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                    }`}
                  >
                    <strong className="block text-sm mb-1">Portofolio Sangat Sehat (Surplus):</strong>
                    Dengan alokasi saat ini, kamu berhasil mencapai bahkan melampaui target dana pensiun sebesar{' '}
                    <strong>{formatRupiah(calculations.difference)}</strong>. Kamu bisa mempertimbangkan untuk pensiun
                    2–3 tahun lebih awal atau mendiversifikasi sebagian hasil ke instrumen defensif (SBN/Emas).
                  </div>
                ) : (
                  <div
                    className={`p-3.5 rounded-xl border leading-relaxed ${
                      isDark
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                        : 'bg-rose-50 border-rose-200 text-rose-900 font-medium'
                    }`}
                  >
                    <strong className="block text-sm mb-1">Langkah Menutup Kurang / Defisit:</strong>
                    Masih ada kekurangan sebesar{' '}
                    <strong>{formatRupiah(Math.abs(calculations.difference))}</strong>. Pertimbangkan untuk menambah
                    investasi bulanan sebesar{' '}
                    <strong>{formatRupiah(calculations.additionalMonthlyNeeded)}/bulan</strong> atau tingkatkan target
                    return tahunan dengan menambah alokasi reksa dana indeks/saham.
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-xl border space-y-1.5 ${
                    isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span
                    className={`font-bold flex items-center gap-1.5 ${
                      isDark ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-sky-500" />
                    Filosofi Aturan 4% (Trinity Study)
                  </span>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Aturan 4% menyatakan bahwa jika kamu menarik 4% dari total portofolio pensiunmu setiap tahun
                    (disesuaikan dengan inflasi), maka kemungkinan portofoliomu bertahan minimal 30 tahun ke depan
                    mendekati 95% tanpa kehabisan modal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Actions Bar */}
          <div
            style={
              isDark
                ? {
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }
                : {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(226, 232, 240, 0.95)',
                    boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.05)'
                  }
            }
            className="p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3"
          >
            <div
              className={`text-xs font-semibold flex items-center gap-2 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Model matematis majemuk presisi berbasis waktu riil</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Copy Summary */}
              <button
                onClick={handleCopySummary}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 active:scale-95 ${
                  copied
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : isDark
                    ? 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                    : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300 shadow-sm'
                }`}
                title="Salin Ringkasan Rencana"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Tersalin!' : 'Salin Ringkasan'}
              </button>

              {/* Download Text Plan */}
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-white shadow transition flex items-center gap-1.5 active:scale-95"
                title="Download Rencana Pensiun (.txt)"
              >
                <Download className="w-4 h-4" />
                Unduh Rencana
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
