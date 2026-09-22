export type TransactionType = 'Income' | 'Expense' | 'Saldo Bulan Lalu' | 'Transfer Keluar' | 'Transfer Masuk';

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
}

export interface SheetSummary {
  totalAset?: number;
  cashStandbyDanaDarurat?: number;
  totalInvestment?: number;
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

