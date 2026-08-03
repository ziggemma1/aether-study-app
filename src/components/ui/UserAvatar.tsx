import React from 'react';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  streakCount?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function UserAvatar({ name, avatarUrl, streakCount = 0, size = 'md' }: UserAvatarProps) {
  const getInitials = (n: string) => {
    if (!n) return 'S';
    return n.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
  };

  const dims = {
    sm: 'w-8 h-8 text-[11px] rounded-lg',
    md: 'w-10 h-10 text-xs rounded-xl',
    lg: 'w-12 h-12 text-sm rounded-2xl'
  }[size];

  // Dynamic avatar patterns
  const backgroundHash = name 
    ? `hsl(${name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 100) % 360}, 65%, 45%)` 
    : '#8B5CF6';

  return (
    <div className="relative inline-flex select-none shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
          className={`${dims} object-cover ring-1 ring-white/10`}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const sibling = e.currentTarget.nextElementSibling as HTMLElement;
            if (sibling) sibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      <div
        className={`${dims} flex items-center justify-center font-black text-white px-1 tracking-tight shadow-md ring-1 ring-white/10`}
        style={{ 
          backgroundColor: backgroundHash,
          display: avatarUrl ? 'none' : 'flex' 
        }}
      >
        {getInitials(name)}
      </div>

      {streakCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-amber-500 text-neutral-950 font-black text-[7px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#0B0E14] shadow-md animate-pulse">
          🔥
        </span>
      )}
    </div>
  );
}
