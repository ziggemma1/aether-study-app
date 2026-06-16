import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { Search, Filter, Grid, List, FileText, Youtube, BookOpen, Mic, ChevronRight, Check, Calendar as CalendarIcon, CheckCircle2, Layers, Loader2, Headphones, Globe } from 'lucide-react';
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

  React.useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter.charAt(0).toUpperCase() + initialFilter.slice(1));
    }
  }, [initialFilter]);

  const materialsList = Array.isArray(materials) ? materials : [];

  const getNormalizedType = (typeStr: string) => {
    return String(typeStr || '').toLowerCase().replace(/[\s_-]+/g, '');
  };

  const filteredStandardMaterials = materialsList.filter(m => {
    if (!m || m.type === 'unified') return false;
    const title = String(m.title || 'Untitled');
    const matchesSearch = title.toLowerCase().includes(String(searchQuery || '').toLowerCase());
    
    const matType = getNormalizedType(m.type);
    const filterType = getNormalizedType(filter);
    const matchesFilter = filterType === 'all' || matType === filterType;
    return matchesSearch && matchesFilter;
  });

  const filteredUnifiedMaterials = materialsList.filter(m => {
    if (!m || m.type !== 'unified') return false;
    const title = String(m.title || 'Untitled');
    const matchesSearch = title.toLowerCase().includes(String(searchQuery || '').toLowerCase());
    return matchesSearch;
  });

  const filterChips = ['All', 'PDF', 'YouTube', 'Article', 'Audio', 'Voice Note'];

  const getTypeIcon = (type: any) => {
    const typeStr = getNormalizedType(type);
    switch (typeStr) {
      case 'pdf': return FileText;
      case 'youtube': return Youtube;
      case 'article': return BookOpen;
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
        const isPublic = !!material.isPublic;

        return (
          <motion.div
            key={mId}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            className={cn(
              "relative glass-card p-4 sm:p-5 transition-all group overflow-hidden border-border border-b-4",
              isSelected ? "border-primary shadow-lg shadow-primary/20 border-b-primary/80 bg-primary/5" : "hover:border-primary/50"
            )}
          >
            {/* Index Number - Technical Feel */}
            <div className="absolute -top-2 -left-2 text-4xl font-black text-text-main opacity-[0.03] select-none">
              {(materialsList.indexOf(material) + 1).toString().padStart(2, '0')}
            </div>

            {/* Action Bar */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex items-center gap-2">
              <button
                onClick={(e) => handleTogglePublic(e, mId)}
                className={cn(
                  "w-7 h-7 rounded-lg border flex items-center justify-center transition-all backdrop-blur-sm",
                  isPublic 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-sm" 
                    : "bg-surface/50 border-border/50 text-text-muted hover:text-primary hover:border-primary/30"
                )}
              >
                <Globe size={12} />
              </button>

              <button
                onClick={(e) => toggleSelection(e, mId)}
                className={cn(
                  "w-7 h-7 rounded-lg border flex items-center justify-center transition-all",
                  isSelected ? "bg-primary border-primary text-white" : "bg-surface/50 border-border group-hover:border-primary/30 hover:bg-surface"
                )}
              >
                {isSelected ? <Check size={12} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary/50" />}
              </button>
            </div>

            <Link to={`/library/${mId}`} className="block relative z-0 mt-2">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-primary/20">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black line-clamp-1 text-text-main pr-8 group-hover:text-primary transition-colors tracking-tight">
                    {material.title || 'Untitled'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-black uppercase text-text-muted tracking-widest">{material.uploadDate || 'Recently'}</span>
                    {isPublic && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                    {isPublic && <span className="text-[9px] font-black uppercase text-emerald-500 tracking-tighter">Live</span>}
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-text-muted mb-6 line-clamp-2 leading-relaxed opacity-80 min-h-[32px]">
                {material.summary || ''}
              </p>
              
              <div className="pt-4 border-t border-dashed border-border/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black uppercase text-text-muted tracking-[0.2em]">Mastery</span>
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-sm">{material.progress ?? 0}%</span>
                </div>
                <div className="h-1 bg-surface-alt rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${material.progress ?? 0}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            </Link>
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
        return (
          <motion.div
            key={mId}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "relative glass-card p-4 transition-all border-2",
              isSelected ? "border-primary bg-primary/5" : "border-border/40 hover:bg-surface/80 hover:border-primary/30"
            )}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={(e) => toggleSelection(e, mId)}
                className={cn(
                  "w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-all",
                  isSelected ? "bg-primary border-primary text-white" : "bg-surface border-text-muted/30 hover:border-primary/50"
                )}
              >
                {isSelected && <Check size={14} strokeWidth={3} />}
              </button>
              <Link to={`/library/${mId}`} className="flex items-center gap-6 flex-grow">
                <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary shrink-0">
                  <Icon size={20} />
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-text-main">{material.title || 'Untitled'}</h3>
                  <p className="text-xs text-text-muted">{material.uploadDate || 'Recently'} • {String(material.type || '').toUpperCase()}</p>
                </div>
                <div className="hidden md:block w-48 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex-grow h-1.5 bg-surface rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full bg-secondary"
                        style={{ width: `${material.progress ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-text-muted">{material.progress ?? 0}%</span>
                  </div>
                </div>
                <ChevronRight className="text-text-muted shrink-0" size={20} />
              </Link>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div className="p-3 sm:p-8 lg:p-12 max-w-7xl mx-auto relative min-h-screen pb-24">
      <PageHeader 
        title={t('library')} 
        subtitle={t('library_desc')} 
        action={
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex bg-surface rounded-xl p-0.5 shadow-sm border border-border/10 select-none">
              <button
                onClick={() => setViewMode('grid')}
                className={cn("p-1.5 sm:p-2 rounded-lg transition-colors focus:outline-none", viewMode === 'grid' ? "bg-primary text-white" : "text-text-muted hover:text-primary")}
              >
                <Grid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn("p-1.5 sm:p-2 rounded-lg transition-colors focus:outline-none", viewMode === 'list' ? "bg-primary text-white" : "text-text-muted hover:text-primary")}
              >
                <List size={15} />
              </button>
            </div>
            
            <Link 
              to="/upload" 
              className="btn-primary !py-2 sm:!py-2.5 !px-4 sm:!px-6 !text-xs text-center font-black uppercase tracking-wider btn-ripple border border-primary/40 focus:outline-none shrink-0"
            >
              {t('upload')}
            </Link>
          </div>
        }
      />


      {/* Tabs */}
      <div className="flex gap-4 sm:gap-6 mb-6 sm:mb-8 border-b border-border/50 overflow-x-auto custom-scrollbar">
        <button 
          onClick={() => setActiveTab('materials')} 
          className={cn("pb-3 sm:pb-4 text-[10px] sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap", activeTab === 'materials' ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main")}
        >
          {t('materials')} ({materialsList.filter(m => m && m.type !== 'unified').length})
        </button>
        <button 
          onClick={() => setActiveTab('unified')} 
          className={cn("pb-3 sm:pb-4 text-[10px] sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5", activeTab === 'unified' ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main")}
        >
          <Layers size={14} className="sm:hidden" />
          <Layers size={16} className="hidden sm:block" /> {t('unified')} ({materialsList.filter(m => m && m.type === 'unified').length})
        </button>
        <button 
          onClick={() => setActiveTab('plans')} 
          className={cn("pb-3 sm:pb-4 text-[10px] sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5", activeTab === 'plans' ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main")}
        >
          <CalendarIcon size={14} className="sm:hidden" />
          <CalendarIcon size={16} className="hidden sm:block" /> {t('plans')} ({savedPlans.length})
        </button>
      </div>

      {activeTab === 'materials' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 mb-8 sm:mb-12">
            <div className="relative flex-grow w-full">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-text-muted/50 sm:hidden" size={16} />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50 hidden sm:block" size={18} />
              <input
                type="text"
                placeholder={t('search_materials')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-11 pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-border/40 focus:ring-2 focus:ring-primary/20 outline-none bg-surface/30 backdrop-blur-sm text-xs sm:text-sm text-text-main placeholder:text-text-muted/50 transition-all"
              />
            </div>
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar w-full md:w-auto">
              {filterChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setFilter(chip)}
                  className={cn(
                    "px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-semibold transition-all whitespace-nowrap border",
                    filter === chip
                      ? "bg-secondary text-primary shadow-sm border-secondary"
                      : "bg-surface/40 text-text-muted hover:bg-surface/60 border-border/30"
                  )}
                >
                  {chip}
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
          ) : filteredStandardMaterials.length > 0 ? (
            viewMode === 'grid' ? renderMaterialGrid(filteredStandardMaterials) : renderMaterialList(filteredStandardMaterials)
          ) : (
            <EmptyState 
              title={t('no_materials_found')}
              message={t('adjust_filter')}
              actionLabel="Reset Search"
              onAction={() => setSearchQuery('')}
            />
          )}
        </motion.div>
      )}

      {activeTab === 'unified' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
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
          ) : filteredUnifiedMaterials.length > 0 ? (
            viewMode === 'grid' ? renderMaterialGrid(filteredUnifiedMaterials) : renderMaterialList(filteredUnifiedMaterials)
          ) : (
            <EmptyState 
              title={t('no_unified_materials')}
              message={t('no_unified_materials_desc')}
              actionLabel="Select & Merge Materials"
              onAction={() => setActiveTab('materials')}
              icon={<Layers size={22} />}
            />
          )}
        </motion.div>
      )}

      {activeTab === 'plans' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card p-6 h-[180px] flex flex-col justify-between">
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
          ) : savedPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedPlans.map(p => (
                <div key={p.id} className="glass-card p-6 border-border/40 hover:border-primary/30 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", p.progress === 100 ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary")}>
                      {p.progress === 100 ? <CheckCircle2 size={20} /> : <CalendarIcon size={20} />}
                    </div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{p.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-text-main mb-2">{p.title}</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-grow h-1.5 bg-surface-alt rounded-full overflow-hidden">
                      <div className={cn("h-full", p.progress === 100 ? "bg-green-500" : "bg-primary")} style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className={cn("text-xs font-bold", p.progress === 100 ? "text-green-500" : "text-primary")}>{p.progress}%</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/plans?planId=${p.id}`)}
                    className="w-full py-2.5 bg-surface-alt hover:bg-primary/10 text-text-main hover:text-primary rounded-xl text-xs font-bold transition-all"
                  >
                    {t('continue_studying')}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              title={t('no_saved_plans')}
              message={t('no_saved_plans_desc')}
              actionLabel={t('browse_materials')}
              onAction={() => setActiveTab('materials')}
              icon={<CalendarIcon size={22} />}
            />
          )}
        </motion.div>
      )}

      {/* Floating Action Bar for Generating Unified Plan */}
      <AnimatePresence>
        {(activeTab === 'materials' || activeTab === 'unified') && selectedMaterials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[calc(100%-2rem)] sm:w-auto"
          >
            <div className="pointer-events-auto bg-surface/90 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl sm:rounded-full px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
              <span className="text-[10px] sm:text-sm font-bold text-text-main whitespace-nowrap">
                <span className="text-primary">{selectedMaterials.length}</span> {t('items_selected')}
              </span>
              <div className="flex items-center gap-2 sm:gap-3 sm:border-l sm:border-border/50 sm:pl-6 w-full sm:w-auto">
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 sm:flex-none bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-1.5 px-3 sm:py-2 sm:px-6 rounded-lg sm:rounded-xl font-bold transition-all text-[10px] sm:text-sm whitespace-nowrap border border-red-500/20"
                >
                  {t('delete')}
                </button>
                {selectedMaterials.length > 1 && (
                  <button 
                    onClick={handleMergeMaterials}
                    className="flex-1 sm:flex-none bg-surface border border-border py-1.5 px-3 sm:py-2 sm:px-6 shadow-sm rounded-lg sm:rounded-xl hover:border-primary text-text-main font-bold transition-all text-[10px] sm:text-sm whitespace-nowrap"
                  >
                    {t('merge')}
                  </button>
                )}
                <button 
                  onClick={handleGeneratePlan}
                  className="flex-1 sm:flex-none btn-primary py-1.5 px-3 sm:py-2 sm:px-6 shadow-lg shadow-primary/20 whitespace-nowrap text-[10px] sm:text-sm"
                >
                  {t('study_plans')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
              className="relative w-full max-w-sm glass-card p-8 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-main text-center mb-2">{t('delete_materials_confirm_title')}</h3>
              <p className="text-text-muted text-center text-sm mb-8">
                {t('delete_materials_confirm_desc')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-outline py-3"
                  disabled={isDeleting}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleDeleteMaterials}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : t('delete_all')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
