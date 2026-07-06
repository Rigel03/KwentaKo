/**
 * BudgetExpenseModal.tsx
 * A slim, expense-only transaction modal opened from a budget card.
 * Category is pre-filled and locked; Income/Transfer tabs are hidden.
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { evaluateExpression } from '../../utils/currency';
import NumPad from './NumPad';
import type { Budget } from '../../types';

interface Props {
  budget: Budget;
  onClose: () => void;
}

export default function BudgetExpenseModal({ budget, onClose }: Props) {
  const { accounts, categories, addTransaction, showToast, settings } = useStore();

  const cat            = categories.find((c) => c.id === budget.categoryId);
  const activeAccounts = accounts.filter((a) => a.isActive);
  const defaultAccId   = settings.defaultAccountId
    ? (accounts.find((a) => a.id === settings.defaultAccountId && a.isActive)?.id ?? activeAccounts[0]?.id ?? '')
    : (activeAccounts[0]?.id ?? '');

  const [expression,    setExpression]    = useState('');
  const [evaluatedAmt,  setEvaluatedAmt]  = useState(0);
  const [accountId,     setAccountId]     = useState(defaultAccId);
  const [note,          setNote]          = useState('');
  const [date,          setDate]          = useState(new Date());
  const [showCalculator, setShowCalculator] = useState(false);

  const liveAmount  = evaluateExpression(expression);
  const displayAmt  = liveAmount > 0 ? liveAmount : evaluatedAmt;
  const isValid     = displayAmt > 0 && accountId !== '';

  const handleEvaluate = () => {
    const val = evaluateExpression(expression);
    setEvaluatedAmt(val);
    setExpression(val > 0 ? String(val / 100) : '');
  };

  const handleSave = () => {
    if (!isValid) return;
    addTransaction({
      id: crypto.randomUUID(),
      type: 'expense',
      amount: displayAmt,
      accountId,
      categoryId: budget.categoryId,
      note: note.trim() || undefined,
      date: date.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    showToast(`Expense logged to "${budget.title}" ✓`, 'success');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="animate-slide-up"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 66,
          backgroundColor: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          display: 'flex', flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--divider)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 8px',
        }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Add Expense</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              {cat && (
                <div style={{
                  width: 16, height: 16, borderRadius: 4,
                  background: cat.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`fa-solid ${cat.icon}`} style={{ color: '#fff', fontSize: 8 }} />
                </div>
              )}
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>
                {cat?.name ?? 'Unknown'} · {budget.title}
              </span>
              <i className="fa-solid fa-lock" style={{ fontSize: 9, color: 'var(--text-3)' }} />
            </div>
          </div>
          <button onClick={onClose} className="icon-btn" style={{ width: 36, height: 36 }}>
            <i className="fa-solid fa-xmark" style={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 120px' }}>

          {/* Amount tap zone */}
          <button
            onClick={() => setShowCalculator(true)}
            style={{
              width: '100%', textAlign: 'center', padding: '20px 0 16px',
              background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <p style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.5px', marginBottom: 6, fontWeight: 600 }}>
              {expression || 'TAP TO ENTER AMOUNT'}
            </p>
            <p style={{
              fontSize: displayAmt.toString().length > 8 ? 36 : 52,
              fontWeight: 800, letterSpacing: -2, color: 'var(--expense)',
              lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            }}>
              ₱ {displayAmt > 0
                ? (displayAmt / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0.00'}
            </p>
          </button>

          {/* Account pills */}
          <div style={{ marginBottom: 20 }}>
            <p className="section-label">Account</p>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }} className="scrollbar-hide">
              {activeAccounts.map((acc) => {
                const active = accountId === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => setAccountId(acc.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                      borderRadius: 99, border: 'none', flexShrink: 0,
                      background: active ? acc.color : `${acc.color}18`,
                      color: active ? '#fff' : acc.color,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
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

          {/* Note */}
          <div style={{ marginBottom: 20 }}>
            <p className="section-label">Note (optional)</p>
            <input
              type="text"
              className="input-field"
              placeholder="Add a note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Date */}
          <div>
            <p className="section-label">Date</p>
            <input
              type="date"
              className="input-field"
              value={format(date, 'yyyy-MM-dd')}
              onChange={(e) => {
                const d = new Date(e.target.value + 'T00:00:00');
                if (!isNaN(d.getTime())) setDate(d);
              }}
            />
          </div>
        </div>

        {/* Sticky save button */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 20px 32px',
          background: 'var(--surface)',
          borderTop: '1px solid var(--divider)',
        }}>
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={!isValid}
            style={{ opacity: isValid ? 1 : 0.45 }}
          >
            <i className="fa-solid fa-arrow-up" style={{ fontSize: 13 }} />
            Log Expense
          </button>
        </div>
      </div>

      {/* Calculator overlay */}
      {showCalculator && (
        <div
          className="animate-slide-up"
          style={{
            position: 'fixed', inset: 0, zIndex: 70,
            background: 'var(--bg)', display: 'flex', flexDirection: 'column',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', minHeight: 64,
          }}>
            <button
              onClick={() => setShowCalculator(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-1)', fontSize: 16, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <i className="fa-solid fa-chevron-left" style={{ fontSize: 14 }} /> Back
            </button>
            <button
              onClick={() => { handleEvaluate(); setShowCalculator(false); }}
              style={{
                background: 'var(--expense)', color: '#fff', border: 'none',
                padding: '8px 20px', borderRadius: 99, fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
            <div style={{ textAlign: 'right', padding: '20px 24px 40px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-3)', letterSpacing: '1px', marginBottom: 8, fontWeight: 600 }}>
                {expression || 'Enter Amount'}
              </p>
              <p style={{
                fontSize: displayAmt.toString().length > 8 ? 44 : 68,
                fontWeight: 800, letterSpacing: -2, color: 'var(--expense)',
                lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              }}>
                <span style={{ fontSize: 32, verticalAlign: 'super', marginRight: 4 }}>₱</span>
                {displayAmt > 0
                  ? (displayAmt / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '0.00'}
              </p>
            </div>
            <div style={{
              padding: '0 20px 20px', background: 'var(--surface)',
              borderTopLeftRadius: 32, borderTopRightRadius: 32,
              paddingTop: 32, boxShadow: '0 -10px 40px rgba(0,0,0,0.05)',
            }}>
              <NumPad expression={expression} onChange={setExpression} onEvaluate={handleEvaluate} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
