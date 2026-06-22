import { useStore } from '../../store/useStore';
import { formatPHP } from '../../utils/currency';
import { format, parseISO } from 'date-fns';
import type { Transaction } from '../../types';

interface TransactionRowProps {
  transaction: Transaction;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showAccount?: boolean;
}

export default function TransactionRow({
  transaction,
  onClick,
  showAccount = true,
}: TransactionRowProps) {
  const categories = useStore((s) => s.categories);
  const accounts = useStore((s) => s.accounts);
  const openAddSheet = useStore((s) => s.openAddSheet);

  const category = categories.find((c) => c.id === transaction.categoryId);
  const account = accounts.find((a) => a.id === transaction.accountId);
  const toAccount = transaction.toAccountId
    ? accounts.find((a) => a.id === transaction.toAccountId)
    : null;

  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  const amountColor = isIncome
    ? 'text-green-600 dark:text-green-400'
    : isTransfer
    ? 'text-blue-600 dark:text-blue-400'
    : 'text-red-500 dark:text-red-400';

  const amountPrefix = isIncome ? '+' : isTransfer ? '' : '-';

  // Left accent bar color: use category color, or type fallback
  const accentColor = category?.color
    ?? (isIncome ? '#16A34A' : isTransfer ? '#2563EB' : '#EF4444');

  const timeStr = format(parseISO(transaction.date), 'h:mm a');

  return (
    <button
      className="txn-row w-full text-left"
      style={{ '--txn-accent': accentColor } as React.CSSProperties}
      onClick={() => onClick?.() ?? openAddSheet(transaction.id)}
      aria-label={`${transaction.type} ${formatPHP(transaction.amount)}`}
    >
      {/* Category Icon */}
      <div
        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-transform duration-150"
        style={{
          backgroundColor: category ? `${category.color}20` : '#94A3B820',
        }}
      >
        <i
          className={`fa-solid ${category?.icon ?? 'fa-circle-question'} text-sm`}
          style={{ color: category?.color ?? '#94A3B8' }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
          {category?.name ?? 'Unknown Category'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {showAccount && (
            <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
              {isTransfer
                ? `${account?.name ?? '?'} → ${toAccount?.name ?? '?'}`
                : account?.name ?? '?'}
            </span>
          )}
          {transaction.note && showAccount && (
            <span className="text-slate-300 dark:text-slate-600 text-xs">•</span>
          )}
          {transaction.note && (
            <span className="text-xs text-slate-400 dark:text-slate-500 truncate italic">
              {transaction.note}
            </span>
          )}
        </div>
      </div>

      {/* Right — amount + time */}
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold font-mono ${amountColor}`}>
          {amountPrefix}
          {formatPHP(transaction.amount)}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{timeStr}</p>
      </div>
    </button>
  );
}
