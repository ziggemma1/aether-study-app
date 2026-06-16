import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Target, TrendingUp, Clock, Flame } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function CalendarAnalytics() {
  const { studySessions } = useAppContext();

  // Mock data for analytics (would typically be derived from studySessions)
  const weeklyData = [
    { name: 'Mon', hours: 2.5 },
    { name: 'Tue', hours: 3.8 },
    { name: 'Wed', hours: 1.5 },
    { name: 'Thu', hours: 4.2 },
    { name: 'Fri', hours: 2.1 },
    { name: 'Sat', hours: 5.0 },
    { name: 'Sun', hours: 4.5 },
  ];

  const subjectData = [
    { subject: 'Mathematics', value: 45, color: '#3b82f6' },
    { subject: 'Physics', value: 30, color: '#8b5cf6' },
    { subject: 'Literature', value: 15, color: '#ec4899' },
    { subject: 'History', value: 10, color: '#10b981' },
  ];

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500 overflow-y-auto no-scrollbar pb-20 lg:pb-0">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main flex items-center gap-2">
            Study Analytics <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full uppercase">Insights</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">Track your progress and optimize your study habits.</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Hours', value: '42.5h', trend: '+12%', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Current Streak', value: '14 Days', trend: 'Personal best', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Completion Rate', value: '87%', trend: '+3%', icon: Target, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Productivity', value: 'High', trend: 'Peak at 10 AM', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 sm:p-5 rounded-2xl flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-xl sm:text-2xl font-bold text-text-main mt-0.5">{stat.value}</h3>
              <p className="text-[10px] font-medium text-text-muted mt-1">{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 glass-card p-5 sm:p-6 rounded-2xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text-main">Weekly Activity</h3>
            <select className="bg-surface-alt/50 border border-border/50 rounded-lg text-xs font-medium px-3 py-1.5 text-text-main outline-none">
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </div>
          
          <div className="h-[200px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#888888' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#888888' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--surface))', border: '1px solid hsl(var(--border) / 0.3)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <cell key={`cell-${index}`} fill={index === 5 || index === 6 ? '#8b5cf6' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col">
          <h3 className="font-bold text-text-main mb-6">Subject Focus</h3>
          
          <div className="flex-1 flex flex-col justify-center gap-4">
            {subjectData.map((subject, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-text-main">{subject.subject}</span>
                  <span className="font-bold text-text-muted">{subject.value}%</span>
                </div>
                <div className="h-2 w-full bg-surface-alt rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${subject.value}%`, backgroundColor: subject.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
