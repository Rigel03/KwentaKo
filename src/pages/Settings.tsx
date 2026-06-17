import { useState } from 'react';
import { useStore } from '../store/useStore';
import { exportTransactionsCSV, downloadCSV } from '../utils/csv';
import { exportBackupJSON, importBackupJSON } from '../utils/backup';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { ThemeMode } from '../types';

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: string }[] = [
  { id: 'system', label: 'System', icon: 'fa-circle-half-stroke' },
  { id: 'light',  label: 'Light',  icon: 'fa-sun'               },
  { id: 'dark',   label: 'Dark',   icon: 'fa-moon'              },
];

function SettingsRow({
  icon, label, sublabel, children, onClick, danger,
}: {
  icon: string; label: string; sublabel?: string;
  children?: React.ReactNode; onClick?: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick && !children}
      className="w-full flex items-center gap-3 px-4 py-4 transition-colors"
      style={{ color: danger ? 'var(--expense)' : 'inherit' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: danger ? 'rgba(220,38,38,0.08)' : 'var(--surface-2)',
        }}
      >
        <i
          className={`fa-solid ${icon} text-sm`}
          style={{ color: danger ? 'var(--expense)' : 'var(--text-2)' }}
        />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold" style={{ color: danger ? 'var(--expense)' : 'var(--text-1)' }}>
          {label}
        </p>
        {sublabel && (
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{sublabel}</p>
        )}
      </div>
      {children ?? (onClick && (
        <i className="fa-solid fa-chevron-right text-xs" style={{ color: 'var(--text-3)' }} />
      ))}
    </button>
  );
}

interface SettingsProps {
  onNavigateToAccounts:   () => void;
  onNavigateToCategories: () => void;
}

export default function Settings({ onNavigateToAccounts, onNavigateToCategories }: SettingsProps) {
  const { settings, updateSettings, setTheme, accounts, transactions, categories, clearAllData, showToast } = useStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportCSV = () => {
    const csv      = exportTransactionsCSV(transactions, accounts, categories);
    const filename = `kwentako_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    downloadCSV(csv, filename);
    showToast('Export downloaded ✓');
  };

  const handleBackupJSON = () => {
    exportBackupJSON();
    showToast('Backup downloaded ✓');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    importBackupJSON(file)
      .then(() => showToast('Data restored from backup ✓'))
      .catch((err) => {
        console.error(err);
        showToast('Failed to restore backup', 'error');
      })
      .finally(() => {
        e.target.value = ''; // Reset input
      });
  };

  const handleClearData = () => {
    clearAllData();
    showToast('All data cleared');
    setShowClearConfirm(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div
        className="px-4 pt-6 pb-4"
        style={{ background: 'var(--bg)', boxShadow: '0 1px 0 var(--border)' }}
      >
        <h1
          className="font-bold"
          style={{ color: 'var(--text-1)', fontSize: 22, letterSpacing: '-0.01em' }}
        >
          Settings
        </h1>
      </div>

      <div className="py-4 space-y-4">

        {/* Appearance */}
        <div className="card mx-4">
          <p className="section-label mb-3">Appearance</p>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-1)' }}>App Theme</p>
          <div className="flex gap-2">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                id={`theme-${opt.id}`}
                onClick={() => setTheme(opt.id)}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: settings.theme === opt.id ? 'var(--accent)' : 'var(--surface-2)',
                  color:      settings.theme === opt.id ? '#fff'          : 'var(--text-2)',
                }}
              >
                <i className={`fa-solid ${opt.icon} text-sm`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Manage */}
        <div className="rounded-2xl mx-4 overflow-hidden" style={{ background: 'var(--surface)' }}>
          <p className="px-4 pt-4 pb-1 section-label">Manage</p>
          <SettingsRow
            icon="fa-wallet" label="Accounts"
            sublabel={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
            onClick={onNavigateToAccounts}
          />
          <div style={{ height: 1, margin: '0 16px', background: 'var(--divider)' }} />
          <SettingsRow
            icon="fa-tag" label="Categories"
            sublabel={`${categories.length} categories`}
            onClick={onNavigateToCategories}
          />
        </div>

        {/* Data */}
        <div className="rounded-2xl mx-4 overflow-hidden" style={{ background: 'var(--surface)' }}>
          <p className="px-4 pt-4 pb-1 section-label">Data</p>
          <SettingsRow
            icon="fa-file-export" label="Backup Data (JSON)"
            sublabel="Save a copy of everything"
            onClick={handleBackupJSON}
          />
          <div style={{ height: 1, margin: '0 16px', background: 'var(--divider)' }} />
          <SettingsRow
            icon="fa-file-import" label="Restore Backup (JSON)"
            sublabel="Import from a previous backup file"
            onClick={() => document.getElementById('json-upload')?.click()}
          >
            <input
              id="json-upload"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJSON}
            />
          </SettingsRow>
          <div style={{ height: 1, margin: '0 16px', background: 'var(--divider)' }} />
          <SettingsRow
            icon="fa-file-csv" label="Export to CSV"
            sublabel="Export transactions for Excel"
            onClick={handleExportCSV}
          />
          <div style={{ height: 1, margin: '0 16px', background: 'var(--divider)' }} />
          <SettingsRow
            icon="fa-trash-can" label="Clear All Data"
            sublabel="Cannot be undone"
            onClick={() => setShowClearConfirm(true)}
            danger
          />
          <div style={{ height: 1, margin: '0 16px', background: 'var(--divider)' }} />
          <SettingsRow
            icon="fa-arrow-right-from-bracket" label="Log Out"
            onClick={handleLogout}
          />
        </div>

        {/* Profile & About */}
        <div className="card mx-4">
          <p className="section-label mb-3">Profile</p>
          <div className="mb-5">
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-1)' }}>Your Name</p>
            <input
              value={settings.userName ?? ''}
              onChange={(e) => updateSettings({ userName: e.target.value })}
              placeholder="How should we call you?"
              className="input-field"
            />
          </div>

          <div style={{ height: 1, margin: '20px 0', background: 'var(--divider)' }} />

          <p className="section-label mb-3">About</p>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <i className="fa-solid fa-peso-sign text-white text-lg" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>KwentaKo</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Personal Money Tracker v1.0</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Offline-first · PHP</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear All Data?"
        message="This will permanently delete all your transactions, accounts, and categories. The app will reset to defaults."
        confirmLabel="Clear Everything"
        isDangerous
        requiresTyping="DELETE"
        onConfirm={handleClearData}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
