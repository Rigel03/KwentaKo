import { useState } from 'react';
import { useStore } from '../store/useStore';
import { filterByPeriod } from '../utils/calculations';
import { formatPHP } from '../utils/currency';
import type { Budget } from '../types';

export default function BudgetPage() {
  const transactions = useStore((s) => s.transactions);
  const categories   = useStore((s) => s.categories);
  const openAddSheet = useStore((s) => s.openAddSheet);

  // Local budget state (persisted in component for now — can be wired to store later)
  const [budgets, setBudgets]   = useState<Budget[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formCatId, setFormCatId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formPeriod, setFormPeriod] = useState<'monthly' | 'weekly'>('monthly');


  const thisMonthTxns = filterByPeriod(transactions, 'month');

  const expenseCategories = categories.filter(
    (c) => c.isActive && (c.type === 'expense' || c.type === 'both'),
  );

  // Spending per category this month
  const spentByCat = (catId: string): number =>
    thisMonthTxns
      .filter((t) => t.type === 'expense' && t.categoryId === catId)
      .reduce((s, t) => s + t.amount, 0);

  const handleAddBudget = () => {
    if (!formCatId || !formAmount) return;
    const amountCentavos = Math.round(parseFloat(formAmount) * 100);
    if (isNaN(amountCentavos) || amountCentavos <= 0) return;

    const newBudget: Budget = {
      id: `budget-${Date.now()}`,
      categoryId: formCatId,
      amount: amountCentavos,
      period: formPeriod,
      createdAt: new Date().toISOString(),
    };

    setBudgets((prev) => {
      const filtered = prev.filter((b) => b.categoryId !== formCatId);
      return [...filtered, newBudget];
    });

    setShowForm(false);
    setFormCatId('');
    setFormAmount('');
  };

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent    = budgets.reduce((s, b) => s + spentByCat(b.categoryId), 0);

  return (
    <div className="min-h-screen animate-fade-in" style={{ backgroundColor: 'var(--bg)' }}>

      {/* Header */}
      <div className="pt-safe page-header pt-6">
        <div>
          <p className="page-title">Budget</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
            This month's spending envelopes
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
            <div className="flex items-center justify-between mb-3">
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Total Budgeted</p>
                <p style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: 'var(--text-1)' }}>
                  {formatPHP(totalBudgeted)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Spent</p>
                <p style={{
                  fontSize: 24, fontWeight: 700, letterSpacing: -0.5,
                  color: totalSpent > totalBudgeted ? 'var(--expense)' : 'var(--text-1)',
                }}>
                  {formatPHP(totalSpent)}
                </p>
              </div>
            </div>
            <div className="budget-bar-track">
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

        {/* Budget Items */}
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
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {budgets.map((budget, i) => {
              const cat      = categories.find((c) => c.id === budget.categoryId);
              const spent    = spentByCat(budget.categoryId);
              const pct      = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
              const over     = spent > budget.amount;
              const barColor = over ? 'var(--expense)' : pct > 80 ? '#FF9F0A' : 'var(--income)';

              return (
                <div
                  key={budget.id}
                  style={{
                    padding: '14px 16px',
                    borderBottom: i < budgets.length - 1 ? '1px solid var(--divider)' : 'none',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: cat?.color ?? 'var(--surface-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className={`fa-solid ${cat?.icon ?? 'fa-tag'}`} style={{ color: '#fff', fontSize: 14 }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
                          {cat?.name ?? 'Unknown'}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                          {budget.period === 'monthly' ? 'Monthly' : 'Weekly'}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: over ? 'var(--expense)' : 'var(--text-1)' }}>
                        {formatPHP(spent)}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        of {formatPHP(budget.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="budget-bar-track">
                    <div
                      className="budget-bar-fill animate-bar-grow"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                  {over && (
                    <p style={{ fontSize: 11, color: 'var(--expense)', marginTop: 4, fontWeight: 500 }}>
                      Over by {formatPHP(spent - budget.amount)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Add Entry */}
        <button
          onClick={() => openAddSheet()}
          className="btn-secondary"
          style={{ marginTop: 8 }}
        >
          <i className="fa-solid fa-plus" />
          Log a Transaction
        </button>

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
            style={{
              width: '100%',
              borderRadius: '24px 24px 0 0',
              padding: '24px 20px 40px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20 }}>
              Set Budget
            </p>

            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>
              Category
            </p>
            <select
              value={formCatId}
              onChange={(e) => setFormCatId(e.target.value)}
              className="input-field"
              style={{ marginBottom: 16 }}
            >
              <option value="">Select a category…</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

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
              {(['monthly', 'weekly'] as const).map((p) => (
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
