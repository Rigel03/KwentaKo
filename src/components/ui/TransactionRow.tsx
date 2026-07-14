import { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { formatPHP } from '../../utils/currency';
import { vibrateConfirm } from '../../utils/haptic';
import { format, parseISO } from 'date-fns';
import type { Transaction } from '../../types';

const SWIPE_THRESHOLD = 72; // px to trigger delete reveal

interface TransactionRowProps {
  transaction: Transaction;
  onClick?: () => void;
  showAccount?: boolean;
}

export default function TransactionRow({
  transaction,
  onClick,
  showAccount = true,
}: TransactionRowProps) {
  const categories   = useStore((s) => s.categories);
  const accounts     = useStore((s) => s.accounts);
  const budgets      = useStore((s) => s.budgets);
  const openAddSheet = useStore((s) => s.openAddSheet);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const deleteTransactionPair = useStore((s) => s.deleteTransactionPair);
  const showToast = useStore((s) => s.showToast);

  const [swipeX, setSwipeX] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const category  = categories.find((c) => c.id === transaction.categoryId);
  const account   = accounts.find((a) => a.id === transaction.accountId);
  const toAccount = transaction.toAccountId
    ? accounts.find((a) => a.id === transaction.toAccountId)
    : null;

  const isIncome   = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const isExpense  = transaction.type === 'expense';

  const amountColor = isIncome
    ? 'var(--income)'
    : isTransfer
    ? 'var(--transfer)'
    : 'var(--expense)';

  const amountPrefix = isIncome ? '+' : isTransfer ? '' : '-';
  const catColor = category?.color ?? (isIncome ? '#34C759' : isTransfer ? '#007AFF' : '#FF3B30');
  const timeStr  = format(parseISO(transaction.date), 'h:mm a');

  // Check if expense falls into a budget
  const relatedBudget = isExpense ? budgets.find((b) => {
    if (b.categoryId !== transaction.categoryId) return false;
    if (!b.startDate || !b.endDate) return false;
    const txDate = parseISO(transaction.date);
    const start = parseISO(b.startDate);
    const end = parseISO(b.endDate);
    return txDate >= start && txDate <= end;
  }) : null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    // Only capture horizontal swipes
    if (!isDragging.current && dy > 10) return; // vertical scroll, ignore
    if (dx < -8) isDragging.current = true;
    if (!isDragging.current) return;

    const clamped = Math.max(-SWIPE_THRESHOLD - 16, Math.min(0, dx));
    setSwipeX(clamped);
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    if (swipeX < -SWIPE_THRESHOLD * 0.6) {
      setSwipeX(-SWIPE_THRESHOLD);
      setIsRevealed(true);
    } else {
      setSwipeX(0);
      setIsRevealed(false);
    }
    isDragging.current = false;
  };

  const handleDelete = () => {
    vibrateConfirm();
    if (transaction.transferGroupId) {
      deleteTransactionPair(transaction.transferGroupId);
      showToast('Transfer deleted');
    } else {
      deleteTransaction(transaction.id);
      showToast('Transaction deleted');
    }
  };

  const resetSwipe = () => {
    setSwipeX(0);
    setIsRevealed(false);
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Delete action revealed behind */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: SWIPE_THRESHOLD,
          background: 'var(--expense)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={handleDelete}
      >
        <i className="fa-solid fa-trash" style={{ color: '#fff', fontSize: 16 }} />
      </div>

      {/* Row content — slides left to reveal delete */}
      <button
        className="txn-row w-full text-left"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isDragging.current ? 'none' : 'transform 250ms ease',
          position: 'relative',
          zIndex: 1,
          touchAction: 'pan-y',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (isRevealed) { resetSwipe(); return; }
          onClick?.() ?? openAddSheet(transaction.id);
        }}
        aria-label={`${transaction.type} ${formatPHP(transaction.amount)}`}
      >
        {/* Category Icon */}
        <div
          className="txn-icon flex-shrink-0"
          style={relatedBudget 
            ? { backgroundColor: catColor }
            : { backgroundColor: `${catColor}18` }
          }
        >
          <i
            className={`fa-solid ${category?.icon ?? 'fa-circle-question'}`}
            style={{ color: relatedBudget ? '#fff' : catColor, fontSize: 15 }}
          />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {category?.name ?? 'Unknown'}
          </p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2, flexWrap: 'nowrap', overflow: 'hidden' }}>
            {showAccount && (
              <span style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {isTransfer
                  ? `${account?.name ?? '?'} → ${toAccount?.name ?? '?'}`
                  : account?.name ?? '?'}
              </span>
            )}
            {relatedBudget && (
              <span style={{ 
                fontSize: 10, 
                color: 'var(--text-2)', 
                background: 'var(--surface-2)', 
                padding: '1px 5px', 
                borderRadius: 4,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                flexShrink: 0
              }}>
                <i className="fa-solid fa-lock" style={{ fontSize: 8 }} />
                {relatedBudget.title}
              </span>
            )}
            {transaction.note && (
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {(showAccount || relatedBudget) && '· '}{transaction.note.replace(/\[rec:[^\]]+\]/, '').trim()}
              </span>
            )}
          </div>
        </div>

        {/* Amount + time */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{
            fontSize: 14,
            fontWeight: 700,
            color: amountColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {amountPrefix}{formatPHP(transaction.amount)}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{timeStr}</p>
        </div>
      </button>
    </div>
  );
}
