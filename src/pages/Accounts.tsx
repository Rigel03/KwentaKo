import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { getNetWorth, getAccountBalance } from '../utils/calculations';
import { formatPHP } from '../utils/currency';
import EmptyState from '../components/ui/EmptyState';
import TransactionRow from '../components/ui/TransactionRow';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { Account, AccountType } from '../types';

const ACCOUNT_TYPES: { id: AccountType; label: string; icon: string }[] = [
  { id: 'cash',         label: 'Cash',         icon: 'fa-money-bill-wave'       },
  { id: 'e_wallet',     label: 'E-Wallet',     icon: 'fa-mobile-screen-button'  },
  { id: 'bank',         label: 'Bank',         icon: 'fa-building-columns'      },
  { id: 'digital_bank', label: 'Digital Bank', icon: 'fa-building-columns'      },
  { id: 'savings',      label: 'Savings',      icon: 'fa-piggy-bank'            },
  { id: 'investment',   label: 'Investment',   icon: 'fa-chart-line'            },
  { id: 'other',        label: 'Other',        icon: 'fa-circle-question'       },
];

const PRESET_COLORS = [
  // Primary
  '#007AFF', '#34C759', '#FF3B30', '#FF9F0A', '#AF52DE',
  '#FF2D55', '#5AC8FA', '#30B0C7', '#5856D6', '#32ADE6',
  // Darker
  '#005bb5', '#248a3d', '#b32420', '#cc7a00', '#7b319c',
  '#b31f3b', '#3d94ba', '#1f8296', '#3c3a99', '#217ca6',
  // Lighter
  '#66a8ff', '#70d689', '#ff7a73', '#ffc266', '#d08ceb',
  '#ff7a94', '#93dcfc', '#71cddb', '#8f8deb', '#75c8f0',
  // Grays
  '#636366', '#1C1C1E',
];

function AccountForm({
  initial, onSave, onCancel,
}: {
  initial?: Partial<Account>;
  onSave: (a: Omit<Account, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [name,  setName]  = useState(initial?.name  ?? '');
  const [type,  setType]  = useState<AccountType>(initial?.type  ?? 'cash');
  const [color, setColor] = useState(initial?.color ?? '#007AFF');
  const [showMoreColors, setShowMoreColors] = useState(false);
  const icon  = ACCOUNT_TYPES.find((t) => t.id === type)?.icon ?? 'fa-circle-question';
  const valid = name.trim().length > 0;
  const visibleColors = showMoreColors ? PRESET_COLORS : PRESET_COLORS.slice(0, 10);

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onCancel}
      />
      <div
        className="sheet-panel animate-fade-in"
        style={{
          position: 'relative', width: '100%', maxWidth: 400,
          borderRadius: 24, padding: 24,
          maxHeight: '85svh', overflowY: 'auto'
        }}
      >

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>
            {initial?.id ? 'Edit Account' : 'New Account'}
          </p>
          <button onClick={onCancel} className="icon-btn">
            <i className="fa-solid fa-xmark" style={{ fontSize: 16 }} />
          </button>
        </div>

        {/* Preview */}
        <div
          style={{
            background: color,
            borderRadius: 20,
            padding: '20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className={`fa-solid ${icon}`} style={{ color: '#fff', fontSize: 20 }} />
          </div>
          <div>
            <p style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{name || 'Account Name'}</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              {ACCOUNT_TYPES.find((t) => t.id === type)?.label}
            </p>
          </div>
        </div>

        {/* Name */}
        <p className="section-label">Account Name</p>
        <input
          id="account-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. GCash, BPI Savings"
          className="input-field"
          style={{ marginBottom: 16 }}
        />

        {/* Type */}
        <p className="section-label">Account Type</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
          {ACCOUNT_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              style={{
                padding: '10px 8px',
                borderRadius: 14,
                border: type === t.id ? `2px solid var(--text-1)` : '2px solid var(--divider)',
                background: type === t.id ? 'var(--text-1)' : 'var(--surface-2)',
                color: type === t.id ? 'var(--bg)' : 'var(--text-2)',
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 200ms ease',
              }}
            >
              <i className={`fa-solid ${t.icon}`} style={{ fontSize: 14 }} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Color */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p className="section-label" style={{ marginBottom: 0 }}>Color</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
          {visibleColors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 36, height: 36,
                borderRadius: 10,
                backgroundColor: c,
                border: 'none',
                cursor: 'pointer',
                outline: color === c ? `2px solid ${c}` : 'none',
                outlineOffset: 2,
                transition: 'all 200ms ease',
              }}
              aria-label={`Color ${c}`}
            />
          ))}

          {!showMoreColors && (
            <button
              onClick={() => setShowMoreColors(true)}
              style={{
                width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'var(--surface-2)', color: 'var(--text-1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 200ms ease',
              }}
            >
              <i className="fa-solid fa-ellipsis" style={{ fontSize: 16 }} />
            </button>
          )}
        </div>

        <button
          onClick={() => valid && onSave({ name: name.trim(), type, currency: 'PHP', icon, color, isActive: true })}
          disabled={!valid}
          className="btn-primary"
          style={{ opacity: valid ? 1 : 0.4 }}
        >
          {initial?.id ? 'Save Changes' : 'Add Account'}
        </button>
      </div>
    </div>,
    document.body
  );
}

