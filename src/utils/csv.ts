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

// ─── EXCELJS EXPORT ───────────────────────────────────────────────────────────

export async function exportTransactionsXLSX(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  filename: string,
): Promise<void> {
  // Dynamic import so exceljs is not in the critical bundle
  const ExcelJS = await import('exceljs');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Transactions');

  worksheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Time', key: 'time', width: 10 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Amount (PHP)', key: 'amount', width: 16 },
    { header: 'Account', key: 'account', width: 20 },
    { header: 'To Account', key: 'toAccount', width: 20 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Note', key: 'note', width: 32 },
    { header: 'ID', key: 'id', width: 38 },
  ];

  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  transactions
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((t) => {
      worksheet.addRow({
        date: format(parseISO(t.date), 'yyyy-MM-dd'),
        time: format(parseISO(t.date), 'HH:mm'),
        type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
        amount: t.amount / 100,
        account: accountMap.get(t.accountId) ?? t.accountId,
        toAccount: t.toAccountId ? (accountMap.get(t.toAccountId) ?? t.toAccountId) : '',
        category: categoryMap.get(t.categoryId) ?? t.categoryId,
        note: t.note ?? '',
        id: t.id,
      });
    });

  // Style header row
  worksheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
