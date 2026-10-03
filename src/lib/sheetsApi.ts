import { Transaction, SheetSummary, InvestmentAsset } from '../types';
import { normalizeMonthTitleCase } from './sheetStyles';

export { normalizeMonthTitleCase };

export function getStandardAssetColor(name: string, index: number = 0): string {
  const n = (name || '').toLowerCase();
  if (n.includes('pluang') || n.includes('saham') || n.includes('reksadana')) return '#38bdf8'; // Sky
  if (n.includes('valas') || n.includes('usd') || n.includes('bca')) return '#34d399'; // Emerald
  if (n.includes('usdt') || n.includes('binance') || n.includes('kripto') || n.includes('crypto')) return '#fbbf24'; // Amber
  if (n.includes('bibit')) return '#10b981';
  if (n.includes('ajaib')) return '#06b6d4';
  if (n.includes('gold') || n.includes('emas')) return '#eab308';
  const palette = ['#38bdf8', '#34d399', '#fbbf24', '#a855f7', '#f43f5e', '#6366f1', '#14b8a6'];
  return palette[index % palette.length];
}

/**
 * Extracts Google Spreadsheet ID from a URL or raw ID string.
 * Supports /spreadsheets/d/{id}, /spreadsheets/u/0/d/{id}, /d/{id}, and raw IDs.
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Match standard /d/{id} pattern in any Google Docs URL
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Strip any URL protocol, domain, parameters or hashes if present
  const cleaned = trimmed
    .replace(/^https?:\/\/[^/]+\//, '')
    .split('?')[0]
    .split('#')[0]
    .split('/')[0];
  return cleaned || trimmed;
}

/**
 * Formats a number to Indonesian Rupiah currency string.
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Parses Indonesian currency strings like "Rp5.916.058", "Rp 200.122", "5.916.058" into a number.
 */
export function parseCurrencyToNumber(val: string | number | undefined): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (val === undefined || val === null) return 0;
  let str = val.toString().trim();
  if (!str) return 0;

  // Check for negative indicator: minus (-), en-dash (–), em-dash (—), or accounting parentheses (Rp...)
  const isNegative =
    str.includes('-') ||
    str.includes('–') ||
    str.includes('—') ||
    (str.startsWith('(') && str.endsWith(')'));

  // Remove currency words, parentheses, non-breaking spaces, and leave digits, commas, dots
  str = str.replace(/[^0-9,.]/g, '');
  if (!str) return 0;

  let cleanNumberStr = '';
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      // Indonesian format: 1.125.940,50
      cleanNumberStr = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,125,940.50
      cleanNumberStr = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      // Thousands separator like 126.090 or 1.125.940
      cleanNumberStr = parts.join('');
    } else {
      cleanNumberStr = str;
    }
  } else if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      cleanNumberStr = parts.join('');
    } else {
      cleanNumberStr = str.replace(',', '.');
    }
  } else {
    cleanNumberStr = str;
  }

  const num = parseFloat(cleanNumberStr);
  if (isNaN(num)) return 0;
  return isNegative ? -Math.abs(num) : num;
}

