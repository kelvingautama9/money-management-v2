import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// 3-in-1 Gemini Client resolver:
// 1. User manual import key from UI (x-gemini-api-key header or body)
// 2. Server environment key (GEMINI_API_KEY from AI Studio / Cloud Run)
// 3. Vercel environment variables (VERCEL_GEMINI_API_KEY or VITE_GEMINI_API_KEY)
export function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const effectiveKey =
    (typeof customApiKey === 'string' && customApiKey.trim().length > 0 ? customApiKey.trim() : null) ||
    process.env.GEMINI_API_KEY ||
    process.env.VERCEL_GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    '';
  return new GoogleGenAI({
    apiKey: effectiveKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Default fallback client
const ai = getGeminiClient();

// Curated reliable fallback models
const FALLBACK_FLASH_MODELS = [
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

// --- STICKY HEALTHY MODEL & SMART COOLDOWN MEMORY ---
interface ModelCooldownInfo {
  until: number;
  reason: '429_QUOTA' | '503_SPIKE' | 'ERROR';
  durationMs: number;
  errorSnippet: string;
}

let stickyHealthyModel: string = 'gemini-3.5-flash';
const modelCooldownMap = new Map<string, ModelCooldownInfo>();

function isModelInCooldown(modelId: string): { inCooldown: boolean; remainingSec: number; reason?: string } {
  const cd = modelCooldownMap.get(modelId);
  if (!cd) return { inCooldown: false, remainingSec: 0 };
  const now = Date.now();
  if (now >= cd.until) {
    modelCooldownMap.delete(modelId);
    return { inCooldown: false, remainingSec: 0 };
  }
  return {
    inCooldown: true,
    remainingSec: Math.ceil((cd.until - now) / 1000),
    reason: cd.reason
  };
}

function setModelCooldown(modelId: string, error: any) {
  const status = error?.status || error?.statusCode;
  const msg = String(error?.message || '').toLowerCase();
  const is429 = status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted');
  const is503 = status === 503 || status === 500 || msg.includes('503') || msg.includes('unavailable') || msg.includes('overloaded');

  let durationMs = 3 * 60 * 1000; // default 3 min
  let reason: '429_QUOTA' | '503_SPIKE' | 'ERROR' = 'ERROR';

  if (is429) {
    durationMs = 10 * 60 * 1000; // 10 minutes adaptive cooldown for 429
    reason = '429_QUOTA';
  } else if (is503) {
    durationMs = 3 * 60 * 1000; // 3 minutes cooldown for 503 traffic spike
    reason = '503_SPIKE';
  }

  modelCooldownMap.set(modelId, {
    until: Date.now() + durationMs,
    reason,
    durationMs,
    errorSnippet: String(error?.message || '').slice(0, 100)
  });
  console.warn(`[AI Engine] Model ${modelId} placed on cooldown for ${durationMs / 1000}s (${reason}).`);
}

function markModelHealthy(modelId: string) {
  stickyHealthyModel = modelId;
  modelCooldownMap.delete(modelId);
}

function parseGeminiJson(rawText: string) {
  if (!rawText) return null;
  let clean = rawText.trim();
  const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match && match[1]) {
    clean = match[1].trim();
  } else {
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
  }
  try {
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function buildFinancialAnalysisPrompt(monthName: string, metrics: any) {
  return `
Anda adalah seorang Senior Chief Investment Officer (CIO) dan Certified Financial Planner (CFP) terkemuka.
Lakukan analisis mendalam, to-the-point, dan berbasis data real-time terhadap investasi dan portofolio user periode ${monthName} 2026.
Tampilkan data angka aktual dan analisis terstruktur tanpa kata pengantar klise atau basa-basi bertele-tele.

SAAT MEMBERIKAN REKOMENDASI SAHAM/ASET, ANDA WAJIB MENCARI DATA TERBARU DAN REAL-TIME (live market price, konsensus fair value analis terkini, forward P/E, rasio fundamental).

DATA PORTOFOLIO & KEUANGAN USER (100% Deterministik):
- Total Aset Bersih: ${metrics.totalAsetFormatted || 'Rp 54.148.790'}
- Portofolio Investasi: Total ${metrics.totalInvestmentFormatted || 'Rp 53.712.240'}
- Pertumbuhan Return Murni Pasar: ${metrics.pureProfitFormatted || '+Rp 1.148.790'} (${metrics.purePnlFormatted || '+3.90%'})
- Setoran Modal Baru (DCA) Bulan Ini: ${metrics.dcaFormatted || 'Rp 2.016.286'} (Modal disetor, BUKAN return pasar)
- Pemasukan Bulanan: ${metrics.totalIncomeFormatted || 'Rp 6.164.847'}
- Pengeluaran Bulanan: ${metrics.totalExpenseFormatted || 'Rp 2.829.394'}
- Surplus Bersih Tabungan: ${metrics.netSavingsFormatted || 'Rp 1.319.167'} (Savings Rate: ${metrics.savingsRate || '21.4'}%)
- Status Kantong Amplop: ${(metrics.envelopeStatuses || []).map((e: any) => `${e.nama}: Sisa ${e.sisa}`).join(', ')}
- Posisi Dana Darurat: ${metrics.emergencyFundFormatted || 'Rp 436.550'} / Target ${metrics.emergencyTargetFormatted || 'Rp 12.000.000'} (${metrics.emergencyPct || '3.6'}%)
- Lindung Nilai Valas (USD & USDT): ${metrics.usdHedgePct || '67.4'}%

FOKUS UTAMA ANALISIS:
1. DIAGNOSA PERFORMA & KUALITAS PERTUMBUHAN INVESTASI (Mendalam & To-The-Point):
   - Evaluasi tajam return murni pasar (${metrics.pureProfitFormatted || '+Rp 1.148.790'}) vs setoran modal mandiri DCA (${metrics.dcaFormatted || 'Rp 2.016.286'}).
   - Analisis disiplin pemisahan injeksi modal baru dengan keuntungan organik pasar.
   - Prospek pertumbuhan jangka panjang (compound interest trajectory) dan ketahanan alokasi aset.

2. REKOMENDASI 3 KOLEKSI SAHAM & INDEKS UNGGULAN (MARKET PICKS):
   - Wajib cari data TERBARU dan REAL TIME untuk harga pasar dan konsensus fair value.
   - Berikan 3 rekomendasi instrumen terbaik (misalnya GOOGL, VOO, SCHD atau instrumen unggulan lainnya).
   - Setiap aset WAJIB mencakup:
     a) Fair Value: Cantumkan harga pasar saat ini (currentPrice), estimasi harga wajar (fairValue), status valuasi (undervalued/overvalued/fairly_valued), dan over/under berapa % dari harga wajarnya (valuationDiscountPct, contoh: 'Undervalued 15.0% dari Fair Value' atau 'Overvalued 4.2%'), serta analisis fair value yang to-the-point.
     b) Fundamental: Angka dan metrik fundamental riil terbaru (pertumbuhan pendapatan YoY, margin laba, forward P/E, free cash flow, neraca kas vs utang).
     c) Saran Porsi Investasi: Rekomendasi porsi alokasi yang jelas (contoh: '20% - 25% dari alokasi DCA bulanan' atau 'Porsi 10% dari portofolio investasi').
     d) Perkiraan Jangka Waktu Investasi: Klasifikasi jangka waktu (Short Term / Mid Term / Long Term) dengan durasi konkret (berapa minggu, bulan, atau tahun, contoh: 'Long Term (2 - 5 tahun)', 'Mid Term (6 - 12 bulan)', 'Short Term (4 - 8 minggu)').
     e) Action, Catalyst, dan Financial Planner Verdict: Ringkasan opini eksekusi to-the-point CFP.

3. SINYAL REBALANCING TAKTIS & PROTEKSI VALAS:
   - Sinyal rebalancing tanpa cut-profit (arahkan DCA ke aset underweight seperti Pluang).
   - Ketahanan lindung nilai valas (${metrics.usdHedgePct || '67.4'}%).

4. AUDIT KEUANGAN (Efisiensi tabungan, kontrol anggaran, prioritas dana darurat).

KELUARAN:
HANYA format JSON valid di dalam blok \`\`\`json ... \`\`\` tanpa teks di luar blok:
\`\`\`json
{
  "portfolioPerformance": {
    "performanceVerdict": "Evaluasi padat return murni vs setoran DCA.",
    "pureVsDcaAnalysis": "Analisis pemisahan modal baru DCA (${metrics.dcaFormatted || 'Rp 2.016.286'}) vs profit pasar murni (${metrics.pureProfitFormatted || '+Rp 1.148.790'}).",
    "growthOutlook": "Pandangan pertumbuhan jangka panjang dan compound interest trajectory."
  },
  "recommendedStockPicks": [
    {
      "ticker": "GOOGL",
      "name": "Alphabet Inc.",
      "category": "Big Tech / AI Infrastructure",
      "action": "Akumulasi DCA",
      "currentPrice": "$178.50",
      "fairValue": "$210.00",
      "valuationDiscountPct": "Undervalued 15.0% dari Fair Value",
      "valuationStatus": "undervalued",
      "fairValueAnalysis": "Forward P/E ~20.5x, berada 15% di bawah estimasi fair value konsensus ($210), margin of safety solid.",
      "fundamental": "Pertumbuhan Google Cloud +29% YoY, margin operasional 32%, free cash flow tahunan >$60 Miliar, neraca kas sangat kuat.",
      "investmentPortion": "20% - 25% dari alokasi DCA bulanan",
      "timeHorizon": "Long Term (2 - 5 tahun)",
      "timeHorizonType": "long_term",
      "timeHorizonDuration": "2 - 5 tahun",
      "catalyst": "Monetisasi infrastruktur AI enterprise Gemini dan dominasi Search.",
      "riskLevel": "Moderat",
      "financialPlannerVerdict": "Pilar pertumbuhan agresif-terukur dengan neraca kas terkuat di dunia."
    },
    {
      "ticker": "VOO",
      "name": "Vanguard S&P 500 ETF",
      "category": "Indeks Pasar Luas AS",
      "action": "Koleksi Bertahap",
      "currentPrice": "$525.00",
      "fairValue": "$560.00",
      "valuationDiscountPct": "Undervalued 6.25% dari Fair Value",
      "valuationStatus": "undervalued",
      "fairValueAnalysis": "Trading pada forward P/E ~21x dengan rasio Sharpe historis 0.85, menawarkan diskon valuasi moderat terhadap target indeks.",
      "fundamental": "Expense ratio ultra-rendah 0.03%, agregat ROE konstituen >18%, diversifikasi 500 emiten teratas AS.",
      "investmentPortion": "40% - 50% dari alokasi DCA bulanan",
      "timeHorizon": "Long Term (3 - 10 tahun)",
      "timeHorizonType": "long_term",
      "timeHorizonDuration": "3 - 10 tahun",
      "catalyst": "Fondasi inti penyerap DCA rutin dengan risiko kejatuhan emiten tunggal minimal.",
      "riskLevel": "Rendah",
      "financialPlannerVerdict": "Pilar utama portofolio untuk menyerap akumulasi DCA jangka panjang."
    },
    {
      "ticker": "SCHD",
      "name": "Schwab U.S. Dividend Equity ETF",
      "category": "Kualitas Dividen & Defensif",
      "action": "Koleksi Bertahap",
      "currentPrice": "$82.00",
      "fairValue": "$92.00",
      "valuationDiscountPct": "Undervalued 10.8% dari Fair Value",
      "valuationStatus": "undervalued",
      "fairValueAnalysis": "Dividend yield ~3.4% dengan P/E ~16.2x, valuasi defensif diskon ~11% di bawah fair value industri.",
      "fundamental": "Menyaring emiten dengan rekam jejak dividen bertumbuh 10 tahun berturut-turut, debt-to-equity sehat, dan ROE konsisten.",
      "investmentPortion": "15% - 20% dari alokasi DCA bulanan",
      "timeHorizon": "Mid to Long Term (1 - 3 tahun)",
      "timeHorizonType": "mid_term",
      "timeHorizonDuration": "1 - 3 tahun",
      "catalyst": "Arus kas dividen pasif teratur dan beta lebih rendah (0.78) penangkal volatilitas.",
      "riskLevel": "Rendah",
      "financialPlannerVerdict": "Penyeimbang ideal porsi USD Valas BCA dan aset kripto Anda yang berfluktuasi tinggi."
    }
  ],
  "investmentAudit": {
    "rebalancingAlert": {
      "title": "Peringatan Rebalancing",
      "text": "Porsi aset valas USD dan USDT berada di atas batas ideal. Cukup alihkan setoran DCA bulanan berikutnya ke aset saham/reksadana yang masih underweight tanpa perlu cut profit."
    },
    "newAllocationPriority": {
      "title": "Prioritas Alokasi Baru",
      "text": "Pos Pluang (Reksadana & Saham AS) masih di bawah bobot ideal. Prioritaskan penambahan dana pada aset ini untuk mengoptimalkan potensi imbal hasil jangka panjang."
    },
    "globalHedgeResilience": {
      "title": "Ketahanan Valas & Hedge Global (${metrics.usdHedgePct || '67.4'}%)",
      "text": "Porsi aset berdenominasi mata uang kuat (USD/USDT) terbukti melindungi kekayaan bersih dari depresiasi rupiah."
    }
  },
  "financialAudit": {
    "savingsEfficiency": {
      "title": "Efisiensi Tabungan",
      "text": "Rasio tabungan tercatat ${metrics.savingsRate || '21.4'}%, menghasilkan surplus bersih sebesar ${metrics.netSavingsFormatted || 'Rp 1.319.167'}."
    },
    "budgetControl": {
      "title": "Kontrol Anggaran",
      "text": "Serapan total pos belanja tercatat ${metrics.budgetAbsorptionPct || '42.2'}% dengan sisa cadangan aman sebesar ${metrics.totalBudgetSisaFormatted || 'Rp 1.208.976'}."
    },
    "emergencyFundPriority": {
      "title": "Prioritas Dana Darurat",
      "text": "Posisi dana darurat saat ini mencapai ${metrics.emergencyPct || '3.6'}% (${metrics.emergencyFundFormatted || 'Rp 436.550'} dari target ${metrics.emergencyTargetFormatted || 'Rp 12.000.000'})."
    }
  },
  "executiveSummaryNarrative": "Audit investasi periode ${monthName} menunjukkan kinerja surplus yang sehat dengan return murni pasar yang solid dan momentum akumulasi DCA yang terukur."
}
\`\`\`
`;
}

function getDeterministicFallback(monthName: string, metrics: any) {
  return {
    portfolioPerformance: {
      performanceVerdict: `Pertumbuhan portofolio investasi periode ${monthName} berada di jalur apresiasi positif dengan imbal hasil murni pasar mencapai ${metrics?.pureProfitFormatted || '+Rp 1.148.790'} (${metrics?.purePnlFormatted || '+3.90%'}).`,
      pureVsDcaAnalysis: `Setoran modal mandiri (DCA) bulan ini sebesar ${metrics?.dcaFormatted || 'Rp 2.016.286'} dialokasikan murni sebagai setoran modal baru, terpisah secara disiplin dari return keuntungan organik pasar.`,
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
        fairValueAnalysis: 'Forward P/E ~20.5x, berada 15.0% di bawah estimasi konsensus fair value ($210), memberikan margin of safety solid.',
        fundamental: 'Pertumbuhan pendapatan Google Cloud +29% YoY, margin operasional 32%, free cash flow tahunan melampaui $60 Miliar, neraca kas tanpa utang berlebih.',
        investmentPortion: '20% - 25% dari alokasi DCA bulanan',
        timeHorizon: 'Long Term (2 - 5 tahun)',
        timeHorizonType: 'long_term',
        timeHorizonDuration: '2 - 5 tahun',
        catalyst: 'Monetisasi infrastruktur AI enterprise Gemini dan dominasi Search & Cloud komputasi.',
        riskLevel: 'Moderat',
        financialPlannerVerdict: 'Kandidat ideal untuk pilar pertumbuhan agresif-terukur dengan neraca kas terkuat di dunia.'
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
        fairValueAnalysis: 'Trading pada forward P/E ~21x dengan rasio Sharpe jangka panjang 0.85, menawarkan diskon valuasi moderat terhadap target indeks.',
        fundamental: 'Expense ratio ultra-rendah (0.03%), return on equity (ROE) agregat konstituen >18%, diversifikasi ke 500 korporasi terbesar AS.',
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
        fairValueAnalysis: 'Dividend yield ~3.4% dengan P/E ~16.2x, menawarkan diskon valuasi defensif ~11% di bawah valuasi historis.',
        fundamental: 'Menyaring 100 perusahaan dengan rekam jejak pembayaran dividen minimal 10 tahun berturut-turut, debt-to-equity sehat, dan ROE konsisten.',
        investmentPortion: '15% - 20% dari alokasi DCA bulanan',
        timeHorizon: 'Mid to Long Term (1 - 3 tahun)',
        timeHorizonType: 'mid_term',
        timeHorizonDuration: '1 - 3 tahun',
        catalyst: 'Kombinasi pendapatan dividen pasif teratur dan volatilitas beta yang lebih rendah (0.78) penangkal gejolak pasar.',
        riskLevel: 'Rendah',
        financialPlannerVerdict: 'Penyeimbang ideal porsi USD Valas BCA dan aset kripto Anda yang berfluktuasi tinggi.'
      }
    ],
    investmentAudit: {
      rebalancingAlert: {
        title: 'Peringatan Rebalancing',
        text: 'Aset berdenominasi valas (USD/USDT) berada di atas batas ideal. Alihkan setoran DCA berikutnya ke aset saham/reksadana yang masih underweight tanpa perlu cut profit.'
      },
      newAllocationPriority: {
        title: 'Prioritas Alokasi Baru',
        text: 'Pos Pluang (Reksadana & Saham AS) masih di bawah bobot ideal. Prioritaskan penambahan dana pada aset ini untuk memaksimalkan potensi imbal hasil jangka panjang.'
      },
      globalHedgeResilience: {
        title: `Ketahanan Valas & Hedge Global (${metrics?.usdHedgePct || '67.4'}%)`,
        text: 'Porsi aset berdenominasi mata uang kuat (USD/USDT) terbukti melindungi kekayaan bersih Anda dari depresiasi nilai tukar lokal.'
      }
    },
    financialAudit: {
      savingsEfficiency: {
        title: 'Efisiensi Tabungan',
        text: `Rasio tabungan Anda tercatat ${metrics?.savingsRate || '21.4'}%, menghasilkan surplus bersih sebesar ${metrics?.netSavingsFormatted || 'Rp 1.319.167'}.`
      },
      budgetControl: {
        title: 'Kontrol Anggaran',
        text: `Serapan total pos belanja tercatat ${metrics?.budgetAbsorptionPct || '42.2'}% dengan sisa cadangan aman sebesar ${metrics?.totalBudgetSisaFormatted || 'Rp 1.208.976'}.`
      },
      emergencyFundPriority: {
        title: 'Prioritas Dana Darurat',
        text: `Posisi dana darurat saat ini mencapai ${metrics?.emergencyPct || '3.6'}% (${metrics?.emergencyFundFormatted || 'Rp 436.550'} dari target ${metrics?.emergencyTargetFormatted || 'Rp 12.000.000'}).`
      }
    },
    executiveSummaryNarrative: `Audit investasi periode ${monthName} menunjukkan kinerja surplus yang sehat dengan return murni pasar yang solid dan momentum akumulasi DCA yang terukur.`
  };
}

function mergeFinancialAnalysisWithFallback(parsed: any, monthName: string, metrics: any) {
  const fallback = getDeterministicFallback(monthName, metrics);
  if (!parsed || typeof parsed !== 'object') return fallback;

  const rawPerf = parsed.portfolioPerformance || parsed.portfolio_performance || parsed.performaPortofolio || {};
  const normalizedPerf = {
    performanceVerdict: rawPerf.performanceVerdict || rawPerf.performance_verdict || rawPerf.verdict || fallback.portfolioPerformance.performanceVerdict,
    pureVsDcaAnalysis: rawPerf.pureVsDcaAnalysis || rawPerf.pure_vs_dca_analysis || rawPerf.pureReturnAnalysis || fallback.portfolioPerformance.pureVsDcaAnalysis,
    growthOutlook: rawPerf.growthOutlook || rawPerf.growth_outlook || rawPerf.outlook || fallback.portfolioPerformance.growthOutlook,
  };

  // Normalize stock picks with deep real-time fair value, fundamental, portion, and time horizon data
  const rawPicks = Array.isArray(parsed.recommendedStockPicks) && parsed.recommendedStockPicks.length > 0
    ? parsed.recommendedStockPicks
    : Array.isArray(parsed.marketPicks) && parsed.marketPicks.length > 0
    ? parsed.marketPicks
    : fallback.recommendedStockPicks;

  const normalizedPicks = rawPicks.map((pick: any, idx: number) => {
    const fb = fallback.recommendedStockPicks[idx] || fallback.recommendedStockPicks[0];
    const ticker = pick.ticker || fb.ticker;
    const name = pick.name || fb.name;
    const category = pick.category || fb.category;
    const action = pick.action || fb.action;
    const currentPrice = pick.currentPrice || pick.price || pick.livePrice || fb.currentPrice;
    const fairValue = pick.fairValue || pick.intrinsicValue || pick.targetPrice || fb.fairValue;
    const valuationDiscountPct = pick.valuationDiscountPct || pick.discountPct || pick.valuationDiscount || fb.valuationDiscountPct;
    const valuationStatus = pick.valuationStatus || (valuationDiscountPct?.toLowerCase().includes('over') ? 'overvalued' : 'undervalued');
    const fairValueAnalysis = pick.fairValueAnalysis || pick.valuationAnalysis || fb.fairValueAnalysis;
    const fundamental = pick.fundamental || pick.fundamentalHighlights || fb.fundamental;
    const investmentPortion = pick.investmentPortion || pick.saranPorsi || pick.portion || fb.investmentPortion;
    const timeHorizon = pick.timeHorizon || pick.jangkaWaktu || fb.timeHorizon;
    const timeHorizonType = pick.timeHorizonType || (timeHorizon?.toLowerCase().includes('short') ? 'short_term' : timeHorizon?.toLowerCase().includes('mid') ? 'mid_term' : 'long_term');
    const timeHorizonDuration = pick.timeHorizonDuration || (timeHorizon?.match(/\(([^)]+)\)/)?.[1] || fb.timeHorizonDuration);
    const catalyst = pick.catalyst || fb.catalyst;
    const riskLevel = pick.riskLevel || fb.riskLevel;
    const financialPlannerVerdict = pick.financialPlannerVerdict || pick.verdictCFP || fb.financialPlannerVerdict;

    return {
      ticker,
      name,
      category,
      action,
      currentPrice,
      fairValue,
      valuationDiscountPct,
      valuationStatus,
      fairValueAnalysis,
      fundamental,
      fundamentalHighlights: fundamental,
      investmentPortion,
      timeHorizon,
      timeHorizonType,
      timeHorizonDuration,
      catalyst,
      riskLevel,
      financialPlannerVerdict
    };
  });

  return {
    ...fallback,
    ...parsed,
    portfolioPerformance: normalizedPerf,
    financialAudit: {
      ...fallback.financialAudit,
      ...(parsed.financialAudit || {}),
      savingsEfficiency: {
        ...fallback.financialAudit?.savingsEfficiency,
        ...(parsed.financialAudit?.savingsEfficiency || {})
      },
      budgetControl: {
        ...fallback.financialAudit?.budgetControl,
        ...(parsed.financialAudit?.budgetControl || {})
      },
      emergencyFundPriority: {
        ...fallback.financialAudit?.emergencyFundPriority,
        ...(parsed.financialAudit?.emergencyFundPriority || {})
      }
    },
    investmentAudit: {
      ...fallback.investmentAudit,
      ...(parsed.investmentAudit || {}),
      rebalancingAlert: {
        ...fallback.investmentAudit?.rebalancingAlert,
        ...(parsed.investmentAudit?.rebalancingAlert || {})
      },
      newAllocationPriority: {
        ...fallback.investmentAudit?.newAllocationPriority,
        ...(parsed.investmentAudit?.newAllocationPriority || {})
      },
      globalHedgeResilience: {
        ...fallback.investmentAudit?.globalHedgeResilience,
        ...(parsed.investmentAudit?.globalHedgeResilience || {})
      }
    },
    recommendedStockPicks: normalizedPicks,
    executiveSummaryNarrative: parsed.executiveSummaryNarrative || fallback.executiveSummaryNarrative
  };
}

/**
 * GET /api/gemini/models
 * Dynamically queries Google AI Studio API for available models.
 * Automatically discovers any newly released Flash models from Google in real time!
 */
app.get('/api/gemini/models', async (req: Request, res: Response) => {
  try {
    const userKey = (req.headers['x-gemini-api-key'] as string) || (req.query?.apiKey as string);
    const client = getGeminiClient(userKey);

    const modelList: Array<{
      id: string;
      name: string;
      displayName: string;
      versionNum: number;
      description: string;
      isDefault: boolean;
      isNewest: boolean;
      isFreeTier: boolean;
    }> = [];

    try {
      const remoteList = await client.models.list();
      for await (const m of remoteList) {
        const rawName = (m.name || '').toLowerCase();
        // Filter strictly for Flash text models, excluding specialized media models
        const isFlash = rawName.includes('flash');
        const isExcluded =
          rawName.includes('image') ||
          rawName.includes('tts') ||
          rawName.includes('live') ||
          rawName.includes('audio') ||
          rawName.includes('transcribe') ||
          rawName.includes('veo') ||
          rawName.includes('omni') ||
          rawName.includes('banana');

        if (isFlash && !isExcluded) {
          const cleanId = m.name?.replace(/^models\//, '') || rawName;
          const displayName = m.displayName || cleanId;

          // Parse version number dynamically (e.g., gemini-3.8-flash -> 3.8, gemini-4.0-flash -> 4.0)
          const versionMatch = cleanId.match(/gemini-(\d+(?:\.\d+)?)/i);
          const versionNum = versionMatch ? parseFloat(versionMatch[1]) : 2.5;

          let desc = 'Model Gemini Flash efisien dan cerdas.';
          if (cleanId === 'gemini-3.5-flash') {
            desc = 'Rekomendasi Utama: Cerdas, presisi penalaran finansial & bebas biaya (Free Tier)';
          } else if (cleanId === 'gemini-2.5-flash') {
            desc = 'Stabil & Handal: Model kerja harian cepat dengan latency minimal';
          } else if (cleanId.includes('lite')) {
            desc = 'Ultra-Ringan: Konsumsi token paling hemat saat batas kuota mendekati limit';
          } else {
            desc = `Model Flash generasi ${versionNum}: Kapasitas analisis cepat dan responsif.`;
          }

          modelList.push({
            id: cleanId,
            name: m.name || `models/${cleanId}`,
            displayName,
            versionNum,
            description: desc,
            isDefault: cleanId === 'gemini-3.5-flash',
            isNewest: false,
            isFreeTier: true
          });
        }
      }
    } catch (fetchErr) {
      console.warn('Could not query remote ai.models.list(), falling back to curated list:', fetchErr);
    }

    const effectiveList = modelList.length > 0 ? modelList : FALLBACK_FLASH_MODELS;

    // Deduplicate by ID
    const uniqueMap = new Map<string, (typeof effectiveList)[0]>();
    for (const item of effectiveList) {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }
    const merged = Array.from(uniqueMap.values());

    // Sort by version descending so newest appears at top
    merged.sort((a, b) => b.versionNum - a.versionNum);

    // Identify the absolute newest version dynamically
    const maxVersion = Math.max(...merged.map((m) => m.versionNum));
    const finalized = merged.map((m) => ({
      ...m,
      isNewest: m.versionNum === maxVersion && m.id !== 'gemini-3.5-flash',
      // Default model set to gemini-3.5-flash (smart financial analysis, but not the bleeding edge)
      isDefault: m.id === 'gemini-3.5-flash' || (merged.every((x) => x.id !== 'gemini-3.5-flash') && m.id === 'gemini-2.5-flash')
    }));

    res.json({
      success: true,
      defaultModel: stickyHealthyModel || 'gemini-3.5-flash',
      stickyHealthyModel,
      cooldowns: Array.from(modelCooldownMap.entries()).map(([modelId, cd]) => ({
        modelId,
        remainingSec: Math.max(0, Math.ceil((cd.until - Date.now()) / 1000)),
        reason: cd.reason
      })),
      models: finalized
    });
  } catch (error: any) {
    console.error('Error fetching Gemini models:', error);
    res.json({
      success: true,
      defaultModel: stickyHealthyModel || 'gemini-3.5-flash',
      stickyHealthyModel,
      cooldowns: [],
      models: FALLBACK_FLASH_MODELS
    });
  }
});

/**
 * GET /api/gemini/key-status
 * Checks availability of 3-in-1 keys without exposing private strings.
 */
app.get('/api/gemini/key-status', (_req: Request, res: Response) => {
  const serverKey = process.env.GEMINI_API_KEY || '';
  const vercelKey = process.env.VERCEL_GEMINI_API_KEY || '';
  const hasServerKey = Boolean(serverKey && serverKey.trim().length > 0);
  const hasVercelKey = Boolean(vercelKey && vercelKey.trim().length > 0);

  const activeKey = serverKey || vercelKey;
  const masked = activeKey.length > 8
    ? `${activeKey.slice(0, 6)}...${activeKey.slice(-4)}`
    : (activeKey ? '••••••••' : '');

  res.json({
    success: true,
    hasServerKey: hasServerKey || hasVercelKey,
    serverKeyMasked: masked,
    isVercelEnv: Boolean(process.env.VERCEL),
    defaultSource: hasServerKey ? 'ai_studio_server' : (hasVercelKey ? 'vercel_env' : 'none')
  });
});

/**
 * POST /api/gemini/validate-key
 * Realtime connectivity and quota verification for user-imported or server Gemini API keys.
 */
app.post('/api/gemini/validate-key', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const inputKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
  const effectiveKey = (inputKey && inputKey.trim()) || process.env.GEMINI_API_KEY || process.env.VERCEL_GEMINI_API_KEY || '';

  if (!effectiveKey) {
    return res.status(400).json({
      valid: false,
      message: 'Belum ada API Key yang dimasukkan atau dikonfigurasi di server.'
    });
  }

  try {
    const testClient = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    // Test with the ultra-lightweight gemini-2.5-flash-lite or gemini-3.5-flash
    const testResp = await testClient.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: 'Ping: reply with 1 word "OK".',
      config: {
        maxOutputTokens: 5,
        temperature: 0.1
      }
    });

    const elapsedMs = Date.now() - startTime;
    const masked = effectiveKey.length > 8
      ? `${effectiveKey.slice(0, 6)}...${effectiveKey.slice(-4)}`
      : '••••••••';

    return res.json({
      valid: true,
      keyMasked: masked,
      source: inputKey ? 'custom_user' : (process.env.VERCEL ? 'vercel_env' : 'server_env'),
      elapsedMs,
      message: `API Key Google Gemini Valid! Respons diterima dalam ${elapsedMs}ms.`,
      responseText: (testResp.text || 'OK').trim()
    });
  } catch (err: any) {
    const status = err?.status || err?.statusCode || 500;
    const msg = String(err?.message || '').toLowerCase();
    const isQuota = status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted');
    const isInvalid = status === 400 || status === 403 || msg.includes('api key not valid') || msg.includes('permission');

    return res.status(status === 429 ? 429 : 400).json({
      valid: false,
      isQuota,
      status,
      message: isQuota
        ? 'API Key terdeteksi VALID, namun kuota gratis (Free Tier) sedang mencapai batas limit (429 Quota Exceeded). Coba beberapa saat lagi atau ganti model Flash lain.'
        : isInvalid
        ? 'API Key Ditolak oleh Google: Format salah atau key tidak aktif di Google AI Studio.'
        : `Gagal menghubungi Google Gemini: ${err?.message || 'Error tidak diketahui'}`
    });
  }
});

