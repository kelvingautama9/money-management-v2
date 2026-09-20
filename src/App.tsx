import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_INVESTMENT_ASSETS,
  INITIAL_INVESTMENT_HISTORY,
  DEFAULT_GLASS_SETTINGS
} from './data/initialData';
import {
  Transaction,
  BudgetCategory,
  AccountBalance,
  EmergencyFund,
  InvestmentAsset,
  InvestmentHistory,
  GlassSettings,
  SheetSummary,
  ThemeMode
} from './types';
import { motion, AnimatePresence } from 'motion/react';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setCachedAccessToken,
  getPersistedUser,
  savePersistedUser,
  PersistedUser
} from './lib/firebase';
import {
  extractSpreadsheetId,
  fetchSheetValues,
  appendRowToSheet,
  updateRowInSheet,
  clearRowInSheet,
  parseCurrencyToNumber,
  formatRupiah,
  getSpreadsheetSheetTitles,
  formatSheetRange,
  parseSheetGridData,
  syncRenameAccountInSheet,
  syncAddAccountToSheet,
  syncAssetToSheet
} from './lib/sheetsApi';
import { triggerHaptic } from './lib/haptics';

// Components
import { LoginPage } from './components/LoginPage';
import { SyncStatusHeaderBadge } from './components/SyncStatusHeaderBadge';
import { NavigationTabBar, ActivePage } from './components/NavigationTabBar';
import { LiquidSidebar } from './components/LiquidSidebar';
import { LiquidHeader } from './components/LiquidHeader';
import { GoogleSheetMonthTabBar } from './components/GoogleSheetMonthTabBar';
import { CashflowInputPage } from './components/CashflowInputPage';
import { AccountsPage } from './components/AccountsPage';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { BudgetingTracker } from './components/BudgetingTracker';
import { EmergencyFundCard } from './components/EmergencyFundCard';
import { InvestmentPortfolio } from './components/InvestmentPortfolio';
import { AccountBalancesCard } from './components/AccountBalancesCard';
import { TransactionManager } from './components/TransactionManager';
import { GlassSettingsModal } from './components/GlassSettingsModal';
import { AutomatedReportModal } from './components/AutomatedReportModal';
import { SmartAnalysisModal } from './components/SmartAnalysisModal';
import { GlassMenuPopup } from './components/GlassMenuPopup';
import { GlassButton } from './components/GlassButton';
import { ProjectSyncManagerModal } from './components/ProjectSyncManagerModal';
import { RetirementInvestmentCalculator } from './components/RetirementInvestmentCalculator';
import {
  DEFAULT_MONTH_SHEETS,
  INITIAL_TRANSACTIONS_BY_MONTH,
  INITIAL_TRANSACTIONS_AGUSTUS,
  INITIAL_SUMMARY_BY_MONTH
} from './data/initialData';

// Icons
import {
  Sliders,
  FileText,
  Sparkles,
  ShieldCheck,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Layers,
  PieChart,
  RefreshCw,
  Menu,
  LogOut
} from 'lucide-react';

