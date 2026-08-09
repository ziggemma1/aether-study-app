import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { formatTime, getGreeting, formatDate, getRandomQuote, cn } from '../lib/utils';
import {
  ArrowRight, Clock, Compass, BookOpen, Sparkles, AlertCircle,
  RotateCcw, Upload, CalendarDays, Play, ChevronRight, Inbox
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { EmptyState } from '../components/ui/EmptyState';
import { MetricCard } from '../components/ui/MetricCard';
import { DataChart } from '../components/ui/DataChart';
import { RecentItem } from '../components/ui/RecentItem';
import { UserAvatar } from '../components/ui/UserAvatar';
import { StudyingNowRail } from '../components/dashboard/StudyingNowRail';
import { StreakHero } from '../components/dashboard/StreakHero';

/**
 * Dashboard.
 *
 * Two full-screen decorative canvases used to render behind this page:
 * `LearningNebula` (25–55 drifting, pulsing particles repainting at 20–35 fps)
 * and `StudyConstellation`. They are the "floating bubbles" — gone, along with
 * the animation loop they ran on every dashboard view.
 *
 * The page also carried three things that belong on other pages and were
 * duplicated wholesale here: a full month calendar grid (~900px tall, the whole
 * of /calendar), a "Discussion Forum" message list (/messages), and a "Mobile
 * Actions Pad" of links the sidebar and bottom nav already provide. It opened
 * with two stacked headers — a greeting block and a PageHeader immediately
 * under it.
 */
export default function Dashboard() {
  const { studySessions, t } = useAppContext();
  const { user, stats, recentMaterials, loading, error, refetch } = useDashboardData();
  const navigate = useNavigate();
  const quote = React.useMemo(() => getRandomQuote(), []);

  const sessions = React.useMemo(
    () => (Array.isArray(studySessions) ? studySessions.filter((s: any) => s?.startTime) : []),
    [studySessions]
  );

  const todayMinutes = React.useMemo(() => {
    const today = new Date().toDateString();
    return sessions
      .filter((s: any) => new Date(s.startTime).toDateString() === today)
      .reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0);
  }, [sessions]);

  const recentSessions = React.useMemo(
    () => [...sessions]
      .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 4),
    [sessions]
  );

  /** Scheduled sessions still ahead of now — what the month grid was for. */
  const upcoming = React.useMemo(() => {
    const now = Date.now();
    return [...sessions]
      .filter((s: any) => new Date(s.startTime).getTime() > now)
      .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 4);
  }, [sessions]);

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const todayIndex = new Date().getDay();
  const chartData = weekDays.map((day, idx) => {
    const statsDay = stats?.weeklyData?.find((d) => d.day === day);
    const hours = statsDay ? statsDay.minutes / 60 : 0;
    return { label: day, value: hours > 0 ? parseFloat(hours.toFixed(1)) : 0, active: todayIndex === idx };
  });
  const weekHasData = chartData.some((d) => d.value > 0);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full min-w-0 space-y-5 pb-24">
        <div className="h-24 rounded-[var(--radius-card)] bg-[var(--skeleton)] animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-[var(--skeleton)] animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 h-64 rounded-[var(--radius-card)] bg-[var(--skeleton)] animate-pulse" />
          <div className="lg:col-span-4 h-64 rounded-[var(--radius-card)] bg-[var(--skeleton)] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <span className="w-12 h-12 rounded-2xl bg-brand-pink/10 text-brand-pink flex items-center justify-center">
          <AlertCircle size={22} />
        </span>
        <h2 className="font-heading text-base font-bold text-text-main mt-3">We couldn't load your dashboard</h2>
        <p className="text-sm text-text-muted mt-1">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors cursor-pointer min-h-[44px]"
        >
          <RotateCcw size={15} /> Try again
        </button>
      </div>
    );
  }

  const userName = user?.name || 'Student';
  const streak = user?.streak || 0;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full min-w-0 pb-24 space-y-5">
      {/* ---- One header, not two ---- */}
      <section className="rounded-[var(--radius-card)] bg-surface border border-border shadow-[var(--shadow-card)] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <UserAvatar name={userName} avatarUrl={user?.image || undefined} streakCount={streak} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-muted">{getGreeting()}</p>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-main tracking-tight truncate">
            {userName}
          </h1>
          <p className="text-xs text-text-muted mt-1 italic truncate">"{quote}"</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors min-h-[44px]"
          >
            <Play size={15} className="fill-current" /> Start studying
          </Link>
          <Link
            to="/upload"
            aria-label="Upload a material"
            title="Upload a material"
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-surface-alt border border-border text-text-main hover:border-primary/30 transition-colors"
          >
            <Upload size={17} />
          </Link>
        </div>
      </section>

      {/* ---- Streak hero ----
          The streak is the retention mechanic, so it no longer shares a row
          with three neutral figures. It gets its own panel, its own colour,
          and a flame that grows with tier. */}
      <StreakHero
        streak={streak}
        longestStreak={user?.longestStreak || 0}
        todayMinutes={todayMinutes}
      />

      {/* ---- Supporting metrics ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          label="Study time"
          value={formatTime(user?.totalStudyTime || 0)}
          note={user?.totalStudyTime ? 'Across all sessions' : 'No sessions logged yet'}
          icon={<Clock size={16} />}
          onClick={() => navigate('/reports')}
        />
        <MetricCard
          label="Average quiz score"
          value={user?.quizCount ? `${Math.round(user.averageQuizScore || 0)}%` : '—'}
          note={user?.quizCount ? `Across ${user.quizCount} ${user.quizCount === 1 ? 'quiz' : 'quizzes'}` : 'No quizzes taken yet'}
          icon={<Sparkles size={16} />}
          onClick={() => navigate('/reports')}
        />
        {/* `|| 1` and `|| 124` used to show an unranked account a confident
            "#1 of 124" that the leaderboard then contradicted. */}
        <MetricCard
          label="Leaderboard rank"
          value={user?.rank ? `#${user.rank}` : 'Unranked'}
          note={user?.rank ? `Of ${(user?.totalLearners ?? 0).toLocaleString()} learners` : 'Join the leaderboard to rank'}
          icon={<Compass size={16} />}
          onClick={() => navigate('/leaderboard')}
        />
      </div>

      {/* ---- This week + today ---- */}
      {/* items-start, not items-stretch: the two cards hold unrelated
          content of different length, and stretching the chart to match
          the panel beside it left ~200px of empty card under the bars. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 flex">
          {weekHasData ? (
            <DataChart data={chartData} title="This week" subtitle="Hours studied each day" />
          ) : (
            /* The chart used to render seven empty grey boxes captioned
               "Calculated active review metrics" when there was nothing to
               plot — an empty state pretending to be a chart. */
            <div className="w-full rounded-[var(--radius-card)] bg-surface border border-border shadow-[var(--shadow-card)] p-6 flex flex-col items-center justify-center text-center min-h-[240px]">
              <span className="w-11 h-11 rounded-xl bg-pastel-sky text-pastel-sky-ink flex items-center justify-center">
                <CalendarDays size={20} />
              </span>
              <p className="text-sm font-semibold text-text-main mt-3">Nothing logged this week</p>
              <p className="text-xs text-text-muted mt-1 max-w-xs">
                Finish a focus session and your week will start filling in here.
              </p>
              <Link
                to="/rooms"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors min-h-[44px]"
              >
                <Play size={14} className="fill-current" /> Start a session
              </Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <section className="h-full rounded-[var(--radius-card)] bg-surface border border-border shadow-[var(--shadow-card)] p-5 flex flex-col">
            <h2 className="font-heading text-base font-bold text-text-main tracking-tight mb-1">Today</h2>
            <p className="text-3xl font-bold text-text-main tabular-nums mt-2">{formatTime(todayMinutes)}</p>
            <p className="text-xs text-text-muted mt-1">
              {todayMinutes > 0 ? 'studied so far today' : 'nothing logged yet today'}
            </p>

            <div className="mt-5 pt-4 border-t border-border flex-1">
              <h3 className="text-xs font-semibold text-text-muted mb-2">Coming up</h3>
              {/* Replaces a full month grid that duplicated /calendar and stood
                  ~900px tall in the middle of the page. */}
              {upcoming.length === 0 ? (
                <p className="text-xs text-text-muted leading-relaxed">
                  Nothing scheduled.{' '}
                  <Link to="/calendar" className="text-primary font-medium hover:underline">Plan a session</Link>.
                </p>
              ) : (
                <ul className="space-y-2">
                  {upcoming.map((s: any, i: number) => (
                    <li key={s.id || i} className="flex items-start gap-2 text-xs">
                      <CalendarDays size={13} className="text-text-muted shrink-0 mt-0.5" />
                      <span className="min-w-0">
                        <span className="block font-medium text-text-main truncate">{s.title || 'Study session'}</span>
                        <span className="block text-text-muted">
                          {new Date(s.startTime).toLocaleString(undefined, {
                            weekday: 'short', hour: '2-digit', minute: '2-digit'
                          })} · {s.durationMinutes}m
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link
              to="/calendar"
              className="mt-4 inline-flex items-center justify-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Open calendar <ChevronRight size={13} />
            </Link>
          </section>
        </div>
      </div>

      {/* ---- Recent materials ---- */}
      <section className="space-y-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-heading text-base font-bold text-text-main tracking-tight">
            {t('recent_materials')}
          </h2>
          <Link to="/library" className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
            {t('view_all')} <ArrowRight size={12} />
          </Link>
        </div>

        {recentMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentMaterials.map((material, idx) => (
              <RecentItem
                key={material.id || `material-${idx}`}
                title={material.title || 'Untitled'}
                date={formatDate(material.uploadDate) || 'Recently'}
                type={(material.type && ['pdf', 'quiz', 'note', 'flashcard'].includes(material.type) ? material.type : 'pdf') as any}
                progress={material.progress || 0}
                onClick={() => navigate(`/library/${material.id}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Your library is empty"
            message="Upload a PDF or your notes and Aether will turn them into summaries, quizzes and flashcards."
            actionLabel="Upload a material"
            onAction={() => navigate('/upload')}
            icon={<BookOpen size={24} />}
          />
        )}
      </section>

      {/* ---- Recent sessions + shortcuts ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <section className="lg:col-span-8 rounded-[var(--radius-card)] bg-surface border border-border shadow-[var(--shadow-card)] p-5">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h2 className="font-heading text-base font-bold text-text-main tracking-tight">
              {t('recent_activity')}
            </h2>
            <Link to="/reports" className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
              Reports <ArrowRight size={12} />
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <div className="py-10 text-center">
              <span className="inline-flex w-11 h-11 rounded-xl bg-surface-alt text-text-muted items-center justify-center">
                <Inbox size={19} />
              </span>
              <p className="text-sm font-semibold text-text-main mt-3">No sessions yet</p>
              <p className="text-xs text-text-muted mt-1">Your focus sessions will be listed here.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentSessions.map((session: any, idx: number) => (
                <li key={session.id || idx}>
                  <button
                    onClick={() => navigate('/reports')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-alt/60 border border-border hover:border-primary/25 transition-colors text-left cursor-pointer"
                  >
                    <span className="w-8 h-8 shrink-0 rounded-lg bg-pastel-lavender text-pastel-lavender-ink flex items-center justify-center">
                      <Clock size={15} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-text-main truncate">
                        {session.title || 'Focus session'}
                      </span>
                      <span className="block text-xs text-text-muted mt-0.5">
                        {formatTime(session.durationMinutes || 0)} · {new Date(session.startTime).toLocaleDateString()}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="lg:col-span-4 flex flex-col gap-3 content-start">
          {/* Live presence takes the slot the static "Live rooms" shortcut used
              to occupy — same destination, but it shows whether anyone is
              actually there. */}
          <StudyingNowRail />

          <div className="grid grid-cols-3 gap-3">
            {[
              { to: '/upload', icon: Upload, tone: 'bg-pastel-lavender text-pastel-lavender-ink', label: t('snap_scan') },
              { to: '/curriculum', icon: BookOpen, tone: 'bg-pastel-peach text-pastel-peach-ink', label: t('curriculum_library') },
              { to: '/explore', icon: Compass, tone: 'bg-pastel-mint text-pastel-mint-ink', label: 'Explore notes' }
            ].map((tool) => (
              <Link
                key={tool.to}
                to={tool.to}
                className="rounded-[var(--radius-card)] bg-surface border border-border shadow-[var(--shadow-card)] p-3 flex flex-col items-center justify-center gap-2 text-center hover:border-primary/25 transition-colors min-h-[96px]"
              >
                <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center', tool.tone)}>
                  <tool.icon size={17} />
                </span>
                <span className="text-[11px] font-semibold text-text-main leading-tight">{tool.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
