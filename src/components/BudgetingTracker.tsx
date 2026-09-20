import React, { useState } from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassSettings, BudgetCategory } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import {
  Zap,
  Film,
  Compass,
  Heart,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Plus,
  Trash2,
  X,
  PieChart,
  Wallet
} from 'lucide-react';

interface BudgetingTrackerProps {
  budgets: BudgetCategory[];
  settings: GlassSettings;
  onEditBudget?: (id: string, updated: Partial<BudgetCategory>) => void;
  onAddBudget?: (newBudget: BudgetCategory) => void;
  onDeleteBudget?: (id: string) => void;
  onQuickSpend?: (budgetId: string) => void;
}

export const BudgetingTracker: React.FC<BudgetingTrackerProps> = ({
  budgets,
  settings,
  onEditBudget,
  onAddBudget,
  onDeleteBudget
}) => {
  const [editingBudget, setEditingBudget] = useState<BudgetCategory | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [formNama, setFormNama] = useState('');
  const [formPlafon, setFormPlafon] = useState('');
  const [formAkun, setFormAkun] = useState('');
  const [formSaldoAwal, setFormSaldoAwal] = useState('');

  const getIcon = (nama: string) => {
    const n = nama.toLowerCase();
    if (n.includes('listrik')) return <Zap className="w-5 h-5 text-amber-400" />;
    if (n.includes('entertainment') || n.includes('hiburan'))
      return <Film className="w-5 h-5 text-purple-400" />;
    if (n.includes('transport') || n.includes('bensin'))
      return <Compass className="w-5 h-5 text-cyan-400" />;
    if (n.includes('dating') || n.includes('kencan'))
      return <Heart className="w-5 h-5 text-pink-400" />;
    return <PieChart className="w-5 h-5 text-blue-400" />;
  };

  const handleOpenEdit = (b: BudgetCategory) => {
    triggerHaptic('light');
    setEditingBudget(b);
    setFormNama(b.nama);
    setFormPlafon(b.targetBulanan.toString());
    setFormAkun(b.akunTerkait);
    setFormSaldoAwal(b.saldoAwal.toString());
  };

  const handleOpenAdd = () => {
    triggerHaptic('light');
    setFormNama('');
    setFormPlafon('500000');
    setFormAkun('Bank BCA');
    setFormSaldoAwal('0');
    setIsAddModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;

    const plafon = parseFloat(formPlafon.replace(/[^0-9.-]/g, '')) || 0;
    const saldoAwal = parseFloat(formSaldoAwal.replace(/[^0-9.-]/g, '')) || 0;

    onEditBudget?.(editingBudget.id, {
      nama: formNama.trim() || editingBudget.nama,
      targetBulanan: plafon,
      akunTerkait: formAkun.trim() || editingBudget.akunTerkait,
      saldoAwal,
      totalSaldo: saldoAwal + plafon,
      sisa: Math.max(0, saldoAwal + plafon - editingBudget.actualSpend)
    });

    triggerHaptic('success');
    setEditingBudget(null);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const plafon = parseFloat(formPlafon.replace(/[^0-9.-]/g, '')) || 0;
    const saldoAwal = parseFloat(formSaldoAwal.replace(/[^0-9.-]/g, '')) || 0;
    const cleanNama = formNama.trim();
    if (!cleanNama) {
      alert('Masukkan nama pos budgeting.');
      return;
    }

    const newCategory: BudgetCategory = {
      id: `budget_${Date.now()}`,
      nama: cleanNama,
      saldoAwal,
      budgeting: plafon,
      targetBulanan: plafon,
      totalSaldo: saldoAwal + plafon,
      actualSpend: 0,
      sisa: saldoAwal + plafon,
      keterangan: `Sisa: ${formatRupiah(saldoAwal + plafon)}`,
      akunTerkait: formAkun.trim() || 'Bank BCA'
    };

    onAddBudget?.(newCategory);
    triggerHaptic('success');
    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus pos budgeting "${name}"?`)) {
      triggerHaptic('warning');
      onDeleteBudget?.(id);
      setEditingBudget(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Kontrol Budgeting & Sinking Funds
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoring saldo kantong belanja
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs self-start sm:self-auto transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tambah Pos Budget</span>
        </button>
      </div>

      {/* Grid of Budget Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {budgets.map((b) => {
          const spendPercent =
            b.totalSaldo > 0 ? Math.min(100, Math.round((b.actualSpend / b.totalSaldo) * 100)) : 0;
          const isDepleted = b.sisa <= 0;
          const isWarning = spendPercent >= 80 && !isDepleted;

          return (
            <GlassContainer key={b.id} settings={settings} className="p-4 sm:p-5 flex flex-col justify-between relative group hover:border-white/25 transition-all">
              <div>
                {/* Header: Icon + Name + Edit Trigger */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
                      {getIcon(b.nama)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-xs sm:text-sm truncate">{b.nama}</h4>
                      <span className="text-[10px] text-slate-400 block truncate">{b.akunTerkait}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition shrink-0"
                    title="Edit Nama Pos Budgeting"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>

                {/* Sisa Saldo KPI */}
                <div className="my-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
                    Sisa Saldo Kantong
                  </span>
                  <div className="text-lg sm:text-xl font-black font-mono text-white">
                    {formatRupiah(b.sisa)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Terpakai: <span className="text-slate-300 font-mono">{formatRupiah(b.actualSpend)}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Status */}
              <div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDepleted
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-400'
                        : 'bg-gradient-to-r from-blue-500 to-sky-400'
                    }`}
                    style={{ width: `${spendPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Plafon: {formatRupiah(b.totalSaldo)}</span>
                  <span
                    className={`font-semibold ${
                      isDepleted
                        ? 'text-rose-400'
                        : isWarning
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {spendPercent}%
                  </span>
                </div>
              </div>
            </GlassContainer>
          );
        })}
      </div>

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0e1224] border border-white/20 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-sky-400" />
                Edit Pos Budgeting ({editingBudget.nama})
              </h4>
              <button
                onClick={() => setEditingBudget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Nama Pos Budget:</label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Akun / Rekening Terkait:</label>
                <input
                  type="text"
                  value={formAkun}
                  onChange={(e) => setFormAkun(e.target.value)}
                  placeholder="Contoh: Allo Bank, Jago-Transport, Blu"
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Target Top-up Bulanan (Rp):</label>
                <input
                  type="number"
                  value={formPlafon}
                  onChange={(e) => setFormPlafon(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Saldo Awal Bulan (Rp):</label>
                <input
                  type="number"
                  value={formSaldoAwal}
                  onChange={(e) => setFormSaldoAwal(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleDelete(editingBudget.id, editingBudget.nama)}
                  className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs transition"
                >
                  Hapus Pos
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBudget(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Budget Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0e1224] border border-white/20 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Tambah Pos Budgeting Baru
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Nama Pos Budget:</label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Belanja Bulanan / Langganan / Gym"
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Akun / Rekening Terkait:</label>
                <input
                  type="text"
                  value={formAkun}
                  onChange={(e) => setFormAkun(e.target.value)}
                  placeholder="Contoh: Bank BCA, Allo Bank, Seabank"
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Target Plafon Bulanan (Rp):</label>
                <input
                  type="number"
                  value={formPlafon}
                  onChange={(e) => setFormPlafon(e.target.value)}
                  placeholder="500000"
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Saldo Awal Bulan (Rp):</label>
                <input
                  type="number"
                  value={formSaldoAwal}
                  onChange={(e) => setFormSaldoAwal(e.target.value)}
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
                  Buat Pos Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
