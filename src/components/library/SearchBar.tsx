import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search materials..." }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Search className="h-5 w-5 text-text-muted" />
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        id="library-search-input"
        className="block w-full rounded-2xl border border-border bg-surface py-3.5 pl-11 pr-4 text-sm text-text-main placeholder-text-muted/60 outline-none transition-all focus:border-[#6C5CE7]/50 focus:ring-2 focus:ring-[#6C5CE7]/10"
        placeholder={placeholder}
      />
    </div>
  );
}
