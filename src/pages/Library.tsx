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
import { Plus } from 'lucide-react';

export default function Library() {
  const { user } = useAppContext();
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
  } = useLibrary();

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

        {/* Action Button - Touch Minimum 44px */}
        <Link
          to="/upload"
          className="flex h-11 items-center gap-1.5 px-4 rounded-xl bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 active:scale-95 text-[#F0F3F8] text-xs font-bold shadow-lg shadow-[#6C5CE7]/15 transition-all outline-none"
          id="library-upload-quick-action"
        >
          <Plus size={15} />
          <span>Upload</span>
        </Link>
      </header>

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
                    key={material.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.05, 0.3) }}
                  >
                    <LibraryCard material={material} />
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
