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
        className="flex-shrink-0 w-40 credit-card text-left hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
        style={{ background: gradient }}
      >
        <div className="credit-card-inner relative h-full p-3 flex flex-col justify-between min-h-[100px]">
          {/* Top row: icon + type badge */}
          <div className="flex items-start justify-between">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <i className={`fa-solid ${account.icon} text-white text-xs`} />
            </div>
            <span className="text-[9px] font-semibold text-white/70 uppercase tracking-widest bg-white/10 px-1.5 py-0.5 rounded-full">
              {TYPE_LABELS[account.type] ?? 'Account'}
            </span>
          </div>

          {/* Bottom: name + balance */}
          <div>
            <p className="text-white/70 text-[9px] font-semibold uppercase tracking-widest mb-0.5 truncate">
              {account.name}
            </p>
            <p className={`text-sm font-bold font-mono text-white leading-tight ${
              isNegative ? 'opacity-70' : ''
            }`}>
              {isNegative && <span className="text-red-300 text-xs mr-0.5">▼</span>}
              {formatPHP(balance)}
            </p>
          </div>
        </div>
      </button>
    );
  }

  // Full card for Accounts page grid — compact row style
  return (
    <button
      onClick={onClick}
      className="credit-card text-left w-full hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
      style={{ background: gradient }}
    >
      <div className="credit-card-inner relative p-3.5 flex items-center gap-3 min-h-[72px]">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <i className={`fa-solid ${account.icon} text-white text-sm`} />
        </div>

        {/* Name + type */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate leading-tight">{account.name}</p>
          <p className="text-white/60 text-[10px] uppercase tracking-wider mt-0.5">
            {TYPE_LABELS[account.type] ?? 'Account'}
          </p>
        </div>

        {/* Balance */}
        <div className="text-right flex-shrink-0">
          <p className={`text-base font-bold font-mono text-white leading-tight ${
            isNegative ? 'text-red-300' : ''
          }`}>
            {formatPHP(balance)}
          </p>
          {isNegative && <p className="text-red-300/70 text-[9px] mt-0.5">overdrawn</p>}
        </div>
      </div>
    </button>
  );
}
