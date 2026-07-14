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

// \u2500\u2500\u2500 Weekly Insights \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

import type { Category } from '../types';

export interface WeeklyInsight {
  topCategory: Category | null;
  topCategoryAmount: number;    // centavos
  weekOverWeekPct: number | null;
  message: string;
}

export function getWeeklyInsights(
  transactions: Transaction[],
  categories: Category[],
): WeeklyInsight | null {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd   = endOfWeek(now,   { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(new Date(thisWeekStart.getTime() - 1), { weekStartsOn: 1 });
  const lastWeekEnd   = endOfWeek(new Date(thisWeekStart.getTime() - 1),   { weekStartsOn: 1 });

  const thisWeekExp = transactions.filter(
    (t) => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start: thisWeekStart, end: thisWeekEnd }),
  );
  const lastWeekExp = transactions.filter(
    (t) => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start: lastWeekStart, end: lastWeekEnd }),
  );

  const thisTotal = thisWeekExp.reduce((s, t) => s + t.amount, 0);
  const lastTotal = lastWeekExp.reduce((s, t) => s + t.amount, 0);

  // Top category this week
  const catMap = new Map<string, number>();
  for (const t of thisWeekExp) {
    catMap.set(t.categoryId, (catMap.get(t.categoryId) ?? 0) + t.amount);
  }
  const topEntry = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])[0];
  const topCategory = topEntry ? categories.find((c) => c.id === topEntry[0]) ?? null : null;
  const topCategoryAmount = topEntry ? topEntry[1] : 0;

  // Week-over-week %
  const weekOverWeekPct = lastTotal > 0
    ? ((thisTotal - lastTotal) / lastTotal) * 100
    : thisTotal > 0 ? 100 : null;

  // Message
  let message = '';
  if (thisTotal === 0) {
    message = 'Great start \u2014 no expenses logged yet this week!';
  } else if (weekOverWeekPct !== null && weekOverWeekPct > 20) {
    message = 'Spending is up compared to last week. Keep an eye on it!';
  } else if (weekOverWeekPct !== null && weekOverWeekPct < -10) {
    message = 'You are spending less than last week. Keep it up!';
  } else if (topCategory) {
    message = topCategory.name + ' is your biggest expense category this week.';
  }

  return { topCategory, topCategoryAmount, weekOverWeekPct, message };
}

