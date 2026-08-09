import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Youtube, BookOpen, Sparkles, Award, Share2, ClipboardCheck,
  Trash2, CheckCircle2, Circle, Combine, MoreHorizontal, ArrowUpRight
} from 'lucide-react';
import { LibraryMaterial } from '../../hooks/useLibrary';
import { pastelForType, formatDate, getMasteryColor } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';

interface LibraryCardProps {
  material: LibraryMaterial;
  selected?: boolean;
  selectionMode?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string, title: string) => void;
}

/**
 * Library material card.
 *
 * Redesigned around four problems the old layout had:
 *  1. The header carried five competing things (status chip, bullet, a
 *     two-word type label that wrapped to two lines, share, delete). Type is
 *     now an icon chip in the material's own tone, and the two management
 *     actions moved behind one overflow button.
 *  2. Delete sat top-right of every card at full visual weight — the exact
 *     defect the UI audit recorded. It is now inside the overflow menu. Not
 *     hover-revealed: hover does not exist on touch, so a hover-only delete
 *     would be unreachable on a phone.
 *  3. Every un-started material rendered a red near-empty "0%" bar, so a fresh
 *     library read as a wall of failure. 0 is now stated as "Not started" with
 *     a neutral track; the coloured mastery scale only appears once there is
 *     real progress to colour.
 *  4. The footer had four equal buttons, one of which ("Study") navigated to
 *     exactly the same route as clicking the card. That one is gone; the three
 *     that remain each go somewhere the card itself does not.
 */
