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
          className="absolute inset-0 bg-[#0B0E14]/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Panel (Mobile responsive) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex flex-col w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-[#8E9AAF]/10 bg-[#141A24] text-[#F0F3F8] shadow-2xl z-10"
        >
          {/* Header Close Trigger (Touch min 44px) */}
          <div className="relative flex items-center justify-between px-6 py-5 border-b border-[#8E9AAF]/5">
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <h2 className="text-base font-bold tracking-tight">Material Preview</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8E9AAF]/5 text-[#8E9AAF] hover:bg-[#8E9AAF]/10 active:scale-95 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content Pane */}
          <div className="flex-grow overflow-y-auto px-6 py-5 scrollbar-thin">
            {/* Type badge & rating */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#6C5CE7]/10 text-[#6C5CE7] uppercase">
                {getBadgeIcon(material.type)}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#F5B042]">
                <Star size={14} className="fill-[#F5B042]" />
                <span>{material.rating?.toFixed(1) || '4.8'}</span>
                <span className="text-[#8E9AAF]/60">({material.likes + 2} reviews)</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#F0F3F8] mb-1.5 tracking-tight leading-snug">
              {material.title}
            </h1>

            {/* Author */}
            <p className="text-xs text-[#8E9AAF] mb-6 flex items-center gap-2">
              <span>Author: <strong className="text-[#F0F3F8]">@{material.authorName?.replace(/\s+/g, '_').toLowerCase() || 'aether_scholar'}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(material.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </p>

            {/* Summary */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-[#8E9AAF] uppercase tracking-wider mb-2">Subject / Key Areas</h3>
              <p className="text-sm text-[#F0F3F8] leading-relaxed bg-[#141A24]/50 border border-[#8E9AAF]/5 rounded-2xl p-4">
                {material.summary || "This comprehensive educational material has been uploaded by the community to accelerate interactive learning, quizzes, and active recall studies."}
              </p>
            </div>

            {/* Key Topics Tags */}
            {material.keyTopics && material.keyTopics.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-[#8E9AAF] uppercase tracking-wider mb-2.5">Key Topics Covered</h3>
                <div className="flex flex-wrap gap-2">
                  {material.keyTopics.map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="text-xs font-semibold text-[#6C5CE7] bg-[#6C5CE7]/5 px-3 py-1.5 rounded-xl border border-[#6C5CE7]/15"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Inside Content Sneak Peek (Demo Content) */}
            <div className="p-4 bg-[#8E9AAF]/5 border border-[#8E9AAF]/5 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-[#00E5A0] uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse" />
                Study Units Snapshot
              </div>
              <ul className="space-y-2 text-xs text-[#8E9AAF]">
                <li>• Includes instant active recall flashcards study pack</li>
                <li>• 10+ dynamically aligned review quiz questions</li>
                <li>• Complete chapter notes and terminology outline</li>
              </ul>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="px-6 py-5 border-t border-[#8E9AAF]/10 bg-[#11151D] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs font-bold text-[#8E9AAF]">
              <span className="flex items-center gap-1.5">
                <Download size={14} className="text-[#00D2FF]" />
                <span className="text-[#F0F3F8] font-extrabold">{material.downloads || 0}</span> clones to libraries
              </span>
            </div>

            <button
              onClick={handleClone}
              disabled={isCloning}
              className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3.5 bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 text-[#F0F3F8] text-sm font-extrabold rounded-2xl shadow-lg transition-all active:scale-[0.98] min-h-[44px] cursor-pointer"
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
