"use client";

import { useEffect, useState, useRef } from "react";
import { Search, MapPin, Compass, Landmark, Mountain, X, Loader2 } from "lucide-react";
import { AutocompleteSuggestion } from "@/types/recommendations";

interface NATMOGeoNamesSearchBarProps {
  placeholder?: string;
  onSelect?: (suggestion: AutocompleteSuggestion) => void;
  className?: string;
}

export function NATMOGeoNamesSearchBar({
  placeholder = "Search States (GeoNames), Circuits (NATMO), or Sights...",
  onSelect,
  className = "",
}: NATMOGeoNamesSearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced fetch
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tourism/autocomplete?q=${encodeURIComponent(query.trim())}&limit=8`);
        const data = await res.json();
        if (data.success && data.suggestions) {
          setSuggestions(data.suggestions);
          setIsOpen(data.suggestions.length > 0);
          setSelectedIndex(-1);
        }
      } catch (e) {
        console.error("Autocomplete fetch error", e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: AutocompleteSuggestion) => {
    setQuery(item.title);
    setIsOpen(false);
    if (onSelect) {
      onSelect(item);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const getIconForType = (type: AutocompleteSuggestion["type"]) => {
    switch (type) {
      case "state":
        return <Compass className="w-4 h-4 text-emerald-600" />;
      case "natmo_circuit":
        return <Mountain className="w-4 h-4 text-purple-600" />;
      case "district":
      case "city":
        return <MapPin className="w-4 h-4 text-sky-600" />;
      case "attraction":
      default:
        return <Landmark className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-10 pl-10 pr-9 rounded-full border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-black/10 focus:border-black transition-all shadow-xs"
        />
        {loading ? (
          <Loader2 className="w-4 h-4 text-slate-400 absolute right-3.5 animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="w-4 h-4 text-slate-400 hover:text-slate-600 absolute right-3.5"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-12 z-50 bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] uppercase font-semibold tracking-wider text-slate-600 border-b border-slate-100 flex items-center justify-between">
            <span>NATMO & GeoNames Verified Index</span>
            <span className="font-mono text-[9px] text-slate-600">GeoNames · NATMO · MoT</span>
          </div>

          {suggestions.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 transition-colors ${
                  isSelected ? "bg-slate-100/90" : "hover:bg-slate-50"
                }`}
              >
                <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-100">
                  {getIconForType(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900 text-sm truncate">
                      {item.title}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${
                        item.type === "natmo_circuit"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : item.type === "state"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : item.type === "district"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
