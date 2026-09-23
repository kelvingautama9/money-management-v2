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

// Initialized with required User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

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

/**
 * GET /api/gemini/models
 * Dynamically queries Google AI Studio API for available models.
 * Automatically discovers any newly released Flash models from Google in real time!
 */
app.get('/api/gemini/models', async (_req: Request, res: Response) => {
  try {
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
      const remoteList = await ai.models.list();
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
      defaultModel: 'gemini-3.5-flash',
      models: finalized
    });
  } catch (error: any) {
    console.error('Error fetching Gemini models:', error);
    res.json({
      success: true,
      defaultModel: 'gemini-3.5-flash',
      models: FALLBACK_FLASH_MODELS
    });
  }
});

/**
 * POST /api/gemini/analyze
 * Scheme #2: Hybrid Deterministic + LLM Intelligence.
 * Receives exact pre-calculated financial metrics from code and prompts Gemini
 * for professional, strategic, anti-hallucinatory narrative recommendations.
 * Automatically falls back to other Flash models if quota limit (429/503) is encountered.
 */
app.post('/api/gemini/analyze', async (req: Request, res: Response) => {
  const {
    monthName = 'SEPTEMBER',
    metrics,
    preferredModel = 'gemini-3.5-flash',
    autoFallback = true
  } = req.body;

  if (!metrics) {
    return res.status(400).json({ error: 'Missing financial metrics payload' });
  }

  // Define candidate fallback chain
  const candidateModels: string[] = [
    preferredModel,
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3.8-flash'
  ];
  // Remove duplicates while preserving priority order
  const modelsToTry = Array.from(new Set(candidateModels));

  const prompt = `
Anda adalah seorang Senior Chief Investment Officer (CIO) & Macro Financial Strategist terkemuka.
Tugas Anda adalah melakukan audit mendalam terhadap portofolio investasi dan keuangan user untuk periode ${monthName} 2026, sekaligus mengintegrasikan DATA PASAR GLOBAL TERBARU (hasil Google Search) mengenai kebijakan The Fed (suku bunga & inflasi), earnings/kinerja saham global (seperti GOOGL / Big Tech, S&P 500 / VOO), dan implikasinya terhadap portofolio user.

DATA PORTOFOLIO & KEUANGAN USER (100% Deterministic & Akurat):
- Total Aset Bersih: ${metrics.totalAsetFormatted || 'Rp 54.148.790'}
- Portofolio Investasi: Total ${metrics.totalInvestmentFormatted || 'Rp 53.712.240'}
- Pertumbuhan Return Murni Pasar: ${metrics.pureProfitFormatted || '+Rp 1.148.790'} (${metrics.purePnlFormatted || '+3.90%'})
- Setoran Modal Baru (DCA) Bulan Ini: ${metrics.dcaFormatted || 'Rp 2.016.286'} (Modal baru disetor, BUKAN return pasar!)
- Pemasukan Bulanan: ${metrics.totalIncomeFormatted || 'Rp 6.164.847'}
- Pengeluaran Bulanan: ${metrics.totalExpenseFormatted || 'Rp 2.829.394'}
- Surplus Bersih Tabungan: ${metrics.netSavingsFormatted || 'Rp 1.319.167'} (Savings Rate: ${metrics.savingsRate || '21.4'}%)
- Kapasitas Plafon Budget Amplop: ${metrics.totalBudgetPlafonFormatted || 'Rp 2.865.045'} (Realisasi: ${metrics.totalBudgetSpendFormatted || 'Rp 1.208.976'}, Sisa: ${metrics.totalBudgetSisaFormatted || 'Rp 1.208.976'})
- Status Kantong Amplop:
  ${(metrics.envelopeStatuses || []).map((e: any) => `* ${e.nama}: Jatah ${e.jatah}, Belanja ${e.spend}, Sisa ${e.sisa}, Saldo Awal Bulan Lalu: ${e.saldoAwal}`).join('\n  ')}
- Posisi Dana Darurat: ${metrics.emergencyFundFormatted || 'Rp 436.550'} / Target ${metrics.emergencyTargetFormatted || 'Rp 12.000.000'} (${metrics.emergencyPct || '3.6'}%)
- Alokasi Aset Aktif User:
  ${(metrics.assetAllocations || []).map((a: any) => `* ${a.nama}: Nilai ${a.nilai}, Porsi ${a.persentase}%, Status: ${a.weightStatus || 'Normal'}`).join('\n  ')}
- Porsi Lindung Nilai Valas (USD & USDT): ${metrics.usdHedgePct || '67.4'}%

INSTRUKSI WAJIB:
1. Lakukan pencarian informasi pasar terkini (via Google Search tool):
   - Kebijakan The Fed terkini (suku bunga acuan Fed Funds Rate, sikap hawkish/dovish, inflasi AS CPI/PCE) dan pengaruhnya ke pasar global serta nilai tukar Rupiah (USD/IDR).
   - Update berita terkini saham/indeks unggulan (misal: Alphabet / GOOGL dengan katalis revenue/earnings cloud AI terbaru, Indeks S&P 500 / ETF VOO, Nasdaq QQQ, atau instrumen defensif).
2. Analisis bagaimana sentimen The Fed & inflasi tersebut mempengaruhi portofolio user (khususnya aset USD Valas BCA, Crypto USDT, dan reksadana/saham di Pluang).
3. Berikan saran koleksi saham/indeks konkret yang layak diakumulasi user secara bertahap menggunakan setoran modal DCA berikutnya.
4. JANGAN PERNAH mengubah angka riil portofolio user yang sudah diinput.
5. Gunakan bahasa Indonesia profesional, analitis, tajam, dan mudah dipahami tanpa kata klise berlebihan (jangan gunakan 'master finansial' atau 'hedge fund').
6. Kembalikan HANYA format JSON valid tanpa teks pengantar di luar JSON.

FORMAT JSON OUTPUT YANG WAJIB DIIKUTI:
\`\`\`json
{
  "portfolioPerformance": {
    "performanceVerdict": "Evaluasi tajam mengenai performa return murni portofolio user bulan ini vs setoran modal DCA. Jelaskan pertumbuhan organik dan apresiasi nilainya.",
    "pureVsDcaAnalysis": "Analisis terpisah antara penambahan modal baru dari setoran mandiri DCA (${metrics.dcaFormatted || 'Rp 2.016.286'}) versus keuntungan murni pasar (${metrics.pureProfitFormatted || '+Rp 1.148.790'}).",
    "growthOutlook": "Pandangan trajektori pertumbuhan kekayaan bersih user ke depan."
  },
  "macroFedIntelligence": {
    "title": "Analisis Sentimen Makro & Kebijakan The Fed Terkini",
    "policyStatus": "Update data terkini mengenai arah suku bunga The Fed (Fed Funds Rate) dan tren inflasi global.",
    "impactOnUserAssets": "Pengaruh langsung kebijakan suku bunga The Fed dan kurs USD terhadap aset user (USD Valas BCA ${metrics.usdHedgePct || '67.4'}%, crypto USDT, dan saham AS di Pluang).",
    "strategicAction": "Saran langkah antisipasi taktis bagi user menghadapi pergerakan suku bunga dan kurs saat ini."
  },
  "recommendedStockPicks": [
    {
      "ticker": "GOOGL",
      "name": "Alphabet Inc.",
      "category": "Saham Teknologi / AI",
      "action": "Akumulasi DCA",
      "catalyst": "Katalis fundamental terkini (misal pertumbuhan pendapatan Google Cloud, adopsi AI enterprise, dan valuasi P/E yang atraktif).",
      "riskLevel": "Moderat"
    },
    {
      "ticker": "VOO / SPY",
      "name": "Vanguard S&P 500 ETF",
      "category": "Indeks Pasar Luas",
      "action": "Koleksi Bertahap",
      "catalyst": "Eksposur diversifikasi 500 perusahaan raksasa AS, historis return stabil jangka panjang di berbagai siklus ekonomi.",
      "riskLevel": "Rendah"
    },
    {
      "ticker": "QQQ",
      "name": "Invesco QQQ (Nasdaq-100)",
      "category": "Pertumbuhan & Inovasi",
      "action": "Koleksi Bertahap",
      "catalyst": "Didorong oleh momentum komputasi AI, semikonduktor, dan efisiensi margin perusahaan teknologi global.",
      "riskLevel": "Moderat"
    }
  ],
  "investmentAudit": {
    "rebalancingAlert": {
      "title": "Peringatan Rebalancing",
      "text": "Saran rebalancing taktis aset overweight vs underweight melalui pengalihan setoran DCA bulan depan tanpa perlu cut profit jika tidak mendesak."
    },
    "newAllocationPriority": {
      "title": "Prioritas Alokasi Baru",
      "text": "Prioritas penempatan dana baru dengan mempertimbangkan posisi dana darurat (${metrics.emergencyPct || '3.6'}%) dan aset yang masih underweight."
    },
    "globalHedgeResilience": {
      "title": "Ketahanan Valas & Hedge Global (${metrics.usdHedgePct || '67.4'}%)",
      "text": "Porsi aset berdenominasi mata uang kuat (USD/USDT) melindungi kekayaan bersih dari depresiasi nilai tukar lokal."
    }
  },
  "financialAudit": {
    "savingsEfficiency": {
      "title": "Efisiensi Tabungan",
      "text": "Rasio tabungan tercatat ${metrics.savingsRate}%, menghasilkan surplus bersih sebesar ${metrics.netSavingsFormatted}."
    },
    "budgetControl": {
      "title": "Kontrol Anggaran",
      "text": "Serapan total pos belanja tercatat ${metrics.budgetAbsorptionPct}% dengan sisa cadangan aman sebesar ${metrics.totalBudgetSisaFormatted}."
    },
    "emergencyFundPriority": {
      "title": "Prioritas Dana Darurat",
      "text": "Posisi dana darurat saat ini mencapai ${metrics.emergencyPct}% (${metrics.emergencyFundFormatted} dari target ${metrics.emergencyTargetFormatted})."
    }
  },
  "executiveSummaryNarrative": "Ringkasan strategis 2 kalimat mengenai sinergi antara performa portofolio investasi, kesiapan makro, dan disiplin cashflow."
}
\`\`\`
`;

  let lastError: any = null;
  let successfulResult: any = null;
  let usedModel = preferredModel;
  let fallbackOccurred = false;

  function parseGeminiJson(rawText: string) {
    if (!rawText) return null;
    let clean = rawText.trim();
    // Look for ```json ... ``` blocks
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
    return JSON.parse(clean);
  }

  for (const modelToAttempt of (autoFallback ? modelsToTry : [preferredModel])) {
    try {
      usedModel = modelToAttempt;
      // First attempt with Google Search Grounding for live financial and macro intelligence
      try {
        const responseWithSearch = await ai.models.generateContent({
          model: modelToAttempt,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });
        const resText = responseWithSearch.text || '';
        const parsed = parseGeminiJson(resText);
        if (parsed && (parsed.macroFedIntelligence || parsed.investmentAudit)) {
          successfulResult = parsed;
          fallbackOccurred = modelToAttempt !== preferredModel;
          break;
        }
      } catch (searchErr) {
        console.warn(`Search grounding call with ${modelToAttempt} failed, falling back to direct JSON mode:`, searchErr);
      }

      // If search grounding was skipped or errored, try direct JSON generation
      const directResponse = await ai.models.generateContent({
        model: modelToAttempt,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const responseText = directResponse.text || '';
      successfulResult = parseGeminiJson(responseText);
      if (successfulResult) {
        fallbackOccurred = modelToAttempt !== preferredModel;
        break; // Succeeded!
      }
    } catch (err: any) {
      console.warn(`Model ${modelToAttempt} failed (${err?.status || err?.message || 'Error'}). Trying next fallback.`);
      lastError = err;
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

  // If all Gemini calls failed, serve rich deterministic fallback
  console.error('All Gemini model calls failed, serving comprehensive fallback:', lastError?.message);
  return res.json({
    success: true,
    data: {
      portfolioPerformance: {
        performanceVerdict: `Pertumbuhan portofolio investasi pada periode ${monthName} berada di jalur apresiasi positif dengan imbal hasil murni pasar mencapai ${metrics.pureProfitFormatted || '+Rp 1.148.790'} (${metrics.purePnlFormatted || '+3.90%'}).`,
        pureVsDcaAnalysis: `Setoran modal mandiri (DCA) bulan ini sebesar ${metrics.dcaFormatted || 'Rp 2.016.286'} dialokasikan murni sebagai setoran modal baru, terpisah secara disiplin dari return keuntungan organik pasar.`,
        growthOutlook: 'Disiplin akumulasi rutin memperkokoh daya ungkit majemuk (compound interest) portofolio Anda secara terukur.'
      },
      macroFedIntelligence: {
        title: 'Analisis Sentimen Makro & Kebijakan The Fed Terkini',
        policyStatus: 'The Federal Reserve mempertahankan fokus pada stabilitas inflasi dan penyesuaian suku bunga acuan. Tingkat yield obligasi AS dan volatilitas indeks global mengindikasikan pasar yang menuntut selektivitas tinggi.',
        impactOnUserAssets: `Porsi valas Anda (${metrics.usdHedgePct || '67.4'}% dalam USD Valas BCA & USDT) memberikan perlindungan kuat terhadap ketidakpastian nilai tukar Rupiah. Untuk instrumen ekuitas/reksadana di Pluang, pergerakan suku bunga The Fed membuka peluang akumulasi saat valuasi terkoreksi.`,
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
          text: 'Porsi aset valas USD dan USDT berada di atas batas ideal. Cukup alihkan setoran DCA bulanan berikutnya ke pos aset ekuitas/reksadana yang masih underweight tanpa perlu melakukan cut-profit.'
        },
        newAllocationPriority: {
          title: 'Prioritas Alokasi Baru',
          text: 'Pos Pluang (Reksadana & Saham AS) masih di bawah bobot ideal. Prioritaskan penambahan alokasi dana pada aset ini untuk mengoptimalkan potensi imbal hasil jangka panjang.'
        },
        globalHedgeResilience: {
          title: `Ketahanan Valas & Hedge Global (${metrics.usdHedgePct || '67.4'}%)`,
          text: 'Porsi aset berdenominasi mata uang kuat (USD/USDT) terbukti melindungi kekayaan bersih Anda dari depresiasi nilai tukar lokal.'
        }
      },
      financialAudit: {
        savingsEfficiency: {
          title: 'Efisiensi Tabungan',
          text: `Rasio tabungan Anda tercatat ${metrics.savingsRate || '21.4'}%, menghasilkan surplus bersih sebesar ${metrics.netSavingsFormatted || 'Rp 1.319.167'}.`
        },
        budgetControl: {
          title: 'Kontrol Anggaran',
          text: `Serapan total pos belanja tercatat ${metrics.budgetAbsorptionPct || '42.2'}% dengan sisa cadangan aman sebesar ${metrics.totalBudgetSisaFormatted || 'Rp 1.208.976'}.`
        },
        emergencyFundPriority: {
          title: 'Prioritas Dana Darurat',
          text: `Posisi dana darurat saat ini mencapai ${metrics.emergencyPct || '3.6'}% (${metrics.emergencyFundFormatted || 'Rp 436.550'} dari target ${metrics.emergencyTargetFormatted || 'Rp 12.000.000'}). Alokasikan sebagian surplus bulanan untuk mengakselerasi target runway 6 bulan pengeluaran.`
        }
      },
      executiveSummaryNarrative: `Audit keuangan periode ${monthName} menunjukkan kinerja surplus yang sehat dengan sinergi investasi yang positif menghadapi dinamika makro global.`
    },
    modelUsed: 'Deterministic Fallback (Offline Safe)',
    fallbackOccurred: true,
    timestamp: new Date().toISOString()
  });
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

startServer();
