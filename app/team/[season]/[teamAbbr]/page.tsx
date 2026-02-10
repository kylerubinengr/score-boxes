"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { getGamesByTeam } from "@/services/gameService";
import { Game } from "@/types/nfl";
import { GameCard } from "@/components/dashboard/GameCard";
import { HistoricalGameCard } from "@/components/dashboard/HistoricalGameCard";
import { TeamSelector } from "@/components/dashboard/TeamSelector";
import { ViewToggle } from "@/components/dashboard/ViewToggle";
import { StatusBanner } from "@/components/dashboard/StatusBanner";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { TabSettingsPanel } from "@/components/dashboard/TabSettingsPanel";
import { TabLimitWarning } from "@/components/ui/TabLimitWarning";
import { TeamStatsCards } from "@/components/dashboard/team-stats";
import { useSeason } from "@/context/SeasonContext";
import { TEAM_NAMES } from "@/constants/teams";
import { SeasonSelector } from "@/components/dashboard/SeasonSelector";
import { buildTeamUrl } from "@/lib/routes";

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const seasonParam = parseInt(params.season as string, 10);
  const teamAbbr = (params.teamAbbr as string)?.toUpperCase();
  const { selectedSeason, setSelectedSeason, setViewMode } = useSeason();

  // Sync season from URL to context (only when URL param changes)
  useEffect(() => {
    if (!isNaN(seasonParam) && seasonParam >= 2020 && seasonParam <= 2025) {
      setSelectedSeason(seasonParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonParam]);

  // Update view mode state
  useEffect(() => {
    setViewMode({ type: 'TEAM', href: pathname });
  }, [pathname, setViewMode]);

  const [data, setData] = useState<{
    games: Game[];
    lastUpdated?: number;
    isSnapshot: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate params
  useEffect(() => {
    if (isNaN(seasonParam) || seasonParam < 2020 || seasonParam > 2025) {
      router.push(buildTeamUrl(2025, teamAbbr || "BUF"));
      return;
    }
    if (!teamAbbr || !TEAM_NAMES[teamAbbr]) {
      router.push(buildTeamUrl(seasonParam, "BUF"));
      return;
    }
  }, [teamAbbr, seasonParam, router]);

  // Fetch team games using URL season
  useEffect(() => {
    if (!teamAbbr || !TEAM_NAMES[teamAbbr]) return;
    if (isNaN(seasonParam) || seasonParam < 2020 || seasonParam > 2025) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getGamesByTeam(teamAbbr, seasonParam);
        setData(result);
      } catch (e) {
        console.error("Team games fetch failed", e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [teamAbbr, seasonParam]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner />
      </div>
    );
  }

  const teamName = TEAM_NAMES[teamAbbr];

  return (
    <main className="bg-slate-50 dark:bg-slate-950 min-h-screen pt-2 pb-8 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              {seasonParam} {teamName}
            </h1>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
            <SeasonSelector />
            <ViewToggle />
          </div>
        </div>

        <div className="mb-8">
          <TeamSelector currentTeam={teamAbbr} />
        </div>

        <TeamStatsCards teamAbbr={teamAbbr} season={seasonParam} />

        <StatusBanner isSnapshot={data.isSnapshot} lastUpdated={data.lastUpdated} />

        {data.games.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500">No games found for {teamName} in {seasonParam}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.games.map((game) => (
              game.status === 'post' ? (
                <HistoricalGameCard key={game.id} game={game} showWeek={true} />
              ) : (
                <GameCard key={game.id} game={game} showWeek={true} />
              )
            ))}
          </div>
        )}
      </div>

      <TabSettingsPanel />
      <TabLimitWarning />
    </main>
  );
}