export function colIndexToA1(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

export interface ReconciledBudgetMetrics {
  saldoAwal: number;
  budgeting: number;
  totalSaldo: number;
  actualSpend: number;
  sisa: number;
}

/**
 * Reconciles and sanitizes budget category metrics to prevent swapped monthly budget / prior balance,
 * and fixes erroneous calculation where actual spend mistakenly reads total wallet capacity.
 */
export function reconcileBudgetMetrics(
  categoryName: string,
  raw: {
    saldoAwal?: number;
    budgeting?: number;
    totalSaldo?: number;
    actualSpend?: number;
    sisa?: number;
  },
  candidateSlice?: number[]
): ReconciledBudgetMetrics {
  let saldoAwal = raw.saldoAwal ?? 0;
  let budgeting = raw.budgeting ?? 0;
  let totalSaldo = raw.totalSaldo ?? 0;
  let actualSpend = raw.actualSpend ?? 0;
  let sisa = raw.sisa;

  // 1. If we have the 5 sequential numeric columns from the sheet row:
  // Layout in Google Sheet:
  // [Col 0: Saldo Awal / Sisa Bulan Lalu, Col 1: Budgeting Bulanan, Col 2: Total Saldo, Col 3: Actual Spend, Col 4: Sisa]
  if (candidateSlice && candidateSlice.length >= 4) {
    const c1 = candidateSlice[0] ?? 0;
    const c2 = candidateSlice[1] ?? 0;
    const c3 = candidateSlice[2] ?? 0;
    const c4 = candidateSlice[3] ?? 0;
    const c5 = candidateSlice[4];

    // Check if c1 + c2 ≈ c3 (e.g. 200.122 + 300.000 = 500.122)
    if (c3 > 0 && Math.abs((c1 + c2) - c3) <= 10) {
      totalSaldo = c3;
      actualSpend = c4;
      sisa = c5 !== undefined ? c5 : totalSaldo - actualSpend;
      saldoAwal = c1;
      budgeting = c2;
    }
  }

  // 2. Validate totalSaldo = saldoAwal + budgeting
  if (totalSaldo === 0 && (saldoAwal > 0 || budgeting > 0)) {
    totalSaldo = saldoAwal + budgeting;
  }

  // 3. Resolve swapped saldoAwal vs budgeting based on category name hint or roundness
  // E.g. "Budget Listrik (300K/Bulan)": 300K means budgeting = 300.000, not saldoAwal = 300.000
  const kMatch = categoryName.match(/(\d+)\s*k/i);
  if (kMatch) {
    const hint = parseInt(kMatch[1], 10) * 1000;
    if (Math.abs(saldoAwal - hint) <= 100 && Math.abs(budgeting - hint) > 100) {
      const tmp = budgeting;
      budgeting = saldoAwal;
      saldoAwal = tmp;
    }
  } else {
    // If one is clean round thousands and the other has odd balance, clean is budgeting
    if (budgeting % 1000 !== 0 && saldoAwal > 0 && saldoAwal % 10000 === 0 && saldoAwal > budgeting) {
      const tmp = budgeting;
      budgeting = saldoAwal;
      saldoAwal = tmp;
    }
  }

  // Ensure totalSaldo is consistent
  if (totalSaldo === 0 || Math.abs(totalSaldo - (saldoAwal + budgeting)) > 10) {
    totalSaldo = saldoAwal + budgeting;
  }

  // 4. Resolve actualSpend vs sisa
  // If actualSpend mistakenly captured totalSaldo (e.g. actualSpend = 500.122 and sisa = 0)
  if (sisa === undefined || (actualSpend === totalSaldo && totalSaldo > 0 && sisa === 0)) {
    sisa = totalSaldo - actualSpend;
  }

  // Re-verify sisa = totalSaldo - actualSpend
  if (Math.abs((totalSaldo - actualSpend) - (sisa ?? 0)) > 10 && actualSpend > 0) {
    sisa = totalSaldo - actualSpend;
  }

  return {
    saldoAwal,
    budgeting,
    totalSaldo,
    actualSpend,
    sisa: sisa ?? (totalSaldo - actualSpend)
  };
}

/**
 * Parses both transaction records (columns A..F) and the spreadsheet's precalculated
 * monthly summary tables (columns H..N) from Google Sheets grid data.
 */
export function parseSheetGridData(
  rows: string[][],
  sheetName: string
): { transactions: Transaction[]; summary: SheetSummary } {
  const transactions: Transaction[] = [];
  const summary: SheetSummary = {
    accountBalances: {}
  };

  if (!rows || rows.length === 0) {
    return { transactions, summary };
  }

  let accountColIndex = -1;
  let readingAccountSection = false;
  let budgetColIndex = -1;
  let readingBudgetSection = false;
  const budgetHeaderMap = {
    name: -1,
    saldoAwal: -1,
    budgeting: -1,
    totalSaldo: -1,
    actualSpend: -1,
    sisa: -1,
    keterangan: -1
  };

  rows.forEach((row, rowIndex) => {
    if (!row || row.length === 0) return;

    // --- 1. Extract Transaction from columns A..F ---
    const col0 = (row[0] || '').toString().trim();
    const col1 = (row[1] || '').toString().trim();
    const col2 = (row[2] || '').toString().trim();
    const col3 = (row[3] || '').toString().trim();
    const col4 = (row[4] || '').toString().trim();
    const col5 = (row[5] || '').toString().trim();

    const isHeaderRow =
      rowIndex === 0 ||
      col1.toLowerCase() === 'kategori' ||
      col2.toLowerCase() === 'akun' ||
      col3.toLowerCase() === 'tipe' ||
      (col0.toLowerCase().includes('bulan') &&
        (col1.toLowerCase().includes('kategori') || col2.toLowerCase().includes('akun')));

    // Only consider valid rows that have real category/account/amount, ignoring black empty separator rows
    const isBlankSeparator = !col1 && !col2 && !col4 && !col5;

    if (!isHeaderRow && !isBlankSeparator && (col1 || col2 || col4 || col5)) {
      const parsedAmount = parseCurrencyToNumber(col4);
      // Valid transaction must have category or non-zero amount or note
      if (col1 || parsedAmount !== 0 || col5) {
        transactions.push({
          id: `sheet-tx-${sheetName}-${rowIndex + 1}`,
          bulan: normalizeMonthTitleCase(col0 || sheetName),
          kategori: col1 || 'Lain-lain',
          akun: col2 || 'Bank BCA',
          tipe: (col3 as any) || 'Expense',
          jumlah: parsedAmount,
          catatan: col5 || '',
          rowIndex: rowIndex + 1
        });
      }
    }

    // --- 2. Extract Precalculated Summary from columns G..N ---
    // Section A: Budgeting Categories Section row reading
    if (readingBudgetSection && budgetColIndex >= 0) {
      const budNameCell = (row[budgetColIndex] || '').toString().trim();
      const budLower = budNameCell.toLowerCase();

      // Section terminator
      if (
        !budNameCell ||
        budLower.startsWith('total') ||
        budLower.startsWith('nama akun') ||
        budLower.startsWith('dana darurat') ||
        budLower.startsWith('grand total')
      ) {
        readingBudgetSection = false;
      } else if (!budLower.includes('jenis budgeting') && !budLower.includes('kategori')) {
        // Resolve actual column indices for each metric
        const saldoAwalCol = budgetHeaderMap.saldoAwal >= 0 ? budgetHeaderMap.saldoAwal : budgetColIndex + 1;
        const budgetingCol = budgetHeaderMap.budgeting >= 0 ? budgetHeaderMap.budgeting : budgetColIndex + 2;
        const totalSaldoCol = budgetHeaderMap.totalSaldo >= 0 ? budgetHeaderMap.totalSaldo : budgetColIndex + 3;
        const actualSpendCol = budgetHeaderMap.actualSpend >= 0 ? budgetHeaderMap.actualSpend : budgetColIndex + 4;
        const sisaCol = budgetHeaderMap.sisa >= 0 ? budgetHeaderMap.sisa : budgetColIndex + 5;
        const ketCol = budgetHeaderMap.keterangan >= 0 ? budgetHeaderMap.keterangan : budgetColIndex + 6;

        const candidateSlice = [
          parseCurrencyToNumber(row[budgetColIndex + 1]),
          parseCurrencyToNumber(row[budgetColIndex + 2]),
          parseCurrencyToNumber(row[budgetColIndex + 3]),
          parseCurrencyToNumber(row[budgetColIndex + 4]),
          parseCurrencyToNumber(row[budgetColIndex + 5]),
        ];

        const rawSaldoAwal = parseCurrencyToNumber(row[saldoAwalCol]);
        const rawBudgeting = parseCurrencyToNumber(row[budgetingCol]);
        const rawTotalSaldo = parseCurrencyToNumber(row[totalSaldoCol]);
        const rawActualSpend = parseCurrencyToNumber(row[actualSpendCol]);
        const rawSisa = row[sisaCol] !== undefined && row[sisaCol] !== '' ? parseCurrencyToNumber(row[sisaCol]) : undefined;

        const reconciled = reconcileBudgetMetrics(
          budNameCell,
          {
            saldoAwal: rawSaldoAwal,
            budgeting: rawBudgeting,
            totalSaldo: rawTotalSaldo,
            actualSpend: rawActualSpend,
            sisa: rawSisa
          },
          candidateSlice
        );

        const ketText = (row[ketCol] || '').toString().trim() || (reconciled.sisa > 0 ? `Sisa: ${formatRupiah(reconciled.sisa)}` : 'Anggaran Terserap');

        const rowNumber = rowIndex + 1;
        const colLetter = colIndexToA1(budgetColIndex);
        const cellA1 = `${colLetter}${rowNumber}`;

        if (!summary.budgets) summary.budgets = [];
        summary.budgets.push({
          nama: budNameCell,
          saldoAwal: reconciled.saldoAwal,
          budgeting: reconciled.budgeting,
          targetBulanan: reconciled.budgeting,
          totalSaldo: reconciled.totalSaldo,
          actualSpend: reconciled.actualSpend,
          sisa: reconciled.sisa,
          keterangan: ketText,
          sheetCell: cellA1,
          sheetRow: rowNumber,
          sheetCol: budgetColIndex
        });
      }
    }

    // Section B: Account Section Header or Read active Account Section row
    if (readingAccountSection && accountColIndex >= 0) {
      const accCell = (row[accountColIndex] || '').toString().trim();
      const accCellLower = accCell.toLowerCase();

      // Section terminator
      if (
        !accCell ||
        accCellLower.startsWith('total pemasukan') ||
        accCellLower.startsWith('dana darurat') ||
        accCellLower.startsWith('jenis budgeting') ||
        accCellLower.startsWith('target bulanan')
      ) {
        readingAccountSection = false;
      } else {
        // Look for balance in adjacent columns (c+1, c+2, c+3)
        let rawSaldo = row[accountColIndex + 1];
        if ((rawSaldo === undefined || rawSaldo === '') && row[accountColIndex + 2] !== undefined) {
          rawSaldo = row[accountColIndex + 2];
        }

        if (rawSaldo !== undefined && rawSaldo !== '') {
          const balance = parseCurrencyToNumber(rawSaldo);
          if (summary.accountBalances) {
            summary.accountBalances[accCell] = balance;
            summary.accountBalances[accCellLower] = balance;
            // Also store clean stripped key (e.g. "bca", "bankbca", "seabank")
            const cleanKey = accCellLower.replace(/[^a-z0-9]/g, '');
            if (cleanKey) {
              summary.accountBalances[cleanKey] = balance;
            }
          }
        }
      }
    }

    // Scan cells for KPI labels and section headers
    for (let c = 5; c < row.length; c++) {
      const cellText = (row[c] || '').toString().trim();
      const cellTextLower = cellText.toLowerCase();
      if (!cellText) continue;

      // Check Jenis Budgeting / Pos Budgeting Header
      if (
        cellTextLower === 'jenis budgeting' ||
        cellTextLower === 'pos budgeting' ||
        cellTextLower.includes('jenis budgeting') ||
        cellTextLower.includes('alokasi budgeting')
      ) {
        readingBudgetSection = true;
        budgetColIndex = c;
        budgetHeaderMap.name = c;

        // Scan columns in this row to detect exact column indices for each metric
        for (let hc = c; hc < Math.min(row.length, c + 10); hc++) {
          const hText = (row[hc] || '').toString().trim().toLowerCase();
          if (
            hText.includes('saldo awal') ||
            hText.includes('s. awal') ||
            hText.includes('saldo bulan lalu') ||
            hText.includes('sisa saldo bulan lalu') ||
            hText.includes('sisa bulan lalu') ||
            hText.includes('saldo lalu') ||
            hText.includes('saldo kemarin') ||
            hText.includes('carry over')
          ) {
            budgetHeaderMap.saldoAwal = hc;
          } else if (
            (hText === 'budgeting' ||
              hText.includes('budgeting') ||
              hText.includes('target') ||
              hText.includes('plafon') ||
              hText.includes('alokasi') ||
              hText.includes('kuota') ||
              hText.includes('jatah')) &&
            !hText.includes('jenis') &&
            !hText.includes('total')
          ) {
            budgetHeaderMap.budgeting = hc;
          } else if (
            hText.includes('total saldo') ||
            hText.includes('saldo total') ||
            hText.includes('kapasitas') ||
            hText.includes('jumlah saldo')
          ) {
            budgetHeaderMap.totalSaldo = hc;
          } else if (
            hText.includes('actual') ||
            hText.includes('spend') ||
            hText.includes('realisasi') ||
            hText.includes('pemakaian') ||
            hText.includes('terpakai') ||
            hText.includes('pengeluaran')
          ) {
            budgetHeaderMap.actualSpend = hc;
          } else if (hText.includes('sisa') && !hText.includes('bulan lalu') && !hText.includes('awal')) {
            budgetHeaderMap.sisa = hc;
          } else if (hText.includes('keterangan') || hText.includes('catatan') || hText.includes('ket') || hText.includes('status')) {
            budgetHeaderMap.keterangan = hc;
          }
        }

        // Fallback default offsets if headers didn't strictly match:
        // Col H (0): Jenis Budgeting
        // Col I (1): Saldo Awal / Sisa Saldo Bulan Lalu
        // Col J (2): Budgeting Bulanan
        // Col K (3): Total Saldo
        // Col L (4): Actual Spend
        // Col M (5): Sisa
        // Col N (6): Keterangan
        if (budgetHeaderMap.saldoAwal === -1) budgetHeaderMap.saldoAwal = c + 1;
        if (budgetHeaderMap.budgeting === -1) budgetHeaderMap.budgeting = c + 2;
        if (budgetHeaderMap.totalSaldo === -1) budgetHeaderMap.totalSaldo = c + 3;
        if (budgetHeaderMap.actualSpend === -1) budgetHeaderMap.actualSpend = c + 4;
        if (budgetHeaderMap.sisa === -1) budgetHeaderMap.sisa = c + 5;
        if (budgetHeaderMap.keterangan === -1) budgetHeaderMap.keterangan = c + 6;
      }

      // Check Total Aset (Net Worth)
      if (
        cellTextLower === 'total aset' ||
        cellTextLower === 'total asset' ||
        cellTextLower === 'total assets' ||
        cellTextLower.includes('total aset') ||
        cellTextLower.includes('kekayaan bersih') ||
        cellTextLower.includes('net worth') ||
        cellTextLower === 'grand total'
      ) {
        let targetCol = c + 1;
        let targetRow = rowIndex + 1;
        let nextVal: any = undefined;

        if (row[c + 1] !== undefined && row[c + 1] !== '') {
          nextVal = row[c + 1];
          targetCol = c + 1;
        } else if (row[c + 2] !== undefined && row[c + 2] !== '') {
          nextVal = row[c + 2];
          targetCol = c + 2;
        } else if (row[c + 3] !== undefined && row[c + 3] !== '') {
          nextVal = row[c + 3];
          targetCol = c + 3;
        } else if (rows[rowIndex + 1]) {
          if (rows[rowIndex + 1][c] !== undefined && rows[rowIndex + 1][c] !== '') {
            nextVal = rows[rowIndex + 1][c];
            targetCol = c;
            targetRow = rowIndex + 2;
          } else if (rows[rowIndex + 1][c + 1] !== undefined && rows[rowIndex + 1][c + 1] !== '') {
            nextVal = rows[rowIndex + 1][c + 1];
            targetCol = c + 1;
            targetRow = rowIndex + 2;
          }
        }

        const num = parseCurrencyToNumber(nextVal);
        if (num !== 0 || nextVal === '0' || nextVal === 0) {
          summary.totalAset = num;
          summary.sourceCell = `${colIndexToA1(targetCol)}${targetRow}`;
          summary.sourceMethod = 'cell_anchor';
        }
      }

      // Check Total Cash Standby + Dana Darurat
      if (
        cellTextLower.includes('total cash standby') ||
        cellTextLower.includes('cash standby') ||
        cellTextLower.includes('kas cair')
      ) {
        let nextVal = row[c + 1] ?? row[c + 2] ?? row[c + 3];
        if ((nextVal === undefined || nextVal === '') && rows[rowIndex + 1]) {
          nextVal = rows[rowIndex + 1][c] ?? rows[rowIndex + 1][c + 1];
        }
        const num = parseCurrencyToNumber(nextVal);
        if (num !== 0 || nextVal === '0' || nextVal === 0) {
          summary.cashStandbyDanaDarurat = num;
        }
      }

      // Check Total Investment
      if (
        cellTextLower === 'total investment' ||
        cellTextLower === 'total investasi' ||
        cellTextLower.includes('total investment') ||
        cellTextLower.includes('portofolio investasi') ||
        cellTextLower.includes('total portofolio')
      ) {
        let nextVal = row[c + 1] ?? row[c + 2] ?? row[c + 3];
        if ((nextVal === undefined || nextVal === '') && rows[rowIndex + 1]) {
          nextVal = rows[rowIndex + 1][c] ?? rows[rowIndex + 1][c + 1];
        }
        const num = parseCurrencyToNumber(nextVal);
        if (num !== 0 || nextVal === '0' || nextVal === 0) {
          summary.totalInvestment = num;
        }
      }

      // Check Account Balances section header
      if (
        cellTextLower === 'nama akun' ||
        cellTextLower === 'rekening' ||
        cellTextLower.includes('nama akun') ||
        cellTextLower.includes('dompet & rekening')
      ) {
        readingAccountSection = true;
        accountColIndex = c;
      }

      // Check Emergency Fund
      if (cellTextLower.includes('dana darurat (blu bca)') || cellTextLower.includes('dana darurat saat ini')) {
        const nextVal = row[c + 1] ?? row[c + 2];
        const num = parseCurrencyToNumber(nextVal);
        if (num > 0) {
          summary.emergencyFund = {
            ...(summary.emergencyFund || { target: 12000000, kekurangan: 0, persentase: 0 }),
            current: num
          };
        }
      }

      if (cellTextLower.includes('target dana darurat')) {
        const nextVal = row[c + 1] ?? row[c + 2];
        const num = parseCurrencyToNumber(nextVal);
        if (num > 0 && summary.emergencyFund) {
          summary.emergencyFund.target = num;
        }
      }
    }
  });

  // --- Self-Auditing & Component Reconciliation ---
  // 1. Compute pure Income & Expense from transactions (excluding Saldo Bulan Lalu and Transfer Internal)
  const pureIncome = transactions
    .filter((t) => t.tipe === 'Income')
    .reduce((sum, t) => sum + (Number(t.jumlah) || 0), 0);
  const pureExpense = transactions
    .filter((t) => t.tipe === 'Expense')
    .reduce((sum, t) => sum + (Number(t.jumlah) || 0), 0);

  summary.totalPemasukan = pureIncome;
  summary.totalPengeluaran = pureExpense;
  summary.netCashflow = pureIncome - pureExpense;

  // 2. Reconcile Account Balances table (Nama Akun) into liquid cash vs investment
  let accountTableLiquid = 0;
  let accountTableInvest = 0;
  let hasAccountTableBalances = false;

  if (summary.accountBalances && Object.keys(summary.accountBalances).length > 0) {
    const balances = summary.accountBalances;
    const recognizedAccounts = [
      'bank bca',
      'seabank',
      'blu bca - savings',
      'investasi',
      'allo bank',
      'jago-transport',
      'jago-entertainment',
      'blu bca - date',
      'cash'
    ];

    const seenKeys = new Set<string>();
    for (const acc of recognizedAccounts) {
      const clean = acc.replace(/[^a-z0-9]/g, '');
      const val = balances[acc] ?? balances[clean];
      if (typeof val === 'number') {
        if (acc.includes('invest')) {
          accountTableInvest += val;
        } else {
          accountTableLiquid += val;
        }
        hasAccountTableBalances = true;
        seenKeys.add(acc);
        seenKeys.add(clean);
      }
    }

    // If user has custom account names in their Nama Akun table, sum them cleanly without double-counting aliases or subtotals
    if (!hasAccountTableBalances) {
      Object.entries(balances).forEach(([k, v]) => {
        const lowerK = k.toLowerCase().trim();
        const cleanK = lowerK.replace(/[^a-z0-9]/g, '');
        if (
          typeof v === 'number' &&
          cleanK &&
          !seenKeys.has(cleanK) &&
          !lowerK.startsWith('total') &&
          !lowerK.startsWith('subtotal') &&
          !lowerK.startsWith('grand total')
        ) {
          seenKeys.add(cleanK);
          if (lowerK.includes('invest') || lowerK.includes('pluang') || lowerK.includes('bibit') || lowerK.includes('binance')) {
            accountTableInvest += v;
          } else {
            accountTableLiquid += v;
          }
          hasAccountTableBalances = true;
        }
      });
    }
  }

  const accountTableTotal = accountTableLiquid + accountTableInvest;

  // Fill missing component breakdown (Kas Cair vs Portofolio Investasi)
  if (summary.cashStandbyDanaDarurat === undefined && hasAccountTableBalances) {
    summary.cashStandbyDanaDarurat = accountTableLiquid;
  }
  if (summary.totalInvestment === undefined && hasAccountTableBalances && accountTableInvest > 0) {
    summary.totalInvestment = accountTableInvest;
  }

  // Fallback 1: If Total Aset anchor cell was not explicitly present, use Account Balances Table sum
  if (!summary.totalAset && hasAccountTableBalances && accountTableTotal !== 0) {
    summary.totalAset = accountTableTotal;
    summary.sourceMethod = 'account_table';
    summary.sourceCell = 'Tabel Nama Akun';
  }

  // Fallback 2: If totalAset is still not set, check cashStandbyDanaDarurat + totalInvestment
  if (!summary.totalAset && (summary.cashStandbyDanaDarurat || summary.totalInvestment)) {
    const combined = (summary.cashStandbyDanaDarurat || 0) + (summary.totalInvestment || 0);
    if (combined !== 0) {
      summary.totalAset = combined;
      summary.sourceMethod = 'component_sum';
      summary.sourceCell = 'Kas + Investasi';
    }
  }

  // Reconcile components if totalAset is known from cell anchor: ensure Kas + Investasi = Total Aset
  if (summary.totalAset && summary.totalAset !== 0) {
    if (summary.cashStandbyDanaDarurat !== undefined && summary.totalInvestment === undefined) {
      summary.totalInvestment = Math.max(0, summary.totalAset - summary.cashStandbyDanaDarurat);
    } else if (summary.totalInvestment !== undefined && summary.cashStandbyDanaDarurat === undefined) {
      summary.cashStandbyDanaDarurat = summary.totalAset - summary.totalInvestment;
    } else if (summary.cashStandbyDanaDarurat === undefined && summary.totalInvestment === undefined) {
      summary.cashStandbyDanaDarurat = summary.totalAset;
      summary.totalInvestment = 0;
    }
  }

  // Determine if this month tab has real financial activity (to filter out empty future template tabs)
  const hasRealTx = transactions.some((t) => (Number(t.jumlah) || 0) !== 0);
  const hasRealAset = Boolean(summary.totalAset && summary.totalAset !== 0);
  summary.hasRealActivity = hasRealAset || hasRealTx || hasAccountTableBalances;

  return { transactions, summary };
}

/**
 * Batch fetches multiple month tabs in a single Google Sheets API call (`values:batchGet`)
 * using `valueRenderOption=UNFORMATTED_VALUE` so formula cells return exact raw numbers
 * with zero locale/formatting ambiguity.
 */
export async function batchFetchAllMonthTabs(
  spreadsheetId: string,
  tabTitles: string[],
  accessToken: string
): Promise<Record<string, { transactions: Transaction[]; summary: SheetSummary }>> {
  const result: Record<string, { transactions: Transaction[]; summary: SheetSummary }> = {};
  if (!spreadsheetId || !accessToken || !Array.isArray(tabTitles) || tabTitles.length === 0) {
    return result;
  }

  // Filter out non-month utility tabs like INVESTMENT / INVESTING
  const monthTabs = tabTitles.filter((t) => {
    const up = (t || '').trim().toUpperCase();
    return up && up !== 'INVESTMENT' && up !== 'INVESTING' && up !== 'PREVIEW';
  });

  if (monthTabs.length === 0) return result;

  try {
    const queryParams = monthTabs
      .map((tab) => `ranges=${encodeURIComponent(formatSheetRange(tab, 'A1:N100'))}`)
      .join('&');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?valueRenderOption=UNFORMATTED_VALUE&${queryParams}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      return result;
    }

    const data = await res.json();
    const valueRanges: Array<{ range?: string; values?: any[][] }> = data.valueRanges || [];

    valueRanges.forEach((vr, idx) => {
      const tabName = monthTabs[idx];
      if (!tabName) return;
      const rows = (vr.values || []) as string[][];
      const parsed = parseSheetGridData(rows, tabName);
      result[tabName] = parsed;
    });
  } catch (err) {
    console.warn('batchFetchAllMonthTabs error:', err);
  }

  return result;
}

