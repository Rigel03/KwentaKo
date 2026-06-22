import React, { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  requiresTyping?: string;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  isDangerous  = false,
  onConfirm,
  onCancel,
  requiresTyping,
}: ConfirmDialogProps) {
  const [typed, setTyped] = React.useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTyped('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canConfirm = requiresTyping ? typed === requiresTyping : true;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      <div
        className="relative w-full max-w-sm rounded-2xl p-6 animate-scale-in"
        style={{ background: 'var(--surface)' }}
      >
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center mb-4 mx-auto"
          style={{ background: isDangerous ? 'rgba(220,38,38,0.1)' : 'rgba(29,78,216,0.1)' }}
        >
          <i
            className={`fa-solid ${isDangerous ? 'fa-triangle-exclamation' : 'fa-circle-question'} text-lg`}
            style={{ color: isDangerous ? 'var(--expense)' : 'var(--accent)' }}
          />
        </div>

        <h3 className="text-base font-bold text-center mb-2" style={{ color: 'var(--text-1)' }}>
          {title}
        </h3>
        <p className="text-sm text-center leading-relaxed mb-5" style={{ color: 'var(--text-2)' }}>
          {message}
        </p>

        {requiresTyping && (
          <div className="mb-5">
            <p className="text-xs text-center mb-2" style={{ color: 'var(--text-3)' }}>
              Type <strong style={{ color: 'var(--text-2)' }}>"{requiresTyping}"</strong> to confirm
            </p>
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="input-field text-center font-mono"
              placeholder={requiresTyping}
              autoComplete="off"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isDangerous ? 'var(--expense)' : 'var(--accent)',
              color: '#fff',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
