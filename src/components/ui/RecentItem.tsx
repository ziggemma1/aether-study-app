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
          label: 'PDF'
        };
      case 'quiz':
        return {
          icon: <Award size={16} />,
          badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          label: 'Quiz'
        };
      case 'note':
        return {
          icon: <Layers size={16} />,
          badgeClass: 'bg-primary/10 text-primary border-primary/20',
          label: 'Note'
        };
      case 'flashcard':
        return {
          icon: <HelpCircle size={16} />,
          badgeClass: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
          label: 'Flashcard'
        };
    }
  };

  const info = getIconAndStyle();

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
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
          <h4 className="text-xs sm:text-sm font-semibold text-text-main group-hover:text-primary transition-colors pr-2 leading-snug">
            📄 {title}
          </h4>
          
          <div className="flex gap-1.5 items-center mt-1">
            <span className={`text-[11px] font-black tracking-widest border px-1.5 py-0.5 rounded uppercase ${info.badgeClass}`}>
              {info.label}
            </span>
            <span className="text-[11px] text-text-muted font-bold font-mono">
              • Uploaded {date}
            </span>
          </div>

          {/* Progress bar info */}
          {progress > 0 && (
            <div className="flex items-center gap-2 mt-2 w-full max-w-[120px]">
              <div className="h-1 flex-1 bg-surface-alt rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <span className="text-[11px] font-black text-text-muted">{progress}%</span>
            </div>
          )}
        </div>
      </div>

      <ChevronRight size={16} className="text-text-muted shrink-0 group-hover:text-text-main transition-colors" />
    </motion.div>
  );
}
