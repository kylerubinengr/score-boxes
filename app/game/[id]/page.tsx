import type { Metadata } from "next";
import { getGameById, getGamesByWeek } from "@/services/gameService";
import { getMatchupComparison } from "@/services/matchupService";
import { notFound } from "next/navigation";
import { ScoringSummary } from "@/components/game/ScoringSummary";
import { AdvancedMatchupEngine } from "@/components/game/AdvancedMatchupEngine";
import { GameDetailHeader } from "@/components/game/GameDetailHeader";
import { GameTabManager } from "@/components/game/GameTabManager";
import { BoxScoreSection } from "@/components/game/BoxScoreSection";
import LiveGameView from "@/components/game/LiveGameView";

export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) {
    return { title: "Game Not Found | Score Boxes" };
  }
  const title = `${game.awayTeam.abbreviation} vs ${game.homeTeam.abbreviation} — Week ${game.week} | Score Boxes`;
  const description = `${game.awayTeam.name} at ${game.homeTeam.name}, Week ${game.week} ${game.season} NFL season.`;
  return { title, description };
}

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