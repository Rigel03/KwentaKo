/**
 * seedData.ts
 * Default accounts, categories, and sample transactions for first-run experience.
 */

import { subDays, subHours } from 'date-fns';
import type { Account, Category, Transaction } from '../types';

const now = new Date();
const iso = (d: Date) => d.toISOString();
const today = (h = 9, m = 0) => {
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  return d;
};
const daysAgo = (n: number, h = 10) => subHours(subDays(now, n), 24 - h);

// ─── DEFAULT ACCOUNTS ────────────────────────────────────────────────────────

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc-cash',
    name: 'Cash on Hand',
    type: 'cash',
    currency: 'PHP',
    icon: 'fa-money-bill-wave',
    color: '#16A34A',
    isActive: true,
    createdAt: iso(subDays(now, 60)),
  },
  {
    id: 'acc-gcash',
    name: 'GCash',
    type: 'e_wallet',
    currency: 'PHP',
    icon: 'fa-mobile-screen-button',
    color: '#2563EB',
    isActive: true,
    createdAt: iso(subDays(now, 60)),
  },
  {
    id: 'acc-maribank',
    name: 'Maribank',
    type: 'digital_bank',
    currency: 'PHP',
    icon: 'fa-building-columns',
    color: '#7C3AED',
    isActive: true,
    createdAt: iso(subDays(now, 60)),
  },
  {
    id: 'acc-maya',
    name: 'Maya',
    type: 'e_wallet',
    currency: 'PHP',
    icon: 'fa-mobile-screen-button',
    color: '#0891B2',
    isActive: true,
    createdAt: iso(subDays(now, 60)),
  },
];

// ─── DEFAULT CATEGORIES ──────────────────────────────────────────────────────

export const DEFAULT_CATEGORIES: Category[] = [
  // EXPENSE
  { id: 'cat-food', name: 'Food & Dining', icon: 'fa-utensils', color: '#F97316', type: 'expense', isDefault: true, isActive: true, sortOrder: 1 },
  { id: 'cat-transport', name: 'Transport', icon: 'fa-car', color: '#6366F1', type: 'expense', isDefault: true, isActive: true, sortOrder: 2 },
  { id: 'cat-shopping', name: 'Shopping', icon: 'fa-bag-shopping', color: '#EC4899', type: 'expense', isDefault: true, isActive: true, sortOrder: 3 },
  { id: 'cat-entertainment', name: 'Entertainment', icon: 'fa-film', color: '#8B5CF6', type: 'expense', isDefault: true, isActive: true, sortOrder: 4 },
  { id: 'cat-bills', name: 'Bills & Utilities', icon: 'fa-bolt', color: '#EAB308', type: 'expense', isDefault: true, isActive: true, sortOrder: 5 },
  { id: 'cat-health', name: 'Health', icon: 'fa-heart-pulse', color: '#EF4444', type: 'expense', isDefault: true, isActive: true, sortOrder: 6 },
  { id: 'cat-education', name: 'Education', icon: 'fa-graduation-cap', color: '#0EA5E9', type: 'expense', isDefault: true, isActive: true, sortOrder: 7 },
  { id: 'cat-groceries', name: 'Groceries', icon: 'fa-basket-shopping', color: '#22C55E', type: 'expense', isDefault: true, isActive: true, sortOrder: 8 },
  { id: 'cat-subscriptions', name: 'Subscriptions', icon: 'fa-repeat', color: '#A855F7', type: 'expense', isDefault: true, isActive: true, sortOrder: 9 },
  { id: 'cat-personal', name: 'Personal Care', icon: 'fa-pump-soap', color: '#F43F5E', type: 'expense', isDefault: true, isActive: true, sortOrder: 10 },
  { id: 'cat-invest-exp', name: 'Investments', icon: 'fa-chart-line', color: '#14B8A6', type: 'expense', isDefault: true, isActive: true, sortOrder: 11 },
  { id: 'cat-savings', name: 'Savings', icon: 'fa-piggy-bank', color: '#3B82F6', type: 'expense', isDefault: true, isActive: true, sortOrder: 12 },
  { id: 'cat-misc', name: 'Miscellaneous', icon: 'fa-circle-question', color: '#94A3B8', type: 'expense', isDefault: true, isActive: true, sortOrder: 13 },
  // INCOME
  { id: 'cat-salary', name: 'Salary', icon: 'fa-money-bill-wave', color: '#16A34A', type: 'income', isDefault: true, isActive: true, sortOrder: 1 },
  { id: 'cat-freelance', name: 'Freelance', icon: 'fa-laptop', color: '#2563EB', type: 'income', isDefault: true, isActive: true, sortOrder: 2 },
  { id: 'cat-business', name: 'Business', icon: 'fa-store', color: '#F97316', type: 'income', isDefault: true, isActive: true, sortOrder: 3 },
  { id: 'cat-invest-inc', name: 'Investment Returns', icon: 'fa-chart-line', color: '#14B8A6', type: 'income', isDefault: true, isActive: true, sortOrder: 4 },
  { id: 'cat-allowance', name: 'Allowance', icon: 'fa-hand-holding-dollar', color: '#8B5CF6', type: 'income', isDefault: true, isActive: true, sortOrder: 5 },
  { id: 'cat-gift', name: 'Gift', icon: 'fa-gift', color: '#EC4899', type: 'income', isDefault: true, isActive: true, sortOrder: 6 },
  { id: 'cat-other-inc', name: 'Other Income', icon: 'fa-circle-dollar-to-slot', color: '#22C55E', type: 'income', isDefault: true, isActive: true, sortOrder: 7 },
  // TRANSFER
  { id: 'cat-transfer', name: 'Account Transfer', icon: 'fa-right-left', color: '#3B82F6', type: 'both', isDefault: true, isActive: true, sortOrder: 1 },
];

