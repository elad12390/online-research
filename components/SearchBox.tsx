/**
 * Search Box Component
 * Sidebar search input
 */

import { ChangeEvent } from 'react';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBox({ value, onChange, placeholder }: SearchBoxProps) {
  return (
    <div className="px-3 py-3 border-b border-notion-border">
      <input
        type="text"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder || 'Search...'}
        className="w-full px-3 py-2 rounded-md bg-notion-bg-primary border border-notion-border text-sm text-notion-text-primary placeholder-notion-text-tertiary focus:outline-none focus:border-notion-blue transition-colors"
      />
    </div>
  );
}
