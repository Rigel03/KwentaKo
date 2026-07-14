import { useState, useEffect } from 'react';
import { useStore, useUserId } from './store/useStore';
import { supabase } from './lib/supabase';
import AppShell from './components/layout/AppShell';
import BottomNav, { type Page } from './components/layout/BottomNav';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import Budget from './pages/Budget';
import Recurring from './pages/Recurring';

export default function App() {
  const [page, setPage] = useState<Page | 'categories' | 'recurring'>('dashboard');
  const [authInitialized, setAuthInitialized] = useState(false);
  const settings = useStore((s) => s.settings);
  const userId = useUserId();
  const setUserId = useStore((s) => s.setUserId);

  // ── Auth Initialization
  useEffect(() => {
    const handleSession = (session: any) => {
      setUserId(session?.user?.id ?? null);
      if (session?.user?.id) {
        useStore.getState().initSync();
        useStore.getState().applyDueRecurrings();
        
        // Auto-fill Google Name
        const googleName = session.user.user_metadata?.full_name;
        const currentSettings = useStore.getState().settings;
        if (googleName && !currentSettings.userName) {
          useStore.getState().updateSettings({ userName: googleName });
        }
      }
    };

    // OFFLINE BYPASS: If we already have a userId cached and we're offline,
    // skip the network auth check and show the app immediately.
    const cachedUserId = useStore.getState().userId;
    if (!navigator.onLine && cachedUserId) {
      setAuthInitialized(true);
      useStore.getState().applyDueRecurrings();
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        handleSession(session);
        setAuthInitialized(true);
      }).catch(() => {
        // Network failure: fall back to cached userId
        if (cachedUserId) setAuthInitialized(true);
        else setAuthInitialized(true); // show login screen
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      handleSession(session);
    });

    // When we come back online, flush any pending mutations
    const handleOnline = () => {
      useStore.getState().flushOfflineQueue();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
  }, [setUserId]);

  // ── Dark mode effect
  useEffect(() => {
    const root = document.documentElement;
    const ALL = ['dark', 'amoled', 'cozy'];
    root.classList.remove(...ALL);

    let activeTheme = settings.theme;

    if (settings.theme === 'dark')   root.classList.add('dark');
    else if (settings.theme === 'amoled') root.classList.add('dark', 'amoled');
    else if (settings.theme === 'cozy')   root.classList.add('cozy');
    else if (settings.theme === 'light')  { /* no class needed */ }
    else {
      // System
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      activeTheme = mq.matches ? 'dark' : 'light';
      if (mq.matches) root.classList.add('dark');
      const handler = (e: MediaQueryListEvent) => {
        root.classList.remove(...ALL);
        if (e.matches) root.classList.add('dark');
        updateMetaThemeColor(e.matches ? 'dark' : 'light');
      };
      mq.addEventListener('change', handler);
    }

    updateMetaThemeColor(activeTheme);

    function updateMetaThemeColor(t: string) {
      const colors: Record<string, string> = {
        light: '#F2F2F7',
        dark: '#1C1C1E',
        amoled: '#000000',
        cozy: '#FDF8F5',
      };
      const metaThemeColors = document.querySelectorAll('meta[name="theme-color"]');
      metaThemeColors.forEach(meta => {
        meta.setAttribute('content', colors[t] || colors.light);
      });
    }

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        root.classList.remove(...ALL);
        if (e.matches) root.classList.add('dark');
        updateMetaThemeColor(e.matches ? 'dark' : 'light');
      };
      // Note: event listener is already added above, so we don't need to add it again.
      // But we need to return the cleanup function.
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  // ── Auto scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigateToTransactions={() => setPage('transactions')}
            onNavigateToAccounts={() => setPage('accounts')}
            onNavigateToBudget={() => setPage('budget')}
          />
        );
      case 'transactions': return <Transactions />;
      case 'accounts':     return <Accounts />;
      case 'analytics':    return <Analytics />;
      case 'budget':       return <Budget />;
      case 'settings':
        return (
          <Settings
            onNavigateToAccounts={() => setPage('accounts')}
            onNavigateToCategories={() => setPage('categories')}
            onNavigateToRecurring={() => setPage('recurring')}
          />
        );
      case 'categories':   return <Categories />;
      case 'recurring':    return <Recurring />;
      default:             return null;
    }
  };

  // Map categories back to settings for nav highlighting
  const navPage: Page = (page === 'categories' || page === 'recurring') ? 'settings' : page as Page;

  if (!authInitialized) {
    return (
      <div style={{
        minHeight: '100svh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--bg)',
      }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 28, color: 'var(--text-3)' }} />
      </div>
    );
  }

  if (!userId) {
    return <Auth />;
  }

  return (
    <AppShell>
      {/* Page content */}
      <div className="animate-fade-in" key={page}>
        {renderPage()}
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentPage={navPage} onNavigate={(p) => setPage(p)} />
    </AppShell>
  );
}
