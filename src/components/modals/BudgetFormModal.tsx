/**
 * BudgetFormModal.tsx
 * Floating modal for creating or editing a Budget.
 * Supports: Title, Category, Amount, Period (daily/weekly/monthly/custom),
 * and conditional Start/End date pickers for Custom / One-Time budgets.
 */

import { useState, useEffect } from 'react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useStore } from '../../store/useStore';
import type { Budget } from '../../types';

type Period = 'daily' | 'weekly' | 'monthly' | 'custom';

interface Props {
  /** Pass an existing budget to enter edit mode; undefined = add mode */
  budget?: Budget;
  onClose: () => void;
}

const PERIOD_OPTIONS: { id: Period; label: string; icon: string }[] = [
  { id: 'monthly', label: 'Monthly', icon: 'fa-calendar' },
  { id: 'weekly',  label: 'Weekly',  icon: 'fa-calendar-week' },
  { id: 'daily',   label: 'Daily',   icon: 'fa-calendar-day' },
  { id: 'custom',  label: 'Custom / One-Time', icon: 'fa-sliders' },
];

export default function BudgetFormModal({ budget: editingBudget, onClose }: Props) {
  const { categories, budgets, addBudget, updateBudget, showToast, settings } = useStore();

  const expenseCats = categories.filter(
    (c) => c.isActive && (c.type === 'expense' || c.type === 'both'),
  );

  const [title,        setTitle]        = useState(editingBudget?.title ?? '');
  const [categoryId,   setCategoryId]   = useState(editingBudget?.categoryId ?? '');
  const [amount,       setAmount]       = useState(editingBudget ? String(editingBudget.amount / 100) : '');
  const [period,       setPeriod]       = useState<Period>(editingBudget?.period ?? 'monthly');
  const [customStart,  setCustomStart]  = useState(
    editingBudget?.startDate ? format(new Date(editingBudget.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
  );
  const [customEnd,    setCustomEnd]    = useState(
    editingBudget?.endDate ? format(new Date(editingBudget.endDate), 'yyyy-MM-dd') : '',
  );
  const [showAllCats,  setShowAllCats]  = useState(false);

  // Auto-set title to category name if user hasn't typed a title yet
  useEffect(() => {
    if (!editingBudget && !title) {
      const cat = expenseCats.find((c) => c.id === categoryId);
      if (cat) setTitle(cat.name);
    }
  }, [categoryId]);

  const getDateWindow = (p: Period) => {
    const now = new Date();
    switch (p) {
      case 'daily':   return { start: startOfDay(now), end: endOfDay(now) };
      case 'weekly':  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'monthly': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'custom':  return null; // user picks manually
    }
  };

  const canSave = title.trim() !== '' && categoryId !== '' && parseFloat(amount) > 0 &&
    (period !== 'custom' || (customStart !== '' && customEnd !== '' && customEnd >= customStart));

  const handleSave = () => {
    if (!canSave) return;
    const amountCentavos = Math.round(parseFloat(amount) * 100);

    let startDate: string;
    let endDate: string;
    let isRecurring: boolean;

    if (period === 'custom') {
      startDate   = new Date(customStart + 'T00:00:00').toISOString();
      endDate     = new Date(customEnd   + 'T23:59:59').toISOString();
      isRecurring = false;
    } else {
      const window = getDateWindow(period)!;
      startDate   = window.start.toISOString();
      endDate     = window.end.toISOString();
      isRecurring = true;
    }

    if (editingBudget) {
      updateBudget(editingBudget.id, { title: title.trim(), categoryId, amount: amountCentavos, period, startDate, endDate, isRecurring });
      showToast('Budget updated ✓', 'success');
    } else {
      // Block duplicate category budgets in add mode
      const exists = budgets.some((b) => b.categoryId === categoryId);
      if (exists) {
        showToast('A budget already exists for this category. Delete it first.', 'error');
        return;
      }
      addBudget({
        id: `budget-${Date.now()}`,
        title: title.trim(),
        categoryId,
        amount: amountCentavos,
        period,
        startDate,
        endDate,
        isRecurring,
        createdAt: new Date().toISOString(),
      });
      showToast('Budget created ✓', 'success');
    }
    onClose();
  };

  // Category grid
  const limit        = settings.categoryLimit === 'all' ? expenseCats.length : settings.categoryLimit;
  const displayLimit = showAllCats ? expenseCats.length : (expenseCats.length > limit ? limit - 1 : limit);
  const visibleCats  = expenseCats.slice(0, displayLimit);
  const hasMore      = !showAllCats && expenseCats.length > limit;
  const takenCatIds  = new Set(
    editingBudget
      ? budgets.filter((b) => b.id !== editingBudget.id).map((b) => b.categoryId)
      : budgets.map((b) => b.categoryId),
  );

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Floating modal */}
      <div
        className="animate-slide-up"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 66,
          backgroundColor: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          display: 'flex', flexDirection: 'column',
          maxHeight: '94vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--divider)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 4px',
        }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>
            {editingBudget ? 'Edit Budget' : 'New Budget'}
          </p>
          <button onClick={onClose} className="icon-btn" style={{ width: 36, height: 36 }}>
            <i className="fa-solid fa-xmark" style={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 120px' }}>

          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <p className="section-label">Budget Title</p>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Monthly Groceries"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Category */}
          <div style={{ marginBottom: 20 }}>
            <p className="section-label">Category</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {visibleCats.map((c) => {
                const active = categoryId === c.id;
                const taken  = takenCatIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => !taken && setCategoryId(c.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '10px 4px', borderRadius: 12,
                      border: active ? `2px solid ${c.color}` : '2px solid transparent',
                      background: active ? `${c.color}18` : 'var(--surface-2)',
                      cursor: taken ? 'not-allowed' : 'pointer',
                      opacity: taken ? 0.35 : 1,
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${c.color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`fa-solid ${c.icon}`} style={{ color: c.color, fontSize: 14 }} />
                    </div>
                    <span style={{
                      fontSize: 10, textAlign: 'center', lineHeight: 1.2,
                      color: active ? c.color : 'var(--text-2)',
                      fontWeight: active ? 700 : 500,
                    }}>
                      {c.name}
                    </span>
                  </button>
                );
              })}
              {hasMore && (
                <button
                  onClick={() => setShowAllCats(true)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 4px', borderRadius: 12, border: '2px solid transparent', background: 'var(--surface-2)', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-solid fa-ellipsis" style={{ color: 'var(--text-2)', fontSize: 14 }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 500 }}>More</span>
                </button>
              )}
              {showAllCats && expenseCats.length > limit && (
                <button
                  onClick={() => setShowAllCats(false)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 4px', borderRadius: 12, border: '2px solid transparent', background: 'var(--surface-2)', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-solid fa-chevron-up" style={{ color: 'var(--text-2)', fontSize: 14 }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 500 }}>Less</span>
                </button>
              )}
            </div>
          </div>

          {/* Amount */}
          <div style={{ marginBottom: 20 }}>
            <p className="section-label">Limit Amount (₱)</p>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Period */}
          <div style={{ marginBottom: period === 'custom' ? 16 : 0 }}>
            <p className="section-label">Period</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PERIOD_OPTIONS.map((p) => {
                const active = period === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPeriod(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px',
                      borderRadius: 12, fontFamily: 'inherit',
                      border: active ? '2px solid var(--text-1)' : '2px solid var(--divider)',
                      background: active ? 'var(--text-1)' : 'var(--surface-2)',
                      color: active ? 'var(--bg)' : 'var(--text-2)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                      gridColumn: p.id === 'custom' ? 'span 2' : 'span 1',
                    }}
                  >
                    <i className={`fa-solid ${p.icon}`} style={{ fontSize: 13, opacity: 0.8 }} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional date pickers for Custom period */}
          {period === 'custom' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <div>
                <p className="section-label">Start Date</p>
                <input
                  type="date"
                  className="input-field"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div>
                <p className="section-label">End Date</p>
                <input
                  type="date"
                  className="input-field"
                  value={customEnd}
                  min={customStart}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
                  This is a one-time budget. It will be archived after the end date passes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky action buttons */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 20px 32px',
          background: 'var(--surface)',
          borderTop: '1px solid var(--divider)',
        }}>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="btn-primary"
            style={{ opacity: canSave ? 1 : 0.4 }}
          >
            {editingBudget ? 'Update Budget' : 'Create Budget'}
          </button>
        </div>
      </div>
    </>
  );
}
