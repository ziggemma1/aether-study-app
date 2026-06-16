import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search for subjects, topics, or authors..." }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Search className="h-5 w-5 text-[#8E9AAF]" />
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        id="community-search-input"
        className="block w-full rounded-2xl border border-[#8E9AAF]/10 bg-[#141A24] py-3.5 pl-11 pr-10 text-sm text-[#F0F3F8] placeholder-[#8E9AAF]/60 outline-none transition-all focus:border-[#6C5CE7]/50 focus:ring-2 focus:ring-[#6C5CE7]/10"
        placeholder={placeholder}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#8E9AAF] hover:text-[#F0F3F8] active:scale-95"
          style={{ minWidth: '44px', minHeight: '44px', justifyContent: 'center' }}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
