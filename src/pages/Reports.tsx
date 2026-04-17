import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  Award, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { cn } from '../lib/utils';

// Mock data for growth over time
const growthData = [
  { month: 'Jan', score: 65, avg: 60 },
  { month: 'Feb', score: 68, avg: 62 },
  { month: 'Mar', score: 75, avg: 65 },
  { month: 'Apr', score: 72, avg: 64 },
  { month: 'May', score: 85, avg: 68 },
  { month: 'Jun', score: 82, avg: 70 },
  { month: 'Jul', score: 94, avg: 72 },
];

// Mock data for scores vs losses (Correct vs Incorrect answers)
const performanceData = [
  { name: 'Correct', value: 840, color: '#10B981', lightColor: '#059669' },
  { name: 'Incorrect', value: 160, color: '#EF4444', lightColor: '#DC2626' },
];


import { useAppContext } from '../context/AppContext';

export default function Reports() {
  const { theme, quizResults, user, studySessions, materials, allProfiles } = useAppContext();
  const isLight = theme === 'light';

  // Safe arrays
  const safeMaterials = Array.isArray(materials) ? materials : [];
  const safeQuizResults = Array.isArray(quizResults) ? quizResults : [];
  const safeStudySessions = Array.isArray(studySessions) ? studySessions : [];
  const safeAllProfiles = Array.isArray(allProfiles) ? allProfiles : [];

  // Subject breakdown (derived from materials and quiz results)
  const subjectData = safeMaterials.map(m => {
    const materialQuizzes = safeQuizResults.filter(r => r.quizId === m.id);
    const avgScore = materialQuizzes.length > 0
      ? Math.round(materialQuizzes.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions), 0) / materialQuizzes.length * 100)
      : 0;
    return {
      subject: m.title,
      score: avgScore,
      fullMark: 100
    };
  }).slice(0, 5);

  const timeTrend = user?.timeTrend || 12;
  const quizTrend = user?.quizTrend || 4.2;

  // Calculate real stats
  const calculatedStudyMins = safeStudySessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const totalStudyTime = Math.round(calculatedStudyMins / 60) || user?.totalStudyTime || 0;

  // Calculate Average Percentage Score instead of raw points
  const avgScorePercentage = safeQuizResults.length > 0 
    ? Math.round(
        safeQuizResults.reduce((acc, curr) => {
          const p = curr.totalQuestions > 0 ? (curr.score / curr.totalQuestions) * 100 : 0;
          return acc + p;
        }, 0) / safeQuizResults.length
      ) 
    : 0;

  const totalPoints = safeQuizResults.reduce((acc, curr) => acc + (curr.score * 10), 0);

  // Global Ranking calculation based on streaks (allProfiles is already sorted by streak DESC from backend)
  const myRankIndex = safeAllProfiles.findIndex(p => p.id === user?.id);
  const globalRank = myRankIndex !== -1 ? myRankIndex + 1 : (user?.globalRank || 1);
  
  // Accuracy breakdown
  const totalCorrect = safeQuizResults.reduce((acc, curr) => acc + curr.score, 0);
  const totalQuestions = safeQuizResults.reduce((acc, curr) => acc + curr.totalQuestions, 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const performanceData = [
    { name: 'Correct', value: totalCorrect, color: '#10B981', lightColor: '#059669' },
    { name: 'Incorrect', value: totalQuestions - totalCorrect > 0 ? totalQuestions - totalCorrect : 0, color: '#EF4444', lightColor: '#DC2626' },
  ];

  // Growth data (last 7 quizzes) using percentage
  const growthData = safeQuizResults.slice(0, 7).reverse().map(r => ({
    month: new Date(r.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    score: r.totalQuestions > 0 ? Math.round((r.score / r.totalQuestions) * 100) : 0,
    avg: 75 // Platform average mock
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight mb-2">Performance Reports</h1>
          <p className="text-text-muted text-sm">Detailed analysis of your learning journey and growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-alt/50 hover:bg-surface-alt text-text-main text-xs font-bold rounded-xl border border-border transition-all">
            <Calendar size={16} />
            Last 6 Months
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 transition-all">
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Clock} 
          label="Time on Platform" 
          value={`${totalStudyTime}h`} 
          trend={`${timeTrend > 0 ? '+' : ''}${timeTrend}% from last week`} 
          trendUp={timeTrend >= 0}
          color={isLight ? "text-blue-600" : "text-blue-400"}
          bg={isLight ? "bg-blue-100" : "bg-blue-400/10"}
        />
        <StatCard 
          icon={TrendingUp} 
          label="Overall Growth" 
          value={`${accuracy}%`} 
          trend={`${quizTrend > 0 ? '+' : ''}${quizTrend}% this week`} 
          trendUp={quizTrend >= 0}
          color={isLight ? "text-emerald-600" : "text-emerald-400"}
          bg={isLight ? "bg-emerald-100" : "bg-emerald-400/10"}
        />
        <StatCard 
          icon={Target} 
          label="Average Score" 
          value={`${avgScorePercentage}%`} 
          trend={`${quizTrend > 0 ? '+' : ''}${quizTrend}% from last quiz`} 
          trendUp={quizTrend >= 0}
          color={isLight ? "text-orange-600" : "text-orange-400"}
          bg={isLight ? "bg-orange-100" : "bg-orange-400/10"}
        />
        <StatCard 
          icon={Award} 
          label="Global Ranking" 
          value={`#${globalRank.toLocaleString()}`} 
          trend="Top 5% of students" 
          trendUp={true}
          color={isLight ? "text-purple-600" : "text-purple-400"}
          bg={isLight ? "bg-purple-100" : "bg-purple-400/10"}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Growth Over Time Chart */}
        <div className="lg:col-span-8 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-text-main">Growth Over Time</h2>
              <p className="text-xs text-text-muted mt-1">Your score progression vs platform average</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Your Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-600" />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Avg. Student</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "#E2E8F0" : "#1E293B"} vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke={isLight ? "#64748B" : "#94A3B8"} 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke={isLight ? "#64748B" : "#94A3B8"} 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isLight ? '#FFFFFF' : '#0F172A', 
                      borderColor: isLight ? '#E2E8F0' : '#1E293B', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: isLight ? '#0F172A' : '#fff'
                    }}
                    itemStyle={{ color: isLight ? '#0F172A' : '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avg" 
                    stroke={isLight ? "#94A3B8" : "#475569"} 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-muted">
                <TrendingUp size={48} className="mb-4 opacity-20" />
                <p>Complete more quizzes to see your growth chart.</p>
              </div>
            )}
          </div>
        </div>

        {/* Wins vs Losses Chart */}
        <div className="lg:col-span-4 glass-card p-8 flex flex-col">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-text-main">Accuracy Breakdown</h2>
            <p className="text-xs text-text-muted mt-1">Correct vs Incorrect answers</p>
          </div>
          
          <div className="flex-grow flex items-center justify-center relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-text-main">{accuracy}%</span>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Accuracy</span>
            </div>
            <ResponsiveContainer width="100%" height={250} minWidth={0}>
              <PieChart>
                <Pie
                  data={performanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {performanceData.map((entry: any, index) => (
                    <Cell key={`cell-${index}`} fill={isLight ? entry.lightColor : entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isLight ? '#FFFFFF' : '#0F172A', 
                    borderColor: isLight ? '#E2E8F0' : '#1E293B', 
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isLight ? '#0F172A' : '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 mt-6">
            {performanceData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-text-muted">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-text-main">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subject Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-text-main">Subject Proficiency</h2>
              <p className="text-xs text-text-muted mt-1">Detailed performance across all enrolled subjects</p>
            </div>
            <button className="p-2.5 bg-surface/50 text-text-muted hover:text-text-main rounded-xl border border-border transition-all">
              <Filter size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {subjectData.map((subject) => (
              <div key={subject.subject} className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-text-main">{subject.subject}</span>
                  <span className="text-sm font-bold text-primary">{subject.score}%</span>
                </div>
                <div className="h-2 w-full bg-surface border border-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-violet-400 rounded-full transition-all duration-1000"
                    style={{ width: `${subject.score}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  <span>Progress</span>
                  <span>Excellent</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, trendUp, color, bg }: any) {
  return (
    <div className="glass-card p-6 group hover:border-primary/30 transition-all">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", bg, color)}>
        <Icon size={24} />
      </div>
      <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-text-main mb-2 tracking-tight">{value}</h3>
      <div className="flex items-center gap-1.5">
        {trendUp ? (
          <ArrowUpRight size={14} className="text-emerald-400" />
        ) : (
          <ArrowDownRight size={14} className="text-red-400" />
        )}
        <span className={cn("text-[10px] font-bold", trendUp ? "text-emerald-400" : "text-red-400")}>
          {trend}
        </span>
      </div>
    </div>
  );
}
