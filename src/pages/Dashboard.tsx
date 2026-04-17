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
  Clock
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
  const { user, theme, materials, allProfiles, studySessions, quizResults, isLoading } = useAppContext();
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
    ? allProfiles.slice(0, 6).map((p, i) => ({
        id: p._id || p.id || `learner-${i}`,
        name: p.name || 'User',
        avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p._id || p.id || i}`
      }))
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

  const myRankIndex = Array.isArray(allProfiles) ? allProfiles.findIndex(p => p.id === user?.id) : -1;
  const globalRank = myRankIndex !== -1 ? myRankIndex + 1 : (user?.globalRank || 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 sm:pb-12">
      {/* Welcome Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-text-main tracking-tight">
          Welcome back, <span className="text-primary">{user?.name?.split(' ')[0] || "Student"}</span>!
        </h1>
        <p className="text-text-muted text-xs sm:text-sm max-w-2xl leading-relaxed">
          It's a great day to stay productive. Manage your tasks and explore your tools today.
        </p>
      </div>

      {/* 1. Overview Section - Redesigned Widgets */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-main uppercase tracking-wider">Overview</h2>
          <Link to="/reports" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest flex items-center gap-1">
            Reports <ArrowRight size={10} />
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
          <Link to="/reports" className="block">
            <RankingCard 
              rank={globalRank} 
              topLearnersData={topLearners.length > 0 ? topLearners : undefined}
            />
          </Link>
        </div>

        {/* Recent Materials Section */}
        {recentMaterials.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-main uppercase tracking-wider">Recent Materials</h2>
              <Link to="/library" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest flex items-center gap-1">
                View All <ArrowRight size={10} />
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
              <h2 className="text-sm font-bold text-text-main uppercase tracking-wider">Recent Activity</h2>
            </div>
            <div className="glass-card p-4 space-y-3 h-[calc(100%-2rem)]">
              {recentSessions.length > 0 ? (
                recentSessions.map((session, idx) => (
                  <div key={session.id || idx} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                    <div className="w-8 h-8 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-bold text-text-main truncate">{session.title}</h4>
                      <p className="text-xs text-text-muted">{session.durationMinutes} mins • {new Date(session.startTime).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <Clock size={32} className="text-text-muted mb-2 opacity-20" />
                  <p className="text-xs text-text-muted">No recent study activity tracked yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Middle Section - Messages & Quick Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-stretch">
        {/* Messages - Left (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-text-main uppercase tracking-wider">Messages</h2>
          <MessagesList className="h-[300px] sm:h-[420px]" />
        </div>

        {/* Quick Tools - Right (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-text-main uppercase tracking-wider">Quick Tools</h2>
          <div className="flex flex-col gap-3 sm:gap-4 h-auto sm:h-[420px]">
            <Link to="/upload" className="glass-card p-4 sm:p-6 group hover:border-primary/50 transition-all relative overflow-hidden flex-1 flex items-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
              <div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full">
                <div className="w-10 h-10 sm:w-16 sm:h-16 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <Camera size={20} className="sm:hidden" />
                  <Camera size={28} className="hidden sm:block" />
                </div>
                <div className="flex-grow">
                  <h3 className="text-sm sm:text-xl font-bold text-text-main mb-0.5">Snap & Scan</h3>
                  <p className="text-xs text-text-muted max-w-md leading-tight">Transform physical notes into digital study guides with AI.</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all shrink-0">
                  <ArrowRight size={14} className="text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>

            <Link to="/curriculum" className="glass-card p-4 sm:p-6 group hover:border-secondary/50 transition-all relative overflow-hidden flex-1 flex items-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
              <div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full">
                <div className="w-10 h-10 sm:w-16 sm:h-16 bg-secondary/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-secondary shrink-0">
                  <BookOpen size={20} className="sm:hidden" />
                  <BookOpen size={28} className="hidden sm:block" />
                </div>
                <div className="flex-grow">
                  <h3 className="text-sm sm:text-xl font-bold text-text-main mb-0.5">Curriculum Library</h3>
                  <p className="text-xs text-text-muted max-w-md leading-tight">Access your entire collection of courses and study materials.</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-border flex items-center justify-center group-hover:border-secondary group-hover:bg-secondary/5 transition-all shrink-0">
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
