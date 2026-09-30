import { TradeRecord, TradeType, TradeStatus, ActiveAssetSummary } from '../types';
import { formatSheetRange, fetchSheetValues } from './sheetsApi';

const ID_MONTH_MAP: Record<string, string> = {
  jan: '01', januari: '01',
  feb: '02', peb: '02', februari: '02',
  mar: '03', maret: '03',
  apr: '04', april: '04',
  mei: '05', may: '05',
  jun: '06', juni: '06', june: '06',
  jul: '07', juli: '07', july: '07',
  agu: '08', ags: '08', agt: '08', agustus: '08', aug: '08', august: '08',
  sep: '09', september: '09',
  okt: '10', oktober: '10', oct: '10', october: '10',
  nop: '11', nov: '11', november: '11',
  des: '12', desember: '12', dec: '12', december: '12'
};

/**
 * Parses Indonesian regional numeric formats into clean JavaScript numbers.
 * Accurately distinguishes between dot thousand separators (Rp 10.000.000, Rp -109.060, 17.716)
 * and comma decimals (0,635, 18,25%, 207,7, "3,800", "2.630.000,0").
 */
export function parseIndonesianNumber(
  val: any,
  options?: { isCurrency?: boolean; isKurs?: boolean; isDecimal?: boolean }
): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str || str === '—' || str === '-' || str.includes('#VALUE!')) return 0;

  const hasRp = str.toLowerCase().includes('rp');
  const isCurrency = options?.isCurrency || hasRp;
  const isKurs = options?.isKurs;
  const isDecimal = options?.isDecimal;

  // Check for negative indicator: minus (-), parentheses (Rp ...)
  const isNegative = str.includes('-') || (str.startsWith('(') && str.endsWith(')'));

  // Clean non-numeric characters except digits, dots, commas, minus
  let cleaned = str.replace(/[^\d.,\-]/g, '');
  if (!cleaned) return 0;

  // Case 1: Has both dot AND comma (e.g. "2.630.000,0" or "10.000.000,00")
  if (cleaned.includes('.') && cleaned.includes(',')) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
    const parsed = parseFloat(cleaned) || 0;
    return isNegative && parsed > 0 ? -parsed : parsed;
  }

  // Case 2: Only has comma (e.g. "0,635", "18,25%", "207,7", "3,800", "1,940")
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    cleaned = cleaned.replace(',', '.');
    const parsed = parseFloat(cleaned) || 0;
    return isNegative && parsed > 0 ? -parsed : parsed;
  }

  // Case 3: Only has dot
  if (cleaned.includes('.')) {
    // Currency column (Rp -109.060, Rp 431.425) -> dot is strictly thousands separator
    if (isCurrency) {
      cleaned = cleaned.replace(/\./g, '');
      const parsed = parseFloat(cleaned) || 0;
      return isNegative && parsed > 0 ? -parsed : parsed;
    }

    // Exchange rate column (e.g. "17.716", "17.860", "17.890")
    if (isKurs) {
      cleaned = cleaned.replace(/\./g, '');
      const parsed = parseFloat(cleaned) || 0;
      return isNegative && parsed > 0 ? -parsed : parsed;
    }

    // Pure decimal (entered with dot e.g. 0.635)
    if (isDecimal) {
      const parsed = parseFloat(cleaned) || 0;
      return isNegative && parsed > 0 ? -parsed : parsed;
    }

    // Standard thousands check: 3 digits after dot (e.g. "17.571.584")
    const parts = cleaned.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      cleaned = cleaned.replace(/\./g, '');
      const parsed = parseFloat(cleaned) || 0;
      return isNegative && parsed > 0 ? -parsed : parsed;
    }
  }

  const parsed = parseFloat(cleaned) || 0;
  return isNegative && parsed > 0 ? -parsed : parsed;
}

/**
 * Normalizes input date to ISO YYYY-MM-DD.
 * Supports:
 * - "YYYY-MM-DD"
 * - "5-Jan-2026", "19-Mei-2026", "27-Agu-2026", "28-Sep-2026"
 * - "DD/MM/YYYY" or "DD-MM-YYYY"
 */
