import { useState } from 'react';
import { useStore } from '../store/useStore';
import { exportTransactionsCSV, downloadCSV } from '../utils/csv';
import { exportBackupJSON, importBackupJSON } from '../utils/backup';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { ThemeMode } from '../types';

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: string; bg: string; color: string }[] = [
  { id: 'light',  label: 'Light',  icon: 'fa-sun',                bg: '#F9F9F9', color: '#1C1C1E' },
  { id: 'cozy',   label: 'Cozy',   icon: 'fa-mug-hot',            bg: '#F0EBE1', color: '#2C2A27' },
  { id: 'dark',   label: 'Dark',   icon: 'fa-moon',               bg: '#1C1C1E', color: '#F2F2F7' },
  { id: 'amoled', label: 'AMOLED', icon: 'fa-circle',             bg: '#000000', color: '#F2F2F7' },
  { id: 'system', label: 'System', icon: 'fa-circle-half-stroke', bg: 'linear-gradient(135deg,#F9F9F9 50%,#1C1C1E 50%)', color: '#636366' },
];

interface SettingsProps {
  onNavigateToAccounts: () => void;
  onNavigateToCategories: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{
        fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.7px',
        padding: '0 20px', marginBottom: 6,
      }}>
        {title}
      </p>
      <div className="card" style={{ padding: 0, overflow: 'hidden', margin: '0 20px' }}>
        {children}
      </div>
    </div>
  );
}

function Row({
  icon, label, sublabel, onClick, danger, children,
}: {
  icon: string; label: string; sublabel?: string;
  onClick?: () => void; danger?: boolean; children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'inherit',
        borderBottom: '1px solid var(--divider)',
        transition: 'background 150ms ease',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: danger ? 'rgba(255,59,48,0.1)' : 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <i className={`fa-solid ${icon}`} style={{
          fontSize: 14,
          color: danger ? 'var(--expense)' : 'var(--text-2)',
        }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: 15, fontWeight: 500,
          color: danger ? 'var(--expense)' : 'var(--text-1)',
        }}>
          {label}
        </p>
        {sublabel && (
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{sublabel}</p>
        )}
      </div>
      {children}
      {onClick && !children && (
        <i className="fa-solid fa-chevron-right" style={{ fontSize: 11, color: 'var(--text-3)' }} />
      )}
    </button>
  );
}

export default function Settings({ onNavigateToAccounts, onNavigateToCategories }: SettingsProps) {
  const { settings, updateSettings, setTheme, accounts, transactions, categories, clearAllData, showToast } = useStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleThemeChange = (t: ThemeMode) => { setTheme(t); };

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
      .finally(() => { e.target.value = ''; });
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };
  const handleClearData = () => {
    clearAllData();
    showToast('All data cleared');
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-screen animate-fade-in" style={{ backgroundColor: 'var(--bg)', paddingBottom: 40 }}>

      {/* Header */}
      <div className="header-container">
        <h1 className="header-title">Settings</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Theme Picker */}
        <div>
          <p style={{
            fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
            textTransform: 'uppercase', letterSpacing: '0.7px',
            padding: '0 20px', marginBottom: 6,
          }}>
            Appearance
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 10,
            padding: '0 20px',
          }}>
            {THEME_OPTIONS.map((opt) => {
              const isActive = settings.theme === opt.id;
              return (
                <button
                  key={opt.id}
                  id={`theme-${opt.id}`}
                  onClick={() => handleThemeChange(opt.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 0 10px',
                    borderRadius: 16,
                    border: isActive ? '2px solid var(--text-1)' : '2px solid var(--divider)',
                    background: isActive ? 'var(--surface)' : 'var(--surface-2)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 200ms ease',
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: opt.id === 'system' ? 'linear-gradient(135deg,#F9F9F9 50%,#1C1C1E 50%)' : opt.bg,
                    border: '1px solid var(--divider)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <i className={`fa-solid ${opt.icon}`} style={{ fontSize: 13, color: opt.color }} />
                  </div>
                  <p style={{
                    fontSize: 10, fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                    lineHeight: 1,
                  }}>
                    {opt.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Profile */}
        <div>
          <p style={{
            fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
            textTransform: 'uppercase', letterSpacing: '0.7px',
            padding: '0 20px', marginBottom: 6,
          }}>
            Profile
          </p>
          <div style={{ padding: '0 20px' }}>
            <div className="card">
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>
                YOUR NAME
              </p>
              <input
                value={settings.userName ?? ''}
                onChange={(e) => updateSettings({ userName: e.target.value })}
                placeholder="How should we call you?"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Manage */}
        <Section title="Manage">
          <Row
            icon="fa-wallet" label="Accounts"
            sublabel={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
            onClick={onNavigateToAccounts}
          />
          <Row
            icon="fa-tag" label="Categories"
            sublabel={`${categories.length} categories`}
            onClick={onNavigateToCategories}
          />
          
          {/* Category Limit */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: '1px solid var(--divider)'
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-layer-group" style={{ fontSize: 14, color: 'var(--text-2)' }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)' }}>Visible Categories</p>
            </div>
            <select
              value={settings.categoryLimit}
              onChange={(e) => updateSettings({ categoryLimit: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
              style={{
                background: 'var(--surface-2)',
                color: 'var(--text-1)',
                border: '1px solid var(--divider)',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            >
              <option value="4">4 Items</option>
              <option value="8">8 Items</option>
              <option value="12">12 Items</option>
              <option value="16">16 Items</option>
              <option value="all">Show All</option>
            </select>
          </div>

          <div style={{ borderBottom: 'none' }}>
            <Row
              icon="fa-arrow-right-from-bracket"
              label="Log Out"
              onClick={handleLogout}
              danger
            />
          </div>
        </Section>

        {/* Data */}
        <Section title="Data">
          <Row
            icon="fa-file-export" label="Backup Data"
            sublabel="Save a complete copy (JSON)"
            onClick={handleBackupJSON}
          />
          <Row
            icon="fa-file-import" label="Restore Backup"
            sublabel="Import from a previous backup"
            onClick={() => document.getElementById('json-upload')?.click()}
          >
            <input id="json-upload" type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJSON} />
          </Row>
          <Row
            icon="fa-file-csv" label="Export CSV"
            sublabel={`${transactions.length} transactions`}
            onClick={handleExportCSV}
          />
          <div style={{ borderBottom: 'none' }}>
            <Row
              icon="fa-trash-can" label="Clear All Data"
              sublabel="Cannot be undone"
              onClick={() => setShowClearConfirm(true)}
              danger
            />
          </div>
        </Section>

        {/* About */}
        <div style={{ padding: '0 20px' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              overflow: 'hidden', flexShrink: 0,
              border: '1px solid var(--divider)',
            }}>
              <img src="/logo.jpg" alt="KwentaKo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>KwentaKo</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Personal Money Tracker · v2.0</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Offline-first · PHP · Supabase</p>
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
