import { useStore } from '../../store/useStore';
import { getAccountBalance } from '../../utils/calculations';
import { formatPHP } from '../../utils/currency';
import type { Account } from '../../types';

const TYPE_LABELS: Record<string, string> = {
  bank:         'Bank',
  digital_bank: 'Digital Bank',
  e_wallet:     'E-Wallet',
  cash:         'Cash',
  savings:      'Savings',
  investment:   'Investment',
  other:        'Other',
};

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
  compact?: boolean;
}

/** Convert a hex color to an rgba string with the given alpha (0–1) */
function hexAlpha(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function AccountCard({ account, onClick, compact = false }: AccountCardProps) {
  const transactions = useStore((s) => s.transactions);
  const balance      = getAccountBalance(account.id, transactions);
  const isNegative   = balance < 0;

  // Soft color wash for the card background
  const bgColor   = hexAlpha(account.color, 0.10);
  const bgGradient = `linear-gradient(135deg, ${hexAlpha(account.color, 0.14)} 0%, ${hexAlpha(account.color, 0.05)} 100%)`;
  const iconBg    = hexAlpha(account.color, 0.22);

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="flex-shrink-0 w-44 rounded-2xl p-4 text-left active:scale-95 transition-transform duration-100"
        style={{ background: bgGradient }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: iconBg }}
          >
            <i className={`fa-solid ${account.icon} text-sm`} style={{ color: account.color }} />
          </div>
          <p
            className="truncate"
            style={{
              color: account.color,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {TYPE_LABELS[account.type] ?? 'Account'}
          </p>
        </div>

        <p style={{ color: 'var(--text-1)', fontSize: 13, fontWeight: 600, marginBottom: 6 }} className="truncate">
          {account.name}
        </p>
        <p
          className="font-bold font-mono text-sm leading-tight"
          style={{ color: isNegative ? 'var(--expense)' : 'var(--text-1)' }}
        >
          {formatPHP(balance)}
        </p>
      </button>
    );
  }

  // Full grid card (Accounts page)
  return (
    <button
      onClick={onClick}
      className="rounded-2xl p-4 text-left w-full active:scale-95 transition-transform duration-100"
      style={{ background: bgGradient }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <i className={`fa-solid ${account.icon} text-base`} style={{ color: account.color }} />
        </div>
        <span
          className="badge"
          style={{
            backgroundColor: hexAlpha(account.color, 0.15),
            color: account.color,
          }}
        >
          {TYPE_LABELS[account.type] ?? 'Account'}
        </span>
      </div>

      <p style={{ color: 'var(--text-1)', fontSize: 13, fontWeight: 600, marginBottom: 6 }} className="truncate">
        {account.name}
      </p>
      <p
        className="text-xl font-bold font-mono"
        style={{ color: isNegative ? 'var(--expense)' : 'var(--text-1)' }}
      >
        {formatPHP(balance)}
      </p>
    </button>
  );
}
