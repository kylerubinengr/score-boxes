"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { useSeason } from "@/context/SeasonContext";
import { searchPlayers } from "@/services/playerService";
import { PlayerSearchResult } from "@/types/nfl";
import Image from "next/image";

export function SearchBar() {
  const { selectedSeason } = useSeason();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [noResults, setNoResults] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const doSearch = useCallback(
    (searchQuery: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (searchQuery.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        setIsLoading(false);
        setNoResults(false);
        return;
      }

      setIsLoading(true);
      setNoResults(false);
      debounceRef.current = setTimeout(async () => {
        try {
          const players = await searchPlayers(searchQuery, selectedSeason);
          setResults(players);
          setNoResults(players.length === 0);
          setIsOpen(true); // Always open to show results or "no results"
          setHighlightIndex(players.length > 0 ? 0 : -1); // Auto-highlight first
        } catch {
          setResults([]);
          setIsOpen(false);
          setNoResults(false);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [selectedSeason]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    doSearch(value);
  };

  const handleSelect = (player: PlayerSearchResult) => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setNoResults(false);
    router.push(`/player/${player.slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightIndex(-1);
      inputRef.current?.blur();
      return;
    }

    if (!isOpen || results.length === 0) {
      // If Enter is pressed with no dropdown but we have a query, trigger search
      if (e.key === "Enter" && query.trim().length >= 2) {
        e.preventDefault();
        doSearch(query);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < results.length) {
          handleSelect(results[highlightIndex]);
        } else if (results.length > 0) {
          // No explicit highlight — select the first result
          handleSelect(results[0]);
        }
        break;
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setNoResults(false);
    inputRef.current?.focus();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Position badges by color
  const positionColor = (pos: string) => {
    switch (pos) {
      case "QB":
        return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
      case "RB":
      case "FB":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
      case "WR":
        return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
      case "TE":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Compact search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 || noResults) setIsOpen(true);
          }}
          placeholder="Search players..."
          className="w-48 lg:w-56 pl-8 pr-7 py-1.5 rounded-md text-xs
            bg-slate-100 dark:bg-slate-800
            border border-slate-300 dark:border-slate-700
            text-slate-900 dark:text-slate-100
            placeholder-slate-400 dark:placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50
            focus:border-indigo-400 dark:focus:border-indigo-500
            focus:w-72 lg:focus:w-80
            transition-all duration-200"
          aria-label="Search NFL players"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
        />
        {/* Loading / Clear button */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
          ) : query.length > 0 ? (
            <button
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-50 top-full mt-1 right-0 w-80
            bg-white dark:bg-slate-800
            border border-slate-200 dark:border-slate-700
            rounded-lg shadow-xl overflow-hidden"
        >
          {noResults && (
            <li className="px-4 py-3 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No players found
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {`No matches for "${query}" in ${selectedSeason}`}
              </p>
            </li>
          )}
          {results.map((player, idx) => (
            <li
              key={`${player.slug}-${idx}`}
              role="option"
              aria-selected={idx === highlightIndex}
              onClick={() => handleSelect(player)}
              onMouseEnter={() => setHighlightIndex(idx)}
              className={`
                flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors
                ${
                  idx === highlightIndex
                    ? "bg-indigo-50 dark:bg-indigo-900/30"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }
              `}
            >
              {/* Player headshot or team logo */}
              {player.headshot ? (
                <Image
                  src={player.headshot}
                  alt={player.name}
                  width={28}
                  height={28}
                  className="flex-shrink-0 rounded-full object-cover w-7 h-7"
                />
              ) : player.teamLogo ? (
                <Image
                  src={player.teamLogo}
                  alt={player.team}
                  width={24}
                  height={24}
                  className="flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              )}

              {/* Player info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {player.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {player.team}
                </div>
              </div>

              {/* Position badge */}
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${positionColor(
                  player.position
                )}`}
              >
                {player.position}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
