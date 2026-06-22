import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import type { ToastMessage } from '../../types';

interface ToastProps {
  toast: ToastMessage;
}

const CONFIG = {
  success: {
    icon: 'fa-circle-check',
    bg: 'bg-slate-900 dark:bg-slate-100',
    text: 'text-white dark:text-slate-900',
    border: 'border-l-green-400',
    barColor: '#4ADE80',
  },
  error: {
    icon: 'fa-circle-xmark',
    bg: 'bg-slate-900 dark:bg-slate-100',
    text: 'text-white dark:text-slate-900',
    border: 'border-l-red-400',
    barColor: '#F87171',
  },
  info: {
    icon: 'fa-circle-info',
    bg: 'bg-slate-900 dark:bg-slate-100',
    text: 'text-white dark:text-slate-900',
    border: 'border-l-blue-400',
    barColor: '#60A5FA',
  },
};

const ICON_COLORS = {
  success: '#4ADE80',
  error:   '#F87171',
  info:    '#60A5FA',
};

export default function Toast({ toast }: ToastProps) {
  const dismissToast = useStore((s) => s.dismissToast);
  const c = CONFIG[toast.type];
  const [visible, setVisible] = useState(true);

  // Auto-dismiss with fade out
  useEffect(() => {
    const fadeTimer = setTimeout(() => setVisible(false), 2800);
    const removeTimer = setTimeout(() => dismissToast(toast.id), 3100);
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, [toast.id, dismissToast]);

  return (
    <div
      className={`toast ${c.bg} ${c.text} pointer-events-auto border-l-4 ${c.border} transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
      role="alert"
      style={{ minWidth: 240, paddingLeft: 14 }}
    >
      {/* Icon */}
      <i
        className={`fa-solid ${c.icon} text-base flex-shrink-0`}
        style={{ color: ICON_COLORS[toast.type] }}
      />

      {/* Message */}
      <span className="text-sm font-medium flex-1">{toast.message}</span>

      {/* Dismiss */}
      <button
        onClick={() => dismissToast(toast.id)}
        className="ml-1 opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
        aria-label="Dismiss"
      >
        <i className="fa-solid fa-xmark text-sm" />
      </button>

      {/* Progress drain bar */}
      <div
        className="toast-progress"
        style={{ backgroundColor: ICON_COLORS[toast.type] }}
      />
    </div>
  );
}
