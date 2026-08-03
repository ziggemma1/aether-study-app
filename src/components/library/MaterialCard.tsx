import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    if (normType === 'pdf') {
      return { label: 'PDF', color: '#6C5CE7', icon: FileText };
    }
    if (normType === 'youtube' || normType === 'video') {
      return { label: 'Videos', color: '#F5B042', icon: Youtube };
    }
    if (normType === 'quiz') {
      return { label: 'Quizzes', color: '#00E5A0', icon: Award };
    }
    // note, article, audio, default
    return { label: 'Notes', color: '#00D2FF', icon: BookOpen };
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
      className="group relative flex flex-col justify-between rounded-2xl bg-[#141A24] p-5 border border-[#8E9AAF]/5 transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] w-full h-full min-h-[280px]"
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
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8E9AAF]/5 text-[#8E9AAF] transition-all active:scale-90 active:bg-[#8E9AAF]/10 shrink-0 cursor-pointer"
            title="Share material"
          >
            <Share2 size={16} className={copied ? 'text-[#00E5A0]' : ''} />
          </button>
        </div>

        {/* Content Section */}
        <h3 className="text-base font-bold text-[#F0F3F8] line-clamp-1 mb-1 tracking-tight">
          {material.title}
        </h3>
        
        <p className="text-xs text-[#8E9AAF] mb-3 line-clamp-1 font-medium">
          Uploaded: {material.date}
        </p>

        {material.description && (
          <p className="text-sm text-[#8E9AAF] line-clamp-2 leading-relaxed mb-4">
            {material.description}
          </p>
        )}

        {/* Tags Section */}
        {material.tags && material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 select-none">
            {material.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="text-[11px] font-semibold text-[#8E9AAF] bg-[#8E9AAF]/5 px-2.5 py-1 rounded-lg border border-[#8E9AAF]/10 whitespace-nowrap"
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
          <div className="pt-3 border-t border-[#8E9AAF]/5 mb-4 selectors-progress">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase text-[#8E9AAF] tracking-wider">
                  Mastery Progress
                </span>
                <span className="text-xs font-semibold text-[#6C5CE7]">
                  {material.mastery}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#141A24]/50 border border-[#8E9AAF]/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] rounded-full transition-all duration-500"
                  style={{ width: `${material.mastery}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Interactive Buttons (Touch Target: min 44px) */}
        <div className="grid grid-cols-4 gap-2 border-t border-[#8E9AAF]/5 pt-3">
          <button
            onClick={() => navigateTo(`/library/${material.id}`)}
            className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-[#6C5CE7]/5 hover:bg-[#6C5CE7]/10 active:scale-95 text-[#6C5CE7] transition-all min-h-[44px] cursor-pointer"
            id={`btn-study-${material.id}`}
          >
            <BookOpen size={16} />
            <span className="text-[11px] font-bold mt-1 tracking-tight">Study</span>
          </button>
          <button
            onClick={() => navigateTo(`/materials/${material.id}/notes`)}
            className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-[#00D2FF]/5 hover:bg-[#00D2FF]/10 active:scale-95 text-[#00D2FF] transition-all min-h-[44px] cursor-pointer"
            id={`btn-notes-${material.id}`}
          >
            <FileText size={16} />
            <span className="text-[11px] font-bold mt-1 tracking-tight">Notes</span>
          </button>
          <button
            onClick={() => navigateTo(`/quiz/${material.id}`)}
            className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-[#F5B042]/5 hover:bg-[#F5B042]/10 active:scale-95 text-[#F5B042] transition-all min-h-[44px] cursor-pointer"
            id={`btn-quiz-${material.id}`}
          >
            <Award size={16} />
            <span className="text-[11px] font-bold mt-1 tracking-tight">Quiz</span>
          </button>
          <button
            onClick={() => navigateTo(`/flashcards/${material.id}`)}
            className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-[#00E5A0]/5 hover:bg-[#00E5A0]/10 active:scale-95 text-[#00E5A0] transition-all min-h-[44px] cursor-pointer"
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
