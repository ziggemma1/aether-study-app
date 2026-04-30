import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MoreHorizontal, Layout, Code, PenTool } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

const classes = [
  {
    id: 1,
    title: 'Mathematics (Algebra)',
    tags: ['Nigeria', 'WAEC', 'Chapter 2'],
    progress: 75,
    color: 'bg-violet-900/20',
    lightColor: 'bg-violet-100',
    icon: Layout,
    iconBg: 'bg-violet-900/40',
    lightIconBg: 'bg-violet-200',
    iconColor: 'text-violet-400',
    lightIconColor: 'text-violet-600',
  },
  {
    id: 2,
    title: 'English Language',
    tags: ['USA', 'SAT', 'Grammar'],
    progress: 45,
    color: 'bg-indigo-900/20',
    lightColor: 'bg-indigo-100',
    icon: Code,
    iconBg: 'bg-indigo-900/40',
    lightIconBg: 'bg-indigo-200',
    iconColor: 'text-indigo-400',
    lightIconColor: 'text-indigo-600',
  },
  {
    id: 3,
    title: 'Biology (Cells)',
    tags: ['Indonesia', 'UTBK', 'Chapter 1'],
    progress: 90,
    color: 'bg-amber-900/20',
    lightColor: 'bg-amber-100',
    icon: PenTool,
    iconBg: 'bg-amber-900/40',
    lightIconBg: 'bg-amber-200',
    iconColor: 'text-amber-400',
    lightIconColor: 'text-amber-600',
  },
];

export default function OngoingClasses() {
  const { theme } = useAppContext();
  const isLight = theme === 'light';

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-text-main">Ongoing Class</h2>
          <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">+4 Class</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-surface rounded-full transition-colors border border-transparent hover:border-border text-text-muted">
            <ChevronLeft size={18} />
          </button>
          <button className="p-1.5 hover:bg-surface rounded-full transition-colors border border-transparent hover:border-border text-text-muted">
            <ChevronRight size={18} />
          </button>
          <button className="p-1.5 hover:bg-surface rounded-full transition-colors border border-transparent hover:border-border ml-2 text-text-muted">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
        {classes.map((cls) => (
          <motion.div
            key={cls.id}
            whileHover={{ y: -4 }}
            className={cn(
              "min-w-[320px] flex-shrink-0 p-8 rounded-[40px] border border-border shadow-sm relative overflow-hidden",
              isLight ? cls.lightColor : cls.color
            )}
          >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
            
            <div className="flex items-center justify-between mb-8">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm", isLight ? cls.lightIconBg : cls.iconBg, isLight ? cls.lightIconColor : cls.iconColor)}>
                <cls.icon size={28} />
              </div>
              <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-muted">
                <MoreHorizontal size={20} />
              </button>
            </div>

            <h3 className="text-2xl font-bold mb-6 text-text-main">{cls.title}</h3>

            <div className="flex flex-wrap gap-2 mb-10">
              {cls.tags.map((tag) => (
                <span key={tag} className="px-4 py-1.5 bg-surface/50 backdrop-blur-sm rounded-full text-xs font-semibold text-text-muted border border-border">
                  {tag}
                </span>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-text-muted uppercase tracking-widest">
                <span>On Progress</span>
                <span className="text-text-main">{cls.progress}%</span>
              </div>
              <div className="h-2.5 bg-surface border border-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cls.progress}%` }}
                  className={cn("h-full rounded-full", isLight ? cls.lightIconColor.replace('text', 'bg') : cls.iconColor.replace('text', 'bg'))}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
