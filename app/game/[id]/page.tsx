import { getGameById, getGamesByWeek } from "@/services/gameService";
import { getMatchupComparison } from "@/services/matchupService";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Wind, Thermometer, Home, TrendingUp } from "lucide-react";
import { ScoringSummary } from "@/components/game/ScoringSummary";
import { AdvancedMatchupEngine } from "@/components/game/AdvancedMatchupEngine";
import { GameDetailHeader } from "@/components/game/GameDetailHeader";
import { GameTabManager } from "@/components/game/GameTabManager";
import { BoxScoreSection } from "@/components/game/BoxScoreSection";
import { formatGameTime } from "@/lib/utils";
import { SafeImage } from "@/components/common/SafeImage";
import LiveGameView from "@/components/game/LiveGameView";

export const dynamicParams = true;

export async function generateStaticParams() {
  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
  const results = await Promise.all(
    weeks.map((week) => getGamesByWeek(week))
  );
  const flatGames = results.flatMap(r => r.games);
  return flatGames.map((game) => ({ id: game.id }));
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGameById(id);

  if (!game) {
    notFound();
  }

  const isLive = game.isLive || game.status === 'in';

  if (isLive) {
      return (
        <div className="container mx-auto px-4 pb-4 pt-6 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 max-w-7xl">
            <GameTabManager
              gameId={game.id}
              awayAbbreviation={game.awayTeam.abbreviation}
              homeAbbreviation={game.homeTeam.abbreviation}
              week={game.week}
              season={game.season}
            />
            <LiveGameView initialGame={game} />
        </div>
      );
  }

  const isFinal = game.status === 'post';
  const matchupComparison = await getMatchupComparison(game.homeTeam.id, game.awayTeam.id);

  return (
    <div className="container mx-auto px-4 pb-4 pt-0 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 max-w-7xl">
      <GameTabManager
        gameId={game.id}
        awayAbbreviation={game.awayTeam.abbreviation}
        homeAbbreviation={game.homeTeam.abbreviation}
        week={game.week}
        season={game.season}
      />

      {/* Game Detail Header - Clear Visual Hierarchy */}
      <GameDetailHeader
        homeTeam={game.homeTeam}
        awayTeam={game.awayTeam}
        gameDate={game.date}
        venue={game.venue}
        venueLocation={game.venueLocation}
        status={game.status}
        homeScore={game.homeScore}
        awayScore={game.awayScore}
        broadcast={game.broadcast}
      />

      {isFinal ? (
        <div className="mt-8 border-t border-slate-100 pt-8 dark:border-slate-800">
            {game.scoringPlays && game.linescores && (
                 <ScoringSummary
                    homeTeam={game.homeTeam}
                    awayTeam={game.awayTeam}
                    scoringPlays={game.scoringPlays}
                    homeLinescores={game.linescores.home}
                    awayLinescores={game.linescores.away}
                    homeScore={game.homeScore || 0}
                    awayScore={game.awayScore || 0}
                    drives={game.drives}
                    comparison={matchupComparison}
                    season={game.season}
                    week={game.week}
                    seasonType={game.seasonType}
                 />
            )}

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
      ) : (
        <div className="space-y-8">
            {/* Top Row: Weather & Betting Side-by-Side - COMMENTED OUT
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                // Weather
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 h-full">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <Wind className="w-5 h-5 text-blue-500" />
                        Game Conditions
                    </h3>
                    {game.indoor ? (
                        <div className="bg-slate-50 p-4 rounded-lg text-center border border-slate-200 dark:bg-slate-800 dark:border-slate-700 h-[140px] flex flex-col justify-center items-center">
                            <Home className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="font-bold text-slate-700 dark:text-slate-200">Indoor (Dome)</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold mt-1 tracking-wider dark:text-slate-400">Controlled Environment</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 h-[140px]">
                            <div className="p-3 bg-slate-50 rounded-lg text-center dark:bg-slate-800 flex flex-col justify-center">
                                <Thermometer className="w-4 h-4 mx-auto mb-1 text-slate-400"/>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Temp</span>
                                <span className="font-black text-slate-900 text-lg dark:text-slate-200">{game.weather.temperature}°F</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg text-center dark:bg-slate-800 flex flex-col justify-center">
                                <Home className="w-4 h-4 mx-auto mb-1 text-slate-400"/>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Sky</span>
                                <span className="font-black text-slate-900 text-xs dark:text-slate-200">{game.weather.condition}</span>
                            </div>
                        </div>
                    )}
                </div>

                // Betting
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Betting Intelligence</h3>
                        </div>
                        {hasImpliedTotals && (
                             <div className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                IMPLIED: {game.awayTeam.abbreviation} {impliedAwayScore.toFixed(0)} - {game.homeTeam.abbreviation} {impliedHomeScore.toFixed(0)}
                             </div>
                        )}
                    </div>
                    <OddsTable bookmakers={game.bookmakers} />
                </div>
            </div>
            */}

            {/* Bottom Row: Advanced Matchup Engine */}
            {matchupComparison && (
                <AdvancedMatchupEngine 
                    homeTeam={game.homeTeam} 
                    awayTeam={game.awayTeam} 
                    comparison={matchupComparison} 
                />
            )}
        </div>
      )}
    </div>
  );
}