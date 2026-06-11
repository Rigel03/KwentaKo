/**
 * useStore.ts
 * Central Zustand store with localStorage persistence.
 * Manages accounts, transactions, categories, settings, and UI state.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Account,
  Transaction,
  Category,
  AppSettings,
  ToastMessage,
  ThemeMode,
} from '../types';
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORIES,
  SAMPLE_TRANSACTIONS,
} from '../utils/seedData';

// ─── Store Shape ──────────────────────────────────────────────────────────────

interface KwentaKoStore {
  // ── Data
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  settings: AppSettings;

  // ── UI State (NOT persisted)
  toasts: ToastMessage[];
  isAddSheetOpen: boolean;
  editingTransactionId: string | null;

  // ── Account Actions
  addAccount: (account: Account) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // ── Transaction Actions
  addTransaction: (transaction: Transaction) => void;
  addTransactions: (transactions: Transaction[]) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deleteTransactionPair: (transferGroupId: string) => void;

  // ── Category Actions
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // ── Settings Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  setTheme: (theme: ThemeMode) => void;
  clearAllData: () => void;

  // ── UI Actions
  showToast: (message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
  openAddSheet: (editId?: string) => void;
  closeAddSheet: () => void;
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useStore = create<KwentaKoStore>()(
  persist(
    (set) => ({
      // ── Initial Data
      accounts: DEFAULT_ACCOUNTS,
      transactions: SAMPLE_TRANSACTIONS,
      categories: DEFAULT_CATEGORIES,
      settings: {
        theme: 'system',
        currency: 'PHP',
        defaultAccountId: 'acc-cash',
        analyticsDefaultPeriod: 'month',
        hasSeededData: true,
      },

      // ── UI State (reset on each load)
      toasts: [],
      isAddSheetOpen: false,
      editingTransactionId: null,

      // ── Account Actions
      addAccount: (account) =>
        set((s) => ({ accounts: [...s.accounts, account] })),

      updateAccount: (id, updates) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, ...updates } : a,
          ),
        })),

      deleteAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
        })),

      // ── Transaction Actions
      addTransaction: (transaction) =>
        set((s) => ({
          transactions: [...s.transactions, transaction],
        })),

      addTransactions: (transactions) =>
        set((s) => ({
          transactions: [...s.transactions, ...transactions],
        })),

      updateTransaction: (id, updates) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t,
          ),
        })),

      deleteTransaction: (id) =>
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        })),

      deleteTransactionPair: (transferGroupId) =>
        set((s) => ({
          transactions: s.transactions.filter(
            (t) => t.transferGroupId !== transferGroupId,
          ),
        })),

      // ── Category Actions
      addCategory: (category) =>
        set((s) => ({ categories: [...s.categories, category] })),

      updateCategory: (id, updates) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        })),

      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
        })),

      // ── Settings Actions
      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),

      setTheme: (theme) =>
        set((s) => ({ settings: { ...s.settings, theme } })),

      clearAllData: () =>
        set({
          accounts: DEFAULT_ACCOUNTS,
          transactions: [],
          categories: DEFAULT_CATEGORIES,
          settings: {
            theme: 'system',
            currency: 'PHP',
            defaultAccountId: 'acc-cash',
            analyticsDefaultPeriod: 'month',
            hasSeededData: false,
          },
        }),

      // ── Toast Actions
      showToast: (message, type = 'success') => {
        const id = crypto.randomUUID();
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, 3000);
      },

      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      // ── Add Sheet UI
      openAddSheet: (editId) =>
        set({ isAddSheetOpen: true, editingTransactionId: editId ?? null }),

      closeAddSheet: () =>
        set({ isAddSheetOpen: false, editingTransactionId: null }),
    }),
    {
      name: 'kwentako-store',
      storage: createJSONStorage(() => localStorage),
      // Don't persist UI state
      partialize: (s) => ({
        accounts: s.accounts,
        transactions: s.transactions,
        categories: s.categories,
        settings: s.settings,
      }),
    },
  ),
);

// ─── Selector Hooks (for performance) ────────────────────────────────────────

export const useAccounts = () => useStore((s) => s.accounts);
export const useTransactions = () => useStore((s) => s.transactions);
export const useCategories = () => useStore((s) => s.categories);
export const useSettings = () => useStore((s) => s.settings);
export const useToasts = () => useStore((s) => s.toasts);
export const useIsAddSheetOpen = () => useStore((s) => s.isAddSheetOpen);
export const useEditingTransactionId = () => useStore((s) => s.editingTransactionId);
