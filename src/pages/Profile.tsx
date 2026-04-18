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
  Edit2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Profile() {
  const { user } = useAppContext();

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

              <div className="flex gap-2 justify-center sm:justify-start">
                <button className="btn-primary px-6 py-2 sm:px-8 sm:py-3 shadow-lg shadow-primary/20 text-xs sm:text-base">Follow</button>
                <button className="p-2 sm:p-3 bg-surface-alt/50 border border-border rounded-xl sm:rounded-2xl text-text-main hover:bg-surface-alt transition-all">
                  <MessageSquare size={18} className="sm:hidden" />
                  <MessageSquare size={22} className="hidden sm:block" />
                </button>
              </div>
            </div>

            {/* Social Stats - Social Media Style */}
            <div className="flex items-center justify-center sm:justify-start gap-6 sm:gap-8 pt-4 border-t border-border/30">
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <span className="text-sm sm:text-xl font-bold text-text-main">1.2k</span>
                <span className="text-xs sm:text-sm font-bold text-text-muted uppercase tracking-widest">Followers</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <span className="text-sm sm:text-xl font-bold text-text-main">850</span>
                <span className="text-xs sm:text-sm font-bold text-text-muted uppercase tracking-widest">Friends</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <span className="text-sm sm:text-xl font-bold text-text-main">4,250</span>
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
            <h3 className="text-sm sm:text-xl font-bold mb-3 sm:mb-4 text-text-main">About Me</h3>
            <p className="text-xs sm:text-base text-text-muted leading-relaxed mb-4 sm:mb-6">
              {user?.bio || "No bio yet. Tell the community about your study goals in Settings!"}
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {(user?.curriculum ? [user.curriculum, 'Learning', 'Student'] : ['Physics', 'Calculus', 'SAT Prep', 'AI Learning', 'Generous']).map((tag) => (
                <span key={tag} className="px-2 py-0.5 sm:px-3 sm:py-1 bg-surface-alt/50 border border-border/50 rounded-lg text-[10px] sm:text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  #{tag.replace(/\s+/g, '')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Activity & Achievements */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          {/* Learning Progress */}
          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h3 className="text-sm sm:text-xl font-bold text-text-main flex items-center gap-2 sm:gap-3">
                <TrendingUp size={18} className="text-primary sm:hidden" />
                <TrendingUp size={24} className="text-primary hidden sm:block" />
                Learning Progress
              </h3>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Last 30 Days</span>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              {[
                { label: 'Mathematics', progress: 85, color: 'bg-primary' },
                { label: 'Physics', progress: 72, color: 'bg-secondary' },
                { label: 'English Literature', progress: 45, color: 'bg-accent' },
              ].map((item) => (
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
              {[
                { title: 'Generous Contributor', desc: 'Shared 10+ materials', icon: Award, date: '2 days ago' },
                { title: 'Quiz Master', desc: 'Scored 100% in 5 quizzes', icon: CheckCircle2, date: '1 week ago' },
                { title: 'Early Bird', desc: 'Studied before 6 AM', icon: Clock, date: '3 days ago' },
                { title: 'Community Hero', desc: 'Helped 50+ students', icon: Users2, date: 'Yesterday' },
              ].map((achievement, i) => (
                <div key={i} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-surface-alt/30 rounded-xl sm:rounded-2xl border border-border/40 hover:border-primary/20 transition-all group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface rounded-lg sm:rounded-xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                    <achievement.icon size={18} className="sm:hidden" />
                    <achievement.icon size={24} className="hidden sm:block" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-main text-xs sm:text-sm">{achievement.title}</h4>
                    <p className="text-xs sm:text-[10px] text-text-muted mb-0.5 sm:mb-1">{achievement.desc}</p>
                    <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{achievement.date}</p>
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
