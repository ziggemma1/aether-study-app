import React from 'react';
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
  const { theme } = useAppContext();
  const isLight = theme === 'light';

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Welcome Aboard',
      description: 'Create your account and start your journey.',
      icon: Star,
      progress: 1,
      target: 1,
      isUnlocked: true,
      category: 'usage',
      color: 'text-yellow-500 bg-yellow-500/10'
    },
    {
      id: '2',
      title: 'First Upload',
      description: 'Upload your first study document.',
      icon: Upload,
      progress: 1,
      target: 1,
      isUnlocked: true,
      category: 'usage',
      color: 'text-blue-500 bg-blue-500/10'
    },
    {
      id: '3',
      title: 'Document Pro',
      description: 'Upload 3 documents to your library.',
      icon: FileText,
      progress: 1,
      target: 3,
      isUnlocked: false,
      category: 'usage',
      color: 'text-purple-500 bg-purple-500/10'
    },
    {
      id: '4',
      title: 'Daily Learner',
      description: 'Use the app for 3 consecutive days.',
      icon: Zap,
      progress: 2,
      target: 3,
      isUnlocked: false,
      category: 'usage',
      color: 'text-orange-500 bg-orange-500/10'
    },
    {
      id: '5',
      title: 'Plan Architect',
      description: 'Generate your first personalized study plan.',
      icon: Target,
      progress: 0,
      target: 1,
      isUnlocked: false,
      category: 'academic',
      color: 'text-green-500 bg-green-500/10'
    },
    {
      id: '6',
      title: 'Community Member',
      description: 'Send your first message in a group.',
      icon: MessageSquare,
      progress: 0,
      target: 1,
      isUnlocked: false,
      category: 'social',
      color: 'text-pink-500 bg-pink-500/10'
    },
    {
      id: '7',
      title: 'Library Curator',
      description: 'Organize 5 documents in your library.',
      icon: BookOpen,
      progress: 2,
      target: 5,
      isUnlocked: false,
      category: 'usage',
      color: 'text-indigo-500 bg-indigo-500/10'
    },
    {
      id: '8',
      title: 'Master Scheduler',
      description: 'Complete all tasks on your calendar for a week.',
      icon: Calendar,
      progress: 0,
      target: 7,
      isUnlocked: false,
      category: 'academic',
      color: 'text-cyan-500 bg-cyan-500/10'
    }
  ];

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;
  const overallProgress = (unlockedCount / totalCount) * 100;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-text-main tracking-tight">
            Your <span className="text-primary">Achievements</span>
          </h1>
          <p className="text-text-muted text-sm md:text-base max-w-2xl leading-relaxed">
            Track your progress, earn badges, and unlock rewards as you use the app.
          </p>
        </div>
        
        <div className="glass-card p-6 min-w-[240px] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-main">{unlockedCount}/{totalCount}</p>
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Badges Unlocked</p>
          </div>
        </div>
      </div>

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
        {achievements.map((achievement, idx) => (
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
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  <span>Progress</span>
                  <span>{achievement.progress}/{achievement.target}</span>
                </div>
                <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary/40" 
                    style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {achievement.isUnlocked && (
              <div className="mt-auto pt-4">
                <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
                  Unlocked
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent Activity / Next Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
            <Zap size={20} className="text-orange-500" />
            Next Milestone
          </h3>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <FileText size={32} />
            </div>
            <div className="flex-grow space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-text-main">Document Pro</h4>
                <span className="text-xs font-bold text-text-muted">1/3</span>
              </div>
              <p className="text-xs text-text-muted">Upload 2 more documents to unlock this badge.</p>
              <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: '33%' }} />
              </div>
            </div>
          </div>
        </div>

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
