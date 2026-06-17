import React from 'react';
import Header from './Header';
import { useIsAddSheetOpen, useStore } from '../../store/useStore';
import AddEntrySheet from '../modals/AddEntrySheet';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const isAddSheetOpen = useIsAddSheetOpen();
  const closeAddSheet = useStore((s) => s.closeAddSheet);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text-1)' }}>
      <Header />

      {/* Main scrollable content */}
      <div className="app-container">
        {children}
      </div>

      {/* Modals & Overlays */}
      <AddEntrySheet
        isOpen={isAddSheetOpen}
        onClose={closeAddSheet}
      />
    </div>
  );
}
