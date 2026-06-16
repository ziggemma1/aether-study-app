import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../components/ui/PageHeader';
import { useLibrary } from '../hooks/useLibrary';
import { SearchBar } from '../components/library/SearchBar';
import { FilterTabs } from '../components/library/FilterTabs';
import { SortDropdown, SortOption } from '../components/library/SortDropdown';
import { MaterialCard } from '../components/library/MaterialCard';
import { EmptyState } from '../components/library/EmptyState';
import { MaterialCardSkeleton } from '../components/ui/Skeleton';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function Library() {
  const {
    materials,
    loading,
    search,
    setSearch,
    filter,
    setFilter,
    sortBy,
    setSortBy,
  } = useLibrary();

  // Dynamically calculate last updated from our materials list
  const lastUpdatedStr = React.useMemo(() => {
    if (materials.length === 0) return 'June 15, 2026';
    const dates = materials
      .map(m => new Date(m.date).getTime())
      .filter(d => !isNaN(d));
    if (dates.length === 0) return 'June 15, 2026';
    const maxDate = new Date(Math.max(...dates));
    return maxDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }, [materials]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto relative min-h-screen pb-24 bg-[#0B0E14] text-[#F0F3F8]">
      {/* Page Header */}
      <PageHeader
        title="📚 Library"
        subtitle={
          <div className="flex flex-col gap-1 mt-1 text-sm text-[#8E9AAF] font-medium leading-relaxed">
            <div>All your study materials in one place</div>
            <div className="text-xs text-[#8E9AAF]/80 mt-0.5 font-bold">
              {materials.length} {materials.length === 1 ? 'material' : 'materials'} • Last updated: {lastUpdatedStr}
            </div>
          </div>
        }
        action={
          <Link
            to="/upload"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 active:scale-95 text-[#F0F3F8] text-xs font-semibold shadow-lg shadow-[#6C5CE7]/10 transition-all min-h-[44px]"
            id="library-upload-action"
          >
            <Plus size={15} />
            <span>Upload</span>
          </Link>
        }
      />

      {/* Search & Sort Row */}
      <div className="flex flex-col gap-3 mt-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-grow">
            <SearchBar value={search} onChange={setSearch} placeholder="Search materials..." />
          </div>
          <div className="shrink-0">
            <SortDropdown sortBy={sortBy as SortOption} onChange={setSortBy} />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-1">
          <FilterTabs activeFilter={filter} onChange={setFilter} />
        </div>
      </div>

      {/* Materials List Section */}
      <div className="mt-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <MaterialCardSkeleton key={i} />
            ))}
          </div>
        ) : materials.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {materials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