// ─── SAMPLE TRANSACTIONS ─────────────────────────────────────────────────────

const tid = (n: number) => `txn-seed-${n}`;

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  // Salary — start of month
  {
    id: tid(1),
    type: 'income',
    amount: 2500000, // ₱25,000.00
    accountId: 'acc-cash',
    categoryId: 'cat-salary',
    note: 'Monthly salary — June',
    date: iso(daysAgo(10, 9)),
    createdAt: iso(daysAgo(10, 9)),
    updatedAt: iso(daysAgo(10, 9)),
  },
  // Freelance income
  {
    id: tid(2),
    type: 'income',
    amount: 500000, // ₱5,000.00
    accountId: 'acc-maya',
    categoryId: 'cat-freelance',
    note: 'Web design project — client A',
    date: iso(daysAgo(7, 14)),
    createdAt: iso(daysAgo(7, 14)),
    updatedAt: iso(daysAgo(7, 14)),
  },
  // Allowance
  {
    id: tid(3),
    type: 'income',
    amount: 300000, // ₱3,000.00
    accountId: 'acc-gcash',
    categoryId: 'cat-allowance',
    note: 'Weekly allowance',
    date: iso(daysAgo(9, 8)),
    createdAt: iso(daysAgo(9, 8)),
    updatedAt: iso(daysAgo(9, 8)),
  },
  // Groceries
  {
    id: tid(4),
    type: 'expense',
    amount: 185000, // ₱1,850.00
    accountId: 'acc-gcash',
    categoryId: 'cat-groceries',
    note: 'SM Supermarket — weekly grocery run',
    date: iso(daysAgo(8, 11)),
    createdAt: iso(daysAgo(8, 11)),
    updatedAt: iso(daysAgo(8, 11)),
  },
  // Bills
  {
    id: tid(5),
    type: 'expense',
    amount: 120000, // ₱1,200.00
    accountId: 'acc-gcash',
    categoryId: 'cat-bills',
    note: 'Meralco bill — May',
    date: iso(daysAgo(8, 14)),
    createdAt: iso(daysAgo(8, 14)),
    updatedAt: iso(daysAgo(8, 14)),
  },
  // Transfer: Cash → Maribank
  {
    id: tid(6),
    type: 'transfer',
    amount: 1000000, // ₱10,000.00
    accountId: 'acc-cash',
    toAccountId: 'acc-maribank',
    categoryId: 'cat-transfer',
    note: 'Deposit to savings',
    date: iso(daysAgo(7, 10)),
    transferGroupId: 'tg-seed-1',
    createdAt: iso(daysAgo(7, 10)),
    updatedAt: iso(daysAgo(7, 10)),
  },
  // Food & Dining
  {
    id: tid(7),
    type: 'expense',
    amount: 32000, // ₱320.00
    accountId: 'acc-maya',
    categoryId: 'cat-food',
    note: 'Jollibee lunch',
    date: iso(daysAgo(6, 12)),
    createdAt: iso(daysAgo(6, 12)),
    updatedAt: iso(daysAgo(6, 12)),
  },
  // Transport
  {
    id: tid(8),
    type: 'expense',
    amount: 15000, // ₱150.00
    accountId: 'acc-cash',
    categoryId: 'cat-transport',
    note: 'Grab to office',
    date: iso(daysAgo(6, 7)),
    createdAt: iso(daysAgo(6, 7)),
    updatedAt: iso(daysAgo(6, 7)),
  },
  // Shopping
  {
    id: tid(9),
    type: 'expense',
    amount: 240000, // ₱2,400.00
    accountId: 'acc-gcash',
    categoryId: 'cat-shopping',
    note: 'Clothes — Uniqlo',
    date: iso(daysAgo(5, 15)),
    createdAt: iso(daysAgo(5, 15)),
    updatedAt: iso(daysAgo(5, 15)),
  },
  // Entertainment
  {
    id: tid(10),
    type: 'expense',
    amount: 45000, // ₱450.00
    accountId: 'acc-maya',
    categoryId: 'cat-entertainment',
    note: 'Netflix + Spotify subscriptions',
    date: iso(daysAgo(4, 8)),
    createdAt: iso(daysAgo(4, 8)),
    updatedAt: iso(daysAgo(4, 8)),
  },
  // Food & Dining
  {
    id: tid(11),
    type: 'expense',
    amount: 58000, // ₱580.00
    accountId: 'acc-cash',
    categoryId: 'cat-food',
    note: 'Family dinner — Mang Inasal',
    date: iso(daysAgo(3, 19)),
    createdAt: iso(daysAgo(3, 19)),
    updatedAt: iso(daysAgo(3, 19)),
  },
  // Health
  {
    id: tid(12),
    type: 'expense',
    amount: 89500, // ₱895.00
    accountId: 'acc-gcash',
    categoryId: 'cat-health',
    note: 'Vitamins + checkup',
    date: iso(daysAgo(2, 10)),
    createdAt: iso(daysAgo(2, 10)),
    updatedAt: iso(daysAgo(2, 10)),
  },
  // Transfer: GCash → Maya
  {
    id: tid(13),
    type: 'transfer',
    amount: 50000, // ₱500.00
    accountId: 'acc-gcash',
    toAccountId: 'acc-maya',
    categoryId: 'cat-transfer',
    note: 'Send to Maya',
    date: iso(daysAgo(1, 9)),
    transferGroupId: 'tg-seed-2',
    createdAt: iso(daysAgo(1, 9)),
    updatedAt: iso(daysAgo(1, 9)),
  },
  // Today — Transport
  {
    id: tid(14),
    type: 'expense',
    amount: 4500, // ₱45.00
    accountId: 'acc-cash',
    categoryId: 'cat-transport',
    note: 'Jeepney fare',
    date: iso(today(7, 30)),
    createdAt: iso(today(7, 30)),
    updatedAt: iso(today(7, 30)),
  },
  // Today — Food
  {
    id: tid(15),
    type: 'expense',
    amount: 12500, // ₱125.00
    accountId: 'acc-gcash',
    categoryId: 'cat-food',
    note: 'Breakfast — 7-Eleven',
    date: iso(today(8, 15)),
    createdAt: iso(today(8, 15)),
    updatedAt: iso(today(8, 15)),
  },
];
