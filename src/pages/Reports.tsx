import React, { useState } from 'react';
import { 
  Clock, 
  Target, 
  Award, 
  Flame, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  Compass, 
  BookOpen 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useReports } from '../hooks/useReports';
import GrowthChart from '../components/GrowthChart';
import SubjectProficiency from '../components/SubjectProficiency';
import DateRangeFilter from '../components/DateRangeFilter';

export default function Reports() {
  const { theme, t } = useAppContext();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const { summary, trends, subjects, leaderboard, loading } = useReports(period);

  // Safe checks & Defaults
  const totalStudyTimeMinutes = summary?.totalStudyTimeMinutes ?? 0;
  const averageQuizScore = summary?.averageQuizScore ?? 0;
  const globalRank = summary?.globalRank ?? 12;
  const totalLearners = summary?.totalLearners ?? 100;
  const studyStreak = summary?.studyStreak ?? 0;
  const studyTimeChange = summary?.weeklyChange?.studyTime ?? 12;
  const quizScoreChange = summary?.weeklyChange?.quizScore ?? 4.2;

  // Formatting hours/minutes spent
  const displayHours = Math.floor(totalStudyTimeMinutes / 60);
  const displayMinutes = totalStudyTimeMinutes % 60;
  const formattedStudyTime = displayHours > 0 
    ? `${displayHours}h ${displayMinutes > 0 ? `${displayMinutes}m` : ''}` 
    : `${displayMinutes}m`;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header with Date Range Filter - Highly Optimized for Mobile layout */}
      <div className="flex flex-col gap-4 pb-1 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">
            {t?.('performance_reports') || 'Analysis Reports'}
          </h1>
          <p className="text-xs text-text-muted mt-1">
            {t?.('reports_desc') || 'Your detailed study metrics and progress analytics.'}
          </p>
        </div>
        
        <div className="flex justify-start">
          <DateRangeFilter currentPeriod={period} onChange={setPeriod} />
        </div>
      </div>

      {loading ? (
        /* Mobile-Friendly loading skeleton screens */
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 bg-surface-alt rounded-2xl animate-pulse border border-border/40" />
            ))}
          </div>
          <div className="h-64 bg-surface-alt rounded-2xl animate-pulse border border-border/40" />
          <div className="h-48 bg-surface-alt rounded-2xl animate-pulse border border-border/40" />
        </div>
      ) : (
        <>
          {/* Metrics Grid - Optimized as a 2x2 grid on mobile screens */}
          <div className="grid grid-cols-2 gap-4">
            {/* Study Time Card */}
            <div className="bg-surface-alt p-4 rounded-2xl border border-border/40 shadow-md flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-xl bg-[#00D2FF]/10 flex items-center justify-center">
                  <Clock className="text-[#00D2FF]" size={18} />
                </div>
                <span className="text-[10px] text-[#00E5A0] font-bold flex items-center gap-0.5">
                  <ArrowUpRight size={10} />
                  {studyTimeChange}%
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted block">
                  {t?.('time_on_platform') || 'Study Time'}
                </span>
                <span className="text-lg font-bold text-text-main mt-1 block">
                  {totalStudyTimeMinutes > 0 ? formattedStudyTime : '0m'}
                </span>
              </div>
            </div>

            {/* Quiz Accuracy Card */}
            <div className="bg-surface-alt p-4 rounded-2xl border border-border/40 shadow-md flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="text-primary" size={18} />
                </div>
                <span className="text-[10px] text-[#00E5A0] font-bold flex items-center gap-0.5">
                  <ArrowUpRight size={10} />
                  {quizScoreChange}%
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted block">
                  {t?.('avg_quiz_score') || 'Quiz Score'}
                </span>
                <span className="text-lg font-bold text-text-main mt-1 block">
                  {averageQuizScore > 0 ? `${averageQuizScore}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Global Rank Card */}
            <div className="bg-surface-alt p-4 rounded-2xl border border-border/40 shadow-md flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-xl bg-[#F5B042]/10 flex items-center justify-center">
                  <Award className="text-[#F5B042]" size={18} />
                </div>
                <span className="text-[9px] text-[#F5B042] font-semibold bg-[#F5B042]/10 px-1.5 py-0.5 rounded-md">
                  TOP 5%
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted block">
                  {t?.('global_rank') || 'Global Rank'}
                </span>
                <span className="text-lg font-bold text-text-main mt-1 block">
                  #{globalRank}
                </span>
              </div>
            </div>

            {/* Streak Card */}
            <div className="bg-surface-alt p-4 rounded-2xl border border-border/40 shadow-md flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Flame className="text-red-500 animate-pulse" size={18} />
                </div>
                <span className="text-[9px] text-red-400 font-semibold bg-red-400/10 px-1.5 py-0.5 rounded-md">
                  ACTIVE
                </span>
              </div>
              <div className="mt-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted block">
                  {t?.('streak') || 'Streak'}
                </span>
                <span className="text-lg font-bold text-text-main mt-1 block">
                  {studyStreak} Day{studyStreak !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Growth Over Time Chart Block */}
          <div className="bg-surface-alt p-5 rounded-2xl border border-border/40 shadow-md">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <TrendingUp size={16} className="text-[#00D2FF]" />
                {t?.('growth_over_time') || 'Growth Over Time'}
              </h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                {t?.('growth_over_time_desc') || 'Your quiz scores and total study minutes compared.'}
              </p>
            </div>
            
            <div className="pt-2">
              <GrowthChart trends={trends} />
            </div>
          </div>

          {/* Subject Proficiency and Leaderboard Block - Stacked vertically for mobile */}
          <div className="grid grid-cols-1 gap-6">
            
            {/* Subject Proficiency */}
            <div className="bg-surface-alt p-5 rounded-2xl border border-border/40 shadow-md">
              <div className="mb-5">
                <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  {t?.('subject_proficiency') || 'Subject Proficiency'}
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {t?.('subject_proficiency_desc') || 'Your proficiency score categorized across learning topics.'}
                </p>
              </div>

              <SubjectProficiency subjects={subjects} />
            </div>

            {/* Mini Leaderboard */}
            <div className="bg-surface-alt p-5 rounded-2xl border border-border/40 shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                    <Users size={16} className="text-[#F5B042]" />
                    {t?.('leaderboard') || 'Global Leaderboard'}
                  </h3>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Top learners this week. Join your peers!
                  </p>
                </div>
              </div>

              {!leaderboard || !leaderboard.leaderboard || leaderboard.leaderboard.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-xs font-semibold text-text-muted">Invite friends to compete</span>
                  <p className="text-[10px] text-text-muted mt-1 max-w-[220px]">
                    Leaderboard is currently quiet. Encourage friends to sign up to view real rankings!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Leaderboard Competitors */}
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {leaderboard.leaderboard.map((item: any) => {
                      const isCurrentUser = item.name === leaderboard.currentUser?.name;
                      return (
                        <div 
                          key={item.rank} 
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                            isCurrentUser 
                              ? 'bg-surface-alt border-[#00D2FF]/40 shadow-sm' 
                              : 'bg-surface/60 border-border/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Rank circle */}
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              item.rank === 1 ? 'bg-[#F5B042] text-[#0B0E14]' :
                              item.rank === 2 ? 'bg-gray-300 text-[#0B0E14]' :
                              item.rank === 3 ? 'bg-[#CD7F32] text-[#0B0E14]' :
                              'text-text-muted bg-white/5'
                            }`}>
                              {item.rank}
                            </span>
                            
                            {/* Avatar or Placeholder */}
                            {item.avatar ? (
                              <img 
                                src={item.avatar} 
                                alt={item.name} 
                                className="w-8 h-8 rounded-full object-cover border border-white/10" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-border/40">
                                <span className="text-[11px] font-bold text-primary">
                                  {item.name.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                            )}

                            <div>
                              <span className="text-xs font-bold text-text-main block">
                                {item.name}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[9px] text-[#00D2FF] font-semibold uppercase tracking-wider block">
                                  You
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="text-xs font-extrabold text-[#00E5A0]">
                            {item.points.toLocaleString()} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Current User Floating Footer / Standings (if rank is outside top 5) */}
                  {leaderboard.currentUser && leaderboard.currentUser.rank > leaderboard.leaderboard.length && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">
                          #{leaderboard.currentUser.rank}
                        </span>
                        <span className="text-xs font-bold text-text-main">
                          {leaderboard.currentUser.name} (You)
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-primary">
                        {leaderboard.currentUser.points.toLocaleString()} pts
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
