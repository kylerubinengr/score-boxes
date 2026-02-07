"use client";

import { Game, Team } from "@/types/nfl";
import { Home, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGameTabs } from "@/context/GameTabsContext";

const getWeekDisplayName = (week: number, seasonType: number) => {
  if (seasonType !== 3) return `Week ${week}`;
  switch (week) {
    case 1: return 'Wild Card';
    case 2: return 'Divisional';
    case 3: return 'Conference';
    case 4:
    case 5: // Super Bowl can sometimes be week 5
      return 'Super Bowl';
    default: return `Playoffs Week ${week}`;
  }
};

interface HistoricalGameCardProps {
  game: Game;
  showWeek?: boolean;
}

const TeamSection = ({ team, score, isWinner }: { team: Team; score?: number; isWinner: boolean }) => (
  <div className={`flex items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 ${isWinner ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
    {team.logoUrl ? (
      <Image
        src={team.logoUrl}
        alt={`${team.name} logo`}
        width={40}
        height={40}
        className="object-contain w-10 h-10 sm:w-12 sm:h-12"
      />
    ) : (
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-full flex items-center justify-center dark:bg-slate-700">
        <span className="text-[10px] text-slate-500 font-bold dark:text-slate-300">{team.abbreviation}</span>
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className={`font-bold tracking-tight text-sm sm:text-base md:text-lg truncate ${isWinner ? 'text-green-700 dark:text-green-400' : 'text-slate-800 dark:text-slate-100'}`}>{team.name}</h3>
      </div>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{team.record}</p>
    </div>
    <div className={`text-xl sm:text-2xl font-black ${isWinner ? 'text-green-700 dark:text-green-400' : 'text-slate-400 dark:text-slate-600'}`}>
      {score}
    </div>
  </div>
);

export function HistoricalGameCard({ game, showWeek = false }: HistoricalGameCardProps) {
  const router = useRouter();
  const { tabs, isTabLimitReached, setIsLimitWarningVisible } = useGameTabs();
  const isAwayWinner = game.winnerId === game.awayTeam.id;
  const isHomeWinner = game.winnerId === game.homeTeam.id;

  const handleGameClick = (e: React.MouseEvent) => {
    const tabExists = tabs.some(t => t.id === game.id);
    
    if (isTabLimitReached && !tabExists) {
      e.preventDefault();
      setIsLimitWarningVisible(true);
      return;
    }
  };

  return (
    <Link
      href={`/game/${game.id}`}
      prefetch={false}
      onClick={handleGameClick}
      className="block bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg hover:border-blue-500 hover:scale-[1.01] transition-all duration-300 overflow-hidden dark:bg-slate-900 dark:border-slate-800 dark:hover:border-blue-500"
    >
      <header className="px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-start gap-2 sm:gap-4 bg-slate-50/50 border-b border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 min-w-0">
          <p className="truncate">{game.date ? new Date(game.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
          {game.broadcast && <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">{game.broadcast}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-black text-slate-900 bg-slate-200 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest dark:bg-slate-700 dark:text-slate-100 whitespace-nowrap">
                {showWeek ? getWeekDisplayName(game.week, game.seasonType) : 'FINAL'}
            </span>
        </div>
      </header>

      <div className="p-2">
        <TeamSection team={game.awayTeam} score={game.awayScore} isWinner={isAwayWinner} />
        <TeamSection team={game.homeTeam} score={game.homeScore} isWinner={isHomeWinner} />
      </div>

      {/*
      <BettingResultDisplay 
          bettingResult={game.bettingResult} 
          homeAbbr={game.homeTeam.abbreviation} 
          awayAbbr={game.awayTeam.abbreviation}
          homeScore={game.homeScore}
          awayScore={game.awayScore}
      />
      */}

      <footer className="px-3 sm:px-4 py-2 text-center text-[10px] sm:text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 dark:text-slate-500">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate max-w-[200px] sm:max-w-[250px]">{game.venue} • {game.venueLocation}</span>
        </div>
      </footer>
    </Link>
  );
}