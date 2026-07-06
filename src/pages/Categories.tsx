import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useStore } from '../store/useStore';
import EmptyState from '../components/ui/EmptyState';
import type { Category, CategoryType } from '../types';

const PRESET_COLORS = [
  // Primary
  '#2563EB', '#16A34A', '#EF4444', '#F97316', '#EAB308',
  '#8B5CF6', '#EC4899', '#0891B2', '#7C3AED', '#14B8A6',
  // Darker
  '#1e3a8a', '#14532d', '#7f1d1d', '#7c2d12', '#713f12',
  '#4c1d95', '#831843', '#164e63', '#4c1d95', '#134e4a',
  // Lighter
  '#93c5fd', '#86efac', '#fca5a5', '#fdba74', '#fde047',
  '#c4b5fd', '#f9a8d4', '#67e8f9', '#c4b5fd', '#5eead4',
  // Grays
  '#94A3B8', '#1e293b'
];

// 100+ Font Awesome Free icons grouped by category
const ICON_GROUPS: { group: string; icons: string[] }[] = [
  {
    group: 'Food & Dining',
    icons: [
      'fa-utensils', 'fa-pizza-slice', 'fa-burger', 'fa-bowl-food',
      'fa-mug-hot', 'fa-wine-glass', 'fa-fish', 'fa-drumstick-bite',
      'fa-ice-cream', 'fa-cake-candles', 'fa-bread-slice', 'fa-egg',
      'fa-apple-whole', 'fa-carrot', 'fa-pepper-hot', 'fa-lemon',
    ],
  },
  {
    group: 'Transport',
    icons: [
      'fa-car', 'fa-bus', 'fa-train', 'fa-plane', 'fa-bicycle',
      'fa-motorcycle', 'fa-taxi', 'fa-ship', 'fa-truck', 'fa-gas-pump',
      'fa-car-side', 'fa-road', 'fa-map-location-dot', 'fa-traffic-light',
    ],
  },
  {
    group: 'Shopping',
    icons: [
      'fa-bag-shopping', 'fa-basket-shopping', 'fa-cart-shopping',
      'fa-store', 'fa-shirt', 'fa-hat-cowboy', 'fa-glasses',
      'fa-ring', 'fa-gem', 'fa-tag', 'fa-tags', 'fa-barcode',
      'fa-receipt', 'fa-box', 'fa-boxes-stacked',
    ],
  },
  {
    group: 'Finance & Money',
    icons: [
      'fa-peso-sign', 'fa-money-bill-wave', 'fa-wallet', 'fa-piggy-bank',
      'fa-chart-line', 'fa-chart-bar', 'fa-chart-pie', 'fa-coins',
      'fa-hand-holding-dollar', 'fa-circle-dollar-to-slot',
      'fa-building-columns', 'fa-credit-card', 'fa-landmark',
      'fa-money-bill-transfer', 'fa-sack-dollar', 'fa-vault',
    ],
  },
  {
    group: 'Health & Fitness',
    icons: [
      'fa-heart-pulse', 'fa-dumbbell', 'fa-pills', 'fa-syringe',
      'fa-stethoscope', 'fa-hospital', 'fa-face-smile', 'fa-spa',
      'fa-person-running', 'fa-person-swimming', 'fa-bicycle',
      'fa-brain', 'fa-tooth', 'fa-eye', 'fa-bandage',
    ],
  },
  {
    group: 'Entertainment',
    icons: [
      'fa-film', 'fa-music', 'fa-gamepad', 'fa-tv', 'fa-headphones',
      'fa-ticket', 'fa-masks-theater', 'fa-camera', 'fa-image',
      'fa-microphone', 'fa-guitar', 'fa-chess', 'fa-dice',
      'fa-futbol', 'fa-basketball', 'fa-volleyball', 'fa-table-tennis-paddle-ball',
    ],
  },
  {
    group: 'Home & Living',
    icons: [
      'fa-house', 'fa-couch', 'fa-bed', 'fa-bath', 'fa-blender',
      'fa-broom', 'fa-wrench', 'fa-hammer', 'fa-paintbrush',
      'fa-lightbulb', 'fa-plug', 'fa-faucet', 'fa-fire',
      'fa-snowflake', 'fa-fan', 'fa-lock', 'fa-key',
    ],
  },
  {
    group: 'Work & Education',
    icons: [
      'fa-graduation-cap', 'fa-book', 'fa-laptop', 'fa-briefcase',
      'fa-pen', 'fa-pencil', 'fa-paper-plane', 'fa-envelope',
      'fa-phone', 'fa-print', 'fa-file', 'fa-folder',
      'fa-code', 'fa-magnifying-glass', 'fa-chart-simple',
    ],
  },
  {
    group: 'People & Social',
    icons: [
      'fa-user', 'fa-users', 'fa-baby', 'fa-dog', 'fa-cat',
      'fa-gift', 'fa-heart', 'fa-star', 'fa-trophy', 'fa-medal',
      'fa-handshake', 'fa-hands-helping', 'fa-church', 'fa-cross',
    ],
  },
  {
    group: 'Utilities & Other',
    icons: [
      'fa-bolt', 'fa-droplet', 'fa-wifi', 'fa-mobile-screen-button',
      'fa-sim-card', 'fa-satellite-dish', 'fa-recycle', 'fa-repeat',
      'fa-pump-soap', 'fa-toilet-paper', 'fa-umbrella',
      'fa-suitcase', 'fa-map', 'fa-compass', 'fa-circle-question',
    ],
  },
];