export function parseDateToIso(val: any): string {
  if (!val) return '';
  const str = String(val).trim();
  if (!str || str === '-' || str === '—') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // Match: D-MMM-YYYY or DD-MMM-YYYY e.g. "5-Jan-2026", "19-Mei-2026", "27-Agu-2026"
  const textMonthMatch = str.match(/^(\d{1,2})[-/ ]([A-Za-z]+)[-/ ](\d{4})/);
  if (textMonthMatch) {
    const day = textMonthMatch[1].padStart(2, '0');
    const rawMonth = textMonthMatch[2].toLowerCase();
    const month = ID_MONTH_MAP[rawMonth] || '01';
    const year = textMonthMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Match: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  } catch (e) {}

  return str;
}

/**
 * Calculates individual trade metrics according to institutional portfolio accounting formulas.
 */
export function calculateTradeMetrics(input: {
  nominalIdr: number;
  entryPrice: number;
  exitPrice?: number;
  status: TradeStatus;
}): {
  pnlPercent: number;
  spreadCost: number;
  labaBersih: number;
  nilaiAset: number;
} {
  const { nominalIdr, entryPrice, exitPrice = 0, status } = input;
  const effectivePrice = exitPrice > 0 ? exitPrice : entryPrice;
  const pnlPercent = entryPrice > 0 ? ((effectivePrice - entryPrice) / entryPrice) * 100 : 0;
  const spreadCost = -Math.round(nominalIdr * 0.005);
  const labaBersih = Math.round(nominalIdr * (pnlPercent / 100) + spreadCost);
  const nilaiAset = status === 'Floating' ? Math.round(nominalIdr + labaBersih) : 0;

  return {
    pnlPercent: Number(pnlPercent.toFixed(2)),
    spreadCost,
    labaBersih,
    nilaiAset
  };
}

/**
 * Converts a TradeRecord object to an array of cell values matching columns A..N.
 */
export function tradeToRowValues(trade: TradeRecord): any[] {
  return [
    trade.type, // Col A: Type (BUY/SELL)
    trade.asset.toUpperCase(), // Col B: Asset (Ticker)
    Math.round(trade.nominalIdr), // Col C: Nominal (IDR)
    trade.kurs > 1 ? trade.kurs : '', // Col D: Kurs IDR-USD
    trade.jumlah, // Col E: Jumlah
    trade.entryDate, // Col F: Entry Date
    trade.exitDate || '', // Col G: Exit Date
    trade.entryPrice, // Col H: Entry Price
    trade.exitPrice || '', // Col I: Exit Price
    `${trade.pnlPercent}%`, // Col J: PnL (%)
    trade.spreadCost, // Col K: SPREAD 0.5%
    trade.labaBersih, // Col L: Laba Bersih
    trade.status, // Col M: Notes / Status (Realized/Floating)
    trade.status === 'Floating' ? trade.nilaiAset : '' // Col N: Nilai Aset
  ];
}

/**
 * Standard table headers for tab INVESTING.
 */
export const INVESTING_HEADERS = [
  'Type',
  'Asset',
  'Nominal (IDR)',
  'Kurs IDR-USD',
  'Jumlah',
  'Entry Date',
  'Exit Date',
  'Entry Price',
  'Exit Price',
  'PnL',
  'SPREAD 0.5%',
  'Laba Bersih',
  'Notes',
  'Nilai Aset'
];

/**
 * Finds matching tab name in the spreadsheet.
 */
