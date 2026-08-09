import React, { useState, useEffect } from 'react';
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
import { useAppContext } from '../context/AppContext';
import api from '../services/api';
import { StudySession } from '../types';
import { celebrate } from '../lib/motion';

interface SmartCalendarWidgetProps {
  className?: string;
}

export default function SmartCalendarWidget({ className }: SmartCalendarWidgetProps) {
  const { studySessions, setStudySessions, user, setUser, showToast } = useAppContext();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const toggleEvent = async (id: string) => {
    const session = studySessions.find(s => s.id === id);
    if (!session) return;

    const newCompleted = !session.completed;

    // Optimistic update
    setStudySessions(prev => prev.map(s =>
      s.id === id ? { ...s, completed: newCompleted } : s
    ));

    try {
      const { data } = await api.put(`/sessions/${id}`, { completed: newCompleted });

      // Checking off a study block now actually credits it server-side
      // (points, study time, streak) — apply the result instead of leaving
      // the balances stale until the next full reload.
      if (newCompleted && data.aetherPoints !== undefined && user) {
        const extendedStreak =
          typeof data.streak === 'number' && data.streak > (user.streak || 0);
        void celebrate(extendedStreak ? 'milestone' : 'win');

        setUser({
          ...user,
          aetherPoints: data.aetherPoints,
          streak: data.streak ?? user.streak,
          totalStudyTime: data.totalStudyTime ?? user.totalStudyTime,
          freezeTokens: data.freezeTokens ?? user.freezeTokens
        });

        if (data.freezeUsed) {
          showToast(`A streak freeze covered yesterday — ${data.freezeTokens} left.`, 'success');
        }
      }

      if (Array.isArray(data.newlyUnlockedAchievements)) {
        data.newlyUnlockedAchievements.forEach((badge: any) => {
          window.dispatchEvent(new CustomEvent('achievement:unlocked', { detail: badge }));
        });
      }
    } catch (err) {
      console.error('Error updating session:', err);
      // Revert on error
      setStudySessions(prev => prev.map(s =>
        s.id === id ? { ...s, completed: !newCompleted } : s
      ));
    }
  };

  const regenerateSchedule = async () => {
    if (!user) return;
    setIsRegenerating(true);
    
    try {
      // In a real app, this would call an AI service
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { data } = await api.get('/sessions');
      setStudySessions(data);
    } catch (err) {
      console.error('Error regenerating schedule:', err);
    } finally {
      setIsRegenerating(false);
    }
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
            <p className="text-[11px] font-bold text-text-muted/70 uppercase tracking-wider">AI-Optimized for You</p>
          </div>
        </div>
        
        <button 
          onClick={regenerateSchedule}
          disabled={isRegenerating}
          className={cn(
            "text-[11px] font-bold text-primary hover:text-primary/80 transition-all uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10",
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
          {Array.isArray(studySessions) && studySessions.some(e => e.priority === 'high' && !e.completed) 
            ? `Focus on completing your ${studySessions.find(e => e.priority === 'high' && !e.completed)?.title} session today.`
            : (Array.isArray(studySessions) && studySessions.length > 0) ? "Great job! You've completed your high-priority tasks for today." : "No study sessions scheduled for today."}
        </p>
      </div>

      {/* Timeline/Events */}
      <div className="space-y-4 flex-grow relative z-10 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {Array.isArray(studySessions) && studySessions.map((event, idx) => (
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
                event.completed ? "bg-accent/20 text-accent scale-90" :
                event.type === 'study' ? "bg-primary/10 text-primary" :
                event.type === 'break' ? "bg-accent/10 text-accent" :
                "bg-primary/10 text-primary"
              )}>
                {event.completed ? <CheckCircle2 size={18} /> : <Clock size={18} />}
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className={cn(
                    "text-sm font-bold text-text-main truncate transition-all",
                    event.completed && "line-through text-text-muted"
                  )}>{event.title}</h4>
                  <span className="text-[11px] font-medium text-text-muted">
                    {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-text-muted flex items-center gap-1">
                    <Clock size={10} /> {event.durationMinutes} min
                  </span>
                  {!event.completed && (
                    <span className={cn(
                      "text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                      event.priority === 'high' ? "bg-brand-pink/10 text-brand-pink" :
                      event.priority === 'medium' ? "bg-brand-orange/10 text-brand-orange" :
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
          {(!Array.isArray(studySessions) || studySessions.length === 0) && !isRegenerating && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarIcon size={48} className="text-text-muted opacity-20 mb-4" />
              <p className="text-sm text-text-muted">No sessions scheduled.</p>
              <button 
                onClick={regenerateSchedule}
                className="mt-4 text-xs text-primary font-bold hover:underline"
              >
                Generate a smart schedule
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action */}
      <div className="mt-8 w-full py-3 bg-surface-alt/40 border border-border/30 rounded-xl text-xs font-bold text-text-muted flex items-center justify-center gap-2">
        <CalendarIcon size={14} />
        Smart Schedule Active
      </div>
    </div>
  );
}