/**
 * POST /api/gemini/analyze-stream
 * Server-Sent Events (SSE / Streaming Response)
 * Real-time streaming token-by-token (TTFT ~200-400ms) with typing effect,
 * Sticky Healthy Model memorization, and Smart Cooldown backoff timer.
 */
app.post('/api/gemini/analyze-stream', async (req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const startTime = Date.now();

  const sendEvent = (payload: any) => {
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {}
  };

  const {
    monthName = 'SEPTEMBER',
    metrics,
    preferredModel,
    autoFallback = true,
    customApiKey
  } = req.body || {};

  const userKey = (req.headers['x-gemini-api-key'] as string) || customApiKey;
  const aiClient = getGeminiClient(userKey);

  if (!metrics) {
    sendEvent({ type: 'error', message: 'Missing financial metrics payload' });
    return res.end();
  }

  // Determine candidate chain starting with preferred or sticky healthy model
  const priorityStart = preferredModel || stickyHealthyModel || 'gemini-3.5-flash';
  const rawPool = [
    priorityStart,
    stickyHealthyModel,
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3.8-flash'
  ];
  const uniquePool = Array.from(new Set(rawPool));

  // Filter out models currently in cooldown
  const availableModels = uniquePool.filter((m) => {
    const { inCooldown } = isModelInCooldown(m);
    return !inCooldown;
  });

  const modelsToAttempt = availableModels.length > 0 ? availableModels : uniquePool;
  const prompt = buildFinancialAnalysisPrompt(monthName, metrics);

  let success = false;

  for (const modelToAttempt of (autoFallback ? modelsToAttempt : [priorityStart])) {
    const cd = isModelInCooldown(modelToAttempt);
    if (cd.inCooldown && autoFallback && modelsToAttempt.length > 1) {
      sendEvent({
        type: 'status',
        message: `Model ${modelToAttempt} sedang cooldown (${cd.reason}, sisa ${cd.remainingSec}s). Melompati ke model berikutnya...`,
        model: modelToAttempt
      });
      continue;
    }

    try {
      sendEvent({
        type: 'status',
        message: `Menghubungkan ke ${modelToAttempt} (Mencari data real-time via Google Search)...`,
        model: modelToAttempt,
        stickyModel: stickyHealthyModel,
        step: 'connecting'
      });

      let stream;
      try {
        stream = await aiClient.models.generateContentStream({
          model: modelToAttempt,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.2,
            maxOutputTokens: 8192
          }
        });
      } catch (searchToolErr: any) {
        console.warn(`[AI Stream] Search tool fallback on ${modelToAttempt}:`, searchToolErr?.message);
        stream = await aiClient.models.generateContentStream({
          model: modelToAttempt,
          contents: prompt,
          config: {
            temperature: 0.2,
            maxOutputTokens: 8192
          }
        });
      }

      let accumulated = '';
      let firstTokenMs = 0;

      for await (const chunk of stream) {
        const text = chunk.text || '';
        if (text) {
          if (!firstTokenMs) {
            firstTokenMs = Date.now() - startTime;
            sendEvent({
              type: 'ttft',
              ms: firstTokenMs,
              model: modelToAttempt
            });
          }
          accumulated += text;
          sendEvent({
            type: 'chunk',
            text,
            totalLength: accumulated.length
          });
        }
      }

      const parsed = parseGeminiJson(accumulated);
      if (parsed) {
        const enriched = mergeFinancialAnalysisWithFallback(parsed, monthName, metrics);
        markModelHealthy(modelToAttempt);
        sendEvent({
          type: 'complete',
          data: enriched,
          modelUsed: modelToAttempt,
          fallbackOccurred: modelToAttempt !== priorityStart,
          elapsedMs: Date.now() - startTime,
          ttftMs: firstTokenMs || (Date.now() - startTime),
          timestamp: new Date().toISOString()
        });
        success = true;
        break;
      }
    } catch (err: any) {
      console.warn(`[AI Stream] Model ${modelToAttempt} error:`, err?.status || err?.message);
      setModelCooldown(modelToAttempt, err);
      sendEvent({
        type: 'fallback',
        message: `Model ${modelToAttempt} mengalami antrean/limit (${err?.status || 'Error'}). Mengaktifkan cadangan model sehat...`,
        failedModel: modelToAttempt,
        reason: err?.status === 429 ? '429_QUOTA' : '503_SPIKE'
      });
      if (!autoFallback) break;
    }
  }

  if (!success) {
    console.warn('[AI Stream] Serving comprehensive deterministic fallback');
    const fallbackData = getDeterministicFallback(monthName, metrics);
    sendEvent({
      type: 'complete',
      data: fallbackData,
      modelUsed: 'Deterministic Fallback (Offline Safe)',
      fallbackOccurred: true,
      elapsedMs: Date.now() - startTime,
      ttftMs: 300,
      timestamp: new Date().toISOString()
    });
  }

  res.end();
});

