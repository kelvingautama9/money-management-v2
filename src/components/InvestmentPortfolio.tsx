import React, { useState } from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassSettings, InvestmentAsset, InvestmentHistory } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  TrendingUp,
  Coins,
  DollarSign,
  LineChart,
  Award,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Building2,
  Activity,
  Calculator
} from 'lucide-react';

interface InvestmentPortfolioProps {
  assets: InvestmentAsset[];
  history: InvestmentHistory[];
  settings: GlassSettings;
  totalProfit2026?: number;
  onAddAsset?: (asset: InvestmentAsset) => void;
  onEditAsset?: (oldName: string, asset: InvestmentAsset) => void;
  onDeleteAsset?: (name: string) => void;
  onOpenSmartAnalysis?: () => void;
  onOpenCalculator?: () => void;
}

export const InvestmentPortfolio: React.FC<InvestmentPortfolioProps> = ({
  assets,
  history,
  settings,
  totalProfit2026 = 1148790,
  onAddAsset,
  onEditAsset,
  onDeleteAsset,
  onOpenSmartAnalysis,
  onOpenCalculator
}) => {
  const [activeTab, setActiveTab] = useState<'trend' | 'allocation'>('trend');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InvestmentAsset | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formDeposit, setFormDeposit] = useState('');
  const [formColor, setFormColor] = useState('#38bdf8');

  const totalCurrentInvestment = assets.reduce((sum, a) => sum + a.nilaiAkhirBulan, 0);

  const pieData = assets.map((a) => ({
    name: a.nama,
    value: a.nilaiAkhirBulan,
    color: a.warna
  }));

  const chartData = history.map((h) => ({
    bulan: h.bulan,
    netWorth: h.totalNetWorth,
    profit: h.netProfitMoM,
    pnl: h.pnlPercent
  }));

  const getAssetIcon = (nama: string) => {
    const n = nama.toLowerCase();
    if (n.includes('pluang') || n.includes('saham') || n.includes('reksadana'))
      return <TrendingUp className="w-4 h-4 text-sky-400" />;
    if (n.includes('valas') || n.includes('usd') || n.includes('bca'))
      return <DollarSign className="w-4 h-4 text-emerald-400" />;
    if (n.includes('usdt') || n.includes('binance') || n.includes('kripto'))
      return <Coins className="w-4 h-4 text-amber-400" />;
    return <Building2 className="w-4 h-4 text-purple-400" />;
  };

  const handleOpenAdd = () => {
    triggerHaptic('light');
    setFormName('');
    setFormValue('');
    setFormDeposit('0');
    setFormColor('#38bdf8');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (asset: InvestmentAsset) => {
    triggerHaptic('light');
    setEditingAsset(asset);
    setFormName(asset.nama);
    setFormValue(asset.nilaiAkhirBulan.toString());
    setFormDeposit(asset.depositWd.toString());
    setFormColor(asset.warna || '#38bdf8');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    const cleanVal = parseFloat(formValue.replace(/[^0-9.-]/g, '')) || 0;
    const cleanDep = parseFloat(formDeposit.replace(/[^0-9.-]/g, '')) || 0;
    if (!cleanName) {
      alert('Masukkan nama aset atau broker.');
      return;
    }

    const newAsset: InvestmentAsset = {
      nama: cleanName,
      nilaiAkhirBulan: cleanVal,
      depositWd: cleanDep,
      alokasiPercent: 0,
      warna: formColor
    };

    onAddAsset?.(newAsset);
    triggerHaptic('success');
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    const cleanName = formName.trim();
    const cleanVal = parseFloat(formValue.replace(/[^0-9.-]/g, '')) || 0;
    const cleanDep = parseFloat(formDeposit.replace(/[^0-9.-]/g, '')) || 0;
    if (!cleanName) {
      alert('Masukkan nama aset atau broker.');
      return;
    }

    const updatedAsset: InvestmentAsset = {
      ...editingAsset,
      nama: cleanName,
      nilaiAkhirBulan: cleanVal,
      depositWd: cleanDep,
      warna: formColor
    };

    onEditAsset?.(editingAsset.nama, updatedAsset);
    triggerHaptic('success');
    setEditingAsset(null);
  };

  const handleDelete = (name: string) => {
    if (confirm(`Yakin ingin menghapus aset/broker "${name}" dari portofolio?`)) {
      triggerHaptic('warning');
      onDeleteAsset?.(name);
      setEditingAsset(null);
    }
  };

  return (
    <div className="space-y-6">
      <GlassContainer settings={settings} className="p-5 sm:p-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
                <LineChart className="w-4 h-4 text-sky-400" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Portofolio Multi-Aset & Rekap PnL
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Pertumbuhan Positif
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitoring performa investasi, alokasi broker, dan valuasi aset
            </p>
          </div>

          {/* Action Buttons: Smart Analysis + Kalkulator Pensiun + Add Broker + Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 3D Glass Smart Analysis Button */}
            {onOpenSmartAnalysis && (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onOpenSmartAnalysis();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 border border-white/20 transition-all active:scale-95"
              >
                <Activity className="w-3.5 h-3.5 text-sky-200" />
                <span>Smart Analisis (Pro)</span>
              </button>
            )}

            {/* Kalkulator Dana Pensiun & Target Button */}
            {onOpenCalculator && (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onOpenCalculator();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 border border-white/20 transition-all active:scale-95"
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-200" />
                <span>Kalkulator Pensiun & Target</span>
              </button>
            )}

            {/* Add Asset / Broker Button */}
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs transition-all active:scale-95"
              title="Tambah Portofolio Broker / Wallet Baru"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tambah Broker</span>
            </button>

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setActiveTab('trend')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  activeTab === 'trend'
                    ? 'bg-blue-500/30 text-white border border-blue-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tren Net Worth
              </button>
              <button
                onClick={() => setActiveTab('allocation')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  activeTab === 'allocation'
                    ? 'bg-blue-500/30 text-white border border-blue-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Alokasi
              </button>
            </div>
          </div>
        </div>

        {/* Total Valuasi Portofolio Hero Banner */}
        <div className="my-5 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 dark:from-sky-950/40 dark:via-blue-950/25 dark:to-indigo-950/40 border border-sky-400/30 dark:border-sky-500/25 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-300 block mb-1">
                Total Valuasi Portofolio
              </span>
              <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {formatRupiah(totalCurrentInvestment)}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-1">
                  +{formatRupiah(assets.reduce((sum, a) => sum + (a.depositWd || 0), 0))} DCA
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                {assets.length} Broker / Aset Terdaftar
              </span>
            </div>
          </div>
        </div>

        {/* Compact Broker & Asset Cards (Optimized 2-column mobile grid) */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-300">Daftar Broker & Aset Investasi</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Alokasi Total: 100%</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {assets.map((asset) => {
              const allocationPct = totalCurrentInvestment > 0
                ? ((asset.nilaiAkhirBulan / totalCurrentInvestment) * 100).toFixed(1)
                : '0';

              return (
                <div
                  key={asset.nama}
                  className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10 relative group hover:border-sky-500/30 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="shrink-0 scale-90 sm:scale-100">
                        {getAssetIcon(asset.nama)}
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold text-white truncate" title={asset.nama}>
                        {asset.nama}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(asset)}
                        className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition"
                        title="Edit Aset / Broker"
                      >
                        <Pencil className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(asset.nama)}
                        className="p-1 rounded-md bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        title="Hapus Aset / Broker"
                      >
                        <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="my-1">
                    <span className="text-xs sm:text-base font-bold text-white font-mono block tracking-tight truncate">
                      {formatRupiah(asset.nilaiAkhirBulan)}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] sm:text-[10px]">
                    <span className="text-slate-400">Porsi:</span>
                    <span className="font-bold text-sky-300 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                      {allocationPct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart Section */}
        <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
          {activeTab === 'trend' ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <span className="text-xs font-medium text-slate-300">
                  Pertumbuhan Nilai Investasi Bulanan (April – September 2026)
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <Award className="w-3.5 h-3.5" />
                    Total Realized Profit: <strong>{formatRupiah(totalProfit2026)}</strong>
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="bulan" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                      domain={['dataMin - 1000000', 'dataMax + 1000000']}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as any;
                          return (
                            <div className="p-3 rounded-xl bg-slate-900/90 border border-white/20 backdrop-blur-md text-xs shadow-xl">
                              <p className="font-bold text-white mb-1">{data.bulan}</p>
                              <p className="text-sky-300">Net Worth: {formatRupiah(data.netWorth)}</p>
                              <p className={data.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                MoM Profit: {formatRupiah(data.profit)} ({data.pnl}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="netWorth"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#netWorthGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-2">
              <div className="h-56 w-56 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.4)" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Portofolio</span>
                  <span className="text-xs font-bold text-white font-mono">100%</span>
                </div>
              </div>

              {/* Legend breakdown */}
              <div className="space-y-3 w-full max-w-xs">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 font-medium">{item.name}</span>
                    </div>
                    <span className="font-mono text-slate-200">{formatRupiah(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassContainer>

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0e1224] border border-white/20 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Tambah Portofolio / Broker Baru
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
                <label className="text-slate-300 block mb-1 font-medium">Nama Broker / Aset:</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Bibit (Reksadana) / Stockbit / Emas"
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Nilai Akhir Bulan (Rp):</label>
                <input
                  type="number"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Deposit / WD Bulan Ini (Rp):</label>
                <input
                  type="number"
                  value={formDeposit}
                  onChange={(e) => setFormDeposit(e.target.value)}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Warna Label Grafik:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-10 h-8 rounded bg-transparent cursor-pointer"
                  />
                  <span className="text-slate-400 font-mono text-[11px]">{formColor}</span>
                </div>
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
                  Simpan Aset Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0e1224] border border-white/20 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-sky-400" />
                Edit Aset / Broker ({editingAsset.nama})
              </h4>
              <button
                onClick={() => setEditingAsset(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Nama Broker / Aset:</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Nilai Akhir Bulan (Rp):</label>
                <input
                  type="number"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Deposit / WD Bulan Ini (Rp):</label>
                <input
                  type="number"
                  value={formDeposit}
                  onChange={(e) => setFormDeposit(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Warna Label Grafik:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-10 h-8 rounded bg-transparent cursor-pointer"
                  />
                  <span className="text-slate-400 font-mono text-[11px]">{formColor}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleDelete(editingAsset.nama)}
                  className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs transition"
                >
                  Hapus Aset
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAsset(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                  >
                    Perbarui Aset
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
