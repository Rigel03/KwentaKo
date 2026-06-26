import { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../../store/useStore';
import { evaluateExpression } from '../../utils/currency';
import NumPad from './NumPad';
import ConfirmDialog from '../ui/ConfirmDialog';
import DateTimePicker from './DateTimePicker';
import type { TransactionType } from '../../types';

const TYPE_CONFIG: Record<TransactionType, { label: string; color: string; icon: string }> = {
  income:   { label: 'Income',   color: 'var(--income)',   icon: 'fa-arrow-down'  },
  expense:  { label: 'Expense',  color: 'var(--expense)',  icon: 'fa-arrow-up'    },
  transfer: { label: 'Transfer', color: 'var(--transfer)', icon: 'fa-right-left'  },
};

export default function AddEntrySheet() {
  const {
    accounts, transactions, categories,
    addTransaction, updateTransaction, deleteTransaction, deleteTransactionPair,
    closeAddSheet, showToast, editingTransactionId,
  } = useStore();

  const editingTxn = editingTransactionId
    ? transactions.find((t) => t.id === editingTransactionId)
    : null;

  const [type,         setType]         = useState<TransactionType>(editingTxn?.type ?? 'expense');
  const [expression,   setExpression]   = useState(editingTxn ? String(editingTxn.amount / 100) : '');
  const [evaluatedAmount, setEvaluatedAmount] = useState(editingTxn?.amount ?? 0);
  const [accountId,    setAccountId]    = useState(
    editingTxn?.accountId ?? accounts.find((a) => a.isActive)?.id ?? '',
  );
  const [toAccountId,  setToAccountId]  = useState(
    editingTxn?.toAccountId ?? accounts.find((a) => a.isActive && a.id !== accountId)?.id ?? '',
  );
  const [categoryId,   setCategoryId]   = useState(editingTxn?.categoryId ?? '');
  const [note,         setNote]         = useState(editingTxn?.note ?? '');
  const [date,         setDate]         = useState(editingTxn ? parseISO(editingTxn.date) : new Date());
  const [showDeleteConfirm,         setShowDeleteConfirm]         = useState(false);
  const [showTransferDeleteConfirm, setShowTransferDeleteConfirm] = useState(false);
  const [showDatePicker,            setShowDatePicker]            = useState(false);

  const noteRef = useRef<HTMLInputElement>(null);
  const cfg     = TYPE_CONFIG[type];

  const liveAmount     = evaluateExpression(expression);
  const displayAmount  = liveAmount > 0 ? liveAmount : evaluatedAmount;
  const activeAccounts = accounts.filter((a) => a.isActive);
  const filteredCats   = categories.filter(
    (c) => c.isActive && (c.type === type || c.type === 'both') && (type !== 'transfer' || c.type === 'both'),
  );
  const isValid =
    displayAmount > 0 &&
    accountId !== '' &&
    categoryId !== '' &&
    (type !== 'transfer' || (toAccountId !== '' && toAccountId !== accountId));

  const handleEvaluate = () => {
    const val = evaluateExpression(expression);
    setEvaluatedAmount(val);
    setExpression(val > 0 ? String(val / 100) : '');
  };

  useEffect(() => { if (!editingTxn) setCategoryId(''); }, [type]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handle = () => closeAddSheet();
    window.addEventListener('popstate', handle);
    return () => window.removeEventListener('popstate', handle);
  }, [closeAddSheet]);

  const handleClose = () => window.history.back();

  const handleSave = () => {
    if (!isValid || displayAmount <= 0) return;
    const now     = new Date().toISOString();
    const dateISO = date.toISOString();

    if (editingTxn) {
      updateTransaction(editingTxn.id, {
        type, amount: displayAmount, accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        categoryId, note: note.trim() || undefined, date: dateISO, updatedAt: now,
      });
      showToast('Transaction updated ✓');
    } else if (type === 'transfer') {
      const groupId = crypto.randomUUID();
      addTransaction({
        id: crypto.randomUUID(), type: 'transfer', amount: displayAmount,
        accountId, toAccountId, categoryId, note: note.trim() || undefined,
        date: dateISO, transferGroupId: groupId, createdAt: now, updatedAt: now,
      });
      showToast('Transfer logged ✓');
    } else {
      addTransaction({
        id: crypto.randomUUID(), type, amount: displayAmount,
        accountId, categoryId, note: note.trim() || undefined,
        date: dateISO, createdAt: now, updatedAt: now,
      });
      showToast(type === 'income' ? 'Income logged ✓' : 'Expense logged ✓');
    }
    handleClose();
  };

  const handleDelete = () => {
    if (!editingTxn) return;
    if (editingTxn.transferGroupId) setShowTransferDeleteConfirm(true);
    else setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!editingTxn) return;
    deleteTransaction(editingTxn.id);
    showToast('Transaction deleted');
    handleClose();
  };

  const confirmDeletePair = () => {
    if (!editingTxn?.transferGroupId) return;
    deleteTransactionPair(editingTxn.transferGroupId);
    showToast('Transfer deleted');
    handleClose();
  };

  return (
    <>
      {/* Full-screen page */}
      <div
        className="animate-fade-in"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 55,
          backgroundColor: 'var(--bg)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--divider)',
          backgroundColor: 'var(--surface)',
        }}>
          <button onClick={handleClose} className="icon-btn">
            <i className="fa-solid fa-xmark" style={{ fontSize: 18 }} />
          </button>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>
            {editingTxn ? 'Edit Entry' : 'New Entry'}
          </p>
          <button
            id="save-entry-btn"
            onClick={handleSave}
            disabled={!isValid}
            style={{
              padding: '8px 18px',
              borderRadius: 99,
              border: 'none',
              background: isValid ? 'var(--text-1)' : 'var(--surface-3)',
              color: isValid ? 'var(--bg)' : 'var(--text-3)',
              fontSize: 14, fontWeight: 700,
              cursor: isValid ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              transition: 'all 200ms ease',
            }}
          >
            {editingTxn ? 'Update' : 'Save'}
          </button>
        </div>

        {/* Type Selector */}
        <div style={{ padding: '16px 20px 0' }}>
          <div
            style={{
              display: 'flex',
              background: 'var(--surface-2)',
              borderRadius: 14,
              padding: 4,
              gap: 4,
            }}
          >
            {(Object.keys(TYPE_CONFIG) as TransactionType[]).map((t) => {
              const active = type === t;
              return (
                <button
                  key={t}
                  id={`type-tab-${t}`}
                  onClick={() => setType(t)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: 10,
                    border: 'none',
                    background: active ? TYPE_CONFIG[t].color : 'transparent',
                    color: active ? '#fff' : 'var(--text-3)',
                    fontSize: 13, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 220ms ease',
                  }}
                >
                  <i className={`fa-solid ${TYPE_CONFIG[t].icon}`} style={{ fontSize: 12 }} />
                  {TYPE_CONFIG[t].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount Hero */}
        <div style={{ textAlign: 'center', padding: '20px 20px 8px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.5px', marginBottom: 4 }}>
            {expression || 'AMOUNT'}
          </p>
          <p
            id="amount-display"
            style={{
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: -2,
              color: cfg.color,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            ₱ {displayAmount > 0
              ? (displayAmount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '0'}
          </p>
        </div>

        {/* NumPad */}
        <div style={{ padding: '4px 20px 12px' }}>
          <NumPad expression={expression} onChange={setExpression} onEvaluate={handleEvaluate} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--divider)', margin: '0 20px' }} />

        {/* Fields */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

          {/* Account Selector */}
          <div>
            <p className="section-label">
              {type === 'transfer' ? 'From Account' : 'Account'}
            </p>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }} className="scrollbar-hide">
              {activeAccounts.map((acc) => {
                const active = accountId === acc.id;
                return (
                  <button
                    key={acc.id}
                    id={`account-pill-${acc.id}`}
                    onClick={() => setAccountId(acc.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px',
                      borderRadius: 99,
                      border: 'none',
                      background: active ? acc.color : `${acc.color}18`,
                      color: active ? '#fff' : acc.color,
                      fontSize: 13, fontWeight: 600,
                      cursor: 'pointer',
                      flexShrink: 0,
                      fontFamily: 'inherit',
                      transition: 'all 200ms ease',
                    }}
                  >
                    <i className={`fa-solid ${acc.icon}`} style={{ fontSize: 12 }} />
                    {acc.name}
                  </button>
                );
              })}
            </div>

            {type === 'transfer' && (
              <div style={{ marginTop: 10 }}>
                <p className="section-label">To Account</p>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }} className="scrollbar-hide">
                  {activeAccounts.filter((a) => a.id !== accountId).map((acc) => {
                    const active = toAccountId === acc.id;
                    return (
                      <button
                        key={acc.id}
                        id={`to-account-pill-${acc.id}`}
                        onClick={() => setToAccountId(acc.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 14px',
                          borderRadius: 99,
                          border: 'none',
                          background: active ? acc.color : `${acc.color}18`,
                          color: active ? '#fff' : acc.color,
                          fontSize: 13, fontWeight: 600,
                          cursor: 'pointer',
                          flexShrink: 0,
                          fontFamily: 'inherit',
                          transition: 'all 200ms ease',
                        }}
                      >
                        <i className={`fa-solid ${acc.icon}`} style={{ fontSize: 12 }} />
                        {acc.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <p className="section-label">Category</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {filteredCats.map((cat) => {
                const active = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    id={`cat-tile-${cat.id}`}
                    onClick={() => setCategoryId(cat.id)}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: 6, padding: '12px 6px',
                      borderRadius: 14,
                      border: active ? `2px solid ${cat.color}` : '2px solid transparent',
                      background: active ? `${cat.color}18` : 'var(--surface-2)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 200ms ease',
                      transform: active ? 'scale(1.04)' : 'scale(1)',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${cat.color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`fa-solid ${cat.icon}`} style={{ color: cat.color, fontSize: 15 }} />
                    </div>
                    <span style={{
                      fontSize: 10, color: active ? cat.color : 'var(--text-2)',
                      fontWeight: active ? 700 : 500,
                      textAlign: 'center', lineHeight: 1.2,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <p className="section-label">Note</p>
            <input
              ref={noteRef}
              id="note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              className="input-field"
              maxLength={120}
            />
          </div>

          {/* Date */}
          <div>
            <p className="section-label">Date & Time</p>
            <button
              onClick={() => setShowDatePicker(true)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1.5px solid var(--divider)',
                background: 'var(--surface-2)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 150ms ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="fa-solid fa-calendar-days" style={{ color: 'var(--text-3)', fontSize: 14 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>
                  {format(date, 'MMM d, yyyy · h:mm a')}
                </span>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-3)', fontSize: 11 }} />
            </button>
          </div>

          {/* Delete (edit mode) */}
          {editingTxn && (
            <button
              id="delete-entry-btn"
              onClick={handleDelete}
              style={{
                width: '100%', padding: '14px',
                borderRadius: 14, border: '1.5px solid rgba(255,59,48,0.25)',
                background: 'rgba(255,59,48,0.06)',
                color: 'var(--expense)',
                fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <i className="fa-solid fa-trash" />
              Delete Transaction
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Transaction?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        isDangerous
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <ConfirmDialog
        isOpen={showTransferDeleteConfirm}
        title="Delete Transfer?"
        message="This will delete both the debit and credit sides of this transfer."
        confirmLabel="Delete Both"
        isDangerous
        onConfirm={confirmDeletePair}
        onCancel={() => setShowTransferDeleteConfirm(false)}
      />
      {showDatePicker && (
        <DateTimePicker value={date} onChange={(d) => setDate(d)} onClose={() => setShowDatePicker(false)} />
      )}
    </>
  );
}
