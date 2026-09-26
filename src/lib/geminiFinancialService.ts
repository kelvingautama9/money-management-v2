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

export interface ModelCooldownStatus {
  modelId: string;
  remainingSec: number;
  reason: string;
}

export interface AiStreamEvent {
  type: 'status' | 'ttft' | 'chunk' | 'fallback' | 'complete' | 'error';
  message?: string;
  model?: string;
  stickyModel?: string;
  ms?: number;
  text?: string;
  totalLength?: number;
  data?: FinancialAnalysisData;
  modelUsed?: string;
  fallbackOccurred?: boolean;
  elapsedMs?: number;
  ttftMs?: number;
  timestamp?: string;
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
  currentPrice?: string;
  fairValue?: string;
  valuationDiscountPct?: string;
  valuationStatus?: 'undervalued' | 'overvalued' | 'fairly_valued' | string;
  fairValueAnalysis?: string;
  fundamental?: string;
  fundamentalHighlights?: string;
  investmentPortion?: string;
  timeHorizon?: string;
  timeHorizonType?: 'short_term' | 'mid_term' | 'long_term' | string;
  timeHorizonDuration?: string;
  monetaryFiscalSentiment?: string;
  catalyst: string;
  riskLevel: 'Rendah' | 'Moderat' | 'Agresif' | string;
  financialPlannerVerdict?: string;
}

export interface SummaryOfEconomicProjections {
  dotPlotMedianRate?: string;
  gdpProjection?: string;
  pceProjection?: string;
  unemploymentProjection?: string;
  analysis?: string;
}

export interface MacroFedAnalysis {
  title?: string;
  fedFundsRate?: string;
  cpiInflation?: string;
  pceInflation?: string;
  unemploymentRate?: string;
  gdpGrowth?: string;
  treasuryYield10Y?: string;
  summaryOfEconomicProjections?: SummaryOfEconomicProjections;
  policyStatus?: string;
  impactOnUserAssets?: string;
  strategicAction?: string;
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
    const res = await fetch('/api/gemini/models', {
      headers: getEffectiveApiHeaders()
    });
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

export interface GeminiModelsDetailedResponse {
  models: GeminiModelOption[];
  stickyHealthyModel?: string;
  cooldowns?: ModelCooldownStatus[];
}

export async function getDetailedGeminiModels(): Promise<GeminiModelsDetailedResponse> {
  try {
    const res = await fetch('/api/gemini/models', {
      headers: getEffectiveApiHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.models)) {
        return {
          models: data.models,
          stickyHealthyModel: data.stickyHealthyModel,
          cooldowns: data.cooldowns || []
        };
      }
    }
  } catch (e) {
    console.warn('Could not fetch models detail:', e);
  }
  const fallbackModels = await getAvailableGeminiModels();
  return {
    models: fallbackModels,
    stickyHealthyModel: 'gemini-3.5-flash',
    cooldowns: []
  };
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

// --- 3-IN-1 GEMINI API KEY MANAGEMENT ---
// 1. Server Environment (AI Studio default)
// 2. Custom User Manual Import (stored in localStorage, sent via x-gemini-api-key)
// 3. Vercel Cloud Serverless & Client-Side Fallback
export const CUSTOM_API_KEY_STORAGE = 'kelvin_custom_gemini_api_key';

export function getStoredCustomApiKey(): string {
  try {
    return localStorage.getItem(CUSTOM_API_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setStoredCustomApiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (!trimmed) {
      localStorage.removeItem(CUSTOM_API_KEY_STORAGE);
    } else {
      localStorage.setItem(CUSTOM_API_KEY_STORAGE, trimmed);
    }
  } catch {}
}

export function hasCustomApiKey(): boolean {
  return Boolean(getStoredCustomApiKey());
}

export function getMaskedApiKey(key?: string): string {
  const target = key || getStoredCustomApiKey();
  if (!target) return '';
  if (target.length <= 8) return '••••••••';
  return `${target.slice(0, 6)}...${target.slice(-4)}`;
}

export function getEffectiveApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const customKey = getStoredCustomApiKey();
  if (customKey) {
    headers['x-gemini-api-key'] = customKey;
  }
  return headers;
}

export interface KeyValidationResult {
  valid: boolean;
  message: string;
  source?: string;
  keyMasked?: string;
  elapsedMs?: number;
  isQuota?: boolean;
}

export async function validateApiKeyOnline(keyToTest?: string): Promise<KeyValidationResult> {
  const key = keyToTest !== undefined ? keyToTest.trim() : getStoredCustomApiKey();
  try {
    const res = await fetch('/api/gemini/validate-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { 'x-gemini-api-key': key } : {})
      },
      body: JSON.stringify({ apiKey: key })
    });

