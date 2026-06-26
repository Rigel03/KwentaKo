import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { exportBackupJSON } from '../utils/backup';
import Toast from '../components/ui/Toast';

export default function Auth() {
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignUp,      setIsSignUp]      = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);

  const showToast = useStore((s) => s.showToast);
  const toasts    = useStore((s) => s.toasts);

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
      style={{
        minHeight: '100svh',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* Logo + Brand */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div
          style={{
            width: 80, height: 80,
            borderRadius: 22,
            background: 'var(--surface)',
            border: '1px solid var(--divider)',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            overflow: 'hidden',
          }}
        >
          <img src="/logo.jpg" alt="KwentaKo" style={{ width: 56, height: 56, objectFit: 'contain' }} />
        </div>
        <h1 style={{
          fontSize: 28, fontWeight: 700,
          color: 'var(--text-1)',
          letterSpacing: -0.5,
          margin: 0,
        }}>
          KwentaKo
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 4 }}>
          Your personal money diary
        </p>
      </div>

      {/* Card */}
      <div
        className="animate-slide-up"
        style={{
          width: '100%',
          maxWidth: 380,
          backgroundColor: 'var(--surface)',
          borderRadius: 28,
          padding: '28px 24px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--divider)',
        }}
      >
        {/* Tab Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--surface-2)',
            borderRadius: 14,
            padding: 4,
            gap: 4,
            marginBottom: 24,
          }}
        >
          {['Log In', 'Sign Up'].map((label, i) => {
            const active = isSignUp === (i === 1);
            return (
              <button
                key={label}
                type="button"
                onClick={() => setIsSignUp(i === 1)}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 10,
                  border: 'none',
                  background: active ? 'var(--text-1)' : 'transparent',
                  color: active ? 'var(--bg)' : 'var(--text-3)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 200ms ease',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.3px' }}>
              EMAIL
            </p>
            <div style={{ position: 'relative' }}>
              <i
                className="fa-solid fa-envelope"
                style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-3)', fontSize: 13,
                }}
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

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.3px' }}>
              PASSWORD
            </p>
            <div style={{ position: 'relative' }}>
              <i
                className="fa-solid fa-lock"
                style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-3)', fontSize: 13,
                }}
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
                style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'var(--text-3)', cursor: 'pointer',
                  padding: 0,
                }}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: 14 }} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ height: 50, opacity: loading ? 0.6 : 1 }}
          >
            {loading
              ? <><i className="fa-solid fa-circle-notch fa-spin" /> Processing…</>
              : isSignUp ? 'Create Account' : 'Log In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          type="button"
          className="btn-secondary"
          style={{ height: 50, gap: 10, opacity: googleLoading ? 0.6 : 1 }}
        >
          {googleLoading
            ? <i className="fa-solid fa-circle-notch fa-spin" />
            : <i className="fa-brands fa-google" style={{ color: '#EA4335', fontSize: 16 }} />}
          Continue with Google
        </button>
      </div>

      {/* Backup link */}
      <button
        onClick={() => {
          exportBackupJSON();
          showToast('Local backup downloaded ✓');
        }}
        style={{
          marginTop: 24,
          background: 'none', border: 'none',
          color: 'var(--text-3)', fontSize: 12,
          cursor: 'pointer', opacity: 0.5,
          fontFamily: 'inherit',
          transition: 'opacity 200ms',
        }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseOut={(e)  => (e.currentTarget.style.opacity = '0.5')}
      >
        <i className="fa-solid fa-download" style={{ marginRight: 5 }} />
        Export Local Backup
      </button>

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: 32, inset: '0 0 auto', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '0 16px', pointerEvents: 'none' }}>
        {toasts.map((t) => <Toast key={t.id} toast={t} />)}
      </div>
    </div>
  );
}
