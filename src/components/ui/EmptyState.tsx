interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-8 text-center animate-fade-in">
      {/* Icon circle */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: 'var(--surface-2)' }}
      >
        <i className={`fa-solid ${icon} text-2xl`} style={{ color: 'var(--text-3)' }} />
      </div>

      <h3
        className="font-semibold mb-2"
        style={{ color: 'var(--text-1)', fontSize: 16 }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed max-w-xs"
        style={{ color: 'var(--text-3)' }}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-6 py-3 text-sm font-semibold rounded-xl transition-opacity active:opacity-80"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
