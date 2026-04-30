import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle2, RefreshCw, Calendar, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ProgressTracking() {
  const activityData = [
    { day: 'Mon', value: 40 },
    { day: 'Tue', value: 40 },
    { day: 'Wed', value: 50 },
    { day: 'Thu', value: 75 },
    { day: 'Fri', value: 30 },
    { day: 'Sat', value: 70 },
    { day: 'Sun', value: 55 },
  ];

  const progressStats = [
    { label: 'Completed', value: 8, icon: CheckCircle2, color: 'bg-purple-500', textColor: 'text-purple-500' },
    { label: 'In Progress', value: 12, icon: RefreshCw, color: 'bg-orange-500', textColor: 'text-orange-500' },
    { label: 'Upcoming', value: 14, icon: Calendar, color: 'bg-red-500', textColor: 'text-red-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      {/* Activity Card */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-text-main">Activity</h2>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-surface-alt rounded-lg text-sm font-medium text-text-muted border border-border hover:bg-surface-alt/80 transition-colors">
            This week <ChevronDown size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-secondary/20 text-secondary rounded-lg">
            <TrendingUp size={16} />
          </div>
          <span className="text-sm font-bold text-secondary">+3% <span className="text-text-muted font-medium">Increase than last week</span></span>
        </div>

        <div className="mb-10">
          <span className="text-4xl font-bold text-text-main tracking-tight">3,5h</span>
          <span className="ml-2 text-text-muted font-medium">Hours spent</span>
        </div>

        <div className="flex items-end justify-between h-48 gap-2">
          {activityData.map((item, idx) => (
            <div key={item.day} className="flex-grow flex flex-col items-center gap-3">
              <div className="w-full bg-surface-alt rounded-full h-40 relative overflow-hidden border border-border">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${item.value}%` }}
                  transition={{ delay: idx * 0.1, duration: 0.8, ease: "easeOut" }}
                  className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-primary to-secondary rounded-full shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                />
              </div>
              <span className="text-xs font-bold text-text-muted">{item.day}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Progress Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-text-main">Progress</h2>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-surface-alt rounded-lg text-sm font-medium text-text-muted border border-border hover:bg-surface-alt/80 transition-colors">
            This week <ChevronDown size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Panel: Circular Progress */}
          <div className="bg-surface-alt rounded-2xl p-6 flex flex-col items-center justify-center border border-border shadow-inner">
            <span className="text-sm font-bold text-text-muted mb-6 uppercase tracking-wider">Overall Progress</span>
            
            <div className="relative w-32 h-32 mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-border/30"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray="364.4"
                  initial={{ strokeDashoffset: 364.4 }}
                  animate={{ strokeDashoffset: 364.4 * (1 - 0.73) }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="text-secondary drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-text-main">73%</span>
              </div>
            </div>

            <div className="w-full flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-text-main">20%</p>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">Last week</p>
              </div>
              <div className="flex items-end gap-1 h-8">
                <div className="w-1.5 h-4 bg-secondary/20 rounded-full" />
                <div className="w-1.5 h-8 bg-secondary rounded-full shadow-[0_0_10px_rgba(167,139,250,0.3)]" />
                <div className="w-1.5 h-6 bg-secondary/60 rounded-full" />
              </div>
            </div>
          </div>

          {/* Right Panel: Stats List */}
          <div className="space-y-4">
            {progressStats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="bg-surface-alt p-4 rounded-2xl border border-border flex items-center gap-4 group hover:bg-surface-alt/80 hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg", stat.color)}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-main leading-none mb-1">{stat.value}</p>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
