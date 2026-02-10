"use client";

import { useState, useRef, useCallback } from "react";
import { Info } from "lucide-react";
import type { LeagueMetricContext } from "@/types/teamStats";

export function LeagueContextTooltip({
  label,
  context,
}: {
  label: string;
  context?: LeagueMetricContext;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  }, []);

  if (!context) return null;

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center"
        aria-label={`League context for ${label}`}
      >
        <Info className="w-3.5 h-3.5 text-slate-400 cursor-help hover:text-blue-500 transition-colors" />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-xl z-50 pointer-events-none p-3">
          <div className="text-[11px] font-bold mb-2 text-slate-300 uppercase tracking-wide">
            {label}
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">League Avg</span>
              <span className="font-bold">{context.avg}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-400">Best</span>
              <span className="font-bold">
                {context.best}{" "}
                <span className="text-slate-400 font-normal">
                  ({context.bestTeam})
                </span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-400">Worst</span>
              <span className="font-bold">
                {context.worst}{" "}
                <span className="text-slate-400 font-normal">
                  ({context.worstTeam})
                </span>
              </span>
            </div>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
        </div>
      )}
    </span>
  );
}
