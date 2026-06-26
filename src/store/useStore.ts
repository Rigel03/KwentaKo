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
  Budget,
} from '../types';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from '../utils/seedData';
import { supabase } from '../lib/supabase';

// ─── Store Shape ──────────────────────────────────────────────────────────────

interface KwentaKoStore {
  // ── Data
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  settings: AppSettings;
  userId: string | null;

  // ── UI State (NOT persisted)
  toasts: ToastMessage[];
  isAddSheetOpen: boolean;
  editingTransactionId: string | null;
  balanceVisible: boolean;

  toggleBalanceVisibility: () => void;

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
  reorderCategory: (sourceIndex: number, destinationIndex: number) => void;

  // ── Budget Actions
  addBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;

  // ── Settings Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  setTheme: (theme: ThemeMode) => void;
  clearAllData: () => void;
  
  // ── Cloud Sync
  initSync: () => Promise<void>;

  // ── UI Actions
  showToast: (message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
  openAddSheet: (editId?: string) => void;
  closeAddSheet: () => void;
  setUserId: (id: string | null) => void;
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useStore = create<KwentaKoStore>()(
  persist(
    (set, get) => ({
      // ── Initial Data
      accounts: DEFAULT_ACCOUNTS,
      transactions: [],
      categories: DEFAULT_CATEGORIES,
      budgets: [],
      settings: {
        theme: 'system',
        currency: 'PHP',
        defaultAccountId: 'acc-cash',
        analyticsDefaultPeriod: 'month',
        hasSeededData: false,
        categoryLimit: 8,
      },

      // ── UI State (reset on each load)
      toasts: [],
      isAddSheetOpen: false,
      editingTransactionId: null,
      balanceVisible: true,
      userId: null,

      toggleBalanceVisibility: () => set((s) => ({ balanceVisible: !s.balanceVisible })),

      // ── Account Actions
      addAccount: (account) => {
        set((s) => ({ accounts: [...s.accounts, account] }));
        supabase.from('accounts').insert({
          client_id: account.id,
          name: account.name,
          type: account.type,
          currency: account.currency,
          icon: account.icon,
          color: account.color,
          is_active: account.isActive,
          created_at: account.createdAt,
        }).then(({ error }: any) => error && console.error(error));
      },

      updateAccount: (id, updates) => {
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, ...updates } : a,
          ),
        }));
        // We need to map camelCase updates to snake_case for Supabase
        const payload: any = { ...updates };
        if ('isActive' in payload) { payload.is_active = payload.isActive; delete payload.isActive; }
        if ('createdAt' in payload) { payload.created_at = payload.createdAt; delete payload.createdAt; }
        supabase.from('accounts').update(payload).eq('client_id', id).then(({ error }: any) => error && console.error(error));
      },

