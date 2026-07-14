/**
 * useStore.ts
 * Central Zustand store with localStorage persistence.
 * Manages accounts, transactions, categories, settings, and UI state.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { addDays, addWeeks, addMonths, parseISO, isBefore, startOfDay, format } from 'date-fns';
import type {
  Account,
  Transaction,
  Category,
  AppSettings,
  ToastMessage,
  ThemeMode,
  Budget,
  PendingMutation,
  RecurringTransaction,
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
  recurrings: RecurringTransaction[];
  settings: AppSettings;
  userId: string | null;
  offlineQueue: PendingMutation[];

  // ── UI State (NOT persisted)
  toasts: ToastMessage[];
  isAddSheetOpen: boolean;
  editingTransactionId: string | null;
  balanceVisible: boolean;
  prefillCategoryId: string | null;

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
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // ── Recurring Actions
  addRecurring: (r: RecurringTransaction) => void;
  updateRecurring: (id: string, updates: Partial<RecurringTransaction>) => void;
  deleteRecurring: (id: string) => void;
  applyDueRecurrings: () => void;

  // ── Settings Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  setTheme: (theme: ThemeMode) => void;
  clearAllData: () => void;
  
  // ── Cloud Sync
  initSync: () => Promise<void>;
  flushOfflineQueue: () => Promise<void>;
  _queueMutation: (op: string, payload: Record<string, unknown>) => void;


  // ── UI Actions
  showToast: (message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
  openAddSheet: (editId?: string, prefillCategoryId?: string) => void;
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
      recurrings: [],
      offlineQueue: [],
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
      prefillCategoryId: null,
      userId: null,

      toggleBalanceVisibility: () => set((s) => ({ balanceVisible: !s.balanceVisible })),

      // ── Account Actions
      addAccount: (account) => {
        set((s) => ({ accounts: [...s.accounts, account] }));
        if (!navigator.onLine) {
          get()._queueMutation('add_account', { account });
          return;
        }
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
        if (!navigator.onLine) { get()._queueMutation('update_account', { id, updates }); return; }
        const payload: any = { ...updates };
        if ('isActive' in payload) { payload.is_active = payload.isActive; delete payload.isActive; }
        if ('createdAt' in payload) { payload.created_at = payload.createdAt; delete payload.createdAt; }
        supabase.from('accounts').update(payload).eq('client_id', id).then(({ error }: any) => error && console.error(error));
      },

      deleteAccount: (id) => {
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
        }));
        if (!navigator.onLine) { get()._queueMutation('delete_account', { id }); return; }
        supabase.from('accounts').delete().eq('client_id', id).then(({ error }: any) => error && console.error(error));
      },

      // ── Transaction Actions
      addTransaction: (transaction) => {
        set((s) => ({
          transactions: [...s.transactions, transaction],
        }));
        if (!navigator.onLine) { get()._queueMutation('add_transaction', { transaction }); return; }
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
        if (!navigator.onLine) { get()._queueMutation('update_transaction', { id, updates }); return; }
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
        if (!navigator.onLine) { get()._queueMutation('delete_transaction', { id }); return; }
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
        if (!navigator.onLine) { get()._queueMutation('add_category', { category }); return; }
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
        if (!navigator.onLine) { get()._queueMutation('update_category', { id, updates }); return; }
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
        if (!navigator.onLine) { get()._queueMutation('delete_category', { id }); return; }
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
          const exists = s.budgets.some((b) => b.categoryId === budget.categoryId);
          if (exists) {
            // Error handled by component, but we enforce state integrity here
            return s;
          }
          return { budgets: [...s.budgets, budget] };
        });
      },
      updateBudget: (id, updates) => {
        set((s) => ({
          budgets: s.budgets.map((b) => b.id === id ? { ...b, ...updates } : b),
        }));
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

      // ── Recurring Actions
      addRecurring: (r) => set((s) => ({ recurrings: [...s.recurrings, r] })),
      updateRecurring: (id, updates) => set((s) => ({
        recurrings: s.recurrings.map((r) => r.id === id ? { ...r, ...updates } : r),
      })),
      deleteRecurring: (id) => set((s) => ({
        recurrings: s.recurrings.filter((r) => r.id !== id),
      })),

      applyDueRecurrings: () => {
        const { recurrings, transactions } = get();
        const today = startOfDay(new Date());
        const todayISO = format(today, 'yyyy-MM-dd');

        for (const r of recurrings) {
          if (!r.isActive) continue;
          const lastApplied = r.lastAppliedDate
            ? startOfDay(parseISO(r.lastAppliedDate))
            : startOfDay(parseISO(r.startDate));

          let nextDate = lastApplied;
          const toCreate: Date[] = [];

          // Walk forward from lastApplied to today, collecting due dates
          let safety = 0;
          while (isBefore(nextDate, today) && safety < 366) {
            safety++;
            if (r.frequency === 'daily') nextDate = addDays(nextDate, 1);
            else if (r.frequency === 'weekly') nextDate = addWeeks(nextDate, 1);
            else nextDate = addMonths(nextDate, 1);

            if (!isBefore(nextDate, today) && nextDate.toDateString() !== today.toDateString()) break;

            // Avoid duplicates — check if a txn with same recurringId + date exists
            const alreadyExists = transactions.some(
              (t) => t.note?.includes(`[rec:${r.id}]`) && t.date.startsWith(format(nextDate, 'yyyy-MM-dd'))
            );
            if (!alreadyExists) toCreate.push(nextDate);
          }

          if (toCreate.length === 0) continue;

          const now = new Date().toISOString();
          for (const d of toCreate) {
            const txn: Transaction = {
              id: crypto.randomUUID(),
              type: r.type,
              amount: r.amount,
              accountId: r.accountId,
              toAccountId: r.toAccountId,
              categoryId: r.categoryId,
              note: `${r.note ? r.note + ' ' : ''}[rec:${r.id}]`,
              date: d.toISOString(),
              createdAt: now,
              updatedAt: now,
            };
            get().addTransaction(txn);
          }

          // Update lastAppliedDate
          get().updateRecurring(r.id, { lastAppliedDate: todayISO });
        }
      },

      // ── Offline Queue (internal helper — not exposed in interface directly)
      _queueMutation: (op: string, payload: Record<string, unknown>) => {
        const mutation: PendingMutation = {
          id: crypto.randomUUID(),
          op: op as any,
          payload,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ offlineQueue: [...s.offlineQueue, mutation] }));
      },

      flushOfflineQueue: async () => {
        const queue = get().offlineQueue;
        if (queue.length === 0) return;

        const failed: PendingMutation[] = [];
        for (const mutation of queue) {
          try {
            await applyMutation(mutation);
          } catch {
            failed.push(mutation);
          }
        }
        set({ offlineQueue: failed });
        if (failed.length === 0 && queue.length > 0) {
          get().showToast(`${queue.length} change${queue.length !== 1 ? 's' : ''} synced ✓`, 'success');
        }
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
      openAddSheet: (editId, prefillCatId) =>
        set({ isAddSheetOpen: true, editingTransactionId: editId ?? null, prefillCategoryId: prefillCatId ?? null }),

      closeAddSheet: () =>
        set({ isAddSheetOpen: false, editingTransactionId: null, prefillCategoryId: null }),

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
        recurrings: s.recurrings,
        offlineQueue: s.offlineQueue,
        settings: s.settings,
        balanceVisible: s.balanceVisible,
        userId: s.userId,
      }),
    },
  ),
);

// ─── applyMutation ───────────────────────────────────────────────────────────────

async function applyMutation(mutation: PendingMutation): Promise<void> {
  const { op, payload } = mutation;
  if (op === 'add_transaction') {
    const t = payload.transaction as Transaction;
    await supabase.from('transactions').insert({
      client_id: t.id, type: t.type, amount: t.amount, account_id: t.accountId,
      to_account_id: t.toAccountId, category_id: t.categoryId, note: t.note,
      date: t.date, transfer_group_id: t.transferGroupId, created_at: t.createdAt, updated_at: t.updatedAt,
    });
  } else if (op === 'update_transaction') {
    const { id, updates } = payload as { id: string; updates: any };
    const p: any = { ...updates, updated_at: new Date().toISOString() };
    if ('accountId' in p) { p.account_id = p.accountId; delete p.accountId; }
    if ('toAccountId' in p) { p.to_account_id = p.toAccountId; delete p.toAccountId; }
    if ('categoryId' in p) { p.category_id = p.categoryId; delete p.categoryId; }
    await supabase.from('transactions').update(p).eq('client_id', id);
  } else if (op === 'delete_transaction') {
    await supabase.from('transactions').delete().eq('client_id', payload.id);
  } else if (op === 'add_account') {
    const a = payload.account as Account;
    await supabase.from('accounts').insert({
      client_id: a.id, name: a.name, type: a.type, currency: a.currency,
      icon: a.icon, color: a.color, is_active: a.isActive, created_at: a.createdAt,
    });
  } else if (op === 'update_account') {
    const { id, updates } = payload as { id: string; updates: any };
    const p: any = { ...updates };
    if ('isActive' in p) { p.is_active = p.isActive; delete p.isActive; }
    await supabase.from('accounts').update(p).eq('client_id', id);
  } else if (op === 'delete_account') {
    await supabase.from('accounts').delete().eq('client_id', payload.id);
  } else if (op === 'add_category') {
    const c = payload.category as Category;
    await supabase.from('categories').insert({
      client_id: c.id, name: c.name, icon: c.icon, color: c.color,
      type: c.type, is_default: c.isDefault, is_active: c.isActive, sort_order: c.sortOrder,
    });
  } else if (op === 'update_category') {
    const { id, updates } = payload as { id: string; updates: any };
    const p: any = { ...updates };
    if ('isDefault' in p) { p.is_default = p.isDefault; delete p.isDefault; }
    if ('isActive' in p) { p.is_active = p.isActive; delete p.isActive; }
    if ('sortOrder' in p) { p.sort_order = p.sortOrder; delete p.sortOrder; }
    await supabase.from('categories').update(p).eq('client_id', id);
  } else if (op === 'delete_category') {
    await supabase.from('categories').delete().eq('client_id', payload.id);
  }
}

// ─── Selector Hooks (for performance) ────────────────────────────────────────────────

export const useAccounts = () => useStore((s) => s.accounts);
export const useTransactions = () => useStore((s) => s.transactions);
export const useCategories = () => useStore((s) => s.categories);
export const useSettings = () => useStore((s) => s.settings);
export const useToasts = () => useStore((s) => s.toasts);
export const useIsAddSheetOpen = () => useStore((s) => s.isAddSheetOpen);
export const useEditingTransactionId = () => useStore((s) => s.editingTransactionId);
export const useUserId = () => useStore((s) => s.userId);
export const useRecurrings = () => useStore((s) => s.recurrings);
export const useOfflineQueue = () => useStore((s) => s.offlineQueue);
