import React from 'react';
import { Play, Pause, Timer } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PomodoroTimerProps {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  onToggle: () => void;
}

export function PomodoroTimer({ minutes, seconds, isRunning, onToggle }: PomodoroTimerProps) {
  const totalSeconds = 25 * 60; // 25 minutes standard
  const currentSeconds = (minutes * 60) + seconds;
  const progressPercent = ((totalSeconds - currentSeconds) / totalSeconds) * 100;

  return (
    <div className="bg-[#141A24]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 flex items-center justify-between gap-8 w-full max-w-xl mx-auto shadow-2xl relative overflow-hidden group">
      {/* Glow Effect */}
      <div className={cn(
        "absolute inset-0 opacity-0 transition-opacity duration-1000",
        isRunning && "opacity-20"
      )}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-32 bg-[#00D2FF] blur-[100px]" />
      </div>

      <div className="relative z-10 flex items-center gap-4 md:gap-8 flex-1">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#00D2FF]">
          <Timer size={24} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 font-mono text-4xl md:text-5xl font-black tracking-tighter text-white">
            <span className="w-[1.2em] text-center">{String(minutes).padStart(2, '0')}</span>
            <span className={cn("text-[#00D2FF]", isRunning && "animate-pulse")}>:</span>
            <span className="w-[1.2em] text-center">{String(seconds).padStart(2, '0')}</span>
          </div>
          
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
            />
          </div>
        </div>
      </div>

      <button 
        onClick={onToggle}
        className={cn(
          "relative z-10 w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full flex items-center justify-center transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] active:scale-95",
          isRunning 
            ? "bg-white/10 text-white hover:bg-white/15 border border-white/20" 
            : "bg-white text-black hover:scale-105"
        )}
      >
        {isRunning ? <Pause size={24} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
      </button>
    </div>
  );
}
