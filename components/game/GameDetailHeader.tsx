import { Team } from "@/types/nfl";
import { SafeImage } from "../common/SafeImage";
import { MapPin, Calendar } from "lucide-react";

interface GameDetailHeaderProps {
  homeTeam: Team;
  awayTeam: Team;
  gameDate: string;
  venue: string;
  venueLocation: string;
  status: 'pre' | 'in' | 'post';
  homeScore?: number;
  awayScore?: number;
  broadcast?: string;
}

/**
 * GameDetailHeader Component
 *
 * Provides clear visual hierarchy for game detail pages:
 * 1. Game matchup as primary H1 header
 * 2. Team information prominently displayed
 * 3. Clean, modern design matching NFL Dashboard branding
 */
export function GameDetailHeader({
  homeTeam,
  awayTeam,
  gameDate,
  venue,
  venueLocation,
  status,
  homeScore,
  awayScore,
  broadcast,
}: GameDetailHeaderProps) {
  const isFinal = status === 'post';
  const isPre = status === 'pre';

  return (
    <div className="pt-4 sm:pt-6 mb-6 sm:mb-8">
      {/* Primary Header - Game Matchup */}
      <header className="bg-white rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
        {/* Main Content */}
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          {/* Mobile: Horizontal Layout (< md) */}
          <div className="md:hidden">
            {/* Game Date and Broadcast - Centered above matchup */}
            <div className="text-center mb-3 sm:mb-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatGameDate(gameDate)}</span>
                </div>
                {broadcast && (
                  <>
                    <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                    <span className="font-semibold">{broadcast}</span>
                  </>
                )}
              </div>
            </div>

            {/* Teams Display - Horizontal on Mobile */}
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              {/* Away Team */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                <SafeImage
                  src={awayTeam.logoUrl}
                  alt={awayTeam.name}
                  width={48}
                  height={48}
                  className="drop-shadow-sm w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                    {awayTeam.abbreviation}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {awayTeam.record}
                  </div>
                  {isFinal && (
                    <div className="text-xl sm:text-2xl font-black mt-0.5 sm:mt-1 text-slate-900 dark:text-slate-100">
                      {awayScore}
                    </div>
                  )}
                </div>
              </div>

              {/* VS / Final Indicator */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`text-[10px] sm:text-xs font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${
                  isFinal
                    ? 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                    : 'text-slate-400 bg-slate-50 dark:bg-slate-800 dark:text-slate-600'
                }`}>
                  {isFinal ? 'FINAL' : 'VS'}
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500">
                  <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                  <span className="truncate max-w-[80px] sm:max-w-[120px]">{venue}</span>
                </div>
              </div>

              {/* Home Team */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 flex-row-reverse min-w-0 text-right">
                <SafeImage
                  src={homeTeam.logoUrl}
                  alt={homeTeam.name}
                  width={48}
                  height={48}
                  className="drop-shadow-sm w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                    {homeTeam.abbreviation}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {homeTeam.record}
                  </div>
                  {isFinal && (
                    <div className="text-xl sm:text-2xl font-black mt-0.5 sm:mt-1 text-slate-900 dark:text-slate-100">
                      {homeScore}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Original Vertical/Centered Layout (>= md) */}
          <div className="hidden md:block">
            {/* Game Title - Clear H1 */}
            <div className="text-center mb-6 lg:mb-8">
              <h1 className="text-xl lg:text-2xl xl:text-3xl font-black text-slate-900 dark:text-slate-100 mb-2 px-2">
                {awayTeam.name} <span className="text-slate-400 dark:text-slate-600">@</span> {homeTeam.name}
              </h1>
              <div className="flex items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatGameDate(gameDate)}</span>
                </div>
                {broadcast && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="font-semibold">{broadcast}</span>
                  </>
                )}
              </div>
            </div>

            {/* Teams Display - Centered Vertical */}
            <div className="flex justify-center items-center gap-8 lg:gap-16">
              {/* Away Team */}
              <div className="flex flex-col items-center gap-3 flex-1 max-w-[200px]">
                <SafeImage
                  src={awayTeam.logoUrl}
                  alt={awayTeam.name}
                  width={80}
                  height={80}
                  className="drop-shadow-sm w-[70px] h-[70px] lg:w-20 lg:h-20"
                />
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {awayTeam.abbreviation}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {awayTeam.record}
                  </div>
                  {isFinal && (
                    <div className="text-3xl lg:text-4xl font-black mt-3 text-slate-900 dark:text-slate-100">
                      {awayScore}
                    </div>
                  )}
                </div>
              </div>

              {/* VS / Final Indicator */}
              <div className="flex flex-col items-center gap-2">
                <div className={`text-lg lg:text-xl font-black px-4 py-1 rounded-full ${
                  isFinal
                    ? 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                    : 'text-slate-400 bg-slate-50 dark:bg-slate-800 dark:text-slate-600'
                }`}>
                  {isFinal ? 'FINAL' : 'VS'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{venue}</span>
                </div>
              </div>

              {/* Home Team */}
              <div className="flex flex-col items-center gap-3 flex-1 max-w-[200px]">
                <SafeImage
                  src={homeTeam.logoUrl}
                  alt={homeTeam.name}
                  width={80}
                  height={80}
                  className="drop-shadow-sm w-[70px] h-[70px] lg:w-20 lg:h-20"
                />
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">
                    {homeTeam.abbreviation}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {homeTeam.record}
                  </div>
                  {isFinal && (
                    <div className="text-3xl lg:text-4xl font-black mt-3 text-slate-900 dark:text-slate-100">
                      {homeScore}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Color Bar - Visual Branding */}
        <div className="h-1 w-full flex">
          <div
            className="h-full w-1/2"
            style={{ backgroundColor: awayTeam.colors?.primary || awayTeam.color || '#94a3b8' }}
          />
          <div
            className="h-full w-1/2"
            style={{ backgroundColor: homeTeam.colors?.primary || homeTeam.color || '#94a3b8' }}
          />
        </div>
      </header>
    </div>
  );
}

/**
 * Format game date for display
 */
function formatGameDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
