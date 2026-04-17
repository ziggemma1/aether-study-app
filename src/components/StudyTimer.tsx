import React, { useEffect, useRef, useState } from 'react';
import { Clock, Play, Pause, Save } from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

interface StudyTimerProps {
  materialId?: string;
  title: string;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({ materialId, title }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const secondsRef = useRef(0);
  const startTimeRef = useRef<Date>(new Date());
  const { setStudySessions, showToast } = useAppContext();
  
  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveSession = async () => {
    const currentSeconds = secondsRef.current;
    if (currentSeconds < 10) return; // For testing, let's lower it to 10 seconds

    try {
      const response = await api.post('/sessions', {
        title: `Study: ${title}`,
        startTime: startTimeRef.current,
        durationMinutes: Math.max(1, Math.ceil(currentSeconds / 60)),
        type: 'study',
        completed: true
      });
      console.log('Study session saved automatically:', title);
      
      const newSession = {
        ...response.data,
        id: response.data._id || response.data.id
      };
      setStudySessions(prev => [...prev, newSession]);
    } catch (error) {
      console.error('Failed to save study session:', error);
    }
  };

  // Auto-save on unmount
  useEffect(() => {
    return () => {
      if (secondsRef.current >= 10) {
        saveSession();
      }
    };
  }, []);

  return (
    <div className="fixed bottom-20 right-4 z-50 sm:bottom-8 sm:right-8">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
            <Clock size={20} className={isActive ? "animate-pulse" : ""} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Focus Time</span>
            <span className="text-lg font-mono font-bold text-white">{formatTime(seconds)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          <button 
            onClick={() => setIsActive(!isActive)}
            className="p-2 hover:bg-white/5 rounded-lg text-white transition-colors"
          >
            {isActive ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button 
            onClick={() => {
              saveSession();
              showToast('Session saved!');
              setSeconds(0);
              startTimeRef.current = new Date();
            }}
            disabled={seconds < 10}
            className="p-2 hover:bg-white/5 rounded-lg text-primary transition-colors disabled:opacity-30"
            title="Save Session"
          >
            <Save size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
