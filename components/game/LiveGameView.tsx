"use client";

import { useState } from "react";
import { Game } from "@/types/nfl";
import { refreshGameData } from "@/app/actions/gameActions";
import { useAdaptivePolling } from "@/hooks/useAdaptivePolling";
import { LiveGameHeader } from "./LiveGameHeader";
import { ScoringSummary } from "./ScoringSummary";
import { BoxScoreSection } from "./BoxScoreSection";

interface LiveGameViewProps {
  initialGame: Game;
}

export default function LiveGameView({ initialGame }: LiveGameViewProps) {
  const [game, setGame] = useState<Game>(initialGame);
  const [error, setError] = useState<string | null>(null);

  // Replace old useEffect polling with adaptive polling hook
  const { isPolling, currentStatus, hasError, isVisible } = useAdaptivePolling({
    gameId: game.id,
    initialStatus: initialGame.status,
    fetchFunction: refreshGameData,
    onUpdate: setGame,
    onError: (err) => setError(err.message),
  });

  const currentPlay = game.drives?.[0]?.plays?.[0];
  const clockDisplay = game.status === 'in' 
    ? (currentPlay?.clock && currentPlay?.quarter ? `${currentPlay.clock} - Q${currentPlay.quarter}` : "Live") 
    : "Final";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Status Indicator - Shows polling state to user */}
      <div className="flex justify-between items-center px-3 sm:px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isPolling && isVisible && (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">
                Live updates active
                <span className="hidden sm:inline">
                  {currentStatus === 'in' && ' (10s refresh)'}
                  {currentStatus === 'pre' && ' (60s refresh)'}
                </span>
              </span>
            </>
          )}
          {!isVisible && (
            <>
              <div className="w-2 h-2 bg-slate-400 rounded-full" />
              <span className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500">
                Updates paused<span className="hidden sm:inline"> (tab hidden)</span>
              </span>
            </>
          )}
          {hasError && (
            <>
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <span className="text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-500">
                Connection issue<span className="hidden sm:inline"> - retrying in 30s</span>
              </span>
            </>
          )}
          {currentStatus === 'post' && (
            <>
              <div className="w-2 h-2 bg-slate-400 rounded-full" />
              <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                Game finished<span className="hidden sm:inline"> - updates stopped</span>
              </span>
            </>
          )}
        </div>
        {error && (
          <span className="text-xs text-red-600 dark:text-red-400">
            {error}
          </span>
        )}
      </div>

      <LiveGameHeader 
        homeTeam={game.homeTeam}
        awayTeam={game.awayTeam}
        homeScore={game.homeScore || 0}
        awayScore={game.awayScore || 0}
        clock={clockDisplay}
      />

      {game.scoringPlays && game.linescores && (
         <ScoringSummary 
            homeTeam={game.homeTeam}
            awayTeam={game.awayTeam}
            scoringPlays={game.scoringPlays}
            homeLinescores={game.linescores.home}
            awayLinescores={game.linescores.away}
            homeScore={game.homeScore || 0}
            awayScore={game.awayScore || 0}
            drives={game.drives || []}
            isLive={game.status === 'in'}
         />
      )}

      {/* Stats Grid */}
      <div className="mt-6 sm:mt-8">
        <BoxScoreSection
          homeTeam={game.homeTeam}
          awayTeam={game.awayTeam}
          homeBoxscore={game.matchupStats?.home.boxscore}
          awayBoxscore={game.matchupStats?.away.boxscore}
          season={game.season}
          week={game.week}
          seasonType={game.seasonType}
          gameStatus={game.status}
        />
      </div>
    </div>
  );
}