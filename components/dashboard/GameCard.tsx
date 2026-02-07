import { Game, StatLeader } from '@/types/nfl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameTabs } from '@/context/GameTabsContext';
import { SafeImage } from '../common/SafeImage';
import { 
  Cloud, 
  Sun, 
  Umbrella, 
  Snowflake, 
  MapPin
} from 'lucide-react';

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

export function GameCard({ game, showWeek = false }: { game: Game; showWeek?: boolean }) {
  const router = useRouter();
  const { tabs, isTabLimitReached, setIsLimitWarningVisible } = useGameTabs();
  const isPre = game.status === 'pre';
  const isLive = game.status === 'in';
  
  const handleGameClick = (e: React.MouseEvent) => {
    const tabExists = tabs.some(t => t.id === game.id);
    
    if (isTabLimitReached && !tabExists) {
      e.preventDefault();
      setIsLimitWarningVisible(true);
      return;
    }
    
    // Allow normal navigation
  };

  // --- Helper: Date Formatter ---
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    const time = new Date(dateStr).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return time;
  };

  const rawTime = formatTime(game.date);
  const displayBroadcast = game.broadcast || 'TBD';
  const displayTime = rawTime === '09:00 PM' ? 'TBD' : rawTime;

  // --- Helper: Weather Icon Logic ---
    const WeatherIcon = ({ condition }: { condition: string }) => {
      const c = condition.toLowerCase();
      if (c.includes('rain') || c.includes('drizzle')) return <Umbrella className="w-3.5 h-3.5 text-blue-500" />;
      if (c.includes('snow')) return <Snowflake className="w-3.5 h-3.5 text-slate-400" />;
      if (c.includes('cloud')) return <Cloud className="w-3.5 h-3.5 text-slate-400" />;
      if (c.includes('sunny') || c.includes('clear')) return <Sun className="w-3.5 h-3.5 text-amber-500" />;
      return <Cloud className="w-3.5 h-3.5 text-slate-400" />;
    };
  
      return (
        <Link
          href={`/game/${game.id}`}
          prefetch={false}
          onClick={handleGameClick}
          className="block bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg hover:border-blue-500 hover:scale-[1.01] transition-all duration-300 overflow-hidden flex flex-col h-full dark:bg-slate-900 dark:border-slate-800 dark:hover:border-blue-500"
        >

          {/* 1. Header Cleanup & Alignment */}
          <header className="px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-start gap-2 sm:gap-4 bg-slate-50/50 border-b border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              <p className="font-bold">{formatDate(game.date)}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 dark:text-slate-400">
                 {displayBroadcast === 'TBD' && displayTime === 'TBD' ? (                         <span className="uppercase">TBD</span>
                       ) : (
                         <>
                           <span className="uppercase">{displayBroadcast}</span> {displayTime}
                         </>
                       )}
                    </p>
                  </div>        <div className="flex items-center gap-2">
           {showWeek && (
              <span className="font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest">
                {getWeekDisplayName(game.week, game.seasonType)}
              </span>
           )}
           {isLive ? (
              <span className="font-black text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest animate-pulse">
                {game.period === 2 && game.displayClock === '0:00' 
                  ? 'HALF' 
                  : (game.period && game.displayClock ? `Q${game.period} ${game.displayClock}` : 'LIVE')}
              </span>
           ) : (isPre && game.weather) ? (
              /* Weather commented out for now
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-xs">
                <WeatherIcon condition={game.weather.condition} />
                <span>{game.weather.temperature}°F</span>
              </div>
              */
             null
           ) : null}
        </div>
      </header>

      {/* Main Content */}
      <div className="p-3 sm:p-4 flex-1">

        {/* Teams & Scores */}
        <div className="space-y-3 sm:space-y-4">
            {/* Away Team */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                    <SafeImage
                      src={game.awayTeam.logoUrl}
                      alt={game.awayTeam.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 sm:w-12 sm:h-12"
                      initials={game.awayTeam.abbreviation.substring(0, 2)}
                      color={game.awayTeam.color}
                      fallbackClassName='rounded-full'
                    />
                    <div>
                      <p className="font-bold text-slate-800 text-sm sm:text-base md:text-lg tracking-tight dark:text-slate-100">{game.awayTeam.name}</p>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{game.awayTeam.record}</p>
                    </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-400 dark:text-slate-600">
                   {isPre ? '' : game.awayScore}
                </div>
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                    <SafeImage
                      src={game.homeTeam.logoUrl}
                      alt={game.homeTeam.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 sm:w-12 sm:h-12"
                      initials={game.homeTeam.abbreviation.substring(0, 2)}
                      color={game.homeTeam.color}
                      fallbackClassName='rounded-full'
                    />
                    <div>
                      <p className="font-bold text-slate-800 text-sm sm:text-base md:text-lg tracking-tight dark:text-slate-100">{game.homeTeam.name}</p>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{game.homeTeam.record}</p>
                    </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-400 dark:text-slate-600">
                    {isPre ? '' : game.homeScore}
                </div>
            </div>
        </div>
      </div>

      {/* Footer Restoration */}
      <footer className="px-3 sm:px-4 py-2 text-center text-[10px] sm:text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 dark:text-slate-500">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate max-w-[200px] sm:max-w-[250px]">{game.venue} • {game.venueLocation}</span>
        </div>
      </footer>
    </Link>
  );
}