const ALL_ICONS = ICON_GROUPS.flatMap((g) => g.icons);

const TYPE_OPTIONS: { id: CategoryType; label: string; color: string }[] = [
  { id: 'expense', label: 'Expense', color: 'var(--expense)'  },
  { id: 'income',  label: 'Income',  color: 'var(--income)'   },
  { id: 'both',    label: 'Both',    color: 'var(--accent)'   },
];

function CategoryActionMenu({
  category,
  onModify,
  onDelete,
  onCancel,
}: {
  category: Category;
  onModify: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-3xl p-6 space-y-3 animate-fade-in" style={{ background: 'var(--surface)' }}>
        <h3 className="text-center font-bold mb-4 text-lg" style={{ color: 'var(--text-1)' }}>{category.name}</h3>
        <button
          onClick={onModify}
          className="w-full py-4 rounded-xl font-bold transition-all active:scale-95"
          style={{ background: 'var(--surface-2)', color: 'var(--text-1)' }}
        >
          Modify Category
        </button>
        {!category.isDefault && (
          <button
            onClick={onDelete}
            className="w-full py-4 rounded-xl font-bold transition-all active:scale-95"
            style={{ color: 'var(--expense)', background: 'rgba(255,59,48,0.1)' }}
          >
            <i className="fa-solid fa-trash mr-2" /> Delete Category
          </button>
        )}
        <button
          onClick={onCancel}
          className="w-full py-4 rounded-xl font-bold transition-all active:scale-95 mt-2"
          style={{ color: 'var(--text-3)' }}
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}

function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Category;
  onSave: (c: Omit<Category, 'id' | 'sortOrder'>) => void;
  onCancel: () => void;
}) {
  const [name,       setName]       = useState(initial?.name   ?? '');
  const [type,       setType]       = useState<CategoryType>(initial?.type  ?? 'expense');
  const [icon,       setIcon]       = useState(initial?.icon   ?? 'fa-circle-question');
  const [color,      setColor]      = useState(initial?.color  ?? '#2563EB');
  const [iconSearch, setIconSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [showMoreColors, setShowMoreColors] = useState(false);
  const visibleColors = showMoreColors ? PRESET_COLORS : PRESET_COLORS.slice(0, 10);

  const displayIcons = (() => {
    if (iconSearch.trim()) {
      return ALL_ICONS.filter((i) => i.toLowerCase().includes(iconSearch.toLowerCase().replace(/\s/g, '-')));
    }
    if (activeGroup) {
      return ICON_GROUPS.find((g) => g.group === activeGroup)?.icons ?? [];
    }
    return ALL_ICONS;
  })();

  const valid = name.trim().length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onCancel} />
      <div
        className="relative w-full max-w-md rounded-3xl p-5 space-y-4 animate-fade-in overflow-y-auto"
        style={{ maxHeight: '85svh', background: 'var(--surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>
            {initial ? 'Edit Category' : 'New Category'}
          </h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Name */}
        <div>
          <p className="section-label">Name</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Groceries, Salary…"
            className="input-field"
            autoFocus
          />
        </div>

        {/* Type */}
        <div>
          <p className="section-label">Type</p>
          <div className="flex gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setType(opt.id)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: type === opt.id ? opt.color : 'var(--surface-2)',
                  color: type === opt.id ? '#fff' : 'var(--text-3)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Icon Picker */}
        <div>
          <p className="section-label">Icon</p>
          {/* Search */}
          <div className="relative mb-2">
            <i
              className="fa-solid fa-magnifying-glass absolute right-4 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: 'var(--text-3)' }}
            />
            <input
              value={iconSearch}
              onChange={(e) => { setIconSearch(e.target.value); setActiveGroup(null); }}
              placeholder="Search icons…"
              className="input-field pr-10 pl-4 text-sm"
            />
          </div>

          {/* Group chips */}
          {!iconSearch && (
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide">
              <button
                onClick={() => setActiveGroup(null)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: activeGroup === null ? 'var(--text-1)' : 'var(--surface-2)',
                  color: activeGroup === null ? 'var(--bg)' : 'var(--text-3)',
                }}
              >
                All
              </button>
              {ICON_GROUPS.map((g) => (
                <button
                  key={g.group}
                  onClick={() => setActiveGroup(g.group === activeGroup ? null : g.group)}
                  className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: activeGroup === g.group ? 'var(--text-1)' : 'var(--surface-2)',
                    color: activeGroup === g.group ? 'var(--bg)' : 'var(--text-3)',
                  }}
                >
                  {g.group}
                </button>
              ))}
            </div>
          )}

          {/* Icon grid */}
          <div
            className="grid grid-cols-6 gap-2 overflow-y-auto p-1"
            style={{ maxHeight: 180 }}
          >
            {displayIcons.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                title={ic.replace('fa-', '')}
                className="aspect-square rounded-xl flex items-center justify-center text-base transition-all"
                style={{
                  background: icon === ic ? color : 'var(--surface-2)',
                  color: icon === ic ? '#fff' : 'var(--text-3)',
                  outline: icon === ic ? `2px solid ${color}` : 'none',
                  outlineOffset: 2,
                }}
              >
                <i className={`fa-solid ${ic}`} />
              </button>
            ))}
            {displayIcons.length === 0 && (
              <p className="col-span-6 text-center text-xs py-4" style={{ color: 'var(--text-3)' }}>
                No icons found
              </p>
            )}
          </div>
        </div>

        {/* Color */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="section-label mb-0">Color</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {visibleColors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-9 h-9 rounded-xl transition-all"
                style={{
                  backgroundColor: c,
                  outline: color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: 2,
                }}
                aria-label={`Color ${c}`}
              />
            ))}

            {!showMoreColors && (
              <button
                onClick={() => setShowMoreColors(true)}
                className="w-9 h-9 rounded-xl transition-all flex items-center justify-center"
                style={{
                  background: 'var(--surface-2)', color: 'var(--text-1)',
                }}
              >
                <i className="fa-solid fa-ellipsis text-sm" />
              </button>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <i className={`fa-solid ${icon}`} style={{ color }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
              {name || 'Category Name'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              {TYPE_OPTIONS.find((t) => t.id === type)?.label}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-4 rounded-xl font-bold transition-transform active:scale-95"
            style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => valid && onSave({ name: name.trim(), type, icon, color, isDefault: initial?.isDefault ?? false, isActive: true })}
            disabled={!valid}
            className="flex-1 py-4 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg"
            style={{
              background: 'var(--text-1)',
              color: 'var(--bg)',
              opacity: valid ? 1 : 0.4,
              boxShadow: valid ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {initial ? 'Save Changes' : 'Create Category'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategory, showToast } = useStore();
  const [showForm,    setShowForm]    = useState(false);
  const [editingCat,  setEditingCat]  = useState<Category | null>(null);
  const [actionMenuCat, setActionMenuCat] = useState<Category | null>(null);
  const [filterType,  setFilterType]  = useState<CategoryType | 'all'>('all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filtered = categories
    .filter((c) => filterType === 'all' || c.type === filterType)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const handleSave = (data: Omit<Category, 'id' | 'sortOrder'>) => {
    if (editingCat) {
      updateCategory(editingCat.id, data);
      showToast('Category updated ✓');
    } else {
      addCategory({ ...data, id: crypto.randomUUID(), sortOrder: categories.length + 1 });
      showToast('Category added ✓');
    }
    setShowForm(false);
    setEditingCat(null);
  };

  const handleDelete = () => {
    if (actionMenuCat && confirm('Are you sure you want to delete this category?')) {
      deleteCategory(actionMenuCat.id);
      showToast('Category deleted');
      setActionMenuCat(null);
    }
  };

  const openActionMenu = (cat: Category) => {
    setActionMenuCat(cat);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderCategory(result.source.index, result.destination.index);
  };

  return (
    <div className="min-h-screen pb-20 animate-fade-in" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--divider)' }}>
        <div className="header-container" style={{ background: 'transparent' }}>
          <h1 className="header-title">Categories</h1>
          <button
            id="add-category-btn"
            onClick={() => { setEditingCat(null); setShowForm(true); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: 'var(--transfer)', color: '#fff' }}
          >
            <i className="fa-solid fa-plus text-xs" />
            Add
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-4 pb-3">
          {(['all', 'expense', 'income', 'both'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors"
              style={{
                background: filterType === t ? 'var(--text-1)' : 'var(--surface-2)',
                color: filterType === t ? 'var(--bg)' : 'var(--text-3)',
                boxShadow: filterType === t ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon="fa-tag"
            title="No categories"
            description="Add a custom category to organize your transactions."
            actionLabel="Add Category"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories-list">
              {(provided: any) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex flex-col gap-2"
                >
                  {filtered.map((cat, index) => (
                    <Draggable
                      key={cat.id}
                      draggableId={cat.id}
                      index={index}
                      isDragDisabled={filterType !== 'all'}
                    >
                      {(provided: any, snapshot: any) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-center gap-3 p-3 rounded-2xl transition-shadow"
                          style={{
                            background: 'var(--surface)',
                            boxShadow: snapshot.isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                            border: '1px solid var(--divider)',
                            zIndex: snapshot.isDragging ? 50 : 'auto',
                            ...provided.draggableProps.style,
                          }}
                        >
                          <button
                            className="flex items-center gap-3 flex-1 text-left"
                            onClick={() => openActionMenu(cat)}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${cat.color}18` }}
                            >
                              <i className={`fa-solid ${cat.icon} text-sm`} style={{ color: cat.color }} />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold" style={{ color: 'var(--text-1)' }}>
                                {cat.name}
                              </p>
                              <p className="text-xs capitalize" style={{ color: 'var(--text-3)' }}>
                                {cat.type}
                              </p>
                            </div>
                          </button>

                          <div
                            {...provided.dragHandleProps}
                            className={`p-2 shrink-0 ${filterType !== 'all' ? 'opacity-30 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                            style={{ color: 'var(--text-3)', touchAction: 'none' }}
                          >
                            <i className="fa-solid fa-bars text-lg" />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {showForm && (
        <CategoryForm
          initial={editingCat ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingCat(null); }}
        />
      )}

      {actionMenuCat && (
        <CategoryActionMenu
          category={actionMenuCat}
          onModify={() => {
            setEditingCat(actionMenuCat);
            setActionMenuCat(null);
            setShowForm(true);
          }}
          onDelete={handleDelete}
          onCancel={() => setActionMenuCat(null)}
        />
      )}
    </div>
  );
}
