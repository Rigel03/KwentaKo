import { useStore } from '../../store/useStore';

export type Page = 'dashboard' | 'transactions' | 'accounts' | 'analytics' | 'budget' | 'settings';

const NAV_ITEMS: { id: Page; icon: string; label: string }[] = [
  { id: 'dashboard',    icon: 'fa-house',     label: 'Home' },
  { id: 'budget',       icon: 'fa-bullseye',  label: 'Budget' },
  { id: 'transactions', icon: 'fa-list',      label: 'History' },
  { id: 'accounts',     icon: 'fa-wallet',    label: 'Accounts' },
  { id: 'analytics',    icon: 'fa-chart-pie', label: 'Analytics' },
  { id: 'settings',     icon: 'fa-gear',      label: 'Settings' },
];

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const openAddSheet = useStore((s) => s.openAddSheet);

  return (
    <>
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              aria-label={item.label}
              onClick={() => onNavigate(item.id)}
              className="nav-item"
            >
              <i
                className={`fa-solid ${item.icon} nav-item-icon ${isActive ? 'active' : ''}`}
              />
              {/* Active dot */}
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    backgroundColor: 'var(--text-1)',
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* FAB — Add Entry */}
      <button
        id="fab-add-entry"
        aria-label="Add new entry"
        onClick={() => openAddSheet()}
        className="fab animate-fab-breathe"
      >
        <i className="fa-solid fa-plus" />
      </button>
    </>
  );
}
