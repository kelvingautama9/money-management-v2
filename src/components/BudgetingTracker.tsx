import React, { useState, useMemo } from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassSettings, BudgetCategory } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import {
  Zap,
  Film,
  Compass,
  Heart,
  AlertTriangle,
  Pencil,
  Plus,
  Trash2,
  X,
  PieChart,
  ShoppingBag,
  Car,
  Utensils
} from 'lucide-react';

interface BudgetingTrackerProps {
  budgets: BudgetCategory[];
  settings: GlassSettings;
  currentSheetName?: string;
  onEditBudget?: (id: string, updated: Partial<BudgetCategory>) => void;
  onAddBudget?: (newBudget: BudgetCategory) => void;
  onDeleteBudget?: (id: string) => void;
  onQuickSpend?: (budgetId: string) => void;
  onOpenApiKeyModal?: () => void;
}

export const BudgetingTracker: React.FC<BudgetingTrackerProps> = ({
  budgets,
  settings,
  currentSheetName = 'SEPTEMBER',
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

  const currentMonth = currentSheetName || 'SEPTEMBER';

  const getIcon = (nama: string) => {
    const n = nama.toLowerCase();
    if (n.includes('listrik')) return <Zap className="w-4 h-4 text-blue-500" />;
    if (n.includes('entertainment') || n.includes('hiburan'))
      return <Film className="w-4 h-4 text-purple-500" />;
    if (n.includes('transport') || n.includes('bensin'))
      return <Car className="w-4 h-4 text-slate-500" />;
    if (n.includes('dating') || n.includes('kencan'))
      return <Heart className="w-4 h-4 text-pink-500" />;
    if (n.includes('makan') || n.includes('jajan'))
      return <Utensils className="w-4 h-4 text-amber-500" />;
    if (n.includes('belanja'))
      return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
    return <PieChart className="w-4 h-4 text-slate-500" />;
  };

  // Aggregates for summary
  const totalBudgetingBulanan = budgets.reduce((sum, b) => sum + (b.budgeting || b.targetBulanan || 0), 0);
  const totalSaldoAwal = budgets.reduce((sum, b) => sum + (b.saldoAwal || 0), 0);
  const totalKapasitasSaldo = budgets.reduce(
    (sum, b) => sum + (b.totalSaldo || (b.saldoAwal || 0) + (b.budgeting || b.targetBulanan || 0)),
    0
  );
  const totalActualSpend = budgets.reduce((sum, b) => sum + (b.actualSpend || 0), 0);
  const totalSisaSaldo = budgets.reduce(
    (sum, b) => sum + (b.sisa !== undefined ? b.sisa : (b.totalSaldo || 0) - (b.actualSpend || 0)),
    0
  );
  const overallMonthlyPct =
    totalBudgetingBulanan > 0 ? Number(((totalActualSpend / totalBudgetingBulanan) * 100).toFixed(1)) : 0;

  const budgetAdvice = useMemo(() => {
    const overBudgetList: { name: string; overAmount: number; pct: number }[] = [];
    budgets.forEach((b) => {
      const monthly = b.budgeting || b.targetBulanan || 0;
      const actual = b.actualSpend || 0;
      const pct = monthly > 0 ? Number(((actual / monthly) * 100).toFixed(1)) : 0;
      if (monthly > 0 && actual > monthly) {
        overBudgetList.push({ name: b.nama, overAmount: actual - monthly, pct });
      }
    });
    const totalOver = overBudgetList.reduce((sum, item) => sum + item.overAmount, 0);
    return {
      overBudgetList,
      totalOver,
      hasAlert: overBudgetList.length > 0
    };
  }, [budgets]);

  const handleOpenEdit = (b: BudgetCategory) => {
    triggerHaptic('light');
    setEditingBudget(b);
    setFormNama(b.nama);
    setFormPlafon((b.budgeting || b.targetBulanan || 0).toString());
    setFormAkun(b.akunTerkait);
    setFormSaldoAwal((b.saldoAwal || 0).toString());
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
    const totalSaldo = saldoAwal + plafon;
    const actualSpend = editingBudget.actualSpend || 0;
    const sisa = totalSaldo - actualSpend;

    onEditBudget?.(editingBudget.id, {
      nama: formNama.trim() || editingBudget.nama,
      budgeting: plafon,
      targetBulanan: plafon,
      akunTerkait: formAkun.trim() || editingBudget.akunTerkait,
      saldoAwal,
      totalSaldo,
      sisa,
      keterangan: sisa > 0 ? `Sisa: ${formatRupiah(sisa)}` : sisa < 0 ? `Defisit: ${formatRupiah(Math.abs(sisa))}` : 'Anggaran Terserap'
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

    const totalSaldo = saldoAwal + plafon;
    const newCategory: BudgetCategory = {
      id: `budget_${Date.now()}`,
      nama: cleanNama,
      saldoAwal,
      budgeting: plafon,
      targetBulanan: plafon,
      totalSaldo,
      actualSpend: 0,
      sisa: totalSaldo,
      keterangan: `Sisa: ${formatRupiah(totalSaldo)}`,
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

  const isLight = settings.themeMode === 'light' || settings.themeMode === 'beige';

  return (
    <div className="space-y-5">
      {/* Header with Title and Add Button */}
      <div className={`flex items-center justify-between gap-3 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <div>
          <h3 className={`text-base sm:text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Dompet & Pos Anggaran
          </h3>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Periode {currentMonth}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95 shadow-sm cursor-pointer ${
            isLight
              ? 'bg-slate-900 hover:bg-slate-800 text-white'
              : 'bg-white hover:bg-slate-100 text-slate-900'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Pos</span>
        </button>
      </div>

      {/* Minimalist Alert (Only shown if over budget) */}
      {budgetAdvice.hasAlert && (
        <div className={`p-3 px-4 rounded-xl border text-xs flex items-center gap-2 ${
          isLight
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
        }`}>
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>
            <strong>Perhatian:</strong> Pos {budgetAdvice.overBudgetList.map((i) => i.name).join(', ')} melebihi alokasi (+{formatRupiah(budgetAdvice.totalOver)}).
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassContainer settings={settings} className={`p-3.5 sm:p-4 ${isLight ? 'border-slate-200/80' : 'border-white/10'}`}>
          <span className={`text-[11px] font-medium block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Total Kuota Bulanan
          </span>
          <div className={`text-base sm:text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {formatRupiah(totalBudgetingBulanan)}
          </div>
        </GlassContainer>

        <GlassContainer settings={settings} className={`p-3.5 sm:p-4 ${isLight ? 'border-slate-200/80' : 'border-white/10'}`}>
          <span className={`text-[11px] font-medium block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Saldo Awal Lalu
          </span>
          <div className={`text-base sm:text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {formatRupiah(totalSaldoAwal)}
          </div>
        </GlassContainer>

        <GlassContainer settings={settings} className={`p-3.5 sm:p-4 ${isLight ? 'border-slate-200/80' : 'border-white/10'}`}>
          <span className={`text-[11px] font-medium block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Total Terpakai
          </span>
          <div className={`text-base sm:text-lg font-bold font-mono ${
            overallMonthlyPct > 100
              ? isLight ? 'text-rose-700' : 'text-rose-400'
              : isLight ? 'text-slate-900' : 'text-white'
          }`}>
            {formatRupiah(totalActualSpend)}
          </div>
          <span className={`text-[10px] mt-0.5 block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            {overallMonthlyPct}% terserap
          </span>
        </GlassContainer>

        <GlassContainer settings={settings} className={`p-3.5 sm:p-4 ${isLight ? 'border-slate-200/80' : 'border-white/10'}`}>
          <span className={`text-[11px] font-medium block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Sisa Saldo
          </span>
          <div className={`text-base sm:text-lg font-bold font-mono ${
            totalSisaSaldo < 0
              ? isLight ? 'text-rose-700' : 'text-rose-400'
              : isLight ? 'text-emerald-700' : 'text-emerald-400'
          }`}>
            {formatRupiah(totalSisaSaldo)}
          </div>
          <span className={`text-[10px] mt-0.5 block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Kapasitas: {formatRupiah(totalKapasitasSaldo)}
          </span>
        </GlassContainer>
      </div>

      {/* Grid of Clean Minimalist Budget Cards */}
      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {budgets.map((b) => {
            const monthlyBudget = b.budgeting || b.targetBulanan || 0;
            const saldoAwal = b.saldoAwal || 0;
            const totalSaldo = b.totalSaldo || saldoAwal + monthlyBudget;
            const actualSpend = b.actualSpend || 0;
            const sisa = b.sisa !== undefined ? b.sisa : totalSaldo - actualSpend;

            const monthlySpendPct =
              monthlyBudget > 0 ? Number(((actualSpend / monthlyBudget) * 100).toFixed(1)) : 0;
            const isOverMonthly = actualSpend > monthlyBudget && monthlyBudget > 0;
            const monthlyDiff = actualSpend - monthlyBudget;

            return (
              <div
                key={b.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isLight
                    ? 'bg-white border-slate-200/90 shadow-xs'
                    : 'bg-white/[0.03] border-white/10'
                }`}
              >
                {/* Header: Title + Account + Action Icons */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isLight ? 'bg-slate-100' : 'bg-white/10'
                    }`}>
                      {getIcon(b.nama)}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`font-bold text-sm truncate leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {b.nama}
                      </h4>
                      <span className={`text-[11px] truncate block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {b.akunTerkait || 'Bank BCA'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        isLight
                          ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                          : 'text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                      title="Edit Pos Budget"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id, b.nama)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        isLight
                          ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                      }`}
                      title="Hapus Pos Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Spend Metric vs Kuota */}
                <div className="my-2">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className={`text-base sm:text-lg font-bold font-mono tracking-tight ${
                      isOverMonthly
                        ? isLight ? 'text-rose-700' : 'text-rose-400'
                        : isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      {formatRupiah(actualSpend)}
                    </span>
                    <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      dari {formatRupiah(monthlyBudget)}
                    </span>
                  </div>

                  {/* Clean Single Progress Bar */}
                  <div className={`w-full h-2 rounded-full overflow-hidden mt-2 ${isLight ? 'bg-slate-100' : 'bg-white/10'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverMonthly
                          ? 'bg-rose-600'
                          : monthlySpendPct >= 80
                          ? 'bg-amber-500'
                          : isLight ? 'bg-slate-800' : 'bg-sky-400'
                      }`}
                      style={{ width: `${Math.min(100, monthlySpendPct)}%` }}
                    />
                  </div>
                </div>

                {/* Unboxed Metadata with Typographic Separator */}
                <div className="flex items-center justify-between text-[11px] pt-2.5 mt-2.5 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span>{monthlySpendPct}% terpakai</span>
                    <span aria-hidden="true">·</span>
                    <span>Kapasitas: {formatRupiah(totalSaldo)}</span>
                  </div>
                  <div>
                    {isOverMonthly ? (
                      <span className={`font-semibold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                        Over: +{formatRupiah(monthlyDiff)}
                      </span>
                    ) : (
                      <span className={`font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                        Sisa: {formatRupiah(sisa)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`p-8 rounded-2xl border text-center space-y-3 ${
          isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-white/[0.02] border-white/10 text-slate-400'
        }`}>
          <PieChart className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Belum Ada Pos Budget Terhubung
            </h4>
            <p className="text-xs max-w-sm mx-auto leading-relaxed">
              Hubungkan proyek Google Sheet Anda atau klik tombol Tambah Pos untuk memulai pencatatan anggaran.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5 ${
              isLight
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pos Pertama</span>
          </button>
        </div>
      )}

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 space-y-4 transition-all ${
            isLight
              ? 'bg-white border border-slate-200 shadow-2xl text-slate-800'
              : 'bg-[#0f172a] border border-slate-700 shadow-2xl text-white'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <h4 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Pencil className="w-4 h-4 text-blue-500" />
                Edit Pos Budget
              </h4>
              <button
                onClick={() => setEditingBudget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className={`block mb-1 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Nama Pos Budget:
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-medium transition focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600'
                      : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block mb-1 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Akun / Rekening Terkait:
                </label>
                <input
                  type="text"
                  value={formAkun}
                  onChange={(e) => setFormAkun(e.target.value)}
                  placeholder="Contoh: Allo Bank, Jago-Transport, Blu BCA"
                  className={`w-full p-2.5 rounded-xl text-xs font-medium transition focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600'
                      : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Jatah Bulanan (Rp):
                  </label>
                  <input
                    type="number"
                    value={formPlafon}
                    onChange={(e) => setFormPlafon(e.target.value)}
                    placeholder="300000"
                    className={`w-full p-2.5 rounded-xl text-xs font-medium transition focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600'
                        : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block mb-1 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Saldo Awal Bulan Lalu (Rp):
                  </label>
                  <input
                    type="number"
                    value={formSaldoAwal}
                    onChange={(e) => setFormSaldoAwal(e.target.value)}
                    placeholder="0"
                    className={`w-full p-2.5 rounded-xl text-xs font-medium transition focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600'
                        : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400'
                    }`}
                  />
                </div>
              </div>

              <div className={`flex justify-between items-center pt-3 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <button
                  type="button"
                  onClick={() => handleDelete(editingBudget.id, editingBudget.nama)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition border cursor-pointer active:scale-95 ${
                    isLight
                      ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                      : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-300'
                  }`}
                >
                  Hapus Pos
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBudget(null)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition border cursor-pointer active:scale-95 ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                        : 'bg-white/10 hover:bg-white/15 border-white/10 text-slate-300'
                    }`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition active:scale-95 cursor-pointer ${
                      isLight
                        ? 'bg-slate-900 hover:bg-slate-800 text-white'
                        : 'bg-white hover:bg-slate-100 text-slate-950'
                    }`}
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Budget Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 space-y-4 transition-all ${
            isLight
              ? 'bg-white border border-slate-200 shadow-2xl text-slate-800'
              : 'bg-[#0f172a] border border-slate-700 shadow-2xl text-white'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <h4 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Plus className="w-4 h-4 text-emerald-500" />
                Tambah Pos Budget
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5 text-xs">
              <div>
                <label className={`block mb-1 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Nama Pos Budget:
                </label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Belanja Bulanan / Langganan / Gym"
                  className={`w-full p-2.5 rounded-xl text-xs font-medium transition focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600'
                      : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`block mb-1 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Akun / Rekening Terkait:
                </label>
                <input
                  type="text"
                  value={formAkun}
                  onChange={(e) => setFormAkun(e.target.value)}
                  placeholder="Contoh: Bank BCA, Allo Bank, Seabank"
                  className={`w-full p-2.5 rounded-xl text-xs font-medium transition focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600'
                      : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Jatah Bulanan (Rp):
                  </label>
                  <input
                    type="number"
                    value={formPlafon}
                    onChange={(e) => setFormPlafon(e.target.value)}
                    placeholder="500000"
                    className={`w-full p-2.5 rounded-xl text-xs font-medium transition focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600'
                        : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block mb-1 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Saldo Awal Bulan (Rp):
                  </label>
                  <input
                    type="number"
                    value={formSaldoAwal}
                    onChange={(e) => setFormSaldoAwal(e.target.value)}
                    placeholder="0"
                    className={`w-full p-2.5 rounded-xl text-xs font-medium transition focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600'
                        : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400'
                    }`}
                  />
                </div>
              </div>

              <div className={`flex justify-end gap-2 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition border cursor-pointer active:scale-95 ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-white/10 hover:bg-white/15 border-white/10 text-slate-300'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition active:scale-95 cursor-pointer ${
                    isLight
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-950'
                  }`}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
