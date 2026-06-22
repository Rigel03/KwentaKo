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

// Visual order without the FAB placeholder slot
// Indices: 0=Home, 1=History, [FAB], 2=Accounts, 3=Analytics, 4=Settings
const LEFT_ITEMS  = [NAV_ITEMS[0], NAV_ITEMS[1]];
const RIGHT_ITEMS = [NAV_ITEMS[2], NAV_ITEMS[3], NAV_ITEMS[4]];

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const openAddSheet = useStore((s) => s.openAddSheet);

  const renderItem = (item: typeof NAV_ITEMS[0]) => {
    const isActive = currentPage === item.id;
    return (
      <button
        key={item.id}
        id={`nav-${item.id}`}
        aria-label={item.label}
        onClick={() => onNavigate(item.id)}
        className={`nav-item relative ${
          isActive
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {/* Active top-pill indicator */}
        {isActive && (
          <span className="absolute top-1 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)]" />
        )}

        <i
          className={`fa-solid ${item.icon} text-lg transition-transform duration-200 ${
            isActive ? 'scale-110' : ''
          }`}
        />
        <span className={`transition-all duration-200 text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <nav className="bottom-nav bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
      {/* Left 2 items */}
      {LEFT_ITEMS.map(renderItem)}

      {/* FAB slot placeholder + actual FAB */}
      <React.Fragment>
        <div className="w-16 flex-shrink-0" />
        <button
          id="fab-add-entry"
          aria-label="Add new entry"
          onClick={() => openAddSheet()}
          className="fab absolute left-1/2 -translate-x-1/2 -translate-y-6 shadow-xl"
        >
          <i className="fa-solid fa-plus text-xl" />
        </button>
      </React.Fragment>

      {/* Right 3 items */}
      {RIGHT_ITEMS.map(renderItem)}
    </nav>
  );
}

export type { Page };
