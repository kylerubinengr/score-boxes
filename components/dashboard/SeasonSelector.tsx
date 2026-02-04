"use client";

import { useSeason } from "@/context/SeasonContext";
import { fetchCurrentNFLWeek } from "@/lib/nflDates";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  buildScoresUrl,
  buildStandingsUrl,
  buildPerformancesUrl,
  buildTeamUrl,
} from "@/lib/routes";

// The most recent season with NFL data
const CURRENT_SEASON = 2025;

export function SeasonSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedSeason, setSelectedSeason } = useSeason();
  const availableSeasons = [2025, 2024, 2023, 2022, 2021, 2020];

  const handleSeasonChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeason = parseInt(e.target.value);
    setSelectedSeason(newSeason);

    // Standings view — navigate to new season standings URL
    if (pathname.startsWith('/standings')) {
      router.push(buildStandingsUrl(newSeason));
      return;
    }

    // Performances view — navigate to new season performances URL
    if (pathname.startsWith('/performances')) {
      router.push(buildPerformancesUrl(newSeason));
      return;
    }

    // Team view — swap season segment in URL, keep team
    if (pathname.startsWith('/team')) {
      const parts = pathname.split('/');
      // URL format: /team/{season}/{teamAbbr}
      const teamAbbr = parts[3] || 'BUF';
      router.push(buildTeamUrl(newSeason, teamAbbr));
      return;
    }

    // Scores/Week view — navigate to the appropriate week with new season
    if (pathname === '/' || pathname.startsWith('/scores')) {
      if (newSeason < CURRENT_SEASON) {
        // Historical season: default to week 1
        router.push(buildScoresUrl(newSeason, 1));
      } else {
        // Current season: use ESPN API to find the actual current week
        try {
          const weekInfo = await fetchCurrentNFLWeek();
          router.push(buildScoresUrl(newSeason, weekInfo.route));
        } catch {
          router.push(buildScoresUrl(newSeason, 1));
        }
      }
    }
  };

  return (
    <div className="w-full md:w-auto flex items-center gap-2 sm:gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 sm:px-3 py-3 sm:py-2 shadow-sm min-h-[44px]">
      <span className="text-sm sm:text-sm font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">Season:</span>
      <div className="relative flex-1 md:flex-initial min-w-[4.5rem]">
        <select
          value={selectedSeason}
          onChange={handleSeasonChange}
          className="w-full appearance-none bg-transparent border-none text-slate-900 dark:text-slate-100 text-base sm:text-sm font-semibold sm:font-bold pr-6 sm:pr-6 focus:outline-none focus:ring-0 cursor-pointer [&>option]:text-slate-900 [&>option]:dark:text-slate-100"
        >
          {availableSeasons.map((year) => (
            <option key={year} value={year} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">
              {year}
            </option>
          ))}
        </select>
        <ChevronDown className="w-5 h-5 sm:w-4 sm:h-4 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
