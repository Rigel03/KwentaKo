import { useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { getNetWorth, filterByPeriod, getPeriodSummary } from '../utils/calculations';
import { formatPHP } from '../utils/currency';
import AccountCard from '../components/ui/AccountCard';
import TransactionRow from '../components/ui/TransactionRow';
import EmptyState from '../components/ui/EmptyState';
import WelcomeModal from '../components/modals/WelcomeModal';
import type { PeriodFilter } from '../types';

const PERIODS: { id: PeriodFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week',  label: 'Week'  },
  { id: 'month', label: 'Month' },
  { id: 'year',  label: 'Year'  },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

interface DashboardProps {
  onNavigateToTransactions: () => void;
  onNavigateToAccounts: () => void;
}

export default function Dashboard({ onNavigateToTransactions, onNavigateToAccounts }: DashboardProps) {
  const [period, setPeriod]             = useState<PeriodFilter>('month');
  const [balanceVisible, setBalanceVisible] = useState(true);

  const accounts     = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const settings     = useStore((s) => s.settings);
  const openAddSheet = useStore((s) => s.openAddSheet);

  const activeAccounts        = accounts.filter((a) => a.isActive);
  const netWorth              = getNetWorth(activeAccounts, transactions);
  const periodTxns            = filterByPeriod(transactions, period);
  const { totalIncome, totalExpense } = getPeriodSummary(periodTxns);
  const net                   = totalIncome - totalExpense;

  const recentTxns = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  const today = new Date();

  return (
    <div className="min-h-screen pb-6" style={{ background: 'var(--bg)' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-safe">
        <div className="pt-6 flex items-start justify-between mb-7">
          <div>
            <p style={{ color: 'var(--text-3)', fontSize: 13, fontWeight: 500 }}>
              {greeting()}{settings.userName ? `, ${settings.userName}` : ''} 👋
            </p>
            <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 2 }}>
              {format(today, 'EEEE, MMMM d')}
            </p>
          </div>
          <button
            aria-label="Notifications"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
          >
            <i className="fa-solid fa-bell text-sm" />
          </button>
        </div>

        {/* ── Net Worth ───────────────────────────────────────────────────── */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-1.5">
            <p style={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 500 }}>
              Net Worth
            </p>
            <button
              onClick={() => setBalanceVisible((v) => !v)}
              aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
              style={{ color: 'var(--text-3)', fontSize: 13 }}
            >
              <i className={`fa-solid ${balanceVisible ? 'fa-eye-slash' : 'fa-eye'}`} />
            </button>
          </div>
          <p
            id="net-worth-amount"
            className="net-worth-amount"
            style={{ filter: balanceVisible ? 'none' : 'blur(14px)' }}
          >
            {formatPHP(netWorth)}
          </p>
          <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 6 }}>
            {activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="px-4 space-y-5">

        {/* ── Period Tabs + Summary ─────────────────────────────────────── */}
        <div className="card">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            {PERIODS.map((p) => (
              <button
                key={p.id}
                id={`period-${p.id}`}
                onClick={() => setPeriod(p.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  period === p.id ? 'shadow-sm' : ''
                }`}
                style={{
                  background: period === p.id ? 'var(--surface)' : 'transparent',
                  color:      period === p.id ? 'var(--text-1)' : 'var(--text-3)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Income / Expense row */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <p style={{ color: 'var(--text-3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Income</p>
              <p className="font-bold font-mono text-base" style={{ color: 'var(--income)' }}>{formatPHP(totalIncome)}</p>
            </div>
            <div style={{ width: 1, background: 'var(--divider)' }} />
            <div className="flex-1">
              <p style={{ color: 'var(--text-3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Expenses</p>
              <p className="font-bold font-mono text-base" style={{ color: 'var(--expense)' }}>{formatPHP(totalExpense)}</p>
            </div>
          </div>

          {/* Net */}
          <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--divider)' }}>
            <span style={{ color: 'var(--text-3)', fontSize: 12, fontWeight: 500 }}>
              Net · {PERIODS.find((p2) => p2.id === period)?.label}
            </span>
            <span
              className="text-sm font-bold font-mono"
              style={{ color: net >= 0 ? 'var(--income)' : 'var(--expense)' }}
            >
              {net >= 0 ? '+' : ''}{formatPHP(net)}
            </span>
          </div>
        </div>

        {/* ── Accounts ─────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p style={{ color: 'var(--text-3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Accounts
            </p>
            <button
              onClick={onNavigateToAccounts}
              style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}
            >
              See All <i className="fa-solid fa-chevron-right text-xs ml-0.5" />
            </button>
          </div>

          {activeAccounts.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="fa-wallet"
                title="No accounts yet"
                description="Add your first account — Cash, GCash, Maya, BPI, or any wallet — to start tracking your money."
                actionLabel="Add Account"
                onAction={onNavigateToAccounts}
              />
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
              {activeAccounts.map((acc) => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  compact
                  onClick={onNavigateToAccounts}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Recent Transactions ───────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p style={{ color: 'var(--text-3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Recent
            </p>
            <button
              onClick={onNavigateToTransactions}
              style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}
            >
              See All <i className="fa-solid fa-chevron-right text-xs ml-0.5" />
            </button>
          </div>

          {recentTxns.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="fa-receipt"
                title={`Hello ${settings.userName || ''}!`}
                description="Add your first entry now to start tracking."
                actionLabel="Log First Entry"
                onAction={() => openAddSheet()}
              />
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              {recentTxns.map((txn) => (
                <TransactionRow key={txn.id} transaction={txn} />
              ))}
            </div>
          )}
        </section>

        {/* ── Quick Add ─────────────────────────────────────────────────── */}
        <section>
          <p style={{ color: 'var(--text-3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Quick Add
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Income',   icon: 'fa-arrow-down-to-line', color: 'var(--income)'   },
              { label: 'Expense',  icon: 'fa-arrow-up-from-line', color: 'var(--expense)'  },
              { label: 'Transfer', icon: 'fa-right-left',         color: 'var(--transfer)' },
            ].map((q) => (
              <button
                key={q.label}
                onClick={() => openAddSheet()}
                className="rounded-2xl p-4 flex flex-col items-center gap-2 transition-opacity active:scale-95"
                style={{ background: 'var(--surface)' }}
              >
                <i className={`fa-solid ${q.icon} text-lg`} style={{ color: q.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{q.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ── Welcome Onboarding Modal ────────────────────────────────────── */}
      {!settings.userName && <WelcomeModal />}
    </div>
  );
}
