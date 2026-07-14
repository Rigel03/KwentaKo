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

// \u2500\u2500\u2500 XLSX EXPORT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export async function exportTransactionsXLSX(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  filename: string,
): Promise<void> {
  // Dynamic import so xlsx is not in the critical bundle
  const XLSX = await import('xlsx');

  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const rows = transactions
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) => ({
      Date: format(parseISO(t.date), 'yyyy-MM-dd'),
      Time: format(parseISO(t.date), 'HH:mm'),
      Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
      'Amount (PHP)': t.amount / 100,
      Account: accountMap.get(t.accountId) ?? t.accountId,
      'To Account': t.toAccountId ? (accountMap.get(t.toAccountId) ?? t.toAccountId) : '',
      Category: categoryMap.get(t.categoryId) ?? t.categoryId,
      Note: t.note ?? '',
      ID: t.id,
    }));

  const ws = XLSX.utils.json_to_sheet(rows);
  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 14 },
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 30 }, { wch: 36 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  XLSX.writeFile(wb, filename);
}