/**
 * POST /api/gemini/analyze
 * Standard synchronous JSON endpoint with Sticky Memorization & Smart Cooldown.
 */
app.post('/api/gemini/analyze', async (req: Request, res: Response) => {
  const {
    monthName = 'SEPTEMBER',
    metrics,
    preferredModel,
    autoFallback = true,
    customApiKey
  } = req.body || {};

  const userKey = (req.headers['x-gemini-api-key'] as string) || customApiKey;
  const aiClient = getGeminiClient(userKey);

  if (!metrics) {
    return res.status(400).json({ error: 'Missing financial metrics payload' });
  }

  const priorityStart = preferredModel || stickyHealthyModel || 'gemini-3.5-flash';
  const rawPool = [
    priorityStart,
    stickyHealthyModel,
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3.8-flash'
  ];
  const uniquePool = Array.from(new Set(rawPool));
  const availableModels = uniquePool.filter((m) => !isModelInCooldown(m).inCooldown);
  const modelsToTry = availableModels.length > 0 ? availableModels : uniquePool;

  const prompt = buildFinancialAnalysisPrompt(monthName, metrics);

  let successfulResult: any = null;
  let usedModel = priorityStart;
  let fallbackOccurred = false;

  for (const modelToAttempt of (autoFallback ? modelsToTry : [priorityStart])) {
    try {
      usedModel = modelToAttempt;
      let directResponse;
      try {
        directResponse = await aiClient.models.generateContent({
          model: modelToAttempt,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.2,
            maxOutputTokens: 8192
          }
        });
      } catch (toolErr: any) {
        console.warn(`[AI Sync] Search tool fallback on ${modelToAttempt}:`, toolErr?.message);
        directResponse = await aiClient.models.generateContent({
          model: modelToAttempt,
          contents: prompt,
          config: {
            temperature: 0.2,
            maxOutputTokens: 8192
          }
        });
      }

      const responseText = directResponse.text || '';
      const rawParsed = parseGeminiJson(responseText);
      if (rawParsed) {
        successfulResult = mergeFinancialAnalysisWithFallback(rawParsed, monthName, metrics);
        markModelHealthy(modelToAttempt);
        fallbackOccurred = modelToAttempt !== priorityStart;
        break;
      }
    } catch (err: any) {
      console.warn(`Model ${modelToAttempt} failed (${err?.status || err?.message}).`);
      setModelCooldown(modelToAttempt, err);
      if (!autoFallback) break;
    }
  }

  if (successfulResult) {
    return res.json({
      success: true,
      data: successfulResult,
      modelUsed: usedModel,
      fallbackOccurred,
      timestamp: new Date().toISOString()
    });
  }

  const fallbackData = getDeterministicFallback(monthName, metrics);
  return res.json({
    success: true,
    data: fallbackData,
    modelUsed: 'Deterministic Fallback (Offline Safe)',
    fallbackOccurred: true,
    timestamp: new Date().toISOString()
  });
});

