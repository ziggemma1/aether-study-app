import React, { useEffect, useRef, useState } from 'react';
import { Clock, Play, Pause, Save, Volume2, VolumeX, Headphones } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

interface StudyTimerProps {
  materialId?: string;
  title: string;
  readContent?: string;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({ materialId, title, readContent }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const secondsRef = useRef(0);
  const startTimeRef = useRef<Date>(new Date());
  const { setStudySessions, showToast, user, t } = useAppContext();
  
  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleAudio = () => {
    if (isPlayingAudio) {
      window.speechSynthesis.pause();
      setIsPlayingAudio(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlayingAudio(true);
      } else {
        if (!readContent) return;
        
        window.speechSynthesis.cancel();
        
        const plainText = readContent
          .replace(/[#*`_]/g, '')
          .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Chunk by sentences to prevent Chrome TTS timeout limit on long text
        const chunks = plainText.match(/[^.!?]+[.!?]+/g) || [plainText];
        
        const langMap: Record<string, string> = {
          'English (US)': 'en-US',
          'English (UK)': 'en-GB',
          'Indonesia': 'id-ID'
        };
        const selectedLang = user?.language ? langMap[user.language] || 'en-US' : 'en-US';

        chunks.forEach((chunkText, idx) => {
          if (!chunkText.trim()) return;
          const u = new SpeechSynthesisUtterance(chunkText.trim());
          u.lang = selectedLang;
          
          if (idx === chunks.length - 1) {
            u.onend = () => setIsPlayingAudio(false);
          }
          u.onerror = () => setIsPlayingAudio(false);
          
          window.speechSynthesis.speak(u);
        });
        
        setIsPlayingAudio(true);
      }
    }
  };

  // If content changes and we're playing, restart
  useEffect(() => {
    if (isPlayingAudio && readContent) {
      window.speechSynthesis.cancel();
      toggleAudio();
    }
  }, [readContent]);

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
    if (currentSeconds < 60) return; // Only save meaningful study sessions (at least 1 minute)

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
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('focus_time')}</span>
            <span className="text-lg font-mono font-bold text-white">{formatTime(seconds)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          {readContent && (
            <button 
              onClick={toggleAudio}
              className={cn(
                "p-2 rounded-lg transition-all",
                isPlayingAudio ? "bg-primary/20 text-primary scale-110" : "hover:bg-white/5 text-slate-400"
              )}
              title={isPlayingAudio ? "Pause Reading" : "Read Notes Aloud"}
            >
              {isPlayingAudio ? <Volume2 size={20} className="animate-pulse" /> : <Headphones size={20} />}
            </button>
          )}
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
