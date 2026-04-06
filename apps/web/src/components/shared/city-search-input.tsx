"use client";

import type { CitySuggestion } from "@openhospi/shared/pdok";
import { searchCities } from "@openhospi/shared/pdok";
import { MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;

type Props = {
  value: string;
  onSelect: (cityName: string) => void;
  placeholder?: string;
};

export function CitySearchInput({ value, onSelect, placeholder }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    const items = await searchCities(q);
    setSuggestions(items);
    setIsOpen(items.length > 0);
    setHighlightedIndex(-1);
  }, []);

  function handleInputChange(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), DEBOUNCE_MS);
  }

  function handleSelect(suggestion: CitySuggestion) {
    setQuery(suggestion.name);
    setSuggestions([]);
    setIsOpen(false);
    onSelect(suggestion.name);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter" && highlightedIndex >= 0) {
              e.preventDefault();
              handleSelect(suggestions[highlightedIndex]);
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
          className="pl-9"
          autoComplete="off"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <ul className="max-h-60 overflow-auto p-1">
            {suggestions.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                    i === highlightedIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{s.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
