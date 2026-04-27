import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Clock, Play, Pause, Save, Volume2, Headphones, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

interface StudyTimerProps {
  materialId?: string;
  title: string;
  readContent?: string;
}

export const StudyTimer: React.FC<StudyTimerProps> = ({ materialId, title, readContent }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(
    localStorage.getItem('study_voice_uri') || ''
  );

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const secondsRef = useRef(0);
  const startTimeRef = useRef<Date>(new Date());
  const { setStudySessions, showToast, user, t } = useAppContext();
  
  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const langMap: Record<string, string> = useMemo(() => ({
    'English (US)': 'en-US',
    'English (UK)': 'en-GB',
    'Indonesia': 'id-ID'
  }), []);

  const selectedLangCode = useMemo(() => {
    return user?.language ? langMap[user.language] || 'en-US' : 'en-US';
  }, [user?.language, langMap]);

  const relevantVoices = useMemo(() => {
    const baseLang = selectedLangCode.split('-')[0];
    const matchLang = voices.filter(v => v.lang.startsWith(baseLang));
    // If no voices match the language, just return all voices
    return matchLang.length > 0 ? matchLang : voices;
  }, [voices, selectedLangCode]);

  const AETHER_NAMES = ['Nova', 'Aura', 'Cosmos', 'Atlas', 'Echo', 'Luna', 'Orion', 'Stella'];
  
  const voiceOptions = useMemo(() => {
    return relevantVoices.slice(0, 8).map((v, i) => ({
      uri: v.voiceURI,
      name: AETHER_NAMES[i] || `Voice ${i + 1}`,
      original: v
    }));
  }, [relevantVoices]);

  const currentVoiceIndex = Math.max(0, voiceOptions.findIndex(v => v.uri === selectedVoiceURI));

  const cycleVoice = () => {
    if (voiceOptions.length <= 1) return;
    const nextIndex = (currentVoiceIndex + 1) % voiceOptions.length;
    const nextURI = voiceOptions[nextIndex].uri;
    setSelectedVoiceURI(nextURI);
    localStorage.setItem('study_voice_uri', nextURI);
    if (isPlayingAudio) {
       window.speechSynthesis.cancel();
       setIsPlayingAudio(false);
       setTimeout(() => toggleAudio(true), 100);
    }
  };

  const toggleAudio = (forcePlay?: boolean) => {
    const shouldPlay = forcePlay !== undefined ? forcePlay : !isPlayingAudio;
    
    if (!shouldPlay) {
      window.speechSynthesis.pause();
      // sometimes pause doesn't fully stop in some browsers, so cancel is safer for "stop"
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      if (window.speechSynthesis.paused && isPlayingAudio) {
        window.speechSynthesis.resume();
        setIsPlayingAudio(true);
      } else {
        if (!readContent) return;
        
        window.speechSynthesis.cancel();
        
        const plainText = readContent
          .replace(/[#*`_]/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Chunk by sentences to prevent Chrome TTS timeout limit on long text
        const chunks = plainText.match(/[^.!?]+[.!?]+/g) || [plainText];
        
        const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);

        chunks.forEach((chunkText, idx) => {
          if (!chunkText.trim()) return;
          const u = new SpeechSynthesisUtterance(chunkText.trim());
          u.lang = selectedLangCode;
          if (selectedVoice) {
            u.voice = selectedVoice;
          }
          
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
      setIsPlayingAudio(false);
      setTimeout(() => toggleAudio(true), 50);
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
    <div className="fixed bottom-[140px] right-4 z-[60] lg:bottom-8 lg:right-8 transition-transform hover:-translate-y-1">
      <motion.div 
        layout
        className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 sm:p-3 shadow-2xl flex flex-col items-center relative overflow-hidden ring-1 ring-white/5 w-[52px] sm:w-[88px]"
      >
        {/* Glow effect */}
        {isActive && (
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/20 via-transparent to-transparent pointer-events-none" />
        )}
        
        {/* Time Display Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-col items-center justify-center bg-black/50 rounded-full w-10 h-10 sm:w-16 sm:h-16 border border-white/10 shadow-inner relative z-10 transition-colors hover:bg-white/5 active:scale-95"
        >
          <Clock className={cn("text-primary sm:mb-0.5 w-[10px] h-[10px] sm:w-3.5 sm:h-3.5", isActive ? "animate-pulse" : "opacity-30")} />
          <span className="text-[10px] sm:text-sm font-mono font-semibold text-white tracking-tight leading-none mt-0.5 sm:mt-0">
            {formatTime(seconds)}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute -bottom-1"
          >
            <ChevronDown className="text-white/40 mb-1 w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </motion.div>
        </button>
        
        {/* Exandable Controls */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2 sm:gap-3 relative z-10 w-full overflow-hidden"
            >
              <div className="w-6 sm:w-8 h-[1px] bg-white/10 mt-2 sm:mt-3" />

              {readContent && (
                <div className="flex flex-col items-center gap-1 w-full px-1">
                  <button 
                    onClick={() => toggleAudio()}
                    className={cn(
                      "w-8 h-8 sm:w-12 sm:h-12 rounded-full transition-all flex items-center justify-center relative mx-auto",
                      isPlayingAudio 
                        ? "bg-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]" 
                        : "bg-white/5 hover:bg-white/10 text-slate-300"
                    )}
                    title={isPlayingAudio ? "Pause Reading" : "Read Notes Aloud"}
                  >
                    {isPlayingAudio ? <Volume2 className="animate-pulse w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" /> : <Headphones className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />}
                  </button>
                  
                  {voiceOptions.length > 1 && (
                    <button
                      onClick={cycleVoice}
                      className="mt-2 sm:mt-2.5 bg-white/10 hover:bg-white/20 active:bg-white/5 border border-white/10 outline-none text-white rounded-full py-1.5 px-2 sm:px-3 cursor-pointer focus:ring-1 focus:ring-primary/50 text-center transition-all w-full max-w-[100px] flex items-center justify-center gap-1 shadow-sm backdrop-blur-sm truncate"
                      title="Tap to change Voice"
                    >
                      <span className="text-[10px] sm:text-xs font-semibold min-w-0 truncate tracking-wide text-white drop-shadow-md">
                        {voiceOptions[currentVoiceIndex]?.name || 'Auto'}
                      </span>
                    </button>
                  )}
                </div>
              )}

              <button 
                onClick={() => setIsActive(!isActive)}
                className={cn(
                  "w-8 h-8 sm:w-12 sm:h-12 rounded-full transition-all flex items-center justify-center border border-white/5",
                  isActive ? "bg-white/10 text-white hover:bg-white/20" : "bg-primary/20 text-primary hover:bg-primary/30"
                )}
                title={isActive ? "Pause Timer" : "Start Timer"}
              >
                {isActive ? <Pause className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" /> : <Play className="ml-0.5 sm:ml-1 w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />}
              </button>
              
              <button 
                onClick={() => {
                  saveSession();
                  if (seconds >= 10) showToast('Session saved!');
                  setSeconds(0);
                  startTimeRef.current = new Date();
                }}
                disabled={seconds < 10}
                className="w-8 h-8 sm:w-12 sm:h-12 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-full transition-all disabled:opacity-30 disabled:hover:bg-emerald-500/20 disabled:hover:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-lg mb-1"
                title="Save Session"
              >
                <Save className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

