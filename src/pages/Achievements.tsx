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
import { cn, pastelForCategory } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { AchievementBadge } from '../components/AchievementBadge';
import { CountUp } from '../components/motion/CountUp';
import api from '../services/api';
import { celebrate } from '../lib/motion';

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

// `color` was five neon hexes that nothing actually rendered — every tab drew
// its colour from activeCategoryStyle() instead, so these were dead values
// carrying the accent-overload look in a place it never even reached the
// screen. The tone now comes from the shared scale via pastelForCategory().
const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: Trophy },
  { id: 'streak', label: 'Streak', icon: Calendar },
  { id: 'time', label: 'Study Time', icon: Zap },
  { id: 'quiz', label: 'Quizzes', icon: Target },
  { id: 'material', label: 'Materials', icon: Upload },
  { id: 'social', label: 'Social', icon: MessageSquare }
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

  /**
   * Ids unlocked during this visit, so those cards play the one-shot shine.
   * Sourced from the same `achievement:unlocked` window event the toast
   * listens to, rather than a second source of truth.
   */
  const [justUnlocked, setJustUnlocked] = useState<Set<string>>(new Set());
  useEffect(() => {
    const onUnlock = (e: Event) => {
      const id = (e as CustomEvent).detail?.id;
      if (!id) return;
      setJustUnlocked(prev => new Set(prev).add(id));
    };
    window.addEventListener('achievement:unlocked', onUnlock);
    return () => window.removeEventListener('achievement:unlocked', onUnlock);
  }, []);

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

  // Celebratory blast when tapping the AP balance. Now goes through the shared
  // motion layer, which reads the live theme tokens instead of the five
  // literal hexes this used to carry, and no-ops under reduced motion.
  const blastConfetti = () => {
    void celebrate('milestone');
  };

  // Inline style rather than a class string: Tailwind cannot compile
  // `bg-[var(--pastel-${tone})]` from a template literal, so a class-based
  // version of this would silently produce no background at all.
  const activeCategoryStyle = (cat: string): React.CSSProperties => {
    if (cat === 'all') {
      return { backgroundColor: 'var(--primary)', color: '#FFFFFF', borderColor: 'transparent' };
    }
    const tone = pastelForCategory(cat);
    return {
      backgroundColor: `var(--pastel-${tone})`,
      color: `var(--pastel-${tone}-ink)`,
      borderColor: 'transparent',
    };
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
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--pastel-peach)', color: 'var(--pastel-peach-ink)' }}
            >
              <Trophy size={18} />
            </div>
            <div>
              {/* Was text-[7px] — the last sub-11px size left in the app after
                  the typography pass, and unreadable at any viewport. */}
              <p className="text-base font-black text-text-main leading-none"><CountUp value={totalPoints} /></p>
              <p className="text-[11px] text-text-muted font-semibold uppercase tracking-widest mt-0.5">Total AP</p>
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
        {/* purple-500 → pink-500 were raw Tailwind colours owned by no token and
            not the brand gradient. Violet → cyan is the brand pair, and a
            progress fill is one of the three things violet is spent on. */}
        <div className="h-3 bg-[var(--ring-track)] rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-muted">
          <span>{unlockedCount} of {totalCount} badges unlocked</span>
          <span className="flex items-center gap-1 text-[11px] text-primary font-bold">
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
                "flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold border transition-all cursor-pointer snap-start h-11 flex-shrink-0",
                !isActive && "bg-surface border-border text-text-muted hover:text-text-main"
              )}
              style={isActive ? activeCategoryStyle(tab.id) : undefined}
              aria-pressed={isActive}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Badges grid. Two columns is the MOBILE case — it was hardcoded with no
          breakpoint above it, so at 1440px each badge stretched to ~760px wide
          around a 56px icon and two short lines of text, and the min-height
          then stranded that content at the top and bottom of a mostly empty
          card. Scales up now instead of stretching. */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            /* Same reasoning as the shared Skeleton: surface-alt at 35% on
               white paper is an outlined empty box, not a loading card. */
            <div key={i} className="animate-pulse bg-[var(--skeleton)] h-[160px] rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : filteredAchievements.length === 0 ? (
        <div className="glass-card p-8 text-center rounded-[28px]">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
            <Award size={24} />
          </div>
          <h3 className="font-heading font-bold text-base text-text-main mb-1">No badges in this category yet</h3>
          {/* The old copy was a sentence fragment listing four unrelated nouns
              ("Keep study-blocking notes, completing quizzes, uploading
              textbooks, and study plan generator.") and never said what to do. */}
          <p className="text-xs text-text-muted max-w-xs mx-auto mb-4 leading-relaxed">
            Badges here unlock as you study. Start a focus session and this
            category will start filling up.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="h-11 px-6 bg-primary text-white font-semibold text-sm rounded-2xl cursor-pointer hover:bg-primary/90 transition-colors"
          >
            Start a focus session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAchievements.map((badge) => (
            <AchievementBadge
              key={badge.id}
              {...badge}
              justUnlocked={justUnlocked.has(badge.id)}
              onClick={() => setSelectedBadge(badge)}
            />
          ))}
        </div>
      )}

      {/* Next Milestone widget */}
      {!loading && nextMilestone && (
        <div className="glass-card p-5 rounded-[24px] border-border/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
              style={{ backgroundColor: 'var(--pastel-peach)', color: 'var(--pastel-peach-ink)' }}
            >
              Suggested Target
            </span>
            <span className="text-[11px] font-bold text-text-muted flex items-center gap-0.5">
              <TrendingUp size={12} /> Upcoming
            </span>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-surface-alt/80 border border-border/10 flex items-center justify-center text-primary flex-shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="font-bold text-xs text-text-main truncate leading-tight">{nextMilestone.title}</h4>
              <p className="text-[11px] text-text-muted mt-0.5 truncate leading-tight">{nextMilestone.description}</p>
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
              /* `relative z-10` is load-bearing. The backdrop above is
                 `absolute`, i.e. positioned, so it paints in the positioned
                 layer. This sheet was static, and only rendered above the
                 backdrop while Framer's slide-up transform gave it a stacking
                 context — the instant the animation settled and the transform
                 was removed, it dropped below the backdrop and appeared to
                 vanish behind the blur. */
              className="relative z-10 w-full max-w-sm bg-surface border-t border-border/10 rounded-t-[32px] p-6 shadow-soft pointer-events-auto flex flex-col gap-5 border-l border-r"
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">
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
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full border-4 border-surface flex items-center justify-center text-white">
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
                    <div className="h-2.5 bg-[var(--ring-track)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.round((selectedBadge.currentProgress / selectedBadge.target) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed">
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
                  selectedBadge.isUnlocked ? "bg-surface-alt text-text-main border" : "bg-primary text-text-main"
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
