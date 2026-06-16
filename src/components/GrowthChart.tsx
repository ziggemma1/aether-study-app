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

interface GrowthChartProps {
  trends: {
    labels: string[];
    scores: number[];
    studyMinutes: number[];
  } | null;
}

export default function GrowthChart({ trends }: GrowthChartProps) {
  if (!trends || !trends.labels || trends.labels.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#141A24] rounded-2xl border border-white/5">
        <p className="text-sm font-semibold text-gray-400">Start a study session to track your time</p>
        <p className="text-xs text-gray-500 mt-1">Complete your first quiz to see scores over time.</p>
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
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00D2FF" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6C5CE7" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#222A3A" vertical={false} />
          
          <XAxis 
            dataKey="name" 
            stroke="#94A3B8" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={10} 
          />
          
          {/* Left YAxis for Quiz scores */}
          <YAxis 
            yAxisId="left"
            domain={[0, 100]}
            stroke="#94A3B8" 
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
            stroke="#94A3B8" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dx={5}
            tickFormatter={(val) => `${val}m`}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#141A24',
              borderColor: '#222A3A',
              borderRadius: '12px',
              color: '#F0F3F8',
              fontSize: '12px'
            }}
            labelStyle={{ fontWeight: 'bold', color: '#FFF' }}
          />

          <Legend 
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
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
            stroke="#6C5CE7"
            strokeWidth={3}
            dot={{ r: 4, stroke: '#6C5CE7', strokeWidth: 2, fill: '#141A24' }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
