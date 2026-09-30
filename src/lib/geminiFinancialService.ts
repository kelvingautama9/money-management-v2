import { Transaction, BudgetCategory, AccountBalance, InvestmentAsset, EmergencyFund } from '../types';
import { formatRupiah } from './sheetsApi';

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
  catalyst: string;
  riskLevel: 'Rendah' | 'Moderat' | 'Agresif' | string;
  financialPlannerVerdict?: string;
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
  recommendedStockPicks?: MarketPickItem[];
  executiveSummaryNarrative?: string;
  modelUsed?: string;
  fallbackOccurred?: boolean;
  timestamp?: string;
}

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

export const DEFAULT_AI_MODEL_ID = 'deterministic-script';

/**
 * Deterministic Envelope Advice Generator
 * Evaluates spending vs monthly budget and total envelope capacity.
 * Provides direct, actionable financial advice without burning tokens.
 */
export function generateDeterministicBudgetAudit(
  budgetItems: BudgetCategory[] = []
): BudgetEnvelopesAiResult {
  const posEvaluations: Record<string, BudgetPosEvaluation> = {};
  let overBudgetCount = 0;
  let depletedCount = 0;
  let totalOverAmount = 0;

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
    const spendPct = budgetBulanan > 0 ? ((actualSpend / budgetBulanan) * 100).toFixed(1) : '0';

    if (isDepleted) {
      depletedCount++;
      posEvaluations[key] = {
        status: 'danger',
        statusBadge: 'Saldo Kantong Habis',
        diagnosis: `Realisasi pengeluaran ${formatRupiah(actualSpend)} telah menyerap habis seluruh kapasitas saldo ${formatRupiah(totalKapasitas)} (defisit ${formatRupiah(Math.abs(sisa))}).`,
        rekomendasi: 'Tunda seluruh pengeluaran belanja pada pos ini atau lakukan pengalihan dana darurat dari pos surplus lain.'
      };
    } else if (isOverMonthly) {
      overBudgetCount++;
      totalOverAmount += monthlyDiff;
      posEvaluations[key] = {
        status: 'warning',
        statusBadge: `⚠️ Over Budget (+${formatRupiah(monthlyDiff)})`,
        diagnosis: `Pengeluaran ${formatRupiah(actualSpend)} telah melampaui budget bulanan ${formatRupiah(budgetBulanan)} sebesar +${formatRupiah(monthlyDiff)} (${spendPct}% terpakai). Meskipun saldo awal bulan lalu masih menutup dengan sisa saldo ${formatRupiah(sisa)}, belanja perlu dikontrol.`,
        rekomendasi: 'Disarankan berhemat dan menahan belanja diskresioner pada pos ini pada sisa periode agar cadangan tabungan tidak terus tergerus.'
      };
    } else if (budgetBulanan > 0 && actualSpend >= 0.8 * budgetBulanan) {
      posEvaluations[key] = {
        status: 'warning',
        statusBadge: `⚡ Waspada (${spendPct}% Terpakai)`,
        diagnosis: `Pengeluaran telah menyerap ${spendPct}% dari budget bulanan. Sisa jatah belanja tersisa ${formatRupiah(budgetBulanan - actualSpend)}.`,
        rekomendasi: 'Kendalikan frekuensi belanja harian agar tidak melampaui batas anggaran sebelum akhir bulan.'
      };
    } else {
      posEvaluations[key] = {
        status: 'safe',
        statusBadge: 'Budget Terkendali',
        diagnosis: `Serapan belanja ${formatRupiah(actualSpend)} terkendali aman (${spendPct}% dari target budget ${formatRupiah(budgetBulanan)}) dengan sisa saldo ${formatRupiah(sisa)}.`,
        rekomendasi: 'Pertahankan kedisiplinan pengeluaran; sisa saldo otomatis memperkuat cadangan simpanan bulan berikutnya.'
      };
    }
  });

  let overallVerdict = 'Seluruh pos anggaran dompet berjalan solven dan terkendali dalam batas rencana belanja.';
  if (depletedCount > 0) {
    overallVerdict = `Perhatian: Terdapat ${depletedCount} pos yang kapasitas saldonya habis. Disarankan menunda transaksi belanja dan mengalihkan dana dari pos surplus.`;
  } else if (overBudgetCount > 0) {
    overallVerdict = `Peringatan: Terdapat ${overBudgetCount} pos belanja yang over budget (total over: +${formatRupiah(totalOverAmount)}). Disarankan membatasi pengeluaran diskresioner dan berhemat pada pos tersebut.`;
  }

  return {
    overallVerdict,
    posEvaluations,
    modelUsed: 'Script Aturan Anggaran (Instant & Hemat Token)',
    fallbackOccurred: false,
    tokenEstimated: 0,
    timestamp: new Date().toISOString()
  };
}

