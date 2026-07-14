import { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { getWeeklyInsights } from '../../utils/calculations';
import { formatPHP } from '../../utils/currency';

export default function InsightCard() {
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);

  const insight = useMemo(() => getWeeklyInsights(transactions, categories), [transactions, categories]);

  if (!insight) return null;

  const pct = insight.weekOverWeekPct;

  return (
    <div className='card' style={{ padding: '14px 16px', marginBottom: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: insight.topCategory ? insight.topCategory.color + '18' : 'var(--surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <i
            className={'fa-solid ' + (insight.topCategory?.icon ?? 'fa-lightbulb')}
            style={{ color: insight.topCategory?.color ?? 'var(--text-3)', fontSize: 15 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
            Weekly Insight
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.4 }}>
            {insight.topCategory
              ? 'Top spend: ' + insight.topCategory.name + ' — ' + formatPHP(insight.topCategoryAmount)
              : 'No expenses this week yet.'}
          </p>
        </div>
        {pct !== null && (
          <div style={{
            padding: '4px 8px', borderRadius: 8,
            background: pct <= 0 ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.10)',
            color: pct <= 0 ? 'var(--income)' : 'var(--expense)',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {pct > 0 ? '+' : ''}{pct.toFixed(0)}% vs last week
          </div>
        )}
      </div>
      {insight.message && (
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.5 }}>
          {insight.message}
        </p>
      )}
    </div>
  );
}
