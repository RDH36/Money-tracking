import { useMemo } from 'react';
import type { TransactionWithCategory } from './useTransactions';

export type PeriodType = 'day' | 'week' | 'month' | 'year';

export interface PeriodStats {
  totalExpenses: number;
  totalIncome: number;
  transactionCount: number;
  avgPerDay: number;
  categoryBreakdown: { id: string | null; name: string; amount: number; color: string }[];
  topCategory: { name: string; amount: number } | null;
}

export interface DailyTotal {
  date: string;
  expenses: number;
  income: number;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getWeekStart(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function getPeriodRange(period: PeriodType, date: Date): { start: Date; end: Date; days: number } {
  const d = startOfDay(date);
  switch (period) {
    case 'day':
      return { start: d, end: new Date(d.getTime() + 86400000 - 1), days: 1 };
    case 'week': {
      const ws = getWeekStart(d);
      return { start: ws, end: new Date(ws.getTime() + 7 * 86400000 - 1), days: 7 };
    }
    case 'month': {
      const ms = new Date(d.getFullYear(), d.getMonth(), 1);
      const me = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start: ms, end: me, days: me.getDate() };
    }
    case 'year': {
      const ys = new Date(d.getFullYear(), 0, 1);
      const ye = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
      const daysInYear = Math.ceil((ye.getTime() - ys.getTime()) / 86400000) + 1;
      return { start: ys, end: ye, days: daysInYear };
    }
  }
}

export function filterByPeriod(
  transactions: TransactionWithCategory[],
  period: PeriodType,
  date: Date
): TransactionWithCategory[] {
  const { start, end } = getPeriodRange(period, date);
  return transactions.filter((tx) => {
    const txDate = new Date(tx.created_at);
    return txDate >= start && txDate <= end;
  });
}

export function computeStats(transactions: TransactionWithCategory[], days: number): PeriodStats {
  let totalExpenses = 0;
  let totalIncome = 0;
  const catMap = new Map<string, { name: string; amount: number; color: string }>();

  transactions.forEach((tx) => {
    if (tx.transfer_id) return;
    if (tx.type === 'expense') {
      totalExpenses += tx.amount;
      const key = tx.category_id || 'other';
      const existing = catMap.get(key);
      if (existing) {
        existing.amount += tx.amount;
      } else {
        catMap.set(key, {
          name: tx.category_name || 'Other',
          amount: tx.amount,
          color: tx.category_color || '#95A5A6',
        });
      }
    } else if (tx.type === 'income') {
      totalIncome += tx.amount;
    }
  });

  const categoryBreakdown = Array.from(catMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalExpenses,
    totalIncome,
    transactionCount: transactions.length,
    avgPerDay: days > 0 ? Math.round(totalExpenses / days) : 0,
    categoryBreakdown,
    topCategory: categoryBreakdown.length > 0
      ? { name: categoryBreakdown[0].name, amount: categoryBreakdown[0].amount }
      : null,
  };
}

export function getDailyTotals(
  transactions: TransactionWithCategory[],
  year: number,
  month: number
): Record<number, DailyTotal> {
  const totals: Record<number, DailyTotal> = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    totals[d] = { date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, expenses: 0, income: 0 };
  }

  transactions.forEach((tx) => {
    if (tx.transfer_id) return;
    const txDate = new Date(tx.created_at);
    if (txDate.getFullYear() === year && txDate.getMonth() === month) {
      const day = txDate.getDate();
      if (totals[day]) {
        if (tx.type === 'expense') totals[day].expenses += tx.amount;
        else if (tx.type === 'income') totals[day].income += tx.amount;
      }
    }
  });

  return totals;
}

export function getBarChartData(
  transactions: TransactionWithCategory[],
  period: PeriodType,
  date: Date
): { label: string; expenses: number; income: number }[] {
  const bars: { label: string; expenses: number; income: number }[] = [];

  if (period === 'week') {
    const ws = getWeekStart(date);
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws.getTime() + i * 86400000);
      const dayTxs = transactions.filter((tx) => {
        const td = new Date(tx.created_at);
        return td.toDateString() === d.toDateString();
      });
      let expenses = 0, income = 0;
      dayTxs.forEach((tx) => {
        if (tx.transfer_id) return;
        if (tx.type === 'expense') expenses += tx.amount;
        else if (tx.type === 'income') income += tx.amount;
      });
      bars.push({ label: dayLabels[i], expenses, income });
    }
  } else if (period === 'month') {
    const y = date.getFullYear(), m = date.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const weekCount = Math.ceil(daysInMonth / 7);
    for (let w = 0; w < weekCount; w++) {
      const startDay = w * 7 + 1;
      const endDay = Math.min(startDay + 6, daysInMonth);
      let expenses = 0, income = 0;
      transactions.forEach((tx) => {
        if (tx.transfer_id) return;
        const td = new Date(tx.created_at);
        if (td.getFullYear() === y && td.getMonth() === m && td.getDate() >= startDay && td.getDate() <= endDay) {
          if (tx.type === 'expense') expenses += tx.amount;
          else if (tx.type === 'income') income += tx.amount;
        }
      });
      bars.push({ label: `S${w + 1}`, expenses, income });
    }
  } else if (period === 'year') {
    const y = date.getFullYear();
    const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    for (let m = 0; m < 12; m++) {
      let expenses = 0, income = 0;
      transactions.forEach((tx) => {
        if (tx.transfer_id) return;
        const td = new Date(tx.created_at);
        if (td.getFullYear() === y && td.getMonth() === m) {
          if (tx.type === 'expense') expenses += tx.amount;
          else if (tx.type === 'income') income += tx.amount;
        }
      });
      bars.push({ label: monthLabels[m], expenses, income });
    }
  }

  return bars;
}

export function navigateDate(date: Date, period: PeriodType, direction: -1 | 1): Date {
  const d = new Date(date);
  switch (period) {
    case 'day': d.setDate(d.getDate() + direction); break;
    case 'week': d.setDate(d.getDate() + 7 * direction); break;
    case 'month': d.setMonth(d.getMonth() + direction); break;
    case 'year': d.setFullYear(d.getFullYear() + direction); break;
  }
  return d;
}

export function formatPeriodLabel(date: Date, period: PeriodType, locale: string): string {
  switch (period) {
    case 'day':
      return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
    case 'week': {
      const ws = getWeekStart(date);
      const we = new Date(ws.getTime() + 6 * 86400000);
      const fmt = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
      return `${fmt(ws)} - ${fmt(we)}`;
    }
    case 'month':
      return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    case 'year':
      return date.getFullYear().toString();
  }
}

export function useTransactionStats(
  transactions: TransactionWithCategory[],
  period: PeriodType,
  date: Date
) {
  const filtered = useMemo(() => filterByPeriod(transactions, period, date), [transactions, period, date]);
  const { days } = useMemo(() => getPeriodRange(period, date), [period, date]);
  const stats = useMemo(() => computeStats(filtered, days), [filtered, days]);

  return { filtered, stats };
}
