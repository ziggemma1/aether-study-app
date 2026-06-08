import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

import { 
  Award, 
  Trophy, 
  Star, 
  Zap, 
  Shield, 
  Target, 
  CheckCircle2, 
  Lock,
  FileText,
  Upload,
  BookOpen,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';


interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  progress: number;
  target: number;
  isUnlocked: boolean;
  category: 'usage' | 'social' | 'academic';
  color: string;
}

export default function Achievements() {
  const { theme, achievements: realAchievements } = useAppContext();
  const navigate = useNavigate();
  const isLight = theme === 'light';

  // Map icons from string to component
  const iconMap: Record<string, React.ElementType> = {
    Star, Upload, FileText, Zap, Target, MessageSquare, BookOpen, Calendar
  };

  const achievements = realAchievements.map(a => ({
    ...a,
    icon: iconMap[a.icon] || Star,
    color: a.category === 'usage' ? 'text-blue-500 bg-blue-500/10' : 
           a.category === 'academic' ? 'text-green-500 bg-green-500/10' : 
           'text-pink-500 bg-pink-500/10'
  }));

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;
  const overallProgress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const nextMilestone = achievements.find(a => !a.isUnlocked);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 select-none">
      <PageHeader
        title="Achievements"
        subtitle="Track your progress, earn badges, and unlock rewards as you study."
        action={
          <div className="flex bg-surface border border-border/10 p-3 rounded-2xl items-center gap-3 shadow-soft">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Trophy size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-text-main leading-none">{unlockedCount}/{totalCount}</p>
              <p className="text-[8px] text-text-muted font-black uppercase tracking-widest mt-1">Badges Unlocked</p>
            </div>
          </div>
        }
      />


      {/* Overall Progress Bar */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text-main">Overall Progress</h3>
          <span className="text-sm font-bold text-primary">{Math.round(overallProgress)}%</span>
        </div>
        <div className="h-3 bg-surface-alt rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]"
          />
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {achievements.length === 0 ? (
          <div className="col-span-full">
            <EmptyState 
              title="No Badges Unlocked Yet"
              message="Finish study blocks, quizzes, flashcards and read curriculum books to collect study points and unlock achievements!"
              actionLabel="Start Focus Session"
              onAction={() => navigate('/dashboard')}
              icon={<Award size={24} />}
            />
          </div>
        ) : (
          achievements.map((achievement, idx) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "glass-card p-6 flex flex-col items-center text-center relative group transition-all duration-300",
                achievement.isUnlocked ? "hover:border-primary/50" : "opacity-75 grayscale-[0.5]"
              )}
            >
              {/* Lock Overlay for Locked Achievements */}
              {!achievement.isUnlocked && (
                <div className="absolute top-4 right-4 text-text-muted">
                  <Lock size={16} />
                </div>
              )}

              {/* Badge Icon */}
              <div className={cn(
                "w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 relative transition-transform duration-500 group-hover:scale-110",
                achievement.color
              )}>
                <achievement.icon size={36} />
                {achievement.isUnlocked && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-surface flex items-center justify-center text-white">
                    <CheckCircle2 size={12} />
                  </div>
                )}
              </div>

              <h3 className="font-bold text-text-main mb-2">{achievement.title}</h3>
              <p className="text-xs text-text-muted mb-6 leading-relaxed min-h-[32px]">
                {achievement.description}
              </p>

              {/* Progress for Locked Achievements */}
              {!achievement.isUnlocked && (
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-text-muted">
                    <span>Progress</span>
                    <span>{achievement.currentProgress}/{achievement.target}</span>
                  </div>
                  <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary/40" 
                      style={{ width: `${(achievement.currentProgress / achievement.target) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {achievement.isUnlocked && (
                <div className="mt-auto pt-4">
                  <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
                    Unlocked
                  </span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Recent Activity / Next Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {nextMilestone && (
          <div className="glass-card p-8">
            <h3 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
              <Zap size={20} className="text-orange-500" />
              Next Milestone
            </h3>
            <div className="flex items-center gap-6">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", nextMilestone.color)}>
                <nextMilestone.icon size={32} />
              </div>
              <div className="flex-grow space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-text-main">{nextMilestone.title}</h4>
                  <span className="text-xs font-bold text-text-muted">{nextMilestone.currentProgress}/{nextMilestone.target}</span>
                </div>
                <p className="text-xs text-text-muted">{nextMilestone.description}</p>
                <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${(nextMilestone.currentProgress / nextMilestone.target) * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card p-8">
          <h3 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
            <Shield size={20} className="text-blue-500" />
            Achievement Perks
          </h3>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-sm text-text-muted">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Unlock exclusive profile themes
            </li>
            <li className="flex items-center gap-3 text-sm text-text-muted">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Earn extra cloud storage for documents
            </li>
            <li className="flex items-center gap-3 text-sm text-text-muted">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Get early access to new AI features
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
