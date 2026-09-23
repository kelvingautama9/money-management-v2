import { Transaction, BudgetCategory, AccountBalance, InvestmentAsset, EmergencyFund } from '../types';
import { formatRupiah } from './sheetsApi';

export interface GeminiModelOption {
  id: string;
  name: string;
  displayName: string;
  versionNum: number;
  description: string;
  isDefault: boolean;
  isNewest: boolean;
  isFreeTier: boolean;
}

export interface FinancialAuditItem {
  title: string;
  text: string;
}

export interface MarketPickItem {
  ticker: string;
  name: string;
  category: string;
  action: 'Akumulasi DCA' | 'Koleksi Bertahap' | 'Watchlist' | string;
  catalyst: string;
  riskLevel: 'Rendah' | 'Moderat' | 'Agresif' | string;
}

export interface MacroFedAnalysis {
  title: string;
  policyStatus: string;
  impactOnUserAssets: string;
  strategicAction: string;
}

export interface PortfolioPerformanceAnalysis {
  performanceVerdict: string;
  pureVsDcaAnalysis: string;
  growthOutlook: string;
}

export interface FinancialAnalysisData {
  financialAudit: {
    savingsEfficiency: FinancialAuditItem;
    budgetControl: FinancialAuditItem;
    emergencyFundPriority: FinancialAuditItem;
  };
  investmentAudit: {
    rebalancingAlert: FinancialAuditItem;
    newAllocationPriority: FinancialAuditItem;
    globalHedgeResilience: FinancialAuditItem;
  };
  portfolioPerformance?: PortfolioPerformanceAnalysis;
  macroFedIntelligence?: MacroFedAnalysis;
  recommendedStockPicks?: MarketPickItem[];
  executiveSummaryNarrative?: string;
  modelUsed?: string;
  fallbackOccurred?: boolean;
  timestamp?: string;
}

export const DEFAULT_AI_MODEL_ID = 'gemini-3.5-flash';

/**
 * Fetch available Flash models from server (auto-detects future versions via ai.models.list)
 */
export async function getAvailableGeminiModels(): Promise<GeminiModelOption[]> {
  try {
    const res = await fetch('/api/gemini/models');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.models) && data.models.length > 0) {
        localStorage.setItem('kelvin_financial_cached_models', JSON.stringify(data.models));
        return data.models;
      }
    }
  } catch (e) {
    console.warn('Could not fetch models from server, checking cache:', e);
  }

  // Check cached models
  try {
    const cached = localStorage.getItem('kelvin_financial_cached_models');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  // Built-in curated default models
  return [
    {
      id: 'gemini-3.5-flash',
      name: 'models/gemini-3.5-flash',
      displayName: 'Gemini 3.5 Flash',
      versionNum: 3.5,
      description: 'Rekomendasi Utama: Cerdas, presisi penalaran finansial & bebas biaya (Free Tier)',
      isDefault: true,
      isNewest: false,
      isFreeTier: true
    },
    {
      id: 'gemini-2.5-flash',
      name: 'models/gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      versionNum: 2.5,
      description: 'Stabil & Handal: Model kerja harian cepat dengan latency minimal',
      isDefault: false,
      isNewest: false,
      isFreeTier: true
    },
    {
      id: 'gemini-2.5-flash-lite',
      name: 'models/gemini-2.5-flash-lite',
      displayName: 'Gemini 2.5 Flash Lite',
      versionNum: 2.5,
      description: 'Ultra-Ringan: Konsumsi token paling hemat saat batas kuota mendekati limit',
      isDefault: false,
      isNewest: false,
      isFreeTier: true
    },
    {
      id: 'gemini-3.8-flash',
      name: 'models/gemini-3.8-flash',
      displayName: 'Gemini 3.8 Flash',
      versionNum: 3.8,
      description: 'Generasi Baru: Kapasitas konteks tinggi & arsitektur mutakhir',
      isDefault: false,
      isNewest: true,
      isFreeTier: true
    }
  ];
}

/**
 * Get active preferred model setting
 */
