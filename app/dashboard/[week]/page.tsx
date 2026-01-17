"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { getGamesByWeek } from "@/services/gameService";
import { Game } from "@/types/nfl";
import { GameCard } from "@/components/dashboard/GameCard";
import { HistoricalGameCard } from "@/components/dashboard/HistoricalGameCard";
import { WeekSelector } from "@/components/dashboard/WeekSelector";
import { SeasonSelector } from "@/components/dashboard/SeasonSelector";
import { StatusBanner } from "@/components/dashboard/StatusBanner";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { TabSettingsPanel } from "@/components/dashboard/TabSettingsPanel";
import { TabLimitWarning } from "@/components/ui/TabLimitWarning";
import { ViewToggle } from "@/components/dashboard/ViewToggle";
import { useGameTabs } from "@/context/GameTabsContext";
import { useSeason } from "@/context/SeasonContext";
import { Radio } from "lucide-react";

// Map playoff week strings to ESPN week numbers
const PLAYOFF_WEEK_MAP: Record<string, number> = {
  'WC': 1,
  'DIV': 2,
  'CONF': 3,
  'SB': 5,
};

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const week = params.week as string;

  // Check if it's a playoff week
  const isPlayoffWeek = week in PLAYOFF_WEEK_MAP;
  const weekNum = isPlayoffWeek ? PLAYOFF_WEEK_MAP[week] : parseInt(week);
  const seasonType = isPlayoffWeek ? 3 : 2; // 3 for playoffs, 2 for regular season

  const { closeUnpinnedTabs } = useGameTabs();
  const { selectedSeason, setViewMode } = useSeason();
  const pathname = usePathname();

  // Update view mode state
  useEffect(() => {
    setViewMode({ type: 'WEEK', href: pathname });
  }, [pathname, setViewMode]);

  const [data, setData] = useState<{
    games: Game[];
    lastUpdated?: number;
    isSnapshot: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref to hold the current data for the interval closure
  const dataRef = useRef<{ games: Game[] } | null>(null);
  
  useEffect(() => {
    if (data) {
        dataRef.current = data;
    }
  }, [data]);

  // Auto-close unpinned tabs when persistence is disabled
  useEffect(() => {
    const isPersistenceEnabled = localStorage.getItem('tabPersistenceEnabled');

    if (isPersistenceEnabled === 'false') {
      closeUnpinnedTabs();
    }
  }, [closeUnpinnedTabs]);

  // Initial Fetch
  useEffect(() => {
    const maxWeeks = selectedSeason >= 2021 ? 18 : 17;

    // Validate week parameter
    if (!isPlayoffWeek && (isNaN(weekNum) || weekNum < 1 || weekNum > maxWeeks)) {
      // Invalid regular season week - redirect to Week 1
      router.push(`/dashboard/1`);
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getGamesByWeek(weekNum, seasonType, selectedSeason);
        setData(result);
      } catch (e) {
        console.error("Dashboard fetch failed", e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [weekNum, seasonType, router, selectedSeason, isPlayoffWeek]);

  // Smart Polling Logic for Live Games
  useEffect(() => {
    if (!data) return;

    const hasLiveGames = data.games.some(g => g.status === 'in');

    // Don't poll if there are no live games
    if (!hasLiveGames) {
      console.log('[Dashboard] No live games - polling stopped');
      return;
    }

    // Only poll when tab is visible
    const pollData = async () => {
      if (document.visibilityState !== 'visible') {
        console.log('[Dashboard] Tab hidden - skipping poll');
        return;
      }

      try {
        const result = await getGamesByWeek(weekNum, seasonType, selectedSeason);
        setData(result);
      } catch (e) {
        console.error("Polling failed", e);
      }
    };

    console.log('[Dashboard] Live games detected - starting smart polling (30s interval)');

    // Initial poll
    pollData();

    // Set up interval
    const intervalId = setInterval(pollData, 30000); // Poll every 30 seconds

    return () => {
      console.log('[Dashboard] Cleaning up polling interval');
      clearInterval(intervalId);
    };
  }, [data?.games, weekNum, seasonType, selectedSeason]); // Depend on games to re-evaluate if we still need to poll

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  const isLive = data.games.some((game) => game.isLive);

  return (
    <main className="bg-slate-50 dark:bg-slate-950 min-h-screen pt-2 pb-8 transition-colors duration-300">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
              Score Boxes
            </h1>
            {isLive && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-red-600">
                <Radio className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 animate-pulse" />
                <span className="text-sm sm:text-base font-semibold">Live</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-stretch md:items-end gap-3 w-full md:w-auto">
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <SeasonSelector />
                <ViewToggle />
             </div>
             <WeekSelector currentWeek={isPlayoffWeek ? week : weekNum} />
          </div>
        </div>

        <StatusBanner isSnapshot={data.isSnapshot} lastUpdated={data.lastUpdated} />

        {data.games.length === 0 ? (
             <div className="text-center py-12 sm:py-16">
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                  No games scheduled for {isPlayoffWeek ? week : `Week ${weekNum}`}.
                </p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {data.games.map((game) => (
                game.status === 'post' ? (
                    <HistoricalGameCard key={game.id} game={game} />
                ) : (
                    <GameCard key={game.id} game={game} />
                )
            ))}
            </div>
        )}
      </div>

      {/* Floating tab settings panel */}
      <TabSettingsPanel />
      <TabLimitWarning />
    </main>
  );
}
