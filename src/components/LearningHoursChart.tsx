import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MoreHorizontal, ChevronDown, Layout, Code, PenTool } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

const data = [
  { day: '23 Mar', hours: 4.2 },
  { day: '24 Mar', hours: 3.8 },
  { day: '25 Mar', hours: 3.5 },
  { day: '26 Mar', hours: 4.5 },
  { day: '27 Mar', hours: 3.2 },
  { day: '28 Mar', hours: 2.8 },
];

const stats = [
  { label: 'Mathematics', duration: '1h 15m', icon: Layout, color: 'bg-violet-900/30', textColor: 'text-violet-400' },
  { label: 'English', duration: '1h 2m', icon: Code, color: 'bg-indigo-900/30', textColor: 'text-indigo-400' },
  { label: 'Biology', duration: '0h 30m', icon: PenTool, color: 'bg-amber-900/30', textColor: 'text-amber-400' },
];

export default function LearningHoursChart() {
  const { theme } = useAppContext();
  const isLight = theme === 'light';

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-alt rounded-2xl flex items-center justify-center text-text-muted">
            <Layout size={20} />
          </div>
          <h2 className="text-lg font-bold text-text-main">Learning Hours</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-surface-alt rounded-lg text-xs font-bold text-text-muted border border-border">
            Monthly <ChevronDown size={14} />
          </button>
          <button className="p-1.5 hover:bg-surface-alt rounded-full transition-colors text-text-muted">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="flex-grow min-h-[200px] mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLight ? "#E2E8F0" : "#334155"} />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: isLight ? '#64748B' : '#94A3B8', fontWeight: 600 }}
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: isLight ? '#64748B' : '#94A3B8', fontWeight: 600 }}
              tickFormatter={(val) => `${val}h`}
            />
            <Tooltip 
              cursor={{ fill: isLight ? '#F1F5F9' : '#1E293B' }}
              contentStyle={{ 
                backgroundColor: isLight ? '#FFFFFF' : '#1E293B', 
                borderRadius: '16px', 
                border: `1px solid ${isLight ? '#E2E8F0' : '#334155'}`, 
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' 
              }}
              itemStyle={{ color: isLight ? '#0F172A' : '#F8FAFC' }}
            />
            <Bar 
              dataKey="hours" 
              radius={[20, 20, 20, 20]} 
              barSize={45}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 3 ? '#8B5CF6' : (isLight ? '#F1F5F9' : '#1E293B')} 
                  stroke={index === 3 ? 'none' : (isLight ? '#E2E8F0' : '#334155')}
                  strokeWidth={2}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 p-3 bg-surface-alt/50 rounded-2xl border border-border group hover:bg-surface-alt hover:shadow-sm transition-all">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.color, stat.textColor)}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-main leading-none mb-1">{stat.label}</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{stat.duration}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
