import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingDown, 
  TrendingUp, 
  ChevronDown, 
  Check, 
  Users,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  ComposedChart,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';

// --- Mock Data ---
const weeklyTimeData = [
  { day: 'Mon', hours: 1.5 },
  { day: 'Tue', hours: 2.3 },
  { day: 'Wed', hours: 1.8 },
  { day: 'Thu', hours: 3.5 },
  { day: 'Fri', hours: 2.0 },
  { day: 'Sat', hours: 0.8 },
  { day: 'Sun', hours: 0.5 },
];

const enrollmentData = [
  { month: 'Jan', enrollments: 800, completion: 75 },
  { month: 'Feb', enrollments: 950, completion: 78 },
  { month: 'Mar', enrollments: 1100, completion: 82 },
  { month: 'Apr', enrollments: 1050, completion: 80 },
  { month: 'May', enrollments: 1200, completion: 85 },
  { month: 'Jun', enrollments: 1150, completion: 83 },
  { month: 'Jul', enrollments: 1350, completion: 88 },
  { month: 'Aug', enrollments: 1250, completion: 86 },
  { month: 'Sep', enrollments: 1400, completion: 90 },
  { month: 'Oct', enrollments: 1300, completion: 87 },
  { month: 'Nov', enrollments: 1500, completion: 92 },
  { month: 'Dec', enrollments: 1450, completion: 91 },
];