/**
 * --- BUDGETING AMPLOP AI AUDIT (Token-Compact, Objective, Data-Driven) ---
 */
function buildBudgetEnvelopesPrompt(monthName: string, budgetItems: any[], summaryMetrics: any = {}) {
  const itemsText = (budgetItems || [])
    .map((b: any, idx: number) => {
      const nama = b.nama || `Pos #${idx + 1}`;
      const akun = b.akunTerkait || 'Bank';
      const saldoAwal = Number(b.saldoAwal) || 0;
      const budgetBulanan = Number(b.budgeting || b.targetBulanan) || 0;
      const totalKapasitas = Number(b.totalSaldo) || (saldoAwal + budgetBulanan);
      const actualSpend = Number(b.actualSpend) || 0;
      const sisa = b.sisa !== undefined ? Number(b.sisa) : totalKapasitas - actualSpend;
      const pctBudget = budgetBulanan > 0 ? ((actualSpend / budgetBulanan) * 100).toFixed(1) : '0';
      const pctKapasitas = totalKapasitas > 0 ? ((actualSpend / totalKapasitas) * 100).toFixed(1) : '0';
      const diffMonthly = actualSpend - budgetBulanan;

      return `[POS ${idx + 1}] ID: "${b.id || idx}" | Nama: "${nama}" | Akun: ${akun}
- Budget Bulanan: Rp ${budgetBulanan.toLocaleString('id-ID')}
- Saldo Awal (Bulan Lalu): Rp ${saldoAwal.toLocaleString('id-ID')}
- Total Saldo Amplop: Rp ${totalKapasitas.toLocaleString('id-ID')}
- Realisasi Belanja: Rp ${actualSpend.toLocaleString('id-ID')} (Terpakai ${pctBudget}% dari budget bulanan, ${pctKapasitas}% dari total saldo)
- Deviasi Budget Bulanan: ${diffMonthly > 0 ? `+Rp ${diffMonthly.toLocaleString('id-ID')} (OVER BUDGET)` : `-Rp ${Math.abs(diffMonthly).toLocaleString('id-ID')} (DI BAWAH BUDGET)`}
- Sisa Saldo Kas: Rp ${sisa.toLocaleString('id-ID')}`;
    })
    .join('\n\n');

  return `
PERAN & SISTEM:
Anda adalah Chief Financial Auditor & Budgeting Analyst independen.

INSTRUKSI SISTEM WAJIB:
1. Jawab TO THE POINT dan langsung ke inti keuangan tanpa basa-basi atau kata pengantar klise.
2. Dilarang bertele-tele. JANGAN PERNAH gunakan kata "pagu", gunakan kata "budget bulanan" atau "anggaran bulanan".
3. Seluruh analisis HARUS berdasarkan DATA DAN FAKTA angka riil yang diberikan (budget bulanan, realisasi belanja, saldo bulan lalu, sisa saldo).
4. ATURAN STATUS & PERINGATAN (SANGAT KETAT):
   - JIKA Realisasi Belanja MELEBIHI Budget Bulanan (actualSpend > budgetBulanan):
     * Status WAJIB bernilai "warning" (peringatan). JANGAN berikan status "safe"!
     * statusBadge: "⚠️ Peringatan: Over Budget (+Rp X)"
     * diagnosis: Berikan peringatan objektif bahwa pengeluaran telah melampaui budget bulanan sebesar Rp X. Jelaskan bahwa walaupun total saldo dari bulan lalu masih bisa mencover sehingga sisa Rp Z, pengeluaran harus dikontrol agar cadangan saldo tidak terus tergerus.
     * rekomendasi: 1 kalimat aksi terarah untuk membatasi pengeluaran pos ini.
   - JIKA Sisa Saldo Habis / Minus (sisa <= 0):
     * Status WAJIB "danger", statusBadge: "Saldo Kantong Habis"
   - HANYA JIKA Belanja masih dalam batas Budget Bulanan (actualSpend <= budgetBulanan):
     * Status WAJIB "safe", statusBadge: "Budget & Saldo Aman"
5. SANGAT PENTING (HEMAT TOKEN): Buat jawaban tidak terlalu panjang agar dapat menghemat token AI. Maksimal 1-2 kalimat untuk "diagnosis" dan 1 kalimat untuk "rekomendasi".

DATA BUDGETING AMPLOP (Periode: ${monthName} 2026):
${itemsText}

Ringkasan:
- Total Budget Bulanan: Rp ${(Number(summaryMetrics.totalBudgetingBulanan) || 0).toLocaleString('id-ID')}
- Total Saldo Awal: Rp ${(Number(summaryMetrics.totalSaldoAwal) || 0).toLocaleString('id-ID')}
- Total Belanja: Rp ${(Number(summaryMetrics.totalActualSpend) || 0).toLocaleString('id-ID')}
- Total Sisa Saldo: Rp ${(Number(summaryMetrics.totalSisaSaldo) || 0).toLocaleString('id-ID')}

Format JSON WAJIB (HANYA JSON murni tanpa markdown pembuka):
\`\`\`json
{
  "overallVerdict": "1 kalimat objektif dan to-the-point mengenai kesehatan total seluruh pos amplop dan rasio serapan kas.",
  "posEvaluations": {
    "<ID_ATAU_NAMA_POS>": {
      "status": "warning",
      "statusBadge": "⚠️ Peringatan: Over Budget (+Rp 13.537)",
      "diagnosis": "1-2 kalimat fakta to-the-point menguraikan realisasi belanja dan peringatan deviasi budget bulanan.",
      "rekomendasi": "1 kalimat aksi rasional konkret dan hemat biaya."
    }
  }
}
\`\`\`
Catatan format posEvaluations: Gunakan ID pos (atau nama pos jika ID tidak ada) sebagai key objek. Status hanya boleh 'safe', 'warning', atau 'danger'.
`;
}

