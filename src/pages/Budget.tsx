import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import { getBudgetSpentAmount } from '../utils/calculations';
import { formatPHP } from '../utils/currency';
import type { Budget } from '../types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function BudgetPage() {
  const transactions  = useStore((s) => s.transactions);
  const categories    = useStore((s) => s.categories);
  const openAddSheet  = useStore((s) => s.openAddSheet);
  const budgets       = useStore((s) => s.budgets);
  const addBudget     = useStore((s) => s.addBudget);
  const updateBudget  = useStore((s) => s.updateBudget);
  const deleteBudget  = useStore((s) => s.deleteBudget);
  const settings      = useStore((s) => s.settings);
  const showToast     = useStore((s) => s.showToast);

  // ── Add Form state
  const [showForm, setShowForm]                   = useState(false);
  const [formCatId, setFormCatId]                 = useState('');
  const [formAmount, setFormAmount]               = useState('');
  const [formPeriod, setFormPeriod]               = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [showAllCategories, setShowAllCategories] = useState(false);

  // ── Edit state
  const [editingBudgetId, setEditingBudgetId]     = useState<string | null>(null);
  const [editAmount, setEditAmount]               = useState('');

  // ── 3-dot menu state (which budget's menu is open)
  const [openMenuId, setOpenMenuId]               = useState<string | null>(null);

  const expenseCategories = categories.filter(
    (c) => c.isActive && (c.type === 'expense' || c.type === 'both'),
  );

  // ── Derived totals
  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent    = budgets.reduce((s, b) => s + getBudgetSpentAmount(b, transactions), 0);
  const totalRemaining = totalBudgeted - totalSpent;

  // ── Helpers
  const getDateWindow = (period: 'daily' | 'weekly' | 'monthly') => {
    const now = new Date();
    if (period === 'daily')   return { startDate: startOfDay(now), endDate: endOfDay(now) };
    if (period === 'weekly')  return { startDate: startOfWeek(now, { weekStartsOn: 1 }), endDate: endOfWeek(now, { weekStartsOn: 1 }) };
    return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
  };

  const formatDateWindow = (budget: Budget) => {
    if (!budget.startDate || !budget.endDate) return '';
    const s = parseISO(budget.startDate);
    const e = parseISO(budget.endDate);
    if (budget.period === 'daily')  return `Today, ${format(s, 'MMM d')}`;
    if (budget.period === 'weekly') return `${format(s, 'MMM d')} – ${format(e, 'MMM d')}`;
    return format(s, 'MMMM yyyy');
  };

  // ── Add budget
  const handleAddBudget = () => {
    if (!formCatId || !formAmount) return;

    const exists = budgets.some((b) => b.categoryId === formCatId);
    if (exists) {
      showToast('A budget already exists for this category. Please delete it first.', 'error');
      return;
    }

    const amountCentavos = Math.round(parseFloat(formAmount) * 100);
    if (isNaN(amountCentavos) || amountCentavos <= 0) return;

    const { startDate, endDate } = getDateWindow(formPeriod);
    const now = new Date();

    const newBudget: Budget = {
      id: `budget-${Date.now()}`,
      categoryId: formCatId,
      amount: amountCentavos,
      period: formPeriod,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      createdAt: now.toISOString(),
    };

    addBudget(newBudget);
    showToast('Budget created!', 'success');
    setShowForm(false);
    setFormCatId('');
    setFormAmount('');
  };

  // ── Edit budget amount
  const handleEditSave = (budgetId: string) => {
    const amountCentavos = Math.round(parseFloat(editAmount) * 100);
    if (isNaN(amountCentavos) || amountCentavos <= 0) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }
    updateBudget(budgetId, { amount: amountCentavos });
    showToast('Budget updated!', 'success');
    setEditingBudgetId(null);
  };

  // ── Delete budget
  const handleDelete = (budgetId: string) => {
    deleteBudget(budgetId);
    showToast('Budget removed.', 'info');
    setOpenMenuId(null);
  };

  return (
    <div
      className="min-h-screen animate-fade-in"
      style={{ backgroundColor: 'var(--bg)' }}
      onClick={() => openMenuId && setOpenMenuId(null)}
    >
      {/* Header */}
      <div className="header-container" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="header-title">Budget</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
            Spending envelopes by category
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          aria-label="Add budget"
          className="icon-btn"
          style={{ width: 40, height: 40, borderRadius: 12 }}
        >
          <i className="fa-solid fa-plus" style={{ fontSize: 16 }} />
        </button>
      </div>

      <div className="px-5 space-y-4 pb-8">

        {/* Summary Card */}
        {budgets.length > 0 && (
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Budgeted</p>
                <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, color: 'var(--text-1)' }}>
                  {formatPHP(totalBudgeted)}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Spent</p>
                <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, color: totalSpent > totalBudgeted ? 'var(--expense)' : 'var(--text-1)' }}>
                  {formatPHP(totalSpent)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Remaining</p>
                <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, color: totalRemaining < 0 ? 'var(--expense)' : 'var(--income)' }}>
                  {formatPHP(Math.abs(totalRemaining))}
                </p>
              </div>
            </div>
            <div className="budget-bar-track" style={{ marginTop: 12 }}>
              <div
                className="budget-bar-fill animate-bar-grow"
                style={{
                  width: `${Math.min(totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0, 100)}%`,
                  backgroundColor: totalSpent > totalBudgeted ? 'var(--expense)' : 'var(--income)',
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right', marginTop: 4 }}>
              {totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(0) : 0}% used
            </p>
          </div>
        )}

        {/* Empty state */}
        {budgets.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <i className="fa-solid fa-bullseye" style={{ fontSize: 24, color: 'var(--text-3)' }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>
              No Budgets Yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
              Set spending limits for each category to stay on track.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
              style={{ maxWidth: 200, margin: '0 auto' }}
            >
              <i className="fa-solid fa-plus" />
              Add Budget
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => {
              const cat       = categories.find((c) => c.id === budget.categoryId);
              const spent     = getBudgetSpentAmount(budget, transactions);
              const remaining = budget.amount - spent;
              const pct       = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
              const over      = spent > budget.amount;
              const barColor  = over ? 'var(--expense)' : pct > 80 ? '#FF9F0A' : 'var(--income)';
              const isEditing = editingBudgetId === budget.id;
              const menuOpen  = openMenuId === budget.id;

              return (
                <div key={budget.id} className="card" style={{ padding: 0, overflow: 'visible' }}>
                  {/* Card Header Row */}
                  <div style={{ padding: '14px 16px 10px' }}>
                    <div className="flex items-center justify-between">
                      {/* Category info */}
                      <div className="flex items-center gap-2">
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: cat?.color ?? 'var(--surface-2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <i className={`fa-solid ${cat?.icon ?? 'fa-tag'}`} style={{ color: '#fff', fontSize: 15 }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2 }}>
                            {cat?.name ?? 'Unknown'}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                            {budget.period === 'monthly' ? '📅 Monthly' : budget.period === 'weekly' ? '📅 Weekly' : '📅 Daily'} · {formatDateWindow(budget)}
                          </p>
                        </div>
                      </div>

                      {/* 3-dot Menu button */}
                      <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenMenuId(menuOpen ? null : budget.id)}
                          className="icon-btn"
                          style={{ width: 32, height: 32, borderRadius: 8 }}
                          aria-label="Budget options"
                        >
                          <i className="fa-solid fa-ellipsis-vertical" style={{ fontSize: 14 }} />
                        </button>

                        {/* Dropdown menu */}
                        {menuOpen && (
                          <div style={{
                            position: 'absolute', right: 0, top: 36, zIndex: 50,
                            background: 'var(--surface-1)',
                            border: '1px solid var(--divider)',
                            borderRadius: 12,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                            minWidth: 140,
                            overflow: 'hidden',
                          }}>
                            <button
                              onClick={() => {
                                setEditingBudgetId(budget.id);
                                setEditAmount(String(budget.amount / 100));
                                setOpenMenuId(null);
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                width: '100%', padding: '11px 14px',
                                fontSize: 13, fontWeight: 500, color: 'var(--text-1)',
                                background: 'none', border: 'none', cursor: 'pointer',
                                borderBottom: '1px solid var(--divider)',
                              }}
                            >
                              <i className="fa-solid fa-pen" style={{ fontSize: 12, color: 'var(--text-3)', width: 14 }} />
                              Edit Amount
                            </button>
                            <button
                              onClick={() => handleDelete(budget.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                width: '100%', padding: '11px 14px',
                                fontSize: 13, fontWeight: 500, color: 'var(--expense)',
                                background: 'none', border: 'none', cursor: 'pointer',
                              }}
                            >
                              <i className="fa-solid fa-trash" style={{ fontSize: 12, width: 14 }} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Edit amount inline */}
                    {isEditing && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, background: 'var(--surface-2)', borderRadius: 10, padding: '0 12px' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-3)', marginRight: 4 }}>₱</span>
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            autoFocus
                            style={{
                              flex: 1, background: 'none', border: 'none', outline: 'none',
                              fontSize: 15, fontWeight: 600, color: 'var(--text-1)', padding: '10px 0',
                              fontFamily: 'inherit',
                            }}
                          />
                        </div>
                        <button
                          onClick={() => handleEditSave(budget.id)}
                          className="btn-primary"
                          style={{ padding: '10px 16px', fontSize: 13, borderRadius: 10, minWidth: 'auto' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingBudgetId(null)}
                          className="btn-secondary"
                          style={{ padding: '10px 14px', fontSize: 13, borderRadius: 10, minWidth: 'auto' }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Progress section */}
                  <div style={{ padding: '0 16px 12px' }}>
                    {/* Amount stats row */}
                    <div className="flex justify-between items-baseline" style={{ marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 20, fontWeight: 700, color: over ? 'var(--expense)' : 'var(--text-1)', letterSpacing: -0.5 }}>
                          {formatPHP(spent)}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 4 }}>
                          of {formatPHP(budget.amount)}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Remaining</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: remaining < 0 ? 'var(--expense)' : 'var(--income)' }}>
                          {remaining < 0 ? '-' : ''}{formatPHP(Math.abs(remaining))}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="budget-bar-track">
                      <div
                        className="budget-bar-fill animate-bar-grow"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>

                    {over && (
                      <p style={{ fontSize: 11, color: 'var(--expense)', marginTop: 5, fontWeight: 600 }}>
                        ⚠️ Over budget by {formatPHP(spent - budget.amount)}
                      </p>
                    )}
                  </div>

                  {/* Add Expense button — contextual to this budget */}
                  <div style={{ borderTop: '1px solid var(--divider)', padding: '10px 16px' }}>
                    <button
                      onClick={() => openAddSheet(undefined, budget.categoryId)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        width: '100%', padding: '9px 0',
                        fontSize: 13, fontWeight: 600,
                        color: cat?.color ?? 'var(--income)',
                        background: `${cat?.color ?? 'var(--income)'}14`,
                        border: `1.5px solid ${cat?.color ?? 'var(--income)'}40`,
                        borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                        fontFamily: 'inherit',
                      }}
                    >
                      <i className="fa-solid fa-plus" style={{ fontSize: 11 }} />
                      Add Expense to {cat?.name ?? 'Category'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Budget Form Modal */}
      {showForm && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-end',
          }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="sheet-panel animate-slide-up"
            style={{ width: '100%', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20 }}>
              New Budget
            </p>

            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>
              Category
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
              {(() => {
                const limit        = settings.categoryLimit === 'all' ? expenseCategories.length : settings.categoryLimit;
                const displayLimit = showAllCategories ? expenseCategories.length : (expenseCategories.length > limit ? limit - 1 : limit);
                const filteredCats = expenseCategories.slice(0, displayLimit);
                const hasMoreCats  = !showAllCategories && expenseCategories.length > limit;

                // Grey out categories that already have a budget
                const takenCatIds = new Set(budgets.map(b => b.categoryId));

                return (
                  <>
                    {filteredCats.map((c) => {
                      const active  = formCatId === c.id;
                      const taken   = takenCatIds.has(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => !taken && setFormCatId(c.id)}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                            padding: '10px 4px', borderRadius: 12,
                            border: active ? `2px solid ${c.color}` : '2px solid transparent',
                            background: active ? `${c.color}18` : 'var(--surface-2)',
                            cursor: taken ? 'not-allowed' : 'pointer',
                            opacity: taken ? 0.4 : 1,
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, background: `${c.color}22`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <i className={`fa-solid ${c.icon}`} style={{ color: c.color, fontSize: 14 }} />
                          </div>
                          <span style={{ fontSize: 10, color: active ? c.color : 'var(--text-2)', fontWeight: active ? 700 : 500, textAlign: 'center', lineHeight: 1.2 }}>
                            {c.name}
                          </span>
                        </button>
                      );
                    })}
                    {hasMoreCats && (
                      <button
                        onClick={() => setShowAllCategories(true)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 4px', borderRadius: 12, border: '2px solid transparent', background: 'var(--surface-2)', cursor: 'pointer' }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fa-solid fa-ellipsis" style={{ color: 'var(--text-2)', fontSize: 14 }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 500 }}>More</span>
                      </button>
                    )}
                    {showAllCategories && expenseCategories.length > limit && (
                      <button
                        onClick={() => setShowAllCategories(false)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 4px', borderRadius: 12, border: '2px solid transparent', background: 'var(--surface-2)', cursor: 'pointer' }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fa-solid fa-chevron-up" style={{ color: 'var(--text-2)', fontSize: 14 }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 500 }}>Less</span>
                      </button>
                    )}
                  </>
                );
              })()}
            </div>

            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>
              Limit Amount (₱)
            </p>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 5000"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              style={{ marginBottom: 16 }}
            />

            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>
              Period
            </p>
            <div className="segment-control" style={{ marginBottom: 24 }}>
              {(['monthly', 'weekly', 'daily'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setFormPeriod(p)}
                  className={`segment-btn ${formPeriod === p ? 'active' : ''}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {p}
                </button>
              ))}
            </div>

            <button onClick={handleAddBudget} className="btn-primary">
              Save Budget
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