const topLearners = [
  { name: 'Brooklyn Simmons', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Brooklyn' },
  { name: 'Annette Black', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Annette' },
  { name: 'Guy Hawkins', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guy' },
  { name: 'Theresa Webb', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Theresa' },
  { name: 'Robert Fox', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert' },
  { name: 'Jane Cooper', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' },
];

// --- Styles ---
const stripeStyle = {
  backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)',
  backgroundSize: '10px 10px'
};

// --- Sub-components ---

export function QuizScoreCard() {
  return (
    <motion.div 
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-5 flex flex-col w-full aspect-square max-w-[210px] mx-auto group cursor-pointer border-border/40 shadow-sm"
    >
      <div className="flex justify-between items-start mb-1">
        <p className="text-[11px] font-medium text-text-muted">Avg Quiz Score</p>
      </div>
      
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-2xl font-semibold text-text-main tracking-tight">82%</span>
        <span className="flex items-center text-[9px] font-medium text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">
          -10% <ChevronDown size={8} className="ml-0.5" />
        </span>
      </div>

      <div className="border-t border-dashed border-border/40 my-3" />

      <div className="space-y-4 mt-auto">
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-medium text-text-muted">
            <span>Highest Score</span>
            <span className="text-text-main">92.50%</span>
          </div>
          <div className="h-3 bg-surface-alt/30 rounded-md overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "92.5%" }}
              className="h-full bg-primary rounded-md" 
              style={stripeStyle}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-medium text-text-muted">
            <span>Lowest Score</span>
            <span className="text-text-main">64.25%</span>
          </div>
          <div className="h-3 bg-surface-alt/30 rounded-md overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "64.25%" }}
              className="h-full bg-orange-500 rounded-md" 
              style={stripeStyle}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TimeSpentCard() {
  return (
    <motion.div 
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-5 flex flex-col w-full aspect-square max-w-[210px] mx-auto group cursor-pointer border-border/40 shadow-sm"
    >
      <div className="flex justify-between items-start mb-1">
        <p className="text-[11px] font-medium text-text-muted">Total Time Spent</p>
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-2xl font-semibold text-text-main tracking-tight">12 Hours</span>
        <span className="flex items-center text-[9px] font-medium text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">
          -12.00% <ChevronDown size={8} className="ml-0.5" />
        </span>
      </div>

      <div className="border-t border-dashed border-border/40 my-3" />

      <div className="flex justify-between text-[10px] font-medium text-text-muted mb-2">
        <span>This Week</span>
        <span className="text-text-main">9.5H</span>
      </div>

      <div className="h-20 w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyTimeData}>
            <Bar dataKey="hours" radius={[3, 3, 0, 0]}>
              {weeklyTimeData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 3 ? 'var(--primary)' : 'var(--border)'} 
                  fillOpacity={index === 3 ? 1 : 0.2}
                  style={index === 3 ? stripeStyle : {}}
                  className="transition-all duration-300"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export function StreakCard() {
  const days = [
    { label: '01', active: true }, { label: '02', active: true }, { label: '03', active: true }, { label: '04', active: true }, { label: '05', active: true },
    { label: '06', active: false }, { label: '07', active: false }, { label: '08', active: false }, { label: '09', active: false }, { label: '10', active: false },
    { label: '11', active: false }, { label: '12', active: false }, { label: '13', active: false }, { label: '14', active: false }, { label: '15', active: false },
  ];

  return (
    <motion.div 
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-5 flex flex-col w-full aspect-square max-w-[210px] mx-auto group cursor-pointer border-border/40 shadow-sm"
    >
      <div className="flex justify-between items-start mb-1">
        <p className="text-[11px] font-medium text-text-muted">Weekly Streak</p>
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-2xl font-semibold text-text-main tracking-tight">5 Days</span>
      </div>

      <div className="border-t border-dashed border-border/40 my-3" />

      <div className="flex justify-between text-[10px] font-medium text-text-muted mb-4">
        <span>Longest Streak</span>
        <span className="text-text-main">15 days</span>
      </div>

      <div className="overflow-y-auto no-scrollbar pr-1 -mr-1 flex-grow">
        <div className="grid grid-cols-5 gap-y-3 gap-x-1.5">
          {days.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-semibold transition-all shadow-sm",
                day.active ? "bg-primary text-white" : "bg-surface-alt/30 text-text-muted border border-border/20"
              )}>
                {day.active ? <Check size={10} /> : day.label}
              </div>
              <span className="text-[8px] text-text-muted font-medium">{day.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function RankingCard() {
  return (
    <motion.div 
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-5 flex flex-col w-full aspect-square max-w-[210px] mx-auto group cursor-pointer border-border/40 shadow-sm"
    >
      <div className="flex justify-between items-start mb-1">
        <p className="text-[11px] font-medium text-text-muted">Global Ranking</p>
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-semibold text-text-main tracking-tight">#15</span>
        <span className="text-[10px] text-text-muted">of 23K</span>
      </div>

      <div className="border-t border-dashed border-border/40 my-3" />

      <p className="text-[10px] font-medium text-text-muted mb-3">Top local rank</p>

      <div className="overflow-y-auto no-scrollbar pr-1 -mr-1 flex-grow">
        <div className="space-y-2.5">
          {topLearners.map((learner, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="relative">
                <img src={learner.avatar} alt={learner.name} className="w-6 h-6 rounded-full border border-border/20" />
                {i === 0 && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full flex items-center justify-center text-[5px] text-white border border-white">
                    ★
                  </div>
                )}
              </div>
              <span className="text-[11px] font-medium text-text-main truncate">{learner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function EnrollmentChart() {
  return (
    <div className="glass-card p-8 flex flex-col border-border/30 bg-white/50 dark:bg-surface/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-text-main mb-1">Monthly Course Enrollments & Completion Rates</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold text-text-main">1,250.00</span>
            <span className="flex items-center text-[10px] font-medium text-orange-500 bg-orange-500/5 px-2 py-1 rounded-lg border border-orange-500/10">
              13.4% <TrendingUp size={10} className="ml-0.5" />
            </span>
          </div>
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-widest mt-1">Avg per month</p>
        </div>

        <div className="flex items-center gap-2 bg-surface-alt/30 p-1 rounded-xl border border-border/20">
          {['1 Year', '6 Months', '3 Months', '1 Month'].map((period, i) => (
            <button 
              key={i} 
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all",
                i === 0 ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-main"
              )}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[10px] font-medium text-text-muted uppercase tracking-tighter">Completion Rate (%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-[10px] font-medium text-text-muted uppercase tracking-tighter">Enrollments</span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={enrollmentData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.1} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }} 
              dy={10}
            />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: 'var(--border)', 
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 500,
                color: 'var(--text-main)',
                border: '1px solid var(--border)'
              }}
              itemStyle={{ color: 'var(--text-main)' }}
            />
            <Bar dataKey="enrollments" fill="var(--border)" fillOpacity={0.1} radius={[4, 4, 0, 0]} barSize={40} />
            <Line 
              type="monotone" 
              dataKey="completion" 
              stroke="var(--primary)" 
              strokeWidth={2.5} 
              dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4, stroke: 'var(--surface)' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
