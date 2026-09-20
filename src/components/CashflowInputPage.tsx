import React, { useState } from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassButton } from './GlassButton';
import {
  Transaction,
  GlassSettings,
  TransactionType
} from '../types';
import {
  AVAILABLE_CATEGORIES,
  AVAILABLE_ACCOUNTS
} from '../data/initialData';
import { formatRupiah } from '../lib/sheetsApi';
import {
  SHEET_MONTHS,
  normalizeMonthTitleCase,
  getCategoryStyle,
  getAccountStyle,
  getTypeStyle
} from '../lib/sheetStyles';
import { triggerHaptic } from '../lib/haptics';
import { useSwipeScroll } from '../lib/useSwipeScroll';
import {
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  CheckCircle2,
  Calendar,
  Wallet,
  Sparkles,
  Zap,
  Film,
  Compass,
  Heart,
  ShoppingBag,
  DollarSign,
  Coffee,
  HelpCircle,
  Send,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CashflowInputPageProps {
  settings: GlassSettings;
  onAddTransaction: (tx: Omit<Transaction, 'id'>, autoSync: boolean) => Promise<void>;
  transactions: Transaction[];
  isSyncing?: boolean;
  isGoogleConnected: boolean;
  onNavigateToJournal: () => void;
  currentSheetName?: string;
  onSelectMonth?: (month: string) => void;
  availableSheets?: string[];
}

export const CashflowInputPage: React.FC<CashflowInputPageProps> = ({
  settings,
  onAddTransaction,
  transactions,
  isSyncing = false,
  isGoogleConnected,
  onNavigateToJournal,
  currentSheetName = 'September',
  onSelectMonth,
  availableSheets = []
}) => {
  // Form state
  const [selectedType, setSelectedType] = useState<TransactionType>('Expense');
  const [selectedCategory, setSelectedCategory] = useState<string>('Jajan');
  const [selectedAccount, setSelectedAccount] = useState<string>('Bank BCA');
  const [bulan, setBulan] = useState<string>(currentSheetName);
  const [nominal, setNominal] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [autoSyncToSheets, setAutoSyncToSheets] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRecentStream, setShowRecentStream] = useState<boolean>(false);

  const chipsRef = useSwipeScroll<HTMLDivElement>();

  // Synchronize bulan state when currentSheetName changes
  React.useEffect(() => {
    if (currentSheetName) {
      setBulan(currentSheetName);
    }
  }, [currentSheetName]);

  // Quick Amount chips
  const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2000000];

  const handleAddQuickAmount = (val: number) => {
    triggerHaptic('light');
    const current = parseFloat(nominal.replace(/[^0-9.-]/g, '')) || 0;
    setNominal((current + val).toString());
  };

  const getCategoryIcon = (kat: string) => {
    switch (kat) {
      case 'Salary':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'Listrik':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'Entertainment':
        return <Film className="w-4 h-4 text-purple-400" />;
      case 'Transport':
        return <Compass className="w-4 h-4 text-cyan-400" />;
      case 'Dating':
        return <Heart className="w-4 h-4 text-pink-400" />;
      case 'Jajan':
        return <Coffee className="w-4 h-4 text-rose-400" />;
      case 'Uang Bulanan':
        return <ShoppingBag className="w-4 h-4 text-blue-400" />;
      case 'Transfer Internal':
        return <ArrowRightLeft className="w-4 h-4 text-indigo-400" />;
      default:
        return <Wallet className="w-4 h-4 text-slate-400" />;
    }
  };

  // Smart auto account match when category changes
  const handleSelectCategory = (kat: string) => {
    triggerHaptic('selection');
    setSelectedCategory(kat);
    if (kat === 'Listrik') setSelectedAccount('Allo Bank');
    else if (kat === 'Transport') setSelectedAccount('Jago-Transport');
    else if (kat === 'Entertainment') setSelectedAccount('Jago-Entertainment');
    else if (kat === 'Dating') setSelectedAccount('Blu BCA - Date');
    else if (kat === 'Salary') {
      setSelectedAccount('Bank BCA');
      setSelectedType('Income');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(nominal.replace(/[^0-9.-]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      triggerHaptic('warning');
      alert('Mohon masukkan nominal angka yang valid.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddTransaction(
        {
          bulan: normalizeMonthTitleCase(bulan),
          kategori: selectedCategory,
          akun: selectedAccount,
          tipe: selectedType,
          jumlah: amount,
          catatan: catatan || `${selectedCategory} (${selectedAccount})`
        },
        autoSyncToSheets
      );

      triggerHaptic('success');
      setSuccessMessage(
        `Sukses mencatat ${formatRupiah(amount)} ke "${selectedCategory}"!`
      );

      // Reset form fields
      setNominal('');
      setCatatan('');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      triggerHaptic('error');
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const recentTransactions = transactions.slice(0, 5);
  const numericNominal = parseFloat(nominal.replace(/[^0-9.-]/g, '')) || 0;

  return (
    <div className="w-full max-w-xl mx-auto px-2 sm:px-4 py-2 space-y-4">
      {/* Top Banner Alert */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-between text-xs text-emerald-200 animate-in fade-in duration-300 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-300 hover:text-white px-2 py-0.5 rounded-lg hover:bg-emerald-500/20 text-xs"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Centered Apple-Style Card */}
      <GlassContainer settings={settings} className="p-5 sm:p-7 relative shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Input Transaksi
              </h2>
              <span className="text-[11px] text-slate-400 block">
                Tab Aktif: <strong className="text-blue-300">{bulan}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                isGoogleConnected
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isGoogleConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {isGoogleConnected ? 'Sync Sheets' : 'Lokal'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 1. Apple-Style Segmented Type Switcher */}
          <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/10 grid grid-cols-4 gap-1">
            {(
              [
                { id: 'Expense', label: 'Pengeluaran', icon: <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" /> },
                { id: 'Income', label: 'Pemasukan', icon: <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> },
                { id: 'Transfer Keluar', label: 'Out', icon: <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" /> },
                { id: 'Transfer Masuk', label: 'In', icon: <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" /> }
              ] as const
            ).map((item) => {
              const isSelected = selectedType === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedType(item.id);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isSelected
                      ? 'bg-white/20 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* 2. Apple Pay Centerpiece Hero Amount */}
          <div className="py-2 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Nominal Transaksi (Rp)
            </span>
            <div className="relative inline-flex items-center justify-center w-full">
              <span className="text-xl sm:text-2xl font-bold text-slate-400 mr-2">Rp</span>
              <input
                type="number"
                required
                autoFocus
                placeholder="0"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                className="w-48 sm:w-64 text-center py-1.5 bg-transparent border-b-2 border-white/20 focus:border-blue-400 text-3xl sm:text-4xl font-mono font-black text-white outline-none tracking-tight transition"
              />
            </div>

            {/* Quick Amount Chips with Horizontal Swipe / Drag */}
            <div
              ref={chipsRef}
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 mt-2 px-1 justify-start sm:justify-center cursor-grab active:cursor-grabbing"
            >
              {quickAmounts.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => handleAddQuickAmount(amt)}
                  className="shrink-0 px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.15] text-slate-300 hover:text-white text-xs font-mono border border-white/10 transition active:scale-95 whitespace-nowrap"
                >
                  +{amt >= 1000000 ? `${amt / 1000000}Jt` : `${amt / 1000}K`}
                </button>
              ))}
              {numericNominal > 0 && (
                <button
                  type="button"
                  onClick={() => setNominal('')}
                  className="shrink-0 px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 text-xs border border-rose-500/25 transition whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* 3. Compact Two-Column Row: Kategori & Akun with Google Sheet Visual Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400 block">
                  Kategori Pos (Google Sheet)
                </label>
                {/* Chip Preview */}
                <span
                  style={{
                    backgroundColor: getCategoryStyle(selectedCategory).rawBg,
                    color: getCategoryStyle(selectedCategory).rawText
                  }}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm"
                >
                  <span>{selectedCategory}</span>
                  <span className="text-[8px] opacity-70">▼</span>
                </span>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => handleSelectCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs liquid-glass-input cursor-pointer"
              >
                {AVAILABLE_CATEGORIES.map((kat) => (
                  <option key={kat} value={kat} className="bg-slate-900 text-white">
                    {kat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400 block">
                  Rekening / Dompet (Google Sheet)
                </label>
                {/* Chip Preview */}
                <span
                  style={{
                    backgroundColor: getAccountStyle(selectedAccount).rawBg,
                    color: getAccountStyle(selectedAccount).rawText
                  }}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm"
                >
                  <span>{selectedAccount}</span>
                  <span className="text-[8px] opacity-70">▼</span>
                </span>
              </div>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs liquid-glass-input cursor-pointer"
              >
                {AVAILABLE_ACCOUNTS.map((acc) => (
                  <option key={acc} value={acc} className="bg-slate-900 text-white">
                    {acc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Bulan Periode & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Periode Bulan (Sheet Dropdown)
              </label>
              <select
                value={normalizeMonthTitleCase(bulan)}
                onChange={(e) => setBulan(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs liquid-glass-input cursor-pointer"
              >
                {SHEET_MONTHS.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Catatan / Keterangan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Makan Siang, Bensin, Kopi..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input"
              />
            </div>
          </div>

          {/* Auto Sync Toggle & Direct Primary Action Button */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={autoSyncToSheets}
                  onChange={(e) => setAutoSyncToSheets(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-500 focus:ring-0 cursor-pointer accent-blue-500"
                />
                <span className="text-[11px]">Auto-sync baris ke Google Sheets</span>
              </label>

              <button
                type="button"
                onClick={onNavigateToJournal}
                className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
              >
                Buka Jurnal
              </button>
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting || numericNominal <= 0}
              settings={settings}
              className="w-full justify-center text-sm font-bold shadow-xl py-3"
              icon={
                isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )
              }
            >
              {isSubmitting
                ? 'Menyinkronkan...'
                : numericNominal > 0
                ? `Simpan ${selectedType} (${formatRupiah(numericNominal)})`
                : 'Simpan Transaksi'}
            </GlassButton>
          </div>
        </form>
      </GlassContainer>

      {/* Collapsible Recent Transactions Stream */}
      <GlassContainer settings={settings} className="p-4">
        <button
          type="button"
          onClick={() => setShowRecentStream(!showRecentStream)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Aliran Transaksi Terakhir ({recentTransactions.length})</span>
          </div>
          {showRecentStream ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showRecentStream && (
          <div className="space-y-2 mt-3 pt-3 border-t border-white/10 animate-in fade-in duration-200">
            {recentTransactions.length === 0 ? (
              <p className="text-center py-2 text-xs text-slate-400">Belum ada transaksi di bulan ini.</p>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      {getCategoryIcon(tx.kategori)}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-white block truncate">
                        {tx.catatan || tx.kategori}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          style={{
                            backgroundColor: getCategoryStyle(tx.kategori).rawBg,
                            color: getCategoryStyle(tx.kategori).rawText
                          }}
                          className="text-[9px] font-medium px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5"
                        >
                          {tx.kategori}
                        </span>
                        <span
                          style={{
                            backgroundColor: getAccountStyle(tx.akun).rawBg,
                            color: getAccountStyle(tx.akun).rawText
                          }}
                          className="text-[9px] font-medium px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5"
                        >
                          {tx.akun}
                        </span>
                        {tx.rowIndex && (
                          <span className="text-[9px] font-mono text-slate-400">
                            #{tx.rowIndex}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`font-mono font-bold shrink-0 ml-2 ${
                      tx.tipe === 'Income'
                        ? 'text-emerald-400'
                        : tx.tipe === 'Expense'
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {tx.tipe === 'Expense' ? '-' : '+'}
                    {formatRupiah(tx.jumlah)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </GlassContainer>
    </div>
  );
};
