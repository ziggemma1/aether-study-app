import React, { useState } from 'react';
import { Compass, Sparkles, Filter, Loader2, ArrowRight, Share2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCommunityMaterials, CommunityMaterial } from '../hooks/useCommunityMaterials';
import { SearchBar } from '../components/community/SearchBar';
import { FilterTabs } from '../components/community/FilterTabs';
import { SortDropdown, SortOption } from '../components/community/SortDropdown';
import { SubjectFilter } from '../components/community/SubjectFilter';
import { MaterialGrid } from '../components/community/MaterialGrid';
import { MaterialPreviewModal } from '../components/community/MaterialPreviewModal';
import { UploadModal } from '../components/community/UploadModal';
import { EmptyState } from '../components/community/EmptyState';
import { ExploreCardSkeleton } from '../components/ui/Skeleton';

export default function Explore() {
  const {
    materials,
    allFilteredCount,
    loading,
    search,
    setSearch,
    filter,
    setFilter,
    sort,
    setSort,
    subject,
    setSubject,
    page,
    setPage,
    hasMore,
    subjects,
    cloneMaterial,
    uploadCommunityMaterial
  } = useCommunityMaterials();

  const [selectedPreview, setSelectedPreview] = useState<CommunityMaterial | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleClearFilters = () => {
    setSearch('');
    setFilter('All');
    setSubject('All');
    setSort('popular');
  };

  const handleCloneAction = async (material: CommunityMaterial) => {
    await cloneMaterial(material.id, material.title);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto relative min-h-full pb-32 bg-background text-text-main">

      {/* Decorative Header Spark */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none select-none" />

      {/* Hero Header Area */}
      <header className="mb-8 relative flex flex-col items-center text-center">
        <motion.div
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-5 border border-primary/20 shadow-xl shadow-primary/5"
        >
          <Compass size={30} />
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main mb-2 tracking-tight">
          🌐 Community Note Explorer
        </h1>
        <p className="text-sm text-text-muted max-w-lg leading-relaxed">
          {/* Was "Discover top-rated notes … from fellow students worldwide" —
              there are no ratings yet and no worldwide user base to draw on. */}
          Browse notes, flashcards and lectures other students have published. Clone any of them straight into your library.
        </p>
      </header>

      {/* Floating Upload Trigger - Mobile Sticky Banner / Call to Action */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-2xl gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">💡</span>
          <p className="text-xs text-text-muted font-medium leading-relaxed">
            Have high-quality study folders or flashcards? Publish them to earn achievement points!
          </p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/90 active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[44px]"
        >
          <Upload size={14} />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Filtering, Search & Control Panel */}
      <div className="flex flex-col gap-3.5 mb-6">
        {/* Search Input */}
        <SearchBar value={search} onChange={setSearch} />

        {/* Filters Group */}
        {/* Horizontal only from lg. At sm the row already had to hold two
            240px dropdowns plus the chip rail, which left the chips about
            200px on a tablet — enough for "All" and "PDF" and a sliver of a
            third. Stacking until there is genuinely room is the difference
            between a scrollable rail and a squeezed one. */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* min-w-0 is what makes FilterTabs' own overflow-x-auto work. A flex
              item defaults to min-width:auto, so this wrapper refused to shrink
              below the combined width of five shrink-0 chips — the scroll
              container could never engage and the whole row forced itself wide
              instead. */}
          <div className="flex-grow min-w-0">
            <FilterTabs activeFilter={filter} onChange={setFilter} />
          </div>

          {/* Sort & Subject drop-downs side-by-side */}
          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <SubjectFilter 
              subjects={subjects} 
              selectedSubject={subject} 
              onChange={setSubject} 
            />
            
            <SortDropdown 
              sortBy={sort as SortOption} 
              onChange={setSort} 
            />
          </div>
        </div>
      </div>

      {/* Materials Results Container */}
      <main className="relative z-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ExploreCardSkeleton key={i} />
            ))}
          </div>
        ) : materials.length > 0 ? (
          <div>
            {/* Grid display */}
            <MaterialGrid
              materials={materials}
              onPreview={setSelectedPreview}
              onClone={handleCloneAction}
            />

            {/* Pagination Load More Button */}
            {hasMore ? (
              <div className="flex items-center justify-center mt-10">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-2 px-8 py-3.5 bg-surface-alt hover:bg-surface-alt/90 hover:border-primary/30 border border-border rounded-2xl text-xs font-bold uppercase tracking-wider text-text-main transition-all min-h-[44px] cursor-pointer"
                >
                  <span>Load More Materials</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <p className="text-center text-xs text-text-muted/40 mt-12 font-medium">
                Showing all {allFilteredCount} matching materials • You've reached the end
              </p>
            )}
          </div>
        ) : (
          <EmptyState
            type={search || filter !== 'All' || subject !== 'All' ? 'search' : 'no-data'}
            onClearFilters={handleClearFilters}
            onUploadClick={() => setIsUploadOpen(true)}
          />
        )}
      </main>

      {/* Interactive Modals */}
      {selectedPreview && (
        <MaterialPreviewModal
          material={selectedPreview}
          onClose={() => setSelectedPreview(null)}
          onClone={handleCloneAction}
        />
      )}

      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onUpload={uploadCommunityMaterial}
        />
      )}

    </div>
  );
}
