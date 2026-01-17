"use client";

import { useRouter, usePathname } from "next/navigation";
import { Calendar, Users, Trophy } from "lucide-react";
import { getCurrentNFLWeek } from "@/lib/nflDates";

export function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const currentWeek = getCurrentNFLWeek();

  const isTeamView = pathname.startsWith("/team");
  const isStandingsView = pathname === "/dashboard/playoffs";
  const isWeekView = (pathname.startsWith("/dashboard") || pathname === "/") && !isStandingsView;

  return (
    <div className="flex w-full md:inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1">
      <button
        onClick={() => {
          if (currentWeek === 'playoffs') {
            router.push('/dashboard/playoffs');
          } else {
            router.push(`/dashboard/${currentWeek}`);
          }
        }}
        className={`
          flex-1 md:flex-initial px-3 py-3 md:px-4 md:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200
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
        onClick={() => router.push("/team/BUF")}
        className={`
          flex-1 md:flex-initial px-3 py-3 md:px-4 md:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200
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
        onClick={() => router.push("/dashboard/playoffs")}
        className={`
          flex-1 md:flex-initial px-3 py-3 md:px-4 md:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200
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
    </div>
  );
}
