'use client';

import React, { useState, useMemo } from 'react';
import { TradeRecord, ActiveAssetSummary, GlassSettings } from '../../types';
import { formatRupiah } from '../../lib/sheetsApi';
import { DetailedEquityChart } from './DetailedEquityChart';
import { AssetPerformanceHeatmap } from './AssetPerformanceHeatmap';
import { ActiveAssetsSummaryTable } from './ActiveAssetsSummaryTable';
import { TradeLedgerTable } from './TradeLedgerTable';
import { AddEditTradeModal } from './AddEditTradeModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  Layers,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface InvestingJournalPageProps {
  trades: TradeRecord[];
  activeSummaries?: ActiveAssetSummary[];
  isDark?: boolean;
  sheetConnected?: boolean;
  spreadsheetTitle?: string;
  tabTitle?: string;
  isSyncing?: boolean;
  onRefreshFromSheet?: () => Promise<void>;
  onAddTrade: (trade: TradeRecord) => Promise<void>;
  onEditTrade: (trade: TradeRecord) => Promise<void>;
  onDeleteTrade: (trade: TradeRecord) => Promise<void>;
  onCreateInvestingTab?: () => Promise<void>;
  onOpenProjectManager?: () => void;
  currentSpreadsheetId?: string;
  onConnectSpreadsheet?: (spreadsheetIdOrUrl: string, title?: string) => Promise<void>;
  onAutoDiscoverProject?: () => Promise<boolean>;
  settings?: GlassSettings;
}

