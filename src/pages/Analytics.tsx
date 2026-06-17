import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
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
    <div
      className="rounded-xl p-3 shadow-lg text-xs"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="font-bold mb-1" style={{ color: 'var(--text-1)' }}>{label}</p>
      {payload.map((p) => (
        <p
          key={p.name}
          style={{
            color: p.name === 'income' ? 'var(--income)'
                 : p.name === 'expense' ? 'var(--expense)'
                 : 'var(--accent)',
          }}
        >
          {p.name}: ₱{p.value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
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
        percentage: item.percentage,
      };
    });
  }, [periodTxns, categories]);

  // ── 30-day Balance Trend (all accounts net)
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

  return (
    <div className="min-h-screen pb-8" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div
        className="px-4 pt-6 pb-4 sticky top-0 z-10"
        style={{ background: 'var(--bg)', boxShadow: '0 1px 0 var(--border)' }}
      >
        <h1
          className="font-bold mb-3"
          style={{ color: 'var(--text-1)', fontSize: 22, letterSpacing: '-0.01em' }}
        >
          Analytics
        </h1>

        {/* Period Selector */}
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              id={`analytics-period-${opt.id}`}
              onClick={() => setPeriod(opt.id)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{
                background: period === opt.id ? 'var(--text-1)' : 'var(--surface-2)',
                color:      period === opt.id ? 'var(--bg)'     : 'var(--text-2)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Summary Cards */}
        <div className="flex gap-3">
          <StatCard label="Income"   amount={formatPHP(totalIncome)}  icon="fa-arrow-down"  variant="income"  />
          <StatCard label="Expense"  amount={formatPHP(totalExpense)} icon="fa-arrow-up"    variant="expense" />
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
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label mb-1">vs Last Month (Spending)</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>
                {formatPHP(thisMonthExp)}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                Last month: {formatPHP(lastMonthExp)}
              </p>
            </div>
            <div
              className="flex flex-col items-end"
              style={{ color: momChange > 0 ? 'var(--expense)' : 'var(--income)' }}
            >
              <i className={`fa-solid ${momChange > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} text-2xl mb-1`} />
              <span className="text-sm font-bold">
                {momChange > 0 ? '+' : ''}{momChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Income vs Expense Bar Chart */}
        <div className="card">
          <p className="section-label mb-3">Income vs Expenses</p>
          {barData.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-3)' }}>No data for this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="income"  fill="var(--income)"  radius={[4,4,0,0]} name="income" />
                <Bar dataKey="expense" fill="var(--expense)" radius={[4,4,0,0]} name="expense" />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--income)' }} />
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--expense)' }} />
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>Expense</span>
            </div>
          </div>
        </div>

        {/* Spending by Category Donut */}
        <div className="card">
          <p className="section-label mb-3">Spending by Category</p>
          {catData.length === 0 ? (
            <EmptyState icon="fa-chart-pie" title="No expense data yet" description="Add some expense transactions to see your spending breakdown by category here." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={catData} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    dataKey="value" paddingAngle={3}
                  >
                    {catData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown) => [`₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, '' as string] as [string, string]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {catData.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs text-slate-600 dark:text-slate-300 flex-1 truncate">{cat.name}</span>
                    <span className="text-xs text-slate-400">{cat.percentage.toFixed(1)}%</span>
                    <span className="text-xs font-semibold font-mono text-slate-700 dark:text-slate-200">
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
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-3)' }} axisLine={false} tickLine={false}
                interval={Math.floor(trendData.length / 5)} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text-3)' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₱${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip formatter={(v: unknown) => [`₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 'Balance'] as [string, string]} />
              <Line type="monotone" dataKey="balance" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
