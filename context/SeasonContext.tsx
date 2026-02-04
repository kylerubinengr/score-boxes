"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export type ViewType = 'WEEK' | 'TEAM' | 'STANDINGS' | 'PERFORMANCES';

export interface ViewMode {
  type: ViewType;
  href: string;
}

interface SeasonContextType {
  selectedSeason: number;
  setSelectedSeason: (year: number) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

export function SeasonProvider({ children }: { children: ReactNode }) {
  // Default to 2025
  const [selectedSeason, setSelectedSeasonState] = useState<number>(2025);
  // Default to Week view
  const [viewMode, setViewModeState] = useState<ViewMode>({ type: 'WEEK', href: '/' });

  useEffect(() => {
    // Load from local storage on mount
    const savedSeason = localStorage.getItem("nfl_dashboard_season");
    if (savedSeason) {
      const year = parseInt(savedSeason);
      if (!isNaN(year) && year >= 2020 && year <= 2025) {
        setSelectedSeasonState(year);
      }
    }

    const savedView = localStorage.getItem("nfl_dashboard_view");
    if (savedView) {
      try {
        setViewModeState(JSON.parse(savedView));
      } catch (e) {
        // ignore invalid json
      }
    }
  }, []);

  const setSelectedSeason = (year: number) => {
    setSelectedSeasonState(year);
    localStorage.setItem("nfl_dashboard_season", year.toString());
  };

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(prevState => {
        // Only update if value has changed
        if (mode.type === prevState.type && mode.href === prevState.href) {
            return prevState;
        }
        localStorage.setItem("nfl_dashboard_view", JSON.stringify(mode));
        return mode;
    });
  }, []);

  return (
    <SeasonContext.Provider value={{ selectedSeason, setSelectedSeason, viewMode, setViewMode }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const context = useContext(SeasonContext);
  if (context === undefined) {
    throw new Error("useSeason must be used within a SeasonProvider");
  }
  return context;
}
