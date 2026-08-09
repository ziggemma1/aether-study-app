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
        <Search className="h-5 w-5 text-text-muted" />
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        id="community-search-input"
        className="block w-full rounded-2xl border border-border/10 bg-surface py-3.5 pl-11 pr-10 text-sm text-text-main placeholder-text-muted/60 outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
        placeholder={placeholder}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted hover:text-text-main active:scale-95"
          style={{ minWidth: '44px', minHeight: '44px', justifyContent: 'center' }}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
