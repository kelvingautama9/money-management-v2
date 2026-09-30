import { Transaction, BudgetCategory, AccountBalance, EmergencyFund, InvestmentAsset, InvestmentHistory, GlassSettings } from '../types';

export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_TRANSACTIONS_AGUSTUS: Transaction[] = [];
export const INITIAL_TRANSACTIONS_JULI: Transaction[] = [];
export const INITIAL_TRANSACTIONS_JUNI: Transaction[] = [];
export const INITIAL_TRANSACTIONS_MEI: Transaction[] = [];
export const INITIAL_TRANSACTIONS_APRIL: Transaction[] = [];

export const DEFAULT_MONTH_SHEETS = [
  'JANUARI',
  'FEBRUARI',
  'MARET',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DESEMBER'
];

export const INITIAL_TRANSACTIONS_BY_MONTH: Record<string, Transaction[]> = {};

export const INITIAL_SUMMARY_BY_MONTH: Record<string, { totalAset: number; cashStandby: number; totalInvestment: number }> = {};

export const INITIAL_BUDGETS: BudgetCategory[] = [
  {
    id: 'budget-1',
    nama: 'Listrik & Utilitas',
    saldoAwal: 0,
    budgeting: 300000,
    totalSaldo: 300000,
    actualSpend: 0,
    sisa: 300000,
    keterangan: 'Siap digunakan',
    targetBulanan: 300000,
    akunTerkait: 'Allo Bank'
  },
  {
    id: 'budget-2',
    nama: 'Transport & Bensin',
    saldoAwal: 0,
    budgeting: 200000,
    totalSaldo: 200000,
    actualSpend: 0,
    sisa: 200000,
    keterangan: 'Siap digunakan',
    targetBulanan: 200000,
    akunTerkait: 'Jago-Transport'
  },
  {
    id: 'budget-3',
    nama: 'Entertainment & Hiburan',
    saldoAwal: 0,
    budgeting: 150000,
    totalSaldo: 150000,
    actualSpend: 0,
    sisa: 150000,
    keterangan: 'Siap digunakan',
    targetBulanan: 150000,
    akunTerkait: 'Jago-Entertainment'
  },
  {
    id: 'budget-4',
    nama: 'Kebutuhan Pokok & Belanja',
    saldoAwal: 0,
    budgeting: 500000,
    totalSaldo: 500000,
    actualSpend: 0,
    sisa: 500000,
    keterangan: 'Siap digunakan',
    targetBulanan: 500000,
    akunTerkait: 'Bank BCA'
  }
];

export const INITIAL_EMERGENCY_FUND: EmergencyFund = {
  current: 0,
  target: 12000000,
  kekurangan: -12000000,
  persentase: 0
};

export const INITIAL_INVESTMENT_ASSETS: InvestmentAsset[] = [];

export const INITIAL_INVESTMENT_ASSETS_BY_MONTH: Record<string, InvestmentAsset[]> = {};

export const INITIAL_INVESTMENT_HISTORY: InvestmentHistory[] = [];

/**
 * Calculates investment DCA (Dollar Cost Averaging / top up deposit)
 * from monthly transaction records dynamically.
 */
export function calculateMonthlyDCA(transactions: Transaction[] = [], monthName = ''): number {
  const cleanMonth = (monthName || '').trim().toLowerCase();

  // Filter transactions for this month if specified
  const filtered = cleanMonth
    ? transactions.filter((t) => {
        const txMonth = (t.bulan || '').toLowerCase().trim();
        return txMonth.includes(cleanMonth) || cleanMonth.includes(txMonth);
      })
    : transactions;

  if (!filtered || filtered.length === 0) {
    const key = (monthName || '').toUpperCase().replace(/[^A-Z]/g, '');
    const preset = INITIAL_INVESTMENT_ASSETS_BY_MONTH[key];
    if (preset) {
      return preset.reduce((sum, a) => sum + (Number(a.depositWd) || 0), 0);
    }
    return 0;
  }

  // Sum transactions that deposit / transfer funds into investments
  // CRITICAL RULE: In double-entry internal transfers (e.g., Bank BCA -> Investasi),
  // NEVER count 'Transfer Keluar' to avoid double-counting the same deposit amount!
  // Only count inbound capital allocation ('Transfer Masuk' into Investasi / broker accounts,
  // or explicit 'Expense' targeting investment).
  const dcaTotal = filtered
    .filter((t) => {
      const acc = (t.akun || '').toLowerCase();
      const kat = (t.kategori || '').toLowerCase();
      const cat = (t.catatan || '').toLowerCase();
      const tipe = t.tipe;

      // Ignore baseline initial balance records
      if (tipe === 'Saldo Bulan Lalu') return false;

      // STRICT CHECK: Never count Transfer Keluar as DCA (it represents money exiting a bank account)
      if (tipe === 'Transfer Keluar') return false;

      const isInvestTarget =
        acc.includes('investasi') ||
        acc.includes('pluang') ||
        acc.includes('bibit') ||
        acc.includes('ajaib') ||
        acc.includes('binance') ||
        acc.includes('crypto') ||
        kat.includes('investasi') ||
        cat.includes('investasi') ||
        cat.includes('pluang') ||
        cat.includes('bibit') ||
        cat.includes('binance');

      const isTopUpOrDeposit =
        tipe === 'Transfer Masuk' ||
        tipe === 'Expense' ||
        cat.includes('top up') ||
        cat.includes('dca') ||
        cat.includes('setoran');

      return isInvestTarget && isTopUpOrDeposit;
    })
    .reduce((sum, t) => sum + (Number(t.jumlah) || 0), 0);

  // If filtered transactions returned 0, check if there is a preset defined for this month
  if (dcaTotal === 0 && cleanMonth) {
    const key = cleanMonth.toUpperCase().replace(/[^A-Z]/g, '');
    const preset = INITIAL_INVESTMENT_ASSETS_BY_MONTH[key];
    if (preset) {
      return preset.reduce((sum, a) => sum + (Number(a.depositWd) || 0), 0);
    }
  }

  return dcaTotal;
}

export const DEFAULT_GLASS_SETTINGS: GlassSettings = {
  blur: 24,
  translucency: 75,
  darkTint: 10,
  specularIntensity: 90,
  tilt3d: false,
  activePreset: 'ios26',
  themeMode: 'light'
};

export const AVAILABLE_CATEGORIES = [
  'Salary',
  'Saldo Awal',
  'Uang Bulanan',
  'Listrik',
  'Transport',
  'Entertainment',
  'Dating',
  'Jajan',
  'Transfer Internal',
  'Lain-lain'
];

export const AVAILABLE_ACCOUNTS = [
  'Bank BCA',
  'Seabank',
  'Blu BCA - Savings',
  'Blu BCA - Date',
  'Allo Bank',
  'Jago-Transport',
  'Jago-Entertainment',
  'Investasi',
  'Cash'
];
