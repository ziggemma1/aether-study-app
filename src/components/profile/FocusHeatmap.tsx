import React from 'react';
import { cn, formatTime } from '../../lib/utils';

interface FocusHeatmapProps {
  /** Study sessions, raw from the API. */
  sessions: Array<{ startTime?: string; durationMinutes?: number }>;
  weeks?: number;
}

const DAY_MS = 86_400_000;

/** Local midnight, as a stable key. Deliberately not toISOString(): that
 *  converts to UTC and shifts the day for anyone west of Greenwich. */
function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Contribution grid for study time.
 *
 * The previous version laid 120 days into `grid-rows-7 grid-flow-col` with no
 * alignment to real weekdays, so a column was "some seven consecutive days",
 * not a week — the rows meant nothing and there were no month labels to read
 * it by. It also had no empty state, so an account with no sessions showed a
 * grid of ~120 empty outlined boxes with no explanation.
 */
export function FocusHeatmap({ sessions, weeks = 18 }: FocusHeatmapProps) {
  const { columns, total, activeDays, months } = React.useMemo(() => {
    const minutesByDay = new Map<string, number>();
    for (const s of sessions || []) {
      if (!s.startTime || !s.durationMinutes) continue;
      const d = new Date(s.startTime);
      if (isNaN(d.getTime())) continue;
      const k = dayKey(d);
      minutesByDay.set(k, (minutesByDay.get(k) || 0) + s.durationMinutes);
    }

    // Start on the Sunday of the week `weeks` ago, so every column really is a
    // calendar week and every row really is a weekday.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today.getTime() - (weeks * 7 - 1) * DAY_MS);
    start.setDate(start.getDate() - start.getDay());

    const cols: Array<Array<{ date: Date; minutes: number; future: boolean }>> = [];
    const monthLabels: Array<{ col: number; label: string }> = [];
    let seenMonth = -1;
    let total = 0;
    let activeDays = 0;

    for (let w = 0; w < weeks; w++) {
      const col: Array<{ date: Date; minutes: number; future: boolean }> = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start.getTime() + (w * 7 + d) * DAY_MS);
        const minutes = minutesByDay.get(dayKey(date)) || 0;
        if (minutes > 0) { total += minutes; activeDays++; }
        col.push({ date, minutes, future: date.getTime() > today.getTime() });
      }
      // Label a column when its month changes, but only if the previous label
      // is at least three columns back — a month that starts late in a week put
      // two labels side by side and they ran together as "MarApr".
      const m = col[0].date.getMonth();
      const lastLabelCol = monthLabels.length ? monthLabels[monthLabels.length - 1].col : -99;
      if (m !== seenMonth) {
        seenMonth = m;
        if (w - lastLabelCol >= 3) {
          monthLabels.push({ col: w, label: col[0].date.toLocaleDateString(undefined, { month: 'short' }) });
        }
      }
      cols.push(col);
    }

    return { columns: cols, total, activeDays, months: monthLabels };
  }, [sessions, weeks]);

  const level = (m: number) => (m === 0 ? 0 : m < 30 ? 1 : m < 60 ? 2 : m < 120 ? 3 : 4);

  // Opacity steps of --primary so the grid follows the equipped accent theme,
  // rather than the hardcoded violet glow it used to carry.
  const fill = ['bg-[var(--ring-track)]', 'bg-primary/25', 'bg-primary/45', 'bg-primary/70', 'bg-primary'];

  if (activeDays === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-alt/40 py-10 px-6 text-center">
        <p className="text-sm font-semibold text-text-main">No focus sessions yet</p>
        <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
          Finish a study session and the days you studied will start filling in here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-text-muted mb-3">
        {formatTime(total)} across {activeDays} {activeDays === 1 ? 'day' : 'days'} in the last {weeks} weeks
      </p>

      <div className="overflow-x-auto custom-scrollbar pb-1">
        <div className="inline-block min-w-max">
          <div className="flex gap-[3px] mb-1 ml-[26px]">
            {columns.map((_, i) => {
              const label = months.find((m) => m.col === i);
              return (
                <span key={i} className="w-3 text-[10px] text-text-muted whitespace-nowrap">
                  {label ? label.label : ''}
                </span>
              );
            })}
          </div>

          <div className="flex gap-[3px]">
            <div className="flex flex-col gap-[3px] mr-1 w-[22px]">
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                <span key={i} className="h-3 text-[10px] leading-3 text-text-muted">{d}</span>
              ))}
            </div>
            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((cell, ri) =>
                  cell.future ? (
                    <span key={ri} className="w-3 h-3" />
                  ) : (
                    <span
                      key={ri}
                      className={cn('w-3 h-3 rounded-[3px]', fill[level(cell.minutes)])}
                      title={`${cell.date.toDateString()}: ${cell.minutes ? formatTime(cell.minutes) : 'no study'}`}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-1.5 text-[11px] text-text-muted mt-3">
        <span>Less</span>
        {fill.map((f, i) => <span key={i} className={cn('w-3 h-3 rounded-[3px]', f)} />)}
        <span>More</span>
      </div>
    </div>
  );
}
