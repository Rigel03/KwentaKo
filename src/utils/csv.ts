/**
 * csv.ts
 * Export and import transactions as CSV for Settings page.
 */

import type { Transaction, Account, Category } from '../types';
import { format, parseISO } from 'date-fns';

// ─── EXPORT ───────────────────────────────────────────────────────────────────

export function exportTransactionsCSV(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const headers = [
    'Date', 'Type', 'Amount (PHP)', 'Account', 'To Account',
    'Category', 'Note', 'Transfer Group ID', 'ID',
  ];

  const rows = transactions
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) => [
      format(parseISO(t.date), 'yyyy-MM-dd'),
      t.type,
      (t.amount / 100).toFixed(2),
      accountMap.get(t.accountId) ?? t.accountId,
      t.toAccountId ? (accountMap.get(t.toAccountId) ?? t.toAccountId) : '',
      categoryMap.get(t.categoryId) ?? t.categoryId,
      t.note ?? '',
      t.transferGroupId ?? '',
      t.id,
    ]);

  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(','), ...rows.map((r) => r.map(String).map(escape).join(','))];
  return lines.join('\n');
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
