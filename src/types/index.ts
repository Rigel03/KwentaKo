// ─── Account ────────────────────────────────────────────────────────────────

export type AccountType =
  | 'bank'
  | 'digital_bank'
  | 'e_wallet'
  | 'cash'
  | 'savings'
  | 'investment'
  | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: 'PHP';
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
  userName?: string;
}

// ─── Budget ──────────────────────────────────────────────────────────────────

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;       // centavos
  period: 'monthly' | 'weekly';
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

