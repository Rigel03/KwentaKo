interface StatCardProps {
  label: string;
  amount: string;
  icon: string;
  variant: 'income' | 'expense' | 'neutral' | 'transfer';
  subtitle?: string;
}

const VARIANT_STYLES = {
  income:   { bg: 'bg-green-50 dark:bg-green-900/20',  icon: 'text-green-500',  amount: 'text-green-600 dark:text-green-400',  border: 'border-green-200 dark:border-green-800' },
  expense:  { bg: 'bg-red-50 dark:bg-red-900/20',      icon: 'text-red-500',    amount: 'text-red-600 dark:text-red-400',      border: 'border-red-200 dark:border-red-800' },
  neutral:  { bg: 'bg-blue-50 dark:bg-blue-900/20',    icon: 'text-blue-500',   amount: 'text-blue-700 dark:text-blue-300',    border: 'border-blue-200 dark:border-blue-800' },
  transfer: { bg: 'bg-slate-50 dark:bg-slate-800',     icon: 'text-slate-500',  amount: 'text-slate-700 dark:text-slate-300',  border: 'border-slate-200 dark:border-slate-700' },
};

export default function StatCard({ label, amount, icon, variant, subtitle }: StatCardProps) {
  const s = VARIANT_STYLES[variant];

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
    </div>
  );
}