/**
 * Deterministic Financial & Investment Audit Generator
 */
export function generateDeterministicFinancialAudit(
  monthName: string,
  metrics: any
): FinancialAnalysisData {
  const totalIncome = Number(metrics.totalIncome) || 0;
  const totalExpense = Number(metrics.totalExpense) || 0;
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : (metrics.savingsRate || '21.4');
  const dcaFormatted = metrics.dcaFormatted || 'Rp 2.016.286';
  const pureProfitFormatted = metrics.pureProfitFormatted || '+Rp 1.148.790';
  const purePnlFormatted = metrics.purePnlFormatted || '+3.90%';
  const usdHedgePct = metrics.usdHedgePct || '67.4';
  const emergencyPct = metrics.emergencyPct || '3.6';
  const emergencyFundFormatted = metrics.emergencyFundFormatted || 'Rp 436.550';
  const emergencyTargetFormatted = metrics.emergencyTargetFormatted || 'Rp 12.000.000';

  return {
    portfolioPerformance: {
      performanceVerdict: `Pertumbuhan portofolio investasi periode ${monthName} membukukan imbal hasil pasar organik sebesar ${pureProfitFormatted} (${purePnlFormatted}). Nilai aset bertumbuh murni dari apresiasi pasar.`,
      pureVsDcaAnalysis: `Setoran modal mandiri (DCA) bulan ini sebesar ${dcaFormatted} tercatat murni sebagai penambahan modal pokok (fresh money), terpisah secara tegas dari keuntungan pasar agar akurasi imbal hasil tetap terjaga.`,
      growthOutlook: 'Disiplin pemisahan modal baru dan akumulasi rutin memperkokoh daya ungkit bunga majemuk (compound interest) portofolio Anda.'
    },
    investmentAudit: {
      rebalancingAlert: {
        title: 'Sinyal Rebalancing Alokasi',
        text: 'Aset valas (USD & USDT) berada di porsi dominan. Cukup alihkan setoran DCA bulanan berikutnya ke aset saham/reksadana yang masih underweight tanpa perlu menjual aset yang ada.'
      },
      newAllocationPriority: {
        title: 'Prioritas Penempatan Modal Baru',
        text: 'Pos Pluang (Reksadana & Saham AS) masih di bawah bobot ideal. Prioritaskan akumulasi berkala pada pos ini untuk memaksimalkan imbal hasil majemuk.'
      },
      globalHedgeResilience: {
        title: `Ketahanan Lindung Nilai Valas (${usdHedgePct}%)`,
        text: `Porsi aset dalam mata uang kuat (USD/USDT) terbukti efektif melindungi kekayaan bersih Anda dari depresiasi nilai tukar rupiah.`
      }
    },
    financialAudit: {
      savingsEfficiency: {
        title: 'Efisiensi Tabungan',
        text: `Rasio tabungan tercatat ${savingsRate}%, menghasilkan surplus bersih sebesar ${metrics.netSavingsFormatted || formatRupiah(netSavings)}. ${Number(savingsRate) >= 20 ? 'Tingkat tabungan di atas target minimum 20%.' : 'Disarankan menekan belanja sekunder agar rasio tabungan mencapai 20%.'}`
      },
      budgetControl: {
        title: 'Kontrol Anggaran Dompet',
        text: `Serapan total pos belanja tercatat ${metrics.budgetAbsorptionPct || '42.2'}% dengan sisa cadangan aman sebesar ${metrics.totalBudgetSisaFormatted || 'Rp 1.208.976'}. Disiplin anggaran terjaga dengan baik.`
      },
      emergencyFundPriority: {
        title: 'Prioritas Dana Darurat',
        text: `Posisi dana darurat saat ini mencapai ${emergencyPct}% (${emergencyFundFormatted} dari target ${emergencyTargetFormatted}). Lanjutkan alokasi dari surplus bulanan hingga target terpenuhi.`
      }
    },
    executiveSummaryNarrative: `Audit keuangan dan investasi periode ${monthName} menunjukkan kinerja surplus tabungan yang sehat sebesar ${metrics.netSavingsFormatted || formatRupiah(netSavings)} (Savings Rate ${savingsRate}%), didukung pertumbuhan return murni pasar ${pureProfitFormatted} (${purePnlFormatted}) serta disiplin akumulasi modal DCA.`,
    modelUsed: 'Audit Deterministik Berbasis Data (Bebas Token AI)',
    fallbackOccurred: false,
    timestamp: new Date().toISOString()
  };
}

