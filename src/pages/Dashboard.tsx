import { useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { getNetWorth, filterByPeriod, getPeriodSummary } from '../utils/calculations';
import { formatPHP } from '../utils/currency';
import AccountCard from '../components/ui/AccountCard';
import StatCard from '../components/ui/StatCard';
import TransactionRow from '../components/ui/TransactionRow';
import EmptyState from '../components/ui/EmptyState';
import type { PeriodFilter } from '../types';

const PERIODS: { id: PeriodFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week',  label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year',  label: 'Year' },
];

const GREETINGS = () => {
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
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [netWorthVisible, setNetWorthVisible] = useState(true);

  const accounts     = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const openAddSheet = useStore((s) => s.openAddSheet);

  const activeAccounts = accounts.filter((a) => a.isActive);
  const netWorth       = getNetWorth(activeAccounts, transactions);

  const periodTxns = filterByPeriod(transactions, period);
  const { totalIncome, totalExpense } = getPeriodSummary(periodTxns);

  // Spending ratio (capped at 100%)
  const spendRatio = totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 0;
  const spendBarColor =
    spendRatio < 60
      ? 'linear-gradient(90deg, #16A34A, #22C55E)'
      : spendRatio < 85
      ? 'linear-gradient(90deg, #D97706, #F59E0B)'
      : 'linear-gradient(90deg, #DC2626, #EF4444)';
  const spendLabel =
    spendRatio < 60 ? 'Great shape 🟢' : spendRatio < 85 ? 'Watch your spending 🟡' : 'Over budget 🔴';

  // Recent transactions — last 10, sorted newest first
  const recentTxns = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  const today = new Date();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-6">
      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="hero-gradient pt-safe px-5 pb-10">
        {/* Top bar */}
        <div className="pt-4 flex items-center justify-between mb-6">
          <div>
            <p className="text-indigo-200 text-sm font-medium">
              {GREETINGS()} 👋
            </p>
            <p className="text-white font-semibold text-base mt-0.5">
              {format(today, 'EEEE, MMMM d')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors relative"
            >
              <i className="fa-solid fa-bell text-white text-sm" />
              {/* Notification dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-400 rounded-full animate-ring-pulse" />
            </button>
          </div>
        </div>

        {/* ── Glassmorphism Net Worth Card ─────────────────────────────── */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Total Net Worth</p>
            <button
              onClick={() => setNetWorthVisible((v) => !v)}
              aria-label={netWorthVisible ? 'Hide balance' : 'Show balance'}
              className="text-white/60 hover:text-white transition-colors"
            >
              <i className={`fa-solid ${netWorthVisible ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
            </button>
          </div>
          <p
            id="net-worth-amount"
            className="net-worth-amount text-white mb-1 mt-2"
            style={{ filter: netWorthVisible ? 'none' : 'blur(12px)', transition: 'filter 0.3s ease' }}
          >
            {formatPHP(netWorth)}
          </p>
          <p className="text-white/50 text-xs mt-1">
            Across {activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="px-4 -mt-6 space-y-4">

        {/* ── Account Cards Row ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Accounts
            </h2>
            <button
              onClick={onNavigateToAccounts}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
            >
              See All <i className="fa-solid fa-chevron-right text-xs ml-0.5" />
            </button>
          </div>

          {activeAccounts.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="fa-wallet"
                title="No Accounts Yet"
                description="Add an account to start tracking your money."
                actionLabel="Add Account"
                onAction={onNavigateToAccounts}
              />
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
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

        {/* ── Period Toggle + Summary ────────────────────────────────────── */}
        <section className="card">
          {/* Period Tabs */}
          <div className="flex items-center gap-1 mb-4 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                id={`period-${p.id}`}
                onClick={() => setPeriod(p.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  period === p.id
                    ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Income vs Expense */}
          <div className="flex gap-3">
            <StatCard
              label="Income"
              amount={formatPHP(totalIncome)}
              icon="fa-arrow-down-to-line"
              variant="income"
              percentage={100}
              maxPercentage={100}
            />
            <StatCard
              label="Expenses"
              amount={formatPHP(totalExpense)}
              icon="fa-arrow-up-from-line"
              variant="expense"
              percentage={spendRatio}
              maxPercentage={100}
            />
          </div>

          {/* Net for period */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Net ({PERIODS.find((p2) => p2.id === period)?.label})
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                totalIncome - totalExpense >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-500 dark:text-red-400'
              }`}
            >
              {totalIncome - totalExpense >= 0 ? '+' : ''}
              {formatPHP(totalIncome - totalExpense)}
            </span>
          </div>

          {/* Spending Ratio Bar */}
          {totalIncome > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Spending ratio
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {spendLabel}
                </span>
              </div>
              <div className="spending-bar-track">
                <div
                  className="spending-bar-fill animate-bar-grow"
                  style={{ width: `${spendRatio}%`, background: spendBarColor }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 text-right">
                {spendRatio.toFixed(0)}% of income spent
              </p>
            </div>
          )}
        </section>

        {/* ── Recent Transactions ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Recent Transactions
            </h2>
            <button
              onClick={onNavigateToTransactions}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
            >
              See All <i className="fa-solid fa-chevron-right text-xs ml-0.5" />
            </button>
          </div>

          {recentTxns.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="fa-receipt"
                title="No Transactions Yet"
                description="Tap the + button below to log your first income or expense."
                actionLabel="Add First Entry"
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

        {/* ── Quick Actions ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
            Quick Add
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Income',   icon: 'fa-plus-circle',  bg: 'bg-gradient-to-br from-green-400 to-green-600', action: () => openAddSheet() },
              { label: 'Expense',  icon: 'fa-minus-circle', bg: 'bg-gradient-to-br from-red-400 to-red-600',    action: () => openAddSheet() },
              { label: 'Transfer', icon: 'fa-right-left',   bg: 'bg-gradient-to-br from-indigo-400 to-blue-600', action: () => openAddSheet() },
            ].map((q) => (
              <button
                key={q.label}
                onClick={q.action}
                className={`${q.bg} rounded-2xl p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-all duration-150 active:scale-95 shadow-md`}
              >
                <i className={`fa-solid ${q.icon} text-xl text-white`} />
                <span className="text-xs font-semibold text-white">{q.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
