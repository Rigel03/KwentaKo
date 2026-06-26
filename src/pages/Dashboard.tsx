import { useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { getNetWorth, filterByPeriod, getPeriodSummary } from '../utils/calculations';
import { formatPHP } from '../utils/currency';
import TransactionRow from '../components/ui/TransactionRow';
import EmptyState from '../components/ui/EmptyState';
import type { PeriodFilter, ThemeMode } from '../types';

const THEME_CYCLE: ThemeMode[] = ['light', 'dark', 'cozy', 'amoled'];
const THEME_ICONS: Record<ThemeMode, string> = {
  light:  'fa-sun',
  dark:   'fa-moon',
  cozy:   'fa-mug-hot',
  amoled: 'fa-circle-half-stroke',
  system: 'fa-circle-half-stroke',
};

const PERIODS: { id: PeriodFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week',  label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year',  label: 'Year' },
];

const GREETING = (name?: string) => {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${g}, ${name}` : g;
};

interface DashboardProps {
  onNavigateToTransactions: () => void;
  onNavigateToAccounts: () => void;
}

export default function Dashboard({ onNavigateToTransactions, onNavigateToAccounts }: DashboardProps) {
  const [period, setPeriod]           = useState<PeriodFilter>('month');
  const [balanceVisible, setBalanceVisible] = useState(true);

  const accounts     = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const settings     = useStore((s) => s.settings);
  const setTheme     = useStore((s) => s.setTheme);
  const openAddSheet = useStore((s) => s.openAddSheet);

  const cycleTheme = () => {
    const idx  = THEME_CYCLE.indexOf(settings.theme as ThemeMode);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    setTheme(next);
  };

  const activeAccounts = accounts.filter((a) => a.isActive);
  const netWorth       = getNetWorth(activeAccounts, transactions);

  const periodTxns = filterByPeriod(transactions, period);
  const { totalIncome, totalExpense } = getPeriodSummary(periodTxns);
  const net = totalIncome - totalExpense;

  const spendRatio = totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 0;
  const spendColor =
    spendRatio < 60  ? 'var(--income)' :
    spendRatio < 85  ? '#FF9F0A'       : 'var(--expense)';

  const recentTxns = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const today = new Date();

  return (
    <div className="min-h-screen animate-fade-in" style={{ backgroundColor: 'var(--bg)' }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="pt-safe px-5 pt-4 flex items-center justify-between mb-2">
        <div>
          <p style={{ color: 'var(--text-3)', fontSize: 13, fontWeight: 500 }}>
            {format(today, 'EEEE, MMMM d')}
          </p>
          <p style={{ color: 'var(--text-1)', fontSize: 17, fontWeight: 600, marginTop: 1 }}>
            {GREETING(settings.userName)} 👋
          </p>
        </div>
        <button
          onClick={cycleTheme}
          aria-label="Toggle theme"
          className="icon-btn"
        >
          <i className={`fa-solid ${THEME_ICONS[settings.theme as ThemeMode] ?? 'fa-circle-half-stroke'}`} style={{ fontSize: 15 }} />
        </button>
      </div>

      {/* ── Balance Hero ─────────────────────────────────────────────────── */}
      <div className="px-5 py-4 mb-2">
        <p className="balance-label mb-2">Total Net Worth</p>
        <div className="flex items-center gap-3">
          <p
            id="net-worth-amount"
            className="balance-amount"
            style={{
              filter: balanceVisible ? 'none' : 'blur(14px)',
              transition: 'filter 0.3s ease',
              userSelect: 'none',
            }}
          >
            {formatPHP(netWorth)}
          </p>
          <button
            onClick={() => setBalanceVisible((v) => !v)}
            aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
            style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <i className={`fa-solid ${balanceVisible ? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: 16 }} />
          </button>
        </div>
        <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 4 }}>
          Across {activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div className="px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: 'Income',   icon: 'fa-arrow-down',  color: 'var(--income)',   bg: 'rgba(52,199,89,0.12)'  },
            { label: 'Expense',  icon: 'fa-arrow-up',    color: 'var(--expense)',  bg: 'rgba(255,59,48,0.12)'  },
            { label: 'Transfer', icon: 'fa-right-left',  color: 'var(--transfer)', bg: 'rgba(0,122,255,0.12)'  },
          ].map((q) => (
            <button
              key={q.label}
              onClick={() => openAddSheet()}
              className="quick-action"
            >
              <div
                className="quick-action-icon"
                style={{ backgroundColor: q.bg, color: q.color }}
              >
                <i className={`fa-solid ${q.icon}`} style={{ fontSize: 18 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
                {q.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Account Cards ────────────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="px-5 flex items-center justify-between mb-3">
          <p className="section-label" style={{ marginBottom: 0 }}>Accounts</p>
          <button
            onClick={onNavigateToAccounts}
            className="btn-ghost"
            style={{ padding: '4px 10px', fontSize: 13 }}
          >
            See all <i className="fa-solid fa-chevron-right" style={{ fontSize: 11 }} />
          </button>
        </div>

        {activeAccounts.length === 0 ? (
          <div className="px-5">
            <div className="card">
              <EmptyState
                icon="fa-wallet"
                title="No Accounts Yet"
                description="Add an account to start tracking."
                actionLabel="Add Account"
                onAction={onNavigateToAccounts}
              />
            </div>
          </div>
        ) : (
          <div
            className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1"
          >
            {activeAccounts.map((acc) => (
              <button
                key={acc.id}
                onClick={onNavigateToAccounts}
                className="account-card"
                style={{
                  background: acc.color,
                  minWidth: 160,
                  textAlign: 'left',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <i className={`fa-solid ${acc.icon}`} style={{ color: '#fff', fontSize: 16 }} />
                  </div>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 500 }}>
                  {acc.name}
                </p>
                <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: -0.5, marginTop: 2 }}>
                  {formatPHP(acc.type === 'cash'
                    ? transactions.filter(t => t.accountId === acc.id && t.type === 'income').reduce((s, t) => s + t.amount, 0)
                    - transactions.filter(t => t.accountId === acc.id && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
                    : 0
                  )}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Period Summary ───────────────────────────────────────────────── */}
      <div className="px-5 mb-5">
        {/* Segment control */}
        <div className="segment-control mb-4">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              id={`period-${p.id}`}
              onClick={() => setPeriod(p.id)}
              className={`segment-btn ${period === p.id ? 'active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Income / Expense pills */}
        <div className="flex gap-3 mb-3">
          <div className="stat-pill">
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(52,199,89,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fa-solid fa-arrow-down" style={{ color: 'var(--income)', fontSize: 13 }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Income</p>
              <p style={{ fontSize: 15, color: 'var(--text-1)', fontWeight: 700, letterSpacing: -0.3 }}>
                {formatPHP(totalIncome)}
              </p>
            </div>
          </div>
          <div className="stat-pill">
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(255,59,48,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fa-solid fa-arrow-up" style={{ color: 'var(--expense)', fontSize: 13 }} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Expenses</p>
              <p style={{ fontSize: 15, color: 'var(--text-1)', fontWeight: 700, letterSpacing: -0.3 }}>
                {formatPHP(totalExpense)}
              </p>
            </div>
          </div>
        </div>

        {/* Net + spend bar */}
        <div className="card" style={{ padding: 14 }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>
              Net ({PERIODS.find(p => p.id === period)?.label})
            </span>
            <span style={{
              fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color: net >= 0 ? 'var(--income)' : 'var(--expense)',
            }}>
              {net >= 0 ? '+' : ''}{formatPHP(net)}
            </span>
          </div>
          {totalIncome > 0 && (
            <>
              <div className="spending-bar-track">
                <div
                  className="spending-bar-fill animate-bar-grow"
                  style={{ width: `${spendRatio}%`, backgroundColor: spendColor }}
                />
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right', marginTop: 4 }}>
                {spendRatio.toFixed(0)}% of income spent
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Recent Transactions ──────────────────────────────────────────── */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label" style={{ marginBottom: 0 }}>Recent</p>
          <button
            onClick={onNavigateToTransactions}
            className="btn-ghost"
            style={{ padding: '4px 10px', fontSize: 13 }}
          >
            See all <i className="fa-solid fa-chevron-right" style={{ fontSize: 11 }} />
          </button>
        </div>

        {recentTxns.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="fa-receipt"
              title="No Transactions Yet"
              description="Tap the + button to log your first entry."
              actionLabel="Add First Entry"
              onAction={() => openAddSheet()}
            />
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {recentTxns.map((txn) => (
              <TransactionRow key={txn.id} transaction={txn} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