export async function findInvestingTabName(
  spreadsheetId: string,
  accessToken: string
): Promise<{ title: string; sheetId?: number } | null> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal membaca struktur spreadsheet Google Sheets');
  }

  const data = await res.json();
  const sheets: any[] = data.sheets || [];

  // 1. Look for exact 'INVESTING' first (as requested by user)
  for (const s of sheets) {
    const title = s?.properties?.title || '';
    if (title.toUpperCase() === 'INVESTING') {
      return { title, sheetId: s.properties.sheetId };
    }
  }

  // 2. Look for exact 'INVESTMENT'
  for (const s of sheets) {
    const title = s?.properties?.title || '';
    if (title.toUpperCase() === 'INVESTMENT') {
      return { title, sheetId: s.properties.sheetId };
    }
  }

  // 3. Fallback: Contains 'invest'
  for (const s of sheets) {
    const title = s?.properties?.title || '';
    if (title.toLowerCase().includes('invest')) {
      return { title, sheetId: s.properties.sheetId };
    }
  }

  // 4. Fallback: Contains 'trading' or 'jurnal'
  for (const s of sheets) {
    const title = s?.properties?.title || '';
    if (title.toLowerCase().includes('trading') || title.toLowerCase().includes('jurnal')) {
      return { title, sheetId: s.properties.sheetId };
    }
  }

  return null;
}

/**
 * Ensures tab INVESTING exists; if missing, creates it with standard column headers.
 */
