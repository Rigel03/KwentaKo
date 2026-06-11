import { useState } from 'react';
import { useStore } from '../store/useStore';
import EmptyState from '../components/ui/EmptyState';
import type { Category, CategoryType } from '../types';

const PRESET_COLORS = [
  '#2563EB', '#16A34A', '#EF4444', '#F97316', '#EAB308',
  '#8B5CF6', '#EC4899', '#0891B2', '#7C3AED', '#14B8A6',
  '#94A3B8', '#1E3A8A',
];

const POPULAR_ICONS = [
  'fa-utensils', 'fa-car', 'fa-bag-shopping', 'fa-film', 'fa-bolt',
  'fa-heart-pulse', 'fa-graduation-cap', 'fa-basket-shopping', 'fa-repeat',
  'fa-pump-soap', 'fa-chart-line', 'fa-piggy-bank', 'fa-circle-question',
  'fa-money-bill-wave', 'fa-laptop', 'fa-store', 'fa-hand-holding-dollar',
  'fa-gift', 'fa-circle-dollar-to-slot', 'fa-right-left', 'fa-house',
  'fa-plane', 'fa-book', 'fa-dumbbell', 'fa-gamepad', 'fa-music',
  'fa-dog', 'fa-baby', 'fa-shirt', 'fa-coffee', 'fa-pizza-slice',
];

const TYPE_OPTIONS: { id: CategoryType; label: string }[] = [
  { id: 'expense', label: 'Expense' },
  { id: 'income',  label: 'Income' },
  { id: 'both',    label: 'Both' },
];

function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Category;
  onSave: (c: Omit<Category, 'id' | 'sortOrder'>) => void;
  onCancel: () => void;
}) {
  const [name, setName]   = useState(initial?.name ?? '');
  const [type, setType]   = useState<CategoryType>(initial?.type ?? 'expense');
  const [icon, setIcon]   = useState(initial?.icon ?? 'fa-circle-question');
  const [color, setColor] = useState(initial?.color ?? '#2563EB');
  const [iconSearch, setIconSearch] = useState('');

  const filteredIcons = POPULAR_ICONS.filter((i) =>
    iconSearch ? i.includes(iconSearch.toLowerCase()) : true,
  );

  const valid = name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-3xl p-5 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {initial ? 'Edit Category' : 'New Category'}
          </h3>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Name */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="input-field"
        />

        {/* Type */}
        <div className="flex gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setType(opt.id)}
              className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                type === opt.id
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Icon Picker */}
        <div>
          <p className="section-label">Icon</p>
          <input
            value={iconSearch}
            onChange={(e) => setIconSearch(e.target.value)}
            placeholder="Search icons…"
            className="input-field mb-2"
          />
          <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto">
            {filteredIcons.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`w-full aspect-square rounded-xl flex items-center justify-center text-lg transition-all ${
                  icon === ic
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 ring-2 ring-blue-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <i className={`fa-solid ${ic}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <p className="section-label">Color</p>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-xl transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}25` }}>
            <i className={`fa-solid ${icon}`} style={{ color }} />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{name || 'Category Name'}</p>
        </div>

        <button
          onClick={() => valid && onSave({ name: name.trim(), type, icon, color, isDefault: false, isActive: true })}
          disabled={!valid}
          className="btn-primary"
        >
          {initial ? 'Save Changes' : 'Add Category'}
        </button>
      </div>
    </div>
  );
}

export default function Categories() {
  const { categories, addCategory, updateCategory, showToast } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [filterType, setFilterType] = useState<CategoryType | 'all'>('all');

  const filtered = categories.filter(
    (c) => filterType === 'all' || c.type === filterType,
  );

  const handleSave = (data: Omit<Category, 'id' | 'sortOrder'>) => {
    if (editingCat) {
      updateCategory(editingCat.id, data);
      showToast('Category updated ✓');
    } else {
      addCategory({
        ...data,
        id: crypto.randomUUID(),
        sortOrder: categories.length + 1,
      });
      showToast('Category added ✓');
    }
    setShowForm(false);
    setEditingCat(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 pt-6 pb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Categories</h1>
          <button
            onClick={() => { setEditingCat(null); setShowForm(true); }}
            className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <i className="fa-solid fa-plus text-sm" />
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'expense', 'income', 'both'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filterType === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {filtered.length === 0 ? (
          <EmptyState icon="fa-tag" title="No Categories" description="Add a custom category." actionLabel="Add" onAction={() => setShowForm(true)} />
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {filtered.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  if (!cat.isDefault) { setEditingCat(cat); setShowForm(true); }
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 transition-all relative"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}20` }}>
                  <i className={`fa-solid ${cat.icon} text-sm`} style={{ color: cat.color }} />
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 text-center leading-tight">
                  {cat.name}
                </span>
                {cat.isDefault && (
                  <i className="fa-solid fa-lock absolute top-1.5 right-1.5 text-slate-300 dark:text-slate-600 text-xs" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <CategoryForm
          initial={editingCat ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingCat(null); }}
        />
      )}
    </div>
  );
}
