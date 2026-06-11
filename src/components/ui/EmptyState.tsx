interface EmptyStateProps {
  icon: string;         // FA class
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
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-fade-in">
      {/* Illustration circle */}
      <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-5">
        <i className={`fa-solid ${icon} text-3xl text-blue-400 dark:text-blue-500`} />
      </div>

      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 leading-relaxed max-w-xs">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors duration-150"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
