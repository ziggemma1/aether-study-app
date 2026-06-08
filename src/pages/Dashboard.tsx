import React from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Camera, 
  ArrowRight, 
  Clock,
  Compass,
  Radio,
  BookOpen,
  CalendarDays,
  Sparkles,
  Inbox
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import MessagesList from '../components/MessagesList';
import CalendarWidget from '../components/CalendarWidget';

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
  const { user, theme, materials, allProfiles, studySessions, quizResults, isLoading, t } = useAppContext();
  const navigate = useNavigate();

  if (isLoading && !user) {
    return null; // AppLayout showcases global syncing screen
  }

  // Materials parsing
  const recentMaterials = Array.isArray(materials) 
    ? [...materials]
        .sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime())
        .slice(0, 3)
    : [];

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

  // Density Calculations
  const totalStudyMinutes = Array.isArray(studySessions) 
    ? studySessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) 
    : (user?.totalStudyTime || 0);

  const avgScorePercentage = Array.isArray(quizResults) && quizResults.length > 0 
    ? Math.round(
        quizResults.reduce((acc, curr) => {
          const p = curr.totalQuestions > 0 ? (curr.score / curr.totalQuestions) * 100 : 0;
          return acc + p;
        }, 0) / quizResults.length
      ) 
    : (user?.avgQuizScore || 0);

  const highestQuizScore = Array.isArray(quizResults) && quizResults.length > 0 
    ? Math.max(...quizResults.map(r => r.totalQuestions > 0 ? Math.round((r.score / r.totalQuestions) * 100) : 0))
    : (user?.highestQuizScore || 0);

  const lowestQuizScore = Array.isArray(quizResults) && quizResults.length > 0
    ? Math.min(...quizResults.map(r => r.totalQuestions > 0 ? Math.round((r.score / r.totalQuestions) * 100) : 0))
    : (user?.lowestQuizScore || 0);

  // Dynamic Weekly Activity Data mapping for custom DataChart
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const realWeeklyMap = new Map();
  weekDays.forEach(d => realWeeklyMap.set(d, 0));

  const todayDate = new Date();
  const startOfWeek = new Date(todayDate);
  startOfWeek.setDate(todayDate.getDate() - todayDate.getDay());
  startOfWeek.setHours(0,0,0,0);

  let hasChronologicalData = false;

  if (Array.isArray(studySessions) && studySessions.length > 0) {
    studySessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      if (sessionDate >= startOfWeek) {
        hasChronologicalData = true;
        const dayName = weekDays[sessionDate.getDay()];
        realWeeklyMap.set(dayName, realWeeklyMap.get(dayName)! + ((session.durationMinutes || 0) / 60));
      }
    });
  } 

  if (!hasChronologicalData && user?.weeklyTimeData?.length) {
    user.weeklyTimeData.forEach(d => {
      realWeeklyMap.set(d.day, d.hours);
    });
  }

  const chartData = weekDays.map((day, idx) => {
    const isToday = todayDate.getDay() === idx;
    const hours = realWeeklyMap.get(day) || 0;
    return {
      label: day,
      value: hours > 0 ? parseFloat(hours.toFixed(1)) : 0,
      active: isToday
    };
  });

  const filteredProfiles = Array.isArray(allProfiles) 
    ? allProfiles.filter(p => p.optedInLeaderboard || (user && (p._id === user.id || p.id === user.id)))
    : [];

  const myRankIndex = filteredProfiles.findIndex(p => (p._id || p.id) === user?.id);
  const globalRank = myRankIndex !== -1 ? myRankIndex + 1 : (user?.globalRank || 1);
  const userName = user?.name || "Student";

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto sm:max-w-none select-none">
      {/* 1. Personalized Header (Contains avatar element and single heading source of truth) */}
      <div className="flex items-center justify-between gap-4 p-4 bg-surface-alt/40 border border-border/10 rounded-2xl">
        <div className="flex items-center gap-3.5 min-w-0">
          <UserAvatar 
            name={userName} 
            avatarUrl={user?.avatar} 
            streakCount={user?.streak} 
            size="lg" 
          />
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">
              {t('welcome_back')}
            </span>
            <h1 className="text-base sm:text-lg font-black text-text-main leading-tight mt-0.5 truncate uppercase">
              <TruncatedText text={userName} maxLength={24} />
            </h1>
            <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 truncate">
              {t('welcome_subtext')}
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

      {/* 2. PageHeader Container (Pure single header block for standard routes) */}
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
          value={`${Math.round(totalStudyMinutes)}m`}
          trend={user?.timeTrend ? { value: user.timeTrend, direction: 'up' } : undefined}
          icon={<Clock size={16} />}
          tooltip="Accumulated focused educational timing in minutes."
          onClick={() => navigate('/reports')}
        />
        <MetricCard 
          label="Average Score" 
          value={`${avgScorePercentage}%`}
          trend={user?.quizTrend ? { value: user.quizTrend, direction: 'up' } : undefined}
          icon={<Sparkles size={16} />}
          tooltip="Average correctness rating across generated quiz modules."
          onClick={() => navigate('/reports')}
        />
        <MetricCard 
          label="Recall Streak" 
          value={`${user?.streak || 0} Days`}
          trend={user?.streak && user.streak > 0 ? { value: 100, direction: 'up' } : undefined}
          icon={<span className="text-sm">🔥</span>}
          tooltip="Consecutive days studied active recall sessions."
          onClick={() => navigate('/reports')}
        />
        <MetricCard 
          label="Rivals Rank" 
          value={`#${globalRank}`}
          icon={<Compass size={16} />}
          tooltip="Your highlighted rank position among active course leaderboard members."
          onClick={() => navigate('/leaderboard')}
        />
      </div>

      {/* 4. Encouraging Empty State Checker & Focus Charts */}
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
            value={avgScorePercentage > 0 ? `${avgScorePercentage}%` : "No Data"}
            description={`Peak target: ${highestQuizScore}% / lowest run: ${lowestQuizScore}%`}
            accentColor="text-primary"
            icon={<ProgressRing percentage={avgScorePercentage} size={36} strokeWidth={4} />}
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
                date={material.uploadDate || "Recently"}
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
          <CalendarWidget className="h-[280px]" />
        </div>

        {/* Dynamic Activity Tracking History */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-black text-text-main uppercase tracking-widest">
            {t('recent_activity')}
          </h2>
          <div className="bg-surface border border-border/10 p-4 rounded-2xl h-[280px] overflow-y-auto no-scrollbar flex flex-col justify-between">
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

      {/* 7. Bottom Messaging Center */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-text-main uppercase tracking-widest">
          Discussion Forum
        </h2>
        <MessagesList className="h-[240px] border border-border/10 bg-surface rounded-2xl overflow-hidden shadow-soft" />
      </div>

      {/* 8. Touch Optimized Mobile Quick Actions Pad (Device Specific constraints applied) */}
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
  );
}