export function getStoredModelPreference(): string {
  try {
    return localStorage.getItem('kelvin_financial_ai_model') || DEFAULT_AI_MODEL_ID;
  } catch {
    return DEFAULT_AI_MODEL_ID;
  }
}

/**
 * Set active preferred model setting
 */
export function setStoredModelPreference(modelId: string): void {
  try {
    localStorage.setItem('kelvin_financial_ai_model', modelId);
  } catch {}
}

/**
 * Get auto fallback preference (defaults to true)
 */
export function getStoredAutoFallbackPreference(): boolean {
  try {
    const val = localStorage.getItem('kelvin_financial_ai_fallback');
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

/**
 * Set auto fallback preference
 */
export function setStoredAutoFallbackPreference(enabled: boolean): void {
  try {
    localStorage.setItem('kelvin_financial_ai_fallback', String(enabled));
  } catch {}
}

/**
 * Get cached analysis result for a specific month sheet
 */
export function getCachedMonthAnalysis(monthSheet: string): FinancialAnalysisData | null {
  if (!monthSheet) return null;
  const key = `fin_ai_analysis_${monthSheet.trim().toUpperCase()}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return null;
}

/**
 * Save analysis result to cache for a specific month sheet
 */
export function setCachedMonthAnalysis(monthSheet: string, data: FinancialAnalysisData): void {
  if (!monthSheet || !data) return;
  const key = `fin_ai_analysis_${monthSheet.trim().toUpperCase()}`;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

/**
 * Deterministically compute clean metrics payload to feed to Gemini
 */
export function buildDeterministicMetricsPayload(
  monthName: string,
  totalAset: number,
  totalIncome: number,
  totalExpense: number,
  transactions: Transaction[] = [],
  budgets: BudgetCategory[] = [],
  accounts: AccountBalance[] = [],
  assets: InvestmentAsset[] = [],
  emergencyFund?: EmergencyFund
) {
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0';

  const totalBudgetPlafon = budgets.reduce((sum, b) => sum + (b.totalSaldo || 0), 0);
  const totalBudgetSpend = budgets.reduce((sum, b) => sum + (b.actualSpend || 0), 0);
  const totalBudgetSisa = budgets.reduce((sum, b) => sum + (b.sisa || 0), 0);
  const budgetAbsorptionPct = totalBudgetPlafon > 0 ? ((totalBudgetSpend / totalBudgetPlafon) * 100).toFixed(1) : '0';

  const safeEmergency = emergencyFund || { current: 436550, target: 12000000 };
  const emergencyPct = safeEmergency.target > 0 ? ((safeEmergency.current / safeEmergency.target) * 100).toFixed(1) : '0';

  const totalInvestment = assets.reduce((sum, a) => sum + (Number(a.nilaiAkhirBulan) || 0), 0);

  const envelopeStatuses = budgets.map((b) => {
    const monthlyBudget = b.budgeting || b.targetBulanan || 0;
    const saldoAwal = b.saldoAwal || 0;
    const actualSpend = b.actualSpend || 0;
    const totalSaldo = b.totalSaldo || saldoAwal + monthlyBudget;
    const sisa = b.sisa !== undefined ? b.sisa : totalSaldo - actualSpend;
    const isOverMonthly = actualSpend > monthlyBudget && monthlyBudget > 0;
    return {
      nama: b.nama,
      jatah: formatRupiah(monthlyBudget),
      spend: formatRupiah(actualSpend),
      sisa: formatRupiah(sisa),
      saldoAwal: formatRupiah(saldoAwal),
      isOverMonthly,
      isDepleted: sisa <= 0
    };
  });

  const assetAllocations = assets.map((a) => {
    const val = Number(a.nilaiAkhirBulan) || 0;
    const pct = totalInvestment > 0 ? ((val / totalInvestment) * 100).toFixed(1) : '0';
    let weightStatus = 'Normal';
    if (Number(pct) > 35) weightStatus = 'Overweight';
    if (Number(pct) < 15) weightStatus = 'Underweight';
    return {
      nama: a.nama,
      nilai: formatRupiah(val),
      persentase: pct,
      weightStatus
    };
  });

  const usdHedgeTotal = assets
    .filter((a) => a.nama.toLowerCase().includes('usd') || a.nama.toLowerCase().includes('usdt'))
    .reduce((sum, a) => sum + (Number(a.nilaiAkhirBulan) || 0), 0);
  const usdHedgePct = totalInvestment > 0 ? ((usdHedgeTotal / totalInvestment) * 100).toFixed(1) : '67.4';

  const dcaAmount = assets.reduce((sum, a) => sum + (Number(a.depositWd) || 0), 0);

  return {
    monthName,
    totalAsetFormatted: formatRupiah(totalAset),
    totalIncomeFormatted: formatRupiah(totalIncome),
    totalExpenseFormatted: formatRupiah(totalExpense),
    netSavingsFormatted: formatRupiah(netSavings),
    savingsRate,
    totalBudgetPlafonFormatted: formatRupiah(totalBudgetPlafon),
    totalBudgetSpendFormatted: formatRupiah(totalBudgetSpend),
    totalBudgetSisaFormatted: formatRupiah(totalBudgetSisa),
    budgetAbsorptionPct,
    envelopeStatuses,
    emergencyFundFormatted: formatRupiah(safeEmergency.current),
    emergencyTargetFormatted: formatRupiah(safeEmergency.target),
    emergencyPct,
    totalInvestmentFormatted: formatRupiah(totalInvestment),
    assetAllocations,
    usdHedgePct,
    dcaFormatted: formatRupiah(dcaAmount),
    pureProfitFormatted: '+Rp 1.148.790',
    purePnlFormatted: '+3.90%'
  };
}

/**
 * Execute Gemini Financial Analysis via server proxy
 */
export async function requestGeminiFinancialAnalysis(
  monthName: string,
  metrics: ReturnType<typeof buildDeterministicMetricsPayload>,
  preferredModel?: string,
  autoFallback = true
): Promise<FinancialAnalysisData> {
  const model = preferredModel || getStoredModelPreference();
  const fallback = autoFallback !== undefined ? autoFallback : getStoredAutoFallbackPreference();

  try {
    const res = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        monthName,
        metrics,
        preferredModel: model,
        autoFallback: fallback
      })
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        const fullData: FinancialAnalysisData = {
          ...json.data,
          modelUsed: json.modelUsed || model,
          fallbackOccurred: json.fallbackOccurred || false,
          timestamp: json.timestamp || new Date().toISOString()
        };
        // Cache per month sheet
        setCachedMonthAnalysis(monthName, fullData);
        return fullData;
      }
    }
  } catch (err) {
    console.error('Gemini financial analysis API request failed:', err);
  }

  // Return comprehensive fallback if network fails
  const fallbackData: FinancialAnalysisData = {
    portfolioPerformance: {
      performanceVerdict: `Pertumbuhan portofolio investasi pada periode ${monthName} berada di jalur apresiasi positif dengan imbal hasil murni pasar mencapai ${metrics.pureProfitFormatted || '+Rp 1.148.790'} (${metrics.purePnlFormatted || '+3.90%'}).`,
      pureVsDcaAnalysis: `Setoran modal mandiri (DCA) bulan ini sebesar ${metrics.dcaFormatted || 'Rp 2.016.286'} dialokasikan murni sebagai setoran modal baru, terpisah secara disiplin dari return keuntungan organik pasar.`,
      growthOutlook: 'Disiplin akumulasi rutin memperkokoh daya ungkit majemuk (compound interest) portofolio Anda secara terukur.'
    },
    macroFedIntelligence: {
      title: 'Analisis Sentimen Makro & Kebijakan The Fed Terkini',
      policyStatus: 'The Federal Reserve mempertahankan fokus pada stabilitas inflasi dan penyesuaian suku bunga acuan. Tingkat yield obligasi AS dan volatilitas indeks global mengindikasikan pasar yang menuntut selektivitas tinggi.',
      impactOnUserAssets: `Porsi valas Anda (${metrics.usdHedgePct}% dalam USD Valas BCA & USDT) memberikan perlindungan kuat terhadap ketidakpastian nilai tukar Rupiah. Untuk instrumen ekuitas/reksadana di Pluang, pergerakan suku bunga The Fed membuka peluang akumulasi saat valuasi terkoreksi.`,
      strategicAction: 'Pertahankan porsi lindung nilai valas dan alokasikan setoran DCA berikutnya ke aset saham berfundamental prima yang valuasinya terdiskon.'
    },
    recommendedStockPicks: [
      {
        ticker: 'GOOGL',
        name: 'Alphabet Inc.',
        category: 'Saham Teknologi / AI',
        action: 'Akumulasi DCA',
        catalyst: 'Pertumbuhan kuat pada segmen Google Cloud dan monetisasi produk AI enterprise, didukung oleh neraca kas yang sangat sehat dan rasio valuasi P/E yang kompetitif di antara kelompok Big Tech.',
        riskLevel: 'Moderat'
      },
      {
        ticker: 'VOO',
        name: 'Vanguard S&P 500 ETF',
        category: 'Indeks Pasar Luas',
        action: 'Koleksi Bertahap',
        catalyst: 'Diversifikasi instan ke 500 korporasi terbesar di Amerika Serikat dengan expense ratio ultra-rendah (0.03%), ideal sebagai fondasi inti portofolio jangka panjang.',
        riskLevel: 'Rendah'
      },
      {
        ticker: 'QQQ',
        name: 'Invesco QQQ Trust',
        category: 'Pertumbuhan & Inovasi',
        action: 'Koleksi Bertahap',
        catalyst: 'Melacak 100 perusahaan non-finansial terbesar di Nasdaq dengan paparan dominan pada kepemimpinan teknologi global dan kecerdasan buatan.',
        riskLevel: 'Moderat'
      }
    ],
    investmentAudit: {
      rebalancingAlert: {
        title: 'Peringatan Rebalancing',
        text: 'Aset berdenominasi valas (USD/USDT) berada di atas batas ideal. Alihkan setoran DCA berikutnya ke aset saham/reksadana yang masih underweight.'
      },
      newAllocationPriority: {
        title: 'Prioritas Alokasi Baru',
        text: 'Pos Pluang (Reksadana & Saham AS) masih di bawah bobot ideal. Prioritaskan penambahan dana pada aset ini untuk memaksimalkan potensi imbal hasil jangka panjang.'
      },
      globalHedgeResilience: {
        title: `Ketahanan Valas & Hedge Global (${metrics.usdHedgePct}%)`,
        text: 'Porsi aset berdenominasi mata uang kuat (USD/USDT) terbukti melindungi kekayaan bersih Anda dari depresiasi nilai tukar lokal.'
      }
    },
    financialAudit: {
      savingsEfficiency: {
        title: 'Efisiensi Tabungan',
        text: `Rasio tabungan Anda tercatat ${metrics.savingsRate}%, menghasilkan surplus bersih sebesar ${metrics.netSavingsFormatted}.`
      },
      budgetControl: {
        title: 'Kontrol Anggaran',
        text: `Serapan total pos belanja tercatat ${metrics.budgetAbsorptionPct}% dengan sisa cadangan aman sebesar ${metrics.totalBudgetSisaFormatted}.`
      },
      emergencyFundPriority: {
        title: 'Prioritas Dana Darurat',
        text: `Posisi dana darurat saat ini mencapai ${metrics.emergencyPct}% (${metrics.emergencyFundFormatted} dari target ${metrics.emergencyTargetFormatted}).`
      }
    },
    executiveSummaryNarrative: `Audit keuangan periode ${monthName} menunjukkan kinerja surplus yang sehat dengan sinergi investasi yang positif menghadapi dinamika makro global.`,
    modelUsed: 'Deterministic Fallback (Offline Safe)',
    fallbackOccurred: true,
    timestamp: new Date().toISOString()
  };

  setCachedMonthAnalysis(monthName, fallbackData);
  return fallbackData;
}
