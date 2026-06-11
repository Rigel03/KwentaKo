import { useState } from 'react';
import { useStore } from '../store/useStore';
import { getNetWorth } from '../utils/calculations';
import { formatPHP } from '../utils/currency';
import AccountCard from '../components/ui/AccountCard';
import EmptyState from '../components/ui/EmptyState';
import TransactionRow from '../components/ui/TransactionRow';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { Account, AccountType } from '../types';

const ACCOUNT_TYPES: { id: AccountType; label: string; icon: string }[] = [
  { id: 'cash',         label: 'Cash',         icon: 'fa-money-bill-wave' },
  { id: 'e_wallet',     label: 'E-Wallet',     icon: 'fa-mobile-screen-button' },
  { id: 'bank',         label: 'Bank',         icon: 'fa-building-columns' },
  { id: 'digital_bank', label: 'Digital Bank', icon: 'fa-building-columns' },
  { id: 'savings',      label: 'Savings',      icon: 'fa-piggy-bank' },
  { id: 'investment',   label: 'Investment',   icon: 'fa-chart-line' },
  { id: 'other',        label: 'Other',        icon: 'fa-circle-question' },
];

const PRESET_COLORS = [
  '#2563EB', '#16A34A', '#EF4444', '#F97316', '#EAB308',
  '#8B5CF6', '#EC4899', '#0891B2', '#7C3AED', '#14B8A6',
  '#94A3B8', '#1E3A8A',
];

function AccountForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Account>;
  onSave: (a: Omit<Account, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<AccountType>(initial?.type ?? 'cash');
  const [color, setColor] = useState(initial?.color ?? '#2563EB');
  const icon = ACCOUNT_TYPES.find((t) => t.id === type)?.icon ?? 'fa-circle-question';

  const valid = name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-3xl p-6 space-y-4 animate-slide-up max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {initial?.id ? 'Edit Account' : 'New Account'}
          </h3>
          <button onClick={onCancel} className="btn-ghost p-2">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Name */}
        <div>
          <p className="section-label">Account Name</p>
          <input
            id="account-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. GCash, BPI Savings"
            className="input-field"
          />
        </div>

        {/* Type */}
        <div>
          <p className="section-label">Account Type</p>
          <div className="grid grid-cols-3 gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`py-2.5 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  type === t.id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <i className={`fa-solid ${t.icon} text-sm`} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <p className="section-label">Color</p>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-xl transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : ''}`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}25` }}>
            <i className={`fa-solid ${icon} text-base`} style={{ color }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{name || 'Account Name'}</p>
            <p className="text-xs text-slate-400">{ACCOUNT_TYPES.find((t) => t.id === type)?.label}</p>
          </div>
        </div>

        <button
          onClick={() => valid && onSave({ name: name.trim(), type, currency: 'PHP', icon, color, isActive: true })}
          disabled={!valid}
          className="btn-primary"
        >
          {initial?.id ? 'Save Changes' : 'Add Account'}
        </button>
      </div>
    </div>
  );
}

export default function Accounts() {
  const { accounts, transactions, addAccount, updateAccount, deleteAccount, showToast } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const netWorth = getNetWorth(accounts.filter((a) => a.isActive), transactions);

  const handleSave = (data: Omit<Account, 'id' | 'createdAt'>) => {
    if (editingAccount) {
      updateAccount(editingAccount.id, data);
      showToast('Account updated ✓');
    } else {
      addAccount({ ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
      showToast('Account added ✓');
    }
    setShowForm(false);
    setEditingAccount(null);
  };

  const handleDelete = (acc: Account) => {
    const hasTxns = transactions.some((t) => t.accountId === acc.id || t.toAccountId === acc.id);
    if (hasTxns) {
      setDeleteTarget(acc);
    } else {
      deleteAccount(acc.id);
      showToast('Account deleted');
    }
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const accountTxns = selectedAccount
    ? [...transactions]
        .filter((t) => t.accountId === selectedAccount.id || t.toAccountId === selectedAccount.id)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Accounts</h1>
          <button
            id="add-account-btn"
            onClick={() => { setEditingAccount(null); setShowForm(true); }}
            className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <i className="fa-solid fa-plus text-sm" />
          </button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Net Worth: <span className="font-bold text-slate-800 dark:text-slate-100">{formatPHP(netWorth)}</span>
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {accounts.length === 0 ? (
          <EmptyState
            icon="fa-wallet"
            title="No Accounts"
            description="Add your first account to start tracking."
            actionLabel="Add Account"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {accounts.map((acc) => (
              <div key={acc.id} className="relative group">
                <AccountCard account={acc} onClick={() => setSelectedAccountId(acc.id)} />
                {/* Edit/Delete overlay */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingAccount(acc); setShowForm(true); }}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 shadow flex items-center justify-center"
                    aria-label="Edit account"
                  >
                    <i className="fa-solid fa-pen text-xs text-slate-500" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(acc); }}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 shadow flex items-center justify-center"
                    aria-label="Delete account"
                  >
                    <i className="fa-solid fa-trash text-xs text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Account Transaction Drawer */}
        {selectedAccount && (
          <div className="card animate-slide-down">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedAccount.name}</p>
                <p className="text-xs text-slate-400">{accountTxns.length} transactions</p>
              </div>
              <button onClick={() => setSelectedAccountId(null)} className="btn-ghost p-2">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            {accountTxns.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No transactions for this account.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {accountTxns.slice(0, 20).map((t) => (
                  <TransactionRow key={t.id} transaction={t} showAccount={false} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account Form Modal */}
      {showForm && (
        <AccountForm
          initial={editingAccount ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingAccount(null); }}
        />
      )}

      {/* Delete Warning */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Account Has Transactions"
        message={`"${deleteTarget?.name}" has existing transactions. Deleting it will remove all associated transactions. This cannot be undone.`}
        confirmLabel="Delete Anyway"
        isDangerous
        onConfirm={() => {
          if (deleteTarget) {
            deleteAccount(deleteTarget.id);
            showToast('Account and transactions deleted');
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
