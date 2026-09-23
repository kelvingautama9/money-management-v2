import { InvestmentAsset, InvestmentHistory, Transaction } from '../types';
import {
  INITIAL_INVESTMENT_ASSETS_BY_MONTH,
  INITIAL_INVESTMENT_HISTORY,
  calculateMonthlyDCA
} from '../data/initialData';

export interface MonthlyInvestmentMetrics {
  monthKey: string;
  isClosed: boolean;
  isPendingValuation: boolean;
  totalCurrentInvestment: number;
  totalDCA: number;
  pureProfit: number;
  purePnl: number;
  prevNetWorth: number;
  assets: InvestmentAsset[];
  historyRecord: InvestmentHistory | null;
}

/**
 * Derives accurate, month-synchronized investment portfolio metrics.
 * Ensures:
 * 1. DCA is dynamically matched to the active month (e.g. Mei = 0, September = 2.016.286, Agustus = 2.000.000).
 * 2. Closed months (e.g. Agustus, Mei, Juni, Juli) report their actual realized closing profit/return,
 *    instead of showing "Menunggu Closing Akhir Bulan".
 * 3. Ongoing active month (September) properly displays Pending Closing without phantom losses.
 */
export function getMonthlyInvestmentMetrics(
  monthName: string,
  rawAssets: InvestmentAsset[] = [],
  history: InvestmentHistory[] = INITIAL_INVESTMENT_HISTORY,
  transactions: Transaction[] = []
): MonthlyInvestmentMetrics {
  const cleanMonth = (monthName || '').trim();
  const normalizedKey = cleanMonth.toUpperCase().replace(/[^A-Z]/g, '');

  const historyList = Array.isArray(history) && history.length > 0 ? history : INITIAL_INVESTMENT_HISTORY;
  const historyIndex = historyList.findIndex((h) => {
    const hKey = h.bulan.toUpperCase().replace(/[^A-Z]/g, '');
    return hKey.includes(normalizedKey) || normalizedKey.includes(hKey);
  });
  const historyRecord = historyIndex >= 0 ? historyList[historyIndex] : null;

  // Previous month baseline
  const prevMonthIndex = historyIndex > 0 ? historyIndex - 1 : (historyList.length >= 2 ? historyList.length - 2 : -1);
  const prevMonth = prevMonthIndex >= 0 ? historyList[prevMonthIndex] : null;
  const prevNetWorth = prevMonth?.totalNetWorth || 51705076;

  // Dynamic DCA for active month
  let totalDCA = 0;
  if (transactions && transactions.length > 0) {
    totalDCA = calculateMonthlyDCA(transactions, cleanMonth);
  }
  if (totalDCA === 0 && rawAssets && rawAssets.length > 0) {
    const rawDCA = rawAssets.reduce((sum, a) => sum + (Number(a.depositWd) || 0), 0);
    if (rawDCA > 0) totalDCA = rawDCA;
  }
  if (totalDCA === 0 && historyRecord?.dca !== undefined && historyRecord.dca > 0) {
    totalDCA = historyRecord.dca;
  }
  if (totalDCA === 0) {
    const preset = INITIAL_INVESTMENT_ASSETS_BY_MONTH[normalizedKey];
    if (preset) {
      totalDCA = preset.reduce((sum, a) => sum + (Number(a.depositWd) || 0), 0);
    }
  }

  // Determine if month is closed vs pending closing
  let isClosed = false;
  if (historyRecord && historyRecord.isClosed !== undefined) {
    isClosed = historyRecord.isClosed;
  } else if (historyIndex >= 0 && historyIndex < historyList.length - 1) {
    isClosed = true;
  } else if (['APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS'].includes(normalizedKey)) {
    isClosed = true;
  }

  const isPendingValuation = !isClosed;

  // Resolve assets breakdown for this month
  let baseAssets: InvestmentAsset[] = [];
  if (rawAssets && rawAssets.length > 0 && normalizedKey === 'SEPTEMBER') {
    baseAssets = rawAssets.map((a) => ({ ...a }));
  } else if (INITIAL_INVESTMENT_ASSETS_BY_MONTH[normalizedKey]) {
    baseAssets = INITIAL_INVESTMENT_ASSETS_BY_MONTH[normalizedKey].map((a) => ({ ...a }));
  } else if (rawAssets && rawAssets.length > 0) {
    baseAssets = rawAssets.map((a) => ({ ...a }));
  } else {
    baseAssets = (INITIAL_INVESTMENT_ASSETS_BY_MONTH['SEPTEMBER'] || []).map((a) => ({ ...a }));
  }

  // Synchronize depositWd on Pluang / primary DCA asset
  const resolvedAssets = baseAssets.map((asset, idx) => {
    const isPluang = asset.nama.toLowerCase().includes('pluang');
    const depositWd = isPluang || idx === 0 ? totalDCA : (Number(asset.depositWd) || 0);
    return {
      ...asset,
      depositWd
    };
  });

  const totalCurrentInvestment = resolvedAssets.reduce((sum, a) => sum + (Number(a.nilaiAkhirBulan) || 0), 0);

  const finalAssets = resolvedAssets.map((a) => ({
    ...a,
    alokasiPercent: totalCurrentInvestment > 0 ? Number(((a.nilaiAkhirBulan / totalCurrentInvestment) * 100).toFixed(1)) : 0
  }));

  // Return calculation
  let pureProfit = 0;
  let purePnl = 0;

  if (isClosed && historyRecord) {
    pureProfit = historyRecord.netProfitMoM;
    purePnl = historyRecord.pnlPercent;
  } else if (!isPendingValuation) {
    const grossGrowth = totalCurrentInvestment - prevNetWorth;
    pureProfit = grossGrowth - totalDCA;
    const denominator = prevNetWorth + (totalDCA > 0 ? totalDCA / 2 : 0);
    purePnl = denominator > 0 ? Number(((pureProfit / denominator) * 100).toFixed(2)) : 0;
  } else {
    pureProfit = 0;
    purePnl = 0;
  }

  return {
    monthKey: normalizedKey,
    isClosed,
    isPendingValuation,
    totalCurrentInvestment,
    totalDCA,
    pureProfit,
    purePnl,
    prevNetWorth,
    assets: finalAssets,
    historyRecord
  };
}
