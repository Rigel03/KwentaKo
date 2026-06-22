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

// Map each account type to a gradient for the card background
const TYPE_GRADIENTS: Record<string, string> = {
  bank:         'linear-gradient(135deg, #1e3a8a 0%, #2563EB 100%)',
  digital_bank: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
  e_wallet:     'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
  cash:         'linear-gradient(135deg, #15803D 0%, #22C55E 100%)',
  savings:      'linear-gradient(135deg, #92400E 0%, #D97706 100%)',
  investment:   'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
  other:        'linear-gradient(135deg, #374151 0%, #6B7280 100%)',
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

  const gradient = TYPE_GRADIENTS[account.type] ?? TYPE_GRADIENTS.other;

  if (compact) {
    // Credit-card styled compact card for Dashboard horizontal scroll
    return (
      <button
        onClick={onClick}
        className="flex-shrink-0 w-48 credit-card text-left hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
        style={{ background: gradient }}
      >
        <div className="credit-card-inner relative h-full p-4 flex flex-col justify-between min-h-[120px]">
          {/* Top row: icon + type badge */}
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <i className={`fa-solid ${account.icon} text-white text-sm`} />
            </div>
            <span className="text-[10px] font-semibold text-white/70 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full">
              {TYPE_LABELS[account.type] ?? 'Account'}
            </span>
          </div>

          {/* Bottom: name + balance */}
          <div>
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-0.5 truncate">
              {account.name}
            </p>
            <p className={`text-base font-bold font-mono text-white leading-tight ${
              isNegative ? 'opacity-70' : ''
            }`}>
              {isNegative && <span className="text-red-300 text-xs mr-1">▼</span>}
              {formatPHP(balance)}
            </p>
          </div>
        </div>
      </button>
    );
  }

  // Full credit-card for Accounts page grid
  return (
    <button
      onClick={onClick}
      className="credit-card text-left w-full hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
      style={{ background: gradient }}
    >
      <div className="credit-card-inner relative p-5 flex flex-col gap-3 min-h-[140px]">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
            <i className={`fa-solid ${account.icon} text-white text-base`} />
          </div>
          <span className="badge text-[10px] bg-white/15 text-white/80 uppercase tracking-widest">
            {TYPE_LABELS[account.type] ?? 'Account'}
          </span>
        </div>

        {/* Chip decoration */}
        <div className="flex gap-1.5">
          <div className="w-6 h-4 rounded bg-white/20" />
          <div className="w-3 h-4 rounded bg-white/10" />
        </div>

        {/* Account name + balance */}
        <div>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1 truncate">
            {account.name}
          </p>
          <p className={`text-2xl font-bold font-mono text-white leading-tight ${
            isNegative ? 'text-red-300' : ''
          }`}>
            {formatPHP(balance)}
          </p>
        </div>
      </div>
    </button>
  );
}
