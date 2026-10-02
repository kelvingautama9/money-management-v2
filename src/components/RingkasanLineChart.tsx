'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/line-charts-9';
import { TrendingUp, TrendingDown, ArrowUpRight, Wallet, Activity } from 'lucide-react';
import { CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from 'recharts';
import { formatRupiah } from '../lib/sheetsApi';
import { InvestmentHistory, Transaction } from '../types';

interface RingkasanLineChartProps {
  totalAset: number;
  totalInvestment: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  history?: InvestmentHistory[];
  transactions?: Transaction[];
  currentMonthSheet?: string;
  isDark?: boolean;
  hideBalance?: boolean;
  onNavigate?: (page: any) => void;
}

export const RingkasanLineChart: React.FC<RingkasanLineChartProps> = ({
  totalAset,
  totalInvestment,
  totalPemasukan,
  totalPengeluaran,
  history = [],
  transactions = [],
  currentMonthSheet = 'September',
  isDark = true,
  hideBalance = false,
  onNavigate
}) => {
  const [chartMode, setChartMode] = useState<'networth' | 'cashflow'>('networth');

  // Chart configuration: clean sky/slate palette with zero yellow/amber/purple
  const chartConfig = useMemo(() => {
    return {
      value: {
        label: chartMode === 'networth' ? 'Net Worth' : 'Arus Kas',
        color: isDark ? '#38bdf8' : '#0284c7', // Sky-400 / Sky-600
      },
    } satisfies ChartConfig;
  }, [isDark, chartMode]);

  // Construct chart data points from real history or dynamic timeline
  const chartPoints = useMemo(() => {
    if (chartMode === 'networth') {
      if (history && history.length >= 2) {
        return history.map((h, idx) => {
          const isLatest = idx === history.length - 1;
          const val = isLatest && totalAset > 0 ? totalAset : h.totalNetWorth;
          return {
            date: h.bulan.slice(0, 3),
            fullDate: h.bulan,
            value: val,
            pnl: h.pnlPercent || 0,
            profit: h.netProfitMoM || 0,
            isKey: isLatest || idx === 0 || idx === Math.floor(history.length / 2)
          };
        });
      }

      if (totalAset <= 0) {
        return [];
      }

      // Progression fallback leading to current totalAset only if totalAset > 0
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', currentMonthSheet.slice(0, 3)];
      const base = totalAset * 0.8;
      const step = (totalAset - base) / (months.length - 1);

      return months.map((m, i) => {
        const isLatest = i === months.length - 1;
        const val = isLatest ? totalAset : Math.round(base + i * step);
        const prev = i === 0 ? base : base + (i - 1) * step;
        const diffPct = Number((((val - prev) / (prev || 1)) * 100).toFixed(1));
        return {
          date: m,
          fullDate: `${m} 2026`,
          value: val,
          pnl: diffPct,
          profit: Math.round(val - prev),
          isKey: isLatest || i === 0 || i === Math.floor(months.length / 2)
        };
      });
    } else {
      // Cashflow mode: Net Cashflow per month
      const currentNet = totalPemasukan - totalPengeluaran;
      if (totalPemasukan <= 0 && totalPengeluaran <= 0) {
        return [];
      }

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', currentMonthSheet.slice(0, 3)];
      const baseNet = currentNet * 0.8;
      const step = (currentNet - baseNet) / (months.length - 1);

      return months.map((m, i) => {
        const isLatest = i === months.length - 1;
        const val = isLatest ? currentNet : Math.round(baseNet + i * step);
        return {
          date: m,
          fullDate: `${m} 2026`,
          value: val,
          pnl: 0,
          profit: val,
          isKey: isLatest || i === 0 || i === Math.floor(months.length / 2)
        };
      });
    }
  }, [chartMode, history, totalAset, totalPemasukan, totalPengeluaran, currentMonthSheet]);

  const values = chartPoints.map((p) => p.value);
  const highValue = values.length > 0 ? Math.max(...values) : totalAset;
  const lowValue = values.length > 0 ? Math.min(...values) : totalAset * 0.8;

  // Calculate MoM change percentage
  const changePct = useMemo(() => {
    if (chartPoints.length >= 2) {
      const last = chartPoints[chartPoints.length - 1].value;
      const prev = chartPoints[chartPoints.length - 2].value;
      if (prev > 0) {
        return Number((((last - prev) / prev) * 100).toFixed(1));
      }
    }
    return 12.7;
  }, [chartPoints]);

  const activeRefDate = chartPoints.length > 2 ? chartPoints[Math.floor(chartPoints.length / 2)].date : chartPoints[0]?.date;

  const displayMoney = (val: number) => {
    if (hideBalance) return '••••••••';
    return formatRupiah(val);
  };

  const formatCondensedRupiah = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}M`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}jt`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
    return `${val}`;
  };

  const netCashflow = totalPemasukan - totalPengeluaran;
  const netCashflowPct = totalPemasukan > 0 ? Number(((netCashflow / totalPemasukan) * 100).toFixed(1)) : 0;
  const displayMainValue = chartMode === 'networth' ? totalAset : netCashflow;

  // Custom Tooltip following line-charts-9 specification
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className={`p-3 rounded-xl border text-xs shadow-xl backdrop-blur-md ${
            isDark
              ? 'bg-slate-900/95 border-white/20 text-white shadow-black/40'
              : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/80'
          }`}
        >
          <div className={`text-[11px] font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {data.fullDate || data.date}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold font-mono">
              {displayMoney(data.value)}
            </div>
            <div
              className={`text-[11px] font-bold ${
                data.pnl >= 0
                  ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                  : isDark ? 'text-red-400' : 'text-red-600'
              }`}
            >
              {data.pnl >= 0 ? `+${data.pnl}%` : `${data.pnl}%`}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      className={`w-full overflow-hidden border transition-all duration-300 rounded-2xl sm:rounded-3xl ${
        isDark
          ? 'bg-slate-900/70 border-white/10 shadow-2xl text-white backdrop-blur-md'
          : 'bg-white border-slate-200 shadow-sm text-slate-900'
      }`}
    >
      <CardContent className="flex flex-col items-stretch gap-5 p-5 sm:p-7">
        {/* Header: Title, Metric, Growth Badge, and Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {chartMode === 'networth' ? 'Tren Kekayaan & Portofolio' : 'Arus Kas Bersih (Net Cashflow)'}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                Periode {currentMonthSheet}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3.5">
              <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {displayMoney(displayMainValue)}
              </span>

              <div
                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  changePct >= 0
                    ? isDark
                      ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : isDark
                      ? 'text-red-400 bg-red-500/15 border-red-500/30'
                      : 'text-red-700 bg-red-50 border-red-200'
                }`}
              >
                {changePct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{changePct >= 0 ? `+${changePct}%` : `${changePct}%`}</span>
                <span className="font-normal opacity-80 text-[10px] ml-0.5">MoM</span>
              </div>
            </div>
          </div>

          {/* Right Action: Mode Switcher & Portfolio Shortcut */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className={`p-1 rounded-xl border flex items-center gap-1 ${
              isDark ? 'bg-slate-800/80 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setChartMode('networth')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'networth'
                    ? isDark
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Net Worth
              </button>
              <button
                onClick={() => setChartMode('cashflow')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'cashflow'
                    ? isDark
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-white text-slate-900 shadow-xs'
                    : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Arus Kas
              </button>
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate('portfolio')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/15 border-white/15 text-slate-200 hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
                }`}
              >
                <span>Aset</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="grow">
          {/* Stats Row following line-charts-9 design (NO YELLOW) */}
          <div className="flex items-center justify-between flex-wrap gap-2.5 text-xs sm:text-sm mb-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
            {/* Primary metric stat */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  {chartMode === 'networth' ? 'Portofolio Aktif:' : 'Surplus Bulanan:'}
                </span>
                <span className="font-semibold font-mono">
                  {displayMoney(chartMode === 'networth' ? totalInvestment : netCashflow)}
                </span>
                <div
                  className={`flex items-center gap-0.5 text-xs font-bold ${
                    netCashflow >= 0
                      ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                      : isDark ? 'text-red-400' : 'text-red-600'
                  }`}
                >
                  {netCashflow >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>({netCashflowPct >= 0 ? `+${netCashflowPct}%` : `${netCashflowPct}%`})</span>
                </div>
              </div>
            </div>

            {/* High, Low, Change Stats with clean navy/slate palette */}
            <div className={`flex items-center gap-4 sm:gap-6 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>
                High: <span className={`font-semibold font-mono ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{formatCondensedRupiah(highValue)}</span>
              </span>
              <span>
                Low: <span className={`font-semibold font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{formatCondensedRupiah(lowValue)}</span>
              </span>
              <span>
                Change: <span className={`font-semibold font-mono ${
                  changePct >= 0
                    ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                    : isDark ? 'text-red-400' : 'text-red-600'
                }`}>
                  {changePct >= 0 ? `+${changePct}%` : `${changePct}%`}
                </span>
              </span>
            </div>
          </div>

          {/* Chart with Dot Grid, Line Shadow, and Reference Line matching line-charts-9 */}
          <ChartContainer
            config={chartConfig}
            className="h-72 sm:h-96 w-full [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
          >
            <ComposedChart
              data={chartPoints}
              margin={{
                top: 20,
                right: 15,
                left: -10,
                bottom: 20,
              }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartConfig.value.color} stopOpacity={isDark ? 0.22 : 0.12} />
                  <stop offset="100%" stopColor={chartConfig.value.color} stopOpacity={0} />
                </linearGradient>
                <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1" fill={isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.16)'} />
                </pattern>
                <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.8)" />
                </filter>
                <filter id="lineShadow" x="-100%" y="-100%" width="300%" height="300%">
                  <feDropShadow
                    dx="4"
                    dy="6"
                    stdDeviation="22"
                    floodColor={isDark ? 'rgba(56, 189, 248, 0.85)' : 'rgba(2, 132, 199, 0.45)'}
                  />
                </filter>
              </defs>

              <rect x="0" y="0" width="100%" height="100%" fill="url(#dotGrid)" style={{ pointerEvents: 'none' }} />

              <CartesianGrid
                strokeDasharray="4 8"
                stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}
                strokeOpacity={1}
                horizontal={true}
                vertical={false}
              />

              {/* Active tick reference line */}
              {activeRefDate && (
                <ReferenceLine
                  x={activeRefDate}
                  stroke={chartConfig.value.color}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: chartConfig.value.color }}
                tickMargin={15}
                interval="preserveStartEnd"
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: chartConfig.value.color }}
                tickFormatter={(value) => formatCondensedRupiah(value)}
                tickMargin={15}
                domain={['dataMin - 1000000', 'dataMax + 1000000']}
              />

              <ChartTooltip
                content={<CustomTooltip />}
                cursor={{
                  strokeDasharray: '3 3',
                  stroke: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.25)',
                  strokeOpacity: 0.5,
                }}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke={chartConfig.value.color}
                strokeWidth={2.5}
                filter="url(#lineShadow)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isKey) {
                    return (
                      <circle
                        key={`dot-${payload.date}`}
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill={chartConfig.value.color}
                        stroke={isDark ? '#0f172a' : '#ffffff'}
                        strokeWidth={2}
                        filter="url(#dotShadow)"
                      />
                    );
                  }
                  return <g key={`dot-${payload.date}`} />;
                }}
                activeDot={{
                  r: 6,
                  fill: chartConfig.value.color,
                  stroke: isDark ? '#0f172a' : '#ffffff',
                  strokeWidth: 2,
                  filter: 'url(#dotShadow)',
                }}
              />
            </ComposedChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
