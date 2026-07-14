// ─── Account ────────────────────────────────────────────────────────────────

export type AccountType =
  | 'bank'
  | 'digital_bank'
  | 'e_wallet'
  | 'cash'
  | 'savings'
  | 'investment'
  | 'other';

export type CurrencyCode = 'PHP' | 'USD' | 'EUR' | 'JPY' | 'GBP' | 'SGD' | 'AUD';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  PHP: '₱', USD: '$', EUR: '€', JPY: '¥', GBP: '£', SGD: 'S$', AUD: 'A$',
};

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  icon: string;       // FA class e.g. "fa-money-bill-wave"
  color: string;      // hex
  isActive: boolean;
  createdAt: string;  // ISO
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;           // integer, centavos (e.g. 150050 = ₱1,500.50)
  accountId: string;        // source account
  toAccountId?: string;     // destination — transfers only
  categoryId: string;
  note?: string;
  date: string;             // ISO (user-editable)
  transferGroupId?: string; // links debit+credit pair
  createdAt: string;
  updatedAt: string;
}

// ─── Category ────────────────────────────────────────────────────────────────

export type CategoryType = 'income' | 'expense' | 'both';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

// ─── App State ───────────────────────────────────────────────────────────────

export type PeriodFilter = 'today' | 'week' | 'month' | 'year';
export type ThemeMode = 'system' | 'light' | 'dark' | 'amoled' | 'cozy';
export type AnalyticsPeriod = 'week' | 'month' | 'year' | 'custom';

export interface AppSettings {
  theme: ThemeMode;
  currency: 'PHP';
  defaultAccountId: string | null;
  analyticsDefaultPeriod: AnalyticsPeriod;
  hasSeededData: boolean;
  categoryLimit: number | 'all';
  userName?: string;
}

// ─── Budget ──────────────────────────────────────────────────────────────────

export interface Budget {
  id: string;
  title: string;           // user-defined label
  categoryId: string;
  amount: number;          // centavos
  period: 'monthly' | 'weekly' | 'daily' | 'custom';
  startDate: string;       // ISO string
  endDate: string;         // ISO string
  isRecurring: boolean;    // false = one-time / custom; true = daily|weekly|monthly
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ─── Offline Queue ───────────────────────────────────────────────────────────

export type MutationOp = 'add_transaction' | 'update_transaction' | 'delete_transaction'
  | 'add_account' | 'update_account' | 'delete_account'
  | 'add_category' | 'update_category' | 'delete_category';

export interface PendingMutation {
  id: string;
  op: MutationOp;
  payload: Record<string, unknown>;
  createdAt: string;
}

// ─── Recurring Transactions ──────────────────────────────────────────────────

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;           // centavos
  accountId: string;
  toAccountId?: string;
  categoryId: string;
  note?: string;
  frequency: RecurringFrequency;
  startDate: string;        // ISO — when to start generating
  lastAppliedDate?: string; // ISO — last date a txn was auto-created
  isActive: boolean;
  createdAt: string;
}
