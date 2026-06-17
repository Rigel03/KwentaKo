interface StatCardProps {
  label: string;
  amount: string;
  icon: string;
  variant: 'income' | 'expense' | 'neutral' | 'transfer';
  subtitle?: string;
}

const AMOUNT_COLOR: Record<string, string> = {
  income:   'var(--income)',
  expense:  'var(--expense)',
  neutral:  'var(--accent)',
  transfer: 'var(--transfer)',
};

const ICON_COLOR: Record<string, string> = {
  income:   'var(--income)',
  expense:  'var(--expense)',
  neutral:  'var(--accent)',
  transfer: 'var(--transfer)',
};

export default function StatCard({ label, amount, icon, variant, subtitle }: StatCardProps) {
  return (
    <div className="card flex-1" style={{ padding: '14px 16px' }}>
      <div className="flex items-center gap-2 mb-2">
        <i
          className={`fa-solid ${icon} text-xs`}
          style={{ color: ICON_COLOR[variant] }}
        />
        <span
          style={{
            color: 'var(--text-3)',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {label}
        </span>
      </div>
      <p
        className="font-bold font-mono leading-tight"
        style={{ fontSize: 18, color: AMOUNT_COLOR[variant] }}
      >
        {amount}
      </p>
      {subtitle && (
        <p style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 4 }}>{subtitle}</p>
      )}
    </div>
  );
}
