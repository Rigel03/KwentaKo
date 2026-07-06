import { useStore } from '../../store/useStore';
import { formatPHP } from '../../utils/currency';
import { format, parseISO } from 'date-fns';
import type { Transaction } from '../../types';

interface TransactionRowProps {
  transaction: Transaction;
  onClick?: () => void;
  showAccount?: boolean;
}

export default function TransactionRow({
  transaction,
  onClick,
  showAccount = true,
}: TransactionRowProps) {
  const categories   = useStore((s) => s.categories);
  const accounts     = useStore((s) => s.accounts);
  const budgets      = useStore((s) => s.budgets);
  const openAddSheet = useStore((s) => s.openAddSheet);

  const category  = categories.find((c) => c.id === transaction.categoryId);
  const account   = accounts.find((a) => a.id === transaction.accountId);
  const toAccount = transaction.toAccountId
    ? accounts.find((a) => a.id === transaction.toAccountId)
    : null;

  const isIncome   = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const isExpense  = transaction.type === 'expense';

  const amountColor = isIncome
    ? 'var(--income)'
    : isTransfer
    ? 'var(--transfer)'
    : 'var(--expense)';

  const amountPrefix = isIncome ? '+' : isTransfer ? '' : '-';
  const catColor = category?.color ?? (isIncome ? '#34C759' : isTransfer ? '#007AFF' : '#FF3B30');
  const timeStr  = format(parseISO(transaction.date), 'h:mm a');

  // Check if expense falls into a budget
  const relatedBudget = isExpense ? budgets.find((b) => {
    if (b.categoryId !== transaction.categoryId) return false;
    if (!b.startDate || !b.endDate) return false;
    const txDate = parseISO(transaction.date);
    const start = parseISO(b.startDate);
    const end = parseISO(b.endDate);
    return txDate >= start && txDate <= end;
  }) : null;

  return (
    <button
      className="txn-row w-full text-left"
      onClick={() => onClick?.() ?? openAddSheet(transaction.id)}
      aria-label={`${transaction.type} ${formatPHP(transaction.amount)}`}
    >
      {/* Category Icon */}
      <div
        className="txn-icon flex-shrink-0"
        style={{ backgroundColor: `${catColor}18` }}
      >
        <i
          className={`fa-solid ${category?.icon ?? 'fa-circle-question'}`}
          style={{ color: catColor, fontSize: 15 }}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-1)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {category?.name ?? 'Unknown'}
        </p>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2, flexWrap: 'nowrap', overflow: 'hidden' }}>
          {showAccount && (
            <span style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {isTransfer
                ? `${account?.name ?? '?'} → ${toAccount?.name ?? '?'}`
                : account?.name ?? '?'}
            </span>
          )}
          {relatedBudget && (
            <span style={{ 
              fontSize: 10, 
              color: 'var(--text-2)', 
              background: 'var(--surface-2)', 
              padding: '1px 5px', 
              borderRadius: 4,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              flexShrink: 0
            }}>
              <i className="fa-solid fa-lock" style={{ fontSize: 8 }} />
              {relatedBudget.title}
            </span>
          )}
          {transaction.note && (
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {(showAccount || relatedBudget) && '· '}{transaction.note}
            </span>
          )}
        </div>
      </div>

      {/* Amount + time */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{
          fontSize: 14,
          fontWeight: 700,
          color: amountColor,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {amountPrefix}{formatPHP(transaction.amount)}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{timeStr}</p>
      </div>
    </button>
  );
}
