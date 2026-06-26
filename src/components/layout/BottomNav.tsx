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

  const renderItem = (item: typeof NAV_ITEMS[0]) => {
    const isActive = currentPage === item.id;
    return (
      <button
        key={item.id}
        id={`nav-${item.id}`}
        aria-label={item.label}
        onClick={() => onNavigate(item.id)}
        className="nav-item relative flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all duration-200"
        style={{ color: isActive ? '#4F46E5' : undefined }}
      >
        {/* Faded circle background on active */}
        <span
          className="absolute inset-1.5 rounded-xl transition-all duration-300"
          style={{
            background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
            transform: isActive ? 'scale(1)' : 'scale(0.7)',
            opacity: isActive ? 1 : 0,
          }}
        />

        <i
          className={`fa-solid ${item.icon} text-lg relative z-10 transition-all duration-200 ${
            isActive ? 'scale-110' : 'text-slate-400 dark:text-slate-500'
          }`}
        />
        <span className={`text-xs relative z-10 transition-all duration-200 ${
          isActive ? 'font-bold' : 'font-medium text-slate-400 dark:text-slate-500'
        }`}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <>
      <nav className="bottom-nav bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 py-1.5 z-40 relative flex justify-around px-1">
        {NAV_ITEMS.map(renderItem)}
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
