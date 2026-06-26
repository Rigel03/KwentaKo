import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { exportBackupJSON } from '../utils/backup';
import Toast from '../components/ui/Toast';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const showToast = useStore((s) => s.showToast);
  const toasts = useStore((s) => s.toasts);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        showToast('Check your email for the confirmation link!', 'success');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: any) {
      showToast(err.message || 'Google login failed', 'error');
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: 'var(--bg)' }}
    >
      {/* ── Card ───────────────────────────────────────────────────── */}
      <div
        className="w-full max-w-sm rounded-3xl shadow-2xl p-7 space-y-6 animate-slide-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--divider)' }}
      >
        {/* ── Brand ── */}
        <div className="text-center space-y-3">
          <div
            className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4 overflow-hidden"
            style={{
              background: '#FFFFFF',
              border: '2.5px solid #E0E7FF',
              boxShadow: '0 8px 32px rgba(37,99,235,0.15), 0 0 0 6px rgba(99,102,241,0.08)',
            }}
          >
            <img src="/logo.jpg" alt="KwentaKo" className="w-14 h-14 object-contain" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--text-1)' }}
            >
              KwentaKo
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
              Your personal money diary
            </p>
          </div>
        </div>

        {/* ── Tab Toggle ── */}
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: 'var(--surface-2)' }}
        >
          {['Log In', 'Sign Up'].map((label, i) => {
            const active = isSignUp === (i === 1);
            return (
              <button
                key={label}
                type="button"
                onClick={() => setIsSignUp(i === 1)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-3)',
                  boxShadow: active ? '0 2px 8px var(--accent-alpha)' : 'none',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Email Form ── */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-3)' }}
            >
              Email
            </label>
            <div className="relative">
              <i
                className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: 'var(--text-3)' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input-field"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-3)' }}
            >
              Password
            </label>
            <div className="relative">
              <i
                className="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: 'var(--text-3)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-field"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100 opacity-60"
                style={{ color: 'var(--text-2)' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2"
            style={{ height: '48px' }}
          >
            {loading ? (
              <><i className="fa-solid fa-circle-notch fa-spin" /> Processing…</>
            ) : (
              <>{isSignUp ? 'Create Account' : 'Log In'}</>
            )}
          </button>
        </form>

        {/* ── Divider ── */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'var(--divider)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>
            or
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--divider)' }} />
        </div>

        {/* ── Google Button ── */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          type="button"
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-3 text-sm font-semibold transition-all duration-150 active:scale-95 disabled:opacity-60"
          style={{
            background: 'var(--surface-2)',
            color: 'var(--text-1)',
            border: '1px solid var(--divider)',
          }}
        >
          {googleLoading ? (
            <i className="fa-solid fa-circle-notch fa-spin text-sm" />
          ) : (
            <i className="fa-brands fa-google text-sm text-red-500" />
          )}
          Continue with Google
        </button>
      </div>

      {/* ── Backup Link ── */}
      <button
        onClick={() => {
          exportBackupJSON();
          showToast('Local backup downloaded ✓');
        }}
        className="mt-6 text-xs transition-opacity hover:opacity-100 opacity-40"
        style={{ color: 'var(--text-3)' }}
      >
        <i className="fa-solid fa-download mr-1" />
        Export Local Backup (JSON)
      </button>

      {/* ── Toasts ── */}
      <div className="fixed bottom-8 inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} />
        ))}
      </div>
    </div>
  );
}
