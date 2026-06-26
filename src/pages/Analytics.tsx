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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 pt-6 pb-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Analytics</h1>

        {/* Period Selector */}
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              id={`analytics-period-${opt.id}`}
              onClick={() => setPeriod(opt.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                period === opt.id
                  ? 'text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
              style={period === opt.id ? { background: 'linear-gradient(135deg, #4F46E5, #2563EB)' } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Summary Cards */}
        <div className="flex gap-3">
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                vs Last Month (Spending)
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {formatPHP(thisMonthExp)}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Last month: {formatPHP(lastMonthExp)}
              </p>
            </div>
            <div className={`flex flex-col items-end ${momChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
              <i className={`fa-solid ${momChange > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} text-2xl mb-1`} />
              <span className="text-sm font-bold">
                {momChange > 0 ? '+' : ''}{momChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Income vs Expense Bar Chart — gradient bars */}
        <div className="card">
          <p className="section-label mb-3">Income vs Expenses</p>
          {barData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No data for this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barGap={3}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" />
                    <stop offset="100%" stopColor="#15803D" />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F87171" />
                    <stop offset="100%" stopColor="#DC2626" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="income"  fill="url(#incomeGrad)"  radius={[6,6,0,0]} name="income" />
                <Bar dataKey="expense" fill="url(#expenseGrad)" radius={[6,6,0,0]} name="expense" />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-600" /><span className="text-xs text-slate-500">Income</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500" /><span className="text-xs text-slate-500">Expense</span></div>
          </div>
        </div>

        {/* Spending by Category Donut — with interactive center label */}
        <div className="card">
          <p className="section-label mb-3">Spending by Category</p>
          {catData.length === 0 ? (
            <EmptyState icon="fa-chart-pie" title="No Expense Data" description="Add some expenses to see your spending breakdown." />
          ) : (
            <>
              <div className="relative">
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
                    {/* Custom center label via recharts label prop workaround */}
                    <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="#94A3B8" fontSize={10} fontWeight={600}>
                      {donutCenterName}
                    </text>
                    <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fill="#0F172A" fontSize={12} fontWeight={700}>
                      {donutCenterValue > 0 ? `₱${(donutCenterValue / 100).toLocaleString('en-PH', { maximumFractionDigits: 0 })}` : '—'}
                    </text>
                    <Tooltip
                      formatter={(v: unknown) => [`₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, '' as string] as [string, string]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 mt-1">
                {catData.map((cat, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 transition-opacity duration-150 ${
                      activeDonutIndex !== null && activeDonutIndex !== idx ? 'opacity-40' : 'opacity-100'
                    }`}
                    onMouseEnter={() => setActiveDonutIndex(idx)}
                    onMouseLeave={() => setActiveDonutIndex(null)}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs text-slate-600 dark:text-slate-300 flex-1 truncate">{cat.name}</span>
                    {/* Mini progress bar per category */}
                    <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-9 text-right">{cat.percentage.toFixed(0)}%</span>
                    <span className="text-xs font-semibold font-mono text-slate-700 dark:text-slate-200 w-16 text-right">
                      {formatCompact(cat.value * 100)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 30-Day Balance Trend — Area Chart */}
        <div className="card">
          <p className="section-label mb-3">30-Day Net Worth Trend</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositiveTrend ? '#4F46E5' : '#EF4444'} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={isPositiveTrend ? '#4F46E5' : '#EF4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                interval={Math.floor(trendData.length / 5)} />
              <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₱${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip formatter={(v: unknown) => [`₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 'Balance'] as [string, string]} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={isPositiveTrend ? '#4F46E5' : '#EF4444'}
                strokeWidth={2.5}
                fill="url(#balanceGrad)"
                dot={false}
                activeDot={{ r: 5, fill: isPositiveTrend ? '#4F46E5' : '#EF4444', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
