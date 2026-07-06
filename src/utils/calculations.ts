/**
 * calculations.ts
 * Derived financial data — balance is NEVER stored directly.
 * Everything is computed from the transaction list on the fly.
 */

import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  startOfYear, endOfYear,
  parseISO, isWithinInterval,
  format, subDays,
} from 'date-fns';
import type { Transaction, Account, PeriodFilter, Budget } from '../types';

// ─── Balance Calculations ─────────────────────────────────────────────────────

/**
 * Compute the current balance of a single account (centavos).
 * - income transactions credit this account
 * - expense transactions debit this account
 * - transfers: if accountId === this → debit; if toAccountId === this → credit
 */
export function getAccountBalance(
  accountId: string,
  transactions: Transaction[],
): number {
  let balance = 0;
  for (const t of transactions) {
    if (t.type === 'income' && t.accountId === accountId) {
      balance += t.amount;
    } else if (t.type === 'expense' && t.accountId === accountId) {
      balance -= t.amount;
    } else if (t.type === 'transfer') {
      if (t.accountId === accountId) balance -= t.amount;      // debit source
      if (t.toAccountId === accountId) balance += t.amount;   // credit destination
    }
  }
  return balance;
}

/** Total net worth = sum of all active account balances */
export function getNetWorth(
  accounts: Account[],
  transactions: Transaction[],
): number {
  return accounts
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + getAccountBalance(a.id, transactions), 0);
}

// ─── Period Filtering ─────────────────────────────────────────────────────────

export function getPeriodInterval(period: PeriodFilter, referenceDate = new Date()) {
  switch (period) {
    case 'today':
      return { start: startOfDay(referenceDate), end: endOfDay(referenceDate) };
    case 'week':
      return { start: startOfWeek(referenceDate, { weekStartsOn: 1 }), end: endOfWeek(referenceDate, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
    case 'year':
      return { start: startOfYear(referenceDate), end: endOfYear(referenceDate) };
  }
}

export function filterByPeriod(
  transactions: Transaction[],
  period: PeriodFilter,
): Transaction[] {
  const interval = getPeriodInterval(period);
  return transactions.filter((t) =>
    isWithinInterval(parseISO(t.date), interval),
  );
}

export function filterByDateRange(
  transactions: Transaction[],
  start: Date,
  end: Date,
): Transaction[] {
  return transactions.filter((t) =>
    isWithinInterval(parseISO(t.date), { start, end }),
  );
}

// ─── Summary Stats ────────────────────────────────────────────────────────────

export interface PeriodSummary {
  totalIncome: number;   // centavos
  totalExpense: number;  // centavos
  net: number;           // centavos
}

export function getPeriodSummary(transactions: Transaction[]): PeriodSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  for (const t of transactions) {
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
  }
  return { totalIncome, totalExpense, net: totalIncome - totalExpense };
}

// ─── Budget Progress ──────────────────────────────────────────────────────────

/**
 * Compute the total spent for a specific budget based on its category and strict date window.
 */
export function getBudgetSpentAmount(
  budget: Budget,
  transactions: Transaction[]
): number {
  if (!budget.startDate || !budget.endDate) return 0; // Guard for legacy budgets
  
  const start = parseISO(budget.startDate);
  const end = parseISO(budget.endDate);
  
  let spent = 0;
  for (const t of transactions) {
    if (t.type === 'expense' && t.categoryId === budget.categoryId) {
      const txDate = parseISO(t.date);
      if (txDate >= start && txDate <= end) {
        spent += t.amount;
      }
    }
  }
  return spent;
}

// ─── Category Breakdown ───────────────────────────────────────────────────────

export interface CategoryTotal {
  categoryId: string;
  total: number;       // centavos
  percentage: number;  // 0–100
}

export function getExpensesByCategory(
  transactions: Transaction[],
): CategoryTotal[] {
  const map = new Map<string, number>();
  let grandTotal = 0;
  for (const t of transactions) {
    if (t.type === 'expense') {
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
      grandTotal += t.amount;
    }
  }
  return Array.from(map.entries())
    .map(([categoryId, total]) => ({
      categoryId,
      total,
      percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// ─── Chart Data ───────────────────────────────────────────────────────────────

export interface BarChartPoint {
  label: string;
  income: number;   // pesos (float for chart display)
  expense: number;
}

/** Group transactions by week (for month view) or month (for year view) */
export function getBarChartData(
  transactions: Transaction[],
  period: 'month' | 'year' | 'week',
): BarChartPoint[] {
  const map = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    if (t.type === 'transfer') continue;
    const d = parseISO(t.date);
    let label: string;
    if (period === 'year') label = format(d, 'MMM');
    else if (period === 'month') label = `W${Math.ceil(d.getDate() / 7)}`;
    else label = format(d, 'EEE');

    const existing = map.get(label) ?? { income: 0, expense: 0 };
    if (t.type === 'income') existing.income += t.amount / 100;
    if (t.type === 'expense') existing.expense += t.amount / 100;
    map.set(label, existing);
  }

  return Array.from(map.entries()).map(([label, vals]) => ({
    label,
    ...vals,
  }));
}

// ─── Account Balance History (line chart) ────────────────────────────────────

export interface BalancePoint {
  date: string;
  balance: number;  // pesos
}

export function getAccountBalanceHistory(
  accountId: string,
  transactions: Transaction[],
  days = 30,
): BalancePoint[] {
  const sorted = [...transactions]
    .filter(
      (t) => t.accountId === accountId || t.toAccountId === accountId,
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const points: BalancePoint[] = [];
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const day = subDays(today, i);
    const dayEnd = endOfDay(day);
    let bal = 0;
    for (const t of sorted) {
      if (parseISO(t.date) > dayEnd) break;
      if (t.type === 'income' && t.accountId === accountId) bal += t.amount;
      if (t.type === 'expense' && t.accountId === accountId) bal -= t.amount;
      if (t.type === 'transfer') {
        if (t.accountId === accountId) bal -= t.amount;
        if (t.toAccountId === accountId) bal += t.amount;
      }
    }
    points.push({ date: format(day, 'MMM d'), balance: bal / 100 });
  }
  return points;
}
