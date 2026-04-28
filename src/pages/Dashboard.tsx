import React from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Crown, 
  Sparkles, 
  BookOpen, 
  Camera, 
  ArrowRight, 
  PlayCircle, 
  CheckCircle2, 
  Award, 
  Users2,
  Clock,
  Compass,
  Radio
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import MessagesList from '../components/MessagesList';
import CalendarWidget from '../components/CalendarWidget';
import SmartCalendarWidget from '../components/SmartCalendarWidget';

import { 
  QuizScoreCard, 
  TimeSpentCard, 
  StreakCard, 
  RankingCard
} from '../components/OverviewWidgets';

export default function Dashboard() {
  const { user, theme, materials, allProfiles, studySessions, quizResults, isLoading, t } = useAppContext();
  const isLight = theme === 'light';

  if (isLoading && !user) {
    return null; // AppLayout will show the global loader
  }

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

  const topLearners = Array.isArray(allProfiles) 
    ? allProfiles
        .filter(p => p.optedInLeaderboard || (user && (p._id === user.id || p.id === user.id)))
        .slice(0, 15)
        .map((p, i) => {
        const pId = p._id || p.id;
        const isMe = pId === user?.id;
        return {
          id: pId || `learner-${i}`,
          name: isMe ? (user?.name || p.name) : (p.name || 'User'),
          avatar: isMe ? (user?.avatar || p.avatar) : p.avatar,
          fallbackAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${pId || i}`
        };
      })
    : [];

  // Data Tracking Calculations (mirrored from Reports)
  const calculatedStudyMins = Array.isArray(studySessions) ? studySessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) : 0;
  // If the user hasn't tracked any active study sessions natively, fall back to parsing their base user profile object
  const fallbackMins = (user?.totalStudyTime || 0) * 60;
  const totalStudyMinutes = calculatedStudyMins > 0 ? calculatedStudyMins : fallbackMins; 
  
  // Real life dynamic active week processing for the bar chart
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const realWeeklyMap = new Map();
  // Initialize with exactly what Rechart expects for scaling
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
      // Fallback safely to native user profile tracking if session arrays exist but are empty
      user.weeklyTimeData.forEach(d => {
        realWeeklyMap.set(d.day, d.hours);
      })
  }

  // Ensure Recharts doesn't get completely flatline empty sets which causes visual collapse
  const realWeeklyData = weekDays.map(day => ({ 
    day, 
    hours: realWeeklyMap.get(day) === 0 ? 0.01 : realWeeklyMap.get(day) 
  }));

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

  const filteredProfiles = Array.isArray(allProfiles) 
    ? allProfiles.filter(p => p.optedInLeaderboard || (user && (p._id === user.id || p.id === user.id)))
    : [];

  const myRankIndex = filteredProfiles.findIndex(p => (p._id || p.id) === user?.id);
  const globalRank = myRankIndex !== -1 ? myRankIndex + 1 : (user?.globalRank || 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 sm:pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col mb-6 sm:mb-10">
        <span className="text-xs sm:text-sm font-medium text-text-muted tracking-widest uppercase mb-1 sm:mb-2">
          {t('welcome_back')}
        </span>
        <h1 
          className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 pb-1"
          style={{ color: 'var(--primary)' }}
        >
          {user?.name?.split(' ')[0] || t('student')}
        </h1>
        <p className="text-text-muted text-sm sm:text-base max-w-2xl leading-relaxed">
          {t('welcome_subtext')}
        </p>
      </div>

      {/* 1. Dashboard Section - Redesigned Widgets */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-main uppercase tracking-wider">{t('overview')}</h2>
          <Link to="/reports" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest flex items-center gap-1">
            {t('reports')} <ArrowRight size={10} />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Link to="/reports" className="block">
            <TimeSpentCard 
              totalMinutes={totalStudyMinutes} 
              trend={user?.timeTrend}
              weeklyData={realWeeklyData} 
            />
          </Link>
          <Link to="/reports" className="block">
            <QuizScoreCard 
              score={avgScorePercentage} 
              trend={user?.quizTrend}
              highest={highestQuizScore}
              lowest={lowestQuizScore}
            />
          </Link>
          <Link to="/reports" className="block">
            <StreakCard 
              currentStreak={user?.streak} 
              longestStreak={user?.longestStreak && user.longestStreak > (user?.streak || 0) ? user.longestStreak : (user?.streak || 0)} 
            />
          </Link>
          <Link to="/leaderboard" className="block">
            <RankingCard 
              rank={globalRank} 
              total={allProfiles.length || 1250}
              topLearnersData={topLearners.length > 0 ? topLearners : undefined}
            />
          </Link>

        </div>

        {/* Recent Materials Section */}
        {recentMaterials.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-main uppercase tracking-wider">{t('recent_materials')}</h2>
              <Link to="/library" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest flex items-center gap-1">
                {t('view_all')} <ArrowRight size={10} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentMaterials.map((material, idx) => (
                <Link 
                  key={material.id || `material-${idx}`} 
                  to={`/library/${material.id}`}
                  className="glass-card p-4 flex items-center gap-4 hover:border-primary/50 transition-all group"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <BookOpen size={18} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="text-xs font-bold text-text-main truncate">{material.title}</h3>
                    <p className="text-xs text-text-muted">{material.uploadDate}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Calendar & Smart Feature in 2:1 Ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          <div className="lg:col-span-8">
            <CalendarWidget className="h-[300px] sm:h-[420px]" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-main uppercase tracking-wider">{t('recent_activity')}</h2>
            </div>
            <div className="glass-card p-4 h-[calc(100%-2rem)] flex flex-col overflow-hidden">
              <div className="space-y-3 overflow-y-auto no-scrollbar pr-1">
                {recentSessions.length > 0 ? (
                  recentSessions.map((session, idx) => (
                    <div key={session.id || idx} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border hover:border-primary/30 transition-colors">
                      <div className="w-8 h-8 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center shrink-0">
                        <Clock size={16} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="text-xs font-bold text-text-main truncate">{session.title}</h4>
                        <p className="text-[10px] text-text-muted">{session.durationMinutes} {t('mins')} • {new Date(session.startTime).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 py-12">
                    <Clock size={32} className="text-text-muted mb-2 opacity-20" />
                    <p className="text-xs text-text-muted">{t('no_recent_activity')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Middle Section - Messages & Quick Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-stretch">
        {/* Messages - Left (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-text-main uppercase tracking-wider">{t('messages')}</h2>
          <MessagesList className="h-[300px] sm:h-[420px]" />
        </div>

        {/* Quick Tools - Right (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-text-main uppercase tracking-wider">{t('quick_tools')}</h2>
          
          {/* Mobile Action Pad (High Density) */}
          <div className="grid grid-cols-2 sm:hidden gap-3">
            {[
              { to: "/upload", icon: Camera, color: "primary", label: t('snap_scan') },
              { to: "/curriculum", icon: BookOpen, color: "secondary", label: t('curriculum_library') },
              { to: "/explore", icon: Compass, color: "emerald-500", label: "Explore" },
              { to: "/rooms", icon: Radio, color: "red-500", label: "Live Rooms" }
            ].map((tool, i) => (
              <Link 
                key={i} 
                to={tool.to}
                className="glass-card p-5 flex flex-col items-center justify-center text-center gap-3 active:scale-95 transition-transform border-border/40"
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  tool.color === 'primary' ? "bg-primary/10 text-primary" : 
                  tool.color === 'secondary' ? "bg-secondary/10 text-secondary" : 
                  tool.color === 'emerald-500' ? "bg-emerald-500/10 text-emerald-500" : 
                  "bg-red-500/10 text-red-500"
                )}>
                  <tool.icon size={24} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-tight text-text-main">{tool.label}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Layout (Original) */}
          <div className="hidden sm:flex sm:flex-col gap-4 h-[420px]">
            <Link to="/upload" className="glass-card p-6 group hover:border-primary/50 transition-all relative overflow-hidden flex-1 flex items-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
              <div className="flex items-center gap-6 relative z-10 w-full">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <Camera size={28} />
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-text-main mb-0.5">{t('snap_scan')}</h3>
                  <p className="text-sm text-text-muted max-w-md leading-tight">{t('snap_scan_desc')}</p>
                </div>
                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all shrink-0">
                  <ArrowRight size={14} className="text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>

            <Link to="/curriculum" className="glass-card p-6 group hover:border-secondary/50 transition-all relative overflow-hidden flex-1 flex items-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
              <div className="flex items-center gap-6 relative z-10 w-full">
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary shrink-0">
                  <BookOpen size={28} />
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-text-main mb-0.5">{t('curriculum_library')}</h3>
                  <p className="text-sm text-text-muted max-w-md leading-tight">{t('curriculum_library_desc')}</p>
                </div>
                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-secondary group-hover:bg-secondary/5 transition-all shrink-0">
                  <ArrowRight size={14} className="text-text-muted group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
