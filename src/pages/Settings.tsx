import { useState } from 'react';
import { useStore } from '../store/useStore';
import { exportTransactionsCSV, downloadCSV } from '../utils/csv';
import { format } from 'date-fns';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { ThemeMode } from '../types';

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: string }[] = [
  { id: 'system', label: 'System', icon: 'fa-circle-half-stroke' },
  { id: 'light',  label: 'Light',  icon: 'fa-sun' },
  { id: 'dark',   label: 'Dark',   icon: 'fa-moon' },
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
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
        <i className={`fa-solid ${icon} text-sm ${danger ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`} />
      </div>
      <div className="flex-1 text-left">
        <p className={`text-sm font-semibold ${danger ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>{label}</p>
        {sublabel && <p className="text-xs text-slate-400 dark:text-slate-500">{sublabel}</p>}
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
  const { settings, setTheme, accounts, transactions, categories, clearAllData, showToast } = useStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportCSV = () => {
    const csv = exportTransactionsCSV(transactions, accounts, categories);
    const filename = `kwentako_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    downloadCSV(csv, filename);
    showToast('Export downloaded ✓');
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
          <p className="px-4 pt-4 pb-1 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Appearance
          </p>

          {/* Theme */}
          <div className="px-4 py-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">App Theme</p>
            <div className="flex gap-2">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  id={`theme-${opt.id}`}
                  onClick={() => setTheme(opt.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all ${
                    settings.theme === opt.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <i className={`fa-solid ${opt.icon} text-base`} />
                  {opt.label}
                </button>
              ))}
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

        {/* App Info */}
        <div className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 px-4 py-4">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">About</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
              <i className="fa-solid fa-peso-sign text-white text-lg" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">KwentaKo</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Personal Money Tracker v1.0</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Offline-first • PHP • localStorage</p>
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