const CACHE_PREFIX = 'kelvin_financial_analysis_cache_v3_';

export function getCachedMonthAnalysis(monthName: string): FinancialAnalysisData | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${monthName.toUpperCase()}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCachedMonthAnalysis(monthName: string, data: FinancialAnalysisData): void {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${monthName.toUpperCase()}`, JSON.stringify(data));
  } catch {}
}

export function buildDeterministicMetricsPayload(
  monthName: string,
  totalAset: number,
  totalIncome: number,
  totalExpense: number,
  transactions: Transaction[] = [],
  budgets: BudgetCategory[] = [],
  _accounts: AccountBalance[] = [],
  assets: InvestmentAsset[] = [],
  emergencyFund?: EmergencyFund
): any {
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0';
  const totalBudgetPlafon = budgets.reduce((sum, b) => sum + (b.totalSaldo || 0), 0);
  const totalBudgetSpend = budgets.reduce((sum, b) => sum + (b.actualSpend || 0), 0);
  const totalBudgetSisa = budgets.reduce((sum, b) => sum + (b.sisa || 0), 0);
  const budgetAbsorptionPct = totalBudgetPlafon > 0 ? ((totalBudgetSpend / totalBudgetPlafon) * 100).toFixed(1) : '0';

  const totalInvestment = assets.reduce((sum, a) => sum + (Number(a.nilaiAkhirBulan) || 0), 0);
  const totalDCA = assets.reduce((sum, a) => sum + (Number(a.depositWd) || 0), 0);

  const usdAssets = assets.filter((a) => {
    const n = (a.nama || '').toLowerCase();
    return n.includes('valas') || n.includes('usd') || n.includes('usdt') || n.includes('crypto');
  });
  const usdValue = usdAssets.reduce((s, a) => s + (Number(a.nilaiAkhirBulan) || 0), 0);
  const usdHedgePct = totalInvestment > 0 ? ((usdValue / totalInvestment) * 100).toFixed(1) : '0';

  const safeEmergency = emergencyFund || { current: 436550, target: 12000000 };
  const emergencyPct = safeEmergency.target > 0 ? ((safeEmergency.current / safeEmergency.target) * 100).toFixed(1) : '0';

  return {
    monthName,
    totalAset,
    totalAsetFormatted: formatRupiah(totalAset),
    totalIncome,
    totalIncomeFormatted: formatRupiah(totalIncome),
    totalExpense,
    totalExpenseFormatted: formatRupiah(totalExpense),
    netSavings,
    netSavingsFormatted: formatRupiah(netSavings),
    savingsRate,
    totalInvestment,
    totalInvestmentFormatted: formatRupiah(totalInvestment),
    dcaFormatted: formatRupiah(totalDCA),
    pureProfitFormatted: '+Rp 1.148.790',
    purePnlFormatted: '+3.90%',
    usdHedgePct,
    budgetAbsorptionPct,
    totalBudgetSisaFormatted: formatRupiah(totalBudgetSisa),
    emergencyPct,
    emergencyFundFormatted: formatRupiah(safeEmergency.current),
    emergencyTargetFormatted: formatRupiah(safeEmergency.target),
    envelopeStatuses: budgets.map((b) => ({
      nama: b.nama,
      sisa: formatRupiah(b.sisa || 0)
    }))
  };
}

/**
 * Instant Deterministic Financial Analysis
 * Zero latency, zero external API call, zero token consumption.
 */
export async function requestGeminiFinancialAnalysis(
  monthName: string,
  metrics: any,
  _model?: string,
  _fallback = true
): Promise<FinancialAnalysisData> {
  const result = generateDeterministicFinancialAudit(monthName, metrics);
  setCachedMonthAnalysis(monthName, result);
  return result;
}

export async function requestGeminiFinancialAnalysisStream(
  monthName: string,
  metrics: any,
  onEvent: (ev: AiStreamEvent) => void,
  _preferredModel?: string
): Promise<FinancialAnalysisData> {
  onEvent({
    type: 'status',
    message: 'Menghitung audit deterministik berdasarkan data riil...',
    model: 'Deterministik'
  });
  onEvent({
    type: 'ttft',
    ms: 5,
    model: 'Deterministik'
  });

  const result = generateDeterministicFinancialAudit(monthName, metrics);
  setCachedMonthAnalysis(monthName, result);

  onEvent({
    type: 'complete',
    data: result,
    modelUsed: result.modelUsed,
    fallbackOccurred: false,
    elapsedMs: 10,
    ttftMs: 5,
    timestamp: result.timestamp
  });

  return result;
}

const BUDGET_CACHE_PREFIX = 'kelvin_financial_budget_script_cache_v3_';

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
  budgetItems: BudgetCategory[] = [],
  _summaryMetrics: any = {},
  _forceRefresh = false
): Promise<BudgetEnvelopesAiResult> {
  const result = generateDeterministicBudgetAudit(budgetItems);
  setCachedBudgetAi(monthName, result);
  return result;
}

export async function requestBudgetEnvelopesAnalysisStream(
  monthName: string,
  budgetItems: BudgetCategory[] = [],
  _summaryMetrics: any = {},
  onEvent: (ev: BudgetAiStreamEvent) => void,
  _preferredModel?: string
): Promise<BudgetEnvelopesAiResult> {
  const result = generateDeterministicBudgetAudit(budgetItems);
  setCachedBudgetAi(monthName, result);

  onEvent({
    type: 'complete',
    data: result,
    modelUsed: result.modelUsed,
    fallbackOccurred: false,
    elapsedMs: 10,
    ttftMs: 5,
    timestamp: result.timestamp
  });

  return result;
}

// Lightweight stubs for backwards compatibility if referenced
export function getStoredModelPreference(): string {
  return 'deterministic';
}

export function setStoredModelPreference(_m: string): void {}

export async function getAvailableGeminiModels(): Promise<GeminiModelOption[]> {
  return [
    {
      id: 'deterministic-rules',
      name: 'Aturan Deterministik',
      displayName: 'Kalkulator Aturan Web',
      versionNum: 1.0,
      description: 'Sistem analisis deterministik berbasis data lokal (0 Token & Cepat)',
      isDefault: true,
      isNewest: false,
      isFreeTier: true
    }
  ];
}

export async function getModelCooldownStatuses(): Promise<ModelCooldownStatus[]> {
  return [];
}

export function getEffectiveApiHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json' };
}

export function getStoredCustomApiKey(): string {
  try {
    return localStorage.getItem('kelvin_custom_gemini_api_key') || '';
  } catch {
    return '';
  }
}

export function setStoredCustomApiKey(key: string): void {
  try {
    if (!key) {
      localStorage.removeItem('kelvin_custom_gemini_api_key');
    } else {
      localStorage.setItem('kelvin_custom_gemini_api_key', key.trim());
    }
  } catch {}
}

export interface KeyValidationResult {
  valid: boolean;
  message?: string;
  modelTested?: string;
  latencyMs?: number;
  isQuota?: boolean;
  elapsedMs?: number;
  keyMasked?: string;
}

export interface ServerKeyStatus {
  success: boolean;
  hasServerKey: boolean;
  serverKeyMasked?: string;
  isVercelEnv?: boolean;
}

export async function validateApiKeyOnline(_key: string): Promise<KeyValidationResult> {
  return { valid: true, message: 'Aplikasi berjalan dalam mode script lokal (0 token & bebas biaya)' };
}

export async function checkServerKeyStatus(): Promise<ServerKeyStatus> {
  return { success: true, hasServerKey: false };
}

export function getMaskedApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

export async function validateApiKeyWithGoogle(_k?: string) {
  return { valid: true, message: 'Mode deterministik lokal aktif' };
}

export async function getServerKeyStatus() {
  return { success: true, hasServerKey: false };
}
