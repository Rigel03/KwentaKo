import { format, parseISO, isAfter } from 'date-fns';
import { useStore } from '../store/useStore';
import { getBudgetSpentAmount } from '../utils/calculations';
import { formatPHP } from '../utils/currency';
import type { Budget } from '../types';
import BudgetExpenseModal from '../components/modals/BudgetExpenseModal';
import BudgetFormModal from '../components/modals/BudgetFormModal';
import { useState } from 'react';

// ─── Date window display (text-only, no emoji) ────────────────────────────────
function formatWindow(budget: Budget): string {
  if (!budget.startDate || !budget.endDate) return '';
  const s = parseISO(budget.startDate);
  const e = parseISO(budget.endDate);
  if (budget.period === 'daily')   return format(s, 'MMMM d, yyyy');
  if (budget.period === 'weekly')  return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
  if (budget.period === 'monthly') return format(s, 'MMMM yyyy');
  // custom
  return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
}

function periodLabel(budget: Budget): string {
  if (budget.period === 'custom') return 'One-Time';
  return budget.period.charAt(0).toUpperCase() + budget.period.slice(1);
}

// ─── Budget Card ─────────────────────────────────────────────────────────────

interface CardProps {
  budget: Budget;
  archived?: boolean;
  onAddExpense: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function BudgetCard({ budget, archived, onAddExpense, onEdit, onDelete }: CardProps) {
  const transactions = useStore((s) => s.transactions);
  const categories   = useStore((s) => s.categories);
  const [menuOpen, setMenuOpen] = useState(false);

  const cat       = categories.find((c) => c.id === budget.categoryId);
  const spent     = getBudgetSpentAmount(budget, transactions);
  const remaining = budget.amount - spent;
  const pct       = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
  const over      = spent > budget.amount;
  const barColor  = over ? 'var(--expense)' : pct > 80 ? '#FF9F0A' : 'var(--income)';

  return (
    <div
      className="card"
      style={{ padding: 0, overflow: 'visible', opacity: archived ? 0.65 : 1 }}
      onClick={() => menuOpen && setMenuOpen(false)}
    >
      {/* Header row */}
      <div style={{ padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>

          {/* Left: icon + names */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: cat?.color ?? 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`fa-solid ${cat?.icon ?? 'fa-tag'}`} style={{ color: '#fff', fontSize: 16 }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2 }}>
                {budget.title}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                {cat?.name} · {periodLabel(budget)}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                {formatWindow(budget)}
              </p>
            </div>
          </div>

          {/* Right: 3-dot menu */}
          {!archived && (
            <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="icon-btn"
                style={{ width: 32, height: 32, borderRadius: 8, marginTop: 2 }}
                aria-label="Budget options"
              >
                <i className="fa-solid fa-ellipsis-vertical" style={{ fontSize: 14 }} />
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 36, zIndex: 50,
                  background: 'var(--surface)',
                  border: '1px solid var(--divider)',
                  borderRadius: 14,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.20)',
                  minWidth: 148,
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => { onEdit(); setMenuOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '12px 16px',
                      fontSize: 13, fontWeight: 600, color: 'var(--text-1)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: '1px solid var(--divider)', fontFamily: 'inherit',
                    }}
                  >
                    <i className="fa-solid fa-pen" style={{ fontSize: 12, color: 'var(--text-3)', width: 14 }} />
                    Edit Budget
                  </button>
                  <button
                    onClick={() => { onDelete(); setMenuOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '12px 16px',
                      fontSize: 13, fontWeight: 600, color: 'var(--expense)',
                      background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <i className="fa-solid fa-trash" style={{ fontSize: 12, width: 14 }} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress section */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: 20, fontWeight: 800, color: over ? 'var(--expense)' : 'var(--text-1)', letterSpacing: -0.5 }}>
              {formatPHP(spent)}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 5 }}>of {formatPHP(budget.amount)}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Remaining</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: remaining < 0 ? 'var(--expense)' : 'var(--income)', letterSpacing: -0.3 }}>
              {remaining < 0 ? '−' : ''}{formatPHP(Math.abs(remaining))}
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
            Over budget by {formatPHP(spent - budget.amount)}
          </p>
        )}
      </div>

      {/* Add Expense button (hidden on archived) */}
      {!archived && (
        <div style={{ borderTop: '1px solid var(--divider)', padding: '10px 16px' }}>
          <button
            onClick={onAddExpense}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '9px 0',
              fontSize: 13, fontWeight: 600,
              color: cat?.color ?? 'var(--income)',
              background: `${cat?.color ?? '#4caf50'}14`,
              border: `1.5px solid ${cat?.color ?? '#4caf50'}40`,
              borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            <i className="fa-solid fa-plus" style={{ fontSize: 11 }} />
            Add Expense to {budget.title}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const transactions = useStore((s) => s.transactions);
  const budgets      = useStore((s) => s.budgets);
  const deleteBudget = useStore((s) => s.deleteBudget);
  const showToast    = useStore((s) => s.showToast);

  const [showForm,        setShowForm]        = useState(false);
  const [editingBudget,   setEditingBudget]   = useState<Budget | undefined>(undefined);
  const [expenseBudget,   setExpenseBudget]   = useState<Budget | undefined>(undefined);

  const now = new Date();

  // Partition budgets into active and archived
  const activeBudgets   = budgets.filter((b) => b.isRecurring || !isAfter(now, parseISO(b.endDate)));
  const archivedBudgets = budgets.filter((b) => !b.isRecurring && isAfter(now, parseISO(b.endDate)));

  const totalBudgeted  = activeBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent     = activeBudgets.reduce((s, b) => s + getBudgetSpentAmount(b, transactions), 0);
  const totalRemaining = totalBudgeted - totalSpent;

  const handleDelete = (id: string) => {
    deleteBudget(id);
    showToast('Budget removed.', 'info');
  };

  return (
    <div className="min-h-screen animate-fade-in" style={{ backgroundColor: 'var(--bg)' }}>

      {/* Header */}
      <div className="header-container" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="header-title">Budget</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
            Spending envelopes by category
          </p>
        </div>
        <button
          onClick={() => { setEditingBudget(undefined); setShowForm(true); }}
          aria-label="Add budget"
          className="icon-btn"
          style={{ width: 40, height: 40, borderRadius: 12 }}
        >
          <i className="fa-solid fa-plus" style={{ fontSize: 16 }} />
        </button>
      </div>

      <div className="px-5 space-y-4 pb-8">

        {/* Summary bar — only when active budgets exist */}
        {activeBudgets.length > 0 && (
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>Budgeted</p>
                <p style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.5, color: 'var(--text-1)' }}>
                  {formatPHP(totalBudgeted)}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>Spent</p>
                <p style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.5, color: totalSpent > totalBudgeted ? 'var(--expense)' : 'var(--text-1)' }}>
                  {formatPHP(totalSpent)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>Remaining</p>
                <p style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.5, color: totalRemaining < 0 ? 'var(--expense)' : 'var(--income)' }}>
                  {totalRemaining < 0 ? '−' : ''}{formatPHP(Math.abs(totalRemaining))}
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
        {budgets.length === 0 && (
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
              onClick={() => { setEditingBudget(undefined); setShowForm(true); }}
              className="btn-primary"
              style={{ maxWidth: 200, margin: '0 auto' }}
            >
              <i className="fa-solid fa-plus" />
              Add Budget
            </button>
          </div>
        )}

        {/* Active budget cards */}
        {activeBudgets.length > 0 && (
          <div className="space-y-3">
            {activeBudgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onAddExpense={() => setExpenseBudget(budget)}
                onEdit={() => { setEditingBudget(budget); setShowForm(true); }}
                onDelete={() => handleDelete(budget.id)}
              />
            ))}
          </div>
        )}

        {/* Past / Archived budgets */}
        {archivedBudgets.length > 0 && (
          <div>
            <p className="section-label" style={{ marginTop: 8, marginBottom: 10 }}>
              Past Budgets
            </p>
            <div className="space-y-3">
              {archivedBudgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  archived
                  onAddExpense={() => {}}
                  onEdit={() => {}}
                  onDelete={() => handleDelete(budget.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Budget modal */}
      {showForm && (
        <BudgetFormModal
          budget={editingBudget}
          onClose={() => { setShowForm(false); setEditingBudget(undefined); }}
        />
      )}

      {/* Budget-specific expense modal */}
      {expenseBudget && (
        <BudgetExpenseModal
          budget={expenseBudget}
          onClose={() => setExpenseBudget(undefined)}
        />
      )}
    </div>
  );
}
