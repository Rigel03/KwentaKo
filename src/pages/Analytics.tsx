import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  startOfYear, endOfYear, format, parseISO, isWithinInterval,
  subDays,
} from 'date-fns';
import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getPeriodSummary, getExpensesByCategory } from '../utils/calculations';
import { formatPHP, formatCompact } from '../utils/currency';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import type { AnalyticsPeriod } from '../types';

const PERIOD_OPTIONS: { id: AnalyticsPeriod; label: string }[] = [
  { id: 'week',  label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year',  label: 'This Year' },
];

function getInterval(period: AnalyticsPeriod) {
  const now = new Date();
  if (period === 'week')  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  if (period === 'month') return { start: startOfMonth(now), end: endOfMonth(now) };
  return { start: startOfYear(now), end: endOfYear(now) };
}

interface ChartTooltipProps { active?: boolean; payload?: { value: number; name: string }[]; label?: string; }
function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-xl text-xs">
      <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className={`font-semibold ${p.name === 'income' ? 'text-green-600' : p.name === 'expense' ? 'text-red-500' : 'text-indigo-600'}`}>
          {p.name.charAt(0).toUpperCase() + p.name.slice(1)}: ₱{p.value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | null>(null);
  const transactions = useStore((s) => s.transactions);
  const categories   = useStore((s) => s.categories);

  const interval = useMemo(() => getInterval(period), [period]);

  const periodTxns = useMemo(() =>
    transactions.filter((t) => isWithinInterval(parseISO(t.date), interval)),
    [transactions, interval],
  );

  const { totalIncome, totalExpense, net } = getPeriodSummary(periodTxns);

  // ── Bar Chart — Income vs Expense per sub-period
  const barData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();

    if (period === 'week') {
      ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach((d) => map.set(d, { income: 0, expense: 0 }));
      periodTxns.forEach((t) => {
        if (t.type === 'transfer') return;
        const label = format(parseISO(t.date), 'EEE');
        const v = map.get(label) ?? { income: 0, expense: 0 };
        if (t.type === 'income') v.income += t.amount / 100;
        else v.expense += t.amount / 100;
        map.set(label, v);
      });
    } else if (period === 'month') {
      periodTxns.forEach((t) => {
        if (t.type === 'transfer') return;
        const d = parseISO(t.date);
        const label = `W${Math.ceil(d.getDate() / 7)}`;
        const v = map.get(label) ?? { income: 0, expense: 0 };
        if (t.type === 'income') v.income += t.amount / 100;
        else v.expense += t.amount / 100;
        map.set(label, v);
      });
    } else {
      periodTxns.forEach((t) => {
        if (t.type === 'transfer') return;
        const label = format(parseISO(t.date), 'MMM');
        const v = map.get(label) ?? { income: 0, expense: 0 };
        if (t.type === 'income') v.income += t.amount / 100;
        else v.expense += t.amount / 100;
        map.set(label, v);
      });
    }

    return Array.from(map.entries()).map(([label, v]) => ({ label, ...v }));
  }, [periodTxns, period]);

  // ── Category Donut
  const catData = useMemo(() => {
    const breakdown = getExpensesByCategory(periodTxns);
    return breakdown.slice(0, 7).map((item) => {
      const cat = categories.find((c) => c.id === item.categoryId);
      return {
        name: cat?.name ?? 'Other',
        color: cat?.color ?? '#94A3B8',
        value: item.total / 100,
        rawTotal: item.total,
        percentage: item.percentage,
      };
    });
  }, [periodTxns, categories]);

  const activeCat = activeDonutIndex !== null ? catData[activeDonutIndex] : null;
  const donutCenterValue = activeCat ? activeCat.rawTotal : totalExpense;
  const donutCenterName  = activeCat ? activeCat.name : 'Spending';

  // ── 30-day Balance Trend (area chart)
  const trendData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const day = subDays(new Date(), 29 - i);
      const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
      let bal = 0;
      for (const t of transactions) {
        if (parseISO(t.date) > dayEnd) continue;
        if (t.type === 'income') bal += t.amount;
        if (t.type === 'expense') bal -= t.amount;
      }
      return { date: format(day, 'MMM d'), balance: bal / 100 };
    });
  }, [transactions]);

  // ── Month-over-month
  const now = new Date();
  const thisMonthTxns = transactions.filter((t) =>
    isWithinInterval(parseISO(t.date), { start: startOfMonth(now), end: endOfMonth(now) }),
  );
  const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const lastMonthEnd   = endOfMonth(lastMonthStart);
  const lastMonthTxns  = transactions.filter((t) =>
    isWithinInterval(parseISO(t.date), { start: lastMonthStart, end: lastMonthEnd }),
  );
  const thisMonthExp  = getPeriodSummary(thisMonthTxns).totalExpense;
  const lastMonthExp  = getPeriodSummary(lastMonthTxns).totalExpense;
  const momChange     = lastMonthExp > 0 ? ((thisMonthExp - lastMonthExp) / lastMonthExp) * 100 : 0;

  const isPositiveTrend = trendData[trendData.length - 1]?.balance >= 0;

  return (
    <div className="min-h-screen animate-fade-in" style={{ backgroundColor: 'var(--bg)', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--divider)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="header-container" style={{ background: 'transparent', paddingBottom: 12, position: 'relative' }}>
          <h1 className="header-title">Analytics</h1>
        </div>

        {/* Period Selector */}
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px' }}>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              id={`analytics-period-${opt.id}`}
              onClick={() => setPeriod(opt.id)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
                border: period === opt.id ? 'none' : '1.5px solid var(--divider)',
                background: period === opt.id ? 'var(--text-1)' : 'var(--surface-2)',
                color: period === opt.id ? 'var(--bg)' : 'var(--text-3)',
                transition: 'all 200ms ease',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Summary Cards */}
        <div style={{ display: 'flex', gap: 12 }}>
          <StatCard label="Income"  amount={formatPHP(totalIncome)}  icon="fa-arrow-down"  variant="income"  />
          <StatCard label="Expense" amount={formatPHP(totalExpense)} icon="fa-arrow-up"    variant="expense" />
        </div>
        <StatCard
          label="Net Cash Flow"
          amount={formatPHP(net)}
          icon={net >= 0 ? 'fa-circle-check' : 'fa-circle-exclamation'}
          variant={net >= 0 ? 'income' : 'expense'}
          subtitle={net >= 0 ? 'You spent less than you earned' : 'You spent more than you earned'}
        />

        {/* Month-over-Month */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="section-label">vs Last Month (Spending)</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>
                {formatPHP(thisMonthExp)}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                Last month: {formatPHP(lastMonthExp)}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', color: momChange > 0 ? 'var(--expense)' : 'var(--income)' }}>
              <i className={`fa-solid ${momChange > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`} style={{ fontSize: 24, marginBottom: 4 }} />
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                {momChange > 0 ? '+' : ''}{momChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Income vs Expense Bar Chart */}
        <div className="card">
          <p className="section-label mb-3">Income vs Expenses</p>
          {barData.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '24px 0' }}>No data for this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barGap={3}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34C759" />
                    <stop offset="100%" stopColor="#28A745" />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF3B30" />
                    <stop offset="100%" stopColor="#DC3545" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="income"  fill="url(#incomeGrad)"  radius={[6,6,0,0]} name="income" />
                <Bar dataKey="expense" fill="url(#expenseGrad)" radius={[6,6,0,0]} name="expense" />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--income)' }} /><span style={{ fontSize: 12, color: 'var(--text-3)' }}>Income</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--expense)' }} /><span style={{ fontSize: 12, color: 'var(--text-3)' }}>Expense</span></div>
          </div>
        </div>

        {/* Spending by Category Donut */}
        <div className="card">
          <p className="section-label mb-3">Spending by Category</p>
          {catData.length === 0 ? (
            <EmptyState icon="fa-chart-pie" title="No Expense Data" description="Add some expenses to see your spending breakdown." />
          ) : (
            <>
              <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={catData} cx="50%" cy="50%"
                      innerRadius={58} outerRadius={88}
                      dataKey="value" paddingAngle={3}
                      onMouseEnter={(_, idx) => setActiveDonutIndex(idx)}
                      onMouseLeave={() => setActiveDonutIndex(null)}
                    >
                      {catData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.color}
                          opacity={activeDonutIndex === null || activeDonutIndex === idx ? 1 : 0.45}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="var(--text-3)" fontSize={10} fontWeight={600}>
                      {donutCenterName}
                    </text>
                    <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fill="var(--text-1)" fontSize={12} fontWeight={700}>
                      {donutCenterValue > 0 ? `₱${(donutCenterValue / 100).toLocaleString('en-PH', { maximumFractionDigits: 0 })}` : '—'}
                    </text>
                    <Tooltip
                      formatter={(v: unknown) => [`₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, '' as string] as [string, string]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                {catData.map((cat, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      opacity: activeDonutIndex !== null && activeDonutIndex !== idx ? 0.4 : 1,
                      transition: 'opacity 150ms ease',
                    }}
                    onMouseEnter={() => setActiveDonutIndex(idx)}
                    onMouseLeave={() => setActiveDonutIndex(null)}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cat.name}
                    </span>
                    <div style={{ width: 64, height: 6, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${cat.percentage}%`, background: cat.color, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', width: 36, textAlign: 'right' }}>{cat.percentage.toFixed(0)}%</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', width: 64, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCompact(cat.value * 100)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 30-Day Balance Trend */}
        <div className="card">
          <p className="section-label mb-3">30-Day Net Worth Trend</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositiveTrend ? '#007AFF' : '#FF3B30'} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={isPositiveTrend ? '#007AFF' : '#FF3B30'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-3)' }} axisLine={false} tickLine={false}
                interval={Math.floor(trendData.length / 5)} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text-3)' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₱${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip formatter={(v: unknown) => [`₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 'Balance'] as [string, string]} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={isPositiveTrend ? '#007AFF' : '#FF3B30'}
                strokeWidth={2.5}
                fill="url(#balanceGrad)"
                dot={false}
                activeDot={{ r: 5, fill: isPositiveTrend ? '#007AFF' : '#FF3B30', stroke: 'var(--surface)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
