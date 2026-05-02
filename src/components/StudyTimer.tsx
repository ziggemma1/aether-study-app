import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Clock, Play, Pause, Save, Volume2, Headphones, ChevronUp, ChevronDown, Music, ShieldAlert, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

import { getSocket } from '../services/socket';

interface StudyTimerProps {
  materialId?: string;
  title: string;
  readContent?: string;
}

const AMBIENT_TRACKS = [
  { id: 'none', label: 'No ambient', url: '' },
  { id: 'rain', label: 'Rain Focus', url: 'https://cdn.jsdelivr.net/gh/EgeOnat/ambient-sounds/sounds/rain.mp3' },
  { id: 'cafe', label: 'Cafe Chatter', url: 'https://cdn.jsdelivr.net/gh/EgeOnat/ambient-sounds/sounds/cafe.mp3' },
  { id: 'lofi', label: 'Lofi Chill', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3' },
  { id: 'nature', label: 'Nature Birds', url: 'https://cdn.jsdelivr.net/gh/EgeOnat/ambient-sounds/sounds/forest.mp3' },
  { id: 'waves', label: 'Ocean Waves', url: 'https://cdn.jsdelivr.net/gh/EgeOnat/ambient-sounds/sounds/ocean.mp3' },
  { id: 'white_noise', label: 'White Noise', url: 'https://cdn.jsdelivr.net/gh/EgeOnat/ambient-sounds/sounds/white-noise.mp3' },
  { id: 'library', label: 'Old Library', url: 'https://cdn.jsdelivr.net/gh/scottschiller/SoundManager2/demo/_mp3/rain.mp3' }
];

export const StudyTimer: React.FC<StudyTimerProps> = ({ materialId, title, readContent }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [deepFocus, setDeepFocus] = useState(false);
  const [ambientTrack, setAmbientTrack] = useState(AMBIENT_TRACKS[0]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(
    localStorage.getItem('study_voice_uri') || ''
  );

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const secondsRef = useRef(0);
  const startTimeRef = useRef<Date>(new Date());
  const { setStudySessions, showToast, user, t, setUser, fetchAppData } = useAppContext();
  const socketRef = useRef<any>(null);
  
  useEffect(() => {
    secondsRef.current = seconds;
    // Sync with room if materialId starts with "room"
    if (isActive && socketRef.current && materialId?.startsWith('room')) {
      socketRef.current.emit("sync_pomodoro", { 
        roomId: materialId.replace('room:', ''), 
        timeLeft: seconds, 
        isPaused: !isActive 
      });
    }
  }, [seconds, isActive, materialId]);

  useEffect(() => {
    socketRef.current = getSocket();
    const socket = socketRef.current;
    
    if (socket && materialId?.startsWith('room')) {
      socket.on("timer_sync", (data: { userId: string, timeLeft: number, isPaused: boolean }) => {
        // Only update if we are not the one who sent it (socket.io usually doesn't send back to self anyway)
        // But for "live rooms" we might want to follow a host or just see highwater marks
        // For now, we'll just let it be independent per user but visible in participants list if we wanted
      });
    }

    return () => {
      if (socket) socket.off("timer_sync");
    };
  }, [materialId]);

  // Deep Focus visibilitychange listener
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && deepFocus && isActive) {
        setIsActive(false);
        showToast("Deep Focus failed! You left the app during a session.", "error");
        
        try {
          const res = await api.post('/users/penalize', { amount: 50 });
          if (setUser && user) {
             setUser({ ...user, aetherPoints: res.data.aetherPoints });
          }
        } catch (e) {
          console.error("Failed to apply penalty", e);
        }

        if (ambientTrack.url && audioRef.current) {
          audioRef.current.pause();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [deepFocus, isActive, ambientTrack]);

  const [ambientVolume, setAmbientVolume] = useState(0.3);
  const [isSelectingAmbient, setIsSelectingAmbient] = useState(false);
  const [isAmbientLoading, setIsAmbientLoading] = useState(false);

  // Audio event listeners
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const onPlaying = () => setIsAmbientLoading(false);
    const onLoadStart = () => {
      if (ambientTrack.url) setIsAmbientLoading(true);
    };
    const onError = () => {
      setIsAmbientLoading(false);
      if (ambientTrack.url && isActive) {
        showToast(`Failed to load: ${ambientTrack.label}`, "error");
      }
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('error', onError);
    };
  }, [ambientTrack, isActive]);

  // Handle ambient track changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = ambientVolume;
      if (ambientTrack.url && isActive) {
        audioRef.current.src = ambientTrack.url;
        audioRef.current.play().catch(e => console.warn("Audio playback failed (likely due to missing user interaction):", e.message));
      } else {
        audioRef.current.pause();
      }
    }
  }, [ambientTrack, isActive, ambientVolume]);

  const cycleAmbient = () => {
    setIsSelectingAmbient(!isSelectingAmbient);
  };

  const selectAmbient = (track: typeof AMBIENT_TRACKS[0]) => {
    setAmbientTrack(track);
    setIsSelectingAmbient(false);
    showToast(`Track: ${track.label}`, 'success');
  };

  useEffect(() => {
    if (!audioRef.current) {
       audioRef.current = new Audio();
       audioRef.current.loop = true;
       audioRef.current.volume = ambientVolume;
       audioRef.current.crossOrigin = "anonymous";
    }
    return () => {
       if (audioRef.current) {
         audioRef.current.pause();
         audioRef.current.src = "";
       }
    };
  }, []);

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
    
    const durationMinutes = Math.max(1, Math.ceil(currentSeconds / 60));
    // Let's say 1 minute = 10 Aether points
    let earnedPoints = durationMinutes * 10;

    try {
      const response = await api.post('/sessions', {
        title: `Study: ${title}`,
        startTime: startTimeRef.current,
        durationMinutes: durationMinutes,
        type: 'study',
        completed: true
      });
      console.log('Study session saved automatically:', title);
      
      const newSession = {
        ...response.data,
        id: response.data._id || response.data.id
      };
      setStudySessions(prev => [...prev, newSession]);
      
      // Refresh global app data (including leaderboard)
      if (fetchAppData) {
        await fetchAppData();
      }
      
      // Update points locally. In a real backend, the session creation might trigger this.
      if (typeof window !== 'undefined') {
          showToast(`Session saved! Earned ${earnedPoints} Aether Points ⚡`);
      }
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
    <div className="fixed bottom-40 right-6 z-[60] lg:bottom-8 lg:right-8 transition-transform hover:-translate-y-1 flex gap-2 items-end">
      
      {isExpanded && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col items-center gap-3 ring-1 ring-white/5"
        >
          {readContent && (
             <div className="flex flex-col items-center gap-1 w-full border-b border-white/10 pb-3">
               <button 
                 onClick={() => toggleAudio()}
                 className={cn(
                   "w-10 h-10 rounded-full transition-all flex items-center justify-center relative mx-auto",
                   isPlayingAudio 
                     ? "bg-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]" 
                     : "bg-white/5 hover:bg-white/10 text-slate-300"
                 )}
                 title={isPlayingAudio ? "Pause Reading" : "Read Notes Aloud"}
               >
                 {isPlayingAudio ? <Volume2 className="animate-pulse w-4 h-4" /> : <Headphones className="w-4 h-4" />}
               </button>
               {voiceOptions.length > 1 && (
                 <button
                   onClick={cycleVoice}
                   className="mt-1 bg-white/10 hover:bg-white/20 active:bg-white/5 border border-white/10 text-white rounded-full py-1 px-2 text-[10px] sm:text-xs font-semibold cursor-pointer w-[68px] truncate drop-shadow-md text-center max-w-[100px]"
                   title="Tap to change Voice"
                 >
                   {voiceOptions[currentVoiceIndex]?.name || 'Auto'}
                 </button>
               )}
             </div>
          )}

          <div className="flex flex-col items-center gap-3 relative">
            <button 
              onClick={cycleAmbient}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all border border-white/5",
                ambientTrack.id !== 'none' ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 hover:bg-white/10 text-slate-300"
              )}
              title={"Ambient: " + ambientTrack.label}
            >
              {isAmbientLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Music className="w-4 h-4" />
              )}
            </button>
            <span className="text-[10px] text-white/50 w-[68px] text-center leading-tight truncate">{ambientTrack.label}</span>

            {isSelectingAmbient && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="absolute right-full mr-4 bottom-0 bg-slate-900 border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col gap-3 min-w-[160px] z-[70] max-h-[400px] overflow-y-auto scrollbar-hide"
              >
                <div className="flex flex-col gap-1.5 border-b border-white/10 pb-3 mb-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Volume</span>
                    <span className="text-[10px] font-bold text-cyan-400">{Math.round(ambientVolume * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={ambientVolume}
                    onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  {AMBIENT_TRACKS.map(track => (
                    <button
                      key={track.id}
                      onClick={() => selectAmbient(track)}
                      className={cn(
                        "text-left px-3 py-2 rounded-lg text-xs font-bold transition-all truncate",
                        ambientTrack.id === track.id 
                          ? "bg-cyan-500 text-white" 
                          : "text-text-muted hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {track.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="w-8 h-[1px] bg-white/10 my-1" />

          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={() => setDeepFocus(!deepFocus)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all border border-white/5",
                deepFocus ? "bg-red-500/20 text-red-400" : "bg-white/5 hover:bg-white/10 text-slate-300"
              )}
              title="Deep Focus Mode"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
            <span className={cn("text-[10px] text-center leading-tight w-[68px]", deepFocus ? "text-red-400" : "text-white/50")}>
              Strict Mode
            </span>
          </div>
        </motion.div>
      )}

      <motion.div 
        layout
        className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-full p-1 sm:p-3 shadow-2xl flex flex-col items-center relative overflow-hidden ring-1 ring-white/5 w-12 sm:w-[88px]"
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


