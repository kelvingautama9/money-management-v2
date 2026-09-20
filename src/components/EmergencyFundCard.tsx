import React, { useState } from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassSettings, EmergencyFund } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { ShieldCheck, ShieldAlert, Target, Clock, Calculator } from 'lucide-react';

interface EmergencyFundCardProps {
  fund: EmergencyFund;
  settings: GlassSettings;
  monthlyExpenseBaseline?: number;
}

export const EmergencyFundCard: React.FC<EmergencyFundCardProps> = ({
  fund,
  settings,
  monthlyExpenseBaseline = 2000000
}) => {
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500000);
  const [showSim, setShowSim] = useState<boolean>(false);

  const percent = Math.min(100, Number(((fund.current / fund.target) * 100).toFixed(1)));
  const shortfall = Math.max(0, fund.target - fund.current);
  const runwayMonths = (fund.current / monthlyExpenseBaseline).toFixed(1);
  const monthsToTarget = monthlyContribution > 0 ? Math.ceil(shortfall / monthlyContribution) : 0;

  return (
    <GlassContainer settings={settings} className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            <h3 className="text-base font-bold text-white tracking-tight">
              Dana Darurat (Emergency Fund)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {percent}% Tercapai
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Disimpan di akun <strong className="text-slate-200">Blu BCA - Savings</strong> untuk perlindungan finansial
          </p>
        </div>

        <button
          onClick={() => setShowSim(!showSim)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/10 transition"
        >
          <Calculator className="w-3.5 h-3.5 text-blue-400" />
          {showSim ? 'Tutup Simulasi' : 'Kalkulator Target'}
        </button>
      </div>

      {/* Metric Cards - Responsive layout preventing text collisions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3 gap-3 my-5">
        {/* Current Fund (Featured) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.04] border border-white/10 min-w-0 overflow-hidden">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mb-1 truncate">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            Dana Tersedia Saat Ini
          </span>
          <h4 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight truncate" title={formatRupiah(fund.current)}>
            {formatRupiah(fund.current)}
          </h4>
          <span className="text-[11px] text-slate-400 mt-1 block truncate">
            Runway: <strong className="text-amber-300 font-semibold">{runwayMonths} Bulan</strong>
          </span>
        </div>

        {/* Target Fund */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.04] border border-white/10 min-w-0 overflow-hidden">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mb-1 truncate">
            <Target className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            Target Ideal (6 Bulan)
          </span>
          <h4 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight truncate" title={formatRupiah(fund.target)}>
            {formatRupiah(fund.target)}
          </h4>
          <span className="text-[11px] text-slate-400 mt-1 block truncate">
            Standar aman 6x Rp2 Juta
          </span>
        </div>

        {/* Shortfall */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.04] border border-white/10 min-w-0 overflow-hidden sm:col-span-2 lg:col-span-1 xl:col-span-1">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mb-1 truncate">
            <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            Kekurangan Dana
          </span>
          <h4 className="text-xl sm:text-2xl font-black text-rose-300 font-mono tracking-tight truncate" title={`-${formatRupiah(shortfall)}`}>
            -{formatRupiah(shortfall)}
          </h4>
          <span className="text-[11px] text-slate-400 mt-1 block truncate">
            Isi bertahap dari sisa gaji
          </span>
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-400">Progres Pengumpulan Dana Darurat</span>
          <span className="text-amber-300">{percent}% dari target Rp12.000.000</span>
        </div>
        <div className="w-full h-3 rounded-full bg-white/10 p-0.5 relative overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-emerald-400 shadow-md transition-all duration-700"
            style={{ width: `${Math.max(4, percent)}%` }}
          />
        </div>
      </div>

      {/* Interactive Simulation Drawer */}
      {showSim && (
        <div className="mt-5 pt-4 border-t border-white/10 bg-white/[0.02] p-4 rounded-2xl border border-white/5 animate-in fade-in duration-200">
          <h5 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-blue-400" />
            Simulasi Kecepatan Pencapaian Dana Darurat
          </h5>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/2">
              <label className="text-[11px] text-slate-400 block mb-1">
                Alokasi Tabungan Bulanan: <strong className="text-slate-200">{formatRupiah(monthlyContribution)}/bln</strong>
              </label>
              <input
                type="range"
                min="200000"
                max="2000000"
                step="100000"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
            <div className="w-full sm:w-1/2 p-3 rounded-xl bg-blue-500/10 border border-blue-400/20 text-xs">
              <p className="text-slate-300">
                Dengan menabung <strong className="text-white">{formatRupiah(monthlyContribution)}</strong> per bulan, target Rp12M akan tercapai dalam{' '}
                <strong className="text-emerald-300 font-bold">{monthsToTarget} bulan</strong> (~{(monthsToTarget / 12).toFixed(1)} tahun).
              </p>
            </div>
          </div>
        </div>
      )}
    </GlassContainer>
  );
};
