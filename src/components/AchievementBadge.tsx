import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Trophy, 
  Calendar, 
  Zap, 
  Award, 
  Target, 
  Upload, 
  FileText, 
  BookOpen, 
  MessageSquare, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';
import { cn } from '../lib/utils';

// Icon Map helper
const iconMap: Record<string, React.ElementType> = {
  Star,
  Trophy,
  Calendar,
  Zap,
  Award,
  Target,
  Upload,
  FileText,
  BookOpen,
  MessageSquare
};

export interface AchievementBadgeProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  category: 'streak' | 'time' | 'quiz' | 'material' | 'social';
  points: number;
  onClick?: () => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  title,
  description,
  icon,
  target,
  currentProgress,
  isUnlocked,
  unlockedAt,
  category,
  points,
  onClick
}) => {
  const IconComponent = iconMap[icon] || Award;

  // Category based styles
  const categoryStyles = {
    streak: {
      color: '#F5B042',
      bgClass: 'bg-[#F5B042]/10',
      textClass: 'text-[#F5B042]',
      borderClass: 'border-[#F5B042]/20',
      glowClass: 'shadow-[0_0_15px_rgba(245,176,66,0.35)] hover:border-[#F5B042]/60'
    },
    time: {
      color: '#6C5CE7',
      bgClass: 'bg-[#6C5CE7]/10',
      textClass: 'text-[#6C5CE7]',
      borderClass: 'border-[#6C5CE7]/20',
      glowClass: 'shadow-[0_0_15px_rgba(108,92,231,0.35)] hover:border-[#6C5CE7]/60'
    },
    quiz: {
      color: '#00E5A0',
      bgClass: 'bg-[#00E5A0]/10',
      textClass: 'text-[#00E5A0]',
      borderClass: 'border-[#00E5A0]/20',
      glowClass: 'shadow-[0_0_15px_rgba(0,229,160,0.35)] hover:border-[#00E5A0]/60'
    },
    material: {
      color: '#00D2FF',
      bgClass: 'bg-[#00D2FF]/10',
      textClass: 'text-[#00D2FF]',
      borderClass: 'border-[#00D2FF]/20',
      glowClass: 'shadow-[0_0_15px_rgba(0,210,255,0.35)] hover:border-[#00D2FF]/60'
    },
    social: {
      color: '#FF5E7E',
      bgClass: 'bg-[#FF5E7E]/10',
      textClass: 'text-[#FF5E7E]',
      borderClass: 'border-[#FF5E7E]/20',
      glowClass: 'shadow-[0_0_15px_rgba(255,94,126,0.35)] hover:border-[#FF5E7E]/60'
    }
  };

  const style = categoryStyles[category] || categoryStyles.streak;
  const pct = Math.round(Math.min((currentProgress / target) * 100, 100));

  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        "relative rounded-3xl p-4 flex flex-col items-center justify-between border select-none transition-all duration-300 pointer-events-auto min-h-[190px]",
        isUnlocked 
          ? cn("bg-surface border-border/20", style.glowClass) 
          : "bg-surface-alt/40 border-border/10 opacity-70 grayscale-[0.25]"
      )}
      style={{ contentVisibility: 'auto' }}
    >
      {/* Points indicator top right */}
      <span className={cn(
        "absolute top-3 right-3 text-[11px] font-black uppercase px-2 py-0.5 rounded-full",
        isUnlocked ? style.bgClass + " " + style.textClass : "bg-border/20 text-text-muted"
      )}>
        +{points} AP
      </span>

      {/* Badge Icon circle */}
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center relative mt-2",
        isUnlocked ? style.bgClass + " " + style.textClass : "bg-border/10 text-text-muted"
      )}>
        <IconComponent size={26} />
        {isUnlocked && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-surface flex items-center justify-center text-white">
            <CheckCircle2 size={10} />
          </div>
        )}
      </div>

      {/* Texts with clamp block */}
      <div className="text-center w-full mt-3 flex-grow flex flex-col justify-center">
        <h4 className="font-extrabold text-sm text-text-main line-clamp-1 leading-tight">{title}</h4>
        <p className="text-[11px] text-text-muted line-clamp-2 leading-tight mt-1 max-w-[130px] mx-auto min-h-[30px]">
          {description}
        </p>
      </div>

      {/* Progress slider if locked */}
      <div className="w-full mt-2">
        {isUnlocked ? (
          <div className="text-center">
            <span className="text-[11px] font-bold text-green-500 bg-green-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Unlocked
            </span>
          </div>
        ) : (
          <div className="space-y-1 w-full px-1">
            <div className="flex items-center justify-between text-[11px] font-black uppercase text-text-muted">
              <span>Progress</span>
              <span>{currentProgress}/{target}</span>
            </div>
            <div className="h-1 bg-border/20 rounded-full overflow-hidden">
              <div 
                className={cn("h-full", style.bgClass.replace('/10', ''))} 
                style={{ width: `${pct}%`, backgroundColor: style.color }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