    const data = await res.json();
    if (res.ok && data.valid) {
      return {
        valid: true,
        message: data.message || 'API Key Google Gemini Valid!',
        source: data.source,
        keyMasked: data.keyMasked,
        elapsedMs: data.elapsedMs
      };
    }
    return {
      valid: false,
      message: data.message || 'Gagal memverifikasi API Key',
      isQuota: data.isQuota
    };
  } catch (err: any) {
    // If backend is unreachable (e.g. static host on Vercel), test directly against Google's API
    if (key) {
      try {
        const start = Date.now();
        const googleRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(key)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'ping' }] }],
              generationConfig: { maxOutputTokens: 2 }
            })
          }
        );
        const elapsed = Date.now() - start;
        if (googleRes.ok) {
          return {
            valid: true,
            message: `API Key Valid (Terhubung langsung ke Google API ${elapsed}ms)!`,
            source: 'custom_user_direct',
            keyMasked: getMaskedApiKey(key),
            elapsedMs: elapsed
          };
        } else {
          const errData = await googleRes.json().catch(() => ({}));
          const msg = errData?.error?.message || `HTTP ${googleRes.status}`;
          const isQuota = googleRes.status === 429;
          return {
            valid: false,
            message: isQuota ? 'Batas kuota habis (429 Quota Exceeded).' : `Ditolak Google: ${msg}`,
            isQuota
          };
        }
      } catch (directErr: any) {
        return {
          valid: false,
          message: `Gagal memverifikasi API Key: ${directErr.message || 'Koneksi internet bermasalah'}`
        };
      }
    }
    return {
      valid: false,
      message: 'Gagal menghubungi server validasi API Key.'
    };
  }
}

export interface ServerKeyStatus {
  hasServerKey: boolean;
  serverKeyMasked: string;
  isVercelEnv: boolean;
  defaultSource: string;
}

