"use client";

import React, { useState, useEffect } from "react";
import type { Team, BoxScoreData, GameStatus } from "@/types/nfl";
import type { AdvancedGameStats } from "@/types/advancedStats";
import { StatTable } from "@/components/dashboard/StatTable";
import { AdvancedStatsView } from "./AdvancedStatsView";
import { SafeImage } from "@/components/common/SafeImage";
import { BarChart3, Table } from "lucide-react";

interface BoxScoreSectionProps {
  homeTeam: Team;
  awayTeam: Team;
  homeBoxscore?: BoxScoreData;
  awayBoxscore?: BoxScoreData;
  season: number;
  week: number;
  seasonType: number;
  gameStatus: GameStatus;
}

export function BoxScoreSection({
  homeTeam,
  awayTeam,
  homeBoxscore,
  awayBoxscore,
  season,
  week,
  seasonType,
  gameStatus,
}: BoxScoreSectionProps) {
  const [view, setView] = useState<"boxscore" | "advanced">("boxscore");
  const [advancedStats, setAdvancedStats] = useState<AdvancedGameStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showAdvancedToggle = gameStatus === "post";

  useEffect(() => {
    if (view === "advanced" && !advancedStats && !loading) {
      setLoading(true);
      setError(null);
      fetch(
        `/api/advanced-game-stats?season=${season}&week=${week}&seasonType=${seasonType}&away=${awayTeam.abbreviation}&home=${homeTeam.abbreviation}`
      )
        .then((res) => {
          if (!res.ok) throw new Error("Advanced stats not available for this game");
          return res.json();
        })
        .then((data: AdvancedGameStats) => setAdvancedStats(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [view, advancedStats, loading, season, week, seasonType, awayTeam.abbreviation, homeTeam.abbreviation]);

  return (
    <div className="space-y-6">
      {/* Toggle */}
      {showAdvancedToggle && (
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setView("boxscore")}
              className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                view === "boxscore"
                  ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Table className="w-4 h-4" />
              Box Score
            </button>
            <button
              onClick={() => setView("advanced")}
              className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                view === "advanced"
                  ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Advanced
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {view === "boxscore" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Away Team Stats */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-2 dark:border-slate-800">
              <SafeImage src={awayTeam.logoUrl} alt="" width={24} height={24} />
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">
                {awayTeam.name} Stats
              </h3>
            </div>
            {awayBoxscore ? (
              <div className="space-y-6">
                <StatTable
                  title="PASSING"
                  headers={awayBoxscore.passing.headers}
                  players={awayBoxscore.passing.players}
                  totals={awayBoxscore.passing.totals}
                />
                <StatTable
                  title="RUSHING"
                  headers={awayBoxscore.rushing.headers}
                  players={awayBoxscore.rushing.players}
                  totals={awayBoxscore.rushing.totals}
                />
                <StatTable
                  title="RECEIVING"
                  headers={awayBoxscore.receiving.headers}
                  players={awayBoxscore.receiving.players}
                  totals={awayBoxscore.receiving.totals}
                />
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">Detailed stats not available.</p>
            )}
          </div>

          {/* Home Team Stats */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-2 dark:border-slate-800">
              <SafeImage src={homeTeam.logoUrl} alt="" width={24} height={24} />
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">
                {homeTeam.name} Stats
              </h3>
            </div>
            {homeBoxscore ? (
              <div className="space-y-6">
                <StatTable
                  title="PASSING"
                  headers={homeBoxscore.passing.headers}
                  players={homeBoxscore.passing.players}
                  totals={homeBoxscore.passing.totals}
                />
                <StatTable
                  title="RUSHING"
                  headers={homeBoxscore.rushing.headers}
                  players={homeBoxscore.rushing.players}
                  totals={homeBoxscore.rushing.totals}
                />
                <StatTable
                  title="RECEIVING"
                  headers={homeBoxscore.receiving.headers}
                  players={homeBoxscore.receiving.players}
                  totals={homeBoxscore.receiving.totals}
                />
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">Detailed stats not available.</p>
            )}
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Loading advanced stats...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">
            {error}
          </p>
        </div>
      ) : advancedStats ? (
        <AdvancedStatsView stats={advancedStats} homeTeam={homeTeam} awayTeam={awayTeam} />
      ) : null}
    </div>
  );
}