      deleteAccount: (id) => {
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
        }));
        supabase.from('accounts').delete().eq('client_id', id).then(({ error }: any) => error && console.error(error));
      },

      // ── Transaction Actions
      addTransaction: (transaction) => {
        set((s) => ({
          transactions: [...s.transactions, transaction],
        }));
        supabase.from('transactions').insert({
          client_id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          account_id: transaction.accountId,
          to_account_id: transaction.toAccountId,
          category_id: transaction.categoryId,
          note: transaction.note,
          date: transaction.date,
          transfer_group_id: transaction.transferGroupId,
          created_at: transaction.createdAt,
          updated_at: transaction.updatedAt,
        }).then(({ error }: any) => error && console.error(error));
      },

      addTransactions: (transactions) => {
        set((s) => ({
          transactions: [...s.transactions, ...transactions],
        }));
        const payload = transactions.map(t => ({
          client_id: t.id, type: t.type, amount: t.amount, account_id: t.accountId,
          to_account_id: t.toAccountId, category_id: t.categoryId, note: t.note,
          date: t.date, transfer_group_id: t.transferGroupId, created_at: t.createdAt,
          updated_at: t.updatedAt,
        }));
        supabase.from('transactions').insert(payload).then(({ error }: any) => error && console.error(error));
      },

      updateTransaction: (id, updates) => {
        const updatedAt = new Date().toISOString();
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt } : t,
          ),
        }));
        
        const payload: any = { ...updates, updated_at: updatedAt };
        if ('accountId' in payload) { payload.account_id = payload.accountId; delete payload.accountId; }
        if ('toAccountId' in payload) { payload.to_account_id = payload.toAccountId; delete payload.toAccountId; }
        if ('categoryId' in payload) { payload.category_id = payload.categoryId; delete payload.categoryId; }
        if ('transferGroupId' in payload) { payload.transfer_group_id = payload.transferGroupId; delete payload.transferGroupId; }
        if ('createdAt' in payload) { payload.created_at = payload.createdAt; delete payload.createdAt; }
        supabase.from('transactions').update(payload).eq('client_id', id).then(({ error }: any) => error && console.error(error));
      },

      deleteTransaction: (id) => {
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        }));
        supabase.from('transactions').delete().eq('client_id', id).then(({ error }: any) => error && console.error(error));
      },

      deleteTransactionPair: (transferGroupId) => {
        set((s) => ({
          transactions: s.transactions.filter(
            (t) => t.transferGroupId !== transferGroupId,
          ),
        }));
        supabase.from('transactions').delete().eq('transfer_group_id', transferGroupId).then(({ error }: any) => error && console.error(error));
      },

      // ── Category Actions
      addCategory: (category) => {
        set((s) => ({ categories: [...s.categories, category] }));
        supabase.from('categories').insert({
          client_id: category.id, name: category.name, icon: category.icon,
          color: category.color, type: category.type, is_default: category.isDefault,
          is_active: category.isActive, sort_order: category.sortOrder,
        }).then(({ error }: any) => error && console.error(error));
      },

      updateCategory: (id, updates) => {
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        }));
        const payload: any = { ...updates };
        if ('isDefault' in payload) { payload.is_default = payload.isDefault; delete payload.isDefault; }
        if ('isActive' in payload) { payload.is_active = payload.isActive; delete payload.isActive; }
        if ('sortOrder' in payload) { payload.sort_order = payload.sortOrder; delete payload.sortOrder; }
        supabase.from('categories').update(payload).eq('client_id', id).then(({ error }: any) => error && console.error(error));
      },

      deleteCategory: (id) => {
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
        }));
        supabase.from('categories').delete().eq('client_id', id).then(({ error }: any) => error && console.error(error));
      },

      reorderCategory: (sourceIndex, destinationIndex) => {
        set((s) => {
          const cats = [...s.categories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          
          if (sourceIndex < 0 || sourceIndex >= cats.length || destinationIndex < 0 || destinationIndex >= cats.length) {
            return s;
          }
          
          const [moved] = cats.splice(sourceIndex, 1);
          cats.splice(destinationIndex, 0, moved);
          
          const updatedCats = cats.map((c, i) => ({ ...c, sortOrder: i + 1 }));
          
          updatedCats.forEach(c => {
             supabase.from('categories').update({ sort_order: c.sortOrder }).eq('client_id', c.id).then(({ error }: any) => error && console.error(error));
          });
          
          return { categories: updatedCats };
        });
      },

      // ── Budget Actions
      addBudget: (budget) => {
        set((s) => {
          const filtered = s.budgets.filter((b) => b.categoryId !== budget.categoryId);
          return { budgets: [...filtered, budget] };
        });
      },
      deleteBudget: (id) => {
        set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
      },

      // ── Settings Actions
      updateSettings: (updates) => {
        set((s) => {
          const newSettings = { ...s.settings, ...updates };
          
          // Sync profile to Supabase
          supabase.auth.getUser().then(({ data }: any) => {
            if (data.user) {
              const payload: any = {};
              if ('userName' in updates) payload.user_name = updates.userName;
              if ('theme' in updates) payload.theme = updates.theme;
              if ('currency' in updates) payload.currency = updates.currency;
              if ('defaultAccountId' in updates) payload.default_account_id = updates.defaultAccountId;
              if ('analyticsDefaultPeriod' in updates) payload.analytics_default_period = updates.analyticsDefaultPeriod;
              if ('hasSeededData' in updates) payload.has_seeded_data = updates.hasSeededData;
              
              if (Object.keys(payload).length > 0) {
                supabase.from('profiles').update(payload).eq('id', data.user.id).then(({ error }: any) => error && console.error(error));
              }
            }
          });

          return { settings: newSettings };
        });
      },

      setTheme: (theme) => {
        set((s) => ({ settings: { ...s.settings, theme } }));
        supabase.auth.getUser().then(({ data }: any) => {
          if (data.user) supabase.from('profiles').update({ theme }).eq('id', data.user.id).then(({ error }: any) => error && console.error(error));
        });
      },

      clearAllData: () => {
        set({
          transactions: [],
          settings: {
            theme: 'system',
            currency: 'PHP',
            defaultAccountId: null,
            analyticsDefaultPeriod: 'month',
            hasSeededData: false,
            categoryLimit: 8,
          },
        });
        // We do not auto-clear the Supabase tables here to prevent accidental total data loss,
        // unless explicitly requested, but for now we just clear local cache.
      },

      initSync: async () => {
        try {
          const { data: user } = await supabase.auth.getUser();
          if (!user.user) return;
          
          // Fetch all data in parallel
          const [accountsRes, categoriesRes, transactionsRes, profilesRes] = await Promise.all([
            supabase.from('accounts').select('*'),
            supabase.from('categories').select('*'),
            supabase.from('transactions').select('*'),
            supabase.from('profiles').select('*').single()
          ]);

          const stateUpdates: Partial<KwentaKoStore> = {};

          if (accountsRes.data && accountsRes.data.length > 0) {
            stateUpdates.accounts = accountsRes.data.map((row: any) => ({
              id: row.client_id, name: row.name, type: row.type, currency: row.currency,
              icon: row.icon, color: row.color, isActive: row.is_active, createdAt: row.created_at
            }));
          }

          if (categoriesRes.data && categoriesRes.data.length > 0) {
            stateUpdates.categories = categoriesRes.data.map((row: any) => ({
              id: row.client_id, name: row.name, icon: row.icon, color: row.color, type: row.type,
              isDefault: row.is_default, isActive: row.is_active, sortOrder: row.sort_order
            }));
          }

          if (transactionsRes.data && transactionsRes.data.length > 0) {
            stateUpdates.transactions = transactionsRes.data.map((row: any) => ({
              id: row.client_id, type: row.type, amount: row.amount, accountId: row.account_id,
              toAccountId: row.to_account_id, categoryId: row.category_id, note: row.note,
              date: row.date, transferGroupId: row.transfer_group_id, createdAt: row.created_at, updatedAt: row.updated_at
            }));
          }

          if (profilesRes.data) {
            const p = profilesRes.data;
            stateUpdates.settings = {
              theme: p.theme, currency: p.currency, defaultAccountId: p.default_account_id,
              analyticsDefaultPeriod: p.analytics_default_period, hasSeededData: p.has_seeded_data,
              userName: p.user_name,
              categoryLimit: get().settings.categoryLimit
            };
          }

          if (Object.keys(stateUpdates).length > 0) {
            set(stateUpdates);
          }
        } catch (err) {
          console.error("Sync failed:", err);
        }
      },

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

      setUserId: (userId) => set({ userId }),
    }),
    {
      name: 'kwentako-store',
      storage: createJSONStorage(() => localStorage),
      // Don't persist UI state
      partialize: (s) => ({
        accounts: s.accounts,
        transactions: s.transactions,
        categories: s.categories,
        budgets: s.budgets,
        settings: s.settings,
        balanceVisible: s.balanceVisible,
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
export const useUserId = () => useStore((s) => s.userId);
