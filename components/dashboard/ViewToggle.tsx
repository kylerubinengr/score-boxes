"use client";

import { useRouter, usePathname } from "next/navigation";
import { Calendar, Users, Trophy, TrendingUp } from "lucide-react";
import { fetchCurrentNFLWeek } from "@/lib/nflDates";
import { useSeason } from "@/context/SeasonContext";
import { buildScoresUrl, buildTeamUrl, buildStandingsUrl, buildPerformancesUrl } from "@/lib/routes";

export function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedSeason } = useSeason();

  const isTeamView = pathname.startsWith("/team");
  const isStandingsView = pathname.startsWith("/standings");
  const isPerformancesView = pathname.startsWith("/performances");
  const isWeekView = (pathname.startsWith("/scores") || pathname === "/") && !isStandingsView && !isPerformancesView;

  return (
    <div className="flex w-full md:inline-flex md:w-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1">
      <button
        onClick={async () => {
          // Navigate to the current week (regular season or playoff round)
          const weekInfo = await fetchCurrentNFLWeek();
          router.push(buildScoresUrl(selectedSeason, weekInfo.route));
        }}
        className={`
          flex-1 md:flex-initial px-3 py-3 md:px-3 md:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200
          flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] md:min-h-0
          ${isWeekView
            ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }
        `}
      >
        <Calendar className="w-4 h-4" />
        <span className="hidden xs:inline sm:inline">Week</span>
        <span className="xs:hidden sm:hidden">Week</span>
      </button>
      <button
        onClick={() => router.push(buildTeamUrl(selectedSeason, "BUF"))}
        className={`
          flex-1 md:flex-initial px-3 py-3 md:px-3 md:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200
          flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] md:min-h-0
          ${isTeamView
            ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }
        `}
      >
        <Users className="w-4 h-4" />
        <span className="hidden xs:inline sm:inline">Team</span>
        <span className="xs:hidden sm:hidden">Team</span>
      </button>
      <button
        onClick={() => router.push(buildStandingsUrl(selectedSeason))}
        className={`
          flex-1 md:flex-initial px-3 py-3 md:px-3 md:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200
          flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] md:min-h-0
          ${isStandingsView
            ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }
        `}
      >
        <Trophy className="w-4 h-4" />
        <span>Standings</span>
      </button>
      <button
        onClick={() => router.push(buildPerformancesUrl(selectedSeason))}
        className={`
          flex-1 md:flex-initial px-3 py-3 md:px-3 md:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200
          flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] md:min-h-0
          ${isPerformancesView
            ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }
        `}
      >
        <TrendingUp className="w-4 h-4" />
        <span>Performances</span>
      </button>
    </div>
  );
}
