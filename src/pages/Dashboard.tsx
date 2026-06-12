import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { formatTime, getGreeting, formatDate, getRandomQuote } from '../lib/utils';
import { 
  Camera, 
  ArrowRight, 
  Clock,
  Compass,
  Radio,
  BookOpen,
  CalendarDays,
  Sparkles,
  Inbox,
  AlertCircle,
  RotateCcw,
  Plus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import MessagesList from '../components/MessagesList';
import CalendarWidget from '../components/CalendarWidget';
import StudyConstellation from '../components/StudyConstellation';
import { useStudyActivity } from '../hooks/useStudyActivity';

// Import our cohesive, polished shared components
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { MetricCard } from '../components/ui/MetricCard';
import { DataChart } from '../components/ui/DataChart';
import { RecentItem } from '../components/ui/RecentItem';
import { UserAvatar } from '../components/ui/UserAvatar';
import { TruncatedText } from '../components/ui/TruncatedText';
import { StatsCard } from '../components/ui/StatsCard';
import { ProgressRing } from '../components/ui/ProgressRing';

export default function Dashboard() {
  const { theme, allProfiles, studySessions, quizResults, t } = useAppContext();
  const { user, stats, recentMaterials, loading, error, refetch } = useDashboardData();
  const navigate = useNavigate();
  const randomQuote = React.useMemo(() => getRandomQuote(), []);
  const activities = useStudyActivity();

  // 1. Loading Skeleton Component
  if (loading) {
    return (
      <div className="space-y-6 pb-24 max-w-lg mx-auto sm:max-w-none animate-pulse select-none">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between gap-4 p-4 bg-surface-alt/40 border border-border/10 rounded-2xl">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-full bg-border/20" />
            <div className="space-y-2">
              <div className="w-16 h-3 bg-border/20 rounded" />
              <div className="w-32 h-5 bg-border/20 rounded" />
            </div>
          </div>
          <div className="w-10 h-10 bg-border/20 rounded-xl" />
        </div>

        {/* Overview Header */}
        <div className="h-14 bg-border/10 rounded-xl w-1/3" />

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="h-24 bg-surface border border-border/10 rounded-2xl p-4 space-y-2">
              <div className="w-1/2 h-3 bg-border/20 rounded" />
              <div className="w-3/4 h-6 bg-border/20 rounded" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 h-64 bg-surface border border-border/10 rounded-2xl p-6" />
          <div className="lg:col-span-4 h-64 bg-surface border border-border/10 rounded-2xl p-6" />
        </div>
      </div>
    );
  }

  // 2. Error Recovery Component
  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto select-none">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20 mb-4">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-lg font-black text-text-main uppercase tracking-wider mb-2">Failed to Load Dashboard</h3>
        <p className="text-xs text-text-muted mb-6">{error}</p>
        <button 
          onClick={refetch}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all btn-ripple"
        >
          <RotateCcw size={14} /> Retry Loading
        </button>
      </div>
    );
  }

  const recentSessions = Array.isArray(studySessions)
    ? [...studySessions]
        .filter(s => s && s.startTime)
        .sort((a, b) => {
          try {
            return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
          } catch {
            return 0;
          }
        })
        .slice(0, 4)
    : [];

  // Data mapping for custom DataChart
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const todayIndex = new Date().getDay();

  const chartData = weekDays.map((day, idx) => {
    const isToday = todayIndex === idx;
    const statsDay = stats?.weeklyData?.find(d => d.day === day);
    // Convert minutes to fractional hours to maintain dynamic visualization bounds
    const hours = statsDay ? (statsDay.minutes / 60) : 0;
    return {
      label: day,
      value: hours > 0 ? parseFloat(hours.toFixed(1)) : 0,
      active: isToday
    };
  });

  const filteredProfiles = Array.isArray(allProfiles) 
    ? allProfiles.filter(p => p.optedInLeaderboard || (user && p.id === user.id))
    : [];

  const userName = user?.name || "Student";
  const formattedStreak = user?.streak || 0;

  return (
    <div className="relative min-h-screen">
      {/* Background Study Constellation */}
      <StudyConstellation userId={user?.id} activities={activities} />

      <div className="relative z-10 space-y-6 pb-24 max-w-lg mx-auto sm:max-w-none select-none">
      {/* 1. Personalized Header */}
      <div className="flex items-center justify-between gap-4 p-4 bg-surface-alt/40 border border-border/10 rounded-2xl">
        <div className="flex items-center gap-3.5 min-w-0">
          <UserAvatar 
            name={userName} 
            avatarUrl={user?.image || undefined} 
            streakCount={formattedStreak} 
            size="lg" 
          />
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00D2FF]">
              {getGreeting()}, {userName.split(' ')[0]}! ☀️
            </span>
            <h1 className="text-base sm:text-lg font-black text-text-main leading-tight mt-0.5 truncate uppercase">
              <TruncatedText text={userName} maxLength={24} />
            </h1>
            <p className="text-[10px] sm:text-xs text-text-muted mt-1 italic leading-tight">
              "{randomQuote}"
            </p>
          </div>
        </div>
        
        {/* Quick action floating tracker button */}
        <Link 
          to="/upload" 
          className="btn-primary !p-2.5 rounded-xl text-xs flex items-center justify-center shrink-0 border border-primary/40 btn-ripple"
        >
          <Camera size={16} />
        </Link>
      </div>

      {/* 2. PageHeader Container */}
      <PageHeader 
        title={t('overview')} 
        subtitle="Analytical insights, focus charts and material tracking."
        action={
          <Link to="/reports" className="text-[10px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest flex items-center gap-1">
            {t('reports')} <ArrowRight size={10} />
          </Link>
        }
      />

      {/* 3. Core Consistent Metric System */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard 
          label="Total Study Time" 
          value={formatTime(user?.totalStudyTime || 0)}
          icon={<Clock size={16} />}
          tooltip="Accumulated focused educational timing in hours and minutes."
          onClick={() => navigate('/reports')}
        />
        <MetricCard 
          label="Average Score" 
          value={`${Math.round(user?.averageQuizScore || 0)}%`}
          icon={<Sparkles size={16} />}
          tooltip="Average correctness rating across generated quiz modules."
          onClick={() => navigate('/reports')}
        />
        
        {/* Real Dynamic Streak with Action Prompt if Zero */}
        {formattedStreak > 0 ? (
          <MetricCard 
            label="Recall Streak" 
            value={`${formattedStreak} Days`}
            trend={{ value: 100, direction: 'up' }}
            icon={<span className="text-sm">🔥</span>}
            tooltip="Consecutive days studied active recall sessions."
            onClick={() => navigate('/reports')}
          />
        ) : (
          <div 
            onClick={() => navigate('/rooms')}
            className="flex flex-col bg-[#F59E0B]/5 hover:bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-2xl p-3.5 transition-all cursor-pointer relative overflow-hidden group select-none shadow-soft"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-[#F59E0B] tracking-widest truncate">Recall Streak</span>
              <span className="text-sm">⚡</span>
            </div>
            <div className="text-sm font-black text-[#F59E0B] mt-1 pr-6 leading-tight">Start First Session</div>
            <p className="text-[8px] text-[#F59E0B]/70 mt-0.5">Focus now to build streak →</p>
          </div>
        )}

        <MetricCard 
          label="Rivals Rank" 
          value={`#${user?.rank || 1} of ${user?.totalLearners || 124}`}
          icon={<Compass size={16} />}
          tooltip="Your highlighted rank position among active course leaderboard members."
          onClick={() => navigate('/leaderboard')}
        />
      </div>

      {/* 4. Focus Charts & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 flex flex-col gap-3">
          <DataChart 
            data={chartData} 
            title="Weekly Studying Level" 
            subtitle="Calculated active review metrics" 
          />
        </div>

        <div className="lg:col-span-4">
          <StatsCard 
            title="Academic Health Rate" 
            value={user?.averageQuizScore && user?.averageQuizScore > 0 ? `${Math.round(user.averageQuizScore)}%` : "No Data"}
            description={user?.averageQuizScore && user?.averageQuizScore > 0 && stats?.peak && stats?.floor
              ? `Peak target: ${stats?.peak}m / floor run: ${stats?.floor}m`
              : user?.averageQuizScore && user?.averageQuizScore > 0
                ? "Academic performance calculated from recent study quizzes."
                : "Complete a quiz in active study mode to compute health rating."}
            accentColor="text-primary"
            icon={<ProgressRing percentage={user?.averageQuizScore || 0} size={36} strokeWidth={4} />}
          />
        </div>
      </div>

      {/* 5. Highlight Area: Recent Course Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-text-main uppercase tracking-widest">
            {t('recent_materials')}
          </h2>
          <Link to="/library" className="text-[10px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest flex items-center gap-1">
            {t('view_all')} <ArrowRight size={10} />
          </Link>
        </div>

        {recentMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentMaterials.map((material, idx) => (
              <RecentItem 
                key={material.id || `material-${idx}`}
                title={material.title || "Untitled course"}
                date={formatDate(material.uploadDate) || "Recently"}
                type={(material.type && ['pdf', 'quiz', 'note', 'flashcard'].includes(material.type) ? material.type : 'pdf') as any}
                progress={material.progress || 0}
                onClick={() => navigate(`/library/${material.id}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState 
            title="Your Library is Empty" 
            message="Upload notes, text pages, or PDF articles to start your smart study track!"
            actionLabel="Scan Notebook"
            onAction={() => navigate('/upload')}
            icon={<BookOpen size={24} />}
          />
        )}
      </div>

      {/* 6. Tasks & Study Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Calendar scheduling Widget */}
        <div className="lg:col-span-8">
          <CalendarWidget className="min-h-[380px] h-auto" />
        </div>

        {/* Dynamic Activity Tracking History */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-black text-text-main uppercase tracking-widest">
            {t('recent_activity')}
          </h2>
          <div className="bg-surface border border-border/10 p-4 rounded-2xl min-h-[380px] h-auto overflow-y-auto no-scrollbar flex flex-col justify-between">
            <div className="space-y-2.5">
              {recentSessions.length > 0 ? (
                recentSessions.map((session, idx) => (
                  <div 
                    key={session.id || idx} 
                    className="flex items-center gap-2.5 p-2.5 bg-surface-alt/40 border border-border/5 rounded-xl hover:border-primary/20 transition-all cursor-pointer"
                    onClick={() => navigate('/reports')}
                  >
                    <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                      <Clock size={14} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-[11px] font-bold text-text-main truncate">
                        {session.title || "Active focus"}
                      </h4>
                      <p className="text-[9px] text-text-muted mt-0.5">
                        {session.durationMinutes} mins • {session.startTime ? new Date(session.startTime).toLocaleDateString() : 'Today'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-10 opacity-70">
                  <Inbox size={26} className="text-text-muted opacity-40 mb-2" />
                  <p className="text-[10px] font-black uppercase text-text-muted tracking-wider">No recent sessions</p>
                  <p className="text-[9px] text-text-muted max-w-[150px] mt-1">Daily active recall sessions accumulate here.</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => navigate('/community')}
              className="w-full mt-3 btn-ripple py-2.5 bg-surface-alt hover:bg-primary/10 border border-border/10 text-text-main hover:text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Solve Doubts with Friends
            </button>
          </div>
        </div>
      </div>

      {/* 7. Bottom Discussion Forum */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-text-main uppercase tracking-widest">
          Discussion Forum
        </h2>
        <MessagesList className="h-[240px] border border-border/10 bg-surface rounded-2xl overflow-hidden shadow-soft" />
      </div>

      {/* 8. Touch Optimized Mobile Quick Actions Pad */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-black text-text-main uppercase tracking-widest">
          Mobile Actions Pad
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { to: "/upload", icon: Camera, color: "text-primary bg-primary/10", label: t('snap_scan') },
            { to: "/curriculum", icon: BookOpen, color: "text-amber-500 bg-amber-500/10", label: t('curriculum_library') },
            { to: "/explore", icon: Compass, color: "text-emerald-500 bg-emerald-500/10", label: "Explore Courses" },
            { to: "/rooms", icon: Radio, color: "text-cyan-500 bg-cyan-500/10", label: "Live Rooms" }
          ].map((tool, idx) => (
            <Link 
              key={idx} 
              to={tool.to}
              className="bg-surface/50 border border-border/10 p-4.5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center active:scale-95 transition-transform btn-ripple select-none"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tool.color}`}>
                <tool.icon size={18} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider text-text-main font-sans">
                {tool.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
