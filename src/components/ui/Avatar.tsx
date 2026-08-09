import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Leaderboard avatar. Falls back to an initial on a pastel tile rather than a
 * solid violet circle — violet is rationed to nav, primary buttons and progress
 * fills, and a column of fourteen violet discs was the loudest thing on the
 * page.
 *
 * The tones are spelled out as whole class names: Tailwind scans source text,
 * so a class assembled from a template literal compiles to nothing.
 */
const TONES = [
  'bg-pastel-sky text-pastel-sky-ink',
  'bg-pastel-mint text-pastel-mint-ink',
  'bg-pastel-lavender text-pastel-lavender-ink',
  'bg-pastel-peach text-pastel-peach-ink',
  'bg-pastel-pink text-pastel-pink-ink'
];

export function Avatar({
  name,
  src,
  size = 40,
  className
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  // Same name always gets the same tone, so a person looks consistent between
  // the podium and their row.
  const tone = TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

  return (
    <span
      className={cn(
        'relative shrink-0 rounded-full overflow-hidden flex items-center justify-center font-semibold',
        tone,
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}
