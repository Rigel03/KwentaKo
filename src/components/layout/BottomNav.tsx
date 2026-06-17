import React from 'react';
import { useStore } from '../../store/useStore';

type Page = 'dashboard' | 'transactions' | 'accounts' | 'analytics' | 'settings';

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard'    as Page, icon: 'fa-house',     label: 'Home'      },
  { id: 'transactions' as Page, icon: 'fa-list',      label: 'History'   },
  { id: 'accounts'     as Page, icon: 'fa-wallet',    label: 'Accounts'  },
  { id: 'analytics'    as Page, icon: 'fa-chart-pie', label: 'Analytics' },
  { id: 'settings'     as Page, icon: 'fa-gear',      label: 'Settings'  },
];

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const openAddSheet = useStore((s) => s.openAddSheet);

  return (
    <nav className="bottom-nav" style={{ position: 'fixed' }}>
      {NAV_ITEMS.map((item, idx) => {
        // Centre slot — FAB
        if (idx === 2) {
          return (
            <React.Fragment key="fab-slot">
              <div className="w-16" />
              <button
                id="fab-add-entry"
                aria-label="Add new entry"
                onClick={() => openAddSheet()}
                className="fab absolute left-1/2 -translate-x-1/2 -translate-y-5"
              >
                <i className="fa-solid fa-plus text-lg" />
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
            className="nav-item"
            style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)' }}
          >
            <i
              className={`fa-solid ${item.icon} transition-transform duration-150`}
              style={{ fontSize: 18, transform: isActive ? 'scale(1.1)' : 'scale(1)' }}
            />
            <span style={{ fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export type { Page };
