import React from 'react';
import { useStore } from '../../store/useStore';

type Page = 'dashboard' | 'transactions' | 'accounts' | 'analytics' | 'settings';

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard' as Page,     icon: 'fa-house',     label: 'Home' },
  { id: 'transactions' as Page,  icon: 'fa-list',      label: 'History' },
  { id: 'accounts' as Page,      icon: 'fa-wallet',    label: 'Accounts' },
  { id: 'analytics' as Page,     icon: 'fa-chart-pie', label: 'Analytics' },
  { id: 'settings' as Page,      icon: 'fa-gear',      label: 'Settings' },
];

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const openAddSheet = useStore((s) => s.openAddSheet);

  return (
    <nav className="bottom-nav bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
      {NAV_ITEMS.map((item, idx) => {
        // Center slot — FAB
        if (idx === 2) {
          return (
            <React.Fragment key="fab-slot">
              {/* Hidden middle item placeholder */}
              <div className="w-16" />
              {/* Floating FAB — overlays the center */}
              <button
                id="fab-add-entry"
                aria-label="Add new entry"
                onClick={() => openAddSheet()}
                className="fab absolute left-1/2 -translate-x-1/2 -translate-y-5 shadow-xl shadow-blue-600/40"
              >
                <i className="fa-solid fa-plus text-xl" />
              </button>
            </React.Fragment>
          );
        }

        const isActive = currentPage === item.id;
        return (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            aria-label={item.label}
            onClick={() => onNavigate(item.id)}
            className={`nav-item ${
              isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <i
              className={`fa-solid ${item.icon} text-lg transition-transform duration-150 ${
                isActive ? 'scale-110' : ''
              }`}
            />
            <span className={`transition-all duration-150 ${isActive ? 'font-semibold' : ''}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export type { Page };
