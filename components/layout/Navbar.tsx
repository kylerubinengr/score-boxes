"use client";

import { useTheme } from "@/context/ThemeContext";
import { useGameTabs } from "@/context/GameTabsContext";
import { useSeason } from "@/context/SeasonContext";
import { Moon, Sun, X, Pin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { tabs, removeGameTab, togglePinTab } = useGameTabs();
  const { selectedSeason, viewMode } = useSeason();
  const pathname = usePathname();

  // Determine label based on persisted view state
  const homeLabel = `${viewMode.type === 'WEEK' ? 'Week' : 'Team'} - ${selectedSeason}`;
  
  // Home tab is active if we are on dashboard, team view, OR if we are on a game page (persisting context)
  // unless we are explicitly on the about page
  const isHomeActive = pathname === "/" || pathname.startsWith("/dashboard") || pathname.startsWith("/team");

  return (
    <nav className="w-full flex justify-between items-end px-4 pt-3 bg-slate-200 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800">
      <div className="flex flex-1 md:flex-initial space-x-1 translate-y-[1px] overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide relative mr-2 md:mr-0">
        {/* Reordered: About first, Home second */}
        <Tab
          href="/about"
          label="About"
          active={pathname === "/about"}
        />
        <Tab
          href={viewMode.href}
          label={homeLabel}
          active={isHomeActive && !pathname.startsWith('/about')}
        />

        {/* Dynamic game tabs */}
        {tabs.map((tab) => {
          const allSameWeek = tabs.every(t => t.week === tab.week);
          const allSameSeason = tabs.every(t => t.season === tab.season);

          let label = `${tab.awayAbbreviation}@${tab.homeAbbreviation}`;
          let weekPrefix = '';

          if (!allSameWeek) {
            weekPrefix = tab.week >= 19 ? 'P' : `W${tab.week}`;
          }

          if (!allSameSeason) {
            const shortSeason = tab.season.toString().slice(-2);
            weekPrefix = `${shortSeason} ${weekPrefix}`.trim();
          }

          if (weekPrefix) {
            label = `${weekPrefix} ${label}`;
          }

          return (
            <GameTab
              key={tab.id}
              id={tab.id}
              label={label}
              active={pathname === `/game/${tab.id}`}
              isPinned={tab.isPinned}
              onClose={() => removeGameTab(tab.id)}
              onTogglePin={() => togglePinTab(tab.id)}
            />
          );
        })}
      </div>

      <div className="pb-2 flex-shrink-0">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full transition-colors hover:bg-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle Theme"
        >
          {theme === "light" ? (
            <Sun className="w-5 h-5 text-slate-600 hover:text-amber-600 transition-colors" />
          ) : (
            <Moon className="w-5 h-5 text-slate-400 hover:text-indigo-400 transition-colors" />
          )}
        </button>
      </div>
    </nav>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`
        px-4 sm:px-4 md:px-6 py-2 sm:py-2 rounded-t-lg text-sm sm:text-sm font-medium transition-all duration-200 border-t border-x
        snap-start min-w-fit whitespace-nowrap
        ${active
          ? "bg-slate-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 border-slate-300 dark:border-slate-800 border-b-transparent"
          : "bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-300/50 dark:hover:bg-slate-800/50"
        }
      `}
    >
      {label}
    </Link>
  );
}

// Dynamic game tab with close button and pin functionality
function GameTab({
  id,
  label,
  active,
  isPinned,
  onClose,
  onTogglePin
}: {
  id: string;
  label: string;
  active: boolean;
  isPinned: boolean;
  onClose: () => void;
  onTogglePin: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent Link click
    onClose();
  };

  const handlePinToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTogglePin();
  };

  const handleTabClick = (e: React.MouseEvent) => {
    if (!active) return; // Only handle double-click on active tab

    setClickCount((prev) => prev + 1);

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      setClickCount(0);
    }, 300);

    // Double-click detected
    if (clickCount === 1) {
      e.preventDefault();
      onTogglePin();
      setClickCount(0);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      <Link
        href={`/game/${id}`}
        onClick={handleTabClick}
        className={`
          px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-t-lg text-xs sm:text-sm font-medium transition-all duration-200 border-t border-x
          flex items-center justify-between gap-1 sm:gap-2 snap-start min-w-fit whitespace-nowrap
          ${!isPinned ? 'italic' : ''}
          ${active
            ? "bg-slate-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 border-slate-300 dark:border-slate-800 border-b-transparent"
            : "bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-300/50 dark:hover:bg-slate-800/50"
          }
        `}
      >
        <span className="md:pr-0 md:group-hover:pr-8">{label}</span>

        {/* Pin button - hidden on mobile, appears on hover on desktop */}
        <button
          onClick={handlePinToggle}
          className={`hidden md:block absolute right-8 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors
            md:opacity-0 md:group-hover:opacity-100`}
          aria-label={isPinned ? `Unpin ${label} tab` : `Pin ${label} tab`}
        >
          <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
        </button>

        {/* Close button - always visible on mobile, appears on hover on desktop */}
        <button
          onClick={handleClose}
          className={`p-1 sm:p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0
            md:absolute md:right-2 md:top-1/2 md:-translate-y-1/2 md:opacity-0 md:group-hover:opacity-100`}
          aria-label={`Close ${label} tab`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </Link>
    </div>
  );
}