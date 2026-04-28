import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { Search, Filter, Grid, List, FileText, Youtube, BookOpen, Mic, ChevronRight, Check, Calendar as CalendarIcon, CheckCircle2, Layers, Loader2, Headphones, Globe } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Material } from '../types';
import api from '../services/api';

export default function Library() {
  const { materials, savedPlans, setMaterials, showToast, t } = useAppContext();
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

  const filteredStandardMaterials = materials.filter(m => {
    if (!m || m.type === 'unified') return false;
    const title = m.title || 'Untitled';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || (m.type && m.type.toLowerCase() === filter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  const filteredUnifiedMaterials = materials.filter(m => {
    if (!m || m.type !== 'unified') return false;
    const title = m.title || 'Untitled';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    // Unified usually doesn't need internal media type filters
    return matchesSearch;
  });

  const filterChips = ['All', 'PDF', 'YouTube', 'Article', 'Audio', 'Voice Note'];

  const getTypeIcon = (type: string) => {
    switch (type) {
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
      const relatedMaterials = materials.filter(m => selectedMaterials.includes(m.id));
      const combinedTopics = Array.from(new Set(relatedMaterials.flatMap(m => m.keyTopics || [])));
      const combinedContent = relatedMaterials.map(m => `--- ${m.title} ---\n${m.content || m.summary}`).join('\n\n');
      
      const response = await api.post('/materials', {
        title: `Combined: ${relatedMaterials[0].title} & ${relatedMaterials.length - 1} more`,
        type: 'unified',
        summary: `A unified collection containing insights from: ${relatedMaterials.map(m => m.title).join(', ')}.`,
        content: combinedContent,
        keyTopics: combinedTopics,
        progress: 0,
      });

      const newMaterial = {
        ...response.data,
        id: response.data._id || response.data.id,
        uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      setMaterials([newMaterial, ...materials]);
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
      setMaterials(materials.filter(m => !selectedMaterials.includes(m.id)));
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
      setMaterials(materials.map(m => m.id === materialId ? { ...m, isPublic: res.data.isPublic } : m));
      showToast(res.data.isPublic ? 'Material is now public! 🌏' : 'Material is now private. 🔒');
    } catch (err) {
      showToast('Failed to change visibility', 'error');
    }
  };

  const renderMaterialGrid = (items: Material[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {items.map((material) => {
        const Icon = getTypeIcon(material.type);
        const isSelected = selectedMaterials.includes(material.id);
        const isPublic = material.isPublic;

        return (
          <motion.div
            key={material.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className={cn(
              "relative glass-card p-4 sm:p-6 transition-all group overflow-hidden border-2",
              isSelected ? "border-primary shadow-lg shadow-primary/20" : "border-border/40 hover:border-primary/50"
            )}
          >
            {/* Action Bar */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex items-center gap-2">
              <button
                onClick={(e) => handleTogglePublic(e, material.id)}
                className={cn(
                  "w-8 h-8 rounded-lg border flex items-center justify-center transition-all backdrop-blur-sm",
                  isPublic 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-sm shadow-emerald-500/10" 
                    : "bg-surface/50 border-border/50 text-text-muted hover:text-primary hover:border-primary/30"
                )}
                title={isPublic ? "Publicly Shared" : "Private (Tap to Share)"}
              >
                <Globe size={14} />
              </button>

              <button
                onClick={(e) => toggleSelection(e, material.id)}
                className={cn(
                  "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all",
                  isSelected ? "bg-primary border-primary text-white" : "bg-surface/50 border-border group-hover:border-primary/50 hover:bg-surface"
                )}
              >
                {isSelected && <Check size={14} strokeWidth={3} />}
                {!isSelected && <span className="sr-only">Select</span>}
              </button>
            </div>

            <Link to={`/library/${material.id}`} className="block relative z-0 mt-4">
              <div className="flex items-start justify-between mb-4 sm:mb-6 pr-6 sm:pr-8">
                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-6">
                  <Icon size={24} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-text-muted">{material.uploadDate}</span>
                  {isPublic && <span className="text-[9px] font-black uppercase text-emerald-500 mt-1 tracking-tighter">Community Sync</span>}
                </div>
              </div>
              
              <h3 className="text-sm sm:text-lg font-black mb-1 sm:mb-2 line-clamp-1 text-text-main pr-6 sm:pr-8 group-hover:text-primary transition-colors">
                {material.title}
              </h3>
              <p className="text-xs sm:text-sm text-text-muted mb-6 sm:mb-8 line-clamp-2 leading-relaxed opacity-80">
                {material.summary}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Mastery</span>
                  <span className="text-xs font-black text-primary">{material.progress}%</span>
                </div>
                <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden border border-border/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${material.progress}%` }}
                    className="h-full bg-gradient-to-r from-primary to-secondary"
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
        const Icon = getTypeIcon(material.type);
        const isSelected = selectedMaterials.includes(material.id);
        return (
          <motion.div
            key={material.id}
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
                onClick={(e) => toggleSelection(e, material.id)}
                className={cn(
                  "w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-all",
                  isSelected ? "bg-primary border-primary text-white" : "bg-surface border-text-muted/30 hover:border-primary/50"
                )}
              >
                {isSelected && <Check size={14} strokeWidth={3} />}
              </button>
              <Link to={`/material/${material.id}`} className="flex items-center gap-6 flex-grow">
                <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary shrink-0">
                  <Icon size={20} />
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-text-main">{material.title}</h3>
                  <p className="text-xs text-text-muted">{material.uploadDate} • {material.type.toUpperCase()}</p>
                </div>
                <div className="hidden md:block w-48 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex-grow h-1.5 bg-surface rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full bg-secondary"
                        style={{ width: `${material.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-text-muted">{material.progress}%</span>
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
      <header className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-2 text-text-main">{t('library')}</h1>
          <p className="text-sm sm:text-base text-text-muted">{t('library_desc')}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex bg-surface rounded-lg sm:rounded-xl p-0.5 sm:p-1 shadow-sm border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-colors", viewMode === 'grid' ? "bg-primary text-white" : "text-text-muted hover:text-primary")}
            >
              <Grid size={16} className="sm:hidden" />
              <Grid size={20} className="hidden sm:block" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-colors", viewMode === 'list' ? "bg-primary text-white" : "text-text-muted hover:text-primary")}
            >
              <List size={16} className="sm:hidden" />
              <List size={20} className="hidden sm:block" />
            </button>
          </div>
          <Link to="/upload" className="btn-primary py-1.5 px-4 sm:py-2 sm:px-6 text-[10px] sm:text-sm">{t('upload')}</Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 sm:gap-6 mb-6 sm:mb-8 border-b border-border/50 overflow-x-auto custom-scrollbar">
        <button 
          onClick={() => setActiveTab('materials')} 
          className={cn("pb-3 sm:pb-4 text-[10px] sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap", activeTab === 'materials' ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main")}
        >
          {t('materials')} ({materials.filter(m => m.type !== 'unified').length})
        </button>
        <button 
          onClick={() => setActiveTab('unified')} 
          className={cn("pb-3 sm:pb-4 text-[10px] sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5", activeTab === 'unified' ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main")}
        >
          <Layers size={14} className="sm:hidden" />
          <Layers size={16} className="hidden sm:block" /> {t('unified')} ({materials.filter(m => m.type === 'unified').length})
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

          {filteredStandardMaterials.length > 0 ? (
            viewMode === 'grid' ? renderMaterialGrid(filteredStandardMaterials) : renderMaterialList(filteredStandardMaterials)
          ) : (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 text-text-muted border border-border">
                <Search size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2 text-text-main">{t('no_materials_found')}</h2>
              <p className="text-text-muted">{t('adjust_filter')}</p>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'unified' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {filteredUnifiedMaterials.length > 0 ? (
            viewMode === 'grid' ? renderMaterialGrid(filteredUnifiedMaterials) : renderMaterialList(filteredUnifiedMaterials)
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-border/30">
              <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center text-text-muted mb-4 opacity-50">
                <Layers size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2 text-text-main">{t('no_unified_materials')}</h2>
              <p className="text-text-muted max-w-md mx-auto">
                {t('no_unified_materials_desc')}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'plans' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {savedPlans.length > 0 ? (
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
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-border/30">
              <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center text-text-muted mb-4 opacity-50">
                <CalendarIcon size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2 text-text-main">{t('no_saved_plans')}</h2>
              <p className="text-text-muted">{t('no_saved_plans_desc')}</p>
              <button 
                onClick={() => setActiveTab('materials')} 
                className="text-primary text-sm font-bold mt-4 hover:underline"
              >
                {t('browse_materials')}
              </button>
            </div>
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
