'use client';

import React, { useState, useMemo } from 'react';
import { TradeRecord } from '../../types';
import { formatRupiah } from '../../lib/sheetsApi';
import {
  ComposedChart,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight, BarChart3, LineChart as LineIcon } from 'lucide-react';

interface DetailedEquityChartProps {
  trades: TradeRecord[];
  isDark?: boolean;
  sheetConnected?: boolean;
}

export const DetailedEquityChart: React.FC<DetailedEquityChartProps> = ({
  trades = [],
  isDark = true,
  sheetConnected = true
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Process data for Line Chart:
  // Chronological curve of realized trades sorted by exit date, culminating in the current floating accumulator
  const lineChartData = useMemo(() => {
    const realizedTrades = trades
      .filter((t) => t.status === 'Realized')
      .sort((a, b) => (a.exitDate || a.entryDate).localeCompare(b.exitDate || b.entryDate));

    let cumulativeProfit = 0;
    const points: Array<{
      date: string;
      label: string;
      cummulativePnl: number;
      tradePnl: number;
      asset: string;
      isFloating?: boolean;
      isLast?: boolean;
    }> = [];

    // Map realized trades to chronological points
    realizedTrades.forEach((t) => {
      cumulativeProfit += t.labaBersih;
      let dateLabel = t.exitDate || t.entryDate;
      try {
        const d = new Date(dateLabel);
        if (!isNaN(d.getTime())) {
          dateLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        }
      } catch (e) {}

      points.push({
        date: dateLabel,
        label: `${t.asset} (${dateLabel})`,
        cummulativePnl: cumulativeProfit,
        tradePnl: t.labaBersih,
        asset: t.asset
      });
    });

    // Add active floating endpoint at the far right: "Saat Ini"
    const floatingTrades = trades.filter((t) => t.status === 'Floating');
    const totalFloatingProfit = floatingTrades.reduce((acc, t) => acc + t.labaBersih, 0);
    const finalTotalWithFloating = cumulativeProfit + totalFloatingProfit;

    points.push({
      date: 'Saat Ini',
      label: 'Saat Ini (Floating Aktif)',
      cummulativePnl: finalTotalWithFloating,
      tradePnl: totalFloatingProfit,
      asset: 'FLOATING',
      isFloating: true,
      isLast: true
    });

    return points;
  }, [trades]);

  // High, Low, Last trade metrics for the sub-stats row
  const chartMetrics = useMemo(() => {
    if (!sheetConnected || trades.length === 0) {
      return {
        high: 0,
        low: 0,
        totalRealized: 0,
        totalFloating: 0,
        totalLaba: 0,
        netRoi: 0,
        lastTrade: null,
        peakDate: ''
      };
    }

    const values = lineChartData.map((p) => p.cummulativePnl);
    const high = values.length > 0 ? Math.max(...values) : 0;
    const low = values.length > 0 ? Math.min(...values) : 0;

    const realizedTrades = trades.filter((t) => t.status === 'Realized');
    const floatingTrades = trades.filter((t) => t.status === 'Floating');

    const totalRealized = realizedTrades.reduce((s, t) => s + t.labaBersih, 0);
    const totalFloating = floatingTrades.reduce((s, t) => s + t.labaBersih, 0);
    const totalLaba = totalRealized + totalFloating;

    const lastTrade = trades.length > 0 ? trades[trades.length - 1] : null;

    // Total floating capital for Net ROI calculation
    const totalModalFloating = floatingTrades.reduce((s, t) => s + t.nominalIdr, 0);
    const netRoi = totalModalFloating > 0 ? (totalLaba / totalModalFloating) * 100 : 0;

    // Peak point date for dynamic reference line
    let peakDate = '';
    let maxVal = -Infinity;
    lineChartData.forEach((p) => {
      if (p.cummulativePnl > maxVal) {
        maxVal = p.cummulativePnl;
        peakDate = p.date;
      }
    });

    return {
      high,
      low,
      totalRealized,
      totalFloating,
      totalLaba,
      netRoi: Number(netRoi.toFixed(2)),
      lastTrade,
      peakDate
    };
  }, [trades, lineChartData]);

  // Bar Chart Data (Individual Trades)
  const barChartData = useMemo(() => {
    return trades.map((t, idx) => ({
      id: t.id,
      index: idx + 1,
      asset: t.asset,
      pnl: t.labaBersih,
      pnlPercent: t.pnlPercent,
      nominal: t.nominalIdr,
      status: t.status
    }));
  }, [trades]);

  // Format currency for Y axis (e.g. "Rp 2.4 Jt", "Rp 710 Rb")
  const formatYAxis = (val: number) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 1_000_000) {
      const jt = (absVal / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 });
      return `${sign}Rp ${jt} Jt`;
    }
    if (absVal >= 1_000) {
      const rb = Math.round(absVal / 1_000);
      return `${sign}Rp ${rb} Rb`;
    }
    return `${sign}Rp ${absVal}`;
  };

  // Custom Line Tooltip
  const CustomLineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-xl text-xs shadow-2xl border font-mono ${
          isDark
            ? 'bg-slate-900 border-white/20 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-white/10 dark:border-white/10">
            <span className="font-bold">{data.label}</span>
            {data.isFloating && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-400/30">
                Floating Aktif
              </span>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Kumulatif Laba:</span>
              <strong className={data.cummulativePnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {data.cummulativePnl >= 0 ? `+${formatRupiah(data.cummulativePnl)}` : formatRupiah(data.cummulativePnl)}
              </strong>
            </div>
            {data.asset !== 'FLOATING' && (
              <div className="flex items-center justify-between gap-4 text-[11px]">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Laba Posisi Ini:</span>
                <span className={data.tradePnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {data.tradePnl >= 0 ? `+${formatRupiah(data.tradePnl)}` : formatRupiah(data.tradePnl)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Bar Tooltip
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-xl text-xs shadow-2xl border font-mono ${
          isDark
            ? 'bg-slate-900 border-white/20 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-white/10">
            <span className="font-bold">
              #{data.index} {data.asset}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
              data.status === 'Floating'
                ? 'bg-sky-500/20 text-sky-400 border-sky-400/30'
                : 'bg-blue-500/20 text-blue-400 border-blue-400/30'
            }`}>
              {data.status}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Laba Bersih:</span>
              <strong className={data.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {data.pnl >= 0 ? `+${formatRupiah(data.pnl)}` : formatRupiah(data.pnl)}
              </strong>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Return:</span>
              <span className={data.pnlPercent >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {data.pnlPercent >= 0 ? `+${data.pnlPercent}%` : `${data.pnlPercent}%`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`w-full rounded-2xl sm:rounded-3xl p-5 sm:p-7 border transition-all duration-300 shadow-xl relative overflow-hidden ${
        isDark
          ? 'bg-slate-900/80 border-white/10 text-white backdrop-blur-md'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Akumulasi Pertumbuhan Laba Bersih (Realized + Floating)
            </h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
              isDark
                ? sheetConnected ? 'bg-sky-500/15 border-sky-500/30 text-sky-400' : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                : sheetConnected ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              {sheetConnected ? 'Sinkron Google Sheet' : 'Terputus (Default Rp 0)'}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
              chartMetrics.totalLaba >= 0
                ? isDark ? 'text-white' : 'text-slate-900'
                : 'text-red-400'
            }`}>
              {chartMetrics.totalLaba >= 0 ? `+${formatRupiah(chartMetrics.totalLaba)}` : formatRupiah(chartMetrics.totalLaba)}
            </span>
            <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full font-mono border ${
              chartMetrics.netRoi >= 0
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/15 border-red-500/30 text-red-400'
            }`}>
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{chartMetrics.netRoi >= 0 ? `+${chartMetrics.netRoi}%` : `${chartMetrics.netRoi}%`} Net ROI</span>
            </span>
          </div>
        </div>

        {/* View Toggle */}
        <div className={`p-1 rounded-xl border flex items-center gap-1 self-start sm:self-auto ${
          isDark ? 'bg-slate-950 border-white/10' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setChartType('line')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartType === 'line'
                ? 'bg-blue-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            <span>Kurva Akumulasi</span>
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartType === 'bar'
                ? 'bg-blue-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Hasil Per Transaksi</span>
          </button>
        </div>
      </div>

      {/* Sub-stats Row */}
      <div className={`flex items-center justify-between flex-wrap gap-2 text-xs font-mono mb-5 pt-1 border-t ${
        isDark ? 'border-white/5 text-slate-400' : 'border-slate-100 text-slate-600'
      }`}>
        <div>
          {chartMetrics.lastTrade ? (
            <span>
              Transaksi Terakhir:{' '}
              <strong className={chartMetrics.lastTrade.labaBersih >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {chartMetrics.lastTrade.labaBersih >= 0
                  ? `+${formatRupiah(chartMetrics.lastTrade.labaBersih)}`
                  : formatRupiah(chartMetrics.lastTrade.labaBersih)}
              </strong>
            </span>
          ) : (
            <span>Transaksi Terakhir: <strong className="text-slate-400">—</strong></span>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <span>
            High: <strong className="text-sky-400 font-semibold">{formatYAxis(chartMetrics.high)}</strong>
          </span>
          <span>
            Low: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{formatYAxis(chartMetrics.low)}</strong>
          </span>
          <span>
            Realized: <strong className="text-emerald-400 font-semibold">{formatRupiah(chartMetrics.totalRealized)}</strong>
          </span>
          <span>
            Floating: <strong className="text-sky-400 font-semibold">{formatRupiah(chartMetrics.totalFloating)}</strong>
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-80 w-full">
        {chartType === 'line' ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={lineChartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
            >
              <defs>
                <pattern id="equityDotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle
                    cx="10"
                    cy="10"
                    r="0.8"
                    fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'}
                  />
                </pattern>
                <filter id="whiteLineGlow" x="-100%" y="-100%" width="300%" height="300%">
                  <feDropShadow
                    dx="0"
                    dy="4"
                    stdDeviation="5"
                    floodColor={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(37, 99, 235, 0.3)'}
                  />
                </filter>
              </defs>

              <rect x="0" y="0" width="100%" height="100%" fill="url(#equityDotGrid)" style={{ pointerEvents: 'none' }} />

              <CartesianGrid
                strokeDasharray="4 8"
                stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)'}
                vertical={false}
              />

              {chartMetrics.peakDate && (
                <ReferenceLine
                  x={chartMetrics.peakDate}
                  stroke={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.25)'}
                  strokeDasharray="3 3"
                />
              )}

              <ReferenceLine y={0} stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.2)'} />

              <XAxis
                dataKey="date"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                fontFamily="monospace"
              />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
                fontFamily="monospace"
              />

              <Tooltip content={<CustomLineTooltip />} />

              <Line
                type="monotone"
                dataKey="cummulativePnl"
                stroke={isDark ? '#ffffff' : '#2563eb'}
                strokeWidth={3}
                filter="url(#whiteLineGlow)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isLast) {
                    return (
                      <circle
                        key={cx}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill="#38bdf8"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }
                  return (
                    <circle
                      key={cx}
                      cx={cx}
                      cy={cy}
                      r={3.5}
                      fill={isDark ? '#ffffff' : '#2563eb'}
                      stroke={isDark ? '#0f172a' : '#ffffff'}
                      strokeWidth={1.5}
                    />
                  );
                }}
                activeDot={{ r: 6, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={barChartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
            >
              <defs>
                <pattern id="equityDotGridBar" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle
                    cx="10"
                    cy="10"
                    r="0.8"
                    fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'}
                  />
                </pattern>
              </defs>

              <rect x="0" y="0" width="100%" height="100%" fill="url(#equityDotGridBar)" style={{ pointerEvents: 'none' }} />

              <CartesianGrid
                strokeDasharray="4 8"
                stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)'}
                vertical={false}
              />

              <ReferenceLine y={0} stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.2)'} />

              <XAxis
                dataKey="asset"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                fontFamily="monospace"
              />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
                fontFamily="monospace"
              />

              <Tooltip content={<CustomBarTooltip />} />

              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {barChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
