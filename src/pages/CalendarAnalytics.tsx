import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, TrendingUp, Clock, Flame, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useReports } from '../hooks/useReports';

const SUBJECT_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];

export default function CalendarAnalytics() {
  const { studySessions } = useAppContext();
  const [period, setPeriod] = React.useState<'week' | 'month' | 'all'>('week');
  const { summary, trends, subjects, loading } = useReports(period);

  const weeklyData = React.useMemo(() => {
    if (!trends?.labels) return [];
    return trends.labels.map((name: string, i: number) => ({
      name,
      hours: Math.round(((trends.studyMinutes?.[i] || 0) / 60) * 10) / 10
    }));
  }, [trends]);

  const subjectData = React.useMemo(() => {
    return (subjects || [])
      .filter((s: any) => s.quizCount > 0)
      .map((s: any, i: number) => ({
        subject: s.name,
        value: s.proficiency,
        color: SUBJECT_COLORS[i % SUBJECT_COLORS.length]
      }));
  }, [subjects]);

  // Completion rate and peak study hour are derivable client-side from the
  // sessions already in context — no need for another round trip.
  const { completionRate, peakHourLabel, productivity } = React.useMemo(() => {
    const studyOnly = studySessions.filter(s => s.type === 'study');
    if (studyOnly.length === 0) {
      return { completionRate: null as number | null, peakHourLabel: null as string | null, productivity: 'New' };
    }

    const completed = studyOnly.filter(s => s.completed).length;
    const rate = Math.round((completed / studyOnly.length) * 100);

    const minutesByHour = new Map<number, number>();
    studyOnly.forEach(s => {
      const hour = new Date(s.startTime).getHours();
      minutesByHour.set(hour, (minutesByHour.get(hour) || 0) + (s.durationMinutes || 0));
    });
    let peakHour = 0;
    let peakMinutes = -1;
    minutesByHour.forEach((mins, hour) => {
      if (mins > peakMinutes) { peakMinutes = mins; peakHour = hour; }
    });
    const peakLabel = new Date(0, 0, 0, peakHour).toLocaleTimeString('en-US', { hour: 'numeric' });

    const weeklyTotalMinutes = (trends?.studyMinutes || []).reduce((a: number, b: number) => a + b, 0);
    const tier = weeklyTotalMinutes >= 600 ? 'High' : weeklyTotalMinutes >= 180 ? 'Medium' : 'Low';

    return { completionRate: rate, peakHourLabel: peakLabel, productivity: tier };
  }, [studySessions, trends]);

  const totalHours = summary ? Math.round((summary.totalStudyTimeMinutes / 60) * 10) / 10 : 0;

  const kpis = [
    { label: 'Total Hours', value: `${totalHours}h`, trend: 'All time', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Current Streak', value: `${summary?.studyStreak ?? 0} Days`, trend: summary?.studyStreak > 0 ? 'Keep it going' : 'Start today', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Completion Rate', value: completionRate === null ? 'No Data' : `${completionRate}%`, trend: completionRate === null ? 'Log a session' : 'Study sessions finished', icon: Target, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Productivity', value: productivity, trend: peakHourLabel ? `Peak at ${peakHourLabel}` : 'Not enough data yet', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
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
        {kpis.map((stat, i) => (
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
            <h3 className="font-bold text-text-main">Study Activity</h3>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'all')}
              className="bg-surface-alt/50 border border-border/50 rounded-lg text-xs font-medium px-3 py-1.5 text-text-main outline-none"
            >
              <option value="week">This Week</option>
              <option value="month">Last 4 Weeks</option>
              <option value="all">Last 6 Months</option>
            </select>
          </div>

          <div className="h-[200px] w-full mt-auto relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : weeklyData.every((d: any) => d.hours === 0) ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-text-muted text-center px-6">
                No study sessions logged yet for this period.
              </div>
            ) : (
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
                    {weeklyData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index >= weeklyData.length - 2 ? '#8b5cf6' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col">
          <h3 className="font-bold text-text-main mb-1">Subject Proficiency</h3>
          <p className="text-[10px] text-text-muted mb-6">Average quiz score by material category</p>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={20} />
            </div>
          ) : subjectData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-text-muted text-center px-4">
              Take a quiz on your materials to see proficiency by subject.
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center gap-4">
              {subjectData.map((subject: any, i: number) => (
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
          )}
        </div>
      </div>
    </div>
  );
}
