import React from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassSettings, AccountBalance } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { Landmark, CreditCard, Banknote, ShieldCheck } from 'lucide-react';

interface AccountBalancesCardProps {
  accounts: AccountBalance[];
  settings: GlassSettings;
}

export const AccountBalancesCard: React.FC<AccountBalancesCardProps> = ({ accounts, settings }) => {
  const getAccountIcon = (nama: string) => {
    if (nama.toLowerCase().includes('cash')) return <Banknote className="w-4 h-4 text-emerald-400" />;
    if (nama.toLowerCase().includes('savings') || nama.toLowerCase().includes('darurat'))
      return <ShieldCheck className="w-4 h-4 text-amber-400" />;
    if (nama.toLowerCase().includes('jago') || nama.toLowerCase().includes('blu') || nama.toLowerCase().includes('allo'))
      return <CreditCard className="w-4 h-4 text-purple-400" />;
    return <Landmark className="w-4 h-4 text-blue-400" />;
  };

  return (
    <GlassContainer settings={settings} className="p-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Status Saldo Rekening & Kantong Digital
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
              Live Balances
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Distribusi likuiditas di seluruh rekening perbankan dan dompet anggaran
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 my-5">
        {accounts.map((acc) => (
          <div
            key={acc.nama}
            className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-300 truncate">{acc.nama}</span>
              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                {getAccountIcon(acc.nama)}
              </div>
            </div>

            <div>
              <span className="text-sm font-bold text-white font-mono block">
                {formatRupiah(acc.totalSaldo)}
              </span>
              {acc.spendBulanIniPercent !== undefined && acc.spendBulanIniPercent > 0 ? (
                <span className="text-[10px] text-amber-300 mt-1 block font-medium">
                  Spend: {acc.spendBulanIniPercent}%
                </span>
              ) : (
                <span className="text-[10px] text-emerald-400 mt-1 block font-medium">
                  Siap Pakai
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassContainer>
  );
};
