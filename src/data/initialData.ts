import { Transaction, BudgetCategory, AccountBalance, EmergencyFund, InvestmentAsset, InvestmentHistory, GlassSettings } from '../types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', bulan: 'September', kategori: 'Salary', akun: 'Bank BCA', tipe: 'Income', jumlah: 5916058, catatan: 'Gaji MYPAK' },
  { id: 'tx-2', bulan: 'September', kategori: 'Saldo Awal', akun: 'Seabank', tipe: 'Saldo Bulan Lalu', jumlah: 3808000, catatan: 'Saldo awal Tabungan Standby' },
  { id: 'tx-3', bulan: 'September', kategori: 'Saldo Awal', akun: 'Investasi', tipe: 'Saldo Bulan Lalu', jumlah: 51705076, catatan: 'Net worth akhir bulan AGUSTUS' },
  { id: 'tx-4', bulan: 'September', kategori: 'Saldo Awal', akun: 'Blu BCA - Savings', tipe: 'Saldo Bulan Lalu', jumlah: 436550, catatan: 'Saldo awal Dana Darurat' },
  { id: 'tx-5', bulan: 'September', kategori: 'Saldo Awal', akun: 'Bank BCA', tipe: 'Saldo Bulan Lalu', jumlah: 43725, catatan: 'Saldo awal BANK BCA - JAJAN' },
  { id: 'tx-6', bulan: 'September', kategori: 'Listrik', akun: 'Allo Bank', tipe: 'Saldo Bulan Lalu', jumlah: 200122, catatan: 'Saldo awal Listrik' },
  { id: 'tx-7', bulan: 'September', kategori: 'Transport', akun: 'Jago-Transport', tipe: 'Saldo Bulan Lalu', jumlah: 419885, catatan: 'Saldo awal Traansport' },
  { id: 'tx-8', bulan: 'September', kategori: 'Entertainment', akun: 'Jago-Entertainment', tipe: 'Saldo Bulan Lalu', jumlah: 323033, catatan: 'Saldo awal Entertainment' },
  { id: 'tx-9', bulan: 'September', kategori: 'Dating', akun: 'Blu BCA - Date', tipe: 'Saldo Bulan Lalu', jumlah: 0, catatan: 'Saldo awal Dating bulan ini' },
  { id: 'tx-10', bulan: 'September', kategori: 'Uang Bulanan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 2000000, catatan: 'uang bulanan, Makan,Sabun,dll' },
  { id: 'tx-11', bulan: 'September', kategori: 'Listrik', akun: 'Bank BCA', tipe: 'Transfer Keluar', jumlah: 300000, catatan: 'bayar listrik, dari bca ke allo bank' },
  { id: 'tx-12', bulan: 'September', kategori: 'Listrik', akun: 'Allo Bank', tipe: 'Transfer Masuk', jumlah: 300000, catatan: 'Alokasi budget listrik' },
  { id: 'tx-13', bulan: 'September', kategori: 'Transfer Internal', akun: 'Bank BCA', tipe: 'Transfer Keluar', jumlah: 2016286, catatan: 'tabungan pindah dari bca ke PLUANG' },
  { id: 'tx-14', bulan: 'September', kategori: 'Transfer Internal', akun: 'Investasi', tipe: 'Transfer Masuk', jumlah: 2016286, catatan: 'Top up investasi Pluang' },
  { id: 'tx-15', bulan: 'September', kategori: 'Transport', akun: 'Bank BCA', tipe: 'Transfer Keluar', jumlah: 200000, catatan: 'transport pindah dari bca ke jago' },
  { id: 'tx-16', bulan: 'September', kategori: 'Transport', akun: 'Jago-Transport', tipe: 'Transfer Masuk', jumlah: 200000, catatan: 'Alokasi budget transport' },
  { id: 'tx-17', bulan: 'September', kategori: 'Entertainment', akun: 'Bank BCA', tipe: 'Transfer Keluar', jumlah: 150000, catatan: 'entertainment pindah dari bca ke jago' },
  { id: 'tx-18', bulan: 'September', kategori: 'Entertainment', akun: 'Jago-Entertainment', tipe: 'Transfer Masuk', jumlah: 150000, catatan: 'Alokasi budget entertainment' },
  { id: 'tx-19', bulan: 'September', kategori: 'Dating', akun: 'Bank BCA', tipe: 'Transfer Keluar', jumlah: 500000, catatan: 'dating pindah dari bca ke BLU Dating' },
  { id: 'tx-20', bulan: 'September', kategori: 'Dating', akun: 'Blu BCA - Date', tipe: 'Transfer Masuk', jumlah: 500000, catatan: 'Alokasi budget dating' },
  { id: 'tx-21', bulan: 'September', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 95737, catatan: 'BAYAR SHOPEE PAYLATTER' },
  { id: 'tx-22', bulan: 'September', kategori: 'Dating', akun: 'Blu BCA - Date', tipe: 'Expense', jumlah: 500000, catatan: 'Dating ABC Cooking-Class Bikin Kue - 570K' },
  { id: 'tx-23', bulan: 'September', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 16000, catatan: 'Jajan Es Coklat Family Mart' },
  { id: 'tx-24', bulan: 'September', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 21600, catatan: 'Jajan JUS ALPUKAT dan SUSU' },
  { id: 'tx-25', bulan: 'September', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 70000, catatan: 'Kekurangan payment Dating ABC Cooking' },
  { id: 'tx-26', bulan: 'September', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 130000, catatan: 'Shareen yang pegang untuk Dating lainnya' },
  { id: 'tx-27', bulan: 'September', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 150000, catatan: 'BELI KEBAB' },
  { id: 'tx-28', bulan: 'September', kategori: 'Transport', akun: 'Jago-Transport', tipe: 'Expense', jumlah: 27000, catatan: 'Beli Bensin pertalite yang harganya 10K/L' },
  { id: 'tx-29', bulan: 'September', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 16000, catatan: 'Beli Susu buat bikin MilkTea seperti TEAZZI' },
  { id: 'tx-30', bulan: 'September', kategori: 'Listrik', akun: 'Allo Bank', tipe: 'Expense', jumlah: 304782, catatan: 'Bayar listrik periode bulan Agustus' },
  { id: 'tx-31', bulan: 'September', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 20000, catatan: 'Biaya Admin BCA' },
  { id: 'tx-32', bulan: 'September', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 60000, catatan: 'CUKUR RAMBUT' },
  { id: 'tx-33', bulan: 'September', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 35000, catatan: 'JAJAN INDOMART DAN FAMILYMART' },
  { id: 'tx-34', bulan: 'September', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 20000, catatan: 'JAJAN KOPKEN' },
  { id: 'tx-35', bulan: 'September', kategori: 'Transfer Internal', akun: 'Bank BCA', tipe: 'Transfer Masuk', jumlah: 10000, catatan: 'TUKAR UANG CASH KE BCA DRI KLEIN' },
  { id: 'tx-36', bulan: 'September', kategori: 'Entertainment', akun: 'Jago-Entertainment', tipe: 'Expense', jumlah: 21282, catatan: 'BIAYA PERPANJANG KARTU' },
  { id: 'tx-37', bulan: 'September', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 56500, catatan: 'JAJAN MAKANAN' },
  { id: 'tx-38', bulan: 'September', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 112700, catatan: 'JAJAN MAKANAN MALEM MINGGU' },
  { id: 'tx-39', bulan: 'September', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 126090, catatan: 'NGEDATE SAMA SHAREEN' }
];

