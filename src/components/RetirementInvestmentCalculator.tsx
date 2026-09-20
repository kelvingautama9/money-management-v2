import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GlassSettings } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import {
  Calculator,
  TrendingUp,
  Target,
  Clock,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Coins,
  DollarSign,
  X,
  RotateCcw,
  Info
} from 'lucide-react';

interface RetirementInvestmentCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlassSettings;
  currentNetWorth: number;
  currentInvestment: number;
}

export const RetirementInvestmentCalculator: React.FC<RetirementInvestmentCalculatorProps> = ({
  isOpen,
  onClose,
  settings,
  currentNetWorth,
  currentInvestment
}) => {
  // Configurable states
  const [currentAge, setCurrentAge] = useState<number>(25);
  const [targetAge, setTargetAge] = useState<number>(45);
  const [initialCapital, setInitialCapital] = useState<number>(currentInvestment || 51705076);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(2016000);
  const [expectedReturn, setExpectedReturn] = useState<number>(10); // 10% p.a.
  const [inflationRate, setInflationRate] = useState<number>(4.0); // 4% p.a.
  const [targetRetirementFund, setTargetRetirementFund] = useState<number>(2000000000); // 2 Miliar default
  const [monthlyExpenseAtRetire, setMonthlyExpenseAtRetire] = useState<number>(10000000); // 10 jt/bulan

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

  const yearsToInvest = Math.max(1, targetAge - currentAge);
  const monthsToInvest = yearsToInvest * 12;

  // Real Return (Fisher Equation adjusted for inflation)
  const nominalRateMonthly = expectedReturn / 100 / 12;
  const realReturnAnnual = Math.max(0.1, ((1 + expectedReturn / 100) / (1 + inflationRate / 100) - 1) * 100);
  const realRateMonthly = realReturnAnnual / 100 / 12;

  // Compound Interest Calculation:
  // FV = PV*(1+r)^n + PMT * [((1+r)^n - 1) / r]
  const calculateFV = (pv: number, pmt: number, rMonthly: number, nMonths: number) => {
    if (rMonthly === 0) return pv + pmt * nMonths;
    const compoundFactor = Math.pow(1 + rMonthly, nMonths);
    const fvPrincipal = pv * compoundFactor;
    const fvAnnuity = pmt * ((compoundFactor - 1) / rMonthly);
    return fvPrincipal + fvAnnuity;
  };

  // Projected Nominal & Real (purchasing power)
  const projectedNominal = Math.round(
    calculateFV(initialCapital, monthlyContribution, nominalRateMonthly, monthsToInvest)
  );
  const projectedReal = Math.round(
    calculateFV(initialCapital, monthlyContribution, realRateMonthly, monthsToInvest)
  );

  // Total principal invested (own money)
  const totalPrincipalInvested = initialCapital + monthlyContribution * monthsToInvest;
  const totalGainFromCompounding = Math.max(0, projectedNominal - totalPrincipalInvested);

  // Rule of 25 (FIRE Target from desired monthly expense):
  // Target Fund = Annual Expense * 25 (Based on 4% Safe Withdrawal Rate)
  const calculatedFireTarget = monthlyExpenseAtRetire * 12 * 25;

  // Target comparison
  const effectiveTarget = targetRetirementFund > 0 ? targetRetirementFund : calculatedFireTarget;
  const isTargetAchieved = projectedNominal >= effectiveTarget;
  const shortfallOrSurplus = projectedNominal - effectiveTarget;
  const progressPercent = Math.min(200, Number(((projectedNominal / effectiveTarget) * 100).toFixed(1)));

  // Safe Withdrawal Rate (4% Rule) Monthly Passive Income at retirement
  const monthlyPassiveIncome4Pct = Math.round((projectedNominal * 0.04) / 12);
  const monthlyPassiveIncomeReal = Math.round((projectedReal * 0.04) / 12);

  // If shortfall, calculate how much MORE monthly contribution needed to reach exact target:
  // PMT_needed = (Target - PV*(1+r)^n) * r / ((1+r)^n - 1)
  const compoundFactor = Math.pow(1 + nominalRateMonthly, monthsToInvest);
  const pvAtEnd = initialCapital * compoundFactor;
  let neededAdditionalMonthly = 0;
  if (!isTargetAchieved) {
    const remainingNeeded = effectiveTarget - pvAtEnd;
    if (remainingNeeded > 0 && nominalRateMonthly > 0) {
      const requiredTotalMonthly = (remainingNeeded * nominalRateMonthly) / (compoundFactor - 1);
      neededAdditionalMonthly = Math.max(0, Math.round(requiredTotalMonthly - monthlyContribution));
    }
  }

  // Milestones simulation (every 5 years)
  const milestones = useMemo(() => {
    const list = [];
    const step = Math.max(1, Math.floor(yearsToInvest / 4));
    for (let y = step; y <= yearsToInvest; y += step) {
      const age = currentAge + y;
      const m = y * 12;
      const fv = Math.round(calculateFV(initialCapital, monthlyContribution, nominalRateMonthly, m));
      list.push({ year: y, age, amount: fv });
    }
    if (!list.some((item) => item.age === targetAge)) {
      list.push({ year: yearsToInvest, age: targetAge, amount: projectedNominal });
    }
    return list;
  }, [currentAge, targetAge, initialCapital, monthlyContribution, nominalRateMonthly, yearsToInvest, projectedNominal]);

  // Quick preset targets
  const presets = [
    { label: '1 Miliar', value: 1000000000 },
    { label: '2 Miliar', value: 2000000000 },
    { label: '3 Miliar', value: 3000000000 },
    { label: '5 Miliar', value: 5000000000 },
    { label: '10 Miliar', value: 10000000000 }
  ];

  return typeof document !== 'undefined' ? createPortal(
    <div className="fixed inset-0 z-[9999] w-screen h-[100dvh] flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden">
      <div
        style={{
          background: 'rgba(10, 14, 28, 0.97)',
          backdropFilter: 'blur(40px) saturate(190%)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.25)'
        }}
        className="w-full max-w-4xl rounded-3xl border border-white/15 p-4 sm:p-7 text-slate-100 my-auto shadow-2xl relative max-h-[94dvh] overflow-y-auto"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600/30 via-teal-600/30 to-blue-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Kalkulator Investasi & Dana Pensiun Pro
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                  FIRE & Wealth Simulator
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Simulasi pertumbuhan modal majemuk (compounding interest), target dana pensiun, dan smart financial planner
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Banner: TERCAPAI vs BELUM TERCAPAI */}
        <div
          className={`mt-4 p-4 sm:p-5 rounded-2xl border transition-all ${
            isTargetAchieved
              ? 'bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-blue-950/20 border-emerald-500/40'
              : 'bg-gradient-to-r from-amber-950/40 via-rose-950/30 to-slate-900/40 border-amber-500/40'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {isTargetAchieved ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Target Tercapai (On Track / Surplus)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Target Belum Tercapai (Shortfall)
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  Target Usia {targetAge} Tahun ({yearsToInvest} Tahun lagi)
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xs text-slate-300">Estimasi Akumulasi:</span>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {formatRupiah(projectedNominal)}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  / Target {formatRupiah(effectiveTarget)} ({progressPercent}%)
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {isTargetAchieved ? (
                  <span className="text-emerald-300 font-medium">
                    Selamat! Dengan konsistensi DCA saat ini, dana pensiun surplus sebesar{' '}
                    <strong>{formatRupiah(shortfallOrSurplus)}</strong>. Passive income dari 4% Rule: {formatRupiah(monthlyPassiveIncome4Pct)}/bulan!
                  </span>
                ) : (
                  <span className="text-amber-200 font-medium">
                    Terdapat kekurangan dana sebesar <strong>{formatRupiah(Math.abs(shortfallOrSurplus))}</strong>. Butuh tambahan tabungan{' '}
                    <strong>+{formatRupiah(neededAdditionalMonthly)}/bulan</strong> agar pas mencapai target.
                  </span>
                )}
              </p>
            </div>

            {/* Progress Bar & Quick Metric */}
            <div className="sm:w-56 shrink-0 bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Pencapaian Target</span>
                <span className="font-bold text-white">{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isTargetAchieved ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-rose-400'
                  }`}
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-2 flex justify-between">
                <span>Passive Income 4%:</span>
                <strong className="text-sky-300">{formatRupiah(monthlyPassiveIncome4Pct)}/bln</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Inputs on Left, Deep Analysis & Milestones on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
          {/* LEFT: Controls & Sliders (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-sky-400" />
                Target & Angka Finansial (Atur Sendiri)
              </h4>

              {/* Target Dana Pensiun Nominal */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <label className="text-slate-300 font-semibold">Target Dana Pensiun (Total Akumulasi)</label>
                  <span className="text-sky-300 font-mono font-bold">{formatRupiah(targetRetirementFund)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {presets.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => {
                        triggerHaptic('selection');
                        setTargetRetirementFund(p.value);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        targetRetirementFund === p.value
                          ? 'bg-blue-600 text-white border border-blue-400 shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={500000000}
                  max={10000000000}
                  step={250000000}
                  value={targetRetirementFund}
                  onChange={(e) => setTargetRetirementFund(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Tabungan / Investasi Bulanan (DCA) */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <label className="text-slate-300 font-semibold flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    Target Tabungan / Investasi Bulanan (DCA)
                  </label>
                  <span className="text-amber-300 font-mono font-bold">{formatRupiah(monthlyContribution)}/bln</span>
                </div>
                <input
                  type="range"
                  min={500000}
                  max={20000000}
                  step={250000}
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Rp 500 rb</span>
                  <span>Rp 5 jt</span>
                  <span>Rp 10 jt</span>
                  <span>Rp 20 jt</span>
                </div>
              </div>

              {/* Modal Awal / Portfolio Saat Ini */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <label className="text-slate-300 font-semibold flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Modal Awal (Portofolio Saat Ini)
                  </label>
                  <span className="text-emerald-300 font-mono font-bold">{formatRupiah(initialCapital)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={300000000}
                  step={5000000}
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Usia Saat Ini & Usia Pensiun */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Usia Saat Ini</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={18}
                      max={70}
                      value={currentAge}
                      onChange={(e) => setCurrentAge(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <span className="text-xs text-slate-400">thn</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Target Usia Pensiun</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={currentAge + 1}
                      max={85}
                      value={targetAge}
                      onChange={(e) => setTargetAge(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <span className="text-xs text-slate-400">thn</span>
                  </div>
                </div>
              </div>

              {/* Return & Inflasi */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Ekspektasi Return/Tahun</span>
                    <span className="font-bold text-emerald-400">{expectedReturn}%</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={20}
                    step={0.5}
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">S&P500 / IHSG / DCA</span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Asumsi Inflasi/Tahun</span>
                    <span className="font-bold text-rose-400">{inflationRate}%</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={8}
                    step={0.5}
                    value={inflationRate}
                    onChange={(e) => setInflationRate(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">Penyesuaian daya beli riil</span>
                </div>
              </div>

              {/* Pengeluaran Bulanan Pensiun */}
              <div className="pt-1">
                <div className="flex justify-between items-center text-xs mb-1">
                  <label className="text-slate-300 font-semibold">Estimasi Biaya Hidup Pasca Pensiun</label>
                  <span className="text-purple-300 font-mono font-bold">{formatRupiah(monthlyExpenseAtRetire)}/bln</span>
                </div>
                <input
                  type="range"
                  min={3000000}
                  max={30000000}
                  step={1000000}
                  value={monthlyExpenseAtRetire}
                  onChange={(e) => setMonthlyExpenseAtRetire(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Rule of 25 FIRE Target: {formatRupiah(calculatedFireTarget)}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Breakdown, Smart Recommendations, & Milestones (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Wealth Breakdown Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Rincian Akumulasi Hasil Investasi
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Total Modal Sendiri Disetor:</span>
                  <span className="font-mono font-bold text-slate-200">{formatRupiah(totalPrincipalInvested)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Total Bunga Berbunga (Gain):</span>
                  <span className="font-mono font-bold text-emerald-400">+{formatRupiah(totalGainFromCompounding)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Nilai Riil (Disesuaikan Inflasi):</span>
                  <span className="font-mono font-bold text-sky-300">{formatRupiah(projectedReal)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Gaji Pasif 4% Safe Withdrawal:</span>
                  <span className="font-mono font-bold text-purple-300">{formatRupiah(monthlyPassiveIncome4Pct)}/bln</span>
                </div>
              </div>
            </div>

            {/* Smart Recommendations Pro */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/30 to-indigo-950/20 border border-blue-500/20 space-y-2.5">
              <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Smart Rekomendasi Finansial Pro
              </h4>

              <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
                {isTargetAchieved ? (
                  <>
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                      <strong>Strategi Pertahanan:</strong> Pertahankan alokasi pertumbuhan saat ini. Pada 5 tahun menjelang usia {targetAge}, mulai geser 30% ke obligasi negara (FR) atau instrumen berimbal hasil tetap untuk mengunci profit modal.
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-300">
                      <strong>Bebas Finansial Lebih Awal:</strong> Bila ingin pensiun lebih cepat di usia {Math.max(currentAge + 5, targetAge - 3)} tahun, Anda sudah bisa mencapai target dengan modal surplus tersebut.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                      <strong>Solusi 1 (Tingkatkan DCA):</strong> Tambah tabungan bulanan sebesar <strong>+{formatRupiah(neededAdditionalMonthly)}</strong> (menjadi total {formatRupiah(monthlyContribution + neededAdditionalMonthly)}/bulan).
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-300">
                      <strong>Solusi 2 (Step-Up SIP 10%):</strong> Naikkan alokasi tabungan investasi sebesar 10% setiap kali ada kenaikan gaji tahunan. Efek majemuk akan menutup defisit tanpa terasa berat.
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-300">
                      <strong>Solusi 3 (Optimasi Portofolio):</strong> Pastikan aset growth (Indeks S&P500 / Saham Dividen) memiliki porsi minimal 40-50% agar yield rata-rata dapat mencapai {expectedReturn}%.
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Milestones Timeline Preview */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Checkpoint Pertumbuhan (Milestones)
              </h4>

              <div className="space-y-1.5">
                {milestones.map((m) => (
                  <div key={m.age} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                    <span className="text-slate-400 font-medium">Usia {m.age} thn (+{m.year} thn):</span>
                    <span className="font-mono font-bold text-white">{formatRupiah(m.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => {
              triggerHaptic('light');
              setCurrentAge(25);
              setTargetAge(45);
              setInitialCapital(currentInvestment || 51705076);
              setMonthlyContribution(2016000);
              setExpectedReturn(10);
              setInflationRate(4.0);
              setTargetRetirementFund(2000000000);
              setMonthlyExpenseAtRetire(10000000);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition py-1 px-2.5 rounded-lg hover:bg-white/5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Parameter Default</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition active:scale-95 text-center"
          >
            Terapkan & Simpan Simulasi
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;
};