/**
 * Fetches sheet metadata to determine sheet names and titles.
 */
export async function getSpreadsheetDetails(spreadsheetId: string, accessToken: string) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal membaca informasi spreadsheet (HTTP ${res.status})`);
  }
  return await res.json();
}

/**
 * Reads range values from Google Sheets using `UNFORMATTED_VALUE` for exact numeric precision.
 */
export async function fetchSheetValues(spreadsheetId: string, range: string, accessToken: string): Promise<string[][]> {
  const encodedRange = encodeURIComponent(range);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueRenderOption=UNFORMATTED_VALUE`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal mengambil data dari Google Sheets (HTTP ${res.status})`);
  }
  const data = await res.json();
  return data.values || [];
}

/**
 * Formats a sheet name and range into a safe Google Sheets A1 notation string with single quotes.
 */
export function formatSheetRange(sheetName: string, cellRange: string): string {
  const clean = sheetName.replace(/'/g, "''");
  return `'${clean}'!${cellRange}`;
}

/**
 * Appends a transaction row to Google Sheets.
 * Uses smart row detection to insert into the first empty row of the table (A1:B100),
 * avoiding blank gap jumps or formulas in adjacent columns, then falls back to append API.
 */
export async function appendRowToSheet(
  spreadsheetId: string,
  sheetName: string,
  tx: Omit<Transaction, 'id'>,
  accessToken: string
): Promise<{ rowIndex?: number; rawResponse: any }> {
  // Normalize month into Title Case (e.g. "September") so Google Sheet dropdown matches exact string
  const normalizedMonth = normalizeMonthTitleCase(tx.bulan || sheetName);
  // CRITICAL: Send raw number for numeric amount column, NEVER formatted string "Rp 126.090"
  const numericJumlah = Math.round(Number(tx.jumlah) || 0);
  const rowValues = [[normalizedMonth, tx.kategori, tx.akun, tx.tipe, numericJumlah, tx.catatan || '']];

  // Try last-populated row detection: scan A1:F200 to find the last filled row
  // This ensures we NEVER overwrite black/empty divider rows (like row 11 or 23),
  // placing new records immediately below the last record (e.g. below row 42 "NGEDATE SAMA SHAREEN")
  try {
    const existingRows = await fetchSheetValues(
      spreadsheetId,
      formatSheetRange(sheetName, 'A1:F200'),
      accessToken
    );

    if (existingRows && existingRows.length > 0) {
      let lastPopulatedRow = 1; // Default after header row

      for (let i = 1; i < existingRows.length; i++) {
        const row = existingRows[i];
        if (!row || row.length === 0) continue;

        const col1 = (row[1] || '').toString().trim(); // Kategori
        const col2 = (row[2] || '').toString().trim(); // Akun
        const col3 = (row[3] || '').toString().trim(); // Tipe
        const col4 = (row[4] || '').toString().trim(); // Jumlah
        const col5 = (row[5] || '').toString().trim(); // Catatan

        const isHeader =
          col1.toLowerCase() === 'kategori' ||
          col2.toLowerCase() === 'akun' ||
          col3.toLowerCase() === 'tipe';

        if (isHeader) continue;

        // A row is considered populated if it has a Category or Note or Non-zero Amount or Account
        const hasRealData =
          Boolean(col1 && col1 !== '-') ||
          Boolean(col5 && col5 !== '-') ||
          (Boolean(col4) && parseCurrencyToNumber(col4) !== 0) ||
          (Boolean(col2) && Boolean(col3));

        if (hasRealData) {
          lastPopulatedRow = Math.max(lastPopulatedRow, i + 1); // 1-indexed row number
        }
      }

      // Target row is placed immediately below the last populated row!
      const targetRow = lastPopulatedRow + 1;

      if (targetRow >= 2) {
        const updateRes = await updateRowInSheet(
          spreadsheetId,
          sheetName,
          targetRow,
          {
            ...tx,
            bulan: normalizedMonth
          } as any,
          accessToken
        );
        return { rowIndex: targetRow, rawResponse: updateRes };
      }
    }
  } catch (e) {
    console.warn('Smart last-row detection fallback to append endpoint:', e);
  }

  // Fallback: standard Google Sheets append endpoint
  const range = encodeURIComponent(formatSheetRange(sheetName, 'A:F'));
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
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
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Gagal menambahkan baris ke Google Sheets');
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

  return { rowIndex, rawResponse: resJson };
}

/**
 * Updates a specific row in Google Sheets.
 */
export async function updateRowInSheet(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  tx: Transaction,
  accessToken: string
) {
  // CRITICAL: Send raw number for numeric amount column, NEVER "Rp 126.090"
  const numericJumlah = Math.round(Number(tx.jumlah) || 0);
  const normalizedMonth = normalizeMonthTitleCase(tx.bulan || sheetName);
  const rowValues = [[normalizedMonth, tx.kategori, tx.akun, tx.tipe, numericJumlah, tx.catatan || '']];
  const range = encodeURIComponent(formatSheetRange(sheetName, `A${rowIndex}:F${rowIndex}`));

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
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
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Gagal memperbarui baris di Google Sheets');
  }
  return await res.json();
}

/**
 * Clears/Empties a row in Google Sheets when deleting.
 */
export async function clearRowInSheet(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  accessToken: string
) {
  const range = encodeURIComponent(formatSheetRange(sheetName, `A${rowIndex}:F${rowIndex}`));
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Gagal menghapus baris dari Google Sheets');
  }
  return await res.json();
}

/**
 * Executes a batch update to Google Sheets cells.
 */
export async function batchUpdateSheetValues(
  spreadsheetId: string,
  data: Array<{ range: string; values: any[][] }>,
  accessToken: string
) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data
      })
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal batch update Google Sheets');
  }
  return await res.json();
}


/**
 * Creates a brand new Google Spreadsheet with the exact template headers & formatting.
 */
export async function createNewProjectSpreadsheet(
  title: string,
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; sheetName: string }> {
  const payload = {
    properties: {
      title: title || 'Financial Tracker - Mutasi & Cashflow'
    },
    sheets: [
      {
        properties: {
          title: 'Sheet1',
          gridProperties: {
            frozenRowCount: 1
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Bulan' } },
                  { userEnteredValue: { stringValue: 'Kategori' } },
                  { userEnteredValue: { stringValue: 'Akun' } },
                  { userEnteredValue: { stringValue: 'Tipe' } },
                  { userEnteredValue: { stringValue: 'Jumlah' } },
                  { userEnteredValue: { stringValue: 'Catatan' } }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal membuat spreadsheet baru (HTTP ${res.status})`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
    sheetName: 'Sheet1'
  };
}

