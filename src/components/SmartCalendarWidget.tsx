import React, { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  Brain, 
  Zap, 
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartEvent {
  id: number;
  title: string;
  time: string;
  duration: string;
  type: 'study' | 'break' | 'review';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

const initialEvents: SmartEvent[] = [
  { id: 1, title: 'Deep Work: Calculus III', time: '09:00 AM', duration: '90 min', type: 'study', priority: 'high', completed: true },
  { id: 2, title: 'Quick Review: Physics Notes', time: '11:00 AM', duration: '30 min', type: 'review', priority: 'medium', completed: false },
  { id: 3, title: 'Mindfulness Break', time: '11:30 AM', duration: '15 min', type: 'break', priority: 'low', completed: false },
  { id: 4, title: 'AI Quiz: Organic Chemistry', time: '02:00 PM', duration: '45 min', type: 'study', priority: 'high', completed: false },
  { id: 5, title: 'Lab Prep: Biology', time: '03:00 PM', duration: '60 min', type: 'study', priority: 'medium', completed: false },
  { id: 6, title: 'Evening Review', time: '05:00 PM', duration: '30 min', type: 'review', priority: 'low', completed: false },
  { id: 7, title: 'Project Brainstorm', time: '06:00 PM', duration: '45 min', type: 'study', priority: 'medium', completed: false },
];

interface SmartCalendarWidgetProps {
  className?: string;
}

export default function SmartCalendarWidget({ className }: SmartCalendarWidgetProps) {
  const [events, setEvents] = useState<SmartEvent[]>(initialEvents);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const toggleEvent = (id: number) => {
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, completed: !event.completed } : event
    ));
  };

  const regenerateSchedule = () => {
    setIsRegenerating(true);
    // Simulate AI thinking
    setTimeout(() => {
      const shuffled = [...events].sort(() => Math.random() - 0.5);
      setEvents(shuffled.map(e => ({ ...e, completed: false })));
      setIsRegenerating(false);
    }, 1500);
  };

  return (
    <div className={cn("glass-card p-6 flex flex-col relative overflow-hidden border-border/30 dark:bg-surface/30 shadow-sm", className)}>
      {/* AI Glow Effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 blur-3xl rounded-full" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-main leading-tight">Smart Schedule</h2>
            <p className="text-[10px] font-bold text-text-muted/70 uppercase tracking-wider">AI-Optimized for You</p>
          </div>
        </div>
        
        <button 
          onClick={regenerateSchedule}
          disabled={isRegenerating}
          className={cn(
            "text-[10px] font-bold text-primary hover:text-primary/80 transition-all uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10",
            isRegenerating && "opacity-50 cursor-not-allowed"
          )}
        >
          {isRegenerating ? (
            <>Thinking... <RefreshCw size={12} className="animate-spin" /></>
          ) : (
            <>Regenerate <Zap size={12} /></>
          )}
        </button>
      </div>

      {/* Daily Focus */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-8 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <Brain size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-text-main">Today's Focus Goal</h3>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          {events.some(e => e.priority === 'high' && !e.completed) 
            ? `Focus on completing your ${events.find(e => e.priority === 'high' && !e.completed)?.title} session today.`
            : "Great job! You've completed your high-priority tasks for today."}
        </p>
      </div>

      {/* Timeline/Events */}
      <div className="space-y-4 flex-grow relative z-10 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="popLayout">
          {events.map((event, idx) => (
            <motion.div 
              key={event.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => toggleEvent(event.id)}
              className={cn(
                "group p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4",
                event.completed 
                  ? "bg-surface-alt/10 border-border/10 opacity-60" 
                  : "bg-surface-alt/20 border-border/30 hover:border-primary/30 hover:shadow-md"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                event.completed ? "bg-green-500/20 text-green-500 scale-90" :
                event.type === 'study' ? "bg-primary/10 text-primary" :
                event.type === 'break' ? "bg-green-500/10 text-green-500" :
                "bg-purple-500/10 text-purple-500"
              )}>
                {event.completed ? <CheckCircle2 size={18} /> : <Clock size={18} />}
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className={cn(
                    "text-sm font-bold text-text-main truncate transition-all",
                    event.completed && "line-through text-text-muted"
                  )}>{event.title}</h4>
                  <span className="text-[10px] font-medium text-text-muted">{event.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-text-muted flex items-center gap-1">
                    <Clock size={10} /> {event.duration}
                  </span>
                  {!event.completed && (
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                      event.priority === 'high' ? "bg-red-500/10 text-red-500" :
                      event.priority === 'medium' ? "bg-orange-500/10 text-orange-500" :
                      "bg-primary/10 text-primary"
                    )}>
                      {event.priority}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Action */}
      <button 
        onClick={() => alert("Full timeline view coming soon!")}
        className="mt-8 w-full py-3 bg-surface-alt/40 hover:bg-surface-alt border border-border/30 rounded-xl text-xs font-bold text-text-muted hover:text-text-main transition-all flex items-center justify-center gap-2"
      >
        <CalendarIcon size={14} />
        View Full Timeline
      </button>
    </div>
  );
}
