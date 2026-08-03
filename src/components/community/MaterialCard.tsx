import React, { useState } from 'react';
import { FileText, Youtube, BookOpen, Star, Sparkles, Download, Eye } from 'lucide-react';
import { CommunityMaterial } from '../../hooks/useCommunityMaterials';

interface MaterialCardProps {
  material: CommunityMaterial;
  onPreview: (material: CommunityMaterial) => void;
  onClone: (material: CommunityMaterial) => void;
}

export function MaterialCard({ material, onPreview, onClone }: MaterialCardProps) {
  const [isCloning, setIsCloning] = useState(false);

  const handleCloneClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCloning(true);
    await onClone(material);
    setIsCloning(false);
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 60) return `${diffMins || 1}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const getBadgeConfig = (typeStr: string) => {
    const normType = typeStr.toLowerCase();
    if (normType === 'pdf') {
      return { label: 'PDF', color: '#6C5CE7', icon: FileText };
    }
    if (normType === 'youtube' || normType === 'video') {
      return { label: 'Video', color: '#F5B042', icon: Youtube };
    }
    if (normType === 'flashcard' || normType === 'flashcards') {
      return { label: 'Flashcards', color: '#00E5A0', icon: Sparkles };
    }
    return { label: 'Notes', color: '#00D2FF', icon: BookOpen };
  };

  const badgeConfig = getBadgeConfig(material.type);
  const IconComponent = badgeConfig.icon;

  // Render yellow stars based on rating
  const renderStars = (rating: number) => {
    const roundedRating = Math.round(rating * 2) / 2; // round to nearest 0.5
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= roundedRating;
          return (
            <Star
              key={star}
              size={12}
              className={`${
                isFilled ? 'text-[#F5B042] fill-[#F5B042]' : 'text-[#8E9AAF]/30'
              }`}
            />
          );
        })}
        <span className="text-xs font-bold text-[#F5B042] ml-1.5 mt-0.5">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-[#141A24] p-5 border border-[#8E9AAF]/5 transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] w-full h-full min-h-[290px] select-none">
      <div>
        {/* Top Header Badge & Rating Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shrink-0"
            style={{ backgroundColor: `${badgeConfig.color}15`, color: badgeConfig.color }}
          >
            <IconComponent size={14} className="shrink-0" />
            <span>{badgeConfig.label}</span>
          </div>

          <div className="flex items-center gap-1">
            {renderStars(material.rating || 4.7)}
            <span className="text-[11px] text-[#8E9AAF] font-medium">({material.likes + 2})</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-extrabold text-[#F0F3F8] line-clamp-2 mb-1 tracking-tight leading-snug group-hover:text-[#6C5CE7] transition-colors">
          {material.title}
        </h3>

        {/* Author Line */}
        <p className="text-xs text-[#8E9AAF]/90 mb-3 font-semibold">
          By @{material.authorName?.replace(/\s+/g, '_').toLowerCase() || 'aether_scholar'} • <span className="text-xs text-[#8E9AAF]/60 font-medium">{getRelativeTime(material.createdAt)}</span>
        </p>

        {/* Description / Summary */}
        {material.summary ? (
          <p className="text-sm text-[#8E9AAF] line-clamp-2 leading-relaxed mb-4 font-normal">
            {material.summary}
          </p>
        ) : (
          <p className="text-xs italic text-[#8E9AAF]/50 line-clamp-2 leading-relaxed mb-4">
            No summary provided. Dive in to explore details!
          </p>
        )}

        {/* Tags */}
        {material.keyTopics && material.keyTopics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5 overflow-hidden max-h-16">
            {material.keyTopics.slice(0, 3).map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="text-[11px] font-bold text-[#8E9AAF]/90 bg-[#8E9AAF]/5 px-2.5 py-1 rounded-lg border border-[#8E9AAF]/10 whitespace-nowrap"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        {/* Statistics Row (Clones / Downloads) */}
        <div className="flex items-center gap-4 py-2 border-t border-[#8E9AAF]/5 mb-3 text-xs font-semibold text-[#8E9AAF]">
          <span className="flex items-center gap-1.5">
            <Download size={13} className="text-[#00D2FF]" />
            <span className="text-[#F0F3F8]">{material.downloads || 0}</span> clones
          </span>
          <span className="flex items-center gap-1.5">
            <Star size={13} className="text-[#F5B042]" />
            <span className="text-[#F0F3F8]">{material.likes || 0}</span> likes
          </span>
        </div>

        {/* Quick Actions (Touch Target: min 44px) */}
        <div className="grid grid-cols-2 gap-2 border-t border-[#8E9AAF]/5 pt-3">
          <button
            onClick={() => onPreview(material)}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#8E9AAF]/5 hover:bg-[#8E9AAF]/10 active:scale-95 text-[#F0F3F8] text-xs font-bold transition-all min-h-[44px] cursor-pointer border border-[#8E9AAF]/10"
            id={`comm-btn-prev-${material.id}`}
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>
          
          <button
            onClick={handleCloneClick}
            disabled={isCloning}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 disabled:opacity-50 active:scale-95 text-[#F0F3F8] text-xs font-bold transition-all min-h-[44px] cursor-pointer"
            id={`comm-btn-clone-${material.id}`}
          >
            <Download size={14} className={isCloning ? 'animate-bounce' : ''} />
            <span>{isCloning ? 'Cloning...' : 'Clone →'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
