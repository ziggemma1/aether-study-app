import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  FileText, 
  Youtube, 
  BookOpen, 
  Mic, 
  ChevronRight, 
  Check, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Layers, 
  Loader2, 
  Headphones, 
  Globe,
  Star,
  Share2,
  Folder,
  Clock,
  ArrowUpDown,
  Award,
  Sparkles,
  ChevronDown,
  Trash2,
  Bookmark
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Material } from '../types';
import api from '../services/api';
import { Skeleton, MaterialCardSkeleton, MaterialListSkeleton } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';

export default function Library() {
  const { materials, savedPlans, setMaterials, showToast, t, isLoading } = useAppContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter');

  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filter, setFilter] = React.useState(initialFilter ? (initialFilter.charAt(0).toUpperCase() + initialFilter.slice(1)) : 'All');
  const [selectedMaterials, setSelectedMaterials] = React.useState<string[]>([]);
  const [activeTab, setActiveTab] = React.useState<'materials' | 'unified' | 'plans'>('materials');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // Advanced filters from UX Review
  const [sortBy, setSortBy] = React.useState<'newest' | 'oldest' | 'a-z' | 'mastery'>('newest');
  const [groupMode, setGroupMode] = React.useState<'flat' | 'category'>('flat');
  const [starredIds, setStarredIds] = React.useState<string[]>(() => {
    try {
      const cached = localStorage.getItem('starred_materials');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [showSortDropdown, setShowSortDropdown] = React.useState(false);

  React.useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter.charAt(0).toUpperCase() + initialFilter.slice(1));
    }
  }, [initialFilter]);

  React.useEffect(() => {
    localStorage.setItem('starred_materials', JSON.stringify(starredIds));
  }, [starredIds]);

  const materialsList = Array.isArray(materials) ? materials : [];

  const getNormalizedType = (typeStr: string) => {
    return String(typeStr || '').toLowerCase().replace(/[\s_-]+/g, '');
  };

  // Toggle favorite / starred
  const toggleStar = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setStarredIds(prev => {
      const isStarred = prev.includes(id);
      const updated = isStarred ? prev.filter(mId => mId !== id) : [...prev, id];
      showToast(isStarred ? 'Removed from favorites' : 'Added to favorites ⭐', 'success');
      return updated;
    });
  };

  // Helper to log studies horizontally in localStorage
  const handleAccessMaterial = (id: string) => {
    try {
      const cached = localStorage.getItem('recent_studies_detailed');
      let list = cached ? JSON.parse(cached) : [];
      if (!Array.isArray(list)) list = [];
      list = list.filter((item: any) => item && item.id !== id);
      list.unshift({ id, timestamp: Date.now() });
      localStorage.setItem('recent_studies_detailed', JSON.stringify(list.slice(0, 5)));
    } catch (e) {
      console.error('Failed to log recent study:', e);
    }
  };

  const recentItems = React.useMemo(() => {
    try {
      const cached = localStorage.getItem('recent_studies_detailed');
      if (!cached) return [];
      const list = JSON.parse(cached);
      if (!Array.isArray(list)) return [];
      
      return list
        .map((item: any) => {
          if (!item || !item.id) return null;
          const found = materialsList.find(m => (m.id === item.id || (m as any)._id === item.id));
          if (!found) return null;
          return {
            ...found,
            timestamp: item.timestamp
          };
        })
        .filter(Boolean) as (Material & { timestamp: number })[];
    } catch (e) {
      return [];
    }
  }, [materialsList, activeTab, materials]);

  const filteredStandardMaterials = materialsList.filter(m => {
    if (!m || m.type === 'unified') return false;
    
    // Search both title, summary, and first few keyTopics
    const title = String(m.title || '').toLowerCase();
    const summary = String(m.summary || '').toLowerCase();
    const topics = (m.keyTopics || []).map(t => String(t || '').toLowerCase());
    const query = searchQuery.toLowerCase();
    const matchesSearch = title.includes(query) || summary.includes(query) || topics.some(t => t.includes(query));
    
    // Type and Starred Filters
    const matType = getNormalizedType(m.type);
    const mId = m.id || (m as any)._id;
    
    if (filter === 'Starred') {
      return matchesSearch && starredIds.includes(mId);
    }
    
    // Normalize filter matching
    let matchesFilter = false;
    if (filter === 'All') {
      matchesFilter = true;
    } else if (filter === 'PDF') {
      matchesFilter = matType === 'pdf';
    } else if (filter === 'YouTube') {
      matchesFilter = matType === 'youtube' || matType === 'video';
    } else if (filter === 'Article') {
      matchesFilter = matType === 'article' || matType === 'note';
    } else if (filter === 'Audio') {
      matchesFilter = matType === 'audio' || matType === 'voicenote';
    } else {
      matchesFilter = matType === getNormalizedType(filter);
    }
    
    return matchesSearch && matchesFilter;
  });

  const getSortedMaterials = (items: Material[]) => {
    return [...items].sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = new Date(a.uploadDate || 0).getTime();
        const dateB = new Date(b.uploadDate || 0).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        const dateA = new Date(a.uploadDate || 0).getTime();
        const dateB = new Date(b.uploadDate || 0).getTime();
        return dateA - dateB;
      }
      if (sortBy === 'a-z') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'mastery') {
        return (b.progress ?? 0) - (a.progress ?? 0);
      }
      return 0;
    });
  };

  const sortedMaterials = React.useMemo(() => {
    return getSortedMaterials(filteredStandardMaterials);
  }, [filteredStandardMaterials, sortBy]);

  // Grouping by first key topic
  const groupedMaterials = React.useMemo(() => {
    const groups: { [key: string]: Material[] } = {};
    sortedMaterials.forEach(m => {
      const category = m.keyTopics && m.keyTopics.length > 0 ? m.keyTopics[0] : 'General Study';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(m);
    });
    return groups;
  }, [sortedMaterials]);

  const filteredUnifiedMaterials = materialsList.filter(m => {
    if (!m || m.type !== 'unified') return false;
    const title = String(m.title || 'Untitled');
    const matchesSearch = title.toLowerCase().includes(String(searchQuery || '').toLowerCase());
    return matchesSearch;
  });

  const sortedUnifiedMaterials = React.useMemo(() => {
    return getSortedMaterials(filteredUnifiedMaterials);
  }, [filteredUnifiedMaterials, sortBy]);

  const filteredPlans = savedPlans.filter(p => {
    if (!p) return false;
    const title = String(p.title || 'Untitled');
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filterChips = ['All', 'Starred', 'PDF', 'YouTube', 'Article', 'Audio'];

  const getTypeIcon = (type: any) => {
    const typeStr = getNormalizedType(type);
    switch (typeStr) {
      case 'pdf': return FileText;
      case 'youtube': return Youtube;
      case 'video': return Youtube;
      case 'article': return BookOpen;
      case 'note': return BookOpen;
      case 'audio': return Headphones;
      case 'voicenote': return Mic;
      case 'unified': return Layers;
      default: return FileText;
    }
  };

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMaterials(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleGeneratePlan = () => {
    if (selectedMaterials.length === 0) return;
    const ids = selectedMaterials.join(',');
    navigate(`/plans?materials=${ids}`);
  };

  const handleMergeMaterials = async () => {
    if (selectedMaterials.length < 2) return;
    
    try {
      const relatedMaterials = materialsList.filter(m => selectedMaterials.includes(m.id || (m as any)._id));
      const combinedTopics = Array.from(new Set(relatedMaterials.flatMap(m => m.keyTopics || [])));
      const combinedContent = relatedMaterials.map(m => `--- ${m.title || 'Untitled'} ---\n${m.content || m.summary || ''}`).join('\n\n');
      
      const response = await api.post('/materials', {
        title: `Combined: ${relatedMaterials[0]?.title || 'Untitled'} & ${relatedMaterials.length - 1} more`,
        type: 'unified',
        summary: `A unified collection containing insights from: ${relatedMaterials.map(m => m.title || 'Untitled').join(', ')}.`,
        content: combinedContent,
        keyTopics: combinedTopics,
        progress: 0,
      });

      const newMaterial = {
        ...response.data,
        id: response.data._id || response.data.id,
        uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      setMaterials([newMaterial, ...materialsList]);
      setSelectedMaterials([]);
      setActiveTab('unified');
      showToast('Materials merged successfully!');
    } catch (err) {
      console.error('Merge error:', err);
      showToast('Failed to save merged material to cloud.', 'error');
    }
  };

  const handleDeleteMaterials = async () => {
    if (selectedMaterials.length === 0) return;
    
    setIsDeleting(true);
    try {
      await api.post('/materials/bulk-delete', { ids: selectedMaterials });
      setMaterials(materialsList.filter(m => !selectedMaterials.includes(m.id || (m as any)._id)));
      setSelectedMaterials([]);
      setShowDeleteConfirm(false);
      showToast('Selected materials deleted successfully.');
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete materials. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublic = async (e: React.MouseEvent, materialId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.post(`/materials/${materialId}/toggle-public`);
      setMaterials(materialsList.map(m => (m.id === materialId || (m as any)._id === materialId) ? { ...m, isPublic: res.data.isPublic } : m));
      showToast(res.data.isPublic ? 'Material is now public! 🌏' : 'Material is now private. 🔒');
    } catch (err) {
      showToast('Failed to change visibility', 'error');
    }
  };

  const renderMaterialGrid = (items: Material[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {items.map((material) => {
        const mId = material.id || (material as any)._id;
        const Icon = getTypeIcon(material.type);
        const isSelected = selectedMaterials.includes(mId);
        const isStarred = starredIds.includes(mId);
        const isPublic = !!material.isPublic;

        return (
          <motion.div
            key={mId}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "relative glass-card p-4 sm:p-5 transition-all group overflow-hidden border-border border-b-4 rounded-3xl",
              isSelected ? "border-primary shadow-lg shadow-primary/20 border-b-primary bg-primary/5" : "hover:border-primary/50"
            )}
          >
            {/* Index Number - Tech Feel */}
            <div className="absolute -top-2 -left-2 text-4xl font-black text-text-main opacity-[0.03] select-none">
              {(materialsList.indexOf(material) + 1).toString().padStart(2, '0')}
            </div>

            {/* Action Bar (Optimized for Mobile Touch) */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex items-center gap-2">
              {/* Copy Shareable Link */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const shareLink = `${window.location.origin}/share/${mId}`;
                  navigator.clipboard.writeText(shareLink);
                  showToast('Share link copied to clipboard! 📤', 'success');
                }}
                className="w-8 h-8 rounded-xl border border-border/30 bg-surface/85 flex items-center justify-center transition-all text-text-muted active:scale-90"
                title="Copy share link"
              >
                <Share2 size={13} />
              </button>

              {/* Toggle Public Vis */}
              <button
                onClick={(e) => handleTogglePublic(e, mId)}
                className={cn(
                  "w-8 h-8 rounded-xl border flex items-center justify-center transition-all bg-surface/85 active:scale-90",
                  isPublic 
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shadow-sm" 
                    : "border-border/30 text-text-muted"
                )}
                title={isPublic ? "Publicly Shared" : "Private Material"}
              >
                <Globe size={13} />
              </button>

              {/* Star / Favorite */}
              <button
                onClick={(e) => toggleStar(e, mId)}
                className={cn(
                  "w-8 h-8 rounded-xl border flex items-center justify-center transition-all bg-surface/85 active:scale-90",
                  isStarred 
                    ? "border-amber-500/30 text-amber-500 bg-amber-500/10 shadow-sm" 
                    : "border-border/30 text-text-muted"
                )}
                title={isStarred ? "Starred Favorite" : "Add to favorites"}
              >
                <Star size={13} fill={isStarred ? "currentColor" : "none"} />
              </button>

              {/* Selection Checkbox */}
              <button
                onClick={(e) => toggleSelection(e, mId)}
                className={cn(
                  "w-8 h-8 rounded-xl border flex items-center justify-center transition-all active:scale-90",
                  isSelected ? "bg-primary border-primary text-white" : "bg-surface/85 border-border/30"
                )}
              >
                {isSelected ? <Check size={12} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-border" />}
              </button>
            </div>

            {/* Clickable Area to Open Detail */}
            <div 
              onClick={() => { handleAccessMaterial(mId); navigate(`/library/${mId}`); }}
              className="block relative z-0 mt-2 cursor-pointer"
            >
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/10 shrink-0">
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-grow">
                  <h3 className="text-sm font-extrabold line-clamp-1 text-text-main pr-16 group-hover:text-primary transition-colors tracking-tight">
                    {material.title || 'Untitled'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold uppercase text-text-muted tracking-widest">{material.uploadDate || 'Recently'}</span>
                    <span className="text-[9px] text-text-muted/40">•</span>
                    <span className="text-[9px] font-black uppercase text-primary/80 tracking-tighter bg-primary/5 px-1.5 py-0.5 rounded">{material.type || 'PDF'}</span>
                    {isPublic && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                    {isPublic && <span className="text-[9px] font-black uppercase text-emerald-400 tracking-tighter">Live</span>}
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-text-muted mb-4 line-clamp-2 leading-relaxed opacity-80 min-h-[32px]">
                {material.summary || 'Tap to learn more and explore study notes for this material.'}
              </p>
              
              {/* Pinned custom categories/topics badge */}
              {material.keyTopics && material.keyTopics.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4 select-none">
                  {material.keyTopics.slice(0, 2).map((topic, index) => (
                    <span key={index} className="text-[9px] font-semibold text-text-muted/70 bg-surface-alt border border-border/10 px-2 py-0.5 rounded-lg">
                      #{topic}
                    </span>
                  ))}
                </div>
              )}

              {/* Progress/Mastery visual feedback - satisfying UX criteria */}
              <div className="py-2.5 border-t border-dashed border-border/40">
                {material.progress && material.progress > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-black uppercase text-text-muted tracking-[0.15em] flex items-center gap-1">
                        <Award size={10} className="text-primary" /> Mastery progress
                      </span>
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{material.progress}%</span>
                    </div>
                    <div className="h-2 bg-surface-alt/70 border border-border/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${material.progress}%` }}
                        className="h-full bg-gradient-to-r from-primary to-secondary"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[9px] text-text-muted bg-surface-alt/45 px-2.5 py-1 rounded-xl border border-border/10 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 animate-pulse" />
                    <span>No quiz score yet • Complete a Quiz to measure mastery</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Interactive Buttons Row - responsive touch targets */}
            <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-border/30 mt-3 select-none">
              <button 
                onClick={() => { handleAccessMaterial(mId); navigate(`/library/${mId}`); }} 
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-primary/5 hover:bg-primary/10 active:scale-95 text-primary transition-all cursor-pointer min-h-[44px]"
              >
                <BookOpen size={15} />
                <span className="text-[9px] font-black tracking-tight mt-1">Study</span>
              </button>
              <button 
                onClick={() => { handleAccessMaterial(mId); navigate(`/materials/${mId}/notes`); }} 
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-[#00D2FF]/5 hover:bg-[#00D2FF]/10 active:scale-95 text-[#00D2FF] transition-all cursor-pointer min-h-[44px]"
              >
                <FileText size={15} />
                <span className="text-[9px] font-black tracking-tight mt-1">Notes</span>
              </button>
              <button 
                onClick={() => { handleAccessMaterial(mId); navigate(`/quiz/${mId}`); }} 
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-[#F5B042]/5 hover:bg-[#F5B042]/10 active:scale-95 text-[#F5B042] transition-all cursor-pointer min-h-[44px]"
              >
                <Award size={15} />
                <span className="text-[9px] font-black tracking-tight mt-1">Quiz</span>
              </button>
              <button 
                onClick={() => { handleAccessMaterial(mId); navigate(`/flashcards/${mId}`); }} 
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-[#00E5A0]/5 hover:bg-[#00E5A0]/10 active:scale-95 text-[#00E5A0] transition-all cursor-pointer min-h-[44px]"
              >
                <Sparkles size={15} />
                <span className="text-[9px] font-black tracking-tight mt-1">Flash</span>
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  const renderMaterialList = (items: Material[]) => (
    <div className="space-y-4">
      {items.map((material) => {
        const mId = material.id || (material as any)._id;
        const Icon = getTypeIcon(material.type);
        const isSelected = selectedMaterials.includes(mId);
        const isStarred = starredIds.includes(mId);

        return (
          <motion.div
            key={mId}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "relative glass-card p-4 transition-all border-b-2 rounded-2xl",
              isSelected ? "border-primary bg-primary/5" : "border-border/40 hover:bg-surface/80"
            )}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => toggleSelection(e, mId)}
                className={cn(
                  "w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all",
                  isSelected ? "bg-primary border-primary text-white" : "bg-surface border-text-muted/30"
                )}
              >
                {isSelected && <Check size={12} strokeWidth={3} />}
              </button>
              
              <div 
                onClick={() => { handleAccessMaterial(mId); navigate(`/library/${mId}`); }}
                className="flex items-center gap-3 flex-grow cursor-pointer min-w-0"
              >
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary shrink-0">
                  <Icon size={18} />
                </div>
                <div className="flex-grow min-w-0 pr-2">
                  <h3 className="font-extrabold text-sm text-text-main truncate">{material.title || 'Untitled'}</h3>
                  <p className="text-[10px] text-text-muted truncate">
                    {material.uploadDate || 'Recently'} • {String(material.type || '').toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => toggleStar(e, mId)}
                  className={cn("p-1.5 rounded-lg active:scale-90", isStarred ? "text-amber-500" : "text-text-muted/30")}
                >
                  <Star size={14} fill={isStarred ? "currentColor" : "none"} />
                </button>
                <ChevronRight className="text-text-muted/40" size={16} />
              </div>
            </div>

            {/* Quick Actions for List Row */}
            <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-border/10 select-none">
              <button 
                onClick={() => { handleAccessMaterial(mId); navigate(`/library/${mId}`); }}
                className="px-3 py-1 bg-primary/15 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1 cursor-pointer min-h-[30px]"
              >
                <BookOpen size={11} /> Study
              </button>
              <button 
                onClick={() => { handleAccessMaterial(mId); navigate(`/materials/${mId}/notes`); }}
                className="px-3 py-1 bg-[#00D2FF]/15 text-[#00D2FF] rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1 cursor-pointer min-h-[30px]"
              >
                <FileText size={11} /> Notes
              </button>
              <button 
                onClick={() => { handleAccessMaterial(mId); navigate(`/quiz/${mId}`); }}
                className="px-3 py-1 bg-[#F5B042]/15 text-[#F5B042] rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1 cursor-pointer min-h-[30px]"
              >
                <Award size={11} /> Quiz
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  const renderGroupedMaterials = () => {
    const keys = Object.keys(groupedMaterials);
    if (keys.length === 0) {
      return (
        <EmptyState 
          title={t('no_materials_found')}
          message={t('adjust_filter')}
          actionLabel="Reset Search"
          onAction={() => { setSearchQuery(''); setFilter('All'); }}
        />
      );
    }
    
    return (
      <div className="space-y-8 select-none">
        {keys.map((category) => {
          const items = groupedMaterials[category];
          return (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/20">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Folder size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-text-main tracking-tight uppercase">
                    {category}
                  </h3>
                  <p className="text-[9px] text-text-muted font-bold">
                    {items.length} {items.length === 1 ? 'material' : 'materials'}
                  </p>
                </div>
              </div>
              
              {viewMode === 'grid' ? renderMaterialGrid(items) : renderMaterialList(items)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderRecentStudies = () => {
    if (recentItems.length === 0) return null;
    return (
      <div className="mb-6 space-y-3 select-none">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase text-text-muted tracking-wider flex items-center gap-1.5">
            <Clock size={12} className="text-primary" /> Recent Study
          </h3>
          <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
            Resume Learning
          </span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x scroll-smooth custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {recentItems.map((item) => {
            const mId = item.id || (item as any)._id;
            const Icon = getTypeIcon(item.type);
            return (
              <div 
                key={`recent-${mId}`}
                onClick={() => { handleAccessMaterial(mId); navigate(`/library/${mId}`); }}
                className="snap-start shrink-0 w-60 bg-surface/30 hover:bg-surface-alt/60 border border-border/20 rounded-2xl p-3.5 flex gap-3 items-start cursor-pointer transition-all active:scale-[0.98]"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0 border border-primary/10">
                  <Icon size={16} />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="text-xs font-black text-text-main truncate tracking-tight mb-0.5 group-hover:text-primary transition-colors">
                    {item.title || 'Untitled'}
                  </h4>
                  <p className="text-[9px] text-text-muted truncate mb-1.5">
                    {item.summary || 'Tap to study now'}
                  </p>
                  
                  {item.progress && item.progress > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-grow h-1 bg-border/20 rounded-full overflow-hidden">
                        <div className="h-full bg-secondary" style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="text-[9px] font-black text-secondary">{item.progress}%</span>
                    </div>
                  ) : (
                    <span className="text-[9px] font-semibold text-text-muted/60">Not started yet</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-8 lg:p-12 max-w-7xl mx-auto relative min-h-screen pb-24">
      {/* Page Header */}
      <PageHeader 
        title={t('library')} 
        subtitle={
          <div className="flex items-center gap-2 mt-1">
            <span className="text-text-muted">{t('library_desc')}</span>
            <span className="text-xs text-primary bg-primary/15 px-2 py-0.5 rounded-full font-extrabold whitespace-nowrap">
              {materialsList.filter(m => m && m.type !== 'unified').length} files • +2 this week
            </span>
          </div>
        }
        action={
          <div className="flex items-center gap-2.5 shrink-0 select-none">
            <div className="flex bg-surface rounded-xl p-0.5 border border-border/10">
              <button
                onClick={() => setViewMode('grid')}
                className={cn("p-1.5 rounded-lg transition-all", viewMode === 'grid' ? "bg-primary text-white" : "text-text-muted hover:text-primary")}
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn("p-1.5 rounded-lg transition-all", viewMode === 'list' ? "bg-primary text-white" : "text-text-muted hover:text-primary")}
              >
                <List size={14} />
              </button>
            </div>
            
            <Link 
              to="/upload" 
              className="btn-primary !py-2 !px-4 !text-xs text-center font-black uppercase tracking-wider btn-ripple border border-primary/40 focus:outline-none shrink-0"
            >
              {t('upload')}
            </Link>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-4 sm:gap-6 mb-6 sm:mb-8 border-b border-border/50 overflow-x-auto custom-scrollbar select-none">
        <button 
          onClick={() => { setActiveTab('materials'); setSearchQuery(''); }} 
          className={cn("pb-3 text-xs sm:text-sm font-black border-b-2 transition-all whitespace-nowrap", activeTab === 'materials' ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main")}
        >
          {t('materials')} ({materialsList.filter(m => m && m.type !== 'unified').length})
        </button>
        <button 
          onClick={() => { setActiveTab('unified'); setSearchQuery(''); }} 
          className={cn("pb-3 text-xs sm:text-sm font-black border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5", activeTab === 'unified' ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main")}
        >
          <Layers size={14} />
          {t('unified')} ({materialsList.filter(m => m && m.type === 'unified').length})
        </button>
        <button 
          onClick={() => { setActiveTab('plans'); setSearchQuery(''); }} 
          className={cn("pb-3 text-xs sm:text-sm font-black border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5", activeTab === 'plans' ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main")}
        >
          <CalendarIcon size={14} />
          {t('plans')} ({savedPlans.length})
        </button>
      </div>

      {activeTab === 'materials' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {/* Horizontal Recent studies Carousel */}
          {renderRecentStudies()}

          {/* Search, Filter, Sort and Grouping Row */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Intelligent Search Input */}
              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/40" size={16} />
                <input
                  type="text"
                  placeholder="Search by title, description or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border/30 focus:ring-2 focus:ring-primary/25 outline-none bg-surface/30 text-xs sm:text-sm text-text-main placeholder:text-text-muted/40 transition-all font-semibold"
                />
              </div>

              {/* Advanced sorting & grouping controls */}
              <div className="flex gap-2 shrink-0 select-none">
                {/* Group mode Toggler */}
                <button
                  onClick={() => setGroupMode(prev => prev === 'flat' ? 'category' : 'flat')}
                  className={cn(
                    "px-4 py-2 text-xs font-black uppercase rounded-2xl border flex items-center gap-2",
                    groupMode === 'category' 
                      ? "bg-primary/10 border-primary/20 text-primary" 
                      : "bg-surface/30 border-border/20 text-text-muted"
                  )}
                >
                  <Folder size={14} />
                  <span>Subjects</span>
                </button>

                {/* Sort selector dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="px-4 py-2 text-xs font-black uppercase bg-surface/30 hover:bg-surface/60 border border-border/20 text-text-muted rounded-2xl flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <ArrowUpDown size={14} />
                    <span>Sort: {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : sortBy === 'a-z' ? 'A-Z' : 'Mastery'}</span>
                    <ChevronDown size={14} />
                  </button>

                  <AnimatePresence>
                    {showSortDropdown && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setShowSortDropdown(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-44 bg-surface-alt border border-border/30 rounded-2xl shadow-xl p-2 z-35 flex flex-col gap-1"
                        >
                          {(['newest', 'oldest', 'a-z', 'mastery'] as const).map((option) => (
                            <button
                              key={option}
                              onClick={() => {
                                setSortBy(option);
                                setShowSortDropdown(false);
                              }}
                              className={cn(
                                "text-left px-3 py-2 text-xs font-bold rounded-xl transition-all capitalize",
                                sortBy === option ? "bg-primary text-white" : "text-text-muted hover:bg-surface/80"
                              )}
                            >
                              {option === 'a-z' ? 'Alphabetical A-Z' : option}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Horizontal Filter chips scroll bar */}
            <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar select-none">
              {filterChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setFilter(chip)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-1.5",
                    filter === chip
                      ? "bg-secondary text-primary shadow-sm border-secondary font-black"
                      : "bg-surface/30 text-text-muted hover:bg-surface border-border/25"
                  )}
                >
                  {chip === 'Starred' ? <Star size={12} fill="currentColor" /> : null}
                  <span>{chip}</span>
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => <MaterialCardSkeleton key={i} />)}
              </div>
            ) : (
               <div className="space-y-4">
                 {[1, 2, 3, 4, 5, 6].map(i => <MaterialListSkeleton key={i} />)}
               </div>
            )
          ) : sortedMaterials.length > 0 ? (
            groupMode === 'category' ? renderGroupedMaterials() : (viewMode === 'grid' ? renderMaterialGrid(sortedMaterials) : renderMaterialList(sortedMaterials))
          ) : (
            <EmptyState 
              title={t('no_materials_found') || "No materials found"}
              message={t('adjust_filter') || "Try adjusting your search criteria or tags."}
              actionLabel="Show All"
              onAction={() => { setSearchQuery(''); setFilter('All'); }}
            />
          )}
        </motion.div>
      )}

      {activeTab === 'unified' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {/* Simple search bar for unified collections */}
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/40" size={16} />
            <input
              type="text"
              placeholder="Search combined materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border/30 outline-none bg-surface/30 text-xs text-text-main font-semibold"
            />
          </div>

          {isLoading ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map(i => <MaterialCardSkeleton key={i} />)}
              </div>
            ) : (
               <div className="space-y-4">
                 {[1, 2, 3].map(i => <MaterialListSkeleton key={i} />)}
               </div>
            )
          ) : sortedUnifiedMaterials.length > 0 ? (
            viewMode === 'grid' ? renderMaterialGrid(sortedUnifiedMaterials) : renderMaterialList(sortedUnifiedMaterials)
          ) : (
            <EmptyState 
              title={t('no_unified_materials') || "No unified study folders"}
              message={t('no_unified_materials_desc') || "Merge materials from your Library to create unified subjects."}
              actionLabel="Go to Library"
              onAction={() => setActiveTab('materials')}
              icon={<Layers size={22} />}
            />
          )}
        </motion.div>
      )}

      {activeTab === 'plans' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {/* Simple search bar for study plans */}
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/40" size={16} />
            <input
              type="text"
              placeholder="Search current plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border/30 outline-none bg-surface/30 text-xs text-text-main font-semibold"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card p-6 h-[180px] flex flex-col justify-between rounded-3xl">
                  <div className="flex justify-between items-start mb-4">
                     <Skeleton className="w-10 h-10 rounded-xl" />
                     <Skeleton className="w-16 h-3" />
                  </div>
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <div className="flex items-center gap-4 mb-4">
                     <Skeleton className="flex-grow h-1.5 rounded-full" />
                     <Skeleton className="w-6 h-4" />
                  </div>
                  <Skeleton className="w-full h-10 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map(p => (
                <div key={p.id} className="glass-card p-6 border-border/40 hover:border-primary/30 transition-all rounded-3xl group">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", p.progress === 100 ? "bg-green-500/10 text-green-400" : "bg-primary/10 text-primary")}>
                      {p.progress === 100 ? <CheckCircle2 size={20} /> : <CalendarIcon size={20} />}
                    </div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{p.date}</span>
                  </div>
                  <h3 className="text-base font-black text-text-main mb-2 tracking-tight">{p.title}</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-grow h-1.5 bg-surface-alt rounded-full overflow-hidden">
                      <div className={cn("h-full", p.progress === 100 ? "bg-green-500" : "bg-primary")} style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className={cn("text-xs font-black", p.progress === 100 ? "text-green-400" : "text-primary")}>{p.progress}%</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/plans?planId=${p.id}`)}
                    className="w-full py-2.5 bg-surface-alt hover:bg-primary/10 text-text-main hover:text-primary rounded-2xl text-xs font-bold transition-all"
                  >
                    {t('continue_studying') || "Continue Study Plan"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              title={t('no_saved_plans') || "No Roadmaps Available"}
              message={t('no_saved_plans_desc') || "Go to any material and click 'Create Roadmap' to build a daily planner."}
              actionLabel={t('browse_materials') || "Explore Study Files"}
              onAction={() => setActiveTab('materials')}
              icon={<CalendarIcon size={22} />}
            />
          )}
        </motion.div>
      )}

      {/* Floating Bulk Action bar (Checkboxes / Multiselections) */}
      <AnimatePresence>
        {(activeTab === 'materials' || activeTab === 'unified') && selectedMaterials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-55 pointer-events-none w-[calc(100%-2rem)] sm:w-auto"
          >
            <div className="pointer-events-auto bg-surface-alt/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-3xl px-4 py-3 flex flex-row items-center justify-between sm:justify-start gap-4">
              <span className="text-[11px] font-black text-text-main whitespace-nowrap pl-1">
                <span className="text-primary">{selectedMaterials.length}</span> {t('items_selected') || "files selected"}
              </span>
              <div className="flex items-center gap-2 border-l border-border/40 pl-4">
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 sm:px-4 sm:py-2 rounded-xl font-bold transition-all text-xs flex items-center gap-1 border border-red-500/20 active:scale-95"
                  title="Delete Selected"
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">Delete</span>
                </button>
                {selectedMaterials.length > 1 && (
                  <button 
                    onClick={handleMergeMaterials}
                    className="bg-surface border border-border/40 p-2 sm:px-4 sm:py-2 rounded-xl hover:border-primary text-text-main font-bold transition-all text-xs flex items-center gap-1 active:scale-95"
                    title="Merge Selected"
                  >
                    <Layers size={13} />
                    <span className="hidden sm:inline">Merge</span>
                  </button>
                )}
                <button 
                  onClick={handleGeneratePlan}
                  className="btn-primary py-2 px-3.5 sm:px-5 rounded-xl shadow-lg shadow-primary/20 whitespace-nowrap text-xs font-black uppercase flex items-center gap-1.5 active:scale-95"
                >
                  <CalendarIcon size={12} />
                  <span>Build Plan</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm glass-card p-6 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)] rounded-3xl"
            >
              <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-black text-text-main text-center mb-1 tracking-tight">Delete materials permanently?</h3>
              <p className="text-text-muted text-center text-xs mb-6">
                Are you sure you want to delete these study files? You will lose all related study progress and flashcards.
              </p>
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-outline py-2.5 rounded-2xl text-xs font-bold"
                  disabled={isDeleting}
                >
                  {t('cancel') || "Cancel"}
                </button>
                <button
                  onClick={handleDeleteMaterials}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600 text-white font-black py-2.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
