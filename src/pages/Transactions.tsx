import { useState, useMemo } from 'react';
import { format, parseISO, isToday, isYesterday, startOfDay } from 'date-fns';
import { useStore } from '../store/useStore';
import TransactionRow from '../components/ui/TransactionRow';
import EmptyState from '../components/ui/EmptyState';
import type { TransactionType } from '../types';

const TYPE_OPTIONS: { id: TransactionType | 'all'; label: string }[] = [
  { id: 'all',      label: 'All'      },
  { id: 'income',   label: 'Income'   },
  { id: 'expense',  label: 'Expense'  },
  { id: 'transfer', label: 'Transfer' },
];

function dateHeader(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d))     return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMMM d, yyyy');
}

export default function Transactions() {
  const transactions = useStore((s) => s.transactions);
  const openAddSheet = useStore((s) => s.openAddSheet);

  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [search, setSearch]         = useState('');

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
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div
        className="px-4 pt-6 pb-4 sticky top-0 z-10"
        style={{ background: 'var(--bg)', boxShadow: '0 1px 0 var(--border)' }}
      >
        <h1
          className="font-bold mb-4"
          style={{ color: 'var(--text-1)', fontSize: 22, letterSpacing: '-0.01em' }}
        >
          Transactions
        </h1>

        {/* Search */}
        <div className="relative mb-3">
          <i
            className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: 'var(--text-3)' }}
          />
          <input
            id="search-transactions"
            type="search"
            placeholder="Search by note…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        {/* Type filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              id={`filter-${opt.id}`}
              onClick={() => setTypeFilter(opt.id)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150"
              style={{
                background: typeFilter === opt.id ? 'var(--text-1)' : 'var(--surface-2)',
                color:      typeFilter === opt.id ? 'var(--bg)'     : 'var(--text-2)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4 space-y-4">
        {grouped.length === 0 ? (
          <EmptyState
            icon="fa-receipt"
            title={search ? 'No results found' : 'No transactions yet'}
            description={
              search
                ? `No transactions matching "${search}". Try a different keyword.`
                : 'Start logging your income and expenses. Use categories like Food, Transport, and Bills to build a clear picture of your spending habits.'
            }
            actionLabel={!search ? 'Add First Entry' : undefined}
            onAction={!search ? () => openAddSheet() : undefined}
          />
        ) : (
          grouped.map(([dateKey, txns]) => (
            <div key={dateKey}>
              <div className="flex items-center justify-between mb-2">
                <p
                  style={{
                    color: 'var(--text-3)',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {dateHeader(txns[0].date)}
                </p>
                <p style={{ color: 'var(--text-3)', fontSize: 12 }}>
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
