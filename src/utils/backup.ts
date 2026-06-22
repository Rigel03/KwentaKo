import { useStore } from '../store/useStore';
import { format } from 'date-fns';

export function exportBackupJSON() {
  const state = useStore.getState();
  const backup = {
    accounts: state.accounts,
    transactions: state.transactions,
    categories: state.categories,
    settings: state.settings,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `kwentako_backup_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

export function importBackupJSON(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (!parsed.accounts || !parsed.transactions || !parsed.categories) {
          throw new Error('Invalid backup file format');
        }

        const state = useStore.getState();
        // Merge settings or completely replace state
        state.clearAllData(); // reset first
        
        parsed.accounts.forEach(state.addAccount);
        state.addTransactions(parsed.transactions);
        
        // We clear existing defaults before adding from backup since clearAllData sets defaults
        useStore.setState({ categories: [] });
        parsed.categories.forEach(state.addCategory);
        
        if (parsed.settings) {
          state.updateSettings(parsed.settings);
        }
        
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
