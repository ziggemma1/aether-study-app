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

/**
 * Mastery health scale. Colour is one of the few accents the revamp keeps,
 * because here it encodes something — how well a topic is known. Shared so the
 * library stats row and the focus list cannot drift to different thresholds.
 */
export function getMasteryColor(pct: number): string {
  if (pct < 30) return '#FF5E7E'; // Ruby red
  if (pct < 60) return '#F5B042'; // Amber
  if (pct < 80) return '#00D2FF'; // Cyan
  return '#00E5A0';               // Emerald
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