/**
 * Lists user spreadsheets from Google Drive to allow 1-click project selection.
 */
export async function listUserSpreadsheets(
  accessToken: string
): Promise<Array<{ id: string; name: string; modifiedTime?: string; webViewLink?: string }>> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const fields = encodeURIComponent('files(id, name, modifiedTime, webViewLink)');
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=20&fields=${fields}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal mengambil daftar file spreadsheet (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Searches user Google Drive for a spreadsheet matching a name (e.g. 'INVESTMENT').
 */
export async function findSpreadsheetByName(
  namePattern: string,
  accessToken: string
): Promise<{ id: string; name: string; webViewLink?: string } | null> {
  try {
    const files = await listUserSpreadsheets(accessToken);
    if (!files || files.length === 0) return null;
    const target = namePattern.toUpperCase().trim();
    // 1. Exact match
    const exact = files.find((f) => f.name.toUpperCase().trim() === target);
    if (exact) return exact;
    // 2. Contains match
    const contains = files.find((f) => f.name.toUpperCase().includes(target));
    if (contains) return contains;
    return null;
  } catch (err) {
    console.warn('findSpreadsheetByName failed:', err);
    return null;
  }
}

/**
 * Retrieves all sheet/tab titles from a Google Spreadsheet.
 */
export async function getSpreadsheetSheetTitles(
  spreadsheetId: string,
  accessToken: string
): Promise<string[]> {
  try {
    const details = await getSpreadsheetDetails(spreadsheetId, accessToken);
    if (details && details.sheets && Array.isArray(details.sheets)) {
      return details.sheets
        .map((s: any) => s.properties?.title)
        .filter((title: any) => typeof title === 'string' && title.trim().length > 0);
    }
    return [];
  } catch (err) {
    console.warn('Failed to get sheet titles from spreadsheet details:', err);
    return [];
  }
}

/**
 * Updates a single cell or small range directly in Google Sheets.
 */
export async function updateCellInSheet(
  spreadsheetId: string,
  sheetName: string,
  cellA1: string,
  value: string | number,
  accessToken: string
) {
  const range = encodeURIComponent(formatSheetRange(sheetName, cellA1));
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [[value]] })
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal memperbarui sel ${cellA1}`);
  }
  return await res.json();
}

/**
 * Synchronizes account/wallet rename across Google Sheets transaction rows and account tables.
 */
export async function syncRenameAccountInSheet(
  spreadsheetId: string,
  sheetName: string,
  oldAccountName: string,
  newAccountName: string,
  accessToken: string
): Promise<number> {
  let updatedCount = 0;
  const targetOld = oldAccountName.trim().toLowerCase();
  const newName = newAccountName.trim();

  // 1. Scan transactions A1:F200
  try {
    const rows = await fetchSheetValues(spreadsheetId, formatSheetRange(sheetName, 'A1:F200'), accessToken);
    if (rows && rows.length > 0) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 3) continue;
        const currentAcc = (row[2] || '').toString().trim().toLowerCase();
        if (currentAcc === targetOld) {
          const rowNumber = i + 1;
          await updateCellInSheet(spreadsheetId, sheetName, `C${rowNumber}`, newName, accessToken);
          updatedCount++;
        }
      }
    }
  } catch (e) {
    console.warn('Error syncing renamed account in transactions column C:', e);
  }

  // 2. Also scan summary/account columns H1:N50
  try {
    const sideGrid = await fetchSheetValues(spreadsheetId, formatSheetRange(sheetName, 'H1:N50'), accessToken);
    if (sideGrid && sideGrid.length > 0) {
      const colLetters = ['H', 'I', 'J', 'K', 'L', 'M', 'N'];
      for (let r = 0; r < sideGrid.length; r++) {
        const row = sideGrid[r];
        if (!row) continue;
        for (let c = 0; c < row.length; c++) {
          const cellVal = (row[c] || '').toString().trim().toLowerCase();
          if (cellVal === targetOld) {
            const cellRef = `${colLetters[c]}${r + 1}`;
            await updateCellInSheet(spreadsheetId, sheetName, cellRef, newName, accessToken);
            updatedCount++;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error checking side accounts grid during rename:', e);
  }

  return updatedCount;
}

/**
 * Adds a new wallet/account to Google Sheets with its initial balance row.
 */
export async function syncAddAccountToSheet(
  spreadsheetId: string,
  sheetName: string,
  accountName: string,
  initialBalance: number = 0,
  accessToken: string
) {
  const newTx: Omit<Transaction, 'id'> = {
    bulan: sheetName,
    kategori: 'Saldo Awal',
    akun: accountName.trim(),
    tipe: 'Saldo Bulan Lalu',
    jumlah: Math.round(Number(initialBalance) || 0),
    catatan: `Saldo Awal Rekening ${accountName.trim()}`
  };

  return await appendRowToSheet(spreadsheetId, sheetName, newTx, accessToken);
}

/**
 * Synchronizes new or updated investment asset to Google Sheets.
 */
export async function syncAssetToSheet(
  spreadsheetId: string,
  sheetName: string,
  oldAssetName: string,
  updatedAsset: { nama: string; nilaiAkhirBulan: number; depositWd?: number; alokasiPercent?: number; warna?: string },
  accessToken: string
): Promise<{ updated: boolean; rowIndex?: number }> {
  const targetOld = oldAssetName.trim().toLowerCase();
  const safeName = updatedAsset.nama.trim();
  const safeAmount = Math.round(Number(updatedAsset.nilaiAkhirBulan) || 0);

  // 1. Look for existing row in A1:F200
  try {
    const rows = await fetchSheetValues(spreadsheetId, formatSheetRange(sheetName, 'A1:F200'), accessToken);
    if (rows && rows.length > 0) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        const colKat = (row[1] || '').toString().trim().toLowerCase();
        const colAcc = (row[2] || '').toString().trim().toLowerCase();
        const colNote = (row[5] || '').toString().trim().toLowerCase();

        const isMatch =
          colAcc === targetOld ||
          (colKat.includes('investasi') && (colAcc === targetOld || colNote.includes(targetOld)));

        if (isMatch) {
          const rowNumber = i + 1;
          await updateCellInSheet(spreadsheetId, sheetName, `C${rowNumber}`, safeName, accessToken);
          await updateCellInSheet(spreadsheetId, sheetName, `E${rowNumber}`, safeAmount, accessToken);
          return { updated: true, rowIndex: rowNumber };
        }
      }
    }
  } catch (e) {
    console.warn('Error searching for existing investment row:', e);
  }

  // 2. If not found in rows, append as a new investment row so Google Sheet holds this asset!
  const newTx: Omit<Transaction, 'id'> = {
    bulan: sheetName,
    kategori: 'Investasi',
    akun: safeName,
    tipe: 'Saldo Bulan Lalu',
    jumlah: safeAmount,
    catatan: `Aset Investasi: ${safeName}`
  };

  const appendRes = await appendRowToSheet(spreadsheetId, sheetName, newTx, accessToken);
  return { updated: true, rowIndex: appendRes?.rowIndex };
}

/**
 * Synchronizes budget category title/target/saldo edits to Google Sheets bi-directionally.
 * Finds the corresponding cell in the "Jenis Budgeting" table (or A1:N100 grid) and updates it.
 */
export async function syncBudgetToSheet(
  spreadsheetId: string,
  sheetName: string,
  oldBudgetName: string,
  newBudgetName: string,
  newTarget?: number,
  knownCell?: string,
  accessToken?: string
): Promise<{ success: boolean; cell?: string }> {
  if (!accessToken) return { success: false };

  const targetOld = oldBudgetName.trim().toLowerCase();
  const safeNewName = newBudgetName.trim();

  // If knownCell is provided, try updating it first
  if (knownCell) {
    try {
      await updateCellInSheet(spreadsheetId, sheetName, knownCell, safeNewName, accessToken);
      return { success: true, cell: knownCell };
    } catch (e) {
      console.warn(`Known cell update at ${knownCell} failed, falling back to grid search:`, e);
    }
  }

  // Scan A1:N100 grid to locate the budget category title cell
  try {
    const grid = await fetchSheetValues(spreadsheetId, formatSheetRange(sheetName, 'A1:N100'), accessToken);
    if (grid && grid.length > 0) {
      for (let r = 0; r < grid.length; r++) {
        const row = grid[r];
        if (!row) continue;
        for (let c = 0; c < row.length; c++) {
          const val = (row[c] || '').toString().trim().toLowerCase();
          if (
            val === targetOld ||
            (targetOld.includes('dating') && val.includes('dating')) ||
            (targetOld.includes('listrik') && val.includes('listrik')) ||
            (targetOld.includes('entertainment') && val.includes('entertainment')) ||
            (targetOld.includes('transport') && val.includes('transport'))
          ) {
            const colLetter = colIndexToA1(c);
            const cellA1 = `${colLetter}${r + 1}`;
            await updateCellInSheet(spreadsheetId, sheetName, cellA1, safeNewName, accessToken);

            // If newTarget provided, update target in the next column
            if (newTarget !== undefined && newTarget > 0) {
              const targetColLetter = colIndexToA1(c + 1);
              const targetCellA1 = `${targetColLetter}${r + 1}`;
              await updateCellInSheet(spreadsheetId, sheetName, targetCellA1, Math.round(newTarget), accessToken).catch(() => {});
            }

            return { success: true, cell: cellA1 };
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error syncing budget title to Google Sheet:', err);
  }

  return { success: false };
}

