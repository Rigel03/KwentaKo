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
  const openAddSheet = useStore((s) => s.openAddSheet);

  const category  = categories.find((c) => c.id === transaction.categoryId);
  const account   = accounts.find((a) => a.id === transaction.accountId);
  const toAccount = transaction.toAccountId
    ? accounts.find((a) => a.id === transaction.toAccountId)
    : null;

  const isIncome   = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  const amountColor  = isIncome ? 'var(--income)' : isTransfer ? 'var(--transfer)' : 'var(--expense)';
  const amountPrefix = isIncome ? '+' : isTransfer ? '' : '−';
  const timeStr      = format(parseISO(transaction.date), 'h:mm a');

  return (
    <button
      className="txn-row w-full text-left"
      onClick={() => onClick?.() ?? openAddSheet(transaction.id)}
      aria-label={`${transaction.type} ${formatPHP(transaction.amount)}`}
    >
      {/* Category icon */}
      <div
        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: category ? `${category.color}16` : 'var(--surface-2)' }}
      >
        <i
          className={`fa-solid ${category?.icon ?? 'fa-circle-question'} text-sm`}
          style={{ color: category?.color ?? 'var(--text-3)' }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="truncate"
          style={{ color: 'var(--text-1)', fontSize: 14, fontWeight: 600 }}
        >
          {category?.name ?? 'Unknown'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {showAccount && (
            <span className="truncate" style={{ color: 'var(--text-3)', fontSize: 12 }}>
              {isTransfer
                ? `${account?.name ?? '?'} → ${toAccount?.name ?? '?'}`
                : account?.name ?? '?'}
            </span>
          )}
          {transaction.note && showAccount && (
            <span style={{ color: 'var(--divider)', fontSize: 12 }}>·</span>
          )}
          {transaction.note && (
            <span className="truncate italic" style={{ color: 'var(--text-3)', fontSize: 12 }}>
              {transaction.note}
            </span>
          )}
        </div>
      </div>

      {/* Amount + time */}
      <div className="text-right flex-shrink-0">
        <p className="font-bold font-mono text-sm" style={{ color: amountColor }}>
          {amountPrefix}{formatPHP(transaction.amount)}
        </p>
        <p style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 2 }}>{timeStr}</p>
      </div>
    </button>
  );
}