export default function App() {
  // --- Glass UI State ---
  const [glassSettings, setGlassSettings] = useState<GlassSettings>(() => {
    try {
      const savedTheme = localStorage.getItem('kelvin_financial_theme_mode') as ThemeMode | null;
      if (savedTheme && ['dark', 'light', 'beige', 'midnight'].includes(savedTheme)) {
        return { ...DEFAULT_GLASS_SETTINGS, themeMode: savedTheme };
      }
    } catch (e) {}
    return DEFAULT_GLASS_SETTINGS;
  });
  const [isGlassModalOpen, setIsGlassModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSmartAnalysisOpen, setIsSmartAnalysisOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isMenuPopupOpen, setIsMenuPopupOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);

  // --- Multi-Page Navigation State ---
  const [activePage, setActivePage] = useState<ActivePage>('summary');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kelvin_financial_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('kelvin_financial_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  }, []);

  // --- Auth & Google Sheets State ---
  const [user, setUser] = useState<User | PersistedUser | null>(() => getPersistedUser());
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('kelvin_financial_sheet_id') || '1x_SheetsID_KelvinGautama';
  });
  const [sheetName, setSheetName] = useState<string>(() => {
    return localStorage.getItem('kelvin_financial_sheet_name') || 'SEPTEMBER';
  });
  const [availableSheets, setAvailableSheets] = useState<string[]>(() => {
    const persisted = getPersistedUser();
    if (!persisted || persisted.isDevMode) {
      return [localStorage.getItem('kelvin_financial_sheet_name') || 'SEPTEMBER'];
    }
    try {
      const saved = localStorage.getItem('kelvin_financial_available_sheets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_MONTH_SHEETS;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(() => {
    return getPersistedUser() ? new Date() : null;
  });
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // --- Data State (Zero / Empty when not logged in or in Dev Mode) ---
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const persisted = getPersistedUser();
    if (!persisted || persisted.isDevMode) return [];
    const active = localStorage.getItem('kelvin_financial_sheet_name') || 'SEPTEMBER';
    try {
      const cached = localStorage.getItem(`kelvin_financial_txs_${active}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return (
      INITIAL_TRANSACTIONS_BY_MONTH[active] ||
      INITIAL_TRANSACTIONS_BY_MONTH[active.toUpperCase()] ||
      INITIAL_TRANSACTIONS
    );
  });
  const [assets, setAssets] = useState<InvestmentAsset[]>(() => {
    const persisted = getPersistedUser();
    if (!persisted || persisted.isDevMode) return [];
    try {
      const saved = localStorage.getItem('kelvin_financial_custom_assets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_INVESTMENT_ASSETS;
  });
  const [history, setHistory] = useState<InvestmentHistory[]>(() => {
    const persisted = getPersistedUser();
    if (!persisted || persisted.isDevMode) return [];
    return INITIAL_INVESTMENT_HISTORY;
  });

  const [customBudgets, setCustomBudgets] = useState<BudgetCategory[]>(() => {
    const persisted = getPersistedUser();
    if (!persisted || persisted.isDevMode) {
      return INITIAL_BUDGETS.map((b) => ({
        ...b,
        saldoAwal: 0,
        budgeting: 0,
        targetBulanan: 0,
        actualSpend: 0,
        totalSaldo: 0,
        sisa: 0,
        keterangan: '-'
      }));
    }
    try {
      const saved = localStorage.getItem('kelvin_financial_custom_budgets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_BUDGETS;
  });

  const [customAccountsList, setCustomAccountsList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kelvin_financial_accounts_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      'Bank BCA',
      'Seabank',
      'Blu BCA - Savings',
      'Investasi',
      'Allo Bank',
      'Jago-Transport',
      'Jago-Entertainment',
      'Blu BCA - Date',
      'Cash'
    ];
  });

  // Precalculated summary values from Google Sheets (columns H..N) or monthly defaults
  const [sheetSummaries, setSheetSummaries] = useState<Record<string, SheetSummary>>(() => {
    const persisted = getPersistedUser();
    if (!persisted || persisted.isDevMode) return {};
    try {
      const saved = localStorage.getItem('kelvin_financial_sheet_summaries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return INITIAL_SUMMARY_BY_MONTH as unknown as Record<string, SheetSummary>;
  });

  const isDevMode = (user as any)?.isDevMode === true;
  const isZeroState = !user || isDevMode;

  const activeSummary = useMemo<SheetSummary | undefined>(() => {
    if (isZeroState) return undefined;
    return (
      sheetSummaries[sheetName] ||
      sheetSummaries[sheetName.toUpperCase()] ||
      sheetSummaries[sheetName.toLowerCase()] ||
      (INITIAL_SUMMARY_BY_MONTH as any)[sheetName.toUpperCase()] ||
      (INITIAL_SUMMARY_BY_MONTH as any)[sheetName]
    );
  }, [sheetSummaries, sheetName, isZeroState]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser, token) => {
        setUser(authenticatedUser);
        if (token) {
          setCachedAccessToken(token);
        }
      },
      () => {
        const persisted = getPersistedUser();
        if (!persisted) {
          setUser(null);
          setCachedAccessToken(null);
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // Auto-detect real sheet tabs from connected Google Spreadsheet directly
  const handleRefreshSpreadsheetTabs = useCallback(async (customSpreadsheetId?: string) => {
    const token = await getAccessToken();
    const cleanId = extractSpreadsheetId(customSpreadsheetId || spreadsheetId);
    if (token && cleanId && !cleanId.startsWith('1x_SheetsID')) {
      try {
        setIsSyncing(true);
        const titles = await getSpreadsheetSheetTitles(cleanId, token);
        if (titles && titles.length > 0) {
          // Exactly use titles as named on the Google Sheet without forcing uppercase!
          // Remove non-existent tabs, only show real sheets from the project!
          setAvailableSheets(titles);
          try {
            localStorage.setItem('kelvin_financial_available_sheets', JSON.stringify(titles));
          } catch (e) {}

          // If current sheetName isn't in titles, switch to closest match or the first existing tab
          const exactMatch = titles.find((t) => t === sheetName);
          if (!exactMatch) {
            const caseMatch = titles.find((t) => t.toLowerCase() === sheetName.toLowerCase());
            const target = caseMatch || titles[0];
            if (target) {
              setSheetName(target);
              try {
                localStorage.setItem('kelvin_financial_sheet_name', target);
              } catch (e) {}
            }
          }
          setSyncNotice(`Tab Google Sheet terdeteksi (${titles.length} tab): ${titles.join(', ')}`);
        }
      } catch (e: any) {
        console.warn('Tab sheets discovery error:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [spreadsheetId, sheetName]);

  useEffect(() => {
    if (user) {
      handleRefreshSpreadsheetTabs();
    }
  }, [user, handleRefreshSpreadsheetTabs]);

  // Update CSS variables & theme classes whenever glassSettings changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--glass-blur', `${glassSettings.blur}px`);
    root.style.setProperty('--glass-opacity', `${glassSettings.translucency / 100}`);
    root.style.setProperty('--glass-dark-tint', `${glassSettings.darkTint / 100}`);
    root.style.setProperty('--glass-specular', `${glassSettings.specularIntensity / 100}`);

    const theme = glassSettings.themeMode || 'dark';
    const isDark = theme === 'dark' || theme === 'midnight';

    root.classList.remove('theme-dark', 'theme-light', 'theme-beige', 'theme-midnight', 'dark');
    root.classList.add(`theme-${theme}`);
    if (isDark) {
      root.classList.add('dark');
    }

    document.body.classList.remove('theme-dark', 'theme-light', 'theme-beige', 'theme-midnight', 'dark');
    document.body.classList.add(`theme-${theme}`);
    if (isDark) {
      document.body.classList.add('dark');
    }
    try {
      localStorage.setItem('kelvin_financial_theme_mode', theme);
    } catch (e) {}
  }, [glassSettings]);

  const handleToggleTheme = () => {
    const themeOrder: ThemeMode[] = ['dark', 'light', 'beige', 'midnight'];
    const current = glassSettings.themeMode || 'dark';
    const nextIdx = (themeOrder.indexOf(current) + 1) % themeOrder.length;
    const nextTheme = themeOrder[nextIdx];
    setGlassSettings(prev => ({ ...prev, themeMode: nextTheme }));
  };

  const handleSelectTheme = (mode: ThemeMode) => {
    setGlassSettings(prev => ({ ...prev, themeMode: mode }));
  };

  // --- Financial Computations Engine (Guaranteed 0 / - when logged out or in Dev Mode) ---
  // 1. Total Income
  const totalPemasukan = useMemo(() => {
    if (isZeroState) return 0;
    return transactions
      .filter((t) => t.tipe === 'Income')
      .reduce((sum, t) => sum + t.jumlah, 0);
  }, [transactions, isZeroState]);

  // 2. Total Direct Expenses (pengeluaran murni non-transfer)
  const totalPengeluaran = useMemo(() => {
    if (isZeroState) return 0;
    return transactions
      .filter((t) => t.tipe === 'Expense')
      .reduce((sum, t) => sum + t.jumlah, 0);
  }, [transactions, isZeroState]);

  // 3. Dynamic Budget Status Calculation
  const budgets: BudgetCategory[] = useMemo(() => {
    if (isZeroState) {
      return customBudgets.map((initBudget) => ({
        ...initBudget,
        actualSpend: 0,
        totalSaldo: 0,
        sisa: 0,
        keterangan: '-'
      }));
    }
    return customBudgets.map((initBudget) => {
      const budgetLower = initBudget.nama.toLowerCase();
      const relevantSpend = transactions
        .filter((t) => {
          const catLower = t.kategori.toLowerCase();
          return (
            (catLower === budgetLower ||
              (catLower.includes('listrik') && budgetLower.includes('listrik')) ||
              (catLower.includes('entertainment') && budgetLower.includes('entertainment')) ||
              (catLower.includes('transport') && budgetLower.includes('transport')) ||
              (catLower.includes('dating') && budgetLower.includes('dating'))) &&
            t.tipe === 'Expense'
          );
        })
        .reduce((sum, t) => sum + t.jumlah, 0);

      const totalSaldo = (initBudget.saldoAwal || 0) + (initBudget.budgeting || initBudget.targetBulanan || 0);
      const sisa = Math.max(0, totalSaldo - relevantSpend);

      return {
        ...initBudget,
        actualSpend: relevantSpend,
        totalSaldo,
        sisa,
        keterangan: sisa > 0 ? `Sisa: ${formatRupiah(sisa)}` : 'Anggaran Terserap'
      };
    });
  }, [customBudgets, transactions, isZeroState]);

  // 4. Dynamic Account Balances (Calculated from transactions and Google Sheet summary)
  const accounts: AccountBalance[] = useMemo(() => {
    const accountNames = customAccountsList;
    if (isZeroState) {
      return accountNames.map((accName) => ({
        nama: accName,
        totalSaldo: 0,
        spendBulanIniPercent: 0
      }));
    }

    const defaultBaseBalances: Record<string, number> = {
      'Bank BCA': 8870,
      'Seabank': 3808000,
      'Blu BCA - Savings': 436550,
      'Investasi': 51705076,
      'Allo Bank': 195340,
      'Jago-Transport': 592885,
      'Jago-Entertainment': 451751,
      'Blu BCA - Date': 0,
      'Cash': 0
    };

    return accountNames.map((accName) => {
      // 1. Flexible lookup in activeSummary.accountBalances
      let sheetBalance: number | undefined = undefined;
      if (activeSummary?.accountBalances) {
        const balances = activeSummary.accountBalances;
        if (typeof balances[accName] === 'number') {
          sheetBalance = balances[accName];
        } else {
          const cleanAcc = accName.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const [k, v] of Object.entries(balances)) {
            const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (
              cleanK === cleanAcc ||
              (cleanAcc.includes('bca') && cleanK.includes('bca') && !cleanAcc.includes('blu') && !cleanK.includes('blu')) ||
              (cleanAcc.includes('seabank') && cleanK.includes('seabank')) ||
              (cleanAcc.includes('investasi') && cleanK.includes('investasi')) ||
              (cleanAcc.includes('allo') && cleanK.includes('allo')) ||
              (cleanAcc.includes('transport') && cleanK.includes('transport')) ||
              (cleanAcc.includes('entertainment') && cleanK.includes('entertainment')) ||
              (cleanAcc.includes('date') && cleanK.includes('date')) ||
              (cleanAcc.includes('cash') && cleanK.includes('cash'))
            ) {
              if (typeof v === 'number') {
                sheetBalance = v;
                break;
              }
            }
          }
        }
      }

      if (sheetBalance !== undefined) {
        const totalSaldo = sheetBalance; // CAN BE NEGATIVE (e.g. BCA minus 1 juta lebih)
        const accExpenses = transactions
          .filter((t) => t.akun.toLowerCase().includes(accName.toLowerCase()) && t.tipe === 'Expense')
          .reduce((sum, t) => sum + t.jumlah, 0);
        const spendPercent =
          totalSaldo > 0 && accExpenses > 0
            ? Number(((accExpenses / (totalSaldo + accExpenses)) * 100).toFixed(1))
            : 0;
        return {
          nama: accName,
          totalSaldo,
          spendBulanIniPercent: spendPercent
        };
      }

      // 2. Otherwise calculate dynamically from month transactions
      const startingRow = transactions.find(
        (t) =>
          t.akun.toLowerCase() === accName.toLowerCase() &&
          (t.tipe === 'Saldo Bulan Lalu' || t.kategori.toLowerCase().includes('saldo awal'))
      );
      const startingBalance = startingRow ? startingRow.jumlah : 0;

      const accIncome = transactions
        .filter((t) => t.akun.toLowerCase() === accName.toLowerCase() && t.tipe === 'Income')
        .reduce((sum, t) => sum + t.jumlah, 0);

      const accTransfersIn = transactions
        .filter((t) => t.akun.toLowerCase() === accName.toLowerCase() && t.tipe === 'Transfer Masuk')
        .reduce((sum, t) => sum + t.jumlah, 0);

      const accTransfersOut = transactions
        .filter((t) => t.akun.toLowerCase() === accName.toLowerCase() && t.tipe === 'Transfer Keluar')
        .reduce((sum, t) => sum + t.jumlah, 0);

      const accExpenses = transactions
        .filter((t) => t.akun.toLowerCase() === accName.toLowerCase() && t.tipe === 'Expense')
        .reduce((sum, t) => sum + t.jumlah, 0);

      let totalSaldo = startingBalance + accIncome + accTransfersIn - accTransfersOut - accExpenses;

      // Fallback if no transactions recorded for this account in this month
      if (
        !startingRow &&
        accIncome === 0 &&
        accTransfersIn === 0 &&
        accTransfersOut === 0 &&
        accExpenses === 0
      ) {
        if (sheetName.toUpperCase() === 'SEPTEMBER') {
          totalSaldo = defaultBaseBalances[accName] ?? 0;
        } else if (accName === 'Investasi' && (activeSummary as any)?.totalInvestment) {
          totalSaldo = (activeSummary as any).totalInvestment;
        } else if (accName === 'Seabank') {
          totalSaldo = (activeSummary as any)?.cashStandby
            ? Math.round((activeSummary as any).cashStandby * 0.8)
            : 3000000;
        } else if (accName === 'Blu BCA - Savings') {
          totalSaldo = 350000;
        } else {
          totalSaldo = 0;
        }
      }

      const totalInflow = startingBalance + accIncome + accTransfersIn;
      const spendPercent =
        totalInflow > 0 && accExpenses > 0
          ? Number(((accExpenses / totalInflow) * 100).toFixed(1))
          : 0;

      return {
        nama: accName,
        totalSaldo, // CRITICAL: Preserve negative balance, do NOT force Math.max(0)
        spendBulanIniPercent: spendPercent
      };
    });
  }, [transactions, activeSummary, sheetName, user, customAccountsList]);

  // 5. Emergency Fund Metrics (derived from active month summary or accounts)
  const emergencyFund: EmergencyFund = useMemo(() => {
    if (isZeroState) {
      return {
        current: 0,
        target: 12000000,
        kekurangan: -12000000,
        persentase: 0
      };
    }
    if (activeSummary?.emergencyFund && activeSummary.emergencyFund.current) {
      const curr = activeSummary.emergencyFund.current;
      const tgt = activeSummary.emergencyFund.target || 12000000;
      return {
        current: curr,
        target: tgt,
        kekurangan: curr - tgt,
        persentase: Number(((curr / tgt) * 100).toFixed(1))
      };
    }
    const bluAcc = accounts.find((a) => a.nama.toLowerCase().includes('blu bca - savings'));
    const bluSavings = bluAcc ? bluAcc.totalSaldo : 436550;
    const target = 12000000;
    return {
      current: bluSavings,
      target,
      kekurangan: bluSavings - target,
      persentase: Number(((bluSavings / target) * 100).toFixed(1))
    };
  }, [activeSummary, accounts, isZeroState]);

  // 6. Aggregate Net Worth & Cash Standby (Synchronized across Summary and Accounts)
  // Total of all non-investment liquid accounts (Cash, Bank BCA, Seabank, Blu, Allo, Jago)
  const cashStandbyDanaDarurat = useMemo(() => {
    if (isZeroState) return 0;
    if (activeSummary?.cashStandbyDanaDarurat && activeSummary.cashStandbyDanaDarurat !== 0) {
      return activeSummary.cashStandbyDanaDarurat;
    }
    if ((activeSummary as any)?.cashStandby && (activeSummary as any).cashStandby !== 0) {
      return (activeSummary as any).cashStandby;
    }
    const monthKey = sheetName.toUpperCase();
    const fallbackSummary = (INITIAL_SUMMARY_BY_MONTH as any)[monthKey] || (INITIAL_SUMMARY_BY_MONTH as any)[sheetName];
    if (fallbackSummary?.cashStandby) {
      return fallbackSummary.cashStandby;
    }
    return accounts
      .filter((acc) => !acc.nama.toLowerCase().includes('investasi'))
      .reduce((sum, acc) => sum + acc.totalSaldo, 0);
  }, [accounts, activeSummary, sheetName, isZeroState]);

  // Current investment portfolio value from active summary or account
  const totalInvestment = useMemo(() => {
    if (isZeroState) return 0;
    if (activeSummary?.totalInvestment && activeSummary.totalInvestment > 0) {
      return activeSummary.totalInvestment;
    }
    const monthKey = sheetName.toUpperCase();
    const fallbackSummary = (INITIAL_SUMMARY_BY_MONTH as any)[monthKey] || (INITIAL_SUMMARY_BY_MONTH as any)[sheetName];
    if (fallbackSummary?.totalInvestment) {
      return fallbackSummary.totalInvestment;
    }
    const historyItem = history.find(
      (h) => h.bulan.toLowerCase().includes(sheetName.toLowerCase()) || sheetName.toLowerCase().includes(h.bulan.toLowerCase())
    );
    if (historyItem) {
      const invTotal = (historyItem.pluang || 0) + (historyItem.valasBca || 0) + (historyItem.usdtBinance || 0);
      if (invTotal > 0) return invTotal;
    }
    const investAcc = accounts.find((acc) => acc.nama.toLowerCase().includes('investasi'));
    if (investAcc && investAcc.totalSaldo > 0) {
      return investAcc.totalSaldo;
    }
    const fromAssets = assets.reduce((sum, a) => sum + a.nilaiAkhirBulan, 0);
    return fromAssets > 0 ? fromAssets : 51705076;
  }, [accounts, activeSummary, sheetName, history, assets, isZeroState]);

  // Total Net Worth (Kekayaan Bersih): Sum of all accounts and investments, reacts directly to selected tab
  const totalAset = useMemo(() => {
    if (isZeroState) return 0;
    if (activeSummary?.totalAset && typeof activeSummary.totalAset === 'number' && activeSummary.totalAset !== 0) {
      return activeSummary.totalAset;
    }
    // Check predefined summary for the selected month
    const monthKey = sheetName.toUpperCase();
    const fallbackSummary = (INITIAL_SUMMARY_BY_MONTH as any)[monthKey] || (INITIAL_SUMMARY_BY_MONTH as any)[sheetName];
    if (fallbackSummary?.totalAset) {
      return fallbackSummary.totalAset;
    }
    // Check investment history net worth for this month
    const historyItem = history.find(
      (h) => h.bulan.toLowerCase().includes(sheetName.toLowerCase()) || sheetName.toLowerCase().includes(h.bulan.toLowerCase())
    );
    if (historyItem?.totalNetWorth) {
      return historyItem.totalNetWorth;
    }
    return cashStandbyDanaDarurat + totalInvestment;
  }, [activeSummary, sheetName, history, cashStandbyDanaDarurat, totalInvestment, isZeroState]);

  const sisaSaldoIncome = totalPemasukan - totalPengeluaran;

  // Format active sheet name for header display (e.g. "Sept 2026" or exact sheetName)
  const formattedSheetMonth = useMemo(() => {
    if (!sheetName) return 'September 2026';
    // If sheetName already contains year digits (e.g. "Sept 2026"), avoid appending 2026 again
    if (/\d{4}/.test(sheetName)) {
      return sheetName;
    }
    return `${sheetName} 2026`;
  }, [sheetName]);

  // --- Handlers for Google Sheets Sync & Auth ---
  const handleGoogleLogin = async () => {
    try {
      setIsSyncing(true);
      setSyncNotice('Menghubungkan ke Google...');
      const res = await googleSignIn();
      if (res) {
        const loggedUser: PersistedUser = {
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
          photoURL: res.user.photoURL,
          isDevMode: false
        };
        setUser(loggedUser);
        savePersistedUser(loggedUser);
        setSyncNotice(`Tersambung sebagai ${res.user.email} dengan akses Google Sheets.`);
        triggerHaptic('success');
        setLastSynced(new Date());

        const token = await getAccessToken();
        const cleanId = extractSpreadsheetId(spreadsheetId);
        if (token && cleanId && !cleanId.startsWith('1x_SheetsID')) {
          try {
            const detected = await getSpreadsheetSheetTitles(cleanId, token);
            if (detected && detected.length > 0) {
              setAvailableSheets(detected);
              try {
                localStorage.setItem('kelvin_financial_available_sheets', JSON.stringify(detected));
              } catch (e) {}
              if (!detected.includes(sheetName)) {
                setSheetName(detected[0]);
              }
            }
          } catch (e) {
            console.warn('Tab discovery on login:', e);
          }
          await handleSyncFromSheets();
        }
      }
    } catch (err: any) {
      console.error('Sign-in failure:', err);
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      setSyncNotice(`Koneksi Google: ${err?.message || 'Silakan coba lagi'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePinVerify = async (pin: string) => {
    if (pin === '0000') {
      const devUser: PersistedUser = {
        uid: 'dev-mode-user',
        email: 'dev@preview.local',
        displayName: 'Developer Mode',
        photoURL: null,
        isDevMode: true
      };
      savePersistedUser(devUser);
      setUser(devUser);
      setTransactions([]);
      setSheetSummaries({});
      setAssets([]);
      setAvailableSheets([sheetName || 'PREVIEW']);
      triggerHaptic('success');
      setLastSynced(new Date());
      setSyncNotice('Mode Developer aktif (Kode 0000): Semua angka diset Rp 0 untuk inspeksi antarmuka.');
      return true;
    }
    return false;
  };

  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setTransactions([]);
    setSheetSummaries({});
    setAssets([]);
    setAvailableSheets([sheetName || 'SEPTEMBER']);
    setLastSynced(null);
    setSyncNotice('Telah keluar dari akun. Semua data tersimpan telah dinolkan untuk privasi.');
    triggerHaptic('medium');
  };

  const handleSaveProjectConfig = (
    newSpreadsheetId: string,
    newSheetName: string,
    detectedSheets?: string[]
  ) => {
    setSpreadsheetId(newSpreadsheetId);
    setSheetName(newSheetName);
    try {
      localStorage.setItem('kelvin_financial_sheet_id', newSpreadsheetId);
      localStorage.setItem('kelvin_financial_sheet_name', newSheetName);
    } catch (e) {
      console.warn('Failed to save spreadsheet config to localStorage:', e);
    }

    if (detectedSheets && detectedSheets.length > 0) {
      setAvailableSheets(detectedSheets);
      try {
        localStorage.setItem('kelvin_financial_available_sheets', JSON.stringify(detectedSheets));
      } catch (e) {}
    }

    setSyncNotice(`Project aktif dialihkan ke ID: ${newSpreadsheetId.slice(0, 8)}... (${newSheetName})`);
  };

  // Helper to load offline/cached data for a given month
  const loadFallbackMonthData = (targetMonth: string) => {
    try {
      const cached = localStorage.getItem(`kelvin_financial_txs_${targetMonth}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTransactions(parsed);
          return;
        }
      }
    } catch (e) {}

    const predefined =
      INITIAL_TRANSACTIONS_BY_MONTH[targetMonth] ||
      INITIAL_TRANSACTIONS_BY_MONTH[targetMonth.toUpperCase()] ||
      INITIAL_TRANSACTIONS_BY_MONTH[targetMonth.toLowerCase()];

    if (predefined) {
      setTransactions(predefined);
    } else {
      setTransactions([
        {
          id: `tx-init-${targetMonth}-1`,
          bulan: targetMonth,
          kategori: 'Salary',
          akun: 'Bank BCA',
          tipe: 'Income',
          jumlah: 5916058,
          catatan: `Gaji MYPAK ${targetMonth}`
        }
      ]);
    }
  };

  // --- Switch Month Sheet (mimicking Google Sheets tab switching) ---
  const handleSelectMonth = async (targetMonth: string) => {
    const cleanTarget = targetMonth.trim();
    if (!cleanTarget) return;

    setSheetName(cleanTarget);
    try {
      localStorage.setItem('kelvin_financial_sheet_name', cleanTarget);
    } catch (e) {}

    const token = await getAccessToken();
    const cleanId = extractSpreadsheetId(spreadsheetId);

    if (token && cleanId && !cleanId.startsWith('1x_SheetsID')) {
      try {
        setIsSyncing(true);
        setSyncNotice(`Menghubungkan ke tab sheet "${cleanTarget}" dari Google Sheets...`);
        // Fetch A1:N100 to capture both transaction records and summary metrics
        const safeRange = formatSheetRange(cleanTarget, 'A1:N100');
        const rows = await fetchSheetValues(cleanId, safeRange, token);
        if (rows && rows.length > 0) {
          const { transactions: parsedRows, summary } = parseSheetGridData(rows, cleanTarget);

          if (parsedRows.length > 0) {
            setTransactions(parsedRows);
            setLastSynced(new Date());
            setSyncNotice(`Berhasil memuat ${parsedRows.length} baris rekapan bulan ${cleanTarget} dari Google Sheets.`);
            try {
              localStorage.setItem(`kelvin_financial_txs_${cleanTarget}`, JSON.stringify(parsedRows));
            } catch (e) {}
          }

          if (
            summary.totalAset ||
            summary.totalInvestment ||
            (summary.accountBalances && Object.keys(summary.accountBalances).length > 0)
          ) {
            setSheetSummaries((prev) => {
              const updated = {
                ...prev,
                [cleanTarget]: summary,
                [cleanTarget.toUpperCase()]: summary,
                [cleanTarget.toLowerCase()]: summary
              };
              try {
                localStorage.setItem('kelvin_financial_sheet_summaries', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }

          if (parsedRows.length > 0 || summary.totalAset) {
            return;
          }
        }

        // When rows are empty or not formatted yet
        setSyncNotice(`Tab sheet "${cleanTarget}" berhasil dibuka (belum ada transaksi). Siap untuk diisi.`);
        loadFallbackMonthData(cleanTarget);
      } catch (err: any) {
        console.warn(`Catatan tab sheet ${cleanTarget}:`, err);
        setSyncNotice(`Tab "${cleanTarget}" dibuka secara lokal. Pastikan nama tab persis sama di Google Sheets.`);
        loadFallbackMonthData(cleanTarget);
      } finally {
        setIsSyncing(false);
      }
    } else {
      loadFallbackMonthData(cleanTarget);
      setSyncNotice(`Beralih ke rekapan bulan ${cleanTarget}. Data tersimpan otomatis dan siap disinkronkan.`);
    }
  };

  const handleAddNewSheet = async (newSheetName: string) => {
    const clean = newSheetName.trim();
    if (!clean) return;

    if (!availableSheets.includes(clean)) {
      const updated = [clean, ...availableSheets];
      setAvailableSheets(updated);
      try {
        localStorage.setItem('kelvin_financial_available_sheets', JSON.stringify(updated));
      } catch (e) {}
    }

    handleSelectMonth(clean);
  };

  // --- Synchronize Active Month from Google Sheets ---
  const handleSyncFromSheets = async (overrideId?: string, overrideSheet?: string) => {
    const activeSpreadsheetId = overrideId || spreadsheetId;
    const activeSheetName = overrideSheet || sheetName;
    const cleanId = extractSpreadsheetId(activeSpreadsheetId);
    if (!cleanId || cleanId.startsWith('1x_SheetsID')) {
      alert('Masukkan link atau ID Google Spreadsheet terlebih dahulu.');
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      alert('Silakan klik "Sign in with Google" untuk mengizinkan akses ke Google Sheets.');
      return;
    }

    try {
      setIsSyncing(true);
      setSyncNotice(`Menarik data live dari tab sheet ${activeSheetName}...`);

      // 1. Fetch remote tab sheet titles to eliminate stale tabs and show all real ones!
      try {
        const remoteTitles = await getSpreadsheetSheetTitles(cleanId, token);
        if (remoteTitles && remoteTitles.length > 0) {
          // CRITICAL: Strictly replace availableSheets with actual tabs from the spreadsheet
          // This eliminates tabs that do not exist in the connected project and displays all real ones
          setAvailableSheets(remoteTitles);
          try {
            localStorage.setItem('kelvin_financial_available_sheets', JSON.stringify(remoteTitles));
          } catch (e) {}

          // If currently selected sheet is not in remote titles, switch to closest match or first tab
          if (!remoteTitles.includes(activeSheetName)) {
            const caseMatch = remoteTitles.find(
              (t) => t.toLowerCase() === activeSheetName.toLowerCase()
            );
            const targetTab = caseMatch || remoteTitles[0];
            setSheetName(targetTab);
            try {
              localStorage.setItem('kelvin_financial_sheet_name', targetTab);
            } catch (e) {}
          }
        }
      } catch (e) {
        console.warn('Could not refresh remote sheet titles:', e);
      }

      // 2. Fetch grid data A1:N100 to capture transactions and summary metrics
      const safeRange = formatSheetRange(activeSheetName, 'A1:N100');
      const rows = await fetchSheetValues(cleanId, safeRange, token);
      if (rows && rows.length > 0) {
        const { transactions: parsedRows, summary } = parseSheetGridData(rows, activeSheetName);

        if (parsedRows.length > 0) {
          setTransactions(parsedRows);
          setLastSynced(new Date());
          try {
            localStorage.setItem(`kelvin_financial_txs_${activeSheetName}`, JSON.stringify(parsedRows));
          } catch (e) {}
        }

        if (
          summary.totalAset ||
          summary.totalInvestment ||
          (summary.accountBalances && Object.keys(summary.accountBalances).length > 0)
        ) {
          setSheetSummaries((prev) => {
            const updated = {
              ...prev,
              [activeSheetName]: summary,
              [activeSheetName.toUpperCase()]: summary,
              [activeSheetName.toLowerCase()]: summary
            };
            try {
              localStorage.setItem('kelvin_financial_sheet_summaries', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }

        if (parsedRows.length > 0) {
          setSyncNotice(`Berhasil menarik ${parsedRows.length} baris transaksi dari sheet ${activeSheetName}!`);
        } else {
          setSyncNotice(`Sheet ${activeSheetName} berhasil terhubung.`);
        }
      } else {
        setSyncNotice(`Lembar Google Sheet tab ${activeSheetName} belum memiliki data.`);
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      alert(`Gagal sinkronisasi Google Sheets tab ${activeSheetName}: ${err?.message || 'Periksa ID dan izin akses'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushAllToSheet = async () => {
    const cleanId = extractSpreadsheetId(spreadsheetId);
    if (!cleanId) {
      alert('Masukkan link atau ID Google Spreadsheet terlebih dahulu.');
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      alert('Silakan klik "Sign in with Google" untuk memberikan izin.');
      return;
    }

    try {
      setIsSyncing(true);
      const newest = transactions[0];
      if (newest) {
        await appendRowToSheet(cleanId, sheetName, newest, token);
      }
      setLastSynced(new Date());
      setSyncNotice(`Transaksi terbaru berhasil ditambahkan ke baris Google Sheets tab ${sheetName}!`);
    } catch (err: any) {
      console.error('Push error:', err);
      alert(`Gagal mengirim data ke Sheets: ${err?.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Add Transaction (with optional auto-sync to Sheets) ---
  const handleAddTransaction = async (newTx: Omit<Transaction, 'id'>, autoSync: boolean = true) => {
    const createdTx: Transaction = {
      ...newTx,
      bulan: newTx.bulan || sheetName,
      id: `tx-${Date.now()}`
    };

    const nextTxs = [createdTx, ...transactions];
    setTransactions(nextTxs);
    try {
      localStorage.setItem(`kelvin_financial_txs_${sheetName}`, JSON.stringify(nextTxs));
    } catch (e) {}

    // Live Google Sheets synchronization
    if (autoSync) {
      const token = await getAccessToken();
      const cleanId = extractSpreadsheetId(spreadsheetId);
      if (token && cleanId) {
        try {
          const appendRes = await appendRowToSheet(cleanId, sheetName, createdTx, token);
          setLastSynced(new Date());
          if (appendRes && appendRes.rowIndex) {
            createdTx.rowIndex = appendRes.rowIndex;
            const updatedTxs = [createdTx, ...transactions];
            setTransactions(updatedTxs);
            try {
              localStorage.setItem(`kelvin_financial_txs_${sheetName}`, JSON.stringify(updatedTxs));
            } catch (e) {}
          }
          setSyncNotice(
            `Transaksi ${formatRupiah(createdTx.jumlah)} [${createdTx.kategori}] berhasil disimpan & otomatis tertambah ke Google Sheets tab ${sheetName} (baris ${appendRes?.rowIndex || 'baru'}).`
          );
        } catch (e: any) {
          console.warn('Google sheets append error:', e);
          setSyncNotice(`Tersimpan lokal di bulan ${sheetName}. Catatan Google Sheet: ${e.message}`);
          throw e;
        }
      }
    }
  };

  // --- Edit Transaction ---
  const handleEditTransaction = async (updatedTx: Transaction) => {
    const nextTxs = transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t));
    setTransactions(nextTxs);
    try {
      localStorage.setItem(`kelvin_financial_txs_${sheetName}`, JSON.stringify(nextTxs));
    } catch (e) {}

    const token = await getAccessToken();
    const cleanId = extractSpreadsheetId(spreadsheetId);
    if (token && cleanId && updatedTx.rowIndex) {
      try {
        await updateRowInSheet(cleanId, sheetName, updatedTx.rowIndex, updatedTx, token);
        setLastSynced(new Date());
        setSyncNotice(`Baris ${updatedTx.rowIndex} di Google Sheets tab ${sheetName} berhasil diperbarui.`);
      } catch (e) {
        console.warn('Failed to update remote row:', e);
      }
    }
  };

  // --- Delete Transaction ---
  const handleDeleteTransaction = async (id: string) => {
    const target = transactions.find((t) => t.id === id);
    const nextTxs = transactions.filter((t) => t.id !== id);
    setTransactions(nextTxs);
    try {
      localStorage.setItem(`kelvin_financial_txs_${sheetName}`, JSON.stringify(nextTxs));
    } catch (e) {}

    const token = await getAccessToken();
    const cleanId = extractSpreadsheetId(spreadsheetId);
    if (token && cleanId && target?.rowIndex) {
      try {
        await clearRowInSheet(cleanId, sheetName, target.rowIndex, token);
        setLastSynced(new Date());
        setSyncNotice(`Baris ${target.rowIndex} di Google Sheets tab ${sheetName} telah dikosongkan.`);
      } catch (e) {
        console.warn('Failed to clear remote row:', e);
      }
    }
  };

  // --- Budget CRUD Handlers ---
  const handleAddBudget = (newBudget: BudgetCategory) => {
    const next = [...customBudgets, newBudget];
    setCustomBudgets(next);
    try {
      localStorage.setItem('kelvin_financial_custom_budgets', JSON.stringify(next));
    } catch (e) {}
    setSyncNotice(`Pos budget "${newBudget.nama}" berhasil ditambahkan.`);
  };

  const handleEditBudget = (id: string, updated: Partial<BudgetCategory>) => {
    const next = customBudgets.map((b) => (b.id === id ? { ...b, ...updated } : b));
    setCustomBudgets(next);
    try {
      localStorage.setItem('kelvin_financial_custom_budgets', JSON.stringify(next));
    } catch (e) {}
    setSyncNotice(`Pos budget berhasil diperbarui.`);
  };

  const handleDeleteBudget = (id: string) => {
    const next = customBudgets.filter((b) => b.id !== id);
    setCustomBudgets(next);
    try {
      localStorage.setItem('kelvin_financial_custom_budgets', JSON.stringify(next));
    } catch (e) {}
    setSyncNotice(`Pos budget telah dihapus.`);
  };

  // --- Asset CRUD Handlers ---
  const handleAddAsset = async (newAsset: InvestmentAsset) => {
    const next = [...assets, newAsset];
    setAssets(next);
    try {
      localStorage.setItem('kelvin_financial_custom_assets', JSON.stringify(next));
    } catch (e) {}
    setSyncNotice(`Aset "${newAsset.nama}" tersimpan lokal di portofolio.`);

    // Live Google Sheets synchronization for investment assets
    const token = await getAccessToken();
    const cleanId = extractSpreadsheetId(spreadsheetId);
    if (token && cleanId && !cleanId.startsWith('1x_SheetsID')) {
      try {
        await syncAssetToSheet(cleanId, sheetName, '', newAsset, token);
        setLastSynced(new Date());
        setSyncNotice(`Aset investasi "${newAsset.nama}" berhasil tersingkron ke Google Sheet tab ${sheetName}.`);
      } catch (err: any) {
        console.warn('Gagal sinkron aset baru ke Google Sheets:', err);
      }
    }
  };

  const handleEditAsset = async (oldName: string, updatedAsset: InvestmentAsset) => {
    const next = assets.map((a) => (a.nama === oldName ? updatedAsset : a));
    setAssets(next);
    try {
      localStorage.setItem('kelvin_financial_custom_assets', JSON.stringify(next));
    } catch (e) {}

    // Update transactions matching old asset name
    if (oldName !== updatedAsset.nama) {
      setTransactions((prev) => {
        const updatedTxs = prev.map((t) => (t.akun === oldName ? { ...t, akun: updatedAsset.nama } : t));
        try {
          localStorage.setItem(`kelvin_financial_txs_${sheetName}`, JSON.stringify(updatedTxs));
        } catch (e) {}
        return updatedTxs;
      });
    }

    setSyncNotice(`Aset "${updatedAsset.nama}" berhasil diperbarui.`);

    // Live Google Sheets synchronization for asset update
    const token = await getAccessToken();
    const cleanId = extractSpreadsheetId(spreadsheetId);
    if (token && cleanId && !cleanId.startsWith('1x_SheetsID')) {
      try {
        await syncAssetToSheet(cleanId, sheetName, oldName, updatedAsset, token);
        setLastSynced(new Date());
        setSyncNotice(`Perubahan aset "${updatedAsset.nama}" (${formatRupiah(updatedAsset.nilaiAkhirBulan)}) berhasil tersingkron ke Google Sheets.`);
      } catch (err: any) {
        console.warn('Gagal sinkron edit aset ke Google Sheets:', err);
      }
    }
  };

  const handleDeleteAsset = (name: string) => {
    const next = assets.filter((a) => a.nama !== name);
    setAssets(next);
    try {
      localStorage.setItem('kelvin_financial_custom_assets', JSON.stringify(next));
    } catch (e) {}
    setSyncNotice(`Aset "${name}" berhasil dihapus dari portofolio.`);
  };

  // --- Account CRUD Handlers ---
  const handleAddAccount = async (account: AccountBalance) => {
    if (!customAccountsList.includes(account.nama)) {
      const next = [...customAccountsList, account.nama];
      setCustomAccountsList(next);
      try {
        localStorage.setItem('kelvin_financial_accounts_list', JSON.stringify(next));
      } catch (e) {}
      setSyncNotice(`Rekening "${account.nama}" tersimpan.`);

      // Live Google Sheets synchronization for newly added account
      const token = await getAccessToken();
      const cleanId = extractSpreadsheetId(spreadsheetId);
      if (token && cleanId && !cleanId.startsWith('1x_SheetsID')) {
        try {
          await syncAddAccountToSheet(cleanId, sheetName, account.nama, account.totalSaldo || 0, token);
          setLastSynced(new Date());
          setSyncNotice(`Rekening/dompet "${account.nama}" berhasil ditambahkan & tersingkron ke Google Sheet tab ${sheetName}.`);
        } catch (err: any) {
          console.warn('Gagal sinkron akun baru ke Google Sheets:', err);
        }
      }
    }
  };

  const handleEditAccount = async (oldName: string, updated: AccountBalance) => {
    const next = customAccountsList.map((a) => (a === oldName ? updated.nama : a));
    setCustomAccountsList(next);
    try {
      localStorage.setItem('kelvin_financial_accounts_list', JSON.stringify(next));
    } catch (e) {}

    // Update transactions matching old account name so balances and history stay in sync
    if (oldName !== updated.nama) {
      setTransactions((prev) => {
        const updatedTxs = prev.map((t) => (t.akun === oldName ? { ...t, akun: updated.nama } : t));
        try {
          localStorage.setItem(`kelvin_financial_txs_${sheetName}`, JSON.stringify(updatedTxs));
        } catch (e) {}
        return updatedTxs;
      });
    }

    setSyncNotice(`Rekening "${updated.nama}" berhasil diperbarui.`);

    // Live Google Sheets synchronization: rename account across sheet rows
    const token = await getAccessToken();
    const cleanId = extractSpreadsheetId(spreadsheetId);
    if (token && cleanId && !cleanId.startsWith('1x_SheetsID')) {
      try {
        const updatedCells = await syncRenameAccountInSheet(cleanId, sheetName, oldName, updated.nama, token);
        setLastSynced(new Date());
        setSyncNotice(`Perubahan nama rekening "${oldName}" ➔ "${updated.nama}" berhasil tersingkron ke Google Sheets (${updatedCells} baris/sel diperbarui).`);
      } catch (err: any) {
        console.warn('Gagal sinkron nama akun ke Google Sheets:', err);
      }
    }
  };

  const handleDeleteAccount = (name: string) => {
    const next = customAccountsList.filter((a) => a !== name);
    setCustomAccountsList(next);
    try {
      localStorage.setItem('kelvin_financial_accounts_list', JSON.stringify(next));
    } catch (e) {}
    setSyncNotice(`Rekening "${name}" berhasil dihapus.`);
  };

  // --- Internal Account Transfer ---
  const handleInternalTransfer = async (
    fromAccount: string,
    toAccount: string,
    amount: number,
    note: string
  ) => {
    const txOut: Omit<Transaction, 'id'> = {
      bulan: sheetName,
      kategori: 'Transfer Internal',
      akun: fromAccount,
      tipe: 'Transfer Keluar',
      jumlah: amount,
      catatan: `Transfer keluar ke ${toAccount}: ${note}`
    };

    const txIn: Omit<Transaction, 'id'> = {
      bulan: sheetName,
      kategori: 'Transfer Internal',
      akun: toAccount,
      tipe: 'Transfer Masuk',
      jumlah: amount,
      catatan: `Transfer masuk dari ${fromAccount}: ${note}`
    };

    await handleAddTransaction(txOut, true);
    await handleAddTransaction(txIn, true);
    setSyncNotice(`Transfer ${formatRupiah(amount)} dari ${fromAccount} ke ${toAccount} sukses dicatat pada rekapan ${sheetName}.`);
  };

  // Monthly transaction counts for tab bar badges
  const txCountsByMonth = useMemo(() => {
    const counts: Record<string, number> = {};
    counts[sheetName] = transactions.length;
    counts[sheetName.toUpperCase()] = transactions.length;

    availableSheets.forEach((sh) => {
      const upper = sh.toUpperCase();
      if (upper === sheetName.toUpperCase()) return;
      try {
        const cached = localStorage.getItem(`kelvin_financial_txs_${sh}`);
        if (cached) {
          const arr = JSON.parse(cached);
          if (Array.isArray(arr)) {
            counts[sh] = arr.length;
            counts[upper] = arr.length;
          }
        } else if (INITIAL_TRANSACTIONS_BY_MONTH[upper]) {
          counts[sh] = INITIAL_TRANSACTIONS_BY_MONTH[upper].length;
          counts[upper] = INITIAL_TRANSACTIONS_BY_MONTH[upper].length;
        }
      } catch (e) {}
    });
    return counts;
  }, [transactions, sheetName, availableSheets]);

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div
          key="auth-login-gate"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full min-h-screen"
        >
          <LoginPage
            onLoginWithGoogle={handleGoogleLogin}
            onVerifyPin={handlePinVerify}
            isLoggingIn={isSyncing}
            loginError={syncNotice?.includes('Koneksi Google:') ? syncNotice : null}
            spreadsheetId={spreadsheetId}
            sheetName={sheetName}
            onUpdateSpreadsheetConfig={(id, name) => handleSaveProjectConfig(id, name)}
            settings={glassSettings}
            onSelectTheme={handleSelectTheme}
            onSuccessfulAuthTransition={() => {
              if (!user) {
                handlePinVerify('0000');
              }
            }}
          />
        </motion.div>
      ) : (
        <motion.div
          key="authenticated-dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`min-h-screen relative selection:bg-blue-500/30 selection:text-white transition-colors duration-300 ${
            glassSettings.themeMode === 'light'
              ? 'bg-[#f8fafc] text-slate-900'
              : glassSettings.themeMode === 'beige'
              ? 'bg-[#f5f2eb] text-[#29231c]'
              : glassSettings.themeMode === 'midnight'
              ? 'bg-[#000000] text-slate-100'
              : 'bg-[#060713] text-slate-100'
          }`}
        >
          {/* Atmospheric 3D Liquid Glass Ambient Orbs */}
          <div className="ambient-glow-1 top-[-100px] left-[-150px]" />
          <div className="ambient-glow-2 top-[35%] right-[-120px]" />
          <div className="ambient-glow-3 bottom-[-100px] left-[20%]" />

          {/* Main Container - Stationary Sidebar on Desktop with Independent Content Scrolling */}
          <div className="relative z-20 w-full max-w-[1520px] mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4 lg:h-screen lg:overflow-hidden flex gap-4 lg:gap-6 min-w-0">
            {/* Desktop Liquid Glass Sidebar & Mobile Slide-Over Drawer */}
            <LiquidSidebar
              activePage={activePage}
              onSelectPage={setActivePage}
              settings={glassSettings}
              txCount={transactions.length}
              onOpenReport={() => setIsReportModalOpen(true)}
              onOpenSmartAnalysis={() => setIsSmartAnalysisOpen(true)}
              onOpenCalculator={() => setIsCalculatorOpen(true)}
              onOpenProjectManager={() => setIsProjectManagerOpen(true)}
              onOpenSettings={() => setIsGlassModalOpen(true)}
              onOpenMenuPopup={() => setIsMenuPopupOpen(true)}
              onToggleTheme={handleToggleTheme}
              user={user}
              currentSheetName={sheetName}
              availableSheets={availableSheets}
              onSelectMonth={handleSelectMonth}
              isSyncing={isSyncing}
              onSyncNow={handleSyncFromSheets}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={handleToggleSidebarCollapse}
              isMobileOpen={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            {/* Main Content Dashboard - Scrolls smoothly without moving the sidebar */}
            <div className="flex-1 min-w-0 flex flex-col space-y-4 sm:space-y-6 lg:h-full lg:overflow-y-auto lg:pr-1 no-scrollbar overscroll-contain pb-8 sm:pb-12">
              {/* Dev Mode Banner with Exit Option */}
              {(user as any)?.isDevMode && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full p-3 sm:px-4 sm:py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-200 shadow-lg"
                >
                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/25 text-amber-300 font-extrabold text-[10px] tracking-widest uppercase border border-amber-400/40 shrink-0">
                      DEV MODE (0000)
                    </span>
                    <span className="text-slate-200">
                      Mode pratinjau aktif: Semua angka keuangan diset <strong>Rp 0</strong>. Untuk menghubungkan data Google Sheet riil Anda, silakan keluar dari Dev Mode dan login via Google.
                    </span>
                  </div>
                  <button
                    onClick={handleGoogleLogout}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar Dev Mode & Login Google</span>
                  </button>
                </motion.div>
              )}

              {/* Liquid Top Header */}
              <LiquidHeader
                activePage={activePage}
                onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
                onOpenMenuPopup={() => setIsMenuPopupOpen(true)}
                onOpenProjectManager={() => setIsProjectManagerOpen(true)}
                onOpenCalculator={() => setIsCalculatorOpen(true)}
                onNavigateToCashflow={() => setActivePage('cashflow')}
                settings={glassSettings}
                onToggleTheme={handleToggleTheme}
                currentSheetName={sheetName}
                availableSheets={availableSheets}
                onSelectMonth={handleSelectMonth}
                user={user}
                isSyncing={isSyncing}
                onSyncNow={handleSyncFromSheets}
                txCountsByMonth={txCountsByMonth}
              />

              {/* Sync Status Banner */}
              {syncNotice && (
                <div className="p-3 sm:px-4 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-400/40 dark:border-blue-400/30 flex items-center justify-between gap-2 text-xs text-blue-900 dark:text-blue-100 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 font-medium min-w-0">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate">{syncNotice}</span>
                  </div>
                  <button
                    onClick={() => setSyncNotice(null)}
                    className="text-xs font-bold text-blue-700 dark:text-blue-300 hover:text-blue-950 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-blue-500/10 dark:hover:bg-white/10 transition shrink-0"
                  >
                    Tutup
                  </button>
                </div>
              )}

              {/* 1 Compact Button Pilihan Bulan Google Sheet */}
              <div className="animate-in fade-in duration-200">
                <GoogleSheetMonthTabBar
                  currentSheet={sheetName}
                  onSelectSheet={handleSelectMonth}
                  availableSheets={availableSheets}
                  onAddNewSheet={handleAddNewSheet}
                  onRefreshTabs={handleRefreshSpreadsheetTabs}
                  isGoogleConnected={Boolean(user)}
                  user={user}
                  isSyncing={isSyncing}
                  onSyncCurrentSheet={handleSyncFromSheets}
                  settings={glassSettings}
                  txCountsByMonth={txCountsByMonth}
                />
              </div>

              {/* Smooth Animated Page Transitions Container */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePage}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full"
                >
                  {/* PAGE 1: SUMMARY (Clean, focused executive cockpit) */}
                  {activePage === 'summary' && (
                    <div className="space-y-6">
                      <ExecutiveSummary
                        totalAset={totalAset}
                        cashStandbyDanaDarurat={cashStandbyDanaDarurat}
                        totalInvestment={totalInvestment}
                        totalPemasukan={totalPemasukan}
                        totalPengeluaran={totalPengeluaran}
                        sisaSaldoIncome={sisaSaldoIncome}
                        settings={glassSettings}
                        budgets={budgets}
                        accounts={accounts}
                        transactions={transactions}
                        assets={assets}
                        history={history}
                        onNavigate={setActivePage}
                        onSyncGoogleSheets={handleSyncFromSheets}
                        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
                        onOpenCalculator={() => setIsCalculatorOpen(true)}
                        isSyncing={isSyncing}
                        currentMonthSheet={sheetName}
                        availableSheets={availableSheets}
                        onSelectMonthSheet={handleSelectMonth}
                      />
                    </div>
                  )}

                  {/* PAGE 2: INPUT CASHFLOW (Pengeluaran & Pemasukan by Kategori Google Sheets) */}
                  {activePage === 'cashflow' && (
                    <div>
                      <CashflowInputPage
                        settings={glassSettings}
                        onAddTransaction={handleAddTransaction}
                        transactions={transactions}
                        isSyncing={isSyncing}
                        isGoogleConnected={Boolean(user)}
                        onNavigateToJournal={() => setActivePage('journal')}
                        currentSheetName={sheetName}
                        onSelectMonth={handleSelectMonth}
                        availableSheets={availableSheets}
                      />
                    </div>
                  )}

                  {/* PAGE 3: BUDGETING ENVELOPES */}
                  {activePage === 'budgeting' && (
                    <div className="space-y-6">
                      <BudgetingTracker
                        budgets={budgets}
                        settings={glassSettings}
                        onAddBudget={handleAddBudget}
                        onEditBudget={handleEditBudget}
                        onDeleteBudget={handleDeleteBudget}
                      />

                      {/* Spending vs Envelope Detailed Insight */}
                      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-slate-400 leading-relaxed">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-amber-500" />
                          Mekanisme Rolling Budget & Sinking Fund
                        </h4>
                        <p>
                          Setiap pos di atas mengadopsi prinsip amplop finansial (*Envelope Budgeting*): Saldo bulan lalu yang
                          belum terserap otomatis diakumulasikan (*rolled-over*) bersama jatah alokasi gaji bulan baru,
                          menghasilkan total plafon belanja yang aman tanpa risiko defisit.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* PAGE 4: PORTOFOLIO & INVESTASI */}
                  {activePage === 'portfolio' && (
                    <div className="space-y-6">
                      <InvestmentPortfolio
                        assets={assets}
                        history={history}
                        settings={glassSettings}
                        totalProfit2026={1148790}
                        onAddAsset={handleAddAsset}
                        onEditAsset={handleEditAsset}
                        onDeleteAsset={handleDeleteAsset}
                        onOpenSmartAnalysis={() => setIsSmartAnalysisOpen(true)}
                        onOpenCalculator={() => setIsCalculatorOpen(true)}
                      />
                      <EmergencyFundCard fund={emergencyFund} settings={glassSettings} />
                    </div>
                  )}

                  {/* PAGE 5: SALDO BY REKENING */}
                  {activePage === 'accounts' && (
                    <div>
                      <AccountsPage
                        accounts={accounts}
                        settings={glassSettings}
                        onTransfer={handleInternalTransfer}
                        transactions={transactions}
                        totalNetWorth={totalAset}
                        totalInvestment={totalInvestment}
                        onAddAccount={handleAddAccount}
                        onEditAccount={handleEditAccount}
                        onDeleteAccount={handleDeleteAccount}
                      />
                    </div>
                  )}

                  {/* PAGE 6: JURNAL & REKAP DATA */}
                  {activePage === 'journal' && (
                    <div>
                      <TransactionManager
                        transactions={transactions}
                        settings={glassSettings}
                        onAddTransaction={(tx) => handleAddTransaction(tx, true)}
                        onEditTransaction={handleEditTransaction}
                        onDeleteTransaction={handleDeleteTransaction}
                        onSyncGoogleSheet={handleSyncFromSheets}
                        isSyncing={isSyncing}
                        currentSheetName={sheetName}
                        onSelectMonth={handleSelectMonth}
                        availableSheets={availableSheets}
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Footer */}
              <footer className="pt-6 pb-6 border-t border-slate-200/70 dark:border-white/10 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p>© 2026 Kelvin Gautama • Liquid Glass OS</p>
                <p className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Real-time Google Workspace Sheets Synchronized
                </p>
              </footer>
            </div>
          </div>

      {/* Glass Inspector Modal */}
      <GlassSettingsModal
        isOpen={isGlassModalOpen}
        onClose={() => setIsGlassModalOpen(false)}
        settings={glassSettings}
        onUpdateSettings={setGlassSettings}
      />

      {/* Automated Financial Report Modal */}
      <AutomatedReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        transactions={transactions}
        budgets={budgets}
        emergencyFund={emergencyFund}
        totalAset={totalAset}
        totalIncome={totalPemasukan}
        totalExpense={totalPengeluaran}
        settings={glassSettings}
      />

      {/* Smart Investment Analysis Modal */}
      <SmartAnalysisModal
        isOpen={isSmartAnalysisOpen}
        onClose={() => setIsSmartAnalysisOpen(false)}
        assets={assets}
        history={history}
        settings={glassSettings}
        cashStandby={cashStandbyDanaDarurat}
      />

      {/* Semi-Transparent Liquid Glass Popup Menu Container */}
      <GlassMenuPopup
        isOpen={isMenuPopupOpen}
        onClose={() => setIsMenuPopupOpen(false)}
        activePage={activePage}
        onSelectPage={setActivePage}
        settings={glassSettings}
        txCount={transactions.length}
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenInspector={() => setIsGlassModalOpen(true)}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onSelectTheme={handleSelectTheme}
        isGoogleConnected={Boolean(user)}
        user={user}
        spreadsheetId={spreadsheetId}
        sheetName={sheetName}
        isSyncing={isSyncing}
        lastSynced={lastSynced}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        onUpdateSpreadsheetId={(id) => handleSaveProjectConfig(id, sheetName)}
        onUpdateSheetName={(name) => handleSaveProjectConfig(spreadsheetId, name)}
        onSyncNow={handleSyncFromSheets}
        onPushToSheet={handlePushAllToSheet}
      />

      {/* Google Sheets Project Sync Manager Modal */}
      <ProjectSyncManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        user={user}
        spreadsheetId={spreadsheetId}
        sheetName={sheetName}
        onSaveProjectConfig={handleSaveProjectConfig}
        onLogin={handleGoogleLogin}
        onSyncNow={handleSyncFromSheets}
        isSyncing={isSyncing}
        settings={glassSettings}
      />

      {/* Kalkulator Investasi & Target Dana Pensiun Pro Modal */}
      <RetirementInvestmentCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        currentInvestment={totalInvestment}
        currentNetWorth={totalAset}
        settings={glassSettings}
      />
    </motion.div>
  )}
</AnimatePresence>
  );
}