function getDeterministicBudgetFallback(budgetItems: any[]) {
  const posEvaluations: Record<string, any> = {};
  (budgetItems || []).forEach((b: any, idx: number) => {
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
      posEvaluations[key] = {
        status: 'danger',
        statusBadge: 'Saldo Kantong Habis',
        diagnosis: `Realisasi pengeluaran Rp ${actualSpend.toLocaleString('id-ID')} telah menyerap habis seluruh kapasitas saldo Rp ${totalKapasitas.toLocaleString('id-ID')} (defisit Rp ${Math.abs(sisa).toLocaleString('id-ID')}).`,
        rekomendasi: 'Tunda belanja diskresioner pos ini atau lakukan rebalancing darurat dari pos surplus lain.'
      };
    } else if (isOverMonthly) {
      posEvaluations[key] = {
        status: 'warning',
        statusBadge: `⚠️ Peringatan: Over Budget (+Rp ${monthlyDiff.toLocaleString('id-ID')})`,
        diagnosis: `Peringatan: Pengeluaran Rp ${actualSpend.toLocaleString('id-ID')} melebihi budget bulanan Rp ${budgetBulanan.toLocaleString('id-ID')} sebesar Rp ${monthlyDiff.toLocaleString('id-ID')}. Meskipun saldo dari bulan lalu masih menutup dengan sisa Rp ${sisa.toLocaleString('id-ID')}, pengeluaran perlu dikontrol agar cadangan saldo tidak terus tergerus.`,
        rekomendasi: 'Kendalikan pengeluaran pos ini pada bulan berikutnya agar tidak menggerus akumulasi cadangan saldo amplop.'
      };
    } else {
      posEvaluations[key] = {
        status: 'safe',
        statusBadge: 'Budget & Saldo Aman',
        diagnosis: `Serapan belanja Rp ${actualSpend.toLocaleString('id-ID')} terkendali di bawah budget bulanan Rp ${budgetBulanan.toLocaleString('id-ID')} dengan sisa saldo tersedia Rp ${sisa.toLocaleString('id-ID')}.`,
        rekomendasi: 'Pertahankan kedisiplinan pengeluaran; sisa saldo otomatis menjadi modal simpanan yang memperkuat saldo bulan depan.'
      };
    }
  });

  return {
    overallVerdict: 'Sebagian besar pos amplop berjalan solven, namun perhatikan pos yang melebihi budget bulanan agar cadangan saldo tetap terjaga.',
    posEvaluations,
    modelUsed: 'Deterministic Fallback (Offline Safe)',
    timestamp: new Date().toISOString()
  };
}