export function LibraryCard({ material, selected, selectionMode, onSelect, onDelete }: LibraryCardProps) {
  const navigate = useNavigate();
  const { showToast } = useAppContext();
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const id = material.id || (material as any)._id;

  // Close the overflow menu on outside click or Escape. Without this the menu
  // stays open while you interact with another card, and keyboard users have
  // no way out of it.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
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
      setMenuOpen(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpen(false);
    if (onDelete && id) onDelete(id, material.title);
  };

  const openMaterial = () => {
    if (selectionMode && onSelect && id) onSelect(id);
    else if (id) navigate(`/library/${id}`);
  };

  const go = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    navigate(path);
  };

  const tone = pastelForType(material.type);
  const tint = `var(--pastel-${tone})`;
  const ink = `var(--pastel-${tone}-ink)`;

  // Short labels. "PDF DOCUMENT" was long enough to wrap onto a second line in
  // a three-column grid, which is what pushed the header out of alignment.
  const typeConfig = (() => {
    const t = (material.type || '').toLowerCase();
    if (t === 'pdf') return { label: 'PDF', Icon: FileText };
    if (t === 'youtube' || t === 'video') return { label: 'Video', Icon: Youtube };
    if (t === 'quiz') return { label: 'Quiz', Icon: Award };
    if (t === 'unified') return { label: 'Guide', Icon: Combine };
    return { label: 'Notes', Icon: BookOpen };
  })();
  const TypeIcon = typeConfig.Icon;

  const pct = Math.max(0, Math.min(100, material.mastery || 0));
  const started = pct > 0;

  // The shared helper rather than a local copy of the thresholds — a second
  // copy is how this card's bar and the Library's stats row drift apart.
  const masteryColor = getMasteryColor(pct);

  const tags = material.tags?.filter(Boolean) ?? [];
  const shownTags = tags.slice(0, 2);
  const extraTags = tags.length - shownTags.length;

  const secondaryActions = [
    // hasNotes comes from the backend (detailedNotes / noteSections /
    // structuredNote). The old card ignored it and left Notes always enabled,
    // so a material with no notes still offered a button to an empty page.
    { key: 'notes', label: 'Notes', Icon: FileText, path: `/materials/${id}/notes`, enabled: !!material.hasNotes, hint: material.hasNotes ? 'Detailed notes' : 'No notes generated yet' },
    { key: 'quiz', label: 'Quiz', Icon: Award, path: `/quiz/${id}`, enabled: !!material.hasQuiz, hint: material.hasQuiz ? 'Interactive quiz' : 'No quiz generated yet' },
    { key: 'flash', label: 'Flashcards', Icon: Sparkles, path: `/flashcards/${id}`, enabled: !!material.hasFlashcards, hint: material.hasFlashcards ? 'Active recall flashcards' : 'No flashcards generated yet' },
  ];

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      onClick={openMaterial}
      className={`group relative flex h-full w-full flex-col rounded-[var(--radius-card)] bg-surface border transition-shadow cursor-pointer select-none ${
        selected
          ? 'border-primary shadow-[var(--shadow-card-hover)]'
          : 'border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]'
      }`}
    >
      {/* Selection state. The dimming overlay is gone — it greyed the text of
          every unselected card during bulk select, which made the list harder
          to read at exactly the moment you need to read it. A ring on the
          selected card carries the state instead. */}
      {selected && (
        <span className="pointer-events-none absolute inset-0 rounded-[var(--radius-card)] ring-2 ring-primary ring-inset" />
      )}

      {(selectionMode || selected) && (
        <div className="absolute top-3 right-3 z-30">
          {selected ? (
            <motion.div
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              className="rounded-full bg-primary text-white p-0.5 shadow-[var(--shadow-card)]"
            >
              <CheckCircle2 size={22} strokeWidth={2.5} />
            </motion.div>
          ) : (
            <div className="rounded-full bg-surface text-text-muted p-0.5 border border-border">
              <Circle size={22} strokeWidth={2} />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* ---- Header: type identity, then overflow ---- */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* The icon was computed by the old card and then never rendered,
                so type was communicated only by a word and a stripe colour. */}
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: tint, color: ink }}
            >
              <TypeIcon size={17} />
            </span>
            <div className="min-w-0">
              {/* Label in ink, not the tone: at full saturation the type ink is
                  a crimson/amber strong enough to read as a warning. The chip
                  behind the icon already carries the colour coding. */}
              <p className="text-[11px] font-semibold leading-none text-text-main">
                {typeConfig.label}
              </p>
              <p className="mt-1 truncate text-[11px] leading-none text-text-muted">
                {material.date ? formatDate(material.date) : 'No date'}
              </p>
            </div>
          </div>

          {!selectionMode && (
            <div className="relative z-30 shrink-0" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-alt hover:text-text-main transition-colors cursor-pointer"
                aria-label={`Actions for ${material.title}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <MoreHorizontal size={18} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-10 w-44 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card-hover)] py-1"
                >
                  <button
                    role="menuitem"
                    onClick={handleShare}
                    disabled={isSharing}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-text-main hover:bg-surface-alt transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                  >
                    {copied
                      ? <><ClipboardCheck size={16} className="text-accent" /> Link copied</>
                      : <><Share2 size={16} className="text-text-muted" /> {isSharing ? 'Creating link…' : 'Share'}</>}
                  </button>
                  <button
                    role="menuitem"
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-brand-pink hover:bg-brand-pink/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---- Title. A real button so keyboard users have a focusable target;
                the card's own onClick is a mouse convenience on top of it. ---- */}
        <button
          onClick={(e) => { e.stopPropagation(); openMaterial(); }}
          className="group/title text-left outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <h4 className="flex items-start gap-1 font-heading text-[15px] font-bold leading-snug text-text-main line-clamp-2 group-hover:text-primary transition-colors">
            <span className="min-w-0">{material.title}</span>
            <ArrowUpRight
              size={15}
              className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-primary"
            />
          </h4>
        </button>

        {material.description && (
          <p className="text-xs leading-relaxed text-text-muted line-clamp-2">
            {material.description}
          </p>
        )}

        {/* Tags: two, then a count. Three truncated tags told you less than two
            whole ones — "#Set operations: union, intersection, co…" is not a
            label you can read at a glance. */}
        {shownTags.length > 0 && (
          /* One row, never wrapping. With wrapping the "+10" dropped onto a
             line of its own and cost the card a whole extra row of height for
             three characters. flex-1 lets the two tags share the width and
             truncate; the counter is shrink-0 so it always stays on the end. */
          <div className="flex items-center gap-1.5">
            {shownTags.map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                title={tag}
                className="min-w-0 flex-1 truncate rounded-md bg-surface-alt px-2 py-1 text-[11px] font-medium text-text-muted"
              >
                {tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span
                className="shrink-0 py-1 text-[11px] font-medium text-text-muted"
                title={tags.slice(2).join(', ')}
              >
                +{extraTags}
              </span>
            )}
          </div>
        )}

        {/* mt-auto pins the footer to the bottom so cards of differing text
            length still line their progress bars and buttons up across a row. */}
        <div className="mt-auto pt-3 flex flex-col gap-3">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[11px] font-medium text-text-muted">Mastery</span>
              <span
                className="text-[11px] font-semibold"
                style={{ color: started ? masteryColor : 'var(--text-muted)' }}
              >
                {started ? `${pct}%` : 'Not started'}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ring-track)]">
              {started && (
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: masteryColor }}
                />
              )}
            </div>
          </div>

          {!selectionMode && (
            <div className="grid grid-cols-3 gap-1.5 border-t border-border pt-3">
              {secondaryActions.map(({ key, label, Icon, path, enabled, hint }) => (
                <button
                  key={key}
                  onClick={(e) => enabled && go(e, path)}
                  disabled={!enabled}
                  id={`lib-card-${key}-${id}`}
                  title={hint}
                  className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl text-[11px] font-semibold transition-colors ${
                    enabled
                      ? 'bg-surface-alt text-text-muted hover:bg-primary/10 hover:text-primary cursor-pointer'
                      : 'bg-surface-alt/40 text-text-muted/40 cursor-not-allowed'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
