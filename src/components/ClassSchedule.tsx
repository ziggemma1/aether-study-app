import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Calendar as CalendarIcon, Layout, Code, PenTool, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';

const schedules = [
  {
    id: 1,
    title: 'Math: Algebra',
    time: '10 am - 12 am',
    progress: 75,
    color: 'bg-violet-900/20',
    lightColor: 'bg-violet-100',
    textColor: 'text-violet-400',
    lightTextColor: 'text-violet-600',
    icon: Layout,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Math',
    top: '10%',
    left: '40%',
    width: '45%',
  },
  {
    id: 2,
    title: 'English: Grammar',
    time: '1 pm - 2 pm',
    progress: 100,
    color: 'bg-cyan-900/20',
    lightColor: 'bg-cyan-100',
    textColor: 'text-cyan-400',
    lightTextColor: 'text-cyan-600',
    icon: PenTool,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=English',
    top: '40%',
    left: '10%',
    width: '40%',
  },
  {
    id: 3,
    title: 'Biology: Cells',
    time: '3 pm - 4 pm',
    progress: 80,
    color: 'bg-blue-900/20',
    lightColor: 'bg-blue-100',
    textColor: 'text-blue-400',
    lightTextColor: 'text-blue-600',
    icon: Code,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bio',
    top: '70%',
    left: '25%',
    width: '50%',
  },
];

const timelineDates = ['23 Mar', '24 Mar', '25 Mar', '26 Mar', '27 Mar', '28 Mar'];

export default function ClassSchedule() {
  const { theme } = useAppContext();
  const isLight = theme === 'light';

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-alt rounded-2xl flex items-center justify-center text-text-muted">
            <CalendarIcon size={20} />
          </div>
          <h2 className="text-lg font-bold text-text-main">Class Schedule</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-surface-alt rounded-lg text-xs font-bold text-text-muted border border-border">
            March <ChevronDown size={14} />
          </button>
          <button className="p-1.5 hover:bg-surface-alt rounded-full transition-colors border border-border text-text-muted">
            <Plus size={18} />
          </button>
          <button className="p-1.5 hover:bg-surface-alt rounded-full transition-colors border border-border text-text-muted">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="flex-grow relative min-h-[300px] border-l border-border ml-6">
        {/* Vertical Grid Lines */}
        <div className="absolute inset-0 flex justify-between pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-full w-px bg-border/50" />
          ))}
        </div>

        {/* Current Time Indicator */}
        <div className="absolute top-0 bottom-0 left-[75%] w-px bg-primary border-dashed border-l z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-4 border-background shadow-sm" />
        </div>

        {/* Schedule Blocks */}
        <div className="relative h-full py-4">
          {schedules.map((schedule) => (
            <motion.div
              key={schedule.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02 }}
              className={cn(
                "absolute p-4 rounded-[24px] flex items-center justify-between shadow-sm border border-border backdrop-blur-sm cursor-pointer transition-all",
                isLight ? schedule.lightColor : schedule.color
              )}
              style={{
                top: schedule.top,
                left: schedule.left,
                width: schedule.width,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-alt/50 flex items-center justify-center shadow-inner">
                  <schedule.icon size={18} className={isLight ? schedule.lightTextColor : schedule.textColor} />
                </div>
                <div>
                  <p className={cn("text-xs font-bold leading-none mb-1", isLight ? schedule.lightTextColor : schedule.textColor)}>
                    {schedule.title}
                  </p>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    {schedule.time}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs font-bold", isLight ? schedule.lightTextColor : schedule.textColor)}>{schedule.progress}%</span>
                <img src={schedule.avatar} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-border shadow-md" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-6 px-4">
        {timelineDates.map((date) => (
          <span key={date} className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            {date}
          </span>
        ))}
      </div>
    </div>
  );
}
