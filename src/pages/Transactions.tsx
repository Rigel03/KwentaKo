import { useState, useMemo } from 'react';
import { format, parseISO, isToday, isYesterday, startOfDay } from 'date-fns';
import { useStore } from '../store/useStore';
import { getPeriodSummary } from '../utils/calculations';
import { formatPHP } from '../utils/currency';
import TransactionRow from '../components/ui/TransactionRow';
import EmptyState from '../components/ui/EmptyState';
import type { TransactionType, Transaction } from '../types';

const TYPE_OPTIONS: { id: TransactionType | 'all'; label: string; gradient: string }[] = [
  { id: 'all',      label: 'All',      gradient: 'linear-gradient(135deg, #4F46E5, #2563EB)' },
  { id: 'income',   label: 'Income',   gradient: 'linear-gradient(135deg, #16A34A, #22C55E)' },
  { id: 'expense',  label: 'Expense',  gradient: 'linear-gradient(135deg, #DC2626, #EF4444)' },
  { id: 'transfer', label: 'Transfer', gradient: 'linear-gradient(135deg, #4F46E5, #7C3AED)' },
];

function dateHeader(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMMM d, yyyy');
}

export default function Transactions() {
  const transactions = useStore((s) => s.transactions);
  const openAddSheet = useStore((s) => s.openAddSheet);

  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return [...transactions]
      .filter((t) => {
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return t.note?.toLowerCase().includes(q) ?? false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, typeFilter, search]);

  // Group by date
  const grouped = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const key = startOfDay(parseISO(t.date)).toISOString();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 pt-6 pb-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Transactions
        </h1>

        {/* Search */}
        <div className="relative mb-3">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            id="search-transactions"
            type="search"
            placeholder="Search by note…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        {/* Type Filter — colored gradient pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              id={`filter-${opt.id}`}
              onClick={() => setTypeFilter(opt.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                typeFilter === opt.id
                  ? 'text-white shadow-md scale-105'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
              style={typeFilter === opt.id ? { background: opt.gradient } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-4 py-4 space-y-5">
        {grouped.length === 0 ? (
          <EmptyState
            icon="fa-receipt"
            title={search ? 'No Results' : 'No Transactions Yet'}
            description={
              search
                ? `No transactions matching "${search}"`
                : 'Start by adding your first income or expense entry.'
            }
            actionLabel={!search ? 'Add Entry' : undefined}
            onAction={!search ? () => openAddSheet() : undefined}
          />
        ) : (
          grouped.map(([dateKey, txns]) => {
            // Daily net: income minus expense (transfers excluded)
            const { totalIncome, totalExpense } = getPeriodSummary(txns);
            const dailyNet = totalIncome - totalExpense;
            const hasNetActivity = totalIncome > 0 || totalExpense > 0;

            return (
              <div key={dateKey}>
                {/* Sticky Date Group Header */}
                <div className="date-group-header mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {dateHeader(txns[0].date)}
                    </p>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      · {txns.length} item{txns.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Daily net total */}
                  {hasNetActivity && (
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                        dailyNet >= 0
                          ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                          : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
                      }`}
                    >
                      {dailyNet >= 0 ? '+' : ''}{formatPHP(dailyNet)}
                    </span>
                  )}
                </div>

                <div className="card p-0 overflow-hidden">
                  {txns.map((txn) => (
                    <TransactionRow key={txn.id} transaction={txn} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
