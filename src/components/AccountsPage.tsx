import React, { useState } from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassButton } from './GlassButton';
import { GlassSettings, AccountBalance, Transaction } from '../types';
import { AVAILABLE_ACCOUNTS } from '../data/initialData';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import {
  Landmark,
  CreditCard,
  Banknote,
  ShieldCheck,
  ArrowRightLeft,
  PieChart,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  X,
  Wallet
} from 'lucide-react';

interface AccountsPageProps {
  accounts: AccountBalance[];
  settings: GlassSettings;
  onTransfer: (fromAccount: string, toAccount: string, amount: number, note: string) => Promise<void>;
  transactions: Transaction[];
  totalNetWorth?: number;
  totalInvestment?: number;
  onAddAccount?: (account: AccountBalance) => void;
  onEditAccount?: (oldName: string, updated: AccountBalance) => void;
  onDeleteAccount?: (name: string) => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  accounts,
  settings,
  onTransfer,
  transactions,
  totalNetWorth,
  totalInvestment,
  onAddAccount,
  onEditAccount,
  onDeleteAccount
}) => {
  const [fromAcc, setFromAcc] = useState('Bank BCA');
  const [toAcc, setToAcc] = useState('Jago-Transport');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountBalance | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSaldoAwal, setFormSaldoAwal] = useState('');
  const [formTotalSaldo, setFormTotalSaldo] = useState('');

  // Total All Assets synchronized exactly with Home Net Worth (totalAset)
  const totalAllAssets = typeof totalNetWorth === 'number' && totalNetWorth > 0
    ? totalNetWorth
    : accounts.reduce((sum, a) => sum + a.totalSaldo, 0);

  const totalLiquidCash = accounts
    .filter((a) => !a.nama.toLowerCase().includes('investasi'))
    .reduce((sum, a) => sum + a.totalSaldo, 0);

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount.replace(/[^0-9.-]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Masukkan nominal transfer yang valid.');
      return;
    }
    if (fromAcc === toAcc) {
      alert('Rekening sumber dan rekening tujuan tidak boleh sama.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onTransfer(fromAcc, toAcc, numericAmount, note || `Transfer internal dari ${fromAcc} ke ${toAcc}`);
      setTransferSuccess(`Berhasil memindahkan ${formatRupiah(numericAmount)} dari ${fromAcc} ke ${toAcc}!`);
      setAmount('');
      setNote('');
      setTimeout(() => setTransferSuccess(null), 5000);
    } catch (err: any) {
      alert(`Gagal transfer: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAccountIcon = (nama: string) => {
    const n = nama.toLowerCase();
    if (n.includes('cash') || n.includes('tunai')) return <Banknote className="w-5 h-5 text-emerald-400" />;
    if (n.includes('savings') || n.includes('darurat'))
      return <ShieldCheck className="w-5 h-5 text-amber-400" />;
    if (n.includes('jago') || n.includes('blu') || n.includes('allo') || n.includes('gopay') || n.includes('ovo') || n.includes('wallet'))
      return <CreditCard className="w-5 h-5 text-purple-400" />;
    return <Landmark className="w-5 h-5 text-blue-400" />;
  };

  const handleOpenAdd = () => {
    triggerHaptic('light');
    setFormName('');
    setFormSaldoAwal('0');
    setFormTotalSaldo('0');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (acc: AccountBalance) => {
    triggerHaptic('light');
    setEditingAccount(acc);
    setFormName(acc.nama);
    setFormSaldoAwal((acc.saldoAwal ?? 0).toString());
    setFormTotalSaldo(acc.totalSaldo.toString());
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    const cleanSaldoAwal = parseFloat(formSaldoAwal.replace(/[^0-9.-]/g, '')) || 0;
    const cleanTotal = parseFloat(formTotalSaldo.replace(/[^0-9.-]/g, '')) || cleanSaldoAwal;
    if (!cleanName) {
      alert('Masukkan nama rekening atau wallet.');
      return;
    }

    const newAcc: AccountBalance = {
      nama: cleanName,
      saldoAwal: cleanSaldoAwal,
      totalSaldo: cleanTotal
    };

    onAddAccount?.(newAcc);
    triggerHaptic('success');
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    const cleanName = formName.trim();
    const cleanSaldoAwal = parseFloat(formSaldoAwal.replace(/[^0-9.-]/g, '')) || 0;
    const cleanTotal = parseFloat(formTotalSaldo.replace(/[^0-9.-]/g, '')) || cleanSaldoAwal;
    if (!cleanName) {
      alert('Masukkan nama rekening atau wallet.');
      return;
    }

    const updated: AccountBalance = {
      ...editingAccount,
      nama: cleanName,
      saldoAwal: cleanSaldoAwal,
      totalSaldo: cleanTotal
    };

    onEditAccount?.(editingAccount.nama, updated);
    triggerHaptic('success');
    setEditingAccount(null);
  };

  const handleDelete = (name: string) => {
    if (confirm(`Yakin ingin menghapus rekening/wallet "${name}"?`)) {
      triggerHaptic('warning');
      onDeleteAccount?.(name);
      setEditingAccount(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <GlassContainer settings={settings} className="p-4 sm:p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Kas Likuid Siap Pakai
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white font-mono">{formatRupiah(totalLiquidCash)}</h3>
          <p className="text-[11px] text-emerald-400 mt-1">Rekening Bank, Kantong Budget, & E-Wallet</p>
        </GlassContainer>

        <GlassContainer settings={settings} className="p-4 sm:p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Kekayaan Seluruh Rekening
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-sky-300 font-mono">{formatRupiah(totalAllAssets)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Termasuk Saldo Portofolio Investasi</p>
        </GlassContainer>

        <GlassContainer settings={settings} className="p-4 sm:p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Jumlah Rekening & Wallet
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-purple-300 font-mono">{accounts.length} Akun</h3>
          <p className="text-[11px] text-slate-400 mt-1">Tersinkronisasi dengan Google Sheet</p>
        </GlassContainer>
      </div>

      {/* Grid of Accounts & Balances */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Daftar Saldo Per Rekening & Wallet
          </h3>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs self-start sm:self-auto transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tambah Rekening / Wallet</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
          {accounts.map((acc) => {
            const isInvestasi = acc.nama.toLowerCase().includes('investasi');
            const percentOfLiquid =
              totalLiquidCash > 0 ? ((acc.totalSaldo / totalLiquidCash) * 100).toFixed(1) : '0';

            return (
              <GlassContainer
                key={acc.nama}
                settings={settings}
                className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between relative group hover:border-white/25 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5 sm:mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 shrink-0">
                        {getAccountIcon(acc.nama)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-xs sm:text-sm truncate" title={acc.nama}>{acc.nama}</h4>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 block truncate">
                          {isInvestasi ? 'Aset Investasi' : 'Operasional'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(acc)}
                        className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition"
                        title="Edit Rekening / Wallet"
                      >
                        <Pencil className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(acc.nama)}
                        className="p-1 rounded-md bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        title="Hapus Rekening / Wallet"
                      >
                        <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="my-1.5 sm:my-2">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
                      Saldo Berjalan
                    </span>
                    <span className="text-sm sm:text-lg font-bold font-mono text-white block tracking-tight truncate">
                      {formatRupiah(acc.totalSaldo)}
                    </span>
                  </div>
                </div>

                <div className="pt-1.5 sm:pt-2 border-t border-white/5 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400">
                  <span className="truncate">Awal: {formatRupiah(acc.saldoAwal ?? 0)}</span>
                  {!isInvestasi && <span className="text-sky-300 font-medium shrink-0 ml-1">{percentOfLiquid}%</span>}
                </div>
              </GlassContainer>
            );
          })}
        </div>
      </div>

      {/* Internal Transfer Card */}
      <GlassContainer settings={settings} className="p-5">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
          <ArrowRightLeft className="w-4 h-4 text-sky-400" />
          <h4 className="text-sm font-bold text-white tracking-tight">
            Transfer Internal Antar Rekening & Kantong
          </h4>
        </div>

        {transferSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{transferSuccess}</span>
          </div>
        )}

        <form onSubmit={handleExecuteTransfer} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Dari Rekening Sumber:</label>
              <select
                value={fromAcc}
                onChange={(e) => setFromAcc(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.nama} value={a.nama} className="bg-slate-900 text-white">
                    {a.nama} ({formatRupiah(a.totalSaldo)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">Ke Rekening Tujuan:</label>
              <select
                value={toAcc}
                onChange={(e) => setToAcc(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.nama} value={a.nama} className="bg-slate-900 text-white">
                    {a.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Nominal Transfer (Rp):</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Contoh: 150000"
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">Catatan (Opsional):</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Misal: Top up kantong transport"
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses Transfer...' : 'Kirim Transfer Internal'}
            </button>
          </div>
        </form>
      </GlassContainer>

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0e1224] border border-white/20 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Tambah Rekening / Wallet Baru
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Nama Rekening / E-Wallet:</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Seabank / GoPay / ShopeePay / Mandiri"
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Saldo Awal (Rp):</label>
                <input
                  type="number"
                  value={formSaldoAwal}
                  onChange={(e) => setFormSaldoAwal(e.target.value)}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Total Saldo Saat Ini (Rp):</label>
                <input
                  type="number"
                  value={formTotalSaldo}
                  onChange={(e) => setFormTotalSaldo(e.target.value)}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md transition active:scale-95"
                >
                  Simpan Rekening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0e1224] border border-white/20 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-sky-400" />
                Edit Rekening / Wallet ({editingAccount.nama})
              </h4>
              <button
                onClick={() => setEditingAccount(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Nama Rekening / Wallet:</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Saldo Awal (Rp):</label>
                <input
                  type="number"
                  value={formSaldoAwal}
                  onChange={(e) => setFormSaldoAwal(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Total Saldo Saat Ini (Rp):</label>
                <input
                  type="number"
                  value={formTotalSaldo}
                  onChange={(e) => setFormTotalSaldo(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleDelete(editingAccount.nama)}
                  className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs transition"
                >
                  Hapus Rekening
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                  >
                    Perbarui Rekening
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
