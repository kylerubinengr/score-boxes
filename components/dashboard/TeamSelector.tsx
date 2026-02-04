"use client";

import { TEAM_LOGOS, TEAM_NAMES } from "@/constants/teams";
import Link from "next/link";
import { SafeImage } from "@/components/common/SafeImage";
import { useSeason } from "@/context/SeasonContext";
import { buildTeamUrl } from "@/lib/routes";

// Division organization
const NFL_DIVISIONS = {
  "AFC East": ["BUF", "MIA", "NE", "NYJ"],
  "AFC North": ["BAL", "CIN", "CLE", "PIT"],
  "AFC South": ["HOU", "IND", "JAX", "TEN"],
  "AFC West": ["DEN", "KC", "LV", "LAC"],
  "NFC East": ["DAL", "NYG", "PHI", "WSH"],
  "NFC North": ["CHI", "DET", "GB", "MIN"],
  "NFC South": ["ATL", "CAR", "NO", "TB"],
  "NFC West": ["ARI", "LAR", "SF", "SEA"]
};

export function TeamSelector({ currentTeam }: { currentTeam?: string }) {
  const { selectedSeason } = useSeason();
  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 sm:gap-x-4 gap-y-6 sm:gap-y-8 md:gap-x-4">
        {Object.entries(NFL_DIVISIONS).map(([division, teams], index) => (
          <div
            key={division}
            className={`
              ${index % 2 === 0 && index < 7 ? 'relative after:content-[""] after:absolute after:right-[-12px] after:top-0 after:bottom-0 after:w-px after:bg-slate-200 after:dark:bg-slate-700 md:after:hidden' : ''}
            `}
          >
            <h4 className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              {division}
            </h4>
            <div className="grid grid-cols-4 gap-3 md:flex md:flex-wrap md:gap-2">
              {teams.map((abbr) => (
                <Link
                  key={abbr}
                  href={buildTeamUrl(selectedSeason, abbr)}
                  title={TEAM_NAMES[abbr]}
                  className={`
                    w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                    transition-all duration-200 border-2 min-h-[44px]
                    ${currentTeam === abbr
                      ? "bg-blue-600 border-blue-600 shadow-md dark:bg-blue-500 dark:border-blue-500 scale-110"
                      : "bg-white border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                    }
                  `}
                >
                  <SafeImage
                    src={TEAM_LOGOS[abbr]}
                    alt={TEAM_NAMES[abbr]}
                    width={28}
                    height={28}
                    className="object-contain w-7 h-7 sm:w-8 sm:h-8"
                  />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
