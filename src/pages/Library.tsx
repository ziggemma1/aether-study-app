import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { Search, Filter, Grid, List, FileText, Youtube, BookOpen, Mic, ChevronRight, Check, Calendar as CalendarIcon, CheckCircle2, Layers } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Material } from '../types';

export default function Library() {
  const { materials, savedPlans, setMaterials } = useAppContext();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filter, setFilter] = React.useState('All');
  const [selectedMaterials, setSelectedMaterials] = React.useState<string[]>([]);
  const [activeTab, setActiveTab] = React.useState<'materials' | 'unified' | 'plans'>('materials');

  const filteredStandardMaterials = materials.filter(m => {
    if (m.type === 'unified') return false;
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || m.type.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const filteredUnifiedMaterials = materials.filter(m => {
    if (m.type !== 'unified') return false;
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    // Unified usually doesn't need internal media type filters
    return matchesSearch;
  });

  const filterChips = ['All', 'PDF', 'YouTube', 'Article', 'Audio'];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return FileText;
      case 'youtube': return Youtube;
      case 'article': return BookOpen;
      case 'audio': return Mic;
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

  const handleMergeMaterials = () => {
    if (selectedMaterials.length < 2) return;
    
    const relatedMaterials = materials.filter(m => selectedMaterials.includes(m.id));
    const combinedTopics = Array.from(new Set(relatedMaterials.flatMap(m => m.keyTopics)));
    
    const newMaterial: Material = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Combined: ${relatedMaterials[0].title} & ${relatedMaterials.length - 1} more`,
      type: 'unified',
      uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      summary: `A unified collection containing insights from: ${relatedMaterials.map(m => m.title).join(', ')}.`,
      keyTopics: combinedTopics,
      progress: 0,
    };

    setMaterials([newMaterial, ...materials]);
    setSelectedMaterials([]);
    setActiveTab('unified');
  };

  const renderMaterialGrid = (items: Material[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {items.map((material) => {
        const Icon = getTypeIcon(material.type);
        const isSelected = selectedMaterials.includes(material.id);
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
            <button
              onClick={(e) => toggleSelection(e, material.id)}
              className={cn(
                "absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 flex items-center justify-center transition-all",
                isSelected ? "bg-primary border-primary text-white" : "bg-surface border-text-muted/30 group-hover:border-primary/50"
              )}
            >
              {isSelected && <Check size={12} className="sm:hidden" strokeWidth={3} />}
              {isSelected && <Check size={14} className="hidden sm:block" strokeWidth={3} />}
            </button>

            <Link to={`/library/${material.id}`} className="block relative z-0">
              <div className="flex items-start justify-between mb-4 sm:mb-6 pr-6 sm:pr-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/5 rounded-lg sm:rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon size={20} className="sm:hidden" />
                  <Icon size={24} className="hidden sm:block" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-text-muted">{material.uploadDate}</span>
              </div>
              <h3 className="text-sm sm:text-lg font-bold mb-1 sm:mb-2 line-clamp-1 text-text-main pr-6 sm:pr-8">{material.title}</h3>
              <p className="text-[10px] sm:text-sm text-text-muted mb-4 sm:mb-6 line-clamp-2 leading-tight">{material.summary}</p>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-grow h-1 sm:h-1.5 bg-surface rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-secondary"
                    style={{ width: `${material.progress}%` }}
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-text-muted">{material.progress}%</span>
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
          <h1 className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-2 text-text-main">Library</h1>
          <p className="text-[10px] sm:text-base text-text-muted">All your study materials in one place.</p>
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
          <Link to="/upload" className="btn-primary py-1.5 px-4 sm:py-2 sm:px-6 text-[10px] sm:text-sm">Upload</Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 sm:gap-6 mb-6 sm:mb-8 border-b border-border/50 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('materials')} 
          className={cn("pb-3 sm:pb-4 text-[10px] sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap", activeTab === 'materials' ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main")}
        >
          Materials ({materials.filter(m => m.type !== 'unified').length})
        </button>
        <button 
          onClick={() => setActiveTab('unified')} 
          className={cn("pb-3 sm:pb-4 text-[10px] sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5", activeTab === 'unified' ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main")}
        >
          <Layers size={14} className="sm:hidden" />
          <Layers size={16} className="hidden sm:block" /> Unified ({materials.filter(m => m.type === 'unified').length})
        </button>
        <button 
          onClick={() => setActiveTab('plans')} 
          className={cn("pb-3 sm:pb-4 text-[10px] sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5", activeTab === 'plans' ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-main")}
        >
          <CalendarIcon size={14} className="sm:hidden" />
          <CalendarIcon size={16} className="hidden sm:block" /> Plans ({savedPlans.length})
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
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-11 pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-border/40 focus:ring-2 focus:ring-primary/20 outline-none bg-surface/30 backdrop-blur-sm text-xs sm:text-sm text-text-main placeholder:text-text-muted/50 transition-all"
              />
            </div>
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar w-full md:w-auto">
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
              <h2 className="text-xl font-bold mb-2 text-text-main">No study materials found</h2>
              <p className="text-text-muted">Try adjusting your search or filters.</p>
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
              <h2 className="text-xl font-bold mb-2 text-text-main">No Unified Materials</h2>
              <p className="text-text-muted max-w-md mx-auto">
                You haven't merged any materials together yet. Select multiple materials from the <strong>Study Materials</strong> tab and combine them.
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
                    onClick={() => navigate('/plans')}
                    className="w-full py-2.5 bg-surface-alt hover:bg-primary/10 text-text-main hover:text-primary rounded-xl text-xs font-bold transition-all"
                  >
                    View Plan Directory
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-border/30">
              <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center text-text-muted mb-4 opacity-50">
                <CalendarIcon size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2 text-text-main">No saved plans yet</h2>
              <p className="text-text-muted">Start creating powerful combined study plans and they will appear here.</p>
              <button 
                onClick={() => setActiveTab('materials')} 
                className="text-primary text-sm font-bold mt-4 hover:underline"
              >
                Browse Materials
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
                <span className="text-primary">{selectedMaterials.length}</span> selected
              </span>
              <div className="flex items-center gap-2 sm:gap-3 sm:border-l sm:border-border/50 sm:pl-6 w-full sm:w-auto">
                {selectedMaterials.length > 1 && (
                  <button 
                    onClick={handleMergeMaterials}
                    className="flex-1 sm:flex-none bg-surface border border-border py-1.5 px-3 sm:py-2 sm:px-6 shadow-sm rounded-lg sm:rounded-xl hover:border-primary text-text-main font-bold transition-all text-[10px] sm:text-sm whitespace-nowrap"
                  >
                    Merge
                  </button>
                )}
                <button 
                  onClick={handleGeneratePlan}
                  className="flex-1 sm:flex-none btn-primary py-1.5 px-3 sm:py-2 sm:px-6 shadow-lg shadow-primary/20 whitespace-nowrap text-[10px] sm:text-sm"
                >
                  Study Plan
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
