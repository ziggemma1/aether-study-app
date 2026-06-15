import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface GrowthChartProps {
  labels: string[];
  scores: number[];
  studyMinutes: number[];
  period: 'week' | 'month' | 'all';
}

export default function GrowthChart({ labels, scores, studyMinutes, period }: GrowthChartProps) {
  // Map API fields we prepared together into Recharts records
  const chartData = labels.map((label, index) => ({
    name: label,
    score: scores[index] !== undefined ? scores[index] : 0,
    minutes: studyMinutes[index] !== undefined ? studyMinutes[index] : 0
  }));

  const hasData = scores.length > 0 && scores.some(s => s > 0);

  return (
    <div className="w-full flex flex-col space-y-6" id="growth-chart-wrapper">
      {/* Chart Title and Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-text-muted">Aether Analytics</h3>
          <h2 className="text-base font-black text-text-main mt-0.5">Focus vs recall scores</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Score %</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00D2FF]" />
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Time (m)</span>
          </div>
        </div>
      </div>

      {/* Recharts responsive canvas */}
      <div className="h-[220px] w-full bg-surface-alt/40 border border-border/5 rounded-2xl p-3 relative overflow-hidden">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary, #6C5CE7)" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="var(--color-primary, #6C5CE7)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="minutesColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D2FF" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00D2FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255, 255, 255, 0.3)" 
                fontSize={8} 
                fontFamily="inherit"
                fontWeight="bold"
                tickLine={false} 
                axisLine={false}
                dy={6}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.3)" 
                fontSize={8} 
                fontFamily="inherit"
                fontWeight="bold"
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0F172A', 
                  borderColor: 'rgba(255, 255, 255, 0.08)', 
                  borderRadius: '16px',
                  fontSize: '10px',
                  fontFamily: 'inherit',
                  color: '#fff',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                }}
                labelStyle={{ fontWeight: 'bold', color: '#6C5CE7', marginBottom: '4px' }}
                itemStyle={{ padding: '0px' }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#6C5CE7" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#scoreColor)" 
                name="Recall Score"
              />
              <Area 
                type="monotone" 
                dataKey="minutes" 
                stroke="#00D2FF" 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#minutesColor)" 
                name="Daily Minutes"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <p className="text-text-muted text-xs font-semibold">No learning sessions found for this period</p>
            <p className="text-[10px] text-text-muted/60 mt-1">Activities you complete will paint a beautiful stellar graph here!</p>
          </div>
        )}
      </div>
    </div>
  );
}
