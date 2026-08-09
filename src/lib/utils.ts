import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${remainingMinutes}m`;
}

export type PastelTone = 'pink' | 'sky' | 'lavender' | 'mint' | 'peach';

/**
 * Pastel category scale. The tints come from the 21st.dev "Soft Pastel Blend"
 * palette (see SoftPastelBlend.tsx) and are assigned by material TYPE, never
 * picked for looks — so the colour still answers "what kind of thing is this?"
 * rather than going back to being decoration.
 */
export function pastelForType(type?: string): PastelTone {
  switch ((type || '').toLowerCase()) {
    case 'pdf':
    case 'document':
      return 'pink';
    case 'video':
    case 'youtube':
      return 'sky';
    case 'quiz':
      return 'mint';
    case 'flashcards':
    case 'flashcard':
      return 'peach';
    case 'notes':
    case 'note':
    default:
      return 'lavender';
  }
}

/**
 * Same scale, keyed by achievement category. Deliberately agrees with
 * pastelForType() where the two overlap — a quiz badge is the same mint as a
 * quiz material, a material badge the same pink as a document — so the colours
 * mean one thing across the app rather than two.
 */
export function pastelForCategory(category?: string): PastelTone {
  switch ((category || '').toLowerCase()) {
    case 'streak':
      return 'peach';
    case 'time':
      return 'lavender';
    case 'quiz':
      return 'mint';
    case 'material':
      return 'pink';
    case 'social':
    default:
      return 'sky';
  }
}

/** Inline style pair for a pastel tone: tinted fill + AA-safe ink. */
export function pastelStyle(tone: PastelTone): { backgroundColor: string; color: string } {
  return {
    backgroundColor: `var(--pastel-${tone})`,
    color: `var(--pastel-${tone}-ink)`,
  };
}

/**
 * Mastery health scale. Colour is one of the few accents the revamp keeps,
 * because here it encodes something — how well a topic is known. Shared so the
 * library stats row and the focus list cannot drift to different thresholds.
 */
export function getMasteryColor(pct: number): string {
  // Tokens, not hexes: the four literals this used to return were the neon
  // dark-mode values (#FF5E7E / #F5B042 / #00D2FF / #00E5A0), which sit at
  // roughly 1.5:1 on white paper. Every mastery number in the library was
  // rendering in a colour you could barely read.
  if (pct < 30) return 'var(--mastery-low)';
  if (pct < 60) return 'var(--mastery-mid)';
  if (pct < 80) return 'var(--mastery-high)';
  return 'var(--mastery-max)';
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

const QUOTES = [
  "Small steps every day lead to big results.",
  "Your future self will thank you for studying today.",
  "Progress, not perfection.",
  "One page at a time.",
  "Deep breath in, active brain on. You got this!",
  "Mistakes are proof that you are trying.",
  "Consistency beats talent when talent doesn't work hard."
];

export function getRandomQuote(): string {
  const index = Math.floor(Math.random() * QUOTES.length);
  return QUOTES[index];
}

export function getInitials(name: string): string {
  if (!name) return 'ST';
  const nameParts = name.trim().split(/\s+/);
  if (nameParts.length >= 2) {
    return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  }
  return nameParts[0].substring(0, 2).toUpperCase();
}

/**
 * Compact timestamp for a conversation-list row: "now", "4m", "3h", "Mon",
 * "12 Jun". `formatRelativeTime` returns prose ("3 hours ago") which is far too
 * wide for the column beside a name.
 */
export function formatChatTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '';

  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return date.toLocaleDateString(undefined, { weekday: 'short' });
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function formatRelativeTime(dateStr: string | Date): string {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval === 1 ? '1 year ago' : `${interval} years ago`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval === 1 ? '1 month ago' : `${interval} months ago`;
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval === 1 ? '1 day ago' : `${interval} days ago`;
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval === 1 ? '1 min ago' : `${interval} mins ago`;
    
    return seconds < 10 ? 'Just now' : `${Math.floor(seconds)} secs ago`;
  } catch {
    return '';
  }
}


