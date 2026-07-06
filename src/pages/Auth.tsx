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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Glow Orb */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '80vw', maxWidth: 600, height: '80vw', maxHeight: 600, 
        background: 'var(--text-1)', opacity: 0.04,
        filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0
      }} />

      {/* Logo + Brand */}
      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <div
          style={{
            width: 84, height: 84,
            borderRadius: 24,
            background: '#ffffff', // Force white to match logo's native background
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            overflow: 'hidden',
          }}
        >
          <img src="/logo.jpg" alt="KwentaKo" style={{ width: 64, height: 64, objectFit: 'contain' }} />
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 800,
          color: 'var(--text-1)',
          letterSpacing: -1,
          margin: 0,
        }}>
          KwentaKo
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>
          Your personal money diary
        </p>
      </div>

      {/* Card */}
      <div
        className="animate-slide-up"
        style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: 'var(--surface)',
          borderRadius: 32,
          padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.1)',
          border: '1px solid var(--divider)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* iOS-style Segment Control */}
        <div
          style={{
            display: 'flex',
            background: 'var(--surface-2)',
            borderRadius: 16,
            padding: 4,
            marginBottom: 32,
            position: 'relative',
          }}
        >
          {/* Sliding background highlight */}
          <div style={{
            position: 'absolute', top: 4, bottom: 4, left: isSignUp ? '50%' : 4, right: isSignUp ? 4 : '50%',
            background: 'var(--surface)', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1,
          }} />
          
          {['Log In', 'Sign Up'].map((label, i) => {
            const active = isSignUp === (i === 1);
            return (
              <button
                key={label}
                type="button"
                onClick={() => setIsSignUp(i === 1)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: 'transparent',
                  color: active ? 'var(--text-1)' : 'var(--text-3)', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'color 300ms ease', position: 'relative', zIndex: 2,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, letterSpacing: '0.5px' }}>
              EMAIL
            </p>
            <div style={{ position: 'relative' }}>
              <i
                className="fa-solid fa-envelope"
                style={{
                  position: 'absolute', left: 16, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-3)', fontSize: 14,
                }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input-field"
                style={{ paddingLeft: '3rem', height: 52, borderRadius: 16, fontSize: 15 }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, letterSpacing: '0.5px' }}>
              PASSWORD
            </p>
            <div style={{ position: 'relative' }}>
              <i
                className="fa-solid fa-lock"
                style={{
                  position: 'absolute', left: 16, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-3)', fontSize: 14,
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-field"
                style={{ paddingLeft: '3rem', paddingRight: '3rem', height: 52, borderRadius: 16, fontSize: 15 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute', right: 16, top: '50%',
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
            style={{ 
              width: '100%', height: 52, borderRadius: 16, 
              fontSize: 16, fontWeight: 700, opacity: loading ? 0.6 : 1,
              transition: 'all 200ms ease',
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
          >
            {loading
              ? <><i className="fa-solid fa-circle-notch fa-spin" /> Processing…</>
              : isSignUp ? 'Create Account' : 'Log In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          type="button"
          className="btn-secondary"
          style={{ 
            width: '100%', height: 52, borderRadius: 16, gap: 10, 
            fontSize: 15, fontWeight: 600, opacity: googleLoading ? 0.6 : 1,
            transition: 'all 200ms ease',
          }}
          onMouseOver={(e) => !googleLoading && (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseDown={(e) => !googleLoading && (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => !googleLoading && (e.currentTarget.style.transform = 'scale(1.02)')}
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
          marginTop: 32,
          background: 'none', border: 'none',
          color: 'var(--text-3)', fontSize: 13, fontWeight: 500,
          cursor: 'pointer', opacity: 0.6,
          fontFamily: 'inherit',
          transition: 'opacity 200ms',
          position: 'relative', zIndex: 1,
        }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseOut={(e)  => (e.currentTarget.style.opacity = '0.6')}
      >
        <i className="fa-solid fa-download" style={{ marginRight: 6 }} />
        Export Local Backup
      </button>

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: 32, inset: '0 0 auto', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '0 16px', pointerEvents: 'none' }}>
        {toasts.map((t) => <Toast key={t.id} toast={t} />)}
      </div>
    </div>
  );
}
