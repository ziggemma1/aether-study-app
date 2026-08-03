import React, { useState } from 'react';
import {
  Clock,
  Target,
  Award,
  Flame,
  TrendingUp,
  Users,
  BookOpen
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useReports } from '../hooks/useReports';
import GrowthChart from '../components/GrowthChart';
import SubjectProficiency from '../components/SubjectProficiency';
import DateRangeFilter from '../components/DateRangeFilter';
import { MetricCard } from '../components/ui/MetricCard';

export default function Reports() {
  const { theme, t, user } = useAppContext();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const { summary, trends, subjects, leaderboard, loading } = useReports(period);

  // Zero is a real reading here; the previous `?? 12` / `?? 4.2` fallbacks
  // showed a brand-new account a double-digit weekly gain it had not earned.
  const totalStudyTimeMinutes = summary?.totalStudyTimeMinutes ?? 0;
  const averageQuizScore = summary?.averageQuizScore ?? 0;
  const studyStreak = summary?.studyStreak ?? 0;

  // null = not on the leaderboard at all, which is different from rank 0.
  const globalRank: number | null = summary?.globalRank ?? null;
  const totalLearners: number = summary?.totalLearners ?? 0;

  // A trend only earns a badge once it has actually moved. `direction` follows
  // the sign, so a decline no longer renders as a green arrow pointing up.
  const toTrend = (raw: unknown) => {
    const value = typeof raw === 'number' ? raw : 0;
    if (value === 0) return undefined;
    return {
      value: Math.abs(Math.round(value * 10) / 10),
      direction: value > 0 ? ('up' as const) : ('down' as const),
    };
  };

  const studyTimeTrend = toTrend(summary?.weeklyChange?.studyTime);
  const quizScoreTrend = toTrend(summary?.weeklyChange?.quizScore);

  // Formatting hours/minutes spent
  const displayHours = Math.floor(totalStudyTimeMinutes / 60);
  const displayMinutes = totalStudyTimeMinutes % 60;
  const formattedStudyTime = displayHours > 0
    ? `${displayHours}h ${displayMinutes > 0 ? `${displayMinutes}m` : ''}`
    : `${displayMinutes}m`;

  // "TOP 5%" was printed on every account regardless of standing. Compute it,
  // and only claim a percentile when the cohort is big enough for one to mean
  // anything — below that, the raw position is the more honest statement.
  const percentile = globalRank && totalLearners >= 20
    ? Math.max(1, Math.ceil((globalRank / totalLearners) * 100))
    : null;

  const rankNote = globalRank === null
    ? 'Opt in on the leaderboard to be ranked'
    : percentile !== null
      ? `Top ${percentile}% of ${totalLearners.toLocaleString()} learners`
      : `Of ${totalLearners.toLocaleString()} ranked learner${totalLearners === 1 ? '' : 's'}`;

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
          {/* Metrics Grid — 2x2 on mobile. These were four bespoke cards in four
              competing accents (cyan / violet / amber / red) with two badges
              that were hardcoded rather than measured. They are now the same
              MetricCard the Dashboard uses, so the two analytics screens read
              as one system and colour is spent only on the trend. */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label={t?.('time_on_platform') || 'Study Time'}
              value={formattedStudyTime}
              trend={studyTimeTrend}
              icon={<Clock size={16} />}
              tooltip="Total focused study time recorded in the selected period."
            />

            <MetricCard
              label={t?.('avg_quiz_score') || 'Quiz Score'}
              value={`${averageQuizScore}%`}
              trend={quizScoreTrend}
              icon={<Target size={16} />}
              tooltip="Average correctness across every quiz you have completed."
            />

            <MetricCard
              label={t?.('global_rank') || 'Global Rank'}
              value={globalRank === null ? 'Unranked' : `#${globalRank}`}
              note={rankNote}
              icon={<Award size={16} />}
              tooltip="Your position among learners who opted into the leaderboard."
            />

            <MetricCard
              label={t?.('streak') || 'Streak'}
              value={`${studyStreak} Day${studyStreak !== 1 ? 's' : ''}`}
              note={studyStreak > 0 ? 'Keep it alive — study today' : 'Study today to start one'}
              icon={<Flame size={16} />}
              tooltip="Consecutive days with at least one study session."
            />
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
                  <p className="text-[11px] text-text-muted mt-1 max-w-[220px]">
                    Leaderboard is currently quiet. Encourage friends to sign up to view real rankings!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Leaderboard Competitors */}
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {leaderboard.leaderboard.map((item: any) => {
                      // The endpoint returns `currentUserRank`, not a
                      // `currentUser` object — matching on a name that was
                      // always undefined meant nobody was ever marked "You".
                      const isCurrentUser = item.rank === leaderboard.currentUserRank;
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
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
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
                                <span className="text-[11px] text-[#00D2FF] font-semibold uppercase tracking-wider block">
                                  You
                                </span>
                              )}
                            </div>
                          </div>

                          {/* `points` is an object ({ total, studyTime,
                              quizzes, streak }) — calling toLocaleString on it
                              printed a literal "[object Object] pts" on every
                              row. LeaderboardCard already reads `.total`. */}
                          <span className="text-xs font-extrabold text-[#00E5A0]">
                            {(item.points?.total ?? 0).toLocaleString()} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Your standing, when you place outside the top five. Keyed
                      off `currentUserRank`; the old `currentUser` object is not
                      part of this response, so this never used to render. */}
                  {leaderboard.currentUserRank > leaderboard.leaderboard.length && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">
                          #{leaderboard.currentUserRank}
                        </span>
                        <span className="text-xs font-bold text-text-main">
                          {user?.name ? `${user.name} (You)` : 'You'}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-primary">
                        of {leaderboard.totalUsers?.toLocaleString()} learners
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
