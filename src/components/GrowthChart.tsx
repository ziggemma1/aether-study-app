import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useAppContext } from '../context/AppContext';

interface GrowthChartProps {
  trends: {
    labels: string[];
    scores: number[];
    studyMinutes: number[];
  } | null;
}

/**
 * Recharts writes colours onto SVG presentation attributes (stroke, fill,
 * stopColor), and those do NOT resolve `var(--token)` — the browser drops the
 * value and the mark renders black. So unlike the rest of the app, this chart
 * cannot simply reference tokens: it has to read them out of the cascade and
 * hand recharts the computed strings. Recomputed on theme change so the chart
 * follows the toggle instead of freezing on whichever theme mounted first.
 */
function useTokenColors(ref: React.RefObject<HTMLElement | null>): Record<string, string> {
  const { theme, timeTheme } = useAppContext();
  const [colors, setColors] = React.useState<Record<string, string>>({});

  // Read from the chart's OWN node, not documentElement. `theme` is set on
  // documentElement but `timeTheme` is set on a div inside AppLayout, so a
  // root-level read silently misses any token a time-of-day theme overrides.
  // Reading from inside the themed subtree gets whatever actually cascades.
  // useLayoutEffect so the first paint already has the colours — recharts
  // would otherwise render one frame of black marks from `undefined`.
  React.useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const cs = getComputedStyle(node);
    const read = (name: string) => cs.getPropertyValue(name).trim();
    setColors({
      primary: read('--primary'),
      secondary: read('--secondary'),
      surface: read('--surface'),
      textMain: read('--text-main'),
      textMuted: read('--text-muted'),
      grid: read('--ring-track'),
    });
  }, [theme, timeTheme, ref]);

  return colors;
}

export default function GrowthChart({ trends }: GrowthChartProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const c = useTokenColors(wrapRef);
  if (!trends || !trends.labels || trends.labels.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-surface rounded-2xl border border-border">
        <p className="text-sm font-semibold text-text-main">Start a study session to track your time</p>
        <p className="text-xs text-text-muted mt-1">Complete your first quiz to see scores over time.</p>
      </div>
    );
  }

  // Map backend labels, scores, and studyMinutes to Recharts format
  const chartData = trends.labels.map((label, idx) => ({
    name: label,
    quizScore: trends.scores[idx] !== undefined ? trends.scores[idx] : 0,
    studyTime: trends.studyMinutes[idx] !== undefined ? trends.studyMinutes[idx] : 0,
  }));

  return (
    <div ref={wrapRef} className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.secondary} stopOpacity={0.4} />
              <stop offset="100%" stopColor={c.primary} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          
          <XAxis 
            dataKey="name" 
            stroke={c.textMuted} 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={10} 
          />
          
          {/* Left YAxis for Quiz scores */}
          <YAxis 
            yAxisId="left"
            domain={[0, 100]}
            stroke={c.textMuted} 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dx={-5}
            tickFormatter={(val) => `${val}%`}
          />

          {/* Right YAxis for Study Minutes */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke={c.textMuted} 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dx={5}
            tickFormatter={(val) => `${val}m`}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: c.surface,
              borderColor: c.grid,
              borderRadius: '12px',
              color: c.textMain,
              fontSize: '12px'
            }}
            labelStyle={{ fontWeight: 'bold', color: c.textMain }}
          />

          <Legend 
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', color: c.textMuted }}
          />

          {/* Study time in bars (right axis) */}
          <Bar 
            yAxisId="right"
            name="Study Time (mins)" 
            dataKey="studyTime" 
            fill="url(#barGradient)" 
            barSize={18}
            radius={[4, 4, 0, 0]}
          />

          {/* Quiz score in glowing purple line (left axis) */}
          <Line
            yAxisId="left"
            type="monotone"
            name="Avg Quiz Score (%)"
            dataKey="quizScore"
            stroke={c.primary}
            strokeWidth={3}
            dot={{ r: 4, stroke: c.primary, strokeWidth: 2, fill: c.surface }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
