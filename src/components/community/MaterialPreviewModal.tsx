import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Star, Download, Play, Heart, Calendar } from 'lucide-react';
import { CommunityMaterial } from '../../hooks/useCommunityMaterials';

interface MaterialPreviewModalProps {
  material: CommunityMaterial | null;
  onClose: () => void;
  onClone: (material: CommunityMaterial) => void;
}

export function MaterialPreviewModal({ material, onClose, onClone }: MaterialPreviewModalProps) {
  const [isCloning, setIsCloning] = useState(false);

  if (!material) return null;

  const handleClone = async () => {
    setIsCloning(true);
    await onClone(material);
    setIsCloning(false);
  };

  const getBadgeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'pdf') return '📄 PDF Document';
    if (t === 'youtube' || t === 'video') return '🎥 Video Lecture';
    if (t === 'flashcard' || t === 'flashcards') return '⚡ Active Flashcards';
    return '📝 Comprehensive Notes';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop (Touch-friendly click away) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Panel (Mobile responsive) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex flex-col w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-border/10 bg-surface text-text-main shadow-[var(--shadow-card-hover)] z-10"
        >
          {/* Header Close Trigger (Touch min 44px) */}
          <div className="relative flex items-center justify-between px-6 py-5 border-b border-border/5">
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <h2 className="text-base font-bold tracking-tight">Material Preview</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-border/5 text-text-muted hover:bg-border/10 active:scale-95 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content Pane */}
          <div className="flex-grow overflow-y-auto px-6 py-5 scrollbar-thin">
            {/* Type badge & rating */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary uppercase">
                {getBadgeIcon(material.type)}
              </span>
              {(material.rating ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-orange">
                  <Star size={14} className="fill-brand-orange" />
                  <span>{material.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-main mb-1.5 tracking-tight leading-snug">
              {material.title}
            </h1>

            {/* Author */}
            <p className="text-xs text-text-muted mb-6 flex items-center gap-2">
              {material.authorName && (
                <>
                  <span>Author: <strong className="text-text-main">@{material.authorName.replace(/\s+/g, '_').toLowerCase()}</strong></span>
                  <span>•</span>
                </>
              )}
              <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(material.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </p>

            {/* Summary */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Subject / Key Areas</h3>
              <p className="text-sm text-text-main leading-relaxed bg-surface/50 border border-border/5 rounded-2xl p-4">
                {material.summary || "This comprehensive educational material has been uploaded by the community to accelerate interactive learning, quizzes, and active recall studies."}
              </p>
            </div>

            {/* Key Topics Tags */}
            {material.keyTopics && material.keyTopics.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2.5">Key Topics Covered</h3>
                <div className="flex flex-wrap gap-2">
                  {material.keyTopics.map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="text-xs font-semibold text-primary bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/15"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Inside Content Sneak Peek (Demo Content) */}
            <div className="p-4 bg-border/5 border border-border/5 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Study Units Snapshot
              </div>
              <ul className="space-y-2 text-xs text-text-muted">
                <li>• Includes instant active recall flashcards study pack</li>
                <li>• 10+ dynamically aligned review quiz questions</li>
                <li>• Complete chapter notes and terminology outline</li>
              </ul>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="px-6 py-5 border-t border-border/10 bg-surface-alt flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs font-bold text-text-muted">
              <span className="flex items-center gap-1.5">
                <Download size={14} className="text-secondary" />
                <span className="text-text-main font-extrabold">{material.downloads || 0}</span> clones to libraries
              </span>
            </div>

            <button
              onClick={handleClone}
              disabled={isCloning}
              className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary/90 text-white text-sm font-extrabold rounded-2xl shadow-lg transition-all active:scale-[0.98] min-h-[44px] cursor-pointer"
            >
              <Download size={16} className={isCloning ? 'animate-bounce' : ''} />
              <span>{isCloning ? 'Adding to Library...' : 'Clone to Personal Library'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