export const InvestingJournalPage: React.FC<InvestingJournalPageProps> = ({
  trades = [],
  activeSummaries = [],
  isDark = true,
  sheetConnected = false,
  spreadsheetTitle = 'INVESTMENT',
  tabTitle = 'INVESTMENT',
  isSyncing = false,
  onRefreshFromSheet,
  onAddTrade,
  onEditTrade,
  onDeleteTrade,
  onCreateInvestingTab,
  onOpenProjectManager,
  currentSpreadsheetId = '',
  onConnectSpreadsheet,
  onAutoDiscoverProject
}) => {
  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<TradeRecord | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingTrade, setDeletingTrade] = useState<TradeRecord | null>(null);

  // Quick direct connect input state
  const [manualInputUrl, setManualInputUrl] = useState('');
  const [isConnectingManual, setIsConnectingManual] = useState(false);
  const [isSearchingDrive, setIsSearchingDrive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  // Filter state linked across Heatmap, Active Summary, and Ledger table
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  // Handle direct connect
  const handleConnectDirect = async () => {
    if (!manualInputUrl.trim() || !onConnectSpreadsheet) return;
    try {
      setIsConnectingManual(true);
      await onConnectSpreadsheet(manualInputUrl.trim(), 'INVESTMENT');
      setManualInputUrl('');
      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e: any) {
      alert('Gagal menghubungkan: ' + (e?.message || 'Periksa URL spreadsheet'));
    } finally {
      setIsConnectingManual(false);
    }
  };

  // Handle auto-discover from Drive
  const handleTriggerAutoDiscover = async () => {
    if (!onAutoDiscoverProject) return;
    try {
      setIsSearchingDrive(true);
      const found = await onAutoDiscoverProject();
      if (!found) {
        alert('File spreadsheet dengan nama "INVESTMENT" tidak ditemukan di Google Drive Anda. Silakan masukkan link spreadsheet Anda pada kotak input di bawah.');
      } else {
        setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (e: any) {
      alert('Gagal mencari di Google Drive: ' + (e?.message || 'Error'));
    } finally {
      setIsSearchingDrive(false);
    }
  };

  // If disconnected or in Dev Mode, strictly enforce 0 across all calculations as requested
  const displayTrades = sheetConnected ? trades : [];
  const displaySummaries = sheetConnected ? activeSummaries : [];

  // Financial calculations
  const metrics = useMemo(() => {
    // If disconnected, strictly default all metrics to 0
    if (!sheetConnected) {
      return {
        totalModalMasukFloating: 0,
        totalNilaiAsetAktif: 0,
        labaRealized: 0,
        labaFloating: 0,
        totalLabaBersih: 0,
        netRoi: 0,
        totalTradesCount: 0,
        floatingCount: 0,
        realizedCount: 0,
        winCount: 0,
        lossCount: 0,
        winRate: '0.0',
        profitFactor: '0.00'
      };
    }

    // 1. Total Modal Masuk: only positions with status 'Floating' (active working capital)
    const floatingTrades = displayTrades.filter((t) => t.status === 'Floating');
    const realizedTrades = displayTrades.filter((t) => t.status === 'Realized');

    const totalModalMasukFloating = floatingTrades.reduce((sum, t) => sum + t.nominalIdr, 0);

    // 2. Total Nilai Aset Aktif: sum of Nilai Aset for floating positions
    const totalNilaiAsetAktif = floatingTrades.reduce((sum, t) => sum + t.nilaiAset, 0);

    // 3. Total Laba Bersih Portofolio: Realized + Floating
    const labaRealized = realizedTrades.reduce((sum, t) => sum + t.labaBersih, 0);
    const labaFloating = floatingTrades.reduce((sum, t) => sum + t.labaBersih, 0);
    const totalLabaBersih = labaRealized + labaFloating;

    // 4. Net ROI Portofolio (%): Total Laba Bersih / Total Modal Masuk * 100
    const netRoi = totalModalMasukFloating > 0 ? (totalLabaBersih / totalModalMasukFloating) * 100 : 0;

    // Win Rate & Trade Stats
    const wins = realizedTrades.filter((t) => t.labaBersih >= 0);
    const losses = realizedTrades.filter((t) => t.labaBersih < 0);
    const winRate = realizedTrades.length > 0 ? ((wins.length / realizedTrades.length) * 100).toFixed(1) : '0.0';

    const totalWinPnl = wins.reduce((sum, t) => sum + t.labaBersih, 0);
    const totalLossPnl = Math.abs(losses.reduce((sum, t) => sum + t.labaBersih, 0));
    const profitFactor = totalLossPnl > 0 ? (totalWinPnl / totalLossPnl).toFixed(2) : totalWinPnl > 0 ? 'MAX' : '0.00';

    return {
      totalModalMasukFloating,
      totalNilaiAsetAktif,
      labaRealized,
      labaFloating,
      totalLabaBersih,
      netRoi: Number(netRoi.toFixed(2)),
      totalTradesCount: displayTrades.length,
      floatingCount: floatingTrades.length,
      realizedCount: realizedTrades.length,
      winCount: wins.length,
      lossCount: losses.length,
      winRate,
      profitFactor
    };
  }, [displayTrades, sheetConnected]);

  const handleOpenAdd = () => {
    setEditingTrade(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (trade: TradeRecord) => {
    setEditingTrade(trade);
    setIsAddEditOpen(true);
  };

  const handleOpenDelete = (trade: TradeRecord) => {
    setDeletingTrade(trade);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 pb-12">
      {/* 1. HIGH-VISIBILITY CONNECTION STATUS NOTIFICATION BANNER */}
      <div
        className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300 relative overflow-hidden shadow-lg ${
          sheetConnected
            ? isDark
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : isDark
            ? 'bg-rose-950/30 border-rose-500/50 text-rose-300'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {/* Animated Beacon */}
            <div className="relative flex h-4 w-4 shrink-0 mt-0.5">
              {sheetConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
                </>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500" />
                </>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm uppercase tracking-wider font-mono">
                  {sheetConnected ? 'GOOGLE SHEETS TERSAMBUNG (REAL-TIME AKTIF)' : 'PROJECT GOOGLE SHEET "INVESTMENT" TERPUTUS / DISCONNECTED'}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  sheetConnected
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                }`}>
                  {sheetConnected ? `Project: ${spreadsheetTitle} • Tab: ${tabTitle}` : 'Default Nilai: 0 (Terputus)'}
                </span>
                {sheetConnected && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Live Polling 10d • Update: {lastSyncTime}
                  </span>
                )}
              </div>

              <p className={`text-xs mt-1 leading-relaxed ${sheetConnected ? (isDark ? 'text-emerald-200/90' : 'text-emerald-800') : (isDark ? 'text-rose-200/90' : 'text-rose-800')}`}>
                {sheetConnected ? (
                  <>
                    Data tersinkronisasi dua arah secara langsung dengan Google Sheet project <strong>"{spreadsheetTitle}"</strong> (Tab: <strong>{tabTitle}</strong>). Setiap perubahan di Google Sheets atau web otomatis diperbarui secara real-time.
                  </>
                ) : (
                  <>
                    Aplikasi dalam status <strong>terputus (offline/Dev Mode)</strong>. Seluruh angka, laba/rugi, dan persentase diatur ke <strong>0</strong>. Hubungkan project Google Sheet <strong>"INVESTMENT"</strong> Anda di bawah agar sinkronisasi real-time aktif.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto shrink-0">
            {sheetConnected ? (
              <>
                {onRefreshFromSheet && (
                  <button
                    onClick={async () => {
                      await onRefreshFromSheet();
                      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                    }}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Menyinkronkan...' : 'Tarik Data Live'}</span>
                  </button>
                )}
                {onOpenProjectManager && (
                  <button
                    onClick={onOpenProjectManager}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition active:scale-95 cursor-pointer ${
                      isDark ? 'bg-white/10 hover:bg-white/15 border-white/15 text-slate-300' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Ganti File</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {onAutoDiscoverProject && (
                  <button
                    onClick={handleTriggerAutoDiscover}
                    disabled={isSearchingDrive}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition active:scale-95 bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearchingDrive ? 'animate-spin' : ''}`} />
                    <span>{isSearchingDrive ? 'Mencari file INVESTMENT...' : 'Cari File INVESTMENT di Drive'}</span>
                  </button>
                )}
                {onOpenProjectManager && (
                  <button
                    onClick={onOpenProjectManager}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition active:scale-95 bg-rose-600 hover:bg-rose-500 border-rose-400 text-white shadow-md shadow-rose-600/30 cursor-pointer"
                  >
                    <Wifi className="w-3.5 h-3.5" />
                    <span>Project Manager</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* QUICK CONNECT INPUT AREA (Displayed when disconnected or manually requested) */}
        {!sheetConnected && (
          <div className="mt-4 pt-4 border-t border-rose-500/20 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Option 1: Auto-Detect from Google Drive */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
              isDark ? 'bg-black/20 border-white/10 text-slate-300' : 'bg-white/60 border-rose-200 text-slate-700'
            }`}>
              <div>
                <span className="font-bold flex items-center gap-1.5 text-rose-400">
                  <FileSpreadsheet className="w-4 h-4" />
                  1. Deteksi Otomatis dari Google Drive
                </span>
                <p className="text-[11px] mt-1 text-slate-400 leading-normal">
                  Sistem akan memindai Google Drive akun Anda untuk mencari file spreadsheet yang berjudul <strong>"INVESTMENT"</strong> dan menghubungkannya secara otomatis.
                </p>
              </div>
              <button
                onClick={handleTriggerAutoDiscover}
                disabled={isSearchingDrive}
                className="self-start px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSearchingDrive ? 'animate-spin' : ''}`} />
                <span>{isSearchingDrive ? 'Memindai Drive...' : 'Temukan & Sambungkan INVESTMENT'}</span>
              </button>
            </div>

            {/* Option 2: Paste Direct Link / ID */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
              isDark ? 'bg-black/20 border-white/10 text-slate-300' : 'bg-white/60 border-rose-200 text-slate-700'
            }`}>
              <div>
                <span className="font-bold flex items-center gap-1.5 text-rose-400">
                  <ExternalLink className="w-4 h-4" />
                  2. Tempel Link / ID Spreadsheet INVESTMENT
                </span>
                <p className="text-[11px] mt-1 text-slate-400 leading-normal">
                  Buka file Google Sheet INVESTMENT Anda, salin URL dari bilah browser, lalu tempel di bawah ini:
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/... atau ID file"
                  value={manualInputUrl}
                  onChange={(e) => setManualInputUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConnectDirect();
                  }}
                  className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono outline-none ${
                    isDark ? 'bg-black/40 border-white/15 text-white placeholder-slate-500 focus:border-rose-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-rose-500'
                  }`}
                />
                <button
                  onClick={handleConnectDirect}
                  disabled={!manualInputUrl.trim() || isConnectingManual}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 cursor-pointer disabled:opacity-40"
                >
                  {isConnectingManual ? 'Menghubungkan...' : 'Hubungkan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Top Title Cockpit */}
      <div
        className={`p-5 sm:p-7 rounded-2xl sm:rounded-3xl border transition-all duration-300 relative overflow-hidden ${
          isDark
            ? 'bg-slate-900/80 border-white/10 shadow-2xl text-white backdrop-blur-md'
            : 'bg-white border-slate-200 shadow-sm text-slate-900'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="p-1.5 rounded-lg bg-sky-500/15 border border-sky-400/30 text-sky-400">
                <FileSpreadsheet className="w-4 h-4" />
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Jurnal Trading & Investasi Institusional
              </span>
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                isDark ? 'bg-white/5 border-white/10 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-700'
              }`}>
                Tab: {tabTitle}
              </span>
            </div>

            <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Rekap Portofolio & Jurnal Trading
            </h1>
            <p className={`text-xs mt-1.5 max-w-2xl leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Dashboard analitik untuk melacak posisi trading aktif (*Floating*) dan kinerja riil (*Realized*) yang terhubung langsung secara real-time dua arah ke tab Google Sheet <strong>{tabTitle}</strong>.
            </p>
          </div>

          {/* Sync Status & Action Bar */}
          <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
            {sheetConnected ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Terhubung Real-Time</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Terputus (Nilai 0)</span>
              </div>
            )}

            <button
              onClick={handleOpenAdd}
              disabled={!sheetConnected}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 shadow-md cursor-pointer ${
                sheetConnected
                  ? 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white shadow-blue-500/20'
                  : 'bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed opacity-60'
              }`}
              title={sheetConnected ? 'Tambah transaksi baru' : 'Sambungkan Google Sheet terlebih dahulu'}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tambah Posisi</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. 4 PRIMARY KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full">
        {/* Card 1: Total Nilai Aset Aktif */}
        <div
          className={`p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
            isDark ? 'bg-slate-900/80 border-white/10 text-white backdrop-blur-md' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Nilai Aset Aktif
            </span>
            <span className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-400/30">
              <Wallet className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="my-1">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight block">
              {formatRupiah(metrics.totalNilaiAsetAktif)}
            </span>
            <span className={`text-[11px] font-semibold mt-0.5 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {sheetConnected ? `Valuasi Terkini ${metrics.floatingCount} Posisi Terbuka` : '0 Posisi Terbuka (Terputus)'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 text-[11px] font-mono flex items-center justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Floating PnL:</span>
            <span className={metrics.labaFloating >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
              {metrics.labaFloating >= 0 ? `+${formatRupiah(metrics.labaFloating)}` : formatRupiah(metrics.labaFloating)}
            </span>
          </div>
        </div>

        {/* Card 2: Total Modal Masuk Aktif (Floating Only) */}
        <div
          className={`p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
            isDark ? 'bg-slate-900/80 border-white/10 text-white backdrop-blur-md' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Modal Masuk
            </span>
            <span className="p-1.5 rounded-lg bg-slate-500/15 text-slate-300 border border-slate-400/30">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="my-1">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight block">
              {formatRupiah(metrics.totalModalMasukFloating)}
            </span>
            <span className={`text-[11px] font-semibold mt-0.5 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {sheetConnected ? 'Modal Aktif Bekerja (Floating)' : 'Modal Aktif: Rp 0'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 text-[11px] font-mono flex items-center justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Modal Realized:</span>
            <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}>
              {sheetConnected ? 'Bebas di Kas' : 'Rp 0'}
            </span>
          </div>
        </div>

        {/* Card 3: Total Laba Bersih Portofolio */}
        <div
          className={`p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
            isDark ? 'bg-slate-900/80 border-white/10 text-white backdrop-blur-md' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Laba Bersih
            </span>
            <span
              className={`p-1.5 rounded-lg border ${
                metrics.totalLabaBersih >= 0
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border-red-500/30'
              }`}
            >
              {metrics.totalLabaBersih >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            </span>
          </div>

          <div className="my-1">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight block ${
                metrics.totalLabaBersih >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {metrics.totalLabaBersih >= 0 ? `+${formatRupiah(metrics.totalLabaBersih)}` : formatRupiah(metrics.totalLabaBersih)}
            </span>
            <span className={`text-[11px] font-semibold mt-0.5 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {sheetConnected ? `Realized (${formatRupiah(metrics.labaRealized)}) + Floating` : 'Realized: Rp 0 • Floating: Rp 0'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 text-[11px] font-mono flex items-center justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Profit Factor:</span>
            <span className="text-emerald-400 font-bold">{metrics.profitFactor}x</span>
          </div>
        </div>

        {/* Card 4: Net ROI Portofolio & Win Rate */}
        <div
          className={`p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
            isDark ? 'bg-slate-900/80 border-white/10 text-white backdrop-blur-md' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Net ROI Portofolio
            </span>
            <span className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-400/30">
              <PieChart className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="my-1 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                metrics.netRoi >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {metrics.netRoi >= 0 ? `+${metrics.netRoi}%` : `${metrics.netRoi}%`}
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              WR {metrics.winRate}%
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 text-[11px] font-mono flex items-center justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Rekap Status:</span>
            <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              {metrics.realizedCount} Closed • {metrics.floatingCount} Open
            </span>
          </div>
        </div>
      </div>

      {/* 4. GROWTH CURVE & TRADE DISTRIBUTION */}
      <DetailedEquityChart
        trades={displayTrades}
        isDark={isDark}
        sheetConnected={sheetConnected}
      />

      {/* 5. PERFORMANCE HEATMAP */}
      <AssetPerformanceHeatmap
        trades={displayTrades}
        isDark={isDark}
        selectedAssetFilter={selectedAsset}
        onSelectAsset={setSelectedAsset}
      />

      {/* 6. ACTIVE ASSETS SUMMARY TABLE (KOLOM P~T GOOGLE SHEET) */}
      <ActiveAssetsSummaryTable
        summaries={displaySummaries}
        trades={displayTrades}
        isDark={isDark}
        selectedAssetFilter={selectedAsset}
        onSelectAsset={setSelectedAsset}
      />

      {/* 7. TRADE LEDGER TABLE & CRUD */}
      <TradeLedgerTable
        trades={displayTrades}
        isDark={isDark}
        sheetTitle={tabTitle}
        sheetConnected={sheetConnected}
        selectedAssetFilter={selectedAsset}
        onClearAssetFilter={() => setSelectedAsset(null)}
        onOpenAddModal={handleOpenAdd}
        onOpenEditModal={handleOpenEdit}
        onOpenDeleteModal={handleOpenDelete}
      />

      {/* MODALS */}
      <AddEditTradeModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        onSave={async (tradeData) => {
          if (editingTrade) {
            await onEditTrade(tradeData);
          } else {
            await onAddTrade(tradeData);
          }
        }}
        editTrade={editingTrade}
        isDark={isDark}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          if (deletingTrade) {
            await onDeleteTrade(deletingTrade);
          }
        }}
        trade={deletingTrade}
        isDark={isDark}
      />
    </div>
  );
};
