import { useState, useMemo } from 'react';
import { format, parseISO, isToday, isYesterday, startOfDay } from 'date-fns';
import { useStore } from '../store/useStore';
import { getPeriodSummary } from '../utils/calculations';
import { formatPHP } from '../utils/currency';
import TransactionRow from '../components/ui/TransactionRow';
import EmptyState from '../components/ui/EmptyState';
import type { TransactionType, Transaction } from '../types';

const TYPE_FILTERS: { id: TransactionType | 'all'; label: string; icon: string }[] = [
  { id: 'all',      label: 'All',      icon: 'fa-list' },
  { id: 'income',   label: 'Income',   icon: 'fa-arrow-down' },
  { id: 'expense',  label: 'Expense',  icon: 'fa-arrow-up' },
  { id: 'transfer', label: 'Transfer', icon: 'fa-right-left' },
];

function dateHeader(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d))     return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMM d');
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
    <div className="min-h-screen animate-fade-in" style={{ backgroundColor: 'var(--bg)' }}>

      {/* ── Sticky Header ────────────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backgroundColor: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--nav-border)',
          padding: '16px 20px 12px',
        }}
      >
        <p className="page-title" style={{ marginBottom: 12 }}>History</p>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{
              position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-3)', fontSize: 13,
            }}
          />
          <input
            id="search-transactions"
            type="search"
            placeholder="Search by note…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
          />
        </div>

        {/* Type filter tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {TYPE_FILTERS.map((opt) => {
            const active = typeFilter === opt.id;
            const dotColor =
              opt.id === 'income'   ? 'var(--income)'   :
              opt.id === 'expense'  ? 'var(--expense)'  :
              opt.id === 'transfer' ? 'var(--transfer)' : 'var(--text-1)';
            return (
              <button
                key={opt.id}
                id={`filter-${opt.id}`}
                onClick={() => setTypeFilter(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 14px',
                  borderRadius: 99,
                  border: active ? 'none' : '1.5px solid var(--divider)',
                  backgroundColor: active ? 'var(--text-1)' : 'transparent',
                  color: active ? 'var(--bg)' : 'var(--text-3)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  fontFamily: 'inherit',
                }}
              >
                {!active && opt.id !== 'all' && (
                  <span style={{
                    width: 7, height: 7,
                    borderRadius: '50%',
                    backgroundColor: dotColor,
                    flexShrink: 0,
                  }} />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Transaction List ──────────────────────────────────────────── */}
      <div style={{ padding: '16px 20px 32px' }}>
        {grouped.length === 0 ? (
          <div style={{ marginTop: 40 }}>
            <EmptyState
              icon="fa-receipt"
              title={search ? 'No Results' : 'No Transactions Yet'}
              description={
                search
                  ? `Nothing found for "${search}"`
                  : 'Tap the + button to log your first entry.'
              }
              actionLabel={!search ? 'Add Entry' : undefined}
              onAction={!search ? () => openAddSheet() : undefined}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {grouped.map(([dateKey, txns]) => {
              const { totalIncome, totalExpense } = getPeriodSummary(txns);
              const dailyNet = totalIncome - totalExpense;
              const hasNet = totalIncome > 0 || totalExpense > 0;

              return (
                <div key={dateKey}>
                  {/* Date group header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                      padding: '0 4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {dateHeader(txns[0].date)}
                      </p>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        · {txns.length} item{txns.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {hasNet && (
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: dailyNet >= 0 ? 'var(--income)' : 'var(--expense)',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {dailyNet >= 0 ? '+' : ''}{formatPHP(dailyNet)}
                      </span>
                    )}
                  </div>

                  {/* Card */}
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {txns.map((txn) => (
                      <TransactionRow key={txn.id} transaction={txn} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
