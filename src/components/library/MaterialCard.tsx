import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pastelForType } from '../../lib/utils';
import { motion } from 'framer-motion';
import { FileText, Youtube, BookOpen, Sparkles, Award, Share2 } from 'lucide-react';
import { LibraryMaterial } from '../../hooks/useLibrary';
import { useAppContext } from '../../context/AppContext';

interface MaterialCardProps {
  material: LibraryMaterial;
}

export function MaterialCard({ material }: MaterialCardProps) {
  const navigate = useNavigate();
  const { showToast } = useAppContext();
  const [copied, setCopied] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const shareUrl = `${window.location.origin}/share/${material.id}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Share link copied to clipboard! 📤', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy link', 'error');
    }
  };

  // Type mappings and configuration
  const getBadgeConfig = (typeStr: string) => {
    const normType = typeStr.toLowerCase();
    // Same source as every other type colour in the app — see pastelForType().
    const color = `var(--pastel-${pastelForType(normType)}-ink)`;
    if (normType === 'pdf') {
      return { label: 'PDF', color, icon: FileText };
    }
    if (normType === 'youtube' || normType === 'video') {
      return { label: 'Videos', color, icon: Youtube };
    }
    if (normType === 'quiz') {
      return { label: 'Quizzes', color, icon: Award };
    }
    // note, article, audio, default
    return { label: 'Notes', color, icon: BookOpen };
  };

  const badge = getBadgeConfig(material.type);
  const IconComponent = badge.icon;

  const navigateTo = (path: string) => {
    navigate(path);
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group relative flex flex-col justify-between rounded-2xl bg-surface p-5 border border-border transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] w-full h-full min-h-[280px]"
    >
      <div>
        {/* Header Section */}
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shrink-0"
            style={{ backgroundColor: `${badge.color}15`, color: badge.color }}
          >
            <IconComponent size={14} className="shrink-0" />
            <span>{badge.label}</span>
          </div>

          {/* Share Button (Touch Friendly) */}
          <button
            onClick={handleShare}
            id={`share-${material.id}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-text-muted/5 text-text-muted transition-all active:scale-90 active:bg-text-muted/10 shrink-0 cursor-pointer"
            title="Share material"
          >
            <Share2 size={16} className={copied ? 'text-accent' : ''} />
          </button>
        </div>

        {/* Content Section */}
        <h3 className="text-base font-bold text-text-main line-clamp-1 mb-1 tracking-tight">
          {material.title}
        </h3>
        
        <p className="text-xs text-text-muted mb-3 line-clamp-1 font-medium">
          Uploaded: {material.date}
        </p>

        {material.description && (
          <p className="text-sm text-text-muted line-clamp-2 leading-relaxed mb-4">
            {material.description}
          </p>
        )}

        {/* Tags Section */}
        {material.tags && material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 select-none">
            {material.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="text-[11px] font-semibold text-text-muted bg-text-muted/5 px-2.5 py-1 rounded-lg border border-border whitespace-nowrap"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        {/* Mastery Progress */}
        {material.mastery > 0 && (
          <div className="pt-3 border-t border-border mb-4 selectors-progress">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase text-text-muted tracking-wider">
                  Mastery Progress
                </span>
                <span className="text-xs font-semibold text-primary">
                  {material.mastery}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-surface/50 border border-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                  style={{ width: `${material.mastery}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Interactive Buttons (Touch Target: min 44px) */}
        <div className="grid grid-cols-4 gap-2 border-t border-border pt-3">
          <button
            onClick={() => navigateTo(`/library/${material.id}`)}
            className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-primary/5 hover:bg-primary/10 active:scale-95 text-primary transition-all min-h-[44px] cursor-pointer"
            id={`btn-study-${material.id}`}
          >
            <BookOpen size={16} />
            <span className="text-[11px] font-bold mt-1 tracking-tight">Study</span>
          </button>
          <button
            onClick={() => navigateTo(`/materials/${material.id}/notes`)}
            className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-secondary/5 hover:bg-secondary/10 active:scale-95 text-secondary transition-all min-h-[44px] cursor-pointer"
            id={`btn-notes-${material.id}`}
          >
            <FileText size={16} />
            <span className="text-[11px] font-bold mt-1 tracking-tight">Notes</span>
          </button>
          <button
            onClick={() => navigateTo(`/quiz/${material.id}`)}
            className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-brand-orange/5 hover:bg-brand-orange/10 active:scale-95 text-brand-orange transition-all min-h-[44px] cursor-pointer"
            id={`btn-quiz-${material.id}`}
          >
            <Award size={16} />
            <span className="text-[11px] font-bold mt-1 tracking-tight">Quiz</span>
          </button>
          <button
            onClick={() => navigateTo(`/flashcards/${material.id}`)}
            className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-accent/5 hover:bg-accent/10 active:scale-95 text-accent transition-all min-h-[44px] cursor-pointer"
            id={`btn-flash-${material.id}`}
          >
            <Sparkles size={16} />
            <span className="text-[11px] font-bold mt-1 tracking-tight">Flash</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
