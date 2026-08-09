import React, { useState } from 'react';
import { FileText, Youtube, BookOpen, Star, Sparkles, Download, Eye } from 'lucide-react';
import { CommunityMaterial } from '../../hooks/useCommunityMaterials';
import { pastelForType } from '../../lib/utils';

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
    // Same source as every other type colour in the app — see pastelForType().
    const color = `var(--pastel-${pastelForType(normType)}-ink)`;
    if (normType === 'pdf') {
      return { label: 'PDF', color, icon: FileText };
    }
    if (normType === 'youtube' || normType === 'video') {
      return { label: 'Video', color, icon: Youtube };
    }
    if (normType === 'flashcard' || normType === 'flashcards') {
      return { label: 'Flashcards', color, icon: Sparkles };
    }
    return { label: 'Notes', color, icon: BookOpen };
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
                isFilled ? 'text-brand-orange fill-brand-orange' : 'text-text-muted/30'
              }`}
            />
          );
        })}
        <span className="text-xs font-bold text-brand-orange ml-1.5 mt-0.5">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-surface p-5 border border-border/5 transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] w-full h-full min-h-[290px] select-none">
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

          {(material.rating ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              {renderStars(material.rating)}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-extrabold text-text-main line-clamp-2 mb-1 tracking-tight leading-snug group-hover:text-primary transition-colors">
          {material.title}
        </h3>

        {/* Author Line */}
        <p className="text-xs text-text-muted/90 mb-3 font-semibold">
          {material.authorName && (
            <>By @{material.authorName.replace(/\s+/g, '_').toLowerCase()} • </>
          )}
          <span className="text-xs text-text-muted/60 font-medium">{getRelativeTime(material.createdAt)}</span>
        </p>

        {/* Description / Summary */}
        {material.summary ? (
          <p className="text-sm text-text-muted line-clamp-2 leading-relaxed mb-4 font-normal">
            {material.summary}
          </p>
        ) : (
          <p className="text-xs italic text-text-muted/50 line-clamp-2 leading-relaxed mb-4">
            No summary provided. Dive in to explore details!
          </p>
        )}

        {/* Tags */}
        {material.keyTopics && material.keyTopics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5 overflow-hidden max-h-16">
            {material.keyTopics.slice(0, 3).map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="text-[11px] font-bold text-text-muted/90 bg-border/5 px-2.5 py-1 rounded-lg border border-border/10 whitespace-nowrap"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        {/* Statistics Row (Clones / Downloads) */}
        <div className="flex items-center gap-4 py-2 border-t border-border/5 mb-3 text-xs font-semibold text-text-muted">
          <span className="flex items-center gap-1.5">
            <Download size={13} className="text-secondary" />
            <span className="text-text-main">{material.downloads || 0}</span> clones
          </span>
          <span className="flex items-center gap-1.5">
            <Star size={13} className="text-brand-orange" />
            <span className="text-text-main">{material.likes || 0}</span> likes
          </span>
        </div>

        {/* Quick Actions (Touch Target: min 44px) */}
        <div className="grid grid-cols-2 gap-2 border-t border-border/5 pt-3">
          <button
            onClick={() => onPreview(material)}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-border/5 hover:bg-border/10 active:scale-95 text-text-main text-xs font-bold transition-all min-h-[44px] cursor-pointer border border-border/10"
            id={`comm-btn-prev-${material.id}`}
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>
          
          <button
            onClick={handleCloneClick}
            disabled={isCloning}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 active:scale-95 text-white text-xs font-bold transition-all min-h-[44px] cursor-pointer"
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
