import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Youtube, BookOpen, Sparkles, Award, Share2, ClipboardCheck, Clock, Trash2, CheckCircle2, Circle, Combine } from 'lucide-react';
import { LibraryMaterial } from '../../hooks/useLibrary';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';

interface LibraryCardProps {
  material: LibraryMaterial;
  selected?: boolean;
  selectionMode?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string, title: string) => void;
}

export function LibraryCard({ material, selected, selectionMode, onSelect, onDelete }: LibraryCardProps) {
  const navigate = useNavigate();
  const { showToast } = useAppContext();
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const id = material.id || (material as any)._id;
    if (!id || isSharing) return;

    setIsSharing(true);
    try {
      // The material's own id is never a valid share token — the backend
      // mints a distinct random token via /materials/share. A link built
      // from the id directly 404s for whoever opens it.
      const response = await api.post('/materials/share', { materialId: id });
      const { shareUrl } = response.data;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Share link copied to clipboard! 📤', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to generate share link', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const id = material.id || (material as any)._id;
    console.log(`[LibraryCard] Clicked delete for ${material.title} (${id})`);
    if (onDelete && id) {
      onDelete(id, material.title);
    }
  };

  const handleCardClick = () => {
    const id = material.id || (material as any)._id;
    if (selectionMode && onSelect && id) {
      onSelect(id);
    } else if (id) {
      navigate(`/library/${id}`);
    }
  };

  // Get status metadata from mastery level
  const statusConfig = React.useMemo(() => {
    const mastery = material.mastery || 0;
    if (mastery >= 90) {
      return { label: 'Complete', color: '#00E5A0', bg: 'rgba(0, 229, 160, 0.12)' };
    }
    if (mastery > 0) {
      return { label: 'In Progress', color: '#00D2FF', bg: 'rgba(0, 210, 255, 0.12)' };
    }
    return { label: 'New', color: '#FF5E7E', bg: 'rgba(255, 94, 126, 0.12)', pulse: true };
  }, [material.mastery]);

  // Type mappings and configuration
  const getBadgeConfig = (typeStr: string) => {
    const normType = typeStr.toLowerCase();
    if (normType === 'pdf') {
      return { label: 'PDF Document', color: '#6C5CE7', icon: FileText };
    }
    if (normType === 'youtube' || normType === 'video') {
      return { label: 'Video Lecture', color: '#F5B042', icon: Youtube };
    }
    if (normType === 'quiz') {
      return { label: 'Quiz Pack', color: '#00E5A0', icon: Award };
    }
    if (normType === 'unified') {
      return { label: 'Unified Guide', color: '#00D2FF', icon: Combine };
    }
    return { label: 'Study Notes', color: '#00D2FF', icon: BookOpen };
  };

  const badge = getBadgeConfig(material.type);
  const IconComponent = badge.icon;

  const navigateTo = (path: string) => {
    navigate(path);
  };

  // Mastery progress color bands
  const getProgressColor = (pct: number) => {
    if (pct < 30) return 'from-[#FF5E7E] to-[#FF9F68]'; // Ruby to amber
    if (pct < 60) return 'from-[#F5B042] to-[#FFD54F]'; // Amber to light amber
    if (pct < 80) return 'from-[#00D2FF] to-[#6C5CE7]'; // Cyan to Purple
    return 'from-[#00E5A0] to-[#00D2FF]'; // Emerald to Cyan
  };

  const pct = material.mastery || 0;

  return (
    <motion.div
      layout
      whileHover={{ y: -5 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`group relative flex rounded-3xl bg-surface/90 border ${
        selected ? 'border-[#6C5CE7] shadow-[0_0_20px_rgba(108,92,231,0.2)]' : 'border-border'
      } hover:border-[#6C5CE7]/30 hover:shadow-[0_12px_36px_rgba(108,92,231,0.12)] transition-all overflow-hidden w-full min-h-[290px] select-none shadow-[0_4px_24px_rgba(0,0,0,0.1)] flex-col cursor-pointer`}
      onClick={handleCardClick}
    >
      {/* 0. Selection Overlay & Checkbox */}
      {selectionMode && (
        <div className={`absolute inset-0 z-10 transition-all duration-300 ${
          selected ? 'bg-[#6C5CE7]/20 ring-4 ring-[#6C5CE7] ring-inset' : 'bg-black/20'
        }`} />
      )}
      
      {(selectionMode || selected) && (
        <div className="absolute top-4 right-4 z-50 p-1">
          {selected ? (
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-[#6C5CE7] rounded-full p-2 shadow-2xl shadow-[#6C5CE7]/60 border-2 border-white"
            >
              <CheckCircle2 size={24} className="text-white" strokeWidth={4} />
            </motion.div>
          ) : (
            <div className="bg-white/20 rounded-full p-2 border-2 border-white/60 text-white backdrop-blur-xl shadow-xl">
              <Circle size={24} strokeWidth={4} />
            </div>
          )}
        </div>
      )}

      {/* 1. Left Gradient Border Overlay Block */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-2 shrink-0 transition-all duration-300 pointer-events-none group-hover:w-2.5"
        style={{ 
          background: `linear-gradient(to bottom, ${badge.color}, ${statusConfig.color})`,
          opacity: 0.85 
        }}
      />

      {/* Main card body area wrapper */}
      <div className="flex-grow pl-6 pr-5 pt-5 pb-4 flex flex-col justify-between">
        
        {/* Top Badges Header Row */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            {/* Status Indicator */}
            <div className="flex items-center gap-1.5">
              <span 
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  statusConfig.pulse ? 'animate-pulse' : ''
                }`}
                style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
              >
                {statusConfig.pulse && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5E7E] animate-ping shrink-0" />}
                {statusConfig.label}
              </span>

              <span className="text-[11px] text-text-muted/40">•</span>
              
              <span className="text-[11px] font-bold text-text-muted/80 uppercase font-mono">
                {badge.label}
              </span>
            </div>

            {/* Quick Share / Delete Buttons */}
            <div className="flex items-center gap-2 shrink-0 relative z-40">
              {selectionMode ? (
                null
              ) : (
                <>
                  {/* Share leads; delete follows. Delete keeps its 44px target
                      but rests in muted grey and only turns red on intent —
                      it used to sit first and shout as loudly as the action
                      people actually came to use. */}
                  <button
                    onClick={handleShare}
                    disabled={isSharing}
                    id={`lib-share-${material.id || (material as any)._id}`}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6C5CE7]/10 text-[#6C5CE7] hover:bg-[#6C5CE7] hover:text-white active:scale-95 transition-all outline-none border border-[#6C5CE7]/20 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                    title="Share study material"
                    aria-label={`Share ${material.title}`}
                  >
                    {copied ? <ClipboardCheck size={20} className="text-white" /> : <Share2 size={20} />}
                  </button>

                  <button
                    onClick={handleDelete}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-transparent text-text-muted/70 hover:bg-red-500/10 hover:text-red-400 focus-visible:bg-red-500/10 focus-visible:text-red-400 transition-all active:scale-95 outline-none border border-transparent hover:border-red-500/20 cursor-pointer"
                    title="Delete study material"
                    aria-label={`Delete ${material.title}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <h4 className="text-base font-extrabold text-text-main line-clamp-2 md:line-clamp-1 mb-1 tracking-tight leading-snug group-hover:text-[#6C5CE7] transition-colors">
            {material.title}
          </h4>

          {/* Date bar */}
          <div className="flex items-center gap-1.5 text-xs text-text-muted/70 mb-3 font-semibold select-none">
            <Clock size={12} className="text-text-muted/40" />
            <span>Updated: {material.date || 'June 15, 2026'}</span>
          </div>

          {/* Summary / Description preview */}
          {material.description ? (
            <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-4 leading-normal font-normal">
              {material.description}
            </p>
          ) : (
            <p className="text-xs italic text-text-muted/40 mb-4 select-none">
              Double-click to expand and synthesize direct quiz reviews.
            </p>
          )}

          {/* Tags */}
          {material.tags && material.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4 select-none">
              {material.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="text-[11px] font-bold text-text-muted/80 bg-text-muted/5 px-2.5 py-1 rounded-lg border border-border"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Outer bottom actions/progress container wrapper */}
        <div>
          {/* Progress / Mastery Bar */}
          <div className="pt-3.5 border-t border-border mb-4 select-none">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-extrabold uppercase text-text-muted/80 tracking-wider">
                Concept Mastery
              </span>
              <span className="text-xs font-bold font-mono text-text-main">
                {pct}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-surface/40 border border-border rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getProgressColor(pct)} rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${pct || 4}%` }}
              />
            </div>
          </div>

          {/* Interaction Touch Buttons (min size 44px) */}
          {!selectionMode && (
            <div className="grid grid-cols-4 gap-2 pt-1 border-t border-border">
              {/* STUDY */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo(`/library/${material.id}`);
                }}
                className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-[#6C5CE7]/10 hover:bg-[#6C5CE7]/20 text-[#6C5CE7] active:scale-95 transition-all min-h-[44px] cursor-pointer"
                id={`lib-card-study-${material.id}`}
                title="Study Materials"
              >
                <BookOpen size={15} />
                <span className="text-[11px] font-black uppercase tracking-tight mt-1">Study</span>
              </button>

              {/* NOTES SNEAK */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo(`/materials/${material.id}/notes`);
                }}
                className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-[#00D2FF]/10 hover:bg-[#00D2FF]/20 text-[#00D2FF] active:scale-95 transition-all min-h-[44px] cursor-pointer"
                id={`lib-card-notes-${material.id}`}
                title="Detailed Notes"
              >
                <FileText size={15} />
                <span className="text-[11px] font-black uppercase tracking-tight mt-1">Notes</span>
              </button>

              {/* QUIZ */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo(`/quiz/${material.id}`);
                }}
                className={`flex flex-col items-center justify-center py-2.5 rounded-xl active:scale-95 transition-all min-h-[44px] cursor-pointer ${
                  material.hasQuiz
                    ? 'bg-[#F5B042]/10 hover:bg-[#F5B042]/20 text-[#F5B042]'
                    : 'bg-text-muted/5 hover:bg-text-muted/10 text-text-muted/40 disabled:opacity-40'
                }`}
                id={`lib-card-quiz-${material.id}`}
                title="Interactive Quiz"
                disabled={!material.hasQuiz}
              >
                <Award size={15} />
                <span className="text-[11px] font-black uppercase tracking-tight mt-1">Quiz</span>
              </button>

              {/* FLASHCARDS */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo(`/flashcards/${material.id}`);
                }}
                className={`flex flex-col items-center justify-center py-2.5 rounded-xl active:scale-95 transition-all min-h-[44px] cursor-pointer ${
                  material.hasFlashcards
                    ? 'bg-[#00E5A0]/10 hover:bg-[#00E5A0]/20 text-[#00E5A0]'
                    : 'bg-text-muted/5 hover:bg-text-muted/10 text-text-muted/40 disabled:opacity-40'
                }`}
                id={`lib-card-flash-${material.id}`}
                title="Active Recall Flashcards"
                disabled={!material.hasFlashcards}
              >
                <Sparkles size={15} />
                <span className="text-[11px] font-black uppercase tracking-tight mt-1">Flash</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </motion.div>
  );
}
