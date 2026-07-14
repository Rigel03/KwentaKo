import React from 'react';
import { useStore } from '../../store/useStore';
import Toast from '../ui/Toast';
import AddEntrySheet from '../modals/AddEntrySheet';
import OfflineBanner from '../ui/OfflineBanner';


interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const toasts         = useStore((s) => s.toasts);
  const isAddSheetOpen = useStore((s) => s.isAddSheetOpen);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-1)' }}
    >
      <OfflineBanner />
      {/* Main scrollable content */}
      <div className="app-container">

        {children}
      </div>

      {/* Add Entry Sheet / Full-screen form */}
      {isAddSheetOpen && <AddEntrySheet />}

      {/* Toast notifications */}
      <div className="fixed bottom-20 inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} />
        ))}
      </div>
    </div>
  );
}
