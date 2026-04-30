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
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      {/* 1. Hero Profile Header - Simplified */}
      <section className="glass-card p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 md:items-center">
          {/* Profile Picture */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-surface rounded-[40px] border-4 border-primary/10 shadow-xl overflow-hidden flex items-center justify-center text-primary text-5xl font-bold">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name.charAt(0)
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-green-500 rounded-2xl border-4 border-surface flex items-center justify-center text-white shadow-lg">
              <CheckCircle2 size={18} />
            </div>
          </div>

          {/* Info & Stats */}
          <div className="flex-grow space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-text-main tracking-tight">{user?.name}</h1>
                  <Link to="/settings" className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="Edit Profile">
                    <Edit2 size={18} />
                  </Link>
                </div>
                <p className="text-primary font-bold text-lg mb-2">@robert_fox_study</p>
                <div className="flex items-center gap-2 text-text-muted font-medium text-sm">
                  <MapPin size={14} className="text-primary" />
                  <span>Lagos, Nigeria</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="btn-primary px-8 py-3 shadow-lg shadow-primary/20">Follow</button>
                <button className="p-3 bg-surface-alt/50 border border-border rounded-2xl text-text-main hover:bg-surface-alt transition-all">
                  <MessageSquare size={22} />
                </button>
              </div>
            </div>

            {/* Social Stats - Social Media Style */}
            <div className="flex items-center gap-8 pt-4 border-t border-border/30">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-text-main">1.2k</span>
                <span className="text-sm font-bold text-text-muted uppercase tracking-widest">Followers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-text-main">850</span>
                <span className="text-sm font-bold text-text-muted uppercase tracking-widest">Friends</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-text-main">4,250</span>
                <span className="text-sm font-bold text-text-muted uppercase tracking-widest">Points</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stats & Bio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column - Stats & Bio */}
        <div className="lg:col-span-4 space-y-8">
          {/* Bio Card */}
          <div className="glass-card p-8">
            <h3 className="text-xl font-bold mb-4 text-text-main">About Me</h3>
            <p className="text-text-muted leading-relaxed mb-6">
              Passionate about Physics and helping others learn! I'm currently preparing for my SATs and love sharing my study notes with the community. Let's grow together! 🚀
            </p>
            <div className="flex flex-wrap gap-2">
              {['Physics', 'Calculus', 'SAT Prep', 'AI Learning', 'Generous'].map((tag) => (
                <span key={tag} className="px-3 py-1 bg-surface-alt/50 border border-border/50 rounded-lg text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Activity & Achievements */}
        <div className="lg:col-span-8 space-y-8">
          {/* Learning Progress */}
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-text-main flex items-center gap-3">
                <TrendingUp size={24} className="text-primary" />
                Learning Progress
              </h3>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Last 30 Days</span>
            </div>
            
            <div className="space-y-6">
              {[
                { label: 'Mathematics', progress: 85, color: 'bg-primary' },
                { label: 'Physics', progress: 72, color: 'bg-secondary' },
                { label: 'English Literature', progress: 45, color: 'bg-accent' },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-text-main">{item.label}</span>
                    <span className="text-text-muted">{item.progress}%</span>
                  </div>
                  <div className="h-3 bg-surface-alt rounded-full overflow-hidden border border-border/30">
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
          <div className="glass-card p-8">
            <h3 className="text-xl font-bold mb-8 text-text-main flex items-center gap-3">
              <Sparkles size={24} className="text-secondary" />
              Recent Achievements
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: 'Generous Contributor', desc: 'Shared 10+ study materials', icon: Award, date: '2 days ago' },
                { title: 'Quiz Master', desc: 'Scored 100% in 5 quizzes', icon: CheckCircle2, date: '1 week ago' },
                { title: 'Early Bird', desc: 'Studied before 6 AM for 7 days', icon: Clock, date: '3 days ago' },
                { title: 'Community Hero', desc: 'Helped 50+ students', icon: Users2, date: 'Yesterday' },
              ].map((achievement, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-surface-alt/30 rounded-2xl border border-border/40 hover:border-primary/20 transition-all group">
                  <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                    <achievement.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-main text-sm">{achievement.title}</h4>
                    <p className="text-[10px] text-text-muted mb-1">{achievement.desc}</p>
                    <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">{achievement.date}</p>
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
