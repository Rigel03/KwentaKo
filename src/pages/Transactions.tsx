import { useState, useMemo } from 'react';
import { format, parseISO, isToday, isYesterday, startOfDay } from 'date-fns';
import { useStore } from '../store/useStore';
import TransactionRow from '../components/ui/TransactionRow';
import EmptyState from '../components/ui/EmptyState';
import type { TransactionType } from '../types';

const TYPE_OPTIONS: { id: TransactionType | 'all'; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'income',   label: 'Income' },
  { id: 'expense',  label: 'Expense' },
  { id: 'transfer', label: 'Transfer' },
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
    const groups = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const key = startOfDay(parseISO(t.date)).toISOString();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
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
            className="input-field pl-9"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              id={`filter-${opt.id}`}
              onClick={() => setTypeFilter(opt.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 ${
                typeFilter === opt.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-4 py-4 space-y-4">
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
          grouped.map(([dateKey, txns]) => (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {dateHeader(txns[0].date)}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {txns.length} item{txns.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="card p-0 overflow-hidden">
                {txns.map((txn) => (
                  <TransactionRow key={txn.id} transaction={txn} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