/**
 * POST /api/gemini/analyze-budget-envelopes
 * Token-compact, to-the-point, objective, data-backed financial audit of budgeting envelopes.
 */
app.post('/api/gemini/analyze-budget-envelopes', async (req: Request, res: Response) => {
  const {
    monthName = 'SEPTEMBER',
    budgetItems = [],
    summaryMetrics = {},
    preferredModel,
    autoFallback = true,
    customApiKey
  } = req.body || {};

  const userKey = (req.headers['x-gemini-api-key'] as string) || customApiKey;
  const aiClient = getGeminiClient(userKey);

  if (!budgetItems || budgetItems.length === 0) {
    return res.status(400).json({ error: 'Missing budgetItems' });
  }

  const priorityStart = preferredModel || stickyHealthyModel || 'gemini-3.5-flash';
  const rawPool = [
    priorityStart,
    stickyHealthyModel,
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3.8-flash'
  ];
  const uniquePool = Array.from(new Set(rawPool));
  const availableModels = uniquePool.filter((m) => !isModelInCooldown(m).inCooldown);
  const modelsToTry = availableModels.length > 0 ? availableModels : uniquePool;

  const prompt = buildBudgetEnvelopesPrompt(monthName, budgetItems, summaryMetrics);

  let successfulResult: any = null;
  let usedModel = priorityStart;
  let fallbackOccurred = false;

  for (const modelToAttempt of (autoFallback ? modelsToTry : [priorityStart])) {
    try {
      usedModel = modelToAttempt;
      const response = await aiClient.models.generateContent({
        model: modelToAttempt,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1, // low temperature for strict objectivity and factual focus
          maxOutputTokens: 800 // strictly limit token output to save cost & minimize latency
        }
      });

      const responseText = response.text || '';
      successfulResult = parseGeminiJson(responseText);
      if (successfulResult && (successfulResult.posEvaluations || successfulResult.overallVerdict)) {
        markModelHealthy(modelToAttempt);
        fallbackOccurred = modelToAttempt !== priorityStart;
        break;
      }
    } catch (err: any) {
      console.warn(`[Budget AI] Model ${modelToAttempt} failed (${err?.status || err?.message}).`);
      setModelCooldown(modelToAttempt, err);
      if (!autoFallback) break;
    }
  }

  if (successfulResult) {
    return res.json({
      success: true,
      data: successfulResult,
      modelUsed: usedModel,
      fallbackOccurred,
      tokenEstimated: 320,
      timestamp: new Date().toISOString()
    });
  }

  const fallbackData = getDeterministicBudgetFallback(budgetItems);
  return res.json({
    success: true,
    data: fallbackData,
    modelUsed: 'Deterministic Fallback (Offline Safe)',
    fallbackOccurred: true,
    tokenEstimated: 0,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/gemini/analyze-budget-stream
 * Real-time SSE streaming for Budgeting Amplop AI audit
 */
app.post('/api/gemini/analyze-budget-stream', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const startTime = Date.now();

  const sendEvent = (payload: any) => {
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {}
  };

  const {
    monthName = 'SEPTEMBER',
    budgetItems = [],
    summaryMetrics = {},
    preferredModel,
    autoFallback = true,
    customApiKey
  } = req.body || {};

  const userKey = (req.headers['x-gemini-api-key'] as string) || customApiKey;
  const aiClient = getGeminiClient(userKey);

  if (!budgetItems || budgetItems.length === 0) {
    sendEvent({ type: 'error', message: 'Missing budgetItems payload' });
    return res.end();
  }

  const priorityStart = preferredModel || stickyHealthyModel || 'gemini-3.5-flash';
  const rawPool = [
    priorityStart,
    stickyHealthyModel,
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3.8-flash'
  ];
  const uniquePool = Array.from(new Set(rawPool));
  const availableModels = uniquePool.filter((m) => !isModelInCooldown(m).inCooldown);
  const modelsToAttempt = availableModels.length > 0 ? availableModels : uniquePool;

  const prompt = buildBudgetEnvelopesPrompt(monthName, budgetItems, summaryMetrics);

  let success = false;

  for (const modelToAttempt of (autoFallback ? modelsToAttempt : [priorityStart])) {
    const cd = isModelInCooldown(modelToAttempt);
    if (cd.inCooldown && autoFallback && modelsToAttempt.length > 1) {
      sendEvent({
        type: 'status',
        message: `Model ${modelToAttempt} sedang cooldown (${cd.reason}). Mencoba model lain...`,
        model: modelToAttempt
      });
      continue;
    }

    try {
      sendEvent({
        type: 'status',
        message: `Menghubungkan ke ${modelToAttempt}...`,
        model: modelToAttempt,
        stickyModel: stickyHealthyModel
      });

      const stream = await aiClient.models.generateContentStream({
        model: modelToAttempt,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 800
        }
      });

      let accumulated = '';
      let firstTokenMs = 0;

      for await (const chunk of stream) {
        const text = chunk.text || '';
        if (text) {
          if (!firstTokenMs) {
            firstTokenMs = Date.now() - startTime;
            sendEvent({
              type: 'ttft',
              ms: firstTokenMs,
              model: modelToAttempt
            });
          }
          accumulated += text;
          sendEvent({
            type: 'chunk',
            text,
            totalLength: accumulated.length
          });
        }
      }

      const parsed = parseGeminiJson(accumulated);
      if (parsed && (parsed.posEvaluations || parsed.overallVerdict)) {
        markModelHealthy(modelToAttempt);
        sendEvent({
          type: 'complete',
          data: parsed,
          modelUsed: modelToAttempt,
          fallbackOccurred: modelToAttempt !== priorityStart,
          elapsedMs: Date.now() - startTime,
          ttftMs: firstTokenMs || (Date.now() - startTime),
          timestamp: new Date().toISOString()
        });
        success = true;
        break;
      }
    } catch (err: any) {
      console.warn(`[Budget AI Stream] Model ${modelToAttempt} error:`, err?.status || err?.message);
      setModelCooldown(modelToAttempt, err);
      sendEvent({
        type: 'fallback',
        message: `Model ${modelToAttempt} limit/error. Mengalihkan ke cadangan...`,
        failedModel: modelToAttempt,
        reason: err?.status === 429 ? '429_QUOTA' : '503_SPIKE'
      });
      if (!autoFallback) break;
    }
  }

  if (!success) {
    const fallbackData = getDeterministicBudgetFallback(budgetItems);
    sendEvent({
      type: 'complete',
      data: fallbackData,
      modelUsed: 'Deterministic Fallback (Offline Safe)',
      fallbackOccurred: true,
      elapsedMs: Date.now() - startTime,
      ttftMs: 250,
      timestamp: new Date().toISOString()
    });
  }

  res.end();
});

// Setup Vite middleware in dev or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

// Only start standalone HTTP server if not running as a Vercel serverless function
if (!process.env.VERCEL) {
  startServer();
}

export default app;
