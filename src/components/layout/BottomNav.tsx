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
    <>
      <nav className="bottom-nav bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 py-2.5 z-40 relative flex justify-around px-2">
        {NAV_ITEMS.map((item) => renderItem(item))}
      </nav>

      {/* Floating Add Button */}
      <button
        id="fab-add-entry"
        aria-label="Add new entry"
        onClick={() => openAddSheet()}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full shadow-xl flex items-center justify-center animate-fab-breathe z-50 text-white"
        style={{ background: 'linear-gradient(135deg, #4F46E5, #2563EB)' }}
      >
        <i className="fa-solid fa-plus text-xl" />
      </button>
    </>
  );
}

export type { Page };
