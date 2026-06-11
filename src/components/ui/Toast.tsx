import { useStore } from '../../store/useStore';
import type { ToastMessage } from '../../types';

interface ToastProps {
  toast: ToastMessage;
}

const CONFIG = {
  success: { icon: 'fa-circle-check', bg: 'bg-slate-900 dark:bg-white', text: 'text-white dark:text-slate-900' },
  error:   { icon: 'fa-circle-xmark', bg: 'bg-red-500', text: 'text-white' },
  info:    { icon: 'fa-circle-info',  bg: 'bg-blue-600', text: 'text-white' },
};

export default function Toast({ toast }: ToastProps) {
  const dismissToast = useStore((s) => s.dismissToast);
  const c = CONFIG[toast.type];

  return (
    <div
      className={`toast ${c.bg} ${c.text} pointer-events-auto shadow-xl`}
      role="alert"
    >
      <i className={`fa-solid ${c.icon} text-base`} />
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => dismissToast(toast.id)}
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <i className="fa-solid fa-xmark text-sm" />
      </button>
    </div>
  );
}
