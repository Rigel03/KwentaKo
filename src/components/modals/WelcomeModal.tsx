import { useState } from 'react';
import { useStore } from '../../store/useStore';

export default function WelcomeModal() {
  const [name, setName] = useState('');
  const updateSettings = useStore((s) => s.updateSettings);
  const openAddSheet = useStore((s) => s.openAddSheet);
  const transactions = useStore((s) => s.transactions);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Save the name
    updateSettings({ userName: name.trim() });

    // "Then add entry" - open the add sheet automatically for a nice onboarding flow
    // if they don't have any transactions yet.
    if (transactions.length === 0) {
      setTimeout(() => openAddSheet(), 300);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-3xl p-6 space-y-6 animate-slide-up"
        style={{ background: 'var(--surface)' }}
      >
        <div className="text-center space-y-2">
          <div
            className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-4"
            style={{ background: 'var(--accent)', boxShadow: '0 8px 24px var(--accent-alpha, rgba(37,99,235,0.3))' }}
          >
            <i className="fa-solid fa-hand-wave text-white text-3xl" />
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
            Welcome to KwentaKo!
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            What should we call you?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your nickname..."
            className="input-field text-center text-lg font-bold"
            autoFocus
            required
          />
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={!name.trim()}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
