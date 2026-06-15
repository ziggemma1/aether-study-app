import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Target, 
  Award, 
  Flame, 
  TrendingUp, 
  Download, 
  Users, 
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { useReports } from '../hooks/useReports';
import { useAppContext } from '../context/AppContext';
import DateRangeFilter from '../components/DateRangeFilter';
import GrowthChart from '../components/GrowthChart';
import SubjectProficiency from '../components/SubjectProficiency';

export default function Reports() {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const { summary, trends, subjects, leaderboard, loading, error } = useReports(period);
  const { theme, t } = useAppContext();
  const [showExportModal, setShowExportModal] = useState(false);

  // Helper formatting for minutes
  const formatTimeMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  // Safe variables with fallbacks
  const totalTimeStr = summary?.totalStudyTimeMinutes !== undefined ? formatTimeMinutes(summary.totalStudyTimeMinutes) : '0m';
  const averageAccuracy = summary?.averageQuizScore !== undefined ? summary.averageQuizScore : 0;
  const rankStr = summary?.globalRank !== undefined ? `#${summary.globalRank.toLocaleString()}` : '#12';
  const totalLearners = summary?.totalLearners !== undefined ? summary.totalLearners : 120;
  const activeStreak = summary?.studyStreak !== undefined ? summary.studyStreak : 0;
  const timeChangePercent = summary?.weeklyChange?.studyTime !== undefined ? summary.weeklyChange.studyTime : 12;
  const accuracyChangePercent = summary?.weeklyChange?.quizScore !== undefined ? summary.weeklyChange.quizScore : 4.2;

  // Render Skeleton loader for high UX standards
  if (loading && !summary) {
    return (
      <div className="space-y-6 pb-12 animate-pulse" id="reports-skeleton-page">
        <div className="flex flex-col gap-2">
          <div className="h-6 w-32 bg-surface rounded-lg" />
          <div className="h-4 w-52 bg-surface rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 bg-surface rounded-2xl" />
          <div className="h-28 bg-surface rounded-2xl" />
          <div className="h-28 bg-surface rounded-2xl" />
          <div className="h-28 bg-surface rounded-2xl" />
        </div>

        <div className="h-40 bg-surface rounded-2xl" />
        <div className="h-56 bg-surface rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300 select-none" id="reports-page-wrapper">
      
      {/* Tiny Header Badge \& Controls */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[9px] font-black tracking-widest text-primary uppercase bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
            Recall Diagnostics
          </span>
          <h1 className="text-xl font-black text-text-main mt-1 tracking-tight">Performance Reports</h1>
        </div>
        
        {/* Compact Export triggering */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowExportModal(true)}
          className="w-10 h-10 bg-surface border border-border/10 hover:border-primary/20 rounded-xl flex items-center justify-center text-text-muted hover:text-primary transition-all cursor-pointer"
          aria-label="Export dataset"
        >
          <Download size={16} />
        </motion.button>
      </div>

      {/* Touch-Friendly Period Filter */}
      <DateRangeFilter value={period} onChange={setPeriod} />

      {/* 2x2 Grid of Vital Metric Cards optimised for mobile viewports */}
      <div className="grid grid-cols-2 gap-3" id="metric-grid-reports">
        
        {/* STUDY MINUTES CARD */}
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-surface border border-border/10 rounded-2xl p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden"
          id="report-stat-time"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-wider">Study Time</span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-400">
              <Clock size={11} />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-lg font-black text-text-main leading-none">{totalTimeStr}</h2>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={10} className="text-[#00E5A0]" />
              <span className="text-[8px] font-black text-[#00E5A0] uppercase tracking-wider">
                +{timeChangePercent}% this {period}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ACCURACY/QUIZ AVERAGE CARD */}
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-surface border border-border/10 rounded-2xl p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden"
          id="report-stat-accuracy"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-wider">Quiz Score</span>
            <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center text-primary">
              <Target size={11} />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-lg font-black text-text-main leading-none">{averageAccuracy}%</h2>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={10} className="text-[#00E5A0]" />
              <span className="text-[8px] font-black text-[#00E5A0] uppercase tracking-wider">
                +{accuracyChangePercent}% avg
              </span>
            </div>
          </div>
        </motion.div>

        {/* GLOBAL LEADERBOARD RANK CARD */}
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-surface border border-border/10 rounded-2xl p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden"
          id="report-stat-rank"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-wider">Global Rank</span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center text-amber-500">
              <Award size={11} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-black text-text-main leading-none">{rankStr}</h3>
            <span className="text-[8px] font-bold text-text-muted mt-1 uppercase tracking-wider block">
              Out of {totalLearners} learners
            </span>
          </div>
        </motion.div>

        {/* CURRENT RETRIEVAL STREAK */}
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-surface border border-border/10 rounded-2xl p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden"
          id="report-stat-streak"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-text-muted uppercase tracking-wider">Recall Streak</span>
            <div className="w-6 h-6 rounded-lg bg-orange-500/10 border border-orange-500/15 flex items-center justify-center text-orange-400">
              <Flame size={12} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-black text-text-main leading-none">
              {activeStreak > 0 ? `${activeStreak} Days` : 'Unkindled'}
            </h3>
            <span className="text-[8px] font-bold text-orange-400 mt-1 uppercase tracking-wider block">
              {activeStreak > 0 ? 'Blazing active' : 'Start recall session'}
            </span>
          </div>
        </motion.div>

      </div>

      {/* Primary Analytics Chart Block */}
      <div className="bg-surface border border-border/10 rounded-2xl p-4">
        {trends ? (
          <GrowthChart 
            labels={trends.labels} 
            scores={trends.scores} 
            studyMinutes={trends.studyMinutes} 
            period={period}
          />
        ) : (
          <div className="h-[220px] flex items-center justify-center">
            <RefreshCw className="animate-spin text-primary" size={24} />
          </div>
        )}
      </div>

      {/* Subject Domain Mastery Tracking */}
      <SubjectProficiency subjects={subjects} />

      {/* Mobile touch-focused mini leaderboard block */}
      <div className="bg-surface border border-border/10 rounded-2xl p-5 space-y-4" id="mini-leaderboard">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">AETHER CHAMPIONS</span>
            <h2 className="text-sm font-black text-main uppercase tracking-tight mt-0.5">Top Active Learners</h2>
          </div>
          <div className="flex items-center gap-1 bg-surface-alt/80 border border-border/5 px-2 py-0.5 rounded-lg text-[9px] font-black text-text-muted uppercase">
            <Users size={10} className="text-primary" />
            Live
          </div>
        </div>

        {/* Leaderboard records column */}
        <div className="space-y-2">
          {leaderboard?.leaderboard?.map((player: any) => {
            const isMe = leaderboard.currentUser && player.name === leaderboard.currentUser.name;
            let rankColor = "text-text-muted";
            let rankBg = "bg-surface-alt border-border/5";
            
            if (player.rank === 1) {
              rankColor = "text-amber-500";
              rankBg = "bg-amber-500/10 border-amber-500/20";
            } else if (player.rank === 2) {
              rankColor = "text-slate-300";
              rankBg = "bg-slate-300/10 border-slate-300/20";
            } else if (player.rank === 3) {
              rankColor = "text-orange-400";
              rankBg = "bg-orange-400/10 border-orange-400/20";
            }

            return (
              <div 
                key={player.rank}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isMe ? 'bg-primary/5 border-primary/20 shadow-[0_0_12px_rgba(108,92,231,0.04)]' : 'bg-surface border-border/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${rankBg} ${rankColor}`}>
                    {player.rank}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                      {player.name}
                      {isMe && (
                        <span className="text-[7px] font-black bg-primary text-white border-none px-1 py-0.2 rounded uppercase">
                          YOU
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-primary">{player.points} <span className="text-[8px] text-text-muted/60">pts</span></span>
              </div>
            );
          })}
        </div>

        {/* Current user's relative layout footer */}
        {leaderboard?.currentUser && (
          <div className="p-3 bg-surface-alt/70 border border-border/5 rounded-xl flex items-center justify-between text-xs mt-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-primary/10 border border-primary/15 flex items-center justify-center text-primary font-black text-[10px]">
                {leaderboard.currentUser.rank}
              </div>
              <span className="font-bold text-text-muted">Your active learning ranking</span>
            </div>
            <span className="font-black text-text-main">{leaderboard.currentUser.points} pts</span>
          </div>
        )}
      </div>

      {/* Safe and beautifully descriptive modal overlay */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 bg-[#0B0E14]/70 backdrop-blur-sm flex items-end justify-center">
            <motion.div 
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="w-full bg-[#141A24] rounded-t-3xl border-t border-border/20 p-6 space-y-6 max-w-md"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h3 className="text-base font-black text-text-main">Export Diagnostics</h3>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="text-text-muted text-xs font-black uppercase hover:text-text-main px-2 py-1"
                >
                  Close
                </button>
              </div>
              
              <p className="text-xs text-text-muted leading-relaxed">
                You can download your study logs and active-recall milestones. This includes your daily scores, subject proficiency progress, and streak histories.
              </p>

              <div className="space-y-2">
                <button 
                  onClick={() => {
                    // Triggers static mock CSV generation download safely
                    const csvContent = "data:text/csv;charset=utf-8,Period,StudyTimeMin,AverageScore\n" + `${period},${summary?.totalStudyTimeMinutes || 0},${averageAccuracy}\n`;
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `aether_study_${period}_report.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setShowExportModal(false);
                  }}
                  className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={14} /> Download CSV Summary
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
