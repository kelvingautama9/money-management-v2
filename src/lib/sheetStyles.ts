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
    bg: 'bg-[#c2e7da] text-[#065f46] border border-[#a3d9c7]',
    text: '#065f46',
    rawBg: '#c2e7da',
    rawText: '#065f46'
  },
  'Saldo Awal': {
    bg: 'bg-[#334155] text-[#f8fafc] border border-[#475569]',
    text: '#f8fafc',
    rawBg: '#334155',
    rawText: '#f8fafc'
  },
  'Uang Bulanan': {
    bg: 'bg-[#bae6fd] text-[#0369a1] border border-[#7dd3fc]',
    text: '#0369a1',
    rawBg: '#bae6fd',
    rawText: '#0369a1'
  },
  'Listrik': {
    bg: 'bg-[#fef08a] text-[#854d0e] border border-[#fde047]',
    text: '#854d0e',
    rawBg: '#fef08a',
    rawText: '#854d0e'
  },
  'Transport': {
    bg: 'bg-[#c7d2fe] text-[#3730a3] border border-[#a5b4fc]',
    text: '#3730a3',
    rawBg: '#c7d2fe',
    rawText: '#3730a3'
  },
  'Entertainment': {
    bg: 'bg-[#475569] text-[#ffffff] border border-[#64748b]',
    text: '#ffffff',
    rawBg: '#475569',
    rawText: '#ffffff'
  },
  'Dating': {
    bg: 'bg-[#f472b6] text-[#ffffff] border border-[#ec4899]',
    text: '#ffffff',
    rawBg: '#f472b6',
    rawText: '#ffffff'
  },
  'Jajan': {
    bg: 'bg-[#2e4732] text-[#f0fdf4] border border-[#3f6244]',
    text: '#f0fdf4',
    rawBg: '#2e4732',
    rawText: '#f0fdf4'
  },
  'Transfer Internal': {
    bg: 'bg-[#e2e8f0] text-[#1e293b] border border-[#cbd5e1]',
    text: '#1e293b',
    rawBg: '#e2e8f0',
    rawText: '#1e293b'
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
    bg: 'bg-[#1d4ed8] text-[#ffffff] border border-[#2563eb]',
    text: '#ffffff',
    rawBg: '#1d4ed8',
    rawText: '#ffffff'
  },
  'Seabank': {
    bg: 'bg-[#fed7aa] text-[#9a3412] border border-[#fdba74]',
    text: '#9a3412',
    rawBg: '#fed7aa',
    rawText: '#9a3412'
  },
  'Investasi': {
    bg: 'bg-[#15803d] text-[#ffffff] border border-[#16a34a]',
    text: '#ffffff',
    rawBg: '#15803d',
    rawText: '#ffffff'
  },
  'Blu BCA - Savings': {
    bg: 'bg-[#bfdbfe] text-[#1e3a8a] border border-[#93c5fd]',
    text: '#1e3a8a',
    rawBg: '#bfdbfe',
    rawText: '#1e3a8a'
  },
  'Allo Bank': {
    bg: 'bg-[#334155] text-[#ffffff] border border-[#475569]',
    text: '#ffffff',
    rawBg: '#334155',
    rawText: '#ffffff'
  },
  'Jago-Transport': {
    bg: 'bg-[#f59e0b] text-[#451a03] font-bold border border-[#d97706]',
    text: '#451a03',
    rawBg: '#f59e0b',
    rawText: '#451a03'
  },
  'Jago-Entertainment': {
    bg: 'bg-[#ea580c] text-[#ffffff] border border-[#f97316]',
    text: '#ffffff',
    rawBg: '#ea580c',
    rawText: '#ffffff'
  },
  'Blu BCA - Date': {
    bg: 'bg-[#93c5fd] text-[#1e3a8a] border border-[#60a5fa]',
    text: '#1e3a8a',
    rawBg: '#93c5fd',
    rawText: '#1e3a8a'
  },
  'Cash': {
    bg: 'bg-[#a7f3d0] text-[#065f46] border border-[#6ee7b7]',
    text: '#065f46',
    rawBg: '#a7f3d0',
    rawText: '#065f46'
  }
};

// 3. TIPE (Column D)
export const TYPE_STYLES: Record<string, SheetChipStyle> = {
  'Income': {
    bg: 'bg-[#15803d] text-[#ffffff] border border-[#16a34a]',
    text: '#ffffff',
    rawBg: '#15803d',
    rawText: '#ffffff'
  },
  'Expense': {
    bg: 'bg-[#dc2626] text-[#ffffff] border border-[#ef4444]',
    text: '#ffffff',
    rawBg: '#dc2626',
    rawText: '#ffffff'
  },
  'Saldo Bulan Lalu': {
    bg: 'bg-[#e2e8f0] text-[#1e293b] border border-[#cbd5e1]',
    text: '#1e293b',
    rawBg: '#e2e8f0',
    rawText: '#1e293b'
  },
  'Transfer Keluar': {
    bg: 'bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5]',
    text: '#b91c1c',
    rawBg: '#fee2e2',
    rawText: '#b91c1c'
  },
  'Transfer Masuk': {
    bg: 'bg-[#dcfce7] text-[#15803d] border border-[#86efac]',
    text: '#15803d',
    rawBg: '#dcfce7',
    rawText: '#15803d'
  }
};

// 4. CONDITIONAL FORMATTING CELL JUMLAH (Column E)
export function getAmountCellStyle(tipe?: string): { className: string; inlineStyle?: React.CSSProperties } {
  if (tipe === 'Expense') {
    return {
      className: 'font-mono font-bold text-center px-3 py-1 rounded-md',
      inlineStyle: {
        backgroundColor: '#dc2626', // Solid red Google Sheets
        color: '#ffffff',
        border: '1px solid #b91c1c',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
      }
    };
  }

  if (tipe === 'Income') {
    return {
      className: 'font-mono font-bold text-center px-3 py-1 rounded-md',
      inlineStyle: {
        backgroundColor: '#86efac', // Soft green Google Sheets
        color: '#064e3b',
        border: '1px solid #4ade80',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
      }
    };
  }

  if (tipe === 'Transfer Keluar') {
    return {
      className: 'font-mono font-semibold text-center px-3 py-1 rounded-md text-[#b91c1c] bg-rose-500/10 border border-rose-500/20'
    };
  }

  if (tipe === 'Transfer Masuk') {
    return {
      className: 'font-mono font-semibold text-center px-3 py-1 rounded-md text-[#15803d] bg-emerald-500/10 border border-emerald-500/20'
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
