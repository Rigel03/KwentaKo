import { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../../store/useStore';
import { evaluateExpression } from '../../utils/currency';
import NumPad from './NumPad';
import DateTimePicker from './DateTimePicker';
import ConfirmDialog from '../ui/ConfirmDialog';
import type { Transaction, TransactionType } from '../../types';

const TYPE_CONFIG = {
  income:   { label: 'Income',   color: 'bg-green-500', tab: 'text-green-600 dark:text-green-400' },
  expense:  { label: 'Expense',  color: 'bg-red-500',   tab: 'text-red-500 dark:text-red-400'     },
  transfer: { label: 'Transfer', color: 'bg-blue-500',  tab: 'text-blue-600 dark:text-blue-400'   },
};

export default function AddEntrySheet() {
  const {
    accounts, transactions, categories,
    addTransaction,
    updateTransaction, deleteTransaction, deleteTransactionPair,
    closeAddSheet, showToast,
    editingTransactionId,
  } = useStore();

  // ── Editing mode
  const editingTxn = editingTransactionId
    ? transactions.find((t) => t.id === editingTransactionId)
    : null;

  // ── Form State
  const [type, setType] = useState<TransactionType>(editingTxn?.type ?? 'expense');
  const [expression, setExpression] = useState(
    editingTxn ? String(editingTxn.amount / 100) : '',
  );
  const [evaluatedAmount, setEvaluatedAmount] = useState(editingTxn?.amount ?? 0);
  const [accountId, setAccountId] = useState(
    editingTxn?.accountId ?? accounts.find((a) => a.isActive)?.id ?? '',
  );
  const [toAccountId, setToAccountId] = useState(
    editingTxn?.toAccountId ?? accounts.find((a) => a.isActive && a.id !== accountId)?.id ?? '',
  );
  const [categoryId, setCategoryId] = useState(editingTxn?.categoryId ?? '');
  const [note, setNote] = useState(editingTxn?.note ?? '');
  const [date, setDate] = useState(
    editingTxn ? parseISO(editingTxn.date) : new Date(),
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferDeleteConfirm, setShowTransferDeleteConfirm] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const noteRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Update evaluated amount when expression changes
  const handleEvaluate = () => {
    const val = evaluateExpression(expression);
    setEvaluatedAmount(val);
    setExpression(val > 0 ? String(val / 100) : '');
  };

  // Sync live eval for display
  const liveAmount = evaluateExpression(expression);

  // Filter categories by type
  const filteredCategories = categories.filter(
    (c) =>
      c.isActive &&
      (c.type === type || c.type === 'both') &&
      (type !== 'transfer' || c.type === 'both'),
  );

  // Active accounts
  const activeAccounts = accounts.filter((a) => a.isActive);

  // Reset category when type changes
  useEffect(() => {
    if (!editingTxn) setCategoryId('');
  }, [type]);

  // ── Intercept Back Button
  useEffect(() => {
    // Push a dummy state so the hardware back button pops this state instead of exiting the app
    window.history.pushState({ sheetOpen: true }, '');

    const handlePopState = () => {
      closeAddSheet();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If the component unmounts (sheet closes) and the history state is still ours, pop it.
      if (window.history.state?.sheetOpen) {
        window.history.back();
      }
    };
  }, [closeAddSheet]);

  // ── Validation
  const displayAmount = liveAmount > 0 ? liveAmount : evaluatedAmount;
  const isValid =
    displayAmount > 0 &&
    accountId !== '' &&
    categoryId !== '' &&
    (type !== 'transfer' || (toAccountId !== '' && toAccountId !== accountId));

  // ── Date navigation (removed — picker handles this now)
  const today = new Date();

  // ── Save
  const handleSave = () => {
    const finalAmount = displayAmount;
    if (!isValid || finalAmount <= 0) return;

    const now = new Date().toISOString();
    const dateISO = date.toISOString();

    if (editingTxn) {
      updateTransaction(editingTxn.id, {
        type, amount: finalAmount, accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        categoryId, note: note.trim() || undefined, date: dateISO, updatedAt: now,
      });
      showToast('Transaction updated ✓');
    } else if (type === 'transfer') {
      const groupId = crypto.randomUUID();
      const debit: Transaction = {
        id: crypto.randomUUID(), type: 'transfer', amount: finalAmount,
        accountId, toAccountId, categoryId, note: note.trim() || undefined,
        date: dateISO, transferGroupId: groupId, createdAt: now, updatedAt: now,
      };
      addTransaction(debit);
      showToast('Transfer logged ✓');
    } else {
      const txn: Transaction = {
        id: crypto.randomUUID(), type, amount: finalAmount,
        accountId, categoryId, note: note.trim() || undefined,
        date: dateISO, createdAt: now, updatedAt: now,
      };
      addTransaction(txn);
      showToast(type === 'income' ? 'Income logged ✓' : 'Expense logged ✓');
    }

    closeAddSheet();
  };

  // ── Delete
  const handleDelete = () => {
    if (!editingTxn) return;
    if (editingTxn.transferGroupId) {
      setShowTransferDeleteConfirm(true);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    if (!editingTxn) return;
    deleteTransaction(editingTxn.id);
    showToast('Transaction deleted');
    closeAddSheet();
  };

  const confirmDeletePair = () => {
    if (!editingTxn?.transferGroupId) return;
    deleteTransactionPair(editingTxn.transferGroupId);
    showToast('Transfer deleted');
    closeAddSheet();
  };

  return (
    <>
      {/* ── Overlay ─────────────────────────────────────────────────────── */}
      <div className="sheet-overlay animate-fade-in" onClick={closeAddSheet} />

      {/* ── Sheet Panel ─────────────────────────────────────────────────── */}
      <div ref={panelRef} className="sheet-panel animate-slide-up">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--surface-3)' }} />
        </div>

        <div className="px-4 pb-8 space-y-5">

          {/* ── Type Selector ────────────────────────────────────────────── */}
          <div className="flex gap-2 rounded-xl p-1" style={{ background: 'var(--surface-2)' }}>
            {(Object.keys(TYPE_CONFIG) as TransactionType[]).map((t) => (
              <button
                key={t}
                id={`type-tab-${t}`}
                onClick={() => setType(t)}
                className={`type-tab ${
                  type === t
                    ? `${TYPE_CONFIG[t].color} text-white shadow-sm`
                    : 'type-tab-inactive'
                }`}
              >
                {TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>

          {/* ── Amount Display ───────────────────────────────────────────── */}
          <div className="text-center py-2">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1 font-mono min-h-4">
              {expression || ''}
            </p>
            <p id="amount-display" className="amount-display">
              ₱ {liveAmount > 0
                ? (liveAmount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : evaluatedAmount > 0
                ? (evaluatedAmount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0'}
            </p>
          </div>

          {/* ── NumPad ──────────────────────────────────────────────────── */}
          <NumPad
            expression={expression}
            onChange={setExpression}
            onEvaluate={handleEvaluate}
          />

          {/* ── Account Selector ─────────────────────────────────────────── */}
          <div>
            <p className="section-label px-0">
              {type === 'transfer' ? 'From Account' : 'Account'}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-0 scrollbar-hide">
              {activeAccounts.map((acc) => (
                <button
                  key={acc.id}
                  id={`account-pill-${acc.id}`}
                  onClick={() => setAccountId(acc.id)}
                  className={`account-pill flex-shrink-0 ${
                    accountId === acc.id ? 'account-pill-selected' : 'bg-white dark:bg-slate-800'
                  }`}
                >
                  <i
                    className={`fa-solid ${acc.icon} text-xs`}
                    style={{ color: acc.color }}
                  />
                  <span>{acc.name}</span>
                </button>
              ))}
            </div>

            {/* Transfer: To Account */}
            {type === 'transfer' && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fa-solid fa-right-left text-blue-500 text-xs" />
                  <p className="section-label mb-0">To Account</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {activeAccounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <button
                        key={acc.id}
                        id={`to-account-pill-${acc.id}`}
                        onClick={() => setToAccountId(acc.id)}
                        className={`account-pill flex-shrink-0 ${
                          toAccountId === acc.id ? 'account-pill-selected' : 'bg-white dark:bg-slate-800'
                        }`}
                      >
                        <i
                          className={`fa-solid ${acc.icon} text-xs`}
                          style={{ color: acc.color }}
                        />
                        <span>{acc.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Category Selector ────────────────────────────────────────── */}
          <div>
            <p className="section-label">Category</p>
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  id={`cat-tile-${cat.id}`}
                  onClick={() => setCategoryId(cat.id)}
                  className={`cat-tile ${categoryId === cat.id ? 'cat-tile-selected' : ''}`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${cat.color}25` }}
                  >
                    <i
                      className={`fa-solid ${cat.icon} text-sm`}
                      style={{ color: cat.color }}
                    />
                  </div>
                  <span className="leading-tight text-slate-600 dark:text-slate-300 text-center">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Note ────────────────────────────────────────────────────── */}
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

          {/* ── Date & Time Selector ─────────────────────────────────── */}
          <div>
            <p className="section-label">Date &amp; Time</p>
            <button
              id="date-time-btn"
              onClick={() => setShowPicker(true)}
              className="w-full flex items-center justify-between rounded-xl px-4 py-3 transition-colors"
              style={{ background: 'var(--surface-2)' }}
            >
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-calendar-days text-sm" style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                  {format(date, 'EEE, MMM d yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                  {format(date, 'h:mm aa')}
                </span>
                <i className="fa-solid fa-chevron-right text-xs" style={{ color: 'var(--text-3)' }} />
              </div>
            </button>
          </div>

          {/* ── Save Button ──────────────────────────────────────────────── */}
          <button
            id="save-entry-btn"
            onClick={handleSave}
            disabled={!isValid}
            className="btn-primary"
          >
            {editingTxn ? 'Update Entry' : 'Save Entry'}
          </button>

          {/* ── Delete (edit mode only) ───────────────────────────────────── */}
          {editingTxn && (
            <button
              id="delete-entry-btn"
              onClick={handleDelete}
              className="btn-danger"
            >
              <i className="fa-solid fa-trash mr-2" />
              Delete Transaction
            </button>
          )}
        </div>
      </div>

      {/* ── Delete Confirm Dialogs ──────────────────────────────────────── */}
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

      {/* ── Date/Time Picker ────────────────────────────────────────────── */}
      {showPicker && (
        <DateTimePicker
          value={date}
          maxDate={today}
          onChange={setDate}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