export async function ensureInvestingTabExists(
  spreadsheetId: string,
  accessToken: string,
  preferredTitle: string = 'INVESTING'
): Promise<{ title: string; sheetId?: number }> {
  const existing = await findInvestingTabName(spreadsheetId, accessToken).catch(() => null);
  if (existing) return existing;

  const targetTitle = preferredTitle;
  const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: targetTitle,
              gridProperties: {
                frozenRowCount: 1
              }
            }
          }
        }
      ]
    })
  });

  if (!addRes.ok) {
    const err = await addRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membuat tab ${targetTitle} di Google Sheet`);
  }

  const addJson = await addRes.json();
  const sheetId = addJson?.replies?.[0]?.addSheet?.properties?.sheetId;

  // Insert header row
  const safeRange = formatSheetRange(targetTitle, 'A1:N1');
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(safeRange)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [INVESTING_HEADERS] })
    }
  );

  return { title: targetTitle, sheetId };
}

/**
 * Fetches and parses all trade records and active asset summaries from tab INVESTING (A1:U150).
 * Matches the user's exact Google Sheet structure.
 */
export async function fetchInvestingSheetTrades(
  spreadsheetId: string,
  accessToken: string
): Promise<{ tabTitle: string; sheetId?: number; trades: TradeRecord[]; activeSummaries: ActiveAssetSummary[] }> {
  const tabInfo = await findInvestingTabName(spreadsheetId, accessToken);
  if (!tabInfo) {
    throw new Error('Tab INVESTING belum ditemukan pada Google Spreadsheet ini');
  }

  // Fetch range covering transaction table (A..N) AND summary table (P..U)
  const safeRange = formatSheetRange(tabInfo.title, 'A1:U150');
  const rows = await fetchSheetValues(spreadsheetId, safeRange, accessToken);

  const trades: TradeRecord[] = [];
  const activeSummaries: ActiveAssetSummary[] = [];

  if (!rows || rows.length === 0) {
    return { tabTitle: tabInfo.title, sheetId: tabInfo.sheetId, trades, activeSummaries };
  }

  // 1. Locate header row dynamically
  let headerRowIndex = 0;
  let colType = 0;
  let colAsset = 1;
  let colNominal = 2;
  let colKurs = 3;
  let colJumlah = 4;
  let colEntryDate = 5;
  let colExitDate = 6;
  let colEntryPrice = 7;
  let colExitPrice = 8;
  let colPnl = 9;
  let colSpread = 10;
  let colLaba = 11;
  let colStatus = 12; // In user sheet: "Notes"
  let colNilaiAset = 13;

  for (let r = 0; r < Math.min(10, rows.length); r++) {
    const row = rows[r];
    if (!row) continue;
    const rowStr = row.map((c) => String(c || '').toLowerCase().trim());

    const hasType = rowStr.findIndex((c) => c.includes('type') || c === 'tipe');
    const hasAsset = rowStr.findIndex((c) => c === 'asset' || c.includes('ticker') || c.includes('simbol'));
    const hasNominal = rowStr.findIndex((c) => c.includes('nominal') || c.includes('modal'));

    if (hasType >= 0 && (hasAsset >= 0 || hasNominal >= 0)) {
      headerRowIndex = r;
      colType = hasType;
      if (hasAsset >= 0) colAsset = hasAsset;
      if (hasNominal >= 0) colNominal = hasNominal;

      const fKurs = rowStr.findIndex((c) => c.includes('kurs'));
      if (fKurs >= 0) colKurs = fKurs;

      const fJumlah = rowStr.findIndex((c) => c.includes('jumlah') || c.includes('qty') || c.includes('unit'));
      if (fJumlah >= 0) colJumlah = fJumlah;

      const fEntryDate = rowStr.findIndex((c) => c.includes('entry date') || c.includes('tgl entry'));
      if (fEntryDate >= 0) colEntryDate = fEntryDate;

      const fExitDate = rowStr.findIndex((c) => c.includes('exit date') || c.includes('tgl exit'));
      if (fExitDate >= 0) colExitDate = fExitDate;

      const fEntryPrice = rowStr.findIndex((c) => c.includes('entry price') || c.includes('harga beli'));
      if (fEntryPrice >= 0) colEntryPrice = fEntryPrice;

      const fExitPrice = rowStr.findIndex((c) => c.includes('exit price') || c.includes('harga jual'));
      if (fExitPrice >= 0) colExitPrice = fExitPrice;

      const fPnl = rowStr.findIndex((c) => c === 'pnl' || c.includes('pnl') || c.includes('roi'));
      if (fPnl >= 0) colPnl = fPnl;

      const fSpread = rowStr.findIndex((c) => c.includes('spread'));
      if (fSpread >= 0) colSpread = fSpread;

      const fLaba = rowStr.findIndex((c) => c.includes('laba') || c.includes('profit'));
      if (fLaba >= 0) colLaba = fLaba;

      // Note: in user sheet, column 12 is named "Notes" containing "Realized" or "Floating"
      const fStatus = rowStr.findIndex((c) => c.includes('notes') || c.includes('status') || c.includes('note') || c.includes('keterangan'));
      if (fStatus >= 0) colStatus = fStatus;

      const fNilaiAset = rowStr.findIndex((c) => c.includes('nilai aset') || c.includes('valuasi'));
      if (fNilaiAset >= 0) colNilaiAset = fNilaiAset;

      break;
    }
  }

  // 2. Parse trades starting right after header row
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const rowIndex = i + 1; // 1-indexed row number in Google Sheets

    const rawType = (row[colType] || '').toString().trim().toUpperCase();
    const asset = (row[colAsset] || '').toString().trim().toUpperCase();

    // Skip non-trade rows (e.g. header echoes, dot separators, blank lines, cashflow accidentally placed)
    if (!asset || asset === '-' || asset === 'ASSET' || asset.includes('TYPE') || asset.includes('TRANSPORT') || asset === '.') continue;
    if (rawType !== 'BUY' && rawType !== 'SELL') continue;

    const type: TradeType = rawType === 'SELL' ? 'SELL' : 'BUY';
    const nominalIdr = parseIndonesianNumber(row[colNominal], { isCurrency: true });
    if (nominalIdr <= 0) continue;

    const kurs = parseIndonesianNumber(row[colKurs], { isKurs: true }) || 17890;
    const jumlah = parseIndonesianNumber(row[colJumlah], { isDecimal: true }) || 0;
    const entryDate = parseDateToIso(row[colEntryDate]);
    const exitDate = parseDateToIso(row[colExitDate]);
    const entryPrice = parseIndonesianNumber(row[colEntryPrice], { isDecimal: true });
    const exitPrice = parseIndonesianNumber(row[colExitPrice], { isDecimal: true });

    // Status: Check column 12 (Notes), or fallback based on exitDate
    const rawStatus = (row[colStatus] || '').toString().trim().toLowerCase();
    let status: TradeStatus = 'Floating';
    if (rawStatus.includes('real')) {
      status = 'Realized';
    } else if (rawStatus.includes('float')) {
      status = 'Floating';
    } else if (exitDate) {
      status = 'Realized';
    }

    // Recalculate metrics or use parsed if available
    const metrics = calculateTradeMetrics({
      nominalIdr,
      entryPrice,
      exitPrice,
      status
    });

    const pnlPercent = row[colPnl] !== undefined && row[colPnl] !== ''
      ? parseIndonesianNumber(row[colPnl], { isDecimal: true })
      : metrics.pnlPercent;

    const spreadCost = row[colSpread] !== undefined && row[colSpread] !== ''
      ? parseIndonesianNumber(row[colSpread], { isCurrency: true })
      : metrics.spreadCost;

    const labaBersih = row[colLaba] !== undefined && row[colLaba] !== ''
      ? parseIndonesianNumber(row[colLaba], { isCurrency: true })
      : metrics.labaBersih;

    const nilaiAset = status === 'Floating'
      ? (row[colNilaiAset] !== undefined && row[colNilaiAset] !== '' ? parseIndonesianNumber(row[colNilaiAset], { isCurrency: true }) : metrics.nilaiAset)
      : 0;

    trades.push({
      id: `trade-row-${rowIndex}-${asset}`,
      rowIndex,
      type,
      asset,
      nominalIdr,
      kurs,
      jumlah,
      entryDate,
      exitDate,
      entryPrice,
      exitPrice,
      pnlPercent,
      spreadCost,
      labaBersih,
      status,
      nilaiAset
    });

    // 3. Parse Active Summary from columns P (15), Q (16), R (17), S (18), T (19) if present
    const sumAsset = (row[15] || '').toString().trim().toUpperCase();
    if (sumAsset && sumAsset !== 'ASSET' && sumAsset !== 'GRAND TOTAL' && !sumAsset.includes('TOTAL') && sumAsset !== '-') {
      const avgBuy = parseIndonesianNumber(row[16], { isDecimal: true });
      const priceNow = parseIndonesianNumber(row[17], { isDecimal: true });
      const sumPnl = parseIndonesianNumber(row[18], { isDecimal: true });
      const valueTotal = parseIndonesianNumber(row[19], { isCurrency: true });

      if (avgBuy > 0 || priceNow > 0 || valueTotal > 0) {
        activeSummaries.push({
          asset: sumAsset,
          avgBuy,
          priceNow,
          pnlPercent: sumPnl,
          valueTotalIdr: valueTotal
        });
      }
    }
  }

  return { tabTitle: tabInfo.title, sheetId: tabInfo.sheetId, trades, activeSummaries };
}

/**
 * Appends a new trade to the sheet tab.
 */
export async function appendInvestingTrade(
  spreadsheetId: string,
  tabTitle: string,
  trade: TradeRecord,
  accessToken: string
): Promise<{ rowIndex?: number }> {
  const rowValues = [tradeToRowValues(trade)];

  try {
    const safeRange = formatSheetRange(tabTitle, 'A1:B150');
    const existing = await fetchSheetValues(spreadsheetId, safeRange, accessToken);
    let targetRow = (existing?.length || 1) + 1;

    for (let r = existing.length - 1; r >= 0; r--) {
      const row = existing[r];
      const val = (row?.[1] || row?.[0] || '').toString().trim().toUpperCase();
      if (val === 'BUY' || val === 'SELL') {
        targetRow = r + 2; // Place immediately below last BUY/SELL record
        break;
      }
    }

    const writeRange = formatSheetRange(tabTitle, `A${targetRow}:N${targetRow}`);
    const putRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(writeRange)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: rowValues })
      }
    );

    if (putRes.ok) {
      return { rowIndex: targetRow };
    }
  } catch (scanErr) {
    console.warn('Smart append scan failed, falling back to append API:', scanErr);
  }

  // Fallback: standard append endpoint
  const appendRange = formatSheetRange(tabTitle, 'A:N');
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(appendRange)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: rowValues })
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal menambahkan trade ke Google Sheets');
  }

  const resJson = await res.json();
  let rowIndex: number | undefined;
  const updatedRange = resJson?.updates?.updatedRange;
  if (updatedRange) {
    const match = updatedRange.match(/[A-Z]+(\d+):[A-Z]+(\d+)/);
    if (match && match[1]) {
      rowIndex = parseInt(match[1], 10);
    }
  }

  return { rowIndex };
}

/**
 * Updates a specific trade row (A{row}:N{row}).
 */
export async function updateInvestingTrade(
  spreadsheetId: string,
  tabTitle: string,
  rowIndex: number,
  trade: TradeRecord,
  accessToken: string
) {
  const rowValues = [tradeToRowValues(trade)];
  const safeRange = formatSheetRange(tabTitle, `A${rowIndex}:N${rowIndex}`);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(safeRange)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: rowValues })
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal memperbarui trade di Google Sheets');
  }

  return await res.json();
}

/**
 * Deletes or clears a trade row in tab.
 */
export async function deleteInvestingTrade(
  spreadsheetId: string,
  tabTitle: string,
  rowIndex: number,
  sheetId: number | undefined,
  accessToken: string
) {
  if (typeof sheetId === 'number') {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1,
                endIndex: rowIndex
              }
            }
          }
        ]
      })
    });

    if (res.ok) {
      return await res.json();
    }
  }

  // Fallback: Clear row values
  const safeRange = formatSheetRange(tabTitle, `A${rowIndex}:N${rowIndex}`);
  const clearRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(safeRange)}:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    }
  );

  if (!clearRes.ok) {
    const err = await clearRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal menghapus baris dari Google Sheets');
  }

  return await clearRes.json();
}

/**
 * Exact 10 transactions matching the user's real Google Sheet.
 */
export const INITIAL_INVESTING_TRADES: TradeRecord[] = [
  {
    id: 'trade-row-2-GOLD',
    rowIndex: 2,
    type: 'BUY',
    asset: 'GOLD',
    nominalIdr: 10000000,
    kurs: 1,
    jumlah: 3.8,
    entryDate: '2026-01-05',
    exitDate: '2026-01-29',
    entryPrice: 2630000,
    exitPrice: 3110000,
    pnlPercent: 18.25,
    spreadCost: -109060,
    labaBersih: 1714940,
    status: 'Realized',
    nilaiAset: 0
  },
  {
    id: 'trade-row-3-MSFT',
    rowIndex: 3,
    type: 'BUY',
    asset: 'MSFT',
    nominalIdr: 14800000,
    kurs: 17716,
    jumlah: 1.94,
    entryDate: '2026-05-19',
    exitDate: '2026-06-11',
    entryPrice: 426.0,
    exitPrice: 389.6,
    pnlPercent: -8.54,
    spreadCost: -140157,
    labaBersih: -1404758,
    status: 'Realized',
    nilaiAset: 0
  },
  {
    id: 'trade-row-4-SPCX',
    rowIndex: 4,
    type: 'BUY',
    asset: 'SPCX',
    nominalIdr: 6110000,
    kurs: 17860,
    jumlah: 2.0,
    entryDate: '2026-06-12',
    exitDate: '2026-06-17',
    entryPrice: 172.0,
    exitPrice: 209.0,
    pnlPercent: 21.51,
    spreadCost: -68047,
    labaBersih: 1246314,
    status: 'Realized',
    nilaiAset: 0
  },
  {
    id: 'trade-row-5-WDC',
    rowIndex: 5,
    type: 'BUY',
    asset: 'WDC',
    nominalIdr: 6260000,
    kurs: 17890,
    jumlah: 0.635,
    entryDate: '2026-07-22',
    exitDate: '2026-06-27',
    entryPrice: 550.0,
    exitPrice: 493.0,
    pnlPercent: -10.36,
    spreadCost: -59243,
    labaBersih: -708007,
    status: 'Realized',
    nilaiAset: 0
  },
  {
    id: 'trade-row-6-NVDA',
    rowIndex: 6,
    type: 'BUY',
    asset: 'NVDA',
    nominalIdr: 4850000,
    kurs: 17890,
    jumlah: 1.3,
    entryDate: '2026-07-22',
    exitDate: '',
    entryPrice: 207.7,
    exitPrice: 227.2,
    pnlPercent: 9.39,
    spreadCost: -24152,
    labaBersih: 431425,
    status: 'Floating',
    nilaiAset: 5286586
  },
  {
    id: 'trade-row-7-QCOM',
    rowIndex: 7,
    type: 'BUY',
    asset: 'QCOM',
    nominalIdr: 3635000,
    kurs: 17890,
    jumlah: 1.15,
    entryDate: '2026-07-22',
    exitDate: '2026-07-30',
    entryPrice: 176.0,
    exitPrice: 157.0,
    pnlPercent: -10.80,
    spreadCost: -34255,
    labaBersih: -426670,
    status: 'Realized',
    nilaiAset: 0
  },
  {
    id: 'trade-row-8-SPCX',
    rowIndex: 8,
    type: 'BUY',
    asset: 'SPCX',
    nominalIdr: 3147000,
    kurs: 18140,
    jumlah: 1.5,
    entryDate: '2026-07-28',
    exitDate: '',
    entryPrice: 116.0,
    exitPrice: 149.2,
    pnlPercent: 28.66,
    spreadCost: -15782,
    labaBersih: 885996,
    status: 'Floating',
    nilaiAset: 4006646
  },
  {
    id: 'trade-row-9-QQQ',
    rowIndex: 9,
    type: 'BUY',
    asset: 'QQQ',
    nominalIdr: 5710000,
    kurs: 18033,
    jumlah: 0.465,
    entryDate: '2026-07-30',
    exitDate: '',
    entryPrice: 681.0,
    exitPrice: 737.9,
    pnlPercent: 8.36,
    spreadCost: -28552,
    labaBersih: 448790,
    status: 'Floating',
    nilaiAset: 6141474
  },
  {
    id: 'trade-row-10-SPCX',
    rowIndex: 10,
    type: 'BUY',
    asset: 'SPCX',
    nominalIdr: 2012000,
    kurs: 17767,
    jumlah: 0.8,
    entryDate: '2026-08-27',
    exitDate: '',
    entryPrice: 141.0,
    exitPrice: 149.2,
    pnlPercent: 5.84,
    spreadCost: -10021,
    labaBersih: 107560,
    status: 'Floating',
    nilaiAset: 2136878
  },
  {
    id: 'trade-row-11-MSTR',
    rowIndex: 11,
    type: 'BUY',
    asset: 'MSTR',
    nominalIdr: 2000000,
    kurs: 17980,
    jumlah: 0.7,
    entryDate: '2026-09-28',
    exitDate: '',
    entryPrice: 158.5,
    exitPrice: 154.7,
    pnlPercent: -2.42,
    spreadCost: -9974,
    labaBersih: -58302,
    status: 'Floating',
    nilaiAset: 1946677
  }
];

/**
 * Exact summary of active floating assets matching columns P~T from user's sheet.
 */
export const DEFAULT_ACTIVE_ASSETS: ActiveAssetSummary[] = [
  {
    asset: 'NVDA',
    avgBuy: 207.7,
    priceNow: 227.2,
    pnlPercent: 9.39,
    valueTotalIdr: 5286586
  },
  {
    asset: 'SPCX',
    avgBuy: 124.7,
    priceNow: 149.2,
    pnlPercent: 19.68,
    valueTotalIdr: 6143524
  },
  {
    asset: 'QQQ',
    avgBuy: 681.0,
    priceNow: 737.9,
    pnlPercent: 8.36,
    valueTotalIdr: 6141474
  },
  {
    asset: 'MSTR',
    avgBuy: 158.5,
    priceNow: 154.7,
    pnlPercent: -2.42,
    valueTotalIdr: 1937799
  }
];
