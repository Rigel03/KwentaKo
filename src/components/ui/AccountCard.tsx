import { useStore } from '../../store/useStore';
import { getAccountBalance } from '../../utils/calculations';
import { formatPHP } from '../../utils/currency';
import type { Account } from '../../types';

const TYPE_LABELS: Record<string, string> = {
  bank: 'Bank',
  digital_bank: 'Digital Bank',
  e_wallet: 'E-Wallet',
  cash: 'Cash',
  savings: 'Savings',
  investment: 'Investment',
  other: 'Other',
};

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
  compact?: boolean;
}

export default function AccountCard({ account, onClick, compact = false }: AccountCardProps) {
  const transactions = useStore((s) => s.transactions);
  const balance = getAccountBalance(account.id, transactions);
  const isNegative = balance < 0;

  if (compact) {
    // Horizontal scrollable card for Dashboard
    return (
      <button
        onClick={onClick}
        className="flex-shrink-0 w-44 card p-4 text-left hover:shadow-md transition-all duration-150 active:scale-95 cursor-pointer"
        style={{ borderTopColor: account.color, borderTopWidth: 3 }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${account.color}20` }}
          >
            <i
              className={`fa-solid ${account.icon} text-sm`}
              style={{ color: account.color }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              {TYPE_LABELS[account.type] ?? 'Account'}
            </p>
          </div>
        </div>

        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate mb-1">
          {account.name}
        </p>
        <p
          className={`text-base font-bold font-mono leading-tight ${
            isNegative ? 'text-red-500' : 'text-slate-900 dark:text-white'
          }`}
        >
          {formatPHP(balance)}
        </p>
      </button>
    );
  }

  // Full grid card for Accounts page
  return (
    <button
      onClick={onClick}
      className="card p-4 text-left w-full hover:shadow-md transition-all duration-150 active:scale-95"
      style={{ borderTopColor: account.color, borderTopWidth: 3 }}
    >
      {/* Account Icon */}
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${account.color}20` }}
        >
          <i
            className={`fa-solid ${account.icon} text-base`}
            style={{ color: account.color }}
          />
        </div>
        <span
          className="badge text-xs"
          style={{
            backgroundColor: `${account.color}20`,
            color: account.color,
          }}
        >
          {TYPE_LABELS[account.type] ?? 'Account'}
        </span>
      </div>

      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 truncate">
        {account.name}
      </p>
      <p
        className={`text-xl font-bold font-mono ${
          isNegative ? 'text-red-500' : 'text-slate-900 dark:text-white'
        }`}
      >
        {formatPHP(balance)}
      </p>
    </button>
  );
}
