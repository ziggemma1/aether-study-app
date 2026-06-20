import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLibrary } from '../hooks/useLibrary';
import { useAppContext } from '../context/AppContext';
import { SearchBar } from '../components/library/SearchBar';
import { FilterTabs } from '../components/library/FilterTabs';
import { SortDropdown, SortOption } from '../components/library/SortDropdown';
import { LibraryCard } from '../components/library/LibraryCard';
import { LibraryStats } from '../components/library/LibraryStats';
import { TodaysFocus } from '../components/library/TodaysFocus';
import { EmptyState } from '../components/library/EmptyState';
import { MaterialCardSkeleton } from '../components/ui/Skeleton';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Combine, CheckSquare, X, CheckCircle2, RefreshCw } from 'lucide-react';

export default function Library() {
  const { user, showToast, fetchAppData } = useAppContext();
  const {
    materials,      // Filtered materials
    allMaterials = [], // All materials before filtering (to compute correct stats)
    loading,
    search,
    setSearch,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    refetch,
    deleteMaterial,
    deleteMaterials,
    mergeMaterials,
  } = useLibrary();

  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === materials.length) {
      setSelectedIds([]);
    } else {
      const allIds = materials.map(m => m.id || (m as any)._id).filter(Boolean);
      setSelectedIds(allIds);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) return;

    setIsProcessing(true);
    const success = await deleteMaterials(selectedIds);
    if (success) {
      showToast(`Successfully deleted ${selectedIds.length} materials.`, 'success');
      setSelectedIds([]);
      setSelectionMode(false);
      fetchAppData(); // Sync global state
    } else {
      showToast('Failed to delete materials.', 'error');
    }
    setIsProcessing(false);
  };

  const handleMerge = async () => {
    if (selectedIds.length < 2) {
      showToast('Select at least 2 materials to merge.', 'success'); // Using success as info-like or just omitting type
      return;
    }

    const title = window.prompt('Enter a title for the unified material:', 'Combined Study Guide');
    if (!title) return;

    setIsProcessing(true);
    const result = await mergeMaterials(selectedIds, title);
    if (result) {
      showToast('Materials merged successfully! 📚', 'success');
      setSelectedIds([]);
      setSelectionMode(false);
      fetchAppData(); // Sync global state
    } else {
      showToast('Failed to merge materials.', 'error');
    }
    setIsProcessing(false);
  };

  const handleDeleteIndividual = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    
    const success = await deleteMaterial(id);
    if (success) {
      showToast('Material deleted successfully.', 'success');
      setSelectedIds(prev => prev.filter(i => i !== id));
      fetchAppData(); // Sync global state
    } else {
      showToast('Failed to delete material.', 'error');
    }
  };

  // Highlight welcome text name or default
  const firstName = React.useMemo(() => {
    if (user?.name) {
      return user.name.split(' ')[0];
    }
    return 'Ziggemma'; // Fallback name of the scholar
  }, [user]);

  // Compute unvisited/study progress summaries
  const targetMaterialsCount = allMaterials.length || materials.length;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0B0E14] via-[#141A24] to-[#1A1030] text-[#F0F3F8] p-4 sm:p-6 pb-32 select-none overflow-x-hidden">
      
      {/* Absolute Ambient Sphere Background Accent Glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-[#6C5CE7]/5 blur-[120px] pointer-events-none select-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-[#00D2FF]/5 blur-[120px] pointer-events-none select-none" />

      {/* 1. Header Section (Engaging & Personal) */}
      <header className="mb-6 relative flex items-center justify-between gap-4 mt-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">📚</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#F0F3F8] tracking-tight">
              Your Learning Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#8E9AAF] mt-1 font-semibold leading-relaxed">
            Welcome back, <span className="text-[#6C5CE7] font-extrabold">{firstName}</span>! 👋 You have{' '}
            <span className="text-[#F0F3F8] font-black">{targetMaterialsCount}</span>{' '}
            {targetMaterialsCount === 1 ? 'material' : 'materials'} ready to study.
          </p>
        </div>

        {/* Action Buttons - Touch Minimum 44px */}
        <div className="flex items-center gap-2">
          {selectionMode && (
            <button
              onClick={handleSelectAll}
              className="flex h-11 items-center gap-2 px-4 rounded-xl font-extrabold text-[10px] sm:text-xs transition-all outline-none border-2 bg-white/10 text-white border-white/20"
              title="Select all items"
            >
              <CheckSquare size={16} strokeWidth={3} />
              <span>{selectedIds.length === materials.length ? 'Deselect All' : 'Select All'}</span>
            </button>
          )}

          {(materials.length > 0 || allMaterials.length > 0) && (
            <button
              onClick={() => {
                setSelectionMode(!selectionMode);
                if (!selectionMode) setSelectedIds([]);
              }}
              className={`flex h-11 items-center gap-2 px-3 sm:px-4 rounded-xl font-extrabold text-[10px] sm:text-xs transition-all outline-none border-2 shadow-lg backdrop-blur-md ${
                selectionMode 
                  ? 'bg-red-500 text-white border-red-500' 
                  : 'bg-[#6C5CE7] text-white border-[#6C5CE7] shadow-[#6C5CE7]/30'
              }`}
              id="library-bulk-select-action"
              title={selectionMode ? "Cancel selection" : "Start bulk selection"}
            >
              {selectionMode ? <X size={16} strokeWidth={3} /> : <CheckSquare size={16} strokeWidth={3} />}
              <span>{selectionMode ? 'Cancel' : 'Bulk Select'}</span>
            </button>
          )}

          <Link
            to="/upload"
            className="flex h-11 items-center gap-2 px-3 sm:px-4 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-[10px] sm:text-xs font-bold transition-all outline-none border border-white/20"
            id="library-upload-quick-action"
          >
            <Plus size={16} strokeWidth={3} />
            <span className="hidden sm:inline">Upload</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </header>

      {/* Bulk Actions Floating Bar */}
      <AnimatePresence>
        {selectionMode && selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-50 flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#6C5CE7] shadow-[0_8px_32px_rgba(108,92,231,0.4)] border border-white/20 sm:max-w-md sm:mx-auto"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-1.5">
                <CheckCircle2 size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-white leading-none">
                  {selectedIds.length} {selectedIds.length === 1 ? 'Item' : 'Items'} Selected
                </p>
                <p className="text-[10px] text-white/70 mt-1 font-bold">Ready for bulk action</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMerge}
                disabled={isProcessing || selectedIds.length < 2}
                className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-all text-white text-[10px] font-black uppercase tracking-tight border border-white/10"
              >
                <Combine size={14} />
                <span>Merge</span>
              </button>
              
              <button
                onClick={handleBulkDelete}
                disabled={isProcessing}
                className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-40 transition-all text-white text-[10px] font-black uppercase tracking-tight shadow-md shadow-red-900/20"
              >
                {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>Delete</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-5">
        {/* 2. Engagement Quick Stats Bar (unread count, mastery progress, study streak, achievements) */}
        <LibraryStats materials={allMaterials.length > 0 ? allMaterials : materials} user={user} />

        {/* 3. Today's Focus Actionable Advice Card */}
        <TodaysFocus materials={allMaterials.length > 0 ? allMaterials : materials} />

        {/* 4. Controls Section (Search + Tab filters + Sorting dropdown) */}
        <div className="flex flex-col gap-3 bg-[#141A24]/40 border border-[#8E9AAF]/5 rounded-3xl p-4 shadow-sm">
          {/* Search and Sort row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow">
              <SearchBar value={search} onChange={setSearch} placeholder="Search materials or tags..." />
            </div>
            <div className="shrink-0">
              <SortDropdown sortBy={sortBy as SortOption} onChange={setSortBy} />
            </div>
          </div>

          {/* Filter Navigation Tabs */}
          <div className="mt-1">
            <FilterTabs activeFilter={filter} onChange={setFilter} />
          </div>
        </div>

        {/* 5. Materials Grid Display */}
        <main className="mt-2">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <MaterialCardSkeleton key={i} />
              ))}
            </div>
          ) : materials.length > 0 ? (
            <AnimatePresence mode="popLayout">
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch"
              >
                {materials.map((material, idx) => (
                  <motion.div
                    key={material.id || (material as any)._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.05, 0.3) }}
                  >
                    <LibraryCard 
                      material={material} 
                      selectionMode={selectionMode}
                      selected={selectedIds.includes(material.id) || selectedIds.includes((material as any)._id)}
                      onSelect={toggleSelection}
                      onDelete={handleDeleteIndividual}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <EmptyState />
          )}
        </main>
      </div>

    </div>
  );
}
