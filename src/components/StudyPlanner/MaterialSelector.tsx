import React from 'react';
import { BookOpen, Search, Check, X, FolderOpen, Calendar, AlertCircle } from 'lucide-react';
import { Material } from '../../types';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { format, isValid } from 'date-fns';

interface MaterialSelectorProps {
  materials: Material[];
  selectedMaterialIds: string[];
  onChange: (ids: string[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  /** Set when the materials request failed, so "you have none" and "we could
   *  not load them" stop rendering as the same screen. */
  loadError?: string | null;
}

/**
 * Formats an upload date defensively. This component used to call
 * `format(new Date(mat.uploadDate), …)` with no validity check, which threw
 * "RangeError: Invalid time value" and took the whole page to the error
 * boundary whenever the value was not a parseable date.
 */
function formatUploadDate(value: unknown): string | null {
  if (!value || typeof value !== 'string') return null;
  const d = new Date(value);
  return isValid(d) ? format(d, 'MMM yyyy') : null;
}

export default function MaterialSelector({
  materials,
  selectedMaterialIds,
  onChange,
  searchQuery,
  setSearchQuery,
  loadError,
}: MaterialSelectorProps) {
  const navigate = useNavigate();

  // Filter materials based on search query
  const filtered = materials.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (id: string) => {
    if (selectedMaterialIds.includes(id)) {
      onChange(selectedMaterialIds.filter((mId) => mId !== id));
    } else {
      onChange([...selectedMaterialIds, id]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    /* The max-height + scroll used to sit on the whole card, so the heading,
       the "Clear all" control and the search box scrolled out of view along
       with the list — you could not search once you had scrolled. Only the
       list scrolls now; the chrome stays put. */
    <div className="bg-surface border border-border rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-card)] flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <h3 className="text-sm font-extrabold text-text-main flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Your materials
        </h3>
        {selectedMaterialIds.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-[11px] font-bold text-primary hover:underline cursor-pointer min-h-[30px]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Search Input Box */}
      <div className="flex items-center bg-background border border-border rounded-xl px-3 py-1.5 min-h-[44px] mb-4">
        <Search className="w-4 h-4 text-text-muted mr-2" />
        <input
          type="text"
          placeholder="Search materials in your library..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow bg-transparent text-xs text-text-main outline-none placeholder-text-muted"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="p-1 min-h-[30px] flex items-center">
            <X className="w-3.5 h-3.5 text-text-muted hover:text-text-main" />
          </button>
        )}
      </div>

      {loadError && materials.length === 0 ? (
        /* A failed request is NOT an empty library. This used to show
           "No materials uploaded to your Library yet" with an upload CTA even
           when the user had dozens and the API had simply timed out. */
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <AlertCircle className="w-9 h-9 text-brand-pink mb-2.5" />
          <p className="text-sm font-semibold text-text-main">We couldn't load your materials</p>
          <p className="text-xs text-text-muted mt-1 max-w-xs">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-surface-alt hover:bg-primary/10 hover:text-primary border border-border text-xs font-semibold text-text-main rounded-xl cursor-pointer min-h-[44px]"
          >
            Try again
          </button>
        </div>
      ) : materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <FolderOpen className="w-10 h-10 text-text-muted mb-2.5" />
          <p className="text-sm font-semibold text-text-main">No materials yet</p>
          <p className="text-xs text-text-muted mt-1 mb-4 max-w-xs">
            Upload something to your library and it'll show up here to plan around.
          </p>
          <button
            onClick={() => navigate('/library')}
            className="px-4 py-2 bg-primary text-white hover:bg-primary/90 text-xs font-semibold rounded-xl cursor-pointer min-h-[44px]"
          >
            Go to library
          </button>
        </div>
      ) : (
        <div className="flex-grow flex flex-col min-h-0">
          {/*
            * Only this list scrolls — and `relative` is required, not cosmetic.
            *
            * Each row's checkbox is `sr-only`, which is `position: absolute`.
            * An absolutely positioned element is only clipped by an ancestor's
            * overflow if that ancestor is its containing block, i.e. is itself
            * positioned. With this div left static, the 43 hidden inputs were
            * laid out against the page root instead and escaped the clip —
            * the lowest sat ~3294px down, inflating the page's scroll height
            * by ~1800px and leaving a screenful of blank space under the page.
            */}
          <div className="relative space-y-2 mb-4 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-center text-text-muted py-6">Nothing matches that search.</p>
            ) : (
              filtered.map((mat) => {
                const isChecked = selectedMaterialIds.includes(mat.id);
                return (
                  <label
                    key={mat.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none min-h-[44px]",
                      isChecked
                        ? "bg-primary/10 border-primary/40"
                        : "bg-background border-border hover:border-border"
                    )}
                  >
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggle(mat.id)}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                          isChecked
                            ? "bg-primary border-primary text-white"
                            : "border-border"
                        )}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold text-text-main truncate leading-tight">
                        {mat.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted font-medium">
                        <span className="capitalize">{mat.type || 'Document'}</span>
                        {formatUploadDate(mat.uploadDate) && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {formatUploadDate(mat.uploadDate)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {/* Active Chips area */}
          <div className="pt-3 border-t border-border">
            <p className="text-[11px] text-text-muted font-semibold uppercase font-mono tracking-wider mb-2">
              Selected ({selectedMaterialIds.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedMaterialIds.length === 0 ? (
                <p className="text-[11px] text-text-muted italic py-1">
                  Nothing selected — your plan will cover general study technique. Pick a material to plan around it.
                </p>
              ) : (
                selectedMaterialIds.map((id) => {
                  const m = materials.find((item) => item.id === id);
                  return (
                    <div
                      key={id}
                      className="inline-flex items-center gap-1.5 bg-primary/15 border border-primary/30 text-primary text-[11px] font-semibold px-2.5 py-1 rounded-full text-left"
                    >
                      <span className="max-w-[130px] truncate">{m?.title || 'Material'}</span>
                      <button
                        onClick={() => handleToggle(id)}
                        className="p-0.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-3 h-3 text-primary" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
