"use client";

import { useState } from "react";
import { Game } from "@/types/nfl";
import { refreshGameData } from "@/app/actions/gameActions";
import { useAdaptivePolling } from "@/hooks/useAdaptivePolling";
import { LiveGameHeader } from "./LiveGameHeader";
import { ScoringSummary } from "./ScoringSummary";
import { StatTable } from "@/components/dashboard/StatTable";
import { SafeImage } from "@/components/common/SafeImage";

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

      {/* Live Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6 sm:mt-8">
            {/* Away Team Stats */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-100 pb-2 dark:border-slate-800">
                    <SafeImage src={game.awayTeam.logoUrl} alt="" width={20} height={20} className="w-5 h-5 sm:w-6 sm:h-6" />
                    <h3 className="text-xs sm:text-sm font-black uppercase text-slate-400 tracking-widest">{game.awayTeam.name} Stats</h3>
                </div>
                {game.matchupStats?.away.boxscore ? (
                    <div className="space-y-6">
                        <StatTable title="PASSING" headers={game.matchupStats.away.boxscore.passing.headers} players={game.matchupStats.away.boxscore.passing.players} totals={game.matchupStats.away.boxscore.passing.totals} />
                        <StatTable title="RUSHING" headers={game.matchupStats.away.boxscore.rushing.headers} players={game.matchupStats.away.boxscore.rushing.players} totals={game.matchupStats.away.boxscore.rushing.totals} />
                        <StatTable title="RECEIVING" headers={game.matchupStats.away.boxscore.receiving.headers} players={game.matchupStats.away.boxscore.receiving.players} totals={game.matchupStats.away.boxscore.receiving.totals} />
                    </div>
                ) : <p className="text-slate-400 text-sm italic">Detailed stats not available.</p>}
            </div>

            {/* Home Team Stats */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-100 pb-2 dark:border-slate-800">
                    <SafeImage src={game.homeTeam.logoUrl} alt="" width={20} height={20} className="w-5 h-5 sm:w-6 sm:h-6" />
                    <h3 className="text-xs sm:text-sm font-black uppercase text-slate-400 tracking-widest">{game.homeTeam.name} Stats</h3>
                </div>
                {game.matchupStats?.home.boxscore ? (
                    <div className="space-y-6">
                        <StatTable title="PASSING" headers={game.matchupStats.home.boxscore.passing.headers} players={game.matchupStats.home.boxscore.passing.players} totals={game.matchupStats.home.boxscore.passing.totals} />
                        <StatTable title="RUSHING" headers={game.matchupStats.home.boxscore.rushing.headers} players={game.matchupStats.home.boxscore.rushing.players} totals={game.matchupStats.home.boxscore.rushing.totals} />
                        <StatTable title="RECEIVING" headers={game.matchupStats.home.boxscore.receiving.headers} players={game.matchupStats.home.boxscore.receiving.players} totals={game.matchupStats.home.boxscore.receiving.totals} />
                    </div>
                ) : <p className="text-slate-400 text-sm italic">Detailed stats not available.</p>}
            </div>
      </div>
    </div>
  );
}