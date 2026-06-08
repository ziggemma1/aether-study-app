import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Award, Layers, HelpCircle, ChevronRight } from 'lucide-react';

interface RecentItemProps {
  title: string;
  date: string;
  type: 'pdf' | 'quiz' | 'note' | 'flashcard';
  progress?: number;
  onClick: () => void;
}

export function RecentItem({ title, date, type, progress = 0, onClick }: RecentItemProps) {
  const getIconAndStyle = () => {
    switch (type) {
      case 'pdf':
        return {
          icon: <FileText size={16} />,
          badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          label: 'PDF SOURCE'
        };
      case 'quiz':
        return {
          icon: <Award size={16} />,
          badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          label: 'STUDY QUIZ'
        };
      case 'note':
        return {
          icon: <Layers size={16} />,
          badgeClass: 'bg-primary/10 text-primary border-primary/20',
          label: 'AI NOTES'
        };
      case 'flashcard':
        return {
          icon: <HelpCircle size={16} />,
          badgeClass: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
          label: 'FLASHCARDS'
        };
    }
  };

  const info = getIconAndStyle();

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
      className="card-hover select-none p-3.5 sm:p-4 bg-surface border border-border/10 rounded-2xl flex items-center justify-between gap-3 cursor-pointer group active:bg-surface-alt/70"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Type Icon indicator */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-current/15 ${info.badgeClass}`}>
          {info.icon}
        </div>

        {/* Text information */}
        <div className="min-w-0 flex-1">
          <div className="flex gap-1.5 items-center">
            <span className={`text-[8px] font-black tracking-widest border px-1.5 py-0.5 rounded ${info.badgeClass}`}>
              {info.label}
            </span>
            <span className="text-[10px] text-text-muted font-bold font-mono">
              {date}
            </span>
          </div>
          
          <h4 className="text-xs sm:text-sm font-semibold text-text-main mt-1 truncate group-hover:text-primary transition-colors pr-2">
            {title}
          </h4>

          {/* Progress bar info */}
          {progress > 0 && (
            <div className="flex items-center gap-2 mt-2 w-full max-w-[120px]">
              <div className="h-1 flex-1 bg-surface-alt rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <span className="text-[9px] font-black text-text-muted">{progress}%</span>
            </div>
          )}
        </div>
      </div>

      <ChevronRight size={16} className="text-text-muted shrink-0 group-hover:text-text-main transition-colors" />
    </motion.div>
  );
}
