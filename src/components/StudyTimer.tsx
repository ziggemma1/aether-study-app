import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Clock, Play, Pause, Save, Volume2, Headphones, ChevronUp, ChevronDown, Music, ShieldAlert, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

import { getSocket } from '../services/socket';
import { celebrate } from '../lib/motion';

interface StudyTimerProps {
  materialId?: string;
  title: string;
  readContent?: string;
  // 'floating' (default) self-positions in the corner for standalone use.
  // 'inline' drops its own fixed positioning so a parent can stack it
  // alongside other floating controls (see DetailedNotes.tsx).
  variant?: 'floating' | 'inline';
}

const AMBIENT_TRACKS = [
  { id: 'none', label: 'Pure Silence', url: '' },
  { id: 'lofi_1', label: 'Lo-Fi Chill', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3' },
  { id: 'alpha', label: 'Alpha Waves', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 'piano', label: 'Soft Piano', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'synth', label: 'Cosmic Focus', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3' },
  { id: 'rain_focus', label: 'Deep Rain', url: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3' },
  { id: 'forest', label: 'Forest Wind', url: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-wind-and-birds-1222.mp3' }
];

export const StudyTimer: React.FC<StudyTimerProps> = ({ materialId, title, readContent, variant = 'floating' }) => {
  const [seconds, setSeconds] = useState(0);
  const [targetSeconds, setTargetSeconds] = useState(25 * 60); // Default 25 min Pomodoro
  const [isActive, setIsActive] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const progress = useMemo(() => {
    return Math.min(100, (seconds / targetSeconds) * 100);
  }, [seconds, targetSeconds]);

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
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

  // Audio event listeners & Management
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    const audio = audioRef.current;
    
    const handleCanPlay = () => {
      setIsAmbientLoading(false);
      // If timer is on and we are paused, start playing
      if (isActive && ambientTrack.url && audio.paused) {
        audio.play().catch(e => {
          console.warn("Playback blocked or failed:", e.message);
          // If it failed because it wasn't ready, load() will help trigger another canplay
        });
      }
    };

    const handlePlaying = () => setIsAmbientLoading(false);
    
    const handleLoadStart = () => {
      if (ambientTrack.url) setIsAmbientLoading(true);
    };

    const handleError = (e: any) => {
      setIsAmbientLoading(false);
      console.error("Audio Error:", e);
      // Some tracks might fail on mobile or due to CORS, provide clear feedback
      if (ambientTrack.url && isActive) {
        showToast(`Sound server unreachable. Trying next...`, "error");
      }
    };

    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('error', handleError);
    audio.preload = "auto"; // Explicitly set preload

    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('error', handleError);
    };
  }, [isActive, ambientTrack.url, showToast]);

  // Handle ambient volume updates
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = ambientVolume;
    }
  }, [ambientVolume]);

  // Sync audio with isActive state
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (isActive) {
      if (ambientTrack.url) {
        if (audio.src !== ambientTrack.url) {
          audio.src = ambientTrack.url;
          audio.load();
        }
        audio.play().catch(() => {});
      }
    } else {
      audio.pause();
    }
  }, [isActive, ambientTrack.url]);

  const selectAmbient = (track: typeof AMBIENT_TRACKS[0]) => {
    setAmbientTrack(track);
    setIsSelectingAmbient(false);
    
    if (audioRef.current) {
      // Pause current
      audioRef.current.pause();
      
      if (track.url) {
        setIsAmbientLoading(true);
        audioRef.current.src = track.url;
        audioRef.current.load();
        
        // If timer is on, it will auto-play via the useEffect
        // If timer is off, we can optionally play a quick 3s preview or just wait
        if (!isActive) {
           // Preview for 3 seconds? Or just let it be. Let's start it and then the useEffect will pause it if needed.
           // Actually, let's just let it load.
        }
      } else {
        audioRef.current.src = "";
        setIsAmbientLoading(false);
      }
    }
    
    showToast(`Selected: ${track.label}${!isActive && track.url ? ' (Start timer to play)' : ''}`, 'success');
  };

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

  const cycleAmbient = () => {
    setIsSelectingAmbient(!isSelectingAmbient);
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
    // Fallback for the toast if the server response is somehow missing the
    // real total — the actual points come from the response below.
    const estimatedPoints = durationMinutes * 10;

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

      // The server just recomputed aetherPoints/streak (and possibly
      // unlocked achievements) — apply them directly, same pattern already
      // used in the penalize-points flow below.
      if (response.data.aetherPoints !== undefined && user) {
        // A session that extends the streak is the bigger win of the two.
        const extendedStreak =
          typeof response.data.streak === 'number' && response.data.streak > (user.streak || 0);
        void celebrate(extendedStreak ? 'milestone' : 'win');

        setUser({
          ...user,
          aetherPoints: response.data.aetherPoints,
          streak: response.data.streak ?? user.streak,
          totalStudyTime: response.data.totalStudyTime ?? user.totalStudyTime
        });
      }

      if (Array.isArray(response.data.newlyUnlockedAchievements)) {
        response.data.newlyUnlockedAchievements.forEach((badge: any) => {
          window.dispatchEvent(new CustomEvent('achievement:unlocked', { detail: badge }));
        });
      }

      // Refresh global app data (including leaderboard)
      if (fetchAppData) {
        await fetchAppData();
      }

      showToast(`Session saved! Earned ${estimatedPoints} Aether Points ⚡`);
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
    <div className={cn(
      "flex gap-2 items-end transition-transform hover:-translate-y-1",
      variant === 'floating' ? "fixed bottom-40 right-6 z-[60] lg:bottom-8 lg:right-8" : "relative"
    )}>
      
      {isExpanded && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="bg-surface/90 backdrop-blur-2xl border border-border rounded-2xl p-3 shadow-2xl flex flex-col items-center gap-3 ring-1 ring-border"
        >
          {readContent && (
             <div className="flex flex-col items-center gap-1 w-full border-b border-border pb-3">
               <button 
                 onClick={() => toggleAudio()}
                 className={cn(
                   "w-10 h-10 rounded-full transition-all flex items-center justify-center relative mx-auto",
                   isPlayingAudio 
                     ? "bg-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]" 
                     : "bg-surface-alt hover:bg-surface-alt text-text-muted"
                 )}
                 title={isPlayingAudio ? "Pause Reading" : "Read Notes Aloud"}
               >
                 {isPlayingAudio ? <Volume2 className="animate-pulse w-4 h-4" /> : <Headphones className="w-4 h-4" />}
               </button>
               {voiceOptions.length > 1 && (
                 <button
                   onClick={cycleVoice}
                   className="mt-1 bg-surface-alt hover:bg-surface-alt active:bg-surface-alt border border-border text-text-main rounded-full py-1 px-2 text-[11px] sm:text-xs font-semibold cursor-pointer w-[68px] truncate drop-shadow-md text-center max-w-[100px]"
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
                "w-10 h-10 rounded-full flex items-center justify-center transition-all border border-border",
                ambientTrack.id !== 'none' ? "bg-secondary/20 text-secondary" : "bg-surface-alt hover:bg-surface-alt text-text-muted"
              )}
              title={"Ambient: " + ambientTrack.label}
            >
              {isAmbientLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Music className="w-4 h-4" />
              )}
            </button>
            <span className="text-[11px] text-text-muted w-[68px] text-center leading-tight truncate">{ambientTrack.label}</span>

            {isSelectingAmbient && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="absolute right-full mr-4 bottom-0 bg-surface border border-border rounded-2xl p-3 shadow-2xl flex flex-col gap-3 min-w-[160px] z-[70] max-h-[400px] overflow-y-auto scrollbar-hide"
              >
                <div className="flex flex-col gap-1.5 border-b border-border pb-3 mb-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">Volume</span>
                    <span className="text-[11px] font-bold text-secondary">{Math.round(ambientVolume * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={ambientVolume}
                    onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-surface-alt rounded-lg appearance-none cursor-pointer accent-secondary"
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
                          ? "bg-secondary text-white" 
                          : "text-text-muted hover:bg-surface-alt hover:text-text-main"
                      )}
                    >
                      {track.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="w-8 h-[1px] bg-surface-alt my-1" />

          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={() => setDeepFocus(!deepFocus)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all border border-border",
                deepFocus ? "bg-brand-pink/20 text-brand-pink" : "bg-surface-alt hover:bg-surface-alt text-text-muted"
              )}
              title="Deep Focus Mode"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
            <span className={cn("text-[11px] text-center leading-tight w-[68px]", deepFocus ? "text-brand-pink" : "text-text-muted")}>
              Strict Mode
            </span>
          </div>
        </motion.div>
      )}

      <motion.div 
        layout
        className={cn(
          "bg-surface/90 backdrop-blur-2xl border border-border rounded-full p-1 shadow-2xl flex flex-col items-center relative overflow-hidden ring-1 ring-border",
          seconds >= targetSeconds - 5 && seconds < targetSeconds && "animate-shake"
        )}
      >
        {/* Glow effect */}
        {isActive && (
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/20 via-transparent to-transparent pointer-events-none" />
        )}
        
        {/* Time Display Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-col items-center justify-center bg-black/50 rounded-full w-12 h-12 sm:w-14 sm:h-14 border border-border shadow-inner relative z-10 transition-colors hover:bg-surface-alt active:scale-95"
        >
          {/* Progress Ring */}
          <svg className="absolute inset-0 -rotate-90 w-full h-full">
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              className="text-text-muted/20"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "linear" }}
              className="text-primary"
            />
          </svg>

          <Clock className={cn("text-primary sm:mb-0.5 w-[10px] h-[10px] sm:w-3.5 sm:h-3.5 relative z-10", isActive ? "animate-pulse" : "opacity-30")} />
          <span className="text-[11px] sm:text-sm font-mono font-semibold text-white tracking-tight leading-none mt-0.5 sm:mt-0 relative z-10">
            {formatTime(seconds)}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute -bottom-1 z-10"
          >
            <ChevronDown className="text-text-muted mb-1 w-3 h-3 sm:w-3.5 sm:h-3.5" />
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
              <div className="w-6 sm:w-8 h-[1px] bg-surface-alt mt-2 sm:mt-3" />

              <button 
                onClick={() => setIsActive(!isActive)}
                className={cn(
                  "w-8 h-8 sm:w-12 sm:h-12 rounded-full transition-all flex items-center justify-center border border-border",
                  isActive ? "bg-surface-alt text-text-main hover:bg-surface-alt" : "bg-primary/20 text-primary hover:bg-primary/30"
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
                className="w-8 h-8 sm:w-12 sm:h-12 bg-accent/20 text-accent hover:bg-accent hover:text-text-main rounded-full transition-all disabled:opacity-30 disabled:hover:bg-accent/20 disabled:hover:text-accent flex items-center justify-center border border-accent/20 shadow-lg mb-1"
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


