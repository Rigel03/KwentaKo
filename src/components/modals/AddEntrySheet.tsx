import { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../../store/useStore';
import { evaluateExpression } from '../../utils/currency';
import { vibrateSuccess } from '../../utils/haptic';
import NumPad from './NumPad';
import ConfirmDialog from '../ui/ConfirmDialog';
import type { TransactionType } from '../../types';

const TYPE_CONFIG: Record<TransactionType, { label: string; color: string; icon: string }> = {
  income:   { label: 'Income',   color: 'var(--income)',   icon: 'fa-arrow-down'  },
  expense:  { label: 'Expense',  color: 'var(--expense)',  icon: 'fa-arrow-up'    },
  transfer: { label: 'Transfer', color: 'var(--transfer)', icon: 'fa-right-left'  },
};

export default function AddEntrySheet() {
  const {
    accounts, transactions, categories, settings,
    addTransaction, updateTransaction, deleteTransaction, deleteTransactionPair,
    closeAddSheet, showToast, editingTransactionId, prefillCategoryId,
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
  const [categoryId,   setCategoryId]   = useState(editingTxn?.categoryId ?? prefillCategoryId ?? '');
  const [note,         setNote]         = useState(editingTxn?.note ?? '');
  const [date,         setDate]         = useState(editingTxn ? parseISO(editingTxn.date) : new Date());
  const [showDeleteConfirm,         setShowDeleteConfirm]         = useState(false);
  const [showTransferDeleteConfirm, setShowTransferDeleteConfirm] = useState(false);
  const [showCalculator,            setShowCalculator]            = useState(false);
  const [showAllCategories,         setShowAllCategories]         = useState(false);

  const noteRef = useRef<HTMLInputElement>(null);
  const cfg     = TYPE_CONFIG[type];

  const liveAmount     = evaluateExpression(expression);
  const displayAmount  = liveAmount > 0 ? liveAmount : evaluatedAmount;
  const activeAccounts = accounts.filter((a) => a.isActive);
  
  const allFilteredCats = categories.filter(
    (c) => c.isActive && (c.type === type || c.type === 'both') && (type !== 'transfer' || c.type === 'both')
  );
  const limit = settings.categoryLimit === 'all' ? allFilteredCats.length : settings.categoryLimit;
  const displayLimit = showAllCategories ? allFilteredCats.length : (allFilteredCats.length > limit ? limit - 1 : limit);
  const filteredCats = allFilteredCats.slice(0, displayLimit);
  const hasMoreCats = !showAllCategories && allFilteredCats.length > limit;

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
    const handle = () => {
      if (showCalculator) setShowCalculator(false);
      else closeAddSheet();
    };
    window.addEventListener('popstate', handle);
    return () => window.removeEventListener('popstate', handle);
  }, [closeAddSheet, showCalculator]);

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
    vibrateSuccess();
    closeAddSheet();
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
      {/* Full-screen page */}
      <div
        className="animate-slide-up"
        style={{
          position: 'fixed', inset: 0, zIndex: 55,
          backgroundColor: 'var(--bg)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Top bar */}
        <div style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px 20px', borderBottom: '1px solid var(--divider)',
          backgroundColor: 'var(--surface)', flexShrink: 0, minHeight: 64,
        }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>
            {editingTxn ? 'Edit Entry' : 'New Entry'}
          </p>
          <button onClick={handleClose} className="icon-btn" style={{ position: 'absolute', right: 16, width: 36, height: 36 }}>
            <i className="fa-solid fa-xmark" style={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
          {/* Type Selector */}
          <div style={{ padding: '16px 20px 0' }}>
            <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 14, padding: 4, gap: 4 }}>
              {(Object.keys(TYPE_CONFIG) as TransactionType[]).map((t) => {
                const active = type === t;
                return (
                  <button
                    key={t}
                    id={`type-tab-${t}`}
                    onClick={() => setType(t)}
                    style={{
                      flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none',
                      background: active ? TYPE_CONFIG[t].color : 'transparent',
                      color: active ? 'var(--bg)' : 'var(--text-3)',
                      fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 220ms ease',
                    }}
                  >
                    <i className={`fa-solid ${TYPE_CONFIG[t].icon}`} style={{ fontSize: 12 }} />
                    {TYPE_CONFIG[t].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Hero - Tappable */}
          <button
            onClick={() => setShowCalculator(true)}
            style={{
              width: '100%', textAlign: 'center', padding: '32px 20px 24px',
              background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            <p style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>
              {expression || 'TAP TO EDIT AMOUNT'}
            </p>
            <p
              id="amount-display"
              style={{
                fontSize: displayAmount.toString().length > 8 ? 36 : displayAmount.toString().length > 6 ? 46 : 56,
                fontWeight: 800, letterSpacing: -2, color: cfg.color,
                lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                wordBreak: 'break-all'
              }}
            >
              ₱ {displayAmount > 0
                ? (displayAmount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0'}
            </p>
          </button>

          {/* Fields */}
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

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
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                        borderRadius: 99, border: 'none',
                        background: active ? acc.color : `${acc.color}18`,
                        color: active ? '#fff' : acc.color,
                        fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                        fontFamily: 'inherit', transition: 'all 200ms ease',
                      }}
                    >
                      <i className={`fa-solid ${acc.icon}`} style={{ fontSize: 12 }} />
                      {acc.name}
                    </button>
                  );
                })}
              </div>

              {type === 'transfer' && (
                <div style={{ marginTop: 12 }}>
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
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                            borderRadius: 99, border: 'none',
                            background: active ? acc.color : `${acc.color}18`,
                            color: active ? '#fff' : acc.color,
                            fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                            fontFamily: 'inherit', transition: 'all 200ms ease',
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
              <p className="section-label">Category{prefillCategoryId ? ' — Locked to Budget' : ''}</p>
              {prefillCategoryId ? (
                /* Locked single-category display when opened from a budget card */
                (() => {
                  const lockedCat = categories.find(c => c.id === prefillCategoryId);
                  return lockedCat ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14, background: `${lockedCat.color}14`, border: `1.5px solid ${lockedCat.color}60` }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${lockedCat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`fa-solid ${lockedCat.icon}`} style={{ color: lockedCat.color, fontSize: 15 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: lockedCat.color }}>{lockedCat.name}</span>
                      <i className="fa-solid fa-lock" style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }} />
                    </div>
                  ) : null;
                })()
              ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>

                {filteredCats.map((cat) => {
                  const active = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      id={`cat-tile-${cat.id}`}
                      onClick={() => setCategoryId(cat.id)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 6, padding: '12px 4px', borderRadius: 14,
                        border: active ? `2px solid ${cat.color}` : '2px solid transparent',
                        background: active ? `${cat.color}18` : 'var(--surface-2)',
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 200ms ease',
                        transform: active ? 'scale(1.04)' : 'scale(1)',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, background: `${cat.color}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className={`fa-solid ${cat.icon}`} style={{ color: cat.color, fontSize: 15 }} />
                      </div>
                      <span style={{
                        fontSize: 10, color: active ? cat.color : 'var(--text-2)',
                        fontWeight: active ? 700 : 500, textAlign: 'center', lineHeight: 1.2,
                        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
                {hasMoreCats && (
                  <button
                    onClick={() => setShowAllCategories(true)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 6, padding: '12px 4px', borderRadius: 14, border: '2px solid transparent',
                      background: 'var(--surface-2)', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: 'var(--surface-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="fa-solid fa-ellipsis" style={{ color: 'var(--text-2)', fontSize: 15 }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 500, textAlign: 'center' }}>
                      More
                    </span>
                  </button>
                )}
                {showAllCategories && allFilteredCats.length > limit && (
                  <button
                    onClick={() => setShowAllCategories(false)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 6, padding: '12px 4px', borderRadius: 14, border: '2px solid transparent',
                      background: 'var(--surface-2)', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: 'var(--surface-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className="fa-solid fa-chevron-up" style={{ color: 'var(--text-2)', fontSize: 15 }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 500, textAlign: 'center' }}>
                      Less
                    </span>
                  </button>
                )}
              </div>
              )}
            </div>

            {/* Date & Time (Native Pickers) */}
            <div>
              <p className="section-label">Date & Time</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <i className="fa-regular fa-calendar" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                  <input
                    type="date"
                    value={format(date, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      const newDate = new Date(date);
                      newDate.setFullYear(y, m - 1, d);
                      setDate(newDate);
                    }}
                    style={{
                      width: '100%', padding: '12px 14px 12px 40px', borderRadius: 12,
                      border: '1.5px solid var(--divider)',
                      background: settings.theme === 'light' ? 'var(--surface-3)' : 'var(--surface-2)',
                      color: 'var(--text-1)', fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                      outline: 'none', WebkitAppearance: 'none',
                      colorScheme: settings.theme === 'light' ? 'light' : 'dark'
                    }}
                  />
                </div>
                <div style={{ position: 'relative', flex: 1 }}>
                  <i className="fa-regular fa-clock" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                  <input
                    type="time"
                    value={format(date, 'HH:mm')}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const [h, m] = e.target.value.split(':').map(Number);
                      const newDate = new Date(date);
                      newDate.setHours(h, m);
                      setDate(newDate);
                    }}
                    style={{
                      width: '100%', padding: '12px 14px 12px 40px', borderRadius: 12,
                      border: '1.5px solid var(--divider)',
                      background: settings.theme === 'light' ? 'var(--surface-3)' : 'var(--surface-2)',
                      color: 'var(--text-1)', fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                      outline: 'none', WebkitAppearance: 'none',
                      colorScheme: settings.theme === 'light' ? 'light' : 'dark'
                    }}
                  />
                </div>
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

            {/* Delete (edit mode) */}
            {editingTxn && (
              <button
                id="delete-entry-btn"
                onClick={handleDelete}
                style={{
                  width: '100%', padding: '14px', marginTop: 8,
                  borderRadius: 14, border: '1.5px solid rgba(255,59,48,0.25)',
                  background: 'rgba(255,59,48,0.06)', color: 'var(--expense)',
                  fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <i className="fa-solid fa-trash" />
                Delete Transaction
              </button>
            )}
          </div>
            {/* Save Button (Scrollable) */}
            <div style={{ marginTop: 12, paddingBottom: 40, paddingLeft: 20, paddingRight: 20 }}>
              <button
                id="save-entry-btn"
                onClick={handleSave}
                disabled={!isValid}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16, border: 'none',
                  background: isValid ? cfg.color : 'var(--surface-3)',
                  color: isValid ? '#fff' : 'var(--text-3)',
                  fontSize: 16, fontWeight: 700, cursor: isValid ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', transition: 'all 200ms ease', boxShadow: isValid ? '0 4px 14px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {editingTxn ? 'Update Entry' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>

      {/* Calculator Slide-up Modal */}
      {showCalculator && (
        <div
          className="animate-slide-up"
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'var(--bg)', display: 'flex', flexDirection: 'column',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', minHeight: 64,
          }}>
            <button onClick={() => setShowCalculator(false)} style={{
              background: 'none', border: 'none', color: 'var(--text-1)', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <i className="fa-solid fa-chevron-left" style={{ fontSize: 14 }} /> Back
            </button>
            <button onClick={() => setShowCalculator(false)} style={{
              background: cfg.color, color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 99, fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              Done
            </button>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
            <div style={{ textAlign: 'right', padding: '20px 24px 40px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-3)', letterSpacing: '1px', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>
                {expression || 'Enter Amount'}
              </p>
              <p style={{
                fontSize: displayAmount.toString().length > 8 ? 44 : displayAmount.toString().length > 6 ? 56 : 68,
                fontWeight: 800, letterSpacing: -2, color: cfg.color,
                lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                wordBreak: 'break-all'
              }}>
                <span style={{ fontSize: 32, verticalAlign: 'super', marginRight: 4 }}>₱</span>
                {displayAmount > 0
                  ? (displayAmount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '0.00'}
              </p>
            </div>
            
            <div style={{ padding: '0 20px 20px', background: 'var(--surface)', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 32, boxShadow: '0 -10px 40px rgba(0,0,0,0.05)' }}>
              <NumPad expression={expression} onChange={setExpression} onEvaluate={handleEvaluate} />
            </div>
          </div>
        </div>
      )}

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
    </>
  );
}
