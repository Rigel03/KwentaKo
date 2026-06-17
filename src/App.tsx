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

export default function App() {
  const [page, setPage] = useState<Page | 'categories'>('dashboard');
  const [authInitialized, setAuthInitialized] = useState(false);
  const settings = useStore((s) => s.settings);
  const userId = useUserId();
  const setUserId = useStore((s) => s.setUserId);

  // ── Auth Initialization
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      if (session?.user?.id) useStore.getState().initSync();
      setAuthInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (session?.user?.id) useStore.getState().initSync();
    });

    return () => subscription.unsubscribe();
  }, [setUserId]);

  // ── Dark mode effect
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.matches) root.classList.add('dark');
      else root.classList.remove('dark');

      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigateToTransactions={() => setPage('transactions')}
            onNavigateToAccounts={() => setPage('accounts')}
          />
        );
      case 'transactions': return <Transactions />;
      case 'accounts':     return <Accounts />;
      case 'analytics':    return <Analytics />;
      case 'settings':
        return (
          <Settings
            onNavigateToAccounts={() => setPage('accounts')}
            onNavigateToCategories={() => setPage('categories')}
          />
        );
      case 'categories':   return <Categories />;
      default:             return null;
    }
  };

  // Map categories back to settings for nav highlighting
  const navPage: Page = page === 'categories' ? 'settings' : page as Page;

  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <i className="fa-solid fa-circle-notch fa-spin text-3xl" style={{ color: 'var(--accent)' }} />
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
