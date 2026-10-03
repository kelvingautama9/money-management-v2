export type TransactionType = 'Income' | 'Expense' | 'Saldo Bulan Lalu' | 'Transfer Keluar' | 'Transfer Masuk';

export type ActivePage =
  | 'summary'      // Ringkasan
  | 'cashflow'     // Input Cashflow / Mutasi
  | 'budgeting'    // Dompet & Rekening
  | 'portfolio'    // Portofolio & Aset
  | 'accounts'     // Saldo Rekening
  | 'calculator'   // Utility: Kalkulator Pensiun
  | 'investing';   // Dashboard Jurnal Trading & Investasi (Tab INVESTING)

export type TradeType = 'BUY' | 'SELL';
export type TradeStatus = 'Realized' | 'Floating';

export interface TradeRecord {
  id: string;
  rowIndex?: number; // 1-indexed row number in Google Sheet
  type: TradeType;
  asset: string; // Ticker e.g. NVDA, SPCX, GOLD, MSFT
  nominalIdr: number; // Column C: Nominal (IDR)
  kurs: number; // Column D: Kurs IDR-USD
  jumlah: number; // Column E: Jumlah (Lot / Lembar)
  entryDate: string; // Column F: YYYY-MM-DD
  exitDate?: string; // Column G: YYYY-MM-DD (empty if Floating)
  entryPrice: number; // Column H: USD or IDR
  exitPrice: number; // Column I: USD or IDR
  pnlPercent: number; // Column J: PnL (%)
  spreadCost: number; // Column K: SPREAD 0.5% (negative)
  labaBersih: number; // Column L: Laba Bersih in IDR
  status: TradeStatus; // Column M: Realized | Floating
  nilaiAset: number; // Column N: Nilai Aset in IDR
}

export interface ActiveAssetSummary {
  asset: string; // Column P: ASSET
  avgBuy: number; // Column Q: AVERAGE BUY
  priceNow: number; // Column R: PRICE NOW
  pnlPercent: number; // Column S: PnL (%)
  valueTotalIdr: number; // Column T or S: VALUE TOTAL (IDR)
  rowIndex?: number;
}

export interface Transaction {
  id: string;
  bulan: string;
  kategori: string;
  akun: string;
  tipe: TransactionType;
  jumlah: number;
  catatan: string;
  rowIndex?: number; // Corresponding row in Google Sheet (if synced)
  tanggal?: string;
}

export interface BudgetCategory {
  id: string;
  nama: string;
  saldoAwal: number;
  budgeting: number;
  totalSaldo: number;
  actualSpend: number;
  sisa: number;
  keterangan: string;
  targetBulanan: number;
  akunTerkait: string;
  sheetCell?: string;
  sheetRow?: number;
  sheetCol?: number;
}

export interface AccountBalance {
  nama: string;
  totalSaldo: number;
  saldoAwal?: number;
  spendBulanIniPercent?: number;
  iconType?: string;
  color?: string;
}

export interface EmergencyFund {
  current: number;
  target: number;
  kekurangan: number;
  persentase: number;
}

export interface InvestmentAsset {
  nama: string;
  nilaiAkhirBulan: number;
  depositWd: number;
  alokasiPercent: number;
  warna: string;
}

export interface InvestmentHistory {
  bulan: string;
  pluang: number;
  valasBca: number;
  usdtBinance: number;
  totalNetWorth: number;
  netProfitMoM: number;
  pnlPercent: number;
  dca?: number;
  isClosed?: boolean;
}

export interface SheetSummary {
  totalAset?: number;
  cashStandbyDanaDarurat?: number;
  totalInvestment?: number;
  totalPemasukan?: number;
  totalPengeluaran?: number;
  netCashflow?: number;
  sourceCell?: string;
  sourceMethod?: 'cell_anchor' | 'account_table' | 'component_sum' | 'transactions';
  hasRealActivity?: boolean;
  accountBalances?: Record<string, number>;
  emergencyFund?: Partial<EmergencyFund>;
  budgets?: Partial<BudgetCategory>[];
}

export type ThemeMode = 'dark' | 'light' | 'beige' | 'midnight';

export interface GlassSettings {
  blur: number; // in px (e.g. 10 - 40)
  translucency: number; // in percent (e.g. 20 - 90)
  darkTint: number; // in percent (e.g. 20 - 80)
  specularIntensity: number; // in percent (e.g. 0 - 100)
  tilt3d: boolean;
  activePreset: 'ios26' | 'frosted' | 'deepDark' | 'crystal';
  themeMode?: ThemeMode;
}

export interface PersistedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDevMode?: boolean;
}

