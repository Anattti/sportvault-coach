'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { parseISO } from 'date-fns';
import { formatDateFi } from '@/lib/dates/fi';
import { ExerciseNameSuggestion } from '@/lib/types/workout';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSuggestionSelected: (name: string) => void;
  suggestions: ExerciseNameSuggestion[];
  placeholder?: string;
  className?: string;
}

export default function ExerciseNameAutocomplete({
  value,
  onChange,
  onSuggestionSelected,
  suggestions,
  placeholder = 'Liikkeen nimi',
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = q
      ? suggestions.filter((s) => s.name.toLowerCase().includes(q))
      : suggestions;
    return list.slice(0, 8);
  }, [suggestions, value]);

  const safeHighlightIndex =
    filtered.length === 0 ? 0 : Math.min(highlightIndex, filtered.length - 1);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectSuggestion = (name: string) => {
    onChange(name);
    onSuggestionSelected(name);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) {
      if (e.key === 'ArrowDown' && filtered.length > 0) {
        setHighlightIndex(0);
        setOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filtered[safeHighlightIndex];
      if (selected) selectSuggestion(selected.name);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showList = open && filtered.length > 0 && value.trim().length > 0;

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setHighlightIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {showList && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#1a1a1a] py-1 shadow-lg ring-1 ring-white/8"
        >
          {filtered.map((suggestion, index) => (
            <li key={suggestion.name} role="option" aria-selected={index === safeHighlightIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(suggestion.name)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors',
                  index === safeHighlightIndex
                    ? 'bg-primary/15 text-foreground'
                    : 'text-foreground hover:bg-white/5',
                )}
              >
                <span className="truncate font-medium">{suggestion.name}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {suggestion.sessionCount}{' '}
                  {suggestion.sessionCount === 1 ? 'kerta' : 'kertaa'}
                  {' · '}
                  {formatDateFi(parseISO(suggestion.lastDate))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
