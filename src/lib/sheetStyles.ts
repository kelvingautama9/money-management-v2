import React from 'react';
import { TransactionType } from '../types';

export const SHEET_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

export function normalizeMonthTitleCase(month?: string): string {
  if (!month) return 'September';
  const clean = month.trim();
  const lower = clean.toLowerCase();
  const map: Record<string, string> = {
    januari: 'Januari',
    februari: 'Februari',
    maret: 'Maret',
    april: 'April',
    mei: 'Mei',
    juni: 'Juni',
    juli: 'Juli',
    agustus: 'Agustus',
    september: 'September',
    oktober: 'Oktober',
    november: 'November',
    desember: 'Desember'
  };
  return map[lower] || (clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase());
}

/**
 * Exact Google Sheet Chip Styling definitions
 */
export interface SheetChipStyle {
  bg: string;
  text: string;
  border?: string;
  rawBg: string;
  rawText: string;
}

// 1. KATEGORI (Column B)
export const CATEGORY_STYLES: Record<string, SheetChipStyle> = {
  'Salary': {
    bg: 'bg-[#0f172a] text-[#f8fafc] border border-[#1e293b]',
    text: '#f8fafc',
    rawBg: '#0f172a',
    rawText: '#f8fafc'
  },
  'Saldo Awal': {
    bg: 'bg-[#334155] text-[#f8fafc] border border-[#475569]',
    text: '#f8fafc',
    rawBg: '#334155',
    rawText: '#f8fafc'
  },
  'Uang Bulanan': {
    bg: 'bg-[#1e293b] text-[#f1f5f9] border border-[#334155]',
    text: '#f1f5f9',
    rawBg: '#1e293b',
    rawText: '#f1f5f9'
  },
  'Listrik': {
    bg: 'bg-[#1e3a8a] text-[#ffffff] border border-[#172554]',
    text: '#ffffff',
    rawBg: '#1e3a8a',
    rawText: '#ffffff'
  },
  'Transport': {
    bg: 'bg-[#0f172a] text-[#e2e8f0] border border-[#1e293b]',
    text: '#e2e8f0',
    rawBg: '#0f172a',
    rawText: '#e2e8f0'
  },
  'Entertainment': {
    bg: 'bg-[#475569] text-[#ffffff] border border-[#64748b]',
    text: '#ffffff',
    rawBg: '#475569',
    rawText: '#ffffff'
  },
  'Dating': {
    bg: 'bg-[#334155] text-[#ffffff] border border-[#475569]',
    text: '#ffffff',
    rawBg: '#334155',
    rawText: '#ffffff'
  },
  'Jajan': {
    bg: 'bg-[#1e293b] text-[#f8fafc] border border-[#334155]',
    text: '#f8fafc',
    rawBg: '#1e293b',
    rawText: '#f8fafc'
  },
  'Transfer Internal': {
    bg: 'bg-[#e2e8f0] text-[#0f172a] border border-[#cbd5e1]',
    text: '#0f172a',
    rawBg: '#e2e8f0',
    rawText: '#0f172a'
  },
  'Lain-lain': {
    bg: 'bg-[#e2e8f0] text-[#334155] border border-[#cbd5e1]',
    text: '#334155',
    rawBg: '#e2e8f0',
    rawText: '#334155'
  }
};

// 2. AKUN (Column C)
export const ACCOUNT_STYLES: Record<string, SheetChipStyle> = {
  'Bank BCA': {
    bg: 'bg-[#0f172a] text-[#ffffff] border border-[#1e293b]',
    text: '#ffffff',
    rawBg: '#0f172a',
    rawText: '#ffffff'
  },
  'Seabank': {
    bg: 'bg-[#1e293b] text-[#f1f5f9] border border-[#334155]',
    text: '#f1f5f9',
    rawBg: '#1e293b',
    rawText: '#f1f5f9'
  },
  'Investasi': {
    bg: 'bg-[#0284c7] text-[#ffffff] border border-[#0369a1]',
    text: '#ffffff',
    rawBg: '#0284c7',
    rawText: '#ffffff'
  },
  'Blu BCA - Savings': {
    bg: 'bg-[#1e3a8a] text-[#ffffff] border border-[#172554]',
    text: '#ffffff',
    rawBg: '#1e3a8a',
    rawText: '#ffffff'
  },
  'Allo Bank': {
    bg: 'bg-[#334155] text-[#ffffff] border border-[#475569]',
    text: '#ffffff',
    rawBg: '#334155',
    rawText: '#ffffff'
  },
  'Jago-Transport': {
    bg: 'bg-[#0f172a] text-[#f8fafc] border border-[#1e293b]',
    text: '#f8fafc',
    rawBg: '#0f172a',
    rawText: '#f8fafc'
  },
  'Jago-Entertainment': {
    bg: 'bg-[#334155] text-[#ffffff] border border-[#475569]',
    text: '#ffffff',
    rawBg: '#334155',
    rawText: '#ffffff'
  },
  'Blu BCA - Date': {
    bg: 'bg-[#1e293b] text-[#f1f5f9] border border-[#334155]',
    text: '#f1f5f9',
    rawBg: '#1e293b',
    rawText: '#f1f5f9'
  },
  'Cash': {
    bg: 'bg-[#e2e8f0] text-[#0f172a] border border-[#cbd5e1]',
    text: '#0f172a',
    rawBg: '#e2e8f0',
    rawText: '#0f172a'
  }
};