export default function Accounts() {
  const { accounts, transactions, addAccount, updateAccount, deleteAccount, showToast, balanceVisible } = useStore();
  const [showForm,          setShowForm]          = useState(false);
  const [editingAccount,    setEditingAccount]    = useState<Account | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [deleteTarget,      setDeleteTarget]      = useState<Account | null>(null);
  const [isEditMode,        setIsEditMode]        = useState(false);

  const activeAccounts = accounts.filter((a) => a.isActive);
  const netWorth       = getNetWorth(activeAccounts, transactions);

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
    setDeleteTarget(acc); // Always show confirmation
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const accountTxns     = selectedAccount
    ? [...transactions]
        .filter((t) => t.accountId === selectedAccount.id || t.toAccountId === selectedAccount.id)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <div className="min-h-screen animate-fade-in" style={{ backgroundColor: 'var(--bg)' }}>

      {/* Header */}
      <div className="header-container" style={{ paddingBottom: 0, flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, marginBottom: 16 }}>
          <h1 className="header-title">Accounts</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className="icon-btn"
              style={{ 
                width: 40, height: 40, borderRadius: 12, 
                color: isEditMode ? 'var(--bg)' : 'var(--text-1)', 
                background: isEditMode ? 'var(--text-1)' : 'var(--surface-2)' 
              }}
            >
              {isEditMode ? <i className="fa-solid fa-check" style={{ fontSize: 16 }} /> : <i className="fa-solid fa-pen" style={{ fontSize: 16 }} />}
            </button>
            <button
              id="add-account-btn"
              onClick={() => { setEditingAccount(null); setShowForm(true); }}
              className="icon-btn"
              style={{ width: 40, height: 40, borderRadius: 12 }}
            >
              <i className="fa-solid fa-plus" style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>

        {/* Net Worth Seamless Text */}
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: 'var(--text-3)', fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
            Total Net Worth
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <p style={{ 
              color: 'var(--text-1)', fontSize: 32, fontWeight: 700, letterSpacing: -1,
              filter: balanceVisible ? 'none' : 'blur(12px)', transition: 'filter 0.3s ease'
            }}>
              {formatPHP(netWorth)}
            </p>
            <p style={{ color: 'var(--text-3)', fontSize: 12, fontWeight: 500 }}>
              {activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Account Cards */}
      <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {accounts.length === 0 ? (
          <div className="card" style={{ marginTop: 8 }}>
            <EmptyState
              icon="fa-wallet"
              title="No Accounts Yet"
              description="Add your wallets and bank accounts here — Cash, GCash, Maya, BPI, and more."
              actionLabel="Add First Account"
              onAction={() => setShowForm(true)}
            />
          </div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc.id}
              style={{ position: 'relative' }}
              className="group"
            >
              {/* Account Card */}
              <button
                onClick={() => setSelectedAccountId(acc.id === selectedAccountId ? null : acc.id)}
                style={{
                  width: '100%',
                  background: acc.color,
                  borderRadius: 16,
                  padding: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'transform 200ms var(--ease-spring)',
                }}
                className="active:scale-[0.97]"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`fa-solid ${acc.icon}`} style={{ color: '#fff', fontSize: 16 }} />
                  </div>
                  
                  {!isEditMode && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: -0.5 }}>
                        {acc.name}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {ACCOUNT_TYPES.find((t) => t.id === acc.type)?.label ?? acc.type}
                      </p>
                    </div>
                  )}

                  {isEditMode && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingAccount(acc); setShowForm(true); }}
                        style={{
                          width: 32, height: 32, borderRadius: 10,
                          background: 'rgba(255,255,255,0.2)',
                          border: 'none', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <i className="fa-solid fa-pen" style={{ fontSize: 12 }} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(acc); }}
                        style={{
                          width: 32, height: 32, borderRadius: 10,
                          background: 'var(--expense)',
                          border: 'none', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(255,59,48,0.4)',
                        }}
                      >
                        <i className="fa-solid fa-trash" style={{ fontSize: 12 }} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <p style={{ 
                    color: '#fff', fontSize: 26, fontWeight: 800, letterSpacing: -1,
                    filter: balanceVisible ? 'none' : 'blur(10px)', transition: 'filter 0.3s ease'
                  }}>
                    {formatPHP(getAccountBalance(acc.id, transactions))}
                  </p>
                </div>
                {!acc.isActive && (
                  <span style={{
                    display: 'inline-block', marginTop: 8,
                    padding: '2px 8px', borderRadius: 99,
                    background: 'rgba(0,0,0,0.2)',
                    color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600,
                  }}>
                    INACTIVE
                  </span>
                )}
              </button>

              {/* Expandable transaction list */}
              {selectedAccountId === acc.id && (
                <div
                  className="card animate-slide-up"
                  style={{ marginTop: 8, padding: 0, overflow: 'hidden' }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                      {accountTxns.length} transaction{accountTxns.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {accountTxns.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '24px', fontSize: 13, color: 'var(--text-3)' }}>
                      No transactions for this account.
                    </p>
                  ) : (
                    accountTxns.slice(0, 20).map((t) => (
                      <TransactionRow key={t.id} transaction={t} showAccount={false} />
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Account Form */}
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
        title="Delete Account?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? If it has transactions, they will also be deleted. This cannot be undone.`}
        confirmLabel="Delete Account"
        isDangerous
        onConfirm={() => {
          if (deleteTarget) {
            deleteAccount(deleteTarget.id);
            showToast('Account deleted');
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