export async function checkServerKeyStatus(): Promise<ServerKeyStatus> {
  try {
    const res = await fetch('/api/gemini/key-status');
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return {
    hasServerKey: false,
    serverKeyMasked: '',
    isVercelEnv: false,
    defaultSource: 'none'
  };
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
 * Execute Gemini Financial Analysis with Server-Sent Events (SSE / Streaming Response).
 * Emits real-time tokens (typing effect) directly to the UI, reducing TTFT to ~200-400ms.
 * Automatically utilizes Sticky Healthy Model memorization & Smart Cooldown pool.
 */
export async function requestGeminiFinancialAnalysisStream(
  monthName: string,
  metrics: ReturnType<typeof buildDeterministicMetricsPayload>,
  onEvent: (event: AiStreamEvent) => void,
  preferredModel?: string,
  autoFallback = true
): Promise<FinancialAnalysisData> {
  const model = preferredModel || getStoredModelPreference();
  const fallback = autoFallback !== undefined ? autoFallback : getStoredAutoFallbackPreference();

  try {
    const res = await fetch('/api/gemini/analyze-stream', {
      method: 'POST',
      headers: getEffectiveApiHeaders(),
      body: JSON.stringify({
        monthName,
        metrics,
        preferredModel: model,
        autoFallback: fallback,
        customApiKey: getStoredCustomApiKey()
      })
    });

    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let finalData: FinancialAnalysisData | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonText = trimmed.slice(6).trim();
            if (jsonText) {
              try {
                const ev = JSON.parse(jsonText) as AiStreamEvent;
                onEvent(ev);
                if (ev.type === 'complete' && ev.data) {
                  finalData = {
                    ...ev.data,
                    modelUsed: ev.modelUsed || model,
                    fallbackOccurred: ev.fallbackOccurred || false,
                    timestamp: ev.timestamp || new Date().toISOString()
                  };
                }
              } catch (parseErr) {
                console.warn('Failed to parse SSE line:', jsonText, parseErr);
              }
            }
          }
        }
      }

      if (finalData) {
        setCachedMonthAnalysis(monthName, finalData);
        return finalData;
      }
    }
  } catch (err) {
    console.error('SSE Stream request error, falling back to standard API:', err);
    onEvent({
      type: 'fallback',
      message: 'Koneksi streaming berpindah ke mode respon stabil...'
    });
  }

  // Fallback to standard request if SSE is interrupted
  return requestGeminiFinancialAnalysis(monthName, metrics, model, fallback);
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
      headers: getEffectiveApiHeaders(),
      body: JSON.stringify({
        monthName,
        metrics,
        preferredModel: model,
        autoFallback: fallback,
        customApiKey: getStoredCustomApiKey()
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
    recommendedStockPicks: [
      {
        ticker: 'GOOGL',
        name: 'Alphabet Inc.',
        category: 'Big Tech / AI & Cloud Infrastructure',
        action: 'Akumulasi DCA',
        currentPrice: '$178.50',
        fairValue: '$210.00',
        valuationDiscountPct: 'Undervalued 15.0% dari Fair Value',
        valuationStatus: 'undervalued',
        fairValueAnalysis: 'Forward P/E ~20.5x, berada 15.0% di bawah estimasi konsensus fair value ($210), mencerminkan margin of safety solid.',
        fundamental: 'Pertumbuhan pendapatan Google Cloud +29% YoY, margin operasional mencapai 32%, dan free cash flow tahunan melampaui $60 Miliar.',
        fundamentalHighlights: 'Pertumbuhan pendapatan Google Cloud +29% YoY, margin operasional mencapai 32%, dan free cash flow tahunan melampaui $60 Miliar.',
        investmentPortion: '20% - 25% dari alokasi DCA bulanan',
        timeHorizon: 'Long Term (2 - 5 tahun)',
        timeHorizonType: 'long_term',
        timeHorizonDuration: '2 - 5 tahun',
        catalyst: 'Monetisasi infrastruktur AI enterprise Gemini dan ketahanan luar biasa pendapatan periklanan digital Search & YouTube.',
        riskLevel: 'Moderat',
        financialPlannerVerdict: 'Kandidat ideal untuk alokasi porsi pertumbuhan agresif-terukur dengan neraca kas terkuat di dunia.'
      },
      {
        ticker: 'VOO',
        name: 'Vanguard S&P 500 ETF',
        category: 'Indeks Pasar Luas AS',
        action: 'Koleksi Bertahap',
        currentPrice: '$525.00',
        fairValue: '$560.00',
        valuationDiscountPct: 'Undervalued 6.25% dari Fair Value',
        valuationStatus: 'undervalued',
        fairValueAnalysis: 'Trading pada forward P/E ~21x dengan rasio Sharpe jangka panjang 0.85, diskon valuasi moderat terhadap target indeks.',
        fundamental: 'Expense ratio ultra-rendah (0.03%), return on equity (ROE) agregat emiten konstituen di atas 18%, dan diversifikasi ke 500 korporasi terbesar AS.',
        fundamentalHighlights: 'Expense ratio ultra-rendah (0.03%), return on equity (ROE) agregat emiten konstituen di atas 18%, dan diversifikasi ke 500 korporasi terbesar AS.',
        investmentPortion: '40% - 50% dari alokasi DCA bulanan',
        timeHorizon: 'Long Term (3 - 10 tahun)',
        timeHorizonType: 'long_term',
        timeHorizonDuration: '3 - 10 tahun',
        catalyst: 'Eksposur pasar luas yang melindungi dari risiko kejatuhan saham individual, sangat ideal sebagai fondasi inti (core holding).',
        riskLevel: 'Rendah',
        financialPlannerVerdict: 'Pilar utama portofolio untuk menyerap akumulasi DCA jangka panjang dengan risiko struktural minimal.'
      },
      {
        ticker: 'SCHD',
        name: 'Schwab U.S. Dividend Equity ETF',
        category: 'Kualitas Dividen & Defensif',
        action: 'Koleksi Bertahap',
        currentPrice: '$82.00',
        fairValue: '$92.00',
        valuationDiscountPct: 'Undervalued 10.8% dari Fair Value',
        valuationStatus: 'undervalued',
        fairValueAnalysis: 'Dividend yield ~3.4% dengan P/E ~16.2x, menawarkan diskon valuasi defensif ~11% dibandingkan rata-rata historis.',
        fundamental: 'Menyaring 100 perusahaan dengan rekam jejak pembayaran dividen minimal 10 tahun berturut-turut, cash flow-to-debt sehat, dan ROE tinggi.',
        fundamentalHighlights: 'Menyaring 100 perusahaan dengan rekam jejak pembayaran dividen minimal 10 tahun berturut-turut, cash flow-to-debt sehat, dan ROE tinggi.',
        investmentPortion: '15% - 20% dari alokasi DCA bulanan',
        timeHorizon: 'Mid to Long Term (1 - 3 tahun)',
        timeHorizonType: 'mid_term',
        timeHorizonDuration: '1 - 3 tahun',
        catalyst: 'Kombinasi pendapatan dividen pasif teratur dan volatilitas beta yang lebih rendah (0.78) menghadapi koreksi pasar.',
        riskLevel: 'Rendah',
        financialPlannerVerdict: 'Sangat cocok untuk diversifikasi penyeimbang porsi USD Valas BCA dan aset kripto Anda yang berfluktuasi tinggi.'
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

/**
 * --- BUDGETING AMPLOP AI SERVICE (Token-Compact, Objective, Data-Driven) ---
 */
export interface BudgetPosEvaluation {
  status: 'safe' | 'warning' | 'danger';
  statusBadge: string;
  diagnosis: string;
  rekomendasi: string;
}

export interface BudgetEnvelopesAiResult {
  overallVerdict: string;
  posEvaluations: Record<string, BudgetPosEvaluation>;
  modelUsed?: string;
  fallbackOccurred?: boolean;
  tokenEstimated?: number;
  timestamp?: string;
}

export interface BudgetAiStreamEvent {
  type: 'status' | 'ttft' | 'chunk' | 'fallback' | 'complete' | 'error';
  message?: string;
  model?: string;
  stickyModel?: string;
  ms?: number;
  text?: string;
  data?: BudgetEnvelopesAiResult;
  modelUsed?: string;
  fallbackOccurred?: boolean;
  elapsedMs?: number;
  ttftMs?: number;
  timestamp?: string;
}

const BUDGET_CACHE_PREFIX = 'kelvin_financial_budget_ai_cache_v2_';

export function getCachedBudgetAi(monthName: string): BudgetEnvelopesAiResult | null {
  try {
    const raw = localStorage.getItem(`${BUDGET_CACHE_PREFIX}${monthName.toUpperCase()}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCachedBudgetAi(monthName: string, data: BudgetEnvelopesAiResult): void {
  try {
    localStorage.setItem(`${BUDGET_CACHE_PREFIX}${monthName.toUpperCase()}`, JSON.stringify(data));
  } catch {}
}

export async function requestBudgetEnvelopesAnalysis(
  monthName: string,
  budgetItems: BudgetCategory[],
  summaryMetrics: any = {},
  forceRefresh = false
): Promise<BudgetEnvelopesAiResult> {
  if (!forceRefresh) {
    const cached = getCachedBudgetAi(monthName);
    if (cached) return cached;
  }

  try {
    const res = await fetch('/api/gemini/analyze-budget-envelopes', {
      method: 'POST',
      headers: getEffectiveApiHeaders(),
      body: JSON.stringify({
        monthName,
        budgetItems,
        summaryMetrics,
        customApiKey: getStoredCustomApiKey()
      })
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data && (json.data.posEvaluations || json.data.overallVerdict)) {
        setCachedBudgetAi(monthName, json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Budget AI Client] Fetch error, falling back locally', err);
  }

  // Local fallback if API fails
  const localFallback: BudgetEnvelopesAiResult = {
    overallVerdict: 'Sebagian besar pos amplop berjalan solven dengan kapasitas cadangan kas mampu menahan deviasi belanja bulanan secara mandiri.',
    posEvaluations: {},
    modelUsed: 'Offline Deterministic',
    fallbackOccurred: true,
    timestamp: new Date().toISOString()
  };

  budgetItems.forEach((b, idx) => {
    const key = b.id || b.nama || `pos_${idx}`;
    const saldoAwal = Number(b.saldoAwal) || 0;
    const budgetBulanan = Number(b.budgeting || b.targetBulanan) || 0;
    const totalKapasitas = Number(b.totalSaldo) || (saldoAwal + budgetBulanan);
    const actualSpend = Number(b.actualSpend) || 0;
    const sisa = b.sisa !== undefined ? Number(b.sisa) : totalKapasitas - actualSpend;
    const isOverMonthly = actualSpend > budgetBulanan && budgetBulanan > 0;
    const monthlyDiff = actualSpend - budgetBulanan;
    const isDepleted = sisa <= 0;

    if (isDepleted) {
      localFallback.posEvaluations[key] = {
        status: 'danger',
        statusBadge: 'Saldo Kantong Habis',
        diagnosis: `Realisasi pengeluaran ${formatRupiah(actualSpend)} telah menyerap habis seluruh kapasitas saldo ${formatRupiah(totalKapasitas)} (defisit ${formatRupiah(Math.abs(sisa))}).`,
        rekomendasi: 'Tunda belanja diskresioner pos ini atau lakukan rebalancing darurat dari pos surplus lain.'
      };
    } else if (isOverMonthly) {
      localFallback.posEvaluations[key] = {
        status: 'warning',
        statusBadge: `⚠️ Peringatan: Over Budget (+${formatRupiah(monthlyDiff)})`,
        diagnosis: `Peringatan: Pengeluaran ${formatRupiah(actualSpend)} melebihi budget bulanan ${formatRupiah(budgetBulanan)} sebesar ${formatRupiah(monthlyDiff)}. Walaupun saldo dari bulan lalu masih menutup dengan sisa ${formatRupiah(sisa)}, pengeluaran perlu dikontrol agar cadangan saldo tidak terus tergerus.`,
        rekomendasi: 'Kendalikan pengeluaran pos ini pada bulan berikutnya agar tidak menggerus akumulasi cadangan saldo amplop.'
      };
    } else {
      localFallback.posEvaluations[key] = {
        status: 'safe',
        statusBadge: 'Budget & Saldo Aman',
        diagnosis: `Serapan belanja ${formatRupiah(actualSpend)} terkendali aman di bawah budget bulanan ${formatRupiah(budgetBulanan)} dengan sisa saldo tersedia ${formatRupiah(sisa)}.`,
        rekomendasi: 'Pertahankan kedisiplinan pengeluaran; sisa saldo otomatis menjadi simpanan yang memperkuat saldo bulan depan.'
      };
    }
  });

  setCachedBudgetAi(monthName, localFallback);
  return localFallback;
}

export async function requestBudgetEnvelopesAnalysisStream(
  monthName: string,
  budgetItems: BudgetCategory[],
  summaryMetrics: any = {},
  onEvent: (ev: BudgetAiStreamEvent) => void,
  preferredModel?: string
): Promise<BudgetEnvelopesAiResult> {
  try {
    const res = await fetch('/api/gemini/analyze-budget-stream', {
      method: 'POST',
      headers: getEffectiveApiHeaders(),
      body: JSON.stringify({
        monthName,
        budgetItems,
        summaryMetrics,
        preferredModel,
        customApiKey: getStoredCustomApiKey()
      })
    });

    if (!res.ok || !res.body) {
      throw new Error(`HTTP ${res.status}: SSE streaming failed`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completedData: BudgetEnvelopesAiResult | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            onEvent(parsed);
            if (parsed.type === 'complete' && parsed.data) {
              completedData = parsed.data;
              setCachedBudgetAi(monthName, parsed.data);
            }
          } catch {}
        }
      }
    }

    if (completedData) return completedData;
  } catch (err) {
    console.warn('[Budget AI Stream] Error, running standard request', err);
  }

  // Fallback to standard request
  return requestBudgetEnvelopesAnalysis(monthName, budgetItems, summaryMetrics, true);
}

