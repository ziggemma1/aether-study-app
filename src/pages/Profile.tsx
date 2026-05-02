import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { 
  Award, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  MapPin, 
  MessageSquare, 
  Share2, 
  Sparkles, 
  Users2,
  Clock,
  TrendingUp,
  Edit2,
  UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Profile() {
  const { 
    user, 
    t, 
    materials, 
    studySessions,
    achievements, 
    sendFriendRequest 
  } = useAppContext();

  // DERIVED DATA: Learning progress based on real subject materials
  const subjectProgress = React.useMemo(() => {
    if (materials.length === 0) {
      return [
        { label: 'General', progress: 0, color: 'bg-primary' },
      ];
    }

    // Grouping by type or extracting subjects from keyTopics/titles
    const subjectsMap: Record<string, { total: number, count: number }> = {};
    
    // We'll use the material types as proxy for subjects if no curriculum mapping exists
    materials.forEach(m => {
      const label = m.type.at(0)?.toUpperCase() + m.type.slice(1);
      if (!subjectsMap[label]) {
        subjectsMap[label] = { total: 0, count: 0 };
      }
      subjectsMap[label].total += m.progress || 0;
      subjectsMap[label].count += 1;
    });

    return Object.entries(subjectsMap).map(([label, stats], i) => {
      const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-blue-500', 'bg-green-500'];
      return {
        label,
        progress: Math.round(stats.total / stats.count),
        color: colors[i % colors.length]
      };
    }).slice(0, 5); // top 5
  }, [materials]);

  // DERIVED ACHIEVEMENTS: Use real ones if available, otherwise show "earned" based on stats
  const displayAchievements = React.useMemo(() => {
    const realAchievements = user?.achievements || [];
    if (realAchievements.length > 0) return realAchievements;

    // Fallback/Synthetic achievements based on real data
    const synthetic = [];
    if (materials.length >= 1) {
      synthetic.push({ title: 'First Upload', desc: 'Started the journey by uploading a material', icon: BookOpen, date: 'Recently' });
    }
    if (user?.streak && user.streak >= 3) {
      synthetic.push({ title: 'Steady Learner', desc: 'Maintained a 3-day streak', icon: Award, date: 'Unlocked' });
    }
    if (materials.filter(m => m.type === 'unified').length >= 1) {
      synthetic.push({ title: 'Master Organizer', desc: 'Created a unified study guide', icon: Sparkles, date: 'Unlocked' });
    }
    
    // If absolutely nothing, show placeholders but marked as "In Progress"
    if (synthetic.length === 0) {
      return [
        { title: 'Newcomer', desc: 'Join the community', icon: Award, date: 'Joined' }
      ];
    }
    
    return synthetic;
  }, [user, materials]);

  // Heatmap Data (Last 120 days)
  const heatmapDays = React.useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionMinutesByDate: Record<string, number> = {};
    if (studySessions) {
      studySessions.forEach(s => {
        if (!s.startTime || !s.durationMinutes) return;
        const d = new Date(s.startTime);
        d.setHours(0, 0, 0, 0);
        const dateStr = d.toISOString();
        sessionMinutesByDate[dateStr] = (sessionMinutesByDate[dateStr] || 0) + s.durationMinutes;
      });
    }

    for (let i = 119; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString();
      const minutes = sessionMinutesByDate[dateStr] || 0;
      
      let intensity = 0;
      if (minutes > 0 && minutes < 30) intensity = 1;
      else if (minutes >= 30 && minutes < 60) intensity = 2;
      else if (minutes >= 60 && minutes < 120) intensity = 3;
      else if (minutes >= 120) intensity = 4;

      days.push({
        date: d,
        minutes,
        intensity
      });
    }
    return days;
  }, [studySessions]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in duration-700 pb-24 sm:pb-20 p-3 sm:p-0">
      {/* 1. Hero Profile Header - Simplified */}
      <section className="glass-card p-6 sm:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-primary/5 rounded-full -mr-24 -mt-24 sm:-mr-32 sm:-mt-32 blur-3xl" />
        
        <div className="relative z-10 flex flex-col sm:flex-row gap-6 sm:gap-8 sm:items-center">
          {/* Profile Picture */}
          <div className="relative shrink-0 flex justify-center sm:block">
            <div className="w-24 h-24 sm:w-40 sm:h-40 bg-surface rounded-[30px] sm:rounded-[40px] border-4 border-primary/10 shadow-xl overflow-hidden flex items-center justify-center text-primary text-3xl sm:text-5xl font-bold">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name.charAt(0)
              )}
            </div>
            <div className="absolute bottom-0 right-[calc(50%-3rem)] sm:-bottom-1 sm:-right-1 w-7 h-7 sm:w-9 sm:h-9 bg-green-500 rounded-xl sm:rounded-2xl border-4 border-surface flex items-center justify-center text-white shadow-lg">
              <CheckCircle2 size={14} className="sm:hidden" />
              <CheckCircle2 size={18} className="hidden sm:block" />
            </div>
          </div>

          {/* Info & Stats */}
          <div className="flex-grow space-y-4 sm:space-y-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-0.5 sm:mb-1">
                  <h1 className="text-xl sm:text-4xl font-bold text-text-main tracking-tight">{user?.name}</h1>
                  <Link to="/settings" className="p-1.5 sm:p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg sm:rounded-xl transition-all" title="Edit Profile">
                    <Edit2 size={14} className="sm:hidden" />
                    <Edit2 size={18} className="hidden sm:block" />
                  </Link>
                </div>
                <p className="text-primary font-bold text-sm sm:text-lg mb-1 sm:mb-2">@{user?.handle || user?.name?.toLowerCase()?.replace(/\s+/g, '_')}</p>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-text-muted font-medium text-[10px] sm:text-sm">
                  <MapPin size={12} className="text-primary" />
                  <span>{user?.location || 'Location not set'}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => user && sendFriendRequest(user.id)}
                  className="btn-primary w-full sm:w-auto px-6 py-2 sm:px-8 sm:py-3 shadow-lg shadow-primary/20 text-xs sm:text-base flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} /> Add Friend
                </button>
                <button className="w-full sm:w-auto p-2 sm:p-3 bg-surface-alt/50 border border-border rounded-xl sm:rounded-2xl text-text-main hover:bg-surface-alt transition-all flex items-center justify-center gap-2">
                  <MessageSquare size={18} className="sm:hidden" />
                  <MessageSquare size={22} className="hidden sm:block" />
                  <span className="sm:hidden text-xs font-bold uppercase tracking-widest">Message</span>
                </button>
              </div>

            </div>

            {/* Social Stats - Social Media Style */}
            <div className="flex items-center justify-center sm:justify-start gap-6 sm:gap-8 pt-4 border-t border-border/30">
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <span className="text-sm sm:text-xl font-bold text-text-main">{user?.followersCount || 0}</span>
                <span className="text-xs sm:text-sm font-bold text-text-muted uppercase tracking-widest">{t('followers')}</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <span className="text-sm sm:text-xl font-bold text-text-main">{user?.friendsCount || 0}</span>
                <span className="text-xs sm:text-sm font-bold text-text-muted uppercase tracking-widest">{t('friends')}</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <span className="text-sm sm:text-xl font-bold text-text-main">{user?.points || 0}</span>
                <span className="text-xs sm:text-sm font-bold text-text-muted uppercase tracking-widest">Points</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stats & Bio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        {/* Left Column - Stats & Bio */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          {/* Bio Card */}
          <div className="glass-card p-6 sm:p-8">
            <h3 className="text-sm sm:text-xl font-bold mb-3 sm:mb-4 text-text-main">{t('about_me')}</h3>
            <p className="text-xs sm:text-base text-text-muted leading-relaxed mb-4 sm:mb-6">
              {user?.bio || "No bio yet. Tell the community about your study goals in Settings!"}
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {[user?.curriculum || 'General', 'Learning', 'Student', materials.length > 5 ? 'Power User' : 'Newcomer'].map((tag) => (
                <span key={tag} className="px-2 py-0.5 sm:px-3 sm:py-1 bg-surface-alt/50 border border-border/50 rounded-lg text-[10px] sm:text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  #{tag.replace(/\s+/g, '')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Activity & Achievements */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          {/* Pomodoro Analytics Heatmap */}
          <div className="glass-card p-6 sm:p-8">
            <h3 className="text-sm sm:text-xl font-bold mb-6 text-text-main flex items-center gap-2 sm:gap-3">
              <Calendar size={18} className="text-blue-500 sm:hidden" />
              <Calendar size={24} className="text-blue-500 hidden sm:block" />
              Focus Contributions
            </h3>
            
            <div className="flex flex-col gap-2">
              <div className="flex gap-1 sm:gap-1.5 overflow-x-auto custom-scrollbar pb-2">
                <div className="grid grid-rows-7 grid-flow-col gap-1 sm:gap-1.5">
                  {heatmapDays.map((day, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "w-3 h-3 sm:w-4 sm:h-4 rounded-sm transition-all duration-300",
                        day.intensity === 0 && "bg-surface border border-border/50",
                        day.intensity === 1 && "bg-primary/30",
                        day.intensity === 2 && "bg-primary/60",
                        day.intensity === 3 && "bg-primary/80",
                        day.intensity === 4 && "bg-primary shadow-[0_0_8px_rgba(139,92,246,0.5)]",
                      )}
                      title={`${day.date.toDateString()}: ${day.minutes} mins`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end items-center gap-1.5 text-[10px] sm:text-xs text-text-muted mt-2">
                <span>Less</span>
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-surface border border-border/50" />
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-primary/30" />
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-primary/60" />
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-primary/80" />
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-primary" />
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Learning Progress */}
          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h3 className="text-sm sm:text-xl font-bold text-text-main flex items-center gap-2 sm:gap-3">
                <TrendingUp size={18} className="text-primary sm:hidden" />
                <TrendingUp size={24} className="text-primary hidden sm:block" />
                Learning Progress
              </h3>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Global Progress</span>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              {subjectProgress.map((item) => (
                <div key={item.label} className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm font-bold">
                    <span className="text-text-main">{item.label}</span>
                    <span className="text-text-muted">{item.progress}%</span>
                  </div>
                  <div className="h-2 sm:h-3 bg-surface-alt rounded-full overflow-hidden border border-border/30">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn("h-full rounded-full", item.color)} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="glass-card p-6 sm:p-8">
            <h3 className="text-sm sm:text-xl font-bold mb-6 sm:mb-8 text-text-main flex items-center gap-2 sm:gap-3">
              <Sparkles size={18} className="text-secondary sm:hidden" />
              <Sparkles size={24} className="text-secondary hidden sm:block" />
              Recent Achievements
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {displayAchievements.map((achievement: any, i) => (
                <div key={i} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-surface-alt/30 rounded-xl sm:rounded-2xl border border-border/40 hover:border-primary/20 transition-all group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface rounded-lg sm:rounded-xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                    {typeof achievement.icon === 'string' ? (
                      <span className="text-xl">{achievement.icon}</span>
                    ) : (
                      <>
                        <achievement.icon size={18} className="sm:hidden" />
                        <achievement.icon size={24} className="hidden sm:block" />
                      </>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-text-main text-xs sm:text-sm">{achievement.title}</h4>
                    <p className="text-xs sm:text-[10px] text-text-muted mb-0.5 sm:mb-1">{achievement.description || achievement.desc}</p>
                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{achievement.unlockedAt || achievement.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
