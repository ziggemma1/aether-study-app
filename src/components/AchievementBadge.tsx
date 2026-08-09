import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Trophy, 
  Calendar, 
  Zap, 
  Award, 
  Target, 
  Upload, 
  FileText, 
  BookOpen, 
  MessageSquare, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';
import { cn, pastelForCategory } from '../lib/utils';
import { useReducedMotion } from '../lib/motion';

/** Achievements store their icon as a NAME, not a component — the server can't
 *  ship React. Exported so the Profile page maps it the same way; it used to
 *  render the raw string, so a badge showed the word "Calendar". */
export const iconMap: Record<string, React.ElementType> = {
  Star,
  Trophy,
  Calendar,
  Zap,
  Award,
  Target,
  Upload,
  FileText,
  BookOpen,
  MessageSquare
};

export interface AchievementBadgeProps {
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
  onClick?: () => void;
  /** Unlocked during this session — plays the one-shot shine sweep. */
  justUnlocked?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  title,
  description,
  icon,
  target,
  currentProgress,
  isUnlocked,
  unlockedAt,
  category,
  points,
  onClick,
  justUnlocked = false
}) => {
  const IconComponent = iconMap[icon] || Award;
  const reduced = useReducedMotion();

  // Five hand-rolled neon palettes used to live here, each with a coloured
  // drop-shadow "glow". The glows were a dark-mode effect — on white paper a
  // 15px coloured blur just reads as a smudge — and the five hexes were the
  // same accent-overload the revamp removed everywhere else. The category now
  // draws from the one shared pastel scale, so it still tells you what kind of
  // badge this is without inventing a sixth palette.
  const tone = pastelForCategory(category);
  const tint = `var(--pastel-${tone})`;
  const ink = `var(--pastel-${tone}-ink)`;
  const pct = target > 0 ? Math.round(Math.min((currentProgress / target) * 100, 100)) : 0;
  const remaining = Math.max(0, target - currentProgress);

  // Progress bars fill on mount rather than appearing pre-filled — the bar
  // travelling is what makes "nearly there" feel like momentum. Starts at the
  // final value under reduced motion so nothing animates.
  const [fill, setFill] = React.useState(reduced ? pct : 0);
  React.useEffect(() => {
    if (reduced) { setFill(pct); return; }
    const t = setTimeout(() => setFill(pct), 90);
    return () => clearTimeout(t);
  }, [pct, reduced]);

  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        "relative rounded-[var(--radius-card)] p-4 flex flex-col items-center justify-between border select-none transition-all duration-300 pointer-events-auto min-h-[190px] overflow-hidden",
        isUnlocked
          // Earned: gold edge and a faint gold wash. The medal language is the
          // reward signal; the category pastel below still says what KIND.
          ? "bg-surface border-rank-gold/40 shadow-[var(--shadow-card)] text-rank-gold hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
          // Aspirational, not dead: dashed edge reads as an outline waiting to
          // be filled rather than a disabled control.
          : "bg-surface border-dashed border-border/70 hover:border-primary/30",
        justUnlocked && !reduced && "motion-shine"
      )}
      style={{ contentVisibility: 'auto' }}
    >
      {/* Gold wash, unlocked only. Sits under the content, never intercepts clicks. */}
      {isUnlocked && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-10 h-24 bg-rank-gold/10 blur-2xl"
        />
      )}
      {/* Points indicator top right. Earned AP is gold; unearned is quiet. */}
      <span
        className={cn(
          "absolute top-3 right-3 text-[11px] font-bold px-2 py-0.5 rounded-full z-10",
          isUnlocked
            ? "bg-rank-gold/15 text-rank-gold-ink"
            : "bg-surface-alt text-text-muted"
        )}
      >
        +{points} AP
      </span>

      {/* Badge Icon circle. A locked badge is dimmed by using the neutral chip
          rather than by opacity/grayscale on the whole card — that used to fade
          the title and description to roughly 3:1 as a side effect. */}
      <div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center relative mt-2 z-10",
          isUnlocked && "ring-2 ring-rank-gold/35"
        )}
        style={
          isUnlocked
            ? { backgroundColor: tint, color: ink }
            // Locked shows the REAL icon, faintly, on its own category tint —
            // you can see what you are working toward. A padlock in its place
            // hid the goal and made every locked badge look identical.
            : { backgroundColor: `color-mix(in srgb, ${tint} 45%, transparent)`, color: ink, opacity: 0.5 }
        }
      >
        <IconComponent size={26} />
        {isUnlocked ? (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-rank-gold rounded-full border-2 border-surface flex items-center justify-center text-white">
            <CheckCircle2 size={10} />
          </div>
        ) : (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-surface-alt rounded-full border-2 border-surface flex items-center justify-center text-text-muted">
            <Lock size={9} />
          </div>
        )}
      </div>

      {/* Texts with clamp block */}
      <div className="text-center w-full mt-3 flex-grow flex flex-col justify-center">
        <h4 className="font-extrabold text-sm text-text-main line-clamp-1 leading-tight">{title}</h4>
        <p className="text-[11px] text-text-muted line-clamp-2 leading-tight mt-1 max-w-[130px] mx-auto min-h-[30px]">
          {description}
        </p>
      </div>

      {/* Progress slider if locked */}
      <div className="w-full mt-2 z-10">
        {isUnlocked ? (
          <div className="text-center">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rank-gold-ink bg-rank-gold/15 px-2.5 py-0.5 rounded-full">
              <Trophy size={10} /> Earned
            </span>
          </div>
        ) : (
          <div className="space-y-1 w-full px-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted">
              {/* "3 to go" is a nudge; "Progress" is a label. */}
              <span>{remaining} to go</span>
              <span>{currentProgress}/{target}</span>
            </div>
            {/* Track is --ring-track, not border/20, so a badge at 4% still
                looks like a bar with a little filled rather than an empty line. */}
            <div className="h-1.5 bg-[var(--ring-track)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${fill}%`, backgroundColor: ink }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