// 3. TIPE (Column D)
export const TYPE_STYLES: Record<string, SheetChipStyle> = {
  'Income': {
    bg: 'bg-[#0f172a] text-[#ffffff] border border-[#1e293b]',
    text: '#ffffff',
    rawBg: '#0f172a',
    rawText: '#ffffff'
  },
  'Expense': {
    bg: 'bg-[#991b1b] text-[#ffffff] border border-[#7f1d1d]',
    text: '#ffffff',
    rawBg: '#991b1b',
    rawText: '#ffffff'
  },
  'Saldo Bulan Lalu': {
    bg: 'bg-[#e2e8f0] text-[#1e293b] border border-[#cbd5e1]',
    text: '#1e293b',
    rawBg: '#e2e8f0',
    rawText: '#1e293b'
  },
  'Transfer Keluar': {
    bg: 'bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]',
    text: '#991b1b',
    rawBg: '#fee2e2',
    rawText: '#991b1b'
  },
  'Transfer Masuk': {
    bg: 'bg-[#f1f5f9] text-[#0f172a] border border-[#cbd5e1]',
    text: '#0f172a',
    rawBg: '#f1f5f9',
    rawText: '#0f172a'
  }
};

// 4. CONDITIONAL FORMATTING CELL JUMLAH (Column E)
export function getAmountCellStyle(tipe?: string): { className: string; inlineStyle?: React.CSSProperties } {
  if (tipe === 'Expense') {
    return {
      className: 'font-mono font-bold text-center px-3 py-1 rounded-md text-white',
      inlineStyle: {
        backgroundColor: '#991b1b', // Dark red for spending
        color: '#ffffff',
        border: '1px solid #7f1d1d',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.25)'
      }
    };
  }

  if (tipe === 'Income') {
    return {
      className: 'font-mono font-bold text-center px-3 py-1 rounded-md',
      inlineStyle: {
        backgroundColor: '#0f172a',
        color: '#ffffff',
        border: '1px solid #1e293b',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
      }
    };
  }

  if (tipe === 'Transfer Keluar') {
    return {
      className: 'font-mono font-semibold text-center px-3 py-1 rounded-md text-[#991b1b] bg-red-500/10 border border-red-500/20'
    };
  }

  if (tipe === 'Transfer Masuk') {
    return {
      className: 'font-mono font-semibold text-center px-3 py-1 rounded-md text-[#0f172a] dark:text-[#f8fafc] bg-slate-500/10 border border-slate-500/20'
    };
  }

  return {
    className: 'font-mono font-medium text-center px-3 py-1 text-slate-300'
  };
}

export function getCategoryStyle(kat?: string): SheetChipStyle {
  if (!kat) return CATEGORY_STYLES['Lain-lain'];
  return (
    CATEGORY_STYLES[kat] || {
      bg: 'bg-slate-700 text-slate-200 border border-slate-600',
      text: '#e2e8f0',
      rawBg: '#334155',
      rawText: '#f8fafc'
    }
  );
}

export function getAccountStyle(acc?: string): SheetChipStyle {
  if (!acc) return ACCOUNT_STYLES['Bank BCA'];
  return (
    ACCOUNT_STYLES[acc] || {
      bg: 'bg-slate-700 text-slate-200 border border-slate-600',
      text: '#e2e8f0',
      rawBg: '#334155',
      rawText: '#f8fafc'
    }
  );
}

export function getTypeStyle(type?: string): SheetChipStyle {
  if (!type) return TYPE_STYLES['Expense'];
  return (
    TYPE_STYLES[type] || {
      bg: 'bg-slate-700 text-slate-200 border border-slate-600',
      text: '#e2e8f0',
      rawBg: '#334155',
      rawText: '#f8fafc'
    }
  );
}
