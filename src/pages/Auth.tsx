import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { exportBackupJSON } from '../utils/backup';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const showToast = useStore((s) => s.showToast);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        showToast('Check your email for the login link!', 'success');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        showToast('Welcome back!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      showToast(err.message || 'Google login failed', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm card p-6 space-y-6 animate-slide-up">
        <div className="text-center space-y-2">
          <div
            className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'var(--accent)', boxShadow: '0 8px 24px var(--accent-alpha, rgba(37,99,235,0.3))' }}
          >
            <i className="fa-solid fa-peso-sign text-white text-3xl" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            KwentaKo
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            Track your money seamlessly.
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="section-label mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="section-label mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            style={{ height: '48px' }}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: 'var(--divider)' }} />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2" style={{ background: 'var(--surface)', color: 'var(--text-3)' }}>
              Or continue with
            </span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-95"
          style={{ background: 'var(--surface-2)', color: 'var(--text-1)' }}
        >
          <i className="fa-brands fa-google text-base" />
          Google
        </button>

        <p className="text-center text-xs" style={{ color: 'var(--text-3)' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-bold underline"
            style={{ color: 'var(--accent)' }}
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>

      <button
        onClick={() => {
          exportBackupJSON();
          showToast('Local backup downloaded ✓');
        }}
        className="mt-6 text-xs underline opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: 'var(--text-3)' }}
      >
        Export Local Data Backup (JSON)
      </button>
    </div>
  );
}
