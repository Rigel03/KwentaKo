import { useState, useEffect, useRef } from 'react';
import { format, parseISO, startOfDay } from 'date-fns';
import { useStore } from '../../store/useStore';
import { evaluateExpression } from '../../utils/currency';
import NumPad from './NumPad';
import ConfirmDialog from '../ui/ConfirmDialog';
import DateTimePicker from './DateTimePicker';
import type { Transaction, TransactionType } from '../../types';

const TYPE_CONFIG: Record<TransactionType, {
  label: string;
  gradient: string;
  tintLight: string;
  tintDark: string;
  tab: string;
}> = {
  income:   {
    label: 'Income',
    gradient: 'linear-gradient(135deg, #16A34A, #22C55E)',
    tintLight: '#f0fdf4',
    tintDark: '#14532d1a',
    tab: 'text-green-600 dark:text-green-400',
  },
  expense:  {
    label: 'Expense',
    gradient: 'linear-gradient(135deg, #DC2626, #EF4444)',
    tintLight: '#fff1f2',
    tintDark: '#7f1d1d1a',
    tab: 'text-red-500 dark:text-red-400',
  },
  transfer: {
    label: 'Transfer',
    gradient: 'linear-gradient(135deg, #4F46E5, #2563EB)',
    tintLight: '#eff6ff',
    tintDark: '#1e3a8a1a',
    tab: 'text-indigo-600 dark:text-indigo-400',
  },
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
  const [showDatePicker, setShowDatePicker] = useState(false);

  const noteRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const cfg = TYPE_CONFIG[type];

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

  // Handle hardware back button
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      closeAddSheet();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [closeAddSheet]);

  const handleClose = () => {
    window.history.back();
  };

  // ── Validation
  const displayAmount = liveAmount > 0 ? liveAmount : evaluatedAmount;
  const isValid =
    displayAmount > 0 &&
    accountId !== '' &&
    categoryId !== '' &&
    (type !== 'transfer' || (toAccountId !== '' && toAccountId !== accountId));

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

    handleClose();
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
      {/* ── Overlay ─────────────────────────────────────────────────────── */}
      <div className="sheet-overlay animate-fade-in" onClick={handleClose} />

      {/* ── Sheet Panel ─────────────────────────────────────────────────── */}
      <div ref={panelRef} className="sheet-panel animate-slide-up">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* ── Mood Header (changes color by type) ────────────────────── */}
        <div
          className="mx-4 mt-2 mb-3 rounded-2xl px-4 pt-4 pb-3 transition-all duration-300"
          style={{ background: cfg.tintLight }}
        >
          {/* Type Selector */}
          <div className="flex gap-2 bg-white/60 rounded-xl p-1 mb-3">
            {(Object.keys(TYPE_CONFIG) as TransactionType[]).map((t) => (
              <button
                key={t}
                id={`type-tab-${t}`}
                onClick={() => setType(t)}
                className={`type-tab transition-all duration-200 ${
                  type === t ? 'text-white shadow-md' : 'type-tab-inactive'
                }`}
                style={type === t ? { background: TYPE_CONFIG[t].gradient } : {}}
              >
                {TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>

          {/* Amount Display */}
          <div className="text-center py-1">
            <p className="text-xs text-slate-400 mb-1 font-mono min-h-4">
              {expression || ''}
            </p>
            <p
              id="amount-display"
              className="text-5xl font-bold tracking-tight text-center text-slate-900"
              style={{ fontFeatureSettings: "'tnum'" }}
            >
              ₱ {liveAmount > 0
                ? (liveAmount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : evaluatedAmount > 0
                ? (evaluatedAmount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0'}
            </p>

            {/* Type indicator bar */}
            <div className="mt-2 flex justify-center">
              <div
                className="h-1 w-16 rounded-full transition-all duration-300"
                style={{ background: cfg.gradient }}
              />
            </div>
          </div>
        </div>

        <div className="px-4 pb-8 space-y-5">
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
                    accountId === acc.id ? 'account-pill-selected' : ''
                  }`}
                  style={
                    accountId === acc.id
                      ? undefined
                      : { backgroundColor: `${acc.color}20`, border: `1px solid ${acc.color}30` }
                  }
                >
                  <i
                    className={`fa-solid ${acc.icon} text-xs`}
                    style={{ color: accountId === acc.id ? '#fff' : acc.color }}
                  />
                  <span className={accountId === acc.id ? 'text-white' : 'text-slate-700 dark:text-slate-300'}>{acc.name}</span>
                </button>
              ))}
            </div>

            {/* Transfer: To Account */}
            {type === 'transfer' && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fa-solid fa-right-left text-indigo-500 text-xs" />
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
                          toAccountId === acc.id ? 'account-pill-selected' : ''
                        }`}
                        style={
                          toAccountId === acc.id
                            ? undefined
                            : { backgroundColor: `${acc.color}20`, border: `1px solid ${acc.color}30` }
                        }
                      >
                        <i
                          className={`fa-solid ${acc.icon} text-xs`}
                          style={{ color: toAccountId === acc.id ? '#fff' : acc.color }}
                        />
                        <span className={toAccountId === acc.id ? 'text-white' : 'text-slate-700 dark:text-slate-300'}>{acc.name}</span>
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
                  className={`cat-tile aspect-square flex flex-col items-center justify-center gap-2 p-2 rounded-2xl transition-all ${
                    categoryId === cat.id ? 'cat-tile-selected ring-2 ring-indigo-500 scale-105' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${cat.color}25` }}
                  >
                    <i
                      className={`fa-solid ${cat.icon} text-base`}
                      style={{ color: cat.color }}
                    />
                  </div>
                  <span className="leading-tight text-xs text-slate-700 dark:text-slate-300 text-center font-medium line-clamp-2">
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

          {/* ── Date Selector ────────────────────────────────────────────── */}
          <div>
            <p className="section-label">Date & Time</p>
            <button
              onClick={() => setShowDatePicker(true)}
              className="w-full flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <i className="fa-solid fa-calendar text-indigo-600 dark:text-indigo-400 text-sm" />
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {format(date, 'MMM d, yyyy • h:mm a')}
                </span>
              </div>
              <i className="fa-solid fa-chevron-right text-slate-400 text-xs" />
            </button>
          </div>

          {/* ── Save Button ──────────────────────────────────────────────── */}
          <button
            id="save-entry-btn"
            onClick={handleSave}
            disabled={!isValid}
            className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 shadow-lg"
            style={{ background: isValid ? cfg.gradient : undefined, backgroundColor: !isValid ? '#94A3B8' : undefined }}
          >
            {editingTxn ? 'Update Entry' : `Save ${cfg.label}`}
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

      {showDatePicker && (
        <DateTimePicker
          value={date}
          onChange={(d) => setDate(d)}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </>
  );
}
