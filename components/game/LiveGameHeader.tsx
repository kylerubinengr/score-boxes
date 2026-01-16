import { Team } from "@/types/nfl";
import { SafeImage } from "../common/SafeImage";
import { Radio } from "lucide-react";

interface LiveGameHeaderProps {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  clock: string; // e.g., "10:45 - 2nd" or just "2nd"
}

export function LiveGameHeader({ homeTeam, awayTeam, homeScore, awayScore, clock }: LiveGameHeaderProps) {
  return (
    <header className="bg-white rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 overflow-hidden mb-4 sm:mb-6">
      <div className="flex flex-row justify-between items-center p-3 sm:p-4 md:p-6">
        {/* Away Team */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-1 min-w-0">
            <SafeImage src={awayTeam.logoUrl} alt={awayTeam.name} width={56} height={56} className="drop-shadow-sm w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex-shrink-0" />
            <div className="text-left min-w-0 flex-shrink">
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-slate-900 dark:text-slate-100 leading-tight truncate hidden md:block">{awayTeam.name}</h2>
                <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-slate-100 leading-tight md:hidden">{awayTeam.abbreviation}</h2>
                <p className="text-slate-500 text-[10px] sm:text-xs font-bold dark:text-slate-400">{awayTeam.record}</p>
            </div>
            <div className="ml-auto md:ml-4 text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 flex-shrink-0">{awayScore}</div>
        </div>

        {/* Center Live Status */}
        <div className="flex flex-col items-center justify-center px-2 sm:px-3 md:px-6 min-w-[80px] sm:min-w-[100px] md:min-w-[140px] flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5 text-red-600 bg-red-50 px-1.5 sm:px-2 py-0.5 rounded-full border border-red-100 animate-pulse mb-1 sm:mb-2">
                <Radio className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest">Live</span>
            </div>
            <div className="text-[10px] sm:text-xs md:text-sm font-black text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {clock || "In Progress"}
            </div>
        </div>

        {/* Home Team */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-1 flex-row-reverse text-right min-w-0">
            <SafeImage src={homeTeam.logoUrl} alt={homeTeam.name} width={56} height={56} className="drop-shadow-sm w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex-shrink-0" />
            <div className="min-w-0 flex-shrink">
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-slate-900 dark:text-slate-100 leading-tight truncate hidden md:block">{homeTeam.name}</h2>
                <h2 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-slate-100 leading-tight md:hidden">{homeTeam.abbreviation}</h2>
                <p className="text-slate-500 text-[10px] sm:text-xs font-bold dark:text-slate-400">{homeTeam.record}</p>
            </div>
             <div className="mr-auto md:mr-4 text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 flex-shrink-0">{homeScore}</div>
        </div>
      </div>
      
      {/* Decorative Bottom Bar */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/2" style={{ backgroundColor: awayTeam.color || '#000' }} />
        <div className="h-full w-1/2" style={{ backgroundColor: homeTeam.color || '#000' }} />
      </div>
    </header>
  );
}
