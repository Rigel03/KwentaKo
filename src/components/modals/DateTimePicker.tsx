import { useState, useEffect, useRef } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, isSameMonth, isSameDay, isAfter,
  startOfDay, eachDayOfInterval,
} from 'date-fns';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
  maxDate?: Date;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES = Array.from({ length: 60 }, (_, i) => i);  // 0-59

export default function DateTimePicker({ value, onChange, onClose, maxDate }: DateTimePickerProps) {
  const today    = startOfDay(new Date());
  const [viewing, setViewing] = useState(startOfMonth(value));

  // Decompose value into day + time parts
  const [selDay,  setSelDay]  = useState(startOfDay(value));
  const [selHour, setSelHour] = useState(value.getHours() % 12 || 12);
  const [selMin,  setSelMin]  = useState(value.getMinutes());
  const [selAmpm, setSelAmpm] = useState<'AM' | 'PM'>(value.getHours() < 12 ? 'AM' : 'PM');

  const hourRef = useRef<HTMLDivElement>(null);
  const minRef  = useRef<HTMLDivElement>(null);

  // Scroll the selected hour/minute into view when picker opens
  useEffect(() => {
    hourRef.current?.querySelector('[data-selected]')?.scrollIntoView({ block: 'center', behavior: 'instant' });
    minRef.current?.querySelector('[data-selected]')?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, []);

  // Emit changes whenever any part changes
  const emit = (day: Date, h: number, m: number, ampm: 'AM' | 'PM') => {
    const hour24 = ampm === 'AM' ? (h % 12) : (h % 12) + 12;
    const out = new Date(day);
    out.setHours(hour24, m, 0, 0);
    onChange(out);
  };

  const handleDayClick = (day: Date) => {
    if (maxDate && isAfter(startOfDay(day), startOfDay(maxDate))) return;
    setSelDay(day);
    emit(day, selHour, selMin, selAmpm);
  };

  const handleHour = (h: number) => { setSelHour(h); emit(selDay, h, selMin, selAmpm); };
  const handleMin  = (m: number) => { setSelMin(m);  emit(selDay, selHour, m, selAmpm); };
  const handleAmpm = (ap: 'AM' | 'PM') => { setSelAmpm(ap); emit(selDay, selHour, selMin, ap); };

  // Build calendar grid
  const gridStart = startOfWeek(startOfMonth(viewing));
  const gridEnd   = endOfWeek(endOfMonth(viewing));
  const days      = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full rounded-t-3xl animate-slide-up"
        style={{ background: 'var(--surface)', maxHeight: '92svh', overflowY: 'auto' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--surface-3)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <h2 className="font-bold text-base" style={{ color: 'var(--text-1)' }}>
            Date &amp; Time
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        <div className="px-4 pb-6 flex flex-col gap-4">

          {/* ── Calendar ──────────────────────────────────────────────── */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface-2)' }}>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setViewing((v) => subMonths(v, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-xl"
                style={{ background: 'var(--surface)', color: 'var(--text-2)' }}
              >
                <i className="fa-solid fa-chevron-left text-xs" />
              </button>
              <span className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>
                {format(viewing, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => setViewing((v) => addMonths(v, 1))}
                disabled={maxDate ? isAfter(addMonths(startOfMonth(viewing), 1), startOfMonth(maxDate)) : false}
                className="w-8 h-8 flex items-center justify-center rounded-xl disabled:opacity-30"
                style={{ background: 'var(--surface)', color: 'var(--text-2)' }}
              >
                <i className="fa-solid fa-chevron-right text-xs" />
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-semibold py-1"
                  style={{ color: 'var(--text-3)' }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Date grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {days.map((day) => {
                const isThisMonth = isSameMonth(day, viewing);
                const isSelected  = isSameDay(day, selDay);
                const isToday     = isSameDay(day, today);
                const isDisabled  = maxDate ? isAfter(startOfDay(day), startOfDay(maxDate)) : false;
                const isFuture    = isAfter(startOfDay(day), today);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    disabled={isDisabled || isFuture}
                    className="aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all disabled:opacity-30"
                    style={{
                      background: isSelected ? 'var(--accent)' : isToday ? 'var(--surface-3)' : 'transparent',
                      color:      isSelected ? '#fff'
                               : !isThisMonth ? 'var(--text-3)'
                               : 'var(--text-1)',
                      fontWeight: isSelected || isToday ? 700 : 500,
                    }}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Time Picker ────────────────────────────────────────────── */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface-2)' }}>
            <p className="section-label mb-3">Time</p>
            <div className="flex items-stretch gap-2">

              {/* Hours */}
              <div
                ref={hourRef}
                className="flex-1 overflow-y-auto rounded-xl"
                style={{ maxHeight: 160, background: 'var(--surface)', scrollbarWidth: 'none' }}
              >
                {HOURS.map((h) => (
                  <button
                    key={h}
                    data-selected={selHour === h ? '' : undefined}
                    onClick={() => handleHour(h)}
                    className="w-full py-2.5 text-center text-sm font-semibold transition-colors rounded-xl"
                    style={{
                      background: selHour === h ? 'var(--accent)' : 'transparent',
                      color:      selHour === h ? '#fff' : 'var(--text-2)',
                    }}
                  >
                    {String(h).padStart(2, '0')}
                  </button>
                ))}
              </div>

              {/* Colon */}
              <div className="flex items-center">
                <span className="font-bold text-lg" style={{ color: 'var(--text-3)' }}>:</span>
              </div>

              {/* Minutes */}
              <div
                ref={minRef}
                className="flex-1 overflow-y-auto rounded-xl"
                style={{ maxHeight: 160, background: 'var(--surface)', scrollbarWidth: 'none' }}
              >
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    data-selected={selMin === m ? '' : undefined}
                    onClick={() => handleMin(m)}
                    className="w-full py-2.5 text-center text-sm font-semibold transition-colors rounded-xl"
                    style={{
                      background: selMin === m ? 'var(--accent)' : 'transparent',
                      color:      selMin === m ? '#fff' : 'var(--text-2)',
                    }}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                ))}
              </div>

              {/* AM / PM */}
              <div className="flex flex-col gap-2 justify-center">
                {(['AM', 'PM'] as const).map((ap) => (
                  <button
                    key={ap}
                    onClick={() => handleAmpm(ap)}
                    className="px-3 py-3 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: selAmpm === ap ? 'var(--accent)' : 'var(--surface)',
                      color:      selAmpm === ap ? '#fff' : 'var(--text-2)',
                    }}
                  >
                    {ap}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected time display */}
            <p className="text-center text-xs mt-3 font-semibold" style={{ color: 'var(--text-3)' }}>
              {format(selDay, 'EEE, MMM d yyyy')} · {String(selHour).padStart(2, '0')}:{String(selMin).padStart(2, '0')} {selAmpm}
            </p>
          </div>

          {/* Confirm */}
          <button onClick={onClose} className="btn-primary">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
