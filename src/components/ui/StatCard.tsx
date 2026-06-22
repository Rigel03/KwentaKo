interface StatCardProps {
  label: string;
  amount: string;
  icon: string;
  variant: 'income' | 'expense' | 'neutral' | 'transfer';
  subtitle?: string;
  percentage?: number;     // 0–100 fill for progress bar
  maxPercentage?: number;  // cap (defaults to 100)
}

const VARIANT_STYLES = {
  income:   {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'text-green-500',
    amount: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    bar: 'linear-gradient(90deg, #16A34A, #22C55E)',
  },
  expense:  {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-500',
    amount: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    bar: 'linear-gradient(90deg, #DC2626, #EF4444)',
  },
  neutral:  {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-500',
    amount: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    bar: 'linear-gradient(90deg, #2563EB, #4F46E5)',
  },
  transfer: {
    bg: 'bg-slate-50 dark:bg-slate-800',
    icon: 'text-slate-500',
    amount: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    bar: 'linear-gradient(90deg, #64748B, #94A3B8)',
  },
};

export default function StatCard({ label, amount, icon, variant, subtitle, percentage, maxPercentage = 100 }: StatCardProps) {
  const s = VARIANT_STYLES[variant];
  const fillPct = percentage !== undefined ? Math.min(Math.max(percentage, 0), maxPercentage) : undefined;

  return (
    <div className={`rounded-2xl p-4 border ${s.bg} ${s.border} flex-1`}>
      <div className="flex items-center gap-2 mb-2">
        <i className={`fa-solid ${icon} text-sm ${s.icon}`} />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className={`text-xl font-bold font-mono leading-tight ${s.amount}`}>
        {amount}
      </p>
      {subtitle && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
      )}

      {/* Mini Progress Bar */}
      {fillPct !== undefined && (
        <div className="stat-progress-bar">
          <div
            className="stat-progress-fill"
            style={{
              width: `${fillPct}%`,
              background: s.bar,
            }}
          />
        </div>
      )}
    </div>
  );
}