export const INITIAL_TRANSACTIONS_AGUSTUS: Transaction[] = [
  { id: 'tx-ag-1', bulan: 'Agustus', kategori: 'Salary', akun: 'Bank BCA', tipe: 'Income', jumlah: 5916058, catatan: 'Gaji MYPAK Agustus' },
  { id: 'tx-ag-2', bulan: 'Agustus', kategori: 'Saldo Awal', akun: 'Seabank', tipe: 'Saldo Bulan Lalu', jumlah: 3500000, catatan: 'Saldo awal Tabungan Standby Juli' },
  { id: 'tx-ag-3', bulan: 'Agustus', kategori: 'Saldo Awal', akun: 'Investasi', tipe: 'Saldo Bulan Lalu', jumlah: 49500000, catatan: 'Net worth akhir bulan Juli' },
  { id: 'tx-ag-4', bulan: 'Agustus', kategori: 'Saldo Awal', akun: 'Blu BCA - Savings', tipe: 'Saldo Bulan Lalu', jumlah: 380000, catatan: 'Saldo awal Dana Darurat' },
  { id: 'tx-ag-5', bulan: 'Agustus', kategori: 'Saldo Awal', akun: 'Bank BCA', tipe: 'Saldo Bulan Lalu', jumlah: 55000, catatan: 'Saldo awal BANK BCA' },
  { id: 'tx-ag-6', bulan: 'Agustus', kategori: 'Uang Bulanan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 2000000, catatan: 'uang bulanan, Makan, Belanja' },
  { id: 'tx-ag-7', bulan: 'Agustus', kategori: 'Listrik', akun: 'Bank BCA', tipe: 'Transfer Keluar', jumlah: 300000, catatan: 'Alokasi bayar listrik' },
  { id: 'tx-ag-8', bulan: 'Agustus', kategori: 'Listrik', akun: 'Allo Bank', tipe: 'Transfer Masuk', jumlah: 300000, catatan: 'Masuk saldo Allo Bank listrik' },
  { id: 'tx-ag-9', bulan: 'Agustus', kategori: 'Listrik', akun: 'Allo Bank', tipe: 'Expense', jumlah: 295000, catatan: 'Bayar Token PLN Agustus' },
  { id: 'tx-ag-10', bulan: 'Agustus', kategori: 'Transfer Internal', akun: 'Bank BCA', tipe: 'Transfer Keluar', jumlah: 2000000, catatan: 'Tabungan investasi ke PLUANG' },
  { id: 'tx-ag-11', bulan: 'Agustus', kategori: 'Transfer Internal', akun: 'Investasi', tipe: 'Transfer Masuk', jumlah: 2000000, catatan: 'Top up Pluang Reksadana & Saham' },
  { id: 'tx-ag-12', bulan: 'Agustus', kategori: 'Transport', akun: 'Bank BCA', tipe: 'Transfer Keluar', jumlah: 200000, catatan: 'Budget Transport Jago' },
  { id: 'tx-ag-13', bulan: 'Agustus', kategori: 'Transport', akun: 'Jago-Transport', tipe: 'Transfer Masuk', jumlah: 200000, catatan: 'Alokasi Transport' },
  { id: 'tx-ag-14', bulan: 'Agustus', kategori: 'Transport', akun: 'Jago-Transport', tipe: 'Expense', jumlah: 120000, catatan: 'Isi Bensin Pertalite & Parkir' },
  { id: 'tx-ag-15', bulan: 'Agustus', kategori: 'Entertainment', akun: 'Bank BCA', tipe: 'Transfer Keluar', jumlah: 150000, catatan: 'Budget Entertainment' },
  { id: 'tx-ag-16', bulan: 'Agustus', kategori: 'Entertainment', akun: 'Jago-Entertainment', tipe: 'Transfer Masuk', jumlah: 150000, catatan: 'Masuk Entertainment' },
  { id: 'tx-ag-17', bulan: 'Agustus', kategori: 'Entertainment', akun: 'Jago-Entertainment', tipe: 'Expense', jumlah: 85000, catatan: 'Nonton Bioskop & Snack' },
  { id: 'tx-ag-18', bulan: 'Agustus', kategori: 'Dating', akun: 'Bank BCA', tipe: 'Transfer Keluar', jumlah: 450000, catatan: 'Alokasi Dating' },
  { id: 'tx-ag-19', bulan: 'Agustus', kategori: 'Dating', akun: 'Blu BCA - Date', tipe: 'Transfer Masuk', jumlah: 450000, catatan: 'Masuk Blu Date' },
  { id: 'tx-ag-20', bulan: 'Agustus', kategori: 'Dating', akun: 'Blu BCA - Date', tipe: 'Expense', jumlah: 450000, catatan: 'Dinner & Cafe Weekend dengan Shareen' },
  { id: 'tx-ag-21', bulan: 'Agustus', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 115000, catatan: 'Kopi & Snack sore Family Mart' },
  { id: 'tx-ag-22', bulan: 'Agustus', kategori: 'Jajan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 85000, catatan: 'Beli Martabak & Terang Bulan' }
];

export const INITIAL_TRANSACTIONS_JULI: Transaction[] = [
  { id: 'tx-ju-1', bulan: 'Juli', kategori: 'Salary', akun: 'Bank BCA', tipe: 'Income', jumlah: 9055307, catatan: 'Gaji MYPAK + Bonus Juli' },
  { id: 'tx-ju-2', bulan: 'Juli', kategori: 'Saldo Awal', akun: 'Seabank', tipe: 'Saldo Bulan Lalu', jumlah: 3200000, catatan: 'Saldo awal Tabungan Standby Juni' },
  { id: 'tx-ju-3', bulan: 'Juli', kategori: 'Saldo Awal', akun: 'Investasi', tipe: 'Saldo Bulan Lalu', jumlah: 45000000, catatan: 'Net worth akhir Juni' },
  { id: 'tx-ju-4', bulan: 'Juli', kategori: 'Saldo Awal', akun: 'Blu BCA - Savings', tipe: 'Saldo Bulan Lalu', jumlah: 350000, catatan: 'Saldo awal Dana Darurat' },
  { id: 'tx-ju-5', bulan: 'Juli', kategori: 'Saldo Awal', akun: 'Bank BCA', tipe: 'Saldo Bulan Lalu', jumlah: 60000, catatan: 'Saldo awal BANK BCA' },
  { id: 'tx-ju-6', bulan: 'Juli', kategori: 'Uang Bulanan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 2500000, catatan: 'Uang bulanan keluarga & makan' },
  { id: 'tx-ju-7', bulan: 'Juli', kategori: 'Transfer Internal', akun: 'Bank BCA', tipe: 'Transfer Keluar', jumlah: 3000000, catatan: 'Top up investasi Pluang' },
  { id: 'tx-ju-8', bulan: 'Juli', kategori: 'Transfer Internal', akun: 'Investasi', tipe: 'Transfer Masuk', jumlah: 3000000, catatan: 'Top up Pluang' },
  { id: 'tx-ju-9', bulan: 'Juli', kategori: 'Listrik', akun: 'Bank BCA', tipe: 'Transfer Keluar', jumlah: 300000, catatan: 'Bayar listrik PLN' },
  { id: 'tx-ju-10', bulan: 'Juli', kategori: 'Transport', akun: 'Bank BCA', tipe: 'Expense', jumlah: 450000, catatan: 'Transport & Bensin bulanan' },
  { id: 'tx-ju-11', bulan: 'Juli', kategori: 'Dating', akun: 'Bank BCA', tipe: 'Expense', jumlah: 400000, catatan: 'Dating & Kuliner weekend' }
];

export const INITIAL_TRANSACTIONS_JUNI: Transaction[] = [
  { id: 'tx-jn-1', bulan: 'Juni', kategori: 'Salary', akun: 'Bank BCA', tipe: 'Income', jumlah: 5916058, catatan: 'Gaji MYPAK Juni' },
  { id: 'tx-jn-2', bulan: 'Juni', kategori: 'Saldo Awal', akun: 'Seabank', tipe: 'Saldo Bulan Lalu', jumlah: 3000000, catatan: 'Saldo awal Standby' },
  { id: 'tx-jn-3', bulan: 'Juni', kategori: 'Saldo Awal', akun: 'Investasi', tipe: 'Saldo Bulan Lalu', jumlah: 46500000, catatan: 'Net worth akhir Mei' },
  { id: 'tx-jn-4', bulan: 'Juni', kategori: 'Saldo Awal', akun: 'Blu BCA - Savings', tipe: 'Saldo Bulan Lalu', jumlah: 300000, catatan: 'Saldo awal Dana Darurat' },
  { id: 'tx-jn-5', bulan: 'Juni', kategori: 'Uang Bulanan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 2000000, catatan: 'Kebutuhan pokok' }
];

export const INITIAL_TRANSACTIONS_MEI: Transaction[] = [
  { id: 'tx-me-1', bulan: 'Mei', kategori: 'Salary', akun: 'Bank BCA', tipe: 'Income', jumlah: 5916058, catatan: 'Gaji MYPAK Mei' },
  { id: 'tx-me-2', bulan: 'Mei', kategori: 'Saldo Awal', akun: 'Seabank', tipe: 'Saldo Bulan Lalu', jumlah: 2800000, catatan: 'Saldo awal Tabungan' },
  { id: 'tx-me-3', bulan: 'Mei', kategori: 'Saldo Awal', akun: 'Investasi', tipe: 'Saldo Bulan Lalu', jumlah: 45800000, catatan: 'Net worth akhir April' },
  { id: 'tx-me-4', bulan: 'Mei', kategori: 'Uang Bulanan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 2000000, catatan: 'Kebutuhan bulanan' }
];

export const INITIAL_TRANSACTIONS_APRIL: Transaction[] = [
  { id: 'tx-ap-1', bulan: 'April', kategori: 'Salary', akun: 'Bank BCA', tipe: 'Income', jumlah: 5916058, catatan: 'Gaji MYPAK April' },
  { id: 'tx-ap-2', bulan: 'April', kategori: 'Saldo Awal', akun: 'Seabank', tipe: 'Saldo Bulan Lalu', jumlah: 2500000, catatan: 'Saldo Tabungan' },
  { id: 'tx-ap-3', bulan: 'April', kategori: 'Saldo Awal', akun: 'Investasi', tipe: 'Saldo Bulan Lalu', jumlah: 45500000, catatan: 'Portofolio Investasi April' },
  { id: 'tx-ap-4', bulan: 'April', kategori: 'Uang Bulanan', akun: 'Bank BCA', tipe: 'Expense', jumlah: 2000000, catatan: 'Kebutuhan bulanan' }
];

export const DEFAULT_MONTH_SHEETS = [
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DESEMBER',
  'JANUARI',
  'FEBRUARI',
  'MARET'
];

export const INITIAL_TRANSACTIONS_BY_MONTH: Record<string, Transaction[]> = {
  'SEPTEMBER': INITIAL_TRANSACTIONS,
  'September': INITIAL_TRANSACTIONS,
  'AGUSTUS': INITIAL_TRANSACTIONS_AGUSTUS,
  'Agustus': INITIAL_TRANSACTIONS_AGUSTUS,
  'JULI': INITIAL_TRANSACTIONS_JULI,
  'Juli': INITIAL_TRANSACTIONS_JULI,
  'JUNI': INITIAL_TRANSACTIONS_JUNI,
  'Juni': INITIAL_TRANSACTIONS_JUNI,
  'MEI': INITIAL_TRANSACTIONS_MEI,
  'Mei': INITIAL_TRANSACTIONS_MEI,
  'APRIL': INITIAL_TRANSACTIONS_APRIL,
  'April': INITIAL_TRANSACTIONS_APRIL
};

export const INITIAL_SUMMARY_BY_MONTH: Record<string, { totalAset: number; cashStandby: number; totalInvestment: number }> = {
  'SEPTEMBER': { totalAset: 55958496, cashStandby: 4253420, totalInvestment: 51705076 },
  'September': { totalAset: 55958496, cashStandby: 4253420, totalInvestment: 51705076 },
  'AGUSTUS': { totalAset: 51705076, cashStandby: 4100000, totalInvestment: 47605076 },
  'Agustus': { totalAset: 51705076, cashStandby: 4100000, totalInvestment: 47605076 },
  'JULI': { totalAset: 48858552, cashStandby: 3858552, totalInvestment: 45000000 },
  'Juli': { totalAset: 48858552, cashStandby: 3858552, totalInvestment: 45000000 },
  'JUNI': { totalAset: 50028872, cashStandby: 3528872, totalInvestment: 46500000 },
  'Juni': { totalAset: 50028872, cashStandby: 3528872, totalInvestment: 46500000 },
  'MEI': { totalAset: 49166700, cashStandby: 3366700, totalInvestment: 45800000 },
  'Mei': { totalAset: 49166700, cashStandby: 3366700, totalInvestment: 45800000 },
  'APRIL': { totalAset: 48540000, cashStandby: 3040000, totalInvestment: 45500000 },
  'April': { totalAset: 48540000, cashStandby: 3040000, totalInvestment: 45500000 }
};

export const INITIAL_BUDGETS: BudgetCategory[] = [
  {
    id: 'budget-1',
    nama: 'Budget Listrik (300K/Bulan)',
    saldoAwal: 200122,
    budgeting: 300000,
    totalSaldo: 500122,
    actualSpend: 304782,
    sisa: 195340,
    keterangan: 'Sisa: Rp 195.340',
    targetBulanan: 300000,
    akunTerkait: 'Allo Bank'
  },
  {
    id: 'budget-2',
    nama: 'Budget Entertainment (150K/Bulan)',
    saldoAwal: 323033,
    budgeting: 150000,
    totalSaldo: 473033,
    actualSpend: 21282,
    sisa: 451751,
    keterangan: 'Sisa: Rp 451.751',
    targetBulanan: 150000,
    akunTerkait: 'Jago-Entertainment'
  },
  {
    id: 'budget-3',
    nama: 'Budget Transport (200K/Bulan)',
    saldoAwal: 419885,
    budgeting: 200000,
    totalSaldo: 619885,
    actualSpend: 27000,
    sisa: 592885,
    keterangan: 'Sisa: Rp 592.885',
    targetBulanan: 200000,
    akunTerkait: 'Jago-Transport'
  },
  {
    id: 'budget-4',
    nama: 'Dating with Shareen (400K/Bulan)',
    saldoAwal: 0,
    budgeting: 500000,
    totalSaldo: 500000,
    actualSpend: 500000,
    sisa: 0,
    keterangan: 'Budget terserap penuh',
    targetBulanan: 400000,
    akunTerkait: 'Blu BCA - Date'
  }
];

export const INITIAL_EMERGENCY_FUND: EmergencyFund = {
  current: 436550,
  target: 12000000,
  kekurangan: -11563450,
  persentase: 3.64 // ~4%
};

export const INITIAL_INVESTMENT_ASSETS: InvestmentAsset[] = [
  { nama: 'Pluang (Reksadana & Saham AS)', nilaiAkhirBulan: 16860459, depositWd: 2016286, alokasiPercent: 32.6, warna: '#38bdf8' },
  { nama: 'USD - Valas BCA', nilaiAkhirBulan: 22507000, depositWd: 0, alokasiPercent: 43.5, warna: '#34d399' },
  { nama: 'USDT - Binance', nilaiAkhirBulan: 12337617, depositWd: 0, alokasiPercent: 23.9, warna: '#f59e0b' }
];

export const INITIAL_INVESTMENT_HISTORY: InvestmentHistory[] = [
  { bulan: 'April', pluang: 13800000, valasBca: 22400000, usdtBinance: 12340000, totalNetWorth: 48540000, netProfitMoM: 0, pnlPercent: 0 },
  { bulan: 'Mei', pluang: 14252195, valasBca: 22570821, usdtBinance: 12343684, totalNetWorth: 49166700, netProfitMoM: 626700, pnlPercent: 1.29 },
  { bulan: 'Juni', pluang: 14821204, valasBca: 22787237, usdtBinance: 12420431, totalNetWorth: 50028872, netProfitMoM: 862172, pnlPercent: 1.75 },
  { bulan: 'Juli', pluang: 13427751, valasBca: 22901809, usdtBinance: 12528992, totalNetWorth: 48858552, netProfitMoM: -1170320, pnlPercent: -2.34 },
  { bulan: 'Agustus', pluang: 16860459, valasBca: 22507000, usdtBinance: 12337617, totalNetWorth: 51705076, netProfitMoM: 830238, pnlPercent: 1.63 },
  { bulan: 'September (Est)', pluang: 18876745, valasBca: 22507000, usdtBinance: 12337617, totalNetWorth: 53721362, netProfitMoM: 2016286, pnlPercent: 3.90 }
];

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
