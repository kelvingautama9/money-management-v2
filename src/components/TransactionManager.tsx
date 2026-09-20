import React, { useState, useMemo } from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassButton } from './GlassButton';
import { ConfirmationModal } from './ConfirmationModal';
import {
  Transaction,
  GlassSettings,
  TransactionType
} from '../types';
import { AVAILABLE_CATEGORIES, AVAILABLE_ACCOUNTS } from '../data/initialData';
import { formatRupiah } from '../lib/sheetsApi';
import {
  SHEET_MONTHS,
  normalizeMonthTitleCase,
  getCategoryStyle,
  getAccountStyle,
  getTypeStyle,
  getAmountCellStyle
} from '../lib/sheetStyles';
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Calendar,
  Layers,
  X,
  FileSpreadsheet,
  ChevronDown,
  ArrowUpDown,
  ListOrdered
} from 'lucide-react';

interface TransactionManagerProps {
  transactions: Transaction[];
  settings: GlassSettings;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  onEditTransaction: (tx: Transaction) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onSyncGoogleSheet?: () => void;
  isSyncing?: boolean;
  currentSheetName?: string;
  onSelectMonth?: (month: string) => void;
  availableSheets?: string[];
}

export const TransactionManager: React.FC<TransactionManagerProps> = ({
  transactions,
  settings,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onSyncGoogleSheet,
  isSyncing,
  currentSheetName = 'September',
  onSelectMonth,
  availableSheets = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [filterAkun, setFilterAkun] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  // Form State
  const [formBulan, setFormBulan] = useState(currentSheetName);
  const [formKategori, setFormKategori] = useState('Jajan');
  const [formAkun, setFormAkun] = useState('Bank BCA');
  const [formTipe, setFormTipe] = useState<TransactionType>('Expense');
  const [formJumlah, setFormJumlah] = useState<string>('');
  const [formCatatan, setFormCatatan] = useState<string>('');

  React.useEffect(() => {
    if (currentSheetName) {
      setFormBulan(currentSheetName);
    }
  }, [currentSheetName]);

  // Filter and Sort State
  const [sortOrder, setSortOrder] = useState<'sheet' | 'newest'>('sheet');

  // Filtered and Sorted transactions
  const filteredTransactions = useMemo(() => {
    const list = transactions.filter((tx) => {
      const matchSearch =
        tx.catatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.akun.toLowerCase().includes(searchQuery.toLowerCase());

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

  const handleOpenAdd = () => {
    setFormBulan('September');
    setFormKategori('Jajan');
    setFormAkun('Bank BCA');
    setFormTipe('Expense');
    setFormJumlah('');
    setFormCatatan('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setFormBulan(tx.bulan);
    setFormKategori(tx.kategori);
    setFormAkun(tx.akun);
    setFormTipe(tx.tipe);
    setFormJumlah(tx.jumlah.toString());
    setFormCatatan(tx.catatan);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formJumlah.replace(/[^0-9.-]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      alert('Masukkan nominal jumlah transaksi yang valid.');
      return;
    }

    if (editingTx) {
      await onEditTransaction({
        ...editingTx,
        bulan: formBulan,
        kategori: formKategori,
        akun: formAkun,
        tipe: formTipe,
        jumlah: amount,
        catatan: formCatatan
      });
      setEditingTx(null);
    } else {
      await onAddTransaction({
        bulan: formBulan,
        kategori: formKategori,
        akun: formAkun,
        tipe: formTipe,
        jumlah: amount,
        catatan: formCatatan
      });
      setIsAddModalOpen(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Bulan', 'Kategori', 'Akun', 'Tipe', 'Jumlah', 'Catatan'];
    const rows = filteredTransactions.map((t) => [
      t.bulan,
      t.kategori,
      t.akun,
      t.tipe,
      `"${formatRupiah(t.jumlah)}"`,
      `"${t.catatan.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial-recap-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredTransactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `financial-records-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'Income':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ArrowUpRight className="w-3 h-3" /> Income
          </span>
        );
      case 'Expense':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <ArrowDownLeft className="w-3 h-3" /> Expense
          </span>
        );
      case 'Transfer Keluar':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <ArrowRightLeft className="w-3 h-3" /> Transfer Out
          </span>
        );
      case 'Transfer Masuk':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <ArrowRightLeft className="w-3 h-3" /> Transfer In
          </span>
        );
      case 'Saldo Bulan Lalu':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Calendar className="w-3 h-3" /> Saldo Lalu
          </span>
        );
    }
  };

  return (
    <GlassContainer settings={settings} className="p-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex flex-wrap items-center gap-2">
            Jurnal Transaksi & Rekam Data Finansial
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {filteredTransactions.length} Baris Data
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
              Sheet: {currentSheetName}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola input, koreksi edit, hapus, filter kategori, dan ekspor data Google Sheets
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <GlassButton size="sm" variant="secondary" onClick={exportCSV} icon={<Download className="w-3.5 h-3.5" />}>
            Ekspor CSV
          </GlassButton>
          <GlassButton size="sm" variant="secondary" onClick={exportJSON} icon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
            Ekspor JSON
          </GlassButton>
          <GlassButton
            size="sm"
            variant="primary"
            onClick={handleOpenAdd}
            settings={settings}
            icon={<Plus className="w-4 h-4" />}
          >
            Tambah Transaksi
          </GlassButton>
        </div>
      </div>

      {/* Filter, Search, and Sort Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 my-5">
        {/* Search */}
        <div className="relative lg:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari catatan, pos, akun..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs liquid-glass-input"
          />
        </div>

        {/* Filter Type */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs liquid-glass-input"
        >
          <option value="all" className="bg-slate-900">Semua Tipe Transaksi</option>
          <option value="Income" className="bg-slate-900">Income (Pemasukan)</option>
          <option value="Expense" className="bg-slate-900">Expense (Pengeluaran)</option>
          <option value="Transfer Keluar" className="bg-slate-900">Transfer Keluar</option>
          <option value="Transfer Masuk" className="bg-slate-900">Transfer Masuk</option>
          <option value="Saldo Bulan Lalu" className="bg-slate-900">Saldo Bulan Lalu</option>
        </select>

        {/* Filter Kategori */}
        <select
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs liquid-glass-input"
        >
          <option value="all" className="bg-slate-900">Semua Kategori</option>
          {AVAILABLE_CATEGORIES.map((k) => (
            <option key={k} value={k} className="bg-slate-900">{k}</option>
          ))}
        </select>

        {/* Filter Akun */}
        <select
          value={filterAkun}
          onChange={(e) => setFilterAkun(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs liquid-glass-input"
        >
          <option value="all" className="bg-slate-900">Semua Rekening / Akun</option>
          {AVAILABLE_ACCOUNTS.map((a) => (
            <option key={a} value={a} className="bg-slate-900">{a}</option>
          ))}
        </select>

        {/* Sort Order Toggle */}
        <button
          type="button"
          onClick={() => setSortOrder(sortOrder === 'sheet' ? 'newest' : 'sheet')}
          className="px-3 py-2 rounded-xl text-xs liquid-glass-input flex items-center justify-between gap-1.5 hover:bg-white/10 transition font-medium text-slate-200"
          title="Ubah urutan tampilan baris rekapan"
        >
          <div className="flex items-center gap-1.5 truncate">
            {sortOrder === 'sheet' ? (
              <ListOrdered className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            <span className="truncate">
              {sortOrder === 'sheet' ? 'Urutan Sheet (1 → N)' : 'Baris Terbaru'}
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
            {sortOrder === 'sheet' ? 'Sheet' : 'New'}
          </span>
        </button>
      </div>

      {/* Transactions Table with Google Sheet Dropdown Rules and Conditional Formatting */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-xs text-slate-200 border-collapse">
          <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
            <tr>
              <th className="px-3 py-3 font-semibold text-center w-12">Baris</th>
              <th className="px-4 py-3 font-semibold">Bulan</th>
              <th className="px-4 py-3 font-semibold">Kategori</th>
              <th className="px-4 py-3 font-semibold">Akun</th>
              <th className="px-4 py-3 font-semibold">Tipe</th>
              <th className="px-4 py-3 font-semibold text-center">Jumlah</th>
              <th className="px-4 py-3 font-semibold">Catatan / Keterangan</th>
              <th className="px-4 py-3 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">
                  Tidak ada transaksi yang cocok dengan kriteria pencarian/filter.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx, idx) => {
                const prevTx = idx > 0 ? filteredTransactions[idx - 1] : null;
                const currentRow = tx.rowIndex || 0;
                const prevRow = prevTx?.rowIndex || 0;

                // Detect divider gaps matching user's black separator rows in Google Sheets (Row 11 and Row 23)
                const showDivider11 =
                  sortOrder === 'sheet' &&
                  prevRow > 0 &&
                  prevRow <= 10 &&
                  currentRow >= 12;

                const showDivider23 =
                  sortOrder === 'sheet' &&
                  prevRow > 0 &&
                  prevRow <= 22 &&
                  currentRow >= 24;

                const katStyle = getCategoryStyle(tx.kategori);
                const accStyle = getAccountStyle(tx.akun);
                const tipeStyle = getTypeStyle(tx.tipe);
                const amountStyle = getAmountCellStyle(tx.tipe);

                return (
                  <React.Fragment key={tx.id}>
                    {/* Visual Section Divider 1 (Row 11: Repetitive Monthly Split) */}
                    {showDivider11 && (
                      <tr className="bg-black/80">
                        <td
                          colSpan={8}
                          className="px-4 py-2 text-center text-[11px] font-semibold text-slate-400 border-y border-white/10 tracking-wide"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="w-12 h-px bg-white/20"></span>
                            <span>── BARIS PEMISAH SHEET: PENGELUARAN BULANAN REPETISI (BARIS 11) ──</span>
                            <span className="w-12 h-px bg-white/20"></span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Visual Section Divider 2 (Row 23: Daily / Discretionary Split) */}
                    {showDivider23 && (
                      <tr className="bg-black/80">
                        <td
                          colSpan={8}
                          className="px-4 py-2 text-center text-[11px] font-semibold text-slate-400 border-y border-white/10 tracking-wide"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="w-12 h-px bg-white/20"></span>
                            <span>── BARIS PEMISAH SHEET: MUTASI HARIAN & JAJAN (BARIS 23) ──</span>
                            <span className="w-12 h-px bg-white/20"></span>
                          </div>
                        </td>
                      </tr>
                    )}

                    <tr className="hover:bg-white/[0.04] transition-colors group">
                      {/* Row Index Indicator */}
                      <td className="px-3 py-3 text-center text-[11px] font-mono text-slate-400 whitespace-nowrap">
                        {tx.rowIndex ? (
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-bold text-slate-300">
                            #{tx.rowIndex}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Baru</span>
                        )}
                      </td>

                      {/* Bulan Dropdown Chip */}
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 dark:border-blue-400/30 shadow-sm transition">
                          <span>{tx.bulan || currentSheetName || 'Bulan'}</span>
                          <ChevronDown className="w-3 h-3 text-blue-600 dark:text-blue-400 opacity-80" />
                        </span>
                      </td>

                      {/* Kategori Dropdown Chip (Google Sheet Color & Caret) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          style={{
                            backgroundColor: katStyle.rawBg,
                            color: katStyle.rawText
                          }}
                          className="inline-flex items-center gap-1.5 font-medium text-[11px] px-2.5 py-1 rounded-full shadow-sm font-sans tracking-tight"
                        >
                          <span className="truncate max-w-[120px]">{tx.kategori}</span>
                          <span className="text-[8px] opacity-70">▼</span>
                        </span>
                      </td>

                      {/* Akun Dropdown Chip (Google Sheet Color & Caret) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          style={{
                            backgroundColor: accStyle.rawBg,
                            color: accStyle.rawText
                          }}
                          className="inline-flex items-center gap-1.5 font-medium text-[11px] px-2.5 py-1 rounded-full shadow-sm font-sans tracking-tight"
                        >
                          <span className="truncate max-w-[130px]">{tx.akun}</span>
                          <span className="text-[8px] opacity-70">▼</span>
                        </span>
                      </td>

                      {/* Tipe Dropdown Chip (Google Sheet Color & Caret) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          style={{
                            backgroundColor: tipeStyle.rawBg,
                            color: tipeStyle.rawText
                          }}
                          className="inline-flex items-center gap-1.5 font-semibold text-[11px] px-2.5 py-1 rounded-full shadow-sm font-sans tracking-tight"
                        >
                          <span>{tx.tipe}</span>
                          <span className="text-[8px] opacity-70">▼</span>
                        </span>
                      </td>

                      {/* Jumlah Cell (Exact Google Sheet Conditional Formatting) */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div
                          className={amountStyle.className}
                          style={amountStyle.inlineStyle}
                        >
                          {formatRupiah(tx.jumlah)}
                        </div>
                      </td>

                      {/* Catatan */}
                      <td className="px-4 py-3 text-slate-300 max-w-xs truncate text-xs" title={tx.catatan}>
                        {tx.catatan || '-'}
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(tx)}
                            title="Edit Baris Transaksi"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingTx(tx)}
                            title="Hapus Baris Transaksi"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Transaction Modal */}
      {(isAddModalOpen || editingTx) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div
            style={{
              background: 'rgba(20, 24, 45, 0.9)',
              backdropFilter: 'blur(30px) saturate(190%)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.7), inset 0 1.5px 1px rgba(255,255,255,0.4)'
            }}
            className="w-full max-w-lg rounded-3xl border border-white/20 p-6 text-slate-100 shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-base font-bold text-white tracking-tight">
                {editingTx ? 'Koreksi / Edit Transaksi' : 'Catat Transaksi Baru'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingTx(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Bulan Periode</label>
                  <select
                    value={normalizeMonthTitleCase(formBulan)}
                    onChange={(e) => setFormBulan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input"
                  >
                    {SHEET_MONTHS.map((m) => (
                      <option key={m} value={m} className="bg-slate-900">{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Tipe Transaksi</label>
                  <select
                    value={formTipe}
                    onChange={(e) => setFormTipe(e.target.value as TransactionType)}
                    className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input"
                  >
                    <option value="Expense" className="bg-slate-900">Expense (Pengeluaran)</option>
                    <option value="Income" className="bg-slate-900">Income (Pemasukan)</option>
                    <option value="Transfer Keluar" className="bg-slate-900">Transfer Keluar</option>
                    <option value="Transfer Masuk" className="bg-slate-900">Transfer Masuk</option>
                    <option value="Saldo Bulan Lalu" className="bg-slate-900">Saldo Bulan Lalu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Kategori Pos</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input"
                  >
                    {AVAILABLE_CATEGORIES.map((k) => (
                      <option key={k} value={k} className="bg-slate-900">{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-medium">Rekening / Akun</label>
                  <select
                    value={formAkun}
                    onChange={(e) => setFormAkun(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input"
                  >
                    {AVAILABLE_ACCOUNTS.map((a) => (
                      <option key={a} value={a} className="bg-slate-900">{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Jumlah (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 150000"
                  value={formJumlah}
                  onChange={(e) => setFormJumlah(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">Catatan / Keterangan</label>
                <input
                  type="text"
                  placeholder="Contoh: Beli Bensin, Makan Malam, dll"
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs liquid-glass-input"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <GlassButton
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingTx(null);
                  }}
                >
                  Batal
                </GlassButton>
                <GlassButton type="submit" size="sm" variant="primary" settings={settings}>
                  {editingTx ? 'Simpan Perubahan' : 'Tambahkan Transaksi'}
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explicit Confirmation Dialog before Deletion (MANDATORY for user data safety) */}
      <ConfirmationModal
        isOpen={Boolean(deletingTx)}
        title="Konfirmasi Hapus Data Transaksi"
        message={`Apakah Anda yakin ingin menghapus transaksi "${deletingTx?.catatan || deletingTx?.kategori}" sejumlah ${
          deletingTx ? formatRupiah(deletingTx.jumlah) : ''
        }? Data yang dihapus akan dicabut dari rekonsiliasi dan baris Google Sheets terkait.`}
        confirmLabel="Hapus Transaksi"
        cancelLabel="Batal"
        variant="danger"
        settings={settings}
        onCancel={() => setDeletingTx(null)}
        onConfirm={async () => {
          if (deletingTx) {
            await onDeleteTransaction(deletingTx.id);
            setDeletingTx(null);
          }
        }}
      />
    </GlassContainer>
  );
};
