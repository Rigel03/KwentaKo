import { useState } from 'react';
import { useStore } from '../store/useStore';
import { exportTransactionsCSV, downloadCSV } from '../utils/csv';
import { exportBackupJSON, importBackupJSON } from '../utils/backup';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { ThemeMode } from '../types';

// Extended to include AMOLED
type ExtendedTheme = ThemeMode | 'amoled';

const THEME_OPTIONS: { id: ExtendedTheme; label: string; icon: string; desc: string }[] = [
  { id: 'system', label: 'System', icon: 'fa-circle-half-stroke', desc: 'Follow device' },
  { id: 'light',  label: 'Light',  icon: 'fa-sun',                desc: 'Always light' },
  { id: 'dark',   label: 'Dark',   icon: 'fa-moon',               desc: 'Always dark' },
  { id: 'amoled', label: 'AMOLED', icon: 'fa-circle',             desc: 'Pure black' },
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
      className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${danger ? 'text-red-500' : ''}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
        danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-800'
      }`}>
        <i className={`fa-solid ${icon} text-sm ${
          danger ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'
        }`} />
      </div>
      <div className="flex-1 text-left">
        <p className={`text-sm font-semibold ${danger ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>
          {label}
        </p>
        {sublabel && (
          <p className="text-xs text-slate-400 dark:text-slate-500">{sublabel}</p>
        )}
      </div>
      {children ?? (onClick && <i className="fa-solid fa-chevron-right text-xs text-slate-400" />)}
    </button>
  );
}

interface SettingsProps {
  onNavigateToAccounts: () => void;
  onNavigateToCategories: () => void;
}

export default function Settings({ onNavigateToAccounts, onNavigateToCategories }: SettingsProps) {
  const { settings, updateSettings, setTheme, accounts, transactions, categories, clearAllData, showToast } = useStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // We store amoled as a pseudo-theme in local state if selected
  const [localTheme, setLocalTheme] = useState<ExtendedTheme>(
    (settings.theme as ExtendedTheme) ?? 'system'
  );

  const handleThemeChange = (t: ExtendedTheme) => {
    setLocalTheme(t);
    if (t === 'amoled') {
      setTheme('dark'); // underlying store uses dark
      document.documentElement.classList.add('amoled');
    } else {
      setTheme(t as ThemeMode);
      document.documentElement.classList.remove('amoled');
    }
  };

  const handleExportCSV = () => {
    const csv = exportTransactionsCSV(transactions, accounts, categories);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleClearData = () => {
    clearAllData();
    showToast('All data cleared');
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
      </div>

      <div className="py-4 space-y-4">

        {/* Appearance */}
        <div className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700">
          <p className="px-4 pt-4 pb-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Appearance
          </p>

          {/* Theme — 2x2 grid */}
          <div className="px-4 pb-4">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">App Theme</p>
            <div className="grid grid-cols-2 gap-2">
              {THEME_OPTIONS.map((opt) => {
                const isActive = localTheme === opt.id;
                return (
                  <button
                    key={opt.id}
                    id={`theme-${opt.id}`}
                    onClick={() => handleThemeChange(opt.id)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-2xl border text-left transition-all duration-200 ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isActive
                        ? 'bg-indigo-100 dark:bg-indigo-800'
                        : opt.id === 'amoled'
                        ? 'bg-black'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      <i className={`fa-solid ${opt.icon} text-sm ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : opt.id === 'amoled'
                          ? 'text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      }`} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${
                        isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'
                      }`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{opt.desc}</p>
                    </div>
                    {isActive && (
                      <i className="fa-solid fa-circle-check text-indigo-500 text-sm ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700">
          <p className="px-4 pt-4 pb-1 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Manage
          </p>
          <SettingsRow
            icon="fa-wallet" label="Accounts"
            sublabel={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
            onClick={onNavigateToAccounts}
          />
          <div className="h-px mx-4 bg-slate-100 dark:bg-slate-800" />
          <SettingsRow
            icon="fa-tag" label="Categories"
            sublabel={`${categories.length} categories`}
            onClick={onNavigateToCategories}
          />
        </div>

        {/* Data */}
        <div className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700">
          <p className="px-4 pt-4 pb-1 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Data
          </p>
          <SettingsRow
            icon="fa-file-export" label="Backup Data (JSON)"
            sublabel="Save a complete copy of everything"
            onClick={handleBackupJSON}
          />
          <div className="h-px mx-4 bg-slate-100 dark:bg-slate-800" />
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
          <div className="h-px mx-4 bg-slate-100 dark:bg-slate-800" />
          <SettingsRow
            icon="fa-file-csv" label="Export CSV"
            sublabel={`${transactions.length} transactions`}
            onClick={handleExportCSV}
          />
          <div className="h-px mx-4 bg-slate-100 dark:bg-slate-800" />
          <SettingsRow
            icon="fa-trash-can" label="Clear All Data"
            sublabel="Cannot be undone"
            onClick={() => setShowClearConfirm(true)}
            danger
          />
        </div>

        {/* Account */}
        <div className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700">
          <p className="px-4 pt-4 pb-1 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Profile & Account
          </p>
          <div className="px-4 py-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Your Name</p>
            <input
              value={settings.userName ?? ''}
              onChange={(e) => updateSettings({ userName: e.target.value })}
              placeholder="How should we call you?"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>
          <div className="h-px mx-4 bg-slate-100 dark:bg-slate-800 mt-2" />
          <SettingsRow
            icon="fa-arrow-right-from-bracket" label="Log Out"
            onClick={handleLogout}
            danger
          />
        </div>

        {/* App Info */}
        <div className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 px-4 py-4">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">About</p>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #2563EB)' }}
            >
              <i className="fa-solid fa-peso-sign text-white text-xl" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">KwentaKo</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Personal Money Tracker v1.1</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Offline-first · PHP · localStorage
              </p>
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
