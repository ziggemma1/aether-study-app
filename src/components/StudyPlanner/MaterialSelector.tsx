import React from 'react';
import { BookOpen, Search, Check, X, FolderOpen, Calendar } from 'lucide-react';
import { Material } from '../../types';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

interface MaterialSelectorProps {
  materials: Material[];
  selectedMaterialIds: string[];
  onChange: (ids: string[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function MaterialSelector({
  materials,
  selectedMaterialIds,
  onChange,
  searchQuery,
  setSearchQuery,
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
    <div className="bg-[#141A24] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 shadow-xl flex flex-col max-h-[500px] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800/65">
        <h3 className="text-sm font-extrabold text-[#F0F3F8] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#6C5CE7]" />
          Select Study Materials
        </h3>
        {selectedMaterialIds.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-[11px] font-bold text-[#6C5CE7] hover:underline cursor-pointer min-h-[30px]"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Search Input Box */}
      <div className="flex items-center bg-[#0B0E14] border border-gray-800 rounded-xl px-3 py-1.5 min-h-[44px] mb-4">
        <Search className="w-4 h-4 text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search materials in your library..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow bg-transparent text-xs text-[#F0F3F8] outline-none placeholder-gray-600 focus:placeholder-gray-500"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="p-1 min-h-[30px] flex items-center">
            <X className="w-3.5 h-3.5 text-gray-500 hover:text-white" />
          </button>
        )}
      </div>

      {materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center flex-grow">
          <FolderOpen className="w-10 h-10 text-gray-600 mb-2.5" />
          <p className="text-xs text-[#8E9AAF] mb-3">No materials uploaded to your Library yet.</p>
          <button
            onClick={() => navigate('/library')}
            className="px-4 py-2 bg-[#6C5CE7]/15 hover:bg-[#6C5CE7]/20 border border-[#6C5CE7]/30 text-xs font-bold text-[#F0F3F8] rounded-xl cursor-pointer min-h-[44px]"
          >
            Browse & Upload Library
          </button>
        </div>
      ) : (
        <div className="flex-grow flex flex-col">
          {/* List of items with checkboxes - standard flex with no internal overflow scroll */}
          <div className="space-y-2 mb-4">
            {filtered.length === 0 ? (
              <p className="text-xs text-center text-gray-500 py-6">No materials match search.</p>
            ) : (
              filtered.map((mat) => {
                const isChecked = selectedMaterialIds.includes(mat.id);
                return (
                  <label
                    key={mat.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none min-h-[44px]",
                      isChecked
                        ? "bg-[#6C5CE7]/10 border-[#6C5CE7]/40"
                        : "bg-[#0B0E14] border-gray-800/60 hover:border-gray-700/80"
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
                            ? "bg-[#6C5CE7] border-[#6C5CE7] text-white"
                            : "border-gray-600"
                        )}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold text-[#F0F3F8] truncate leading-tight">
                        {mat.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 font-medium">
                        <span className="capitalize">{mat.type || 'Document'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {mat.uploadDate ? format(new Date(mat.uploadDate), 'MMM yyyy') : 'Recently'}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {/* Active Chips area */}
          <div className="pt-3 border-t border-gray-800/50">
            <p className="text-[10px] text-[#8E9AAF] font-semibold uppercase font-mono tracking-wider mb-2">
              Selected ({selectedMaterialIds.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedMaterialIds.length === 0 ? (
                <p className="text-[11px] text-gray-500 italic py-1">
                  No reference files checked. Generates standard curriculum instead.
                </p>
              ) : (
                selectedMaterialIds.map((id) => {
                  const m = materials.find((item) => item.id === id);
                  return (
                    <div
                      key={id}
                      className="inline-flex items-center gap-1.5 bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 text-gray-200 text-[10px] font-semibold px-2.5 py-1 rounded-full text-left"
                    >
                      <span className="max-w-[130px] truncate">{m?.title || 'Material'}</span>
                      <button
                        onClick={() => handleToggle(id)}
                        className="p-0.5 rounded-full hover:bg-[#6C5CE7]/20 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-3 h-3 text-[#6C5CE7]" />
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
