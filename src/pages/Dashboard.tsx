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

  // Recent transactions — last 10, sorted newest first
  const recentTxns = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  const today = new Date();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-blue-600 dark:bg-blue-700 pt-safe px-5 pb-8">
        <div className="pt-4 flex items-center justify-between mb-6">
          <div>
            <p className="text-blue-200 text-sm font-medium">
              {GREETINGS()} 👋
            </p>
            <p className="text-white font-semibold text-base mt-0.5">
              {format(today, 'EEEE, MMMM d')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="w-9 h-9 rounded-full bg-blue-500/40 hover:bg-blue-500/60 flex items-center justify-center transition-colors"
            >
              <i className="fa-solid fa-bell text-white text-sm" />
            </button>
          </div>
        </div>

        {/* ── Net Worth Card ─────────────────────────────────────────────── */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-blue-100 text-sm font-medium">Total Net Worth</p>
            <button
              onClick={() => setNetWorthVisible((v) => !v)}
              aria-label={netWorthVisible ? 'Hide balance' : 'Show balance'}
              className="text-blue-200 hover:text-white transition-colors"
            >
              <i className={`fa-solid ${netWorthVisible ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
            </button>
          </div>
          <p
            id="net-worth-amount"
            className="net-worth-amount text-white mb-1"
            style={{ filter: netWorthVisible ? 'none' : 'blur(12px)' }}
          >
            {formatPHP(netWorth)}
          </p>
          <p className="text-blue-200 text-xs">
            Across {activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="px-4 -mt-4 space-y-4">

        {/* ── Account Cards Row ────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Accounts
            </h2>
            <button
              onClick={onNavigateToAccounts}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold"
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

        {/* ── Period Toggle + Summary ──────────────────────────────────── */}
        <section className="card">
          {/* Period Tabs */}
          <div className="flex items-center gap-1 mb-4 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                id={`period-${p.id}`}
                onClick={() => setPeriod(p.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  period === p.id
                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm'
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
            />
            <StatCard
              label="Expenses"
              amount={formatPHP(totalExpense)}
              icon="fa-arrow-up-from-line"
              variant="expense"
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
        </section>

        {/* ── Recent Transactions ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Recent Transactions
            </h2>
            <button
              onClick={onNavigateToTransactions}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold"
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

        {/* ── Quick Actions ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3">
            Quick Add
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Income',   icon: 'fa-plus-circle',   color: '#16A34A', bg: 'bg-green-50 dark:bg-green-900/20', action: () => openAddSheet() },
              { label: 'Expense',  icon: 'fa-minus-circle',  color: '#EF4444', bg: 'bg-red-50 dark:bg-red-900/20',    action: () => openAddSheet() },
              { label: 'Transfer', icon: 'fa-right-left',    color: '#2563EB', bg: 'bg-blue-50 dark:bg-blue-900/20',  action: () => openAddSheet() },
            ].map((q) => (
              <button
                key={q.label}
                onClick={q.action}
                className={`${q.bg} rounded-2xl p-4 flex flex-col items-center gap-2 hover:opacity-80 transition-opacity active:scale-95`}
              >
                <i className={`fa-solid ${q.icon} text-xl`} style={{ color: q.color }} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{q.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
