import React, { useState, useMemo } from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassButton } from './GlassButton';
import { ConfirmationModal } from './ConfirmationModal';
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
  Zap,
  Film,
  Compass,
  Heart,
  ShoppingBag,
  DollarSign,
  Coffee,
  Send,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  ArrowUpDown,
  ListOrdered,
  X
} from 'lucide-react';

interface CashflowInputPageProps {
  settings: GlassSettings;
  onAddTransaction: (tx: Omit<Transaction, 'id'>, autoSync: boolean) => Promise<void>;
  transactions: Transaction[];
  onEditTransaction?: (tx: Transaction) => Promise<void>;
  onDeleteTransaction?: (id: string) => Promise<void>;
  onSyncGoogleSheet?: () => void;
  isSyncing?: boolean;
  isGoogleConnected: boolean;
  onNavigateToJournal?: () => void;
  currentSheetName?: string;
  onSelectMonth?: (month: string) => void;
  availableSheets?: string[];
}

export const CashflowInputPage: React.FC<CashflowInputPageProps> = ({
  settings,
  onAddTransaction,
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  onSyncGoogleSheet,
  isSyncing = false,
  isGoogleConnected,
  currentSheetName = 'September',
  onSelectMonth,
  availableSheets = []
}) => {
  // Navigation between Fast Input & Full Mutasi Ledger
  const [activeTab, setActiveTab] = useState<'input' | 'mutasi'>('input');

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
  const [showRecentStream, setShowRecentStream] = useState<boolean>(true);

  // Ledger Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [filterAkun, setFilterAkun] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'sheet' | 'newest'>('sheet');

  // Edit & Delete Modals
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  const chipsRef = useSwipeScroll<HTMLDivElement>();

  React.useEffect(() => {
    if (currentSheetName) {
      setBulan(currentSheetName);
    }
  }, [currentSheetName]);

  const isLight = settings.themeMode === 'light' || settings.themeMode === 'beige';
  const isDark = !isLight;

  // Macro Metrics for Cashflow
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.tipe === 'Income')
      .reduce((sum, t) => sum + t.jumlah, 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter((t) => t.tipe === 'Expense')
      .reduce((sum, t) => sum + t.jumlah, 0);
  }, [transactions]);

  const totalTransfers = useMemo(() => {
    return transactions
      .filter((t) => t.tipe === 'Transfer Keluar' || t.tipe === 'Transfer Masuk')
      .reduce((sum, t) => sum + t.jumlah, 0);
  }, [transactions]);

  const freeCashflow = totalIncome - totalExpense;

  // Filtered transactions for the ledger view
  const filteredTransactions = useMemo(() => {
    const list = transactions.filter((tx) => {
      const matchSearch =
        (tx.catatan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.kategori || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.akun || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = filterType === 'all' || tx.tipe === filterType;
      const matchKat = filterKategori === 'all' || tx.kategori === filterKategori;
      const matchAkun = filterAkun === 'all' || tx.akun === filterAkun;

      return matchSearch && matchType && matchKat && matchAkun;
    });

    return list.sort((a, b) => {
      if (sortOrder === 'sheet') {
        const rowA = a.rowIndex !== undefined ? a.rowIndex : 999999;
        const rowB = b.rowIndex !== undefined ? b.rowIndex : 999999;
        return rowA - rowB;
      } else {
        const rowA = a.rowIndex !== undefined ? a.rowIndex : 0;
        const rowB = b.rowIndex !== undefined ? b.rowIndex : 0;
        return rowB - rowA;
      }
    });
  }, [transactions, searchQuery, filterType, filterKategori, filterAkun, sortOrder]);

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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !onEditTransaction) return;
    try {
      setIsSubmitting(true);
      await onEditTransaction(editingTx);
      triggerHaptic('success');
      setEditingTx(null);
      setSuccessMessage(`Transaksi "${editingTx.catatan}" berhasil diperbarui!`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(`Gagal memperbarui transaksi: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTx || !onDeleteTransaction) return;
    try {
      setIsSubmitting(true);
      await onDeleteTransaction(deletingTx.id);
      triggerHaptic('success');
      setSuccessMessage(`Transaksi "${deletingTx.catatan}" berhasil dihapus.`);
      setDeletingTx(null);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(`Gagal menghapus transaksi: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('Tidak ada transaksi untuk diekspor.');
      return;
    }
    triggerHaptic('medium');
    const headers = ['Row', 'Bulan', 'Kategori', 'Akun', 'Tipe', 'Nominal (Rp)', 'Catatan'];
    const rows = transactions.map((t) => [
      t.rowIndex || '-',
      t.bulan,
      `"${t.kategori.replace(/"/g, '""')}"`,
      `"${t.akun.replace(/"/g, '""')}"`,
      t.tipe,
      t.jumlah,
      `"${(t.catatan || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mutasi_${currentSheetName.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const recentTransactions = transactions.slice(0, 5);
  const numericNominal = parseFloat(nominal.replace(/[^0-9.-]/g, '')) || 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 space-y-4">
      {/* 1. Macro Cashflow Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Pemasukan */}
        <div className={`p-3 sm:p-4 rounded-2xl border text-left transition-all ${
          isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-3 h-3" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Pemasukan
            </span>
          </div>
          <span className={`text-sm sm:text-base font-black truncate block ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            {formatRupiah(totalIncome)}
          </span>
        </div>

        {/* Pengeluaran */}
        <div className={`p-3 sm:p-4 rounded-2xl border text-left transition-all ${
          isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-3 h-3" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Pengeluaran
            </span>
          </div>
          <span className={`text-sm sm:text-base font-black truncate block ${isDark ? 'text-red-400' : 'text-red-700'}`}>
            {formatRupiah(totalExpense)}
          </span>
        </div>

        {/* Transfer / Mutasi */}
        <div className={`p-3 sm:p-4 rounded-2xl border text-left transition-all ${
          isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
              isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}>
              <ArrowRightLeft className="w-3 h-3" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Mutasi Internal
            </span>
          </div>
          <span className={`text-sm sm:text-base font-black truncate block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {formatRupiah(totalTransfers)}
          </span>
        </div>

        {/* Arus Kas Bebas */}
        <div className={`p-3 sm:p-4 rounded-2xl border text-left transition-all ${
          isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
              freeCashflow >= 0
                ? isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'
                : 'bg-red-500/15 text-red-500'
            }`}>
              <Wallet className="w-3 h-3" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Arus Kas Bersih
            </span>
          </div>
          <span className={`text-sm sm:text-base font-black truncate block ${
            freeCashflow >= 0
              ? isDark ? 'text-white' : 'text-slate-900'
              : isDark ? 'text-red-400' : 'text-red-700'
          }`}>
            {formatRupiah(freeCashflow)}
          </span>
        </div>
      </div>

      {/* 2. Top Segmented Tab Switcher (Input Cepat vs Riwayat Mutasi) */}
      <div className={`p-1.5 rounded-2xl flex items-center gap-1.5 border ${
        isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-white/[0.05] border-white/10'
      }`}>
        <button
          onClick={() => {
            triggerHaptic('selection');
            setActiveTab('input');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'input'
              ? isLight
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/20 text-white shadow-md border border-white/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-emerald-500" />
          <span>+ Input Transaksi Cepat</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('selection');
            setActiveTab('mutasi');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'mutasi'
              ? isLight
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/20 text-white shadow-md border border-white/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListOrdered className="w-4 h-4 text-blue-500" />
          <span>Daftar Mutasi & Riwayat ({transactions.length})</span>
        </button>
      </div>

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

      {/* TAB 1: FORM INPUT CEPAT */}
      {activeTab === 'input' && (
        <div className="space-y-4">
          <GlassContainer settings={settings} className={`p-5 sm:p-7 relative shadow-2xl ${isLight ? 'border-slate-200' : ''}`}>
            <div className={`flex items-center justify-between pb-4 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Input Transaksi
                  </h2>
                  <span className={`text-[11px] block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Tab Aktif: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-slate-200'}>{bulan}</strong>
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Type Switcher */}
              <div
                className={`p-1.5 rounded-2xl grid grid-cols-4 gap-1.5 transition-all shadow-inner border ${
                  isLight
                    ? 'bg-slate-100/90 border-slate-300/90'
                    : 'bg-slate-900/80 border-white/10'
                }`}
              >
                {(
                  [
                    {
                      id: 'Expense',
                      label: 'Pengeluaran',
                      icon: ArrowDownLeft,
                      activeLight: 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-600/30',
                      activeDark: 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/40',
                      idleIconLight: 'text-rose-600',
                      idleIconDark: 'text-rose-400'
                    },
                    {
                      id: 'Income',
                      label: 'Pemasukan',
                      icon: ArrowUpRight,
                      activeLight: 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/30',
                      activeDark: 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/40',
                      idleIconLight: 'text-emerald-600',
                      idleIconDark: 'text-emerald-400'
                    },
                    {
                      id: 'Transfer Keluar',
                      label: 'Transfer Out',
                      icon: ArrowRightLeft,
                      activeLight: 'bg-slate-800 text-white border-slate-900 shadow-md',
                      activeDark: 'bg-slate-700 text-white border-slate-600 shadow-md',
                      idleIconLight: 'text-slate-700',
                      idleIconDark: 'text-slate-300'
                    },
                    {
                      id: 'Transfer Masuk',
                      label: 'Transfer In',
                      icon: ArrowRightLeft,
                      activeLight: 'bg-sky-600 text-white border-sky-700 shadow-md shadow-sky-600/30',
                      activeDark: 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/40',
                      idleIconLight: 'text-sky-600',
                      idleIconDark: 'text-sky-400'
                    }
                  ] as const
                ).map((item) => {
                  const isSelected = selectedType === item.id;
                  const IconComp = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        triggerHaptic('selection');
                        setSelectedType(item.id);
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl text-xs transition-all duration-200 cursor-pointer border ${
                        isSelected
                          ? isLight
                            ? `${item.activeLight} font-bold scale-[1.02]`
                            : `${item.activeDark} font-bold scale-[1.02]`
                          : isLight
                          ? 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-950 border-slate-300/70 font-semibold'
                          : 'bg-slate-800/40 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border-transparent font-medium'
                      }`}
                    >
                      <IconComp
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected
                            ? item.id === 'Transfer Keluar' && !isLight
                              ? 'text-slate-950'
                              : 'text-white'
                            : isLight
                            ? item.idleIconLight
                            : item.idleIconDark
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Nominal Transaksi */}
              <div className="py-2 text-center">
                <span className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
                  isLight ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  Nominal Transaksi (Rp)
                </span>
                <div className="relative inline-flex items-center justify-center w-full">
                  <span className={`text-xl sm:text-2xl font-bold mr-2 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    autoFocus
                    placeholder="0"
                    value={nominal}
                    onChange={(e) => setNominal(e.target.value)}
                    className={`w-48 sm:w-64 text-center py-1.5 bg-transparent border-b-2 text-3xl sm:text-4xl font-mono font-black outline-none tracking-tight transition ${
                      isLight
                        ? 'text-slate-900 border-slate-300 focus:border-blue-600'
                        : 'text-white border-white/20 focus:border-blue-400'
                    }`}
                  />
                </div>

                {/* Quick Amount Chips */}
                <div
                  ref={chipsRef}
                  className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 mt-2 px-1 justify-start sm:justify-center cursor-grab active:cursor-grabbing"
                >
                  {quickAmounts.map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => handleAddQuickAmount(amt)}
                      className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-mono border transition active:scale-95 whitespace-nowrap cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 font-semibold'
                          : 'bg-white/[0.06] hover:bg-white/[0.15] text-slate-300 hover:text-white border-white/10'
                      }`}
                    >
                      +{amt >= 1000000 ? `${amt / 1000000}Jt` : `${amt / 1000}K`}
                    </button>
                  ))}
                  {numericNominal > 0 && (
                    <button
                      type="button"
                      onClick={() => setNominal('')}
                      className={`shrink-0 px-2.5 py-1 rounded-xl text-xs border transition whitespace-nowrap cursor-pointer ${
                        isLight
                          ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300 font-bold'
                          : 'bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border-rose-500/25'
                      }`}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Kategori & Akun */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-[11px] font-bold block ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                      Kategori Pos (Google Sheet)
                    </label>
                    <span
                      style={{
                        backgroundColor: getCategoryStyle(selectedCategory).rawBg,
                        color: getCategoryStyle(selectedCategory).rawText
                      }}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm"
                    >
                      <span>{selectedCategory}</span>
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
                    <label className={`text-[11px] font-bold block ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                      Rekening / Dompet (Google Sheet)
                    </label>
                    <span
                      style={{
                        backgroundColor: getAccountStyle(selectedAccount).rawBg,
                        color: getAccountStyle(selectedAccount).rawText
                      }}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm"
                    >
                      <span>{selectedAccount}</span>
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

              {/* Periode & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`text-[11px] font-bold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                    Periode Bulan
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
                  <label className={`text-[11px] font-bold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                    Catatan / Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Makan Siang, Bensin, Kopi, Bayar Listrik..."
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs liquid-glass-input"
                  />
                </div>
              </div>

              {/* Submit & Auto-sync */}
              <div className={`pt-3 border-t space-y-3 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <div className="flex items-center justify-between text-xs">
                  <label className={`flex items-center gap-2 cursor-pointer select-none ${isLight ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
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
                    onClick={() => setActiveTab('mutasi')}
                    className={`text-xs underline font-semibold cursor-pointer ${isLight ? 'text-blue-700 hover:text-blue-900' : 'text-blue-400 hover:text-blue-300'}`}
                  >
                    Buka Riwayat Mutasi ({transactions.length})
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

          {/* Quick Recent Activity Stream */}
          <GlassContainer settings={settings} className={`p-4 ${isLight ? 'border-slate-200' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  5 Mutasi Terakhir Bulan Ini
                </span>
              </div>
              <button
                onClick={() => setActiveTab('mutasi')}
                className={`text-xs font-semibold hover:underline ${isLight ? 'text-blue-700' : 'text-blue-400'}`}
              >
                Lihat Semua ({transactions.length}) →
              </button>
            </div>

            <div className="space-y-2 mt-3 pt-3 border-t border-white/10">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Belum ada transaksi di bulan ini. Masukkan transaksi di form atas untuk memulai.
                </div>
              ) : (
                recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-2.5 rounded-xl flex items-center justify-between text-xs border ${
                      isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-white/[0.03] border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isLight ? 'bg-white border border-slate-200' : 'bg-white/5'
                      }`}>
                        {getCategoryIcon(tx.kategori)}
                      </div>
                      <div className="min-w-0">
                        <span className={`font-bold block truncate ${isLight ? 'text-slate-900' : 'text-white font-semibold'}`}>
                          {tx.catatan || tx.kategori}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-400 font-medium">
                            {tx.kategori}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {tx.akun}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`font-mono font-bold shrink-0 ml-2 ${
                        tx.tipe === 'Income'
                          ? isLight ? 'text-emerald-700 font-extrabold' : 'text-emerald-400'
                          : tx.tipe === 'Expense'
                          ? isLight ? 'text-red-700 font-extrabold' : 'text-red-400'
                          : isLight ? 'text-slate-800' : 'text-slate-300'
                      }`}
                    >
                      {tx.tipe === 'Expense' ? '-' : '+'}
                      {formatRupiah(tx.jumlah)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </GlassContainer>
        </div>
      )}

      {/* TAB 2: DAFTAR MUTASI & RIWAYAT LENGKAP */}
      {activeTab === 'mutasi' && (
        <div className="space-y-4">
          <GlassContainer settings={settings} className={`p-4 sm:p-6 ${isLight ? 'border-slate-200' : ''}`}>
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Riwayat Mutasi Transaksi
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Total {transactions.length} baris tercatat pada periode {currentSheetName}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportCSV}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                      : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                  }`}
                  title="Unduh data mutasi sebagai CSV"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Export CSV</span>
                </button>

                {onSyncGoogleSheet && (
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      onSyncGoogleSheet();
                    }}
                    disabled={isSyncing}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer ${
                      isLight
                        ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800'
                        : 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-400/30 text-blue-300'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync Sheet</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 my-4">
              {/* Search */}
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari keterangan, kategori, atau akun..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs liquid-glass-input"
                />
              </div>

              {/* Filter Tipe */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input cursor-pointer"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="Expense">Pengeluaran</option>
                  <option value="Income">Pemasukan</option>
                  <option value="Transfer Keluar">Transfer Keluar</option>
                  <option value="Transfer Masuk">Transfer Masuk</option>
                </select>
              </div>

              {/* Filter Kategori */}
              <div>
                <select
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input cursor-pointer"
                >
                  <option value="all">Semua Kategori</option>
                  {AVAILABLE_CATEGORIES.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transaction Ledger Table / Cards */}
            <div className="space-y-2 mt-2">
              {filteredTransactions.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">
                    {transactions.length === 0
                      ? `Belum ada catatan mutasi di periode ${currentSheetName}`
                      : 'Tidak ada transaksi yang cocok dengan filter'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {transactions.length === 0
                      ? 'Gunakan form input cepat untuk mulai mencatat pengeluaran, pemasukan, atau transfer antar rekening.'
                      : 'Coba ubah kata kunci pencarian atau reset filter di atas.'}
                  </p>
                  {transactions.length === 0 && (
                    <button
                      onClick={() => setActiveTab('input')}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
                    >
                      + Input Transaksi Sekarang
                    </button>
                  )}
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.tipe === 'Income' || tx.tipe === 'Transfer Masuk';
                  const isExpense = tx.tipe === 'Expense' || tx.tipe === 'Transfer Keluar';

                  return (
                    <div
                      key={tx.id}
                      className={`p-3 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        isLight
                          ? 'bg-slate-50/90 hover:bg-white border-slate-200/90 shadow-xs'
                          : 'bg-white/[0.04] hover:bg-white/[0.07] border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            tx.tipe === 'Income'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : tx.tipe === 'Expense'
                              ? 'bg-red-500/15 text-red-500 border-red-500/30'
                              : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                          }`}
                        >
                          {tx.tipe === 'Income' ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : tx.tipe === 'Expense' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowRightLeft className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {tx.catatan || tx.kategori}
                            </span>
                            {/* Clean unboxed metadata separator */}
                            <span className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                              · {tx.kategori}
                            </span>
                            <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              · {tx.akun}
                            </span>
                            {tx.rowIndex && (
                              <span className="text-[9px] font-mono text-slate-500">
                                #{tx.rowIndex}
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] block mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {tx.bulan} • {tx.tipe}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center shrink-0">
                        <span
                          className={`font-mono font-black text-sm tracking-tight ${
                            isIncome
                              ? isLight ? 'text-emerald-700' : 'text-emerald-400'
                              : isLight ? 'text-red-700' : 'text-red-400'
                          }`}
                        >
                          {isExpense ? '-' : '+'} {formatRupiah(tx.jumlah)}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          {onEditTransaction && (
                            <button
                              onClick={() => {
                                triggerHaptic('light');
                                setEditingTx(tx);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                              title="Edit transaksi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteTransaction && (
                            <button
                              onClick={() => {
                                triggerHaptic('light');
                                setDeletingTx(tx);
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              title="Hapus transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassContainer>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-[9999] w-screen h-[100dvh] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/20 p-5 text-white shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold">Edit Transaksi</h3>
              <button
                onClick={() => setEditingTx(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={editingTx.jumlah}
                  onChange={(e) => setEditingTx({ ...editingTx, jumlah: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">
                    Tipe
                  </label>
                  <select
                    value={editingTx.tipe}
                    onChange={(e) => setEditingTx({ ...editingTx, tipe: e.target.value as TransactionType })}
                    className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input cursor-pointer"
                  >
                    <option value="Expense">Pengeluaran</option>
                    <option value="Income">Pemasukan</option>
                    <option value="Transfer Keluar">Transfer Keluar</option>
                    <option value="Transfer Masuk">Transfer Masuk</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">
                    Kategori
                  </label>
                  <select
                    value={editingTx.kategori}
                    onChange={(e) => setEditingTx({ ...editingTx, kategori: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input cursor-pointer"
                  >
                    {AVAILABLE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">
                  Rekening / Dompet
                </label>
                <select
                  value={editingTx.akun}
                  onChange={(e) => setEditingTx({ ...editingTx, akun: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input cursor-pointer"
                >
                  {AVAILABLE_ACCOUNTS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">
                  Catatan
                </label>
                <input
                  type="text"
                  value={editingTx.catatan || ''}
                  onChange={(e) => setEditingTx({ ...editingTx, catatan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTx && (
        <ConfirmationModal
          isOpen={Boolean(deletingTx)}
          title="Hapus Transaksi"
          message={`Yakin ingin menghapus catatan mutasi "${deletingTx.catatan || deletingTx.kategori}" sebesar ${formatRupiah(deletingTx.jumlah)}?`}
          confirmLabel="Hapus"
          cancelLabel="Batal"
          variant="danger"
          settings={settings}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTx(null)}
        />
      )}
    </div>
  );
};
