import { useState } from 'react';
import { useStore, useRecurrings } from '../store/useStore';
import { formatPHP } from '../utils/currency';
import { format, parseISO } from 'date-fns';
import type { RecurringTransaction, RecurringFrequency, TransactionType } from '../types';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const FREQ_LABEL: Record<RecurringFrequency, string> = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
};

const TYPE_COLOR: Record<TransactionType, string> = {
  income: 'var(--income)', expense: 'var(--expense)', transfer: 'var(--transfer)',
};

interface RecurringFormState {
  type: TransactionType;
  amount: string;
  accountId: string;
  categoryId: string;
  note: string;
  frequency: RecurringFrequency;
  startDate: string;
}

export default function Recurring() {
  const recurrings = useRecurrings();
  const accounts = useStore((s) => s.accounts).filter((a) => a.isActive);
  const categories = useStore((s) => s.categories).filter((c) => c.isActive);
  const addRecurring = useStore((s) => s.addRecurring);
  const updateRecurring = useStore((s) => s.updateRecurring);
  const deleteRecurring = useStore((s) => s.deleteRecurring);
  const showToast = useStore((s) => s.showToast);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<RecurringFormState>({
    type: 'expense', amount: '', accountId: accounts[0]?.id ?? '',
    categoryId: '', note: '', frequency: 'monthly',
    startDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const openNew = () => {
    setEditId(null);
    setForm({ type: 'expense', amount: '', accountId: accounts[0]?.id ?? '', categoryId: '', note: '', frequency: 'monthly', startDate: format(new Date(), 'yyyy-MM-dd') });
    setShowForm(true);
  };

  const openEdit = (r: RecurringTransaction) => {
    setEditId(r.id);
    setForm({
      type: r.type, amount: String(r.amount / 100), accountId: r.accountId,
      categoryId: r.categoryId, note: r.note ?? '', frequency: r.frequency,
      startDate: r.startDate.slice(0, 10),
    });
    setShowForm(true);
  };

  const handleSave = () => {
    const amount = Math.round(parseFloat(form.amount) * 100);
    if (!amount || !form.accountId || !form.categoryId) { showToast('Fill all fields', 'error'); return; }
    const now = new Date().toISOString();
    if (editId) {
      updateRecurring(editId, { type: form.type, amount, accountId: form.accountId, categoryId: form.categoryId, note: form.note || undefined, frequency: form.frequency, startDate: new Date(form.startDate).toISOString() });
      showToast('Recurring updated');
    } else {
      addRecurring({ id: crypto.randomUUID(), type: form.type, amount, accountId: form.accountId, categoryId: form.categoryId, note: form.note || undefined, frequency: form.frequency, startDate: new Date(form.startDate).toISOString(), isActive: true, createdAt: now });
      showToast('Recurring created');
    }
    setShowForm(false);
  };

  const filteredCats = categories.filter((c) => c.type === form.type || c.type === 'both');

  return (
    <div className="min-h-screen pb-24 animate-fade-in" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="header-title">Recurring</h1>
        <button onClick={openNew} className="icon-btn" style={{ marginRight: 20 }} aria-label="Add recurring">
          <i className="fa-solid fa-plus" style={{ fontSize: 16 }} />
        </button>
      </div>

      <div style={{ padding: '8px 20px 32px' }}>
        {recurrings.length === 0 ? (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <i className="fa-solid fa-rotate" style={{ fontSize: 24, color: 'var(--text-3)' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>No Recurring Transactions</h3>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>Set up repeating entries like rent or salary.</p>
              <button onClick={openNew} style={{ padding: '10px 24px', borderRadius: 12, background: 'var(--accent)', color: 'var(--bg)', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Add First Rule
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {recurrings.map((r) => {
              const cat = categories.find((c) => c.id === r.categoryId);
              const acc = accounts.find((a) => a.id === r.accountId);
              return (
                <div key={r.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: cat?.color ? cat.color + '18' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={'fa-solid ' + (cat?.icon ?? 'fa-rotate')} style={{ color: cat?.color ?? 'var(--text-3)', fontSize: 16 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{cat?.name ?? 'Unknown'}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {acc?.name} · {FREQ_LABEL[r.frequency]}
                      {r.lastAppliedDate ? ' · Last: ' + format(parseISO(r.lastAppliedDate), 'MMM d') : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: TYPE_COLOR[r.type] }}>
                      {r.type === 'income' ? '+' : r.type === 'expense' ? '-' : ''}{formatPHP(r.amount)}
                    </p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 12, padding: 0 }}>
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button onClick={() => setDeleteId(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--expense)', fontSize: 12, padding: 0 }}>
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inline Form Sheet */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }} className="animate-slide-up">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--divider)', flexShrink: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{editId ? 'Edit Rule' : 'New Recurring Rule'}</h2>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-1)', padding: 4 }}>
              <i className="fa-solid fa-xmark" style={{ fontSize: 18 }} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Type */}
            <div>
              <p className="section-label">Type</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['expense', 'income'] as TransactionType[]).map((t) => (
                  <button key={t} onClick={() => setForm((f) => ({ ...f, type: t, categoryId: '' }))}
                    style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
                      background: form.type === t ? TYPE_COLOR[t] : 'var(--surface-2)', color: form.type === t ? '#fff' : 'var(--text-2)' }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {/* Amount */}
            <div>
              <p className="section-label">Amount (PHP)</p>
              <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="input-field" />
            </div>
            {/* Account */}
            <div>
              <p className="section-label">Account</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {accounts.map((a) => (
                  <button key={a.id} onClick={() => setForm((f) => ({ ...f, accountId: a.id }))}
                    style={{ padding: '8px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                      background: form.accountId === a.id ? a.color : a.color + '18', color: form.accountId === a.id ? '#fff' : a.color }}>
                    {a.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Category */}
            <div>
              <p className="section-label">Category</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {filteredCats.map((c) => (
                  <button key={c.id} onClick={() => setForm((f) => ({ ...f, categoryId: c.id }))}
                    style={{ padding: '10px 4px', borderRadius: 12, border: form.categoryId === c.id ? '2px solid ' + c.color : '2px solid transparent',
                      background: form.categoryId === c.id ? c.color + '18' : 'var(--surface-2)', cursor: 'pointer', fontSize: 10, fontWeight: 600, fontFamily: 'inherit', color: form.categoryId === c.id ? c.color : 'var(--text-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <i className={'fa-solid ' + c.icon} style={{ color: c.color, fontSize: 14 }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Frequency */}
            <div>
              <p className="section-label">Frequency</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['daily', 'weekly', 'monthly'] as RecurringFrequency[]).map((f) => (
                  <button key={f} onClick={() => setForm((ff) => ({ ...ff, frequency: f }))}
                    style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
                      background: form.frequency === f ? 'var(--text-1)' : 'var(--surface-2)', color: form.frequency === f ? 'var(--bg)' : 'var(--text-2)' }}>
                    {FREQ_LABEL[f]}
                  </button>
                ))}
              </div>
            </div>
            {/* Start Date */}
            <div>
              <p className="section-label">Start Date</p>
              <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="input-field" />
            </div>
            {/* Note */}
            <div>
              <p className="section-label">Note (optional)</p>
              <input type="text" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="e.g. Monthly rent" className="input-field" />
            </div>
            <button onClick={handleSave} style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: 'var(--accent)', color: 'var(--bg)', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {editId ? 'Update Rule' : 'Save Rule'}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Recurring Rule?"
        message="This will stop future automatic entries. Past transactions are kept."
        confirmLabel="Delete Rule"
        isDangerous
        onConfirm={() => { if (deleteId) { deleteRecurring(deleteId); showToast('Rule deleted'); } setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
