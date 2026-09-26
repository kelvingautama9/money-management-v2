import React, { useState, useEffect } from 'react';
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
  Sparkles,
  ArrowRight,
  Bot,
  RefreshCw,
  Cpu,
  Shield,
  Key
} from 'lucide-react';
import {
  BudgetEnvelopesAiResult,
  BudgetPosEvaluation,
  requestBudgetEnvelopesAnalysis,
  requestBudgetEnvelopesAnalysisStream,
  getCachedBudgetAi
} from '../lib/geminiFinancialService';

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
  onDeleteBudget,
  onOpenApiKeyModal
}) => {
  const [editingBudget, setEditingBudget] = useState<BudgetCategory | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [formNama, setFormNama] = useState('');
  const [formPlafon, setFormPlafon] = useState('');
  const [formAkun, setFormAkun] = useState('');
  const [formSaldoAwal, setFormSaldoAwal] = useState('');

  // AI Audit State (Dompet Budgeting)
  const currentMonth = currentSheetName || 'SEPTEMBER';
  const [aiResult, setAiResult] = useState<BudgetEnvelopesAiResult | null>(() => {
    return getCachedBudgetAi(currentMonth);
  });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  const [liveTtft, setLiveTtft] = useState<number | null>(null);
  const [modelUsedName, setModelUsedName] = useState<string>('Gemini 3.5 Flash');

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

  // Run AI Audit on Envelopes (Strictly concise, objective, rational, fact-based)
  const handleRunAiAudit = async (forceRefresh = true) => {
    if (budgets.length === 0) return;
    triggerHaptic('medium');
    setIsAiLoading(true);
    setStreamStatus('Menghubungkan ke Gemini Flash...');
    setLiveTtft(null);

    const summaryMetrics = {
      totalBudgetingBulanan,
      totalSaldoAwal,
      totalActualSpend,
      totalSisaSaldo,
      totalKapasitasSaldo
    };

    try {
      const res = await requestBudgetEnvelopesAnalysisStream(
        currentMonth,
        budgets,
        summaryMetrics,
        (ev) => {
          if (ev.type === 'status' && ev.message) {
            setStreamStatus(ev.message);
          }
          if (ev.type === 'ttft' && ev.ms) {
            setLiveTtft(ev.ms);
            setStreamStatus(`Menerima analisis AI (TTFT: ${ev.ms}ms)...`);
          }
          if (ev.type === 'complete' && ev.data) {
            setAiResult(ev.data);
            if (ev.modelUsed) setModelUsedName(ev.modelUsed);
            setStreamStatus(null);
          }
        }
      );

      if (res) {
        setAiResult(res);
        if (res.modelUsed) setModelUsedName(res.modelUsed);
      }
    } catch (err) {
      console.warn('[BudgetingTracker] AI stream error, requesting standard audit', err);
      const fallback = await requestBudgetEnvelopesAnalysis(currentMonth, budgets, summaryMetrics, forceRefresh);
      setAiResult(fallback);
    } finally {
      setIsAiLoading(false);
      setStreamStatus(null);
    }
  };

  // Auto-load cached AI analysis on month change, or generate if not exists
  useEffect(() => {
    const cached = getCachedBudgetAi(currentMonth);
    if (cached) {
      setAiResult(cached);
    } else if (budgets.length > 0) {
      handleRunAiAudit(false);
    }
  }, [currentMonth]);

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
            <PieChart className={`w-5 h-5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
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
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
          }`}
        >
          <Plus className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
          <span>Tambah Pos Budget</span>
        </button>
      </div>

      {/* AI Dompet Budgeting Action Bar (To-the-point, Objective, Data-backed, Token-compact) */}
      <GlassContainer
        settings={settings}
        className={`p-3.5 sm:p-4 transition-all shadow-md ${
          isLight
            ? 'bg-gradient-to-r from-indigo-50/95 via-sky-50/80 to-white/95 border-indigo-200 text-slate-800 shadow-indigo-100/50'
            : 'border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/50 to-slate-900/30 text-slate-200'
        } backdrop-blur-xl`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${
                isLight
                  ? 'bg-indigo-100 border-indigo-200 text-indigo-700'
                  : 'bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border-indigo-400/30 text-indigo-300'
              }`}
            >
              <Bot className={`w-5 h-5 ${isLight ? 'text-indigo-600' : 'text-indigo-300'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs sm:text-sm font-extrabold tracking-tight flex items-center gap-1.5 ${
                  isLight ? 'text-indigo-950' : 'text-white'
                }`}>
                  AI Financial Auditor: Dompet Budgeting
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}>
                  {modelUsedName}
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                Audit spending dari budget bulanan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            {streamStatus && (
              <span className={`text-[11px] flex items-center gap-1.5 font-mono ${
                isLight ? 'text-amber-800 font-bold' : 'text-amber-300/90'
              }`}>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                {streamStatus}
              </span>
            )}
            <button
              onClick={() => handleRunAiAudit(true)}
              disabled={isAiLoading || budgets.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
            >
              {isAiLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menganalisis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{aiResult ? 'Audit Ulang AI' : 'Audit AI Dompet'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </GlassContainer>

      {/* Aggregate Overview Strip (Detail 1 vs Detail 2 at System Level) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassContainer settings={settings} className={`p-3.5 sm:p-4 ${isLight ? 'border-slate-200/80' : 'border-white/10'}`}>
          <span className={`text-[10px] sm:text-xs font-medium block mb-1 flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <Calendar className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
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
            <Layers className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            Akumulasi S. Awal (Bulan Lalu)
          </span>
          <div className={`text-base sm:text-lg font-bold font-mono ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
            {formatRupiah(totalSaldoAwal)}
          </div>
          <span className={`text-[10px] mt-0.5 block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Sisa saldo simpanan bulan lalu
          </span>
        </GlassContainer>

        <GlassContainer settings={settings} className={`p-3.5 sm:p-4 ${isLight ? 'border-slate-200/80' : 'border-white/10'}`}>
          <span className={`text-[10px] sm:text-xs font-medium block mb-1 flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <TrendingDown className={`w-3.5 h-3.5 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
            Total Pengeluaran
          </span>
          <div className={`text-base sm:text-lg font-bold font-mono ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>
            {formatRupiah(totalActualSpend)}
          </div>
          <span className={`text-[10px] mt-0.5 block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {overallMonthlyPct}% dari total budget bulanan
          </span>
        </GlassContainer>

        <GlassContainer settings={settings} className={`p-3.5 sm:p-4 ${isLight ? 'border-slate-200/80' : 'border-white/10'}`}>
          <span className={`text-[10px] sm:text-xs font-medium block mb-1 flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <ShieldCheck className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
            Total Sisa Saldo Dompet
          </span>
          <div className={`text-base sm:text-lg font-bold font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            {formatRupiah(totalSisaSaldo)}
          </div>
          <span className={`text-[10px] mt-0.5 block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Total kapasitas kas: {formatRupiah(totalKapasitasSaldo)}
          </span>
        </GlassContainer>
      </div>

      {/* Aggregate AI Verdict Summary */}
      {aiResult?.overallVerdict && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border flex items-start gap-3 shadow-sm transition-all ${
            isLight
              ? 'bg-indigo-50/95 border-indigo-200 text-slate-800 shadow-indigo-100/40'
              : 'bg-gradient-to-r from-indigo-500/10 via-blue-50/5 to-transparent border-indigo-500/20 text-slate-200'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              isLight
                ? 'bg-indigo-100 border border-indigo-300 text-indigo-700'
                : 'bg-indigo-500/20 border border-indigo-400/30 text-indigo-300'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
              <span
                className={`font-black text-xs uppercase tracking-wider flex items-center gap-1.5 ${
                  isLight ? 'text-indigo-950' : 'text-indigo-300 font-extrabold'
                }`}
              >
                Rangkuman AI Finansial ({currentMonth})
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                    isLight
                      ? 'text-indigo-900 bg-white border-indigo-300 shadow-xs'
                      : 'text-slate-300 bg-white/5 border-white/10'
                  }`}
                >
                  {aiResult.modelUsed || modelUsedName}
                </span>
                {onOpenApiKeyModal && (
                  <button
                    onClick={onOpenApiKeyModal}
                    className="px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                    title="Kelola API Key Google Gemini (3-in-1)"
                  >
                    <Key className="w-3 h-3 text-amber-500" />
                    <span>API Key (3-in-1)</span>
                  </button>
                )}
              </div>
            </div>
            <p className={`leading-relaxed text-xs ${isLight ? 'text-slate-800 font-medium' : 'text-slate-300'}`}>
              {aiResult.overallVerdict}
            </p>
          </div>
        </div>
      )}

      {/* Grid of Budget Cards */}
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
                        ? 'bg-amber-100 text-amber-950 border-amber-300'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}>
                      <AlertTriangle className={`w-3 h-3 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                      Over Budget (+{formatRupiah(monthlyDiff)})
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      isLight
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}>
                      <CheckCircle2 className={`w-3 h-3 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                      Budget Aman ({monthlySpendPct}%)
                    </span>
                  )}

                  {/* Status 2: Saldo Kantong Total */}
                  {isDepleted ? (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      isLight
                        ? 'bg-rose-100 text-rose-950 border-rose-300'
                        : 'bg-rose-600/20 text-rose-300 border-rose-600/30'
                    }`}>
                      <AlertCircle className={`w-3 h-3 ${isLight ? 'text-rose-700' : 'text-rose-400'}`} />
                      Saldo Habis
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      isLight
                        ? 'bg-blue-100 text-blue-950 border-blue-300'
                        : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                    }`}>
                      <ShieldCheck className={`w-3 h-3 ${isLight ? 'text-blue-700' : 'text-blue-400'}`} />
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
                        <strong className={isOverMonthly ? (isLight ? 'text-amber-800 font-extrabold' : 'text-amber-400') : (isLight ? 'text-slate-900 font-bold' : 'text-white')}>
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
                            ? 'bg-amber-500'
                            : monthlySpendPct > 80
                            ? 'bg-amber-500'
                            : 'bg-gradient-to-r from-blue-500 to-sky-400'
                        }`}
                        style={{ width: `${Math.min(100, monthlySpendPct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                        Terpakai: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-slate-200'}>{monthlySpendPct}%</strong>
                      </span>
                      {isOverMonthly ? (
                        <span className={`font-bold ${isLight ? 'text-amber-800 font-extrabold' : 'text-amber-400'}`}>
                          Over Budget: +{formatRupiah(monthlyDiff)}
                        </span>
                      ) : (
                        <span className={`font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
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
                            ? 'bg-rose-600'
                            : isWarning
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
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
                              ? isLight ? 'text-rose-700 font-extrabold' : 'text-rose-400'
                              : isLight ? 'text-emerald-700 font-extrabold' : 'text-emerald-400'
                          }`}
                        >
                          {formatRupiah(sisa)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SMART EXPLANATORY CALLOUT (Evaluasi AI Objektif & Fakta Akurat Sesuai Permintaan User) */}
                {(() => {
                  const posAi = aiResult?.posEvaluations?.[b.id] || aiResult?.posEvaluations?.[b.nama];
                  // WAJIB Berikan peringatan jika belanja melebihi budget bulanan, walaupun total saldo masih mencover
                  const cardStatus: 'safe' | 'warning' | 'danger' = isDepleted
                    ? 'danger'
                    : isOverMonthly
                    ? 'warning'
                    : posAi
                    ? posAi.status
                    : 'safe';

                  return (
                    <div
                      className={`p-3.5 rounded-2xl border text-[11px] leading-relaxed mt-3 flex items-start gap-2.5 transition-all shadow-sm ${
                        cardStatus === 'warning'
                          ? isLight
                            ? 'bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-100/40'
                            : 'bg-amber-500/10 border-amber-500/25 text-amber-200/90'
                          : cardStatus === 'danger'
                          ? isLight
                            ? 'bg-rose-50/95 border-rose-300 text-rose-950 shadow-rose-100/40'
                            : 'bg-rose-500/10 border-rose-500/25 text-rose-200/90'
                          : isLight
                          ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-100/40'
                          : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200/90'
                      }`}
                    >
                      {cardStatus === 'danger' ? (
                        <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-rose-700' : 'text-rose-400'}`} />
                      ) : cardStatus === 'warning' ? (
                        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                      ) : (
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                      )}

                      <div className="space-y-1.5 w-full">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <span className={`font-black uppercase tracking-wider text-[10px] flex items-center gap-1 ${
                            cardStatus === 'warning'
                              ? isLight ? 'text-amber-950' : 'text-amber-300'
                              : cardStatus === 'danger'
                              ? isLight ? 'text-rose-950' : 'text-rose-300'
                              : isLight ? 'text-emerald-950' : 'text-emerald-300'
                          }`}>
                            <Sparkles className={`w-3 h-3 shrink-0 ${
                              cardStatus === 'warning'
                                ? isLight ? 'text-amber-700' : 'text-amber-400'
                                : cardStatus === 'danger'
                                ? isLight ? 'text-rose-700' : 'text-rose-400'
                                : isLight ? 'text-emerald-700' : 'text-emerald-400'
                            }`} />
                            AI Financial Diagnosis
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono border ${
                              cardStatus === 'danger'
                                ? isLight
                                  ? 'bg-rose-100 border-rose-300 text-rose-950'
                                  : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                                : cardStatus === 'warning'
                                ? isLight
                                  ? 'bg-amber-100 border-amber-300 text-amber-950'
                                  : 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                                : isLight
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
                                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                            }`}
                          >
                            {cardStatus === 'danger'
                              ? 'Saldo Habis'
                              : cardStatus === 'warning'
                              ? `⚠️ Peringatan: Over Budget (+${formatRupiah(monthlyDiff)})`
                              : 'Budget & Saldo Aman'}
                          </span>
                        </div>

                        {posAi ? (
                          <>
                            <p className={isLight ? 'text-slate-800 font-medium' : 'text-slate-200'}>
                              <strong className={isLight ? 'text-slate-950 font-bold' : 'text-white'}>Diagnosis:</strong>{' '}
                              {isOverMonthly && !posAi.diagnosis.toLowerCase().includes('peringatan') ? (
                                <span>
                                  <strong className={isLight ? 'text-amber-800 font-bold' : 'text-amber-300'}>Peringatan:</strong> Pengeluaran {formatRupiah(actualSpend)} melebihi budget bulanan {formatRupiah(monthlyBudget)} sebesar +{formatRupiah(monthlyDiff)}. Walaupun saldo dari bulan lalu masih menutup dengan sisa saldo {formatRupiah(sisa)}, belanja perlu dikontrol agar cadangan saldo tidak terus tergerus.
                                </span>
                              ) : (
                                posAi.diagnosis
                              )}
                            </p>
                            {posAi.rekomendasi && (
                              <p className={`pt-1.5 border-t text-xs font-medium ${
                                isLight
                                  ? 'border-slate-200 text-slate-800'
                                  : 'border-white/10 text-slate-200'
                              }`}>
                                <strong className={isLight ? 'text-slate-950 font-bold' : 'text-white'}>Rekomendasi:</strong> {posAi.rekomendasi}
                              </p>
                            )}
                          </>
                        ) : isOverMonthly && !isDepleted ? (
                          <>
                            <p className={isLight ? 'text-slate-800 font-medium' : 'text-slate-200'}>
                              <strong className={isLight ? 'text-amber-800 font-bold' : 'text-amber-300'}>Peringatan:</strong> Pengeluaran ({formatRupiah(actualSpend)}) melebihi budget bulanan ({formatRupiah(monthlyBudget)}) sebesar +{formatRupiah(monthlyDiff)} ({((monthlyDiff / (monthlyBudget || 1)) * 100).toFixed(1)}%). Walaupun sisa saldo bulan lalu ({formatRupiah(saldoAwal)}) masih mencukupi dengan sisa saldo {formatRupiah(sisa)}, pengeluaran harus dikontrol agar cadangan saldo tidak terus tergerus.
                            </p>
                            <p className={`pt-1.5 border-t text-xs font-medium ${
                              isLight
                                ? 'border-amber-200 text-amber-950'
                                : 'border-white/10 text-amber-300/95'
                            }`}>
                              <strong className={isLight ? 'text-amber-950 font-bold' : 'text-white'}>Rekomendasi:</strong> Batasi pengeluaran pos ini pada bulan berikutnya agar tidak menggerus akumulasi saldo dompet.
                            </p>
                          </>
                        ) : isDepleted ? (
                          <>
                            <p className={isLight ? 'text-slate-800 font-medium' : 'text-slate-200'}>
                              <strong className={isLight ? 'text-rose-800 font-bold' : 'text-rose-400'}>Peringatan:</strong> Seluruh kapasitas saldo dan alokasi periode ini telah terserap penuh (defisit). Sisa saldo: <strong className={isLight ? 'text-slate-950 font-bold' : 'text-white'}>{formatRupiah(sisa)}</strong>.
                            </p>
                            <p className={`pt-1.5 border-t text-xs font-medium ${
                              isLight
                                ? 'border-rose-200 text-rose-950'
                                : 'border-white/10 text-rose-300/95'
                            }`}>
                              <strong className={isLight ? 'text-rose-950 font-bold' : 'text-white'}>Rekomendasi:</strong> Lakukan rebalancing darurat dari pos surplus lain atau tunda pengeluaran diskresioner hingga siklus alokasi berikutnya.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className={isLight ? 'text-slate-800 font-medium' : 'text-slate-200'}>
                              <strong className={isLight ? 'text-emerald-800 font-bold' : 'text-emerald-400'}>Disiplin Anggaran:</strong> Penyerapan kas terkendali aman ({monthlySpendPct}% dari budget bulanan). Cadangan saldo terjaga stabil dengan sisa saldo: <strong className={isLight ? 'text-slate-950 font-bold' : 'text-white'}>{formatRupiah(sisa)}</strong>.
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
