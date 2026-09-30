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
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Pencil,
  Plus,
  Trash2,
  X,
  PieChart,
  Wallet,
  TrendingDown,
  Layers,
  ShieldCheck,
  Calendar,
  Lightbulb,
  ArrowRight,
  Shield
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
    if (n.includes('listrik')) return <Zap className="w-5 h-5 text-blue-400" />;
    if (n.includes('entertainment') || n.includes('hiburan'))
      return <Film className="w-5 h-5 text-slate-400" />;
    if (n.includes('transport') || n.includes('bensin'))
      return <Compass className="w-5 h-5 text-slate-400" />;
    if (n.includes('dating') || n.includes('kencan'))
      return <Heart className="w-5 h-5 text-slate-400" />;
    return <PieChart className="w-5 h-5 text-slate-400" />;
  };

  // Aggregates for macro summary banner
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
  const overallTotalPct =
    totalKapasitasSaldo > 0 ? Number(((totalActualSpend / totalKapasitasSaldo) * 100).toFixed(1)) : 0;

  // 100% Deterministic & Scripted Smart Budget Advice (Zero AI tokens, Instant, Actionable)
  const budgetAdvice = useMemo(() => {
    const overBudgetList: { name: string; overAmount: number; pct: number }[] = [];
    const nearLimitList: { name: string; remaining: number; pct: number }[] = [];
    const depletedList: { name: string; deficit: number }[] = [];
    const healthyList: { name: string; surplus: number; pct: number }[] = [];

    budgets.forEach((b) => {
      const monthly = b.budgeting || b.targetBulanan || 0;
      const actual = b.actualSpend || 0;
      const saldoAwal = b.saldoAwal || 0;
      const total = b.totalSaldo || (saldoAwal + monthly);
      const sisa = b.sisa !== undefined ? b.sisa : total - actual;
      const pct = monthly > 0 ? Number(((actual / monthly) * 100).toFixed(1)) : 0;

      if (sisa <= 0) {
        depletedList.push({ name: b.nama, deficit: Math.abs(sisa) });
      } else if (monthly > 0 && actual > monthly) {
        overBudgetList.push({ name: b.nama, overAmount: actual - monthly, pct });
      } else if (monthly > 0 && actual >= 0.8 * monthly) {
        nearLimitList.push({ name: b.nama, remaining: monthly - actual, pct });
      } else if (monthly > 0) {
        healthyList.push({ name: b.nama, surplus: monthly - actual, pct });
      }
    });

    const totalOver = overBudgetList.reduce((sum, item) => sum + item.overAmount, 0);

    return {
      overBudgetList,
      nearLimitList,
      depletedList,
      healthyList,
      totalOver,
      hasAlert: overBudgetList.length > 0 || depletedList.length > 0,
      hasWarning: nearLimitList.length > 0
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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <div>
          <h3 className={`text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <PieChart className={`w-5 h-5 ${isLight ? 'text-slate-800' : 'text-slate-300'}`} />
            Dompet Budgeting & Sinking Funds
          </h3>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Audit komparasi jatah bulanan vs ketahanan saldo akumulasi kantong belanja
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-semibold text-xs self-start sm:self-auto transition-all active:scale-95 shadow-sm cursor-pointer ${
            isLight
              ? 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white'
              : 'bg-white hover:bg-slate-100 border-white text-slate-900'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Pos Budget</span>
        </button>
      </div>

      {/* Smart Scripted Budget Advice (Minimalist Light Grey, Navy, White, Dark Red) */}
      <GlassContainer
        settings={settings}
        className={`p-4 sm:p-5 transition-all shadow-md rounded-2xl ${
          budgetAdvice.hasAlert
            ? isLight
              ? 'bg-red-50/90 border-red-200 text-slate-900'
              : 'border-red-900/40 bg-red-950/20 text-slate-200'
            : budgetAdvice.hasWarning
            ? isLight
              ? 'bg-slate-50 border-slate-200 text-slate-900'
              : 'border-white/10 bg-white/[0.03] text-slate-200'
            : isLight
            ? 'bg-slate-50 border-slate-200 text-slate-900'
            : 'border-white/10 bg-white/[0.03] text-slate-200'
        } backdrop-blur-xl`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${
                budgetAdvice.hasAlert
                  ? isLight
                    ? 'bg-red-100 border-red-200 text-red-700'
                    : 'bg-red-500/20 border-red-500/30 text-red-300'
                  : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-800'
                  : 'bg-white/10 border-white/15 text-slate-200'
              }`}
            >
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs sm:text-sm font-extrabold tracking-tight flex items-center gap-1.5 ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Saran & Rekomendasi Anggaran
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    budgetAdvice.hasAlert
                      ? isLight
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-red-500/20 border-red-500/40 text-red-300'
                      : isLight
                      ? 'bg-slate-100 border-slate-200 text-slate-800'
                      : 'bg-white/10 border-white/20 text-slate-200'
                  }`}
                >
                  {budgetAdvice.hasAlert
                    ? 'Peringatan Over-Budget'
                    : budgetAdvice.hasWarning
                    ? 'Mendekati Limit'
                    : 'Budget Terkendali'}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Periode {currentMonth}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {budgetAdvice.overBudgetList.length > 0 ? (
                  <>
                    <strong className={isLight ? 'text-red-700 font-extrabold' : 'text-red-400 font-bold'}>
                      Terdeteksi Over-Budget:
                    </strong>{' '}
                    Pos{' '}
                    <strong className={isLight ? 'text-slate-950 font-bold' : 'text-white'}>
                      {budgetAdvice.overBudgetList.map((i) => `${i.name} (+${formatRupiah(i.overAmount)})`).join(', ')}
                    </strong>{' '}
                    telah melampaui alokasi bulanan (total over: +{formatRupiah(budgetAdvice.totalOver)}). Disarankan segera{' '}
                    <strong className={isLight ? 'text-red-700 font-bold' : 'text-red-400'}>
                      mengerem pengeluaran
                    </strong>{' '}
                    pada pos tersebut agar arus kas bulanan tidak defisit.
                  </>
                ) : budgetAdvice.depletedList.length > 0 ? (
                  <>
                    <strong className={isLight ? 'text-red-700 font-extrabold' : 'text-red-400'}>
                      Saldo Kantong Habis:
                    </strong>{' '}
                    Pos {budgetAdvice.depletedList.map((i) => i.name).join(', ')} telah terserap penuh. Tunda belanja tambahan hingga periode berikutnya.
                  </>
                ) : budgetAdvice.nearLimitList.length > 0 ? (
                  <>
                    <strong className={isLight ? 'text-slate-900 font-bold' : 'text-slate-200'}>
                      Waspada Limit Anggaran:
                    </strong>{' '}
                    Pos {budgetAdvice.nearLimitList.map((i) => `${i.name} (${i.pct}%)`).join(', ')} sudah menyerap &ge;80% jatah bulanan.
                  </>
                ) : (
                  <>
                    <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>
                      Disiplin Anggaran Terjaga:
                    </strong>{' '}
                    Seluruh pos belanja beroperasi dalam batas aman ({overallMonthlyPct}% terserap). Cadangan sisa saldo sebesar{' '}
                    <strong className={isLight ? 'text-slate-950 font-bold' : 'text-white'}>
                      {formatRupiah(totalSisaSaldo)}
                    </strong>{' '}
                    memperkuat saldo simpanan bulan depan.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </GlassContainer>

      {/* Aggregate Overview Strip (Detail 1 vs Detail 2 at System Level) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassContainer settings={settings} className={`p-3.5 sm:p-4 ${isLight ? 'border-slate-200/80' : 'border-white/10'}`}>
          <span className={`text-[10px] sm:text-xs font-medium block mb-1 flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <Calendar className={`w-3.5 h-3.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`} />
            Total Budgeting Bulanan
          </span>
          <div className={`text-base sm:text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {formatRupiah(totalBudgetingBulanan)}
          </div>
          <span className={`text-[10px] mt-0.5 block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Jatah alokasi belanja bulan ini
          </span>
        </GlassContainer>

        <GlassContainer settings={settings} className={`p-3.5 sm:p-4 ${isLight ? 'border-slate-200/80' : 'border-white/10'}`}>
          <span className={`text-[10px] sm:text-xs font-medium block mb-1 flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <Layers className={`w-3.5 h-3.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`} />
            Akumulasi S. Awal (Bulan Lalu)
          </span>
          <div className={`text-base sm:text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {formatRupiah(totalSaldoAwal)}
          </div>
          <span className={`text-[10px] mt-0.5 block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Sisa saldo simpanan bulan lalu
          </span>
        </GlassContainer>

        <GlassContainer settings={settings} className={`p-3.5 sm:p-4 ${isLight ? 'border-slate-200/80' : 'border-white/10'}`}>
          <span className={`text-[10px] sm:text-xs font-medium block mb-1 flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <TrendingDown className={`w-3.5 h-3.5 ${isLight ? 'text-red-700' : 'text-red-400'}`} />
            Total Pengeluaran
          </span>
          <div className={`text-base sm:text-lg font-bold font-mono ${isLight ? 'text-red-700' : 'text-red-400'}`}>
            {formatRupiah(totalActualSpend)}
          </div>
          <span className={`text-[10px] mt-0.5 block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {overallMonthlyPct}% dari total budget
          </span>
        </GlassContainer>

        <GlassContainer settings={settings} className={`p-3.5 sm:p-4 ${isLight ? 'border-slate-200/80' : 'border-white/10'}`}>
          <span className={`text-[10px] sm:text-xs font-medium block mb-1 flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <ShieldCheck className={`w-3.5 h-3.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`} />
            Total Sisa Saldo Dompet
          </span>
          <div className={`text-base sm:text-lg font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {formatRupiah(totalSisaSaldo)}
          </div>
          <span className={`text-[10px] mt-0.5 block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Kapasitas: {formatRupiah(totalKapasitasSaldo)}
          </span>
        </GlassContainer>
      </div>

      {/* Grid of Budget Cards */}
      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
          const monthlyBudget = b.budgeting || b.targetBulanan || 0;
          const saldoAwal = b.saldoAwal || 0;
          const totalSaldo = b.totalSaldo || saldoAwal + monthlyBudget;
          const actualSpend = b.actualSpend || 0;
          const sisa = b.sisa !== undefined ? b.sisa : totalSaldo - actualSpend;

          // 1. BUDGETING BULANAN (Actual Spend vs Budgeting Bulanan)
          const monthlySpendPct =
            monthlyBudget > 0 ? Number(((actualSpend / monthlyBudget) * 100).toFixed(1)) : 0;
          const isOverMonthly = actualSpend > monthlyBudget && monthlyBudget > 0;
          const monthlyDiff = actualSpend - monthlyBudget; // > 0 = over budget bulanan

          // 2. TOTAL SALDO KANTONG (Actual Spend vs Total Saldo)
          const totalSpendPct =
            totalSaldo > 0 ? Number(((actualSpend / totalSaldo) * 100).toFixed(1)) : 0;
          const isDepleted = sisa <= 0;
          const isWarning = totalSpendPct >= 80 && !isDepleted;

          return (
            <GlassContainer
              key={b.id}
              settings={settings}
              className={`p-5 flex flex-col justify-between transition-all shadow-md relative ${
                isLight ? 'border-slate-200 hover:border-slate-300' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                {/* Header: Icon + Category Name + Account + Edit */}
                <div className={`flex items-start justify-between gap-3 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-2xl shrink-0 border ${
                      isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                    }`}>
                      {getIcon(b.nama)}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`font-bold text-sm sm:text-base truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {b.nama}
                      </h4>
                      <span className={`text-xs block truncate flex items-center gap-1.5 mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        <Wallet className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                        {b.akunTerkait || 'Bank BCA'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className={`p-1.5 rounded-xl border transition cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900'
                          : 'bg-white/5 hover:bg-white/15 border-transparent text-slate-400 hover:text-white'
                      }`}
                      title="Edit Pos Budgeting"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status Badges Header */}
                <div className="flex flex-wrap items-center gap-2 my-3">
                  {/* Status 1: Kuota Bulanan */}
                  {isOverMonthly ? (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      isLight
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-red-950/40 text-red-300 border-red-800'
                    }`}>
                      <AlertTriangle className={`w-3 h-3 ${isLight ? 'text-red-700' : 'text-red-400'}`} />
                      Over Budget (+{formatRupiah(monthlyDiff)})
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      isLight
                        ? 'bg-slate-100 text-slate-800 border-slate-200'
                        : 'bg-white/10 text-slate-200 border-white/15'
                    }`}>
                      <CheckCircle2 className={`w-3 h-3 ${isLight ? 'text-slate-700' : 'text-slate-300'}`} />
                      Budget Aman ({monthlySpendPct}%)
                    </span>
                  )}

                  {/* Status 2: Saldo Kantong Total */}
                  {isDepleted ? (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      isLight
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-red-950/40 text-red-300 border-red-800'
                    }`}>
                      <AlertCircle className={`w-3 h-3 ${isLight ? 'text-red-700' : 'text-red-400'}`} />
                      Saldo Habis
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      isLight
                        ? 'bg-slate-100 text-slate-800 border-slate-200'
                        : 'bg-white/10 text-slate-200 border-white/15'
                    }`}>
                      <ShieldCheck className={`w-3 h-3 ${isLight ? 'text-slate-700' : 'text-slate-300'}`} />
                      Saldo Aman
                    </span>
                  )}
                </div>

                {/* DETAIL RINGKAS DOMPET BUDGETING */}
                <div className="space-y-3 my-3">
                  {/* DETAIL 1: BUDGETING BULANAN */}
                  <div className={`p-3.5 rounded-2xl border space-y-2 ${
                    isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-white/[0.03] border-white/10'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                        Budgeting Bulanan
                      </span>
                      <span className={`font-mono text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        <strong className={isOverMonthly ? (isLight ? 'text-red-800 font-extrabold' : 'text-red-400') : (isLight ? 'text-slate-900 font-bold' : 'text-white')}>
                          {formatRupiah(actualSpend)}
                        </strong>{' '}
                        / {formatRupiah(monthlyBudget)}
                      </span>
                    </div>

                    {/* Progress Bar Detail 1 */}
                    <div className={`w-full h-2 rounded-full overflow-hidden relative ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverMonthly
                            ? 'bg-red-800 dark:bg-red-600'
                            : isLight
                            ? 'bg-slate-900'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${Math.min(100, monthlySpendPct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                        Terpakai: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-slate-200'}>{monthlySpendPct}%</strong>
                      </span>
                      {isOverMonthly ? (
                        <span className={`font-bold ${isLight ? 'text-red-800 font-extrabold' : 'text-red-400'}`}>
                          Over Budget: +{formatRupiah(monthlyDiff)}
                        </span>
                      ) : (
                        <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          Sisa Budget: +{formatRupiah(monthlyBudget - actualSpend)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* DETAIL 2: TOTAL SALDO DOMPET */}
                  <div className={`p-3.5 rounded-2xl border space-y-2 ${
                    isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-white/[0.03] border-white/10'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Total Saldo Dompet
                      </span>
                      <span className={`font-mono text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        Total Saldo: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>{formatRupiah(totalSaldo)}</strong>
                      </span>
                    </div>

                    {/* Breakdown Math: Saldo Awal + Budgeting */}
                    <div className={`flex items-center justify-between text-[11px] px-1 font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span>S. Awal: {formatRupiah(saldoAwal)}</span>
                      <span>+</span>
                      <span>Budget: {formatRupiah(monthlyBudget)}</span>
                      <span>=</span>
                      <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{formatRupiah(totalSaldo)}</span>
                    </div>

                    {/* Progress Bar Detail 2 */}
                    <div className={`w-full h-2 rounded-full overflow-hidden relative ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDepleted
                            ? 'bg-red-700'
                            : isWarning
                            ? 'bg-slate-600'
                            : isLight ? 'bg-slate-900' : 'bg-slate-300'
                        }`}
                        style={{ width: `${Math.min(100, totalSpendPct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                        Terpakai: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-slate-200'}>{totalSpendPct}%</strong>
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Sisa Saldo:</span>
                        <span
                          className={`font-mono font-bold ${
                            isDepleted
                              ? isLight ? 'text-red-700 font-extrabold' : 'text-red-400'
                              : isLight ? 'text-slate-900 font-extrabold' : 'text-white'
                          }`}
                        >
                          {formatRupiah(sisa)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SMART EXPLANATORY CALLOUT (Saran Berhemat & Evaluasi Anggaran Berbasis Data Riil) */}
                {(() => {
                  const cardStatus: 'safe' | 'warning' | 'danger' = isDepleted
                    ? 'danger'
                    : isOverMonthly
                    ? 'warning'
                    : monthlySpendPct >= 80
                    ? 'warning'
                    : 'safe';

                  return (
                    <div
                      className={`p-3.5 rounded-2xl border text-[11px] leading-relaxed mt-3 flex items-start gap-2.5 transition-all shadow-sm ${
                        cardStatus === 'danger'
                          ? isLight
                            ? 'bg-red-50/95 border-red-200 text-red-950'
                            : 'bg-red-950/20 border-red-900/40 text-red-200'
                          : cardStatus === 'warning'
                          ? isLight
                            ? 'bg-slate-100/90 border-slate-200 text-slate-900'
                            : 'bg-white/[0.04] border-white/10 text-slate-200'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-900'
                          : 'bg-white/[0.03] border-white/10 text-slate-200'
                      }`}
                    >
                      {cardStatus === 'danger' ? (
                        <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-red-700' : 'text-red-400'}`} />
                      ) : cardStatus === 'warning' ? (
                        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`} />
                      ) : (
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`} />
                      )}

                      <div className="space-y-1.5 w-full">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <span className={`font-black uppercase tracking-wider text-[10px] flex items-center gap-1 ${
                            cardStatus === 'danger'
                              ? isLight ? 'text-red-950' : 'text-red-300'
                              : isLight ? 'text-slate-900' : 'text-white'
                          }`}>
                            <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                            Saran & Evaluasi Anggaran
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono border ${
                              cardStatus === 'danger'
                                ? isLight
                                ? 'bg-red-100 border-red-200 text-red-950'
                                : 'bg-red-500/20 border-red-500/40 text-red-200'
                              : isOverMonthly
                              ? isLight
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-red-500/15 border-red-500/30 text-red-300'
                              : monthlySpendPct >= 80
                              ? isLight
                                ? 'bg-slate-200 border-slate-300 text-slate-900'
                                : 'bg-white/10 border-white/20 text-slate-200'
                              : isLight
                              ? 'bg-slate-100 border-slate-200 text-slate-800'
                              : 'bg-white/10 border-white/20 text-slate-200'
                            }`}
                          >
                            {cardStatus === 'danger'
                              ? 'Saldo Habis'
                              : isOverMonthly
                              ? `Over Budget (+${formatRupiah(monthlyDiff)})`
                              : monthlySpendPct >= 80
                              ? `Mendekati Limit (${monthlySpendPct}%)`
                              : 'Budget Aman'}
                          </span>
                        </div>

                        {isDepleted ? (
                          <>
                            <p className={isLight ? 'text-slate-800 font-medium' : 'text-slate-200'}>
                              <strong className={isLight ? 'text-red-700 font-bold' : 'text-red-400'}>Kondisi:</strong> Seluruh alokasi dan saldo kantong ini telah terserap penuh (sisa: <strong className={isLight ? 'text-slate-950 font-bold' : 'text-white'}>{formatRupiah(sisa)}</strong>).
                            </p>
                            <p className={`pt-1.5 border-t text-xs font-medium ${
                              isLight ? 'border-red-200 text-red-950' : 'border-white/10 text-red-300/95'
                            }`}>
                              <strong className={isLight ? 'text-red-950 font-bold' : 'text-white'}>Saran:</strong> Segera tunda pengeluaran tambahan pada pos ini atau lakukan pengalihan dari pos surplus lain.
                            </p>
                          </>
                        ) : isOverMonthly ? (
                          <>
                            <p className={isLight ? 'text-slate-800 font-medium' : 'text-slate-200'}>
                              <strong className={isLight ? 'text-red-700 font-bold' : 'text-red-400'}>Peringatan:</strong> Pengeluaran ({formatRupiah(actualSpend)}) telah melampaui jatah bulanan ({formatRupiah(monthlyBudget)}) sebesar +{formatRupiah(monthlyDiff)} ({monthlySpendPct}%). Saldo bulan lalu masih tersisa {formatRupiah(sisa)}.
                            </p>
                            <p className={`pt-1.5 border-t text-xs font-medium ${
                              isLight ? 'border-slate-200 text-slate-800' : 'border-white/10 text-slate-200'
                            }`}>
                              <strong className={isLight ? 'text-slate-950 font-bold' : 'text-white'}>Saran Berhemat:</strong> Disarankan segera mengerem transaksi pos ini agar arus kas tetap terkontrol.
                            </p>
                          </>
                        ) : monthlySpendPct >= 80 ? (
                          <>
                            <p className={isLight ? 'text-slate-800 font-medium' : 'text-slate-200'}>
                              <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>Perhatian:</strong> Serapan kuota telah mencapai {monthlySpendPct}%. Sisa kuota belanja bulanan tersisa {formatRupiah(monthlyBudget - actualSpend)}.
                            </p>
                            <p className={`pt-1.5 border-t text-xs font-medium ${
                              isLight ? 'border-slate-200 text-slate-800' : 'border-white/10 text-slate-200'
                            }`}>
                              <strong className={isLight ? 'text-slate-950 font-bold' : 'text-white'}>Saran:</strong> Batasi belanja diskresioner dan dahulukan kebutuhan pokok hingga akhir bulan.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className={isLight ? 'text-slate-800 font-medium' : 'text-slate-200'}>
                              <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>Disiplin Anggaran:</strong> Penyerapan kas terkendali ({monthlySpendPct}% dari jatah bulanan). Sisa saldo simpanan: <strong className={isLight ? 'text-slate-950 font-bold' : 'text-white'}>{formatRupiah(sisa)}</strong>.
                            </p>
                            <p className={`pt-1.5 border-t text-xs font-medium ${
                              isLight ? 'border-slate-200 text-slate-800' : 'border-white/10 text-slate-200'
                            }`}>
                              <strong className={isLight ? 'text-slate-950 font-bold' : 'text-white'}>Saran:</strong> Pertahankan ritme belanja ini.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </GlassContainer>
          );
        })}
      </div>
      ) : (
        <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] text-center space-y-3">
          <PieChart className="w-10 h-10 mx-auto text-amber-400 opacity-60" />
          <h4 className="text-sm font-bold text-white">Belum Ada Kantong Budget</h4>
          <p className="text-xs max-w-sm mx-auto text-slate-400">
            Alokasikan jatah pengeluaran bulanan (seperti Listrik, Transport, Makan, Hiburan) untuk menjaga arus kas tetap terkontrol.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Kantong Budget</span>
          </button>
        </div>
      )}

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 space-y-4 transition-all ${
            isLight
              ? 'bg-white border border-slate-200 shadow-2xl shadow-slate-900/15 text-slate-800'
              : 'bg-[#0f172a] border border-slate-700 shadow-2xl shadow-black/80 text-white'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <div>
                <h4 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <Pencil className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-sky-400'}`} />
                  Edit Pos Dompet Budgeting
                </h4>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Atur jatah bulanan dan saldo akumulasi awal bulan lalu
                </p>
              </div>
              <button
                onClick={() => setEditingBudget(null)}
                className={`p-1.5 rounded-lg transition ${
                  isLight
                    ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
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
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                      : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20'
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
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                      : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20'
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
                        ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                        : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20'
                    }`}
                    required
                  />
                  <span className={`text-[10px] mt-0.5 block font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Budget tiap bulan
                  </span>
                </div>

                <div>
                  <label className={`block mb-1 font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Saldo Awal Bulan Lalu (Rp):
                  </label>
                  <input
                    type="number"
                    value={formSaldoAwal}
                    onChange={(e) => setFormSaldoAwal(e.target.value)}
                    placeholder="200122"
                    className={`w-full p-2.5 rounded-xl text-xs font-medium transition focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                        : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20'
                    }`}
                  />
                  <span className={`text-[10px] mt-0.5 block font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Carry-over sisa lalu
                  </span>
                </div>
              </div>

              {/* Dynamic Live Calculation Preview in Modal */}
              {(() => {
                const p = parseFloat(formPlafon.replace(/[^0-9.-]/g, '')) || 0;
                const sa = parseFloat(formSaldoAwal.replace(/[^0-9.-]/g, '')) || 0;
                const tot = sa + p;
                const act = editingBudget.actualSpend || 0;
                const rem = tot - act;
                return (
                  <div className={`p-3 rounded-2xl space-y-1.5 text-[11px] ${
                    isLight
                      ? 'bg-slate-50 border border-slate-200'
                      : 'bg-white/5 border border-white/10'
                  }`}>
                    <span className={`font-bold block ${isLight ? 'text-sky-800' : 'text-sky-300'}`}>
                      Kalkulasi Otomatis Dompet:
                    </span>
                    <div className={`flex justify-between ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      <span>Total Saldo (Kapasitas):</span>
                      <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatRupiah(tot)}</span>
                    </div>
                    <div className={`flex justify-between ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      <span>Actual Spend Saat Ini:</span>
                      <span className={`font-mono font-bold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>{formatRupiah(act)}</span>
                    </div>
                    <div className={`flex justify-between pt-1 border-t ${
                      isLight ? 'border-slate-200 text-slate-700' : 'border-white/10 text-slate-300'
                    }`}>
                      <span>Estimasi Sisa Saldo:</span>
                      <span className={`font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{formatRupiah(rem)}</span>
                    </div>
                  </div>
                );
              })()}

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
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-95 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md rounded-3xl p-6 space-y-4 transition-all ${
            isLight
              ? 'bg-white border border-slate-200 shadow-2xl shadow-slate-900/15 text-slate-800'
              : 'bg-[#0f172a] border border-slate-700 shadow-2xl shadow-black/80 text-white'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <h4 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Plus className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                Tambah Pos Budgeting Baru
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className={`p-1.5 rounded-lg transition ${
                  isLight
                    ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
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
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                      : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20'
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
                      ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                      : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20'
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
                        ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                        : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20'
                    }`}
                    required
                  />
                  <span className={`text-[10px] mt-0.5 block font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Budget tiap bulan
                  </span>
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
                        ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                        : 'bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20'
                    }`}
                  />
                  <span className={`text-[10px] mt-0.5 block font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Sisa bulan lalu jika ada
                  </span>
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
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition active:scale-95 cursor-pointer"
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
