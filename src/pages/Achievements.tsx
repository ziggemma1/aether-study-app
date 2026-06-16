import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Trophy, 
  Star, 
  Zap, 
  Shield, 
  Target, 
  CheckCircle2, 
  Lock,
  FileText,
  Upload,
  BookOpen,
  Calendar,
  MessageSquare,
  Sparkles,
  ArrowRight,
  X,
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { AchievementBadge } from '../components/AchievementBadge';
import api from '../services/api';
import confetti from 'canvas-confetti';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  category: 'streak' | 'time' | 'quiz' | 'material' | 'social';
  points: number;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: Trophy, color: 'text-primary' },
  { id: 'streak', label: 'Streak', icon: Calendar, color: 'text-[#F5B042]' },
  { id: 'time', label: 'Study Time', icon: Zap, color: 'text-[#6C5CE7]' },
  { id: 'quiz', label: 'Quizzes', icon: Target, color: 'text-[#00E5A0]' },
  { id: 'material', label: 'Materials', icon: Upload, color: 'text-[#00D2FF]' },
  { id: 'social', label: 'Social', icon: MessageSquare, color: 'text-[#FF5E7E]' }
];

export default function Achievements() {
  const navigate = useNavigate();
  const { user, showToast, fetchAppData } = useAppContext();
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(user?.aetherPoints || 0);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<Achievement | null>(null);

  // Sync / retrieve real data on mount
  const loadAchievementsData = async (triggerAudit = false) => {
    try {
      setLoading(true);
      // Trigger dynamic checkpoint update to synchronize achievements
      const endpoint = triggerAudit ? '/achievements/action' : '/achievements';
      const response = triggerAudit ? await api.post(endpoint, { action: 'view_page' }) : await api.get(endpoint);
      
      if (response.data) {
        setAchievements(response.data.achievements || []);
        setTotalPoints(response.data.totalPoints ?? user?.aetherPoints ?? 0);
        setOverallProgress(response.data.overallProgress || 0);
        
        // Notify if newly unlocked badges are returned
        if (triggerAudit && response.data.newlyUnlocked?.length > 0) {
          response.data.newlyUnlocked.forEach((badge: any) => {
            // Dispatch dynamic window event for the Global Toast notification
            window.dispatchEvent(new CustomEvent('achievement:unlocked', { detail: badge }));
          });
        }
      }
    } catch (err: any) {
      console.error('Error loading achievements data:', err);
      showToast('Could not load real study achievement statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Audit achievements on mount to compile fresh study counts, quiz metrics & streaking
    loadAchievementsData(true);
    // Refresh app data in background to stay synchronized
    fetchAppData();
  }, []);

  // Filter list based on selected category tab
  const filteredAchievements = achievements.filter(badge => {
    if (activeTab === 'all') return true;
    return badge.category === activeTab;
  });

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  const nextMilestone = achievements.find(a => !a.isUnlocked);

  // Celebratory manual confetti blast when tapping AP balance
  const blastConfetti = () => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#F5B042', '#6C5CE7', '#00D2FF']
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#00E5A0', '#FF5E7E', '#8B5CF6']
    });
  };

  const activeCategoryStyle = (cat: string) => {
    switch (cat) {
      case 'streak': return 'bg-[#F5B042]/10 text-[#F5B042] border-[#F5B042]/30';
      case 'time': return 'bg-[#6C5CE7]/10 text-[#6C5CE7] border-[#6C5CE7]/30';
      case 'quiz': return 'bg-[#00E5A0]/10 text-[#00E5A0] border-[#00E5A0]/30';
      case 'material': return 'bg-[#00D2FF]/10 text-[#00D2FF] border-[#00D2FF]/30';
      case 'social': return 'bg-[#FF5E7E]/10 text-[#FF5E7E] border-[#FF5E7E]/30';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="space-y-6 pb-24 select-none animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-text-main flex items-center gap-2">
              Achievements
            </h1>
            <p className="text-xs text-text-muted">
              Earn status badges and unlock Aether study perks.
            </p>
          </div>
          <motion.div 
            whileTap={{ scale: 0.95 }}
            onClick={blastConfetti}
            className="flex bg-surface-alt/50 border border-border/10 p-2.5 rounded-2xl items-center gap-2.5 shadow-soft cursor-pointer pr-4"
          >
            <div className="w-8 h-8 rounded-xl bg-[#F5B042]/10 flex items-center justify-center text-[#F5B042]">
              <Trophy size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-text-main leading-none">{totalPoints}</p>
              <p className="text-[7px] text-text-muted font-black uppercase tracking-widest mt-0.5">Total AP</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="glass-card p-5 relative overflow-hidden rounded-[28px] border-border/10">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Sparkles size={120} />
        </div>
        <div className="flex items-center justify-between mb-3 text-xs font-black uppercase text-text-muted tracking-wider">
          <span className="flex items-center gap-1.5 font-extrabold">
            <Shield size={14} className="text-primary" /> Overall Progress
          </span>
          <span className="text-primary font-black text-sm">{overallProgress}%</span>
        </div>
        
        {/* Horizontal Progress bar */}
        <div className="h-3 bg-surface-alt/75 rounded-full overflow-hidden mb-4">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-muted">
          <span>{unlockedCount} of {totalCount} badges unlocked</span>
          <span className="flex items-center gap-1 text-[10px] text-primary font-bold">
            Mastery level {Math.floor(unlockedCount / 5) + 1}
          </span>
        </div>
      </div>

      {/* Categories Filter Rail for Mobile viewports */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 snap-x snap-mandatory">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all cursor-pointer snap-start h-11 flex-shrink-0",
                isActive 
                  ? activeCategoryStyle(tab.id)
                  : "bg-surface border-border/10 text-text-muted"
              )}
            >
              <Icon size={13} className={isActive ? "" : "text-text-muted"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Badges Grid (Strictly 2 Columns on Mobile View) */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-surface-alt/35 h-[160px] rounded-[24px] border border-border/10" />
          ))}
        </div>
      ) : filteredAchievements.length === 0 ? (
        <div className="glass-card p-8 text-center rounded-[28px]">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
            <Award size={24} />
          </div>
          <h3 className="font-extrabold text-sm text-text-main mb-1">No Badges in This Category</h3>
          <p className="text-[11px] text-text-muted max-w-xs mx-auto mb-4 leading-normal">
            Keep study-blocking notes, completing quizzes, uploading textbooks, and study plan generator.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full h-11 bg-primary text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl cursor-pointer"
          >
            Start Focus Session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredAchievements.map((badge, idx) => (
            <AchievementBadge
              key={badge.id}
              {...badge}
              onClick={() => setSelectedBadge(badge)}
            />
          ))}
        </div>
      )}

      {/* Next Milestone widget */}
      {!loading && nextMilestone && (
        <div className="glass-card p-5 rounded-[24px] border-border/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#F5B042] bg-[#F5B042]/10 px-2 rounded-md">
              Suggested Target
            </span>
            <span className="text-[10px] font-bold text-text-muted flex items-center gap-0.5">
              <TrendingUp size={12} /> Upcoming
            </span>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-surface-alt/80 border border-border/10 flex items-center justify-center text-primary flex-shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="font-bold text-xs text-text-main truncate leading-tight">{nextMilestone.title}</h4>
              <p className="text-[10px] text-text-muted mt-0.5 truncate leading-tight">{nextMilestone.description}</p>
            </div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary cursor-pointer flex-shrink-0"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Badge Details Detail Component (Interactive Bottom Sheet Concept) */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-[100000] flex items-end justify-center pointer-events-none">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBadge(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-auto cursor-pointer"
            />
            
            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-sm bg-surface border-t border-border/10 rounded-t-[32px] p-6 shadow-soft pointer-events-auto flex flex-col gap-5 border-l border-r"
            >
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                  Badge Specifications
                </span>
                <button 
                  onClick={() => setSelectedBadge(null)}
                  className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center text-text-muted hover:text-text-main cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center gap-3">
                <div className={cn(
                  "w-20 h-20 rounded-[2rem] flex items-center justify-center text-2xl relative shadow-md border border-border/5",
                  selectedBadge.isUnlocked ? "bg-primary/10 text-primary" : "bg-border/10 text-text-muted"
                )}>
                  <Trophy size={36} />
                  {selectedBadge.isUnlocked && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-surface flex items-center justify-center text-white">
                      <CheckCircle2 size={12} />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-text-main">{selectedBadge.title}</h3>
                  <span className="inline-block text-xs font-black text-primary bg-primary/10 px-3 py-0.5 rounded-full uppercase tracking-wider">
                    +{selectedBadge.points} points
                  </span>
                  <p className="text-xs text-text-muted max-w-xs leading-relaxed mt-2">
                    {selectedBadge.description}
                  </p>
                </div>
              </div>

              {/* Status progression or date unlocked */}
              <div className="bg-surface-alt/40 border border-border/5 p-4 rounded-2xl flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-muted">Unlock Conditions</span>
                  <span className="font-extrabold text-text-main">
                    {selectedBadge.isUnlocked ? "COMPLETED" : `${selectedBadge.currentProgress}/${selectedBadge.target}`}
                  </span>
                </div>
                
                {selectedBadge.isUnlocked ? (
                  <div className="text-[11px] text-text-muted leading-relaxed">
                    🌟 Badge earned on: <span className="font-bold text-text-main">{selectedBadge.unlockedAt ? new Date(selectedBadge.unlockedAt).toLocaleDateString() : 'Active Study Days'}</span>. You have successfully claimed <span className="font-bold text-primary">{selectedBadge.points} Aether study points</span>!
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="h-2.5 bg-border/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.round((selectedBadge.currentProgress / selectedBadge.target) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-text-muted leading-relaxed">
                      Study consistency, quiz metrics, active reading summaries, or partner followers count are tracked automatically. Keep going to claim badge reward points!
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedBadge(null);
                  if (!selectedBadge.isUnlocked) {
                    navigate('/dashboard');
                  } else {
                    blastConfetti();
                  }
                }}
                className={cn(
                  "w-full h-12 rounded-2xl font-extrabold text-xs uppercase tracking-widest cursor-pointer",
                  selectedBadge.isUnlocked ? "bg-surface-alt text-text-main border" : "bg-primary text-white"
                )}
              >
                {selectedBadge.isUnlocked ? "Awesome!" : "Close & Study Now"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
