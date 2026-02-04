"use client";

import Link from "next/link";
import { getCurrentNFLWeek } from "@/lib/nflDates";
import { useSeason } from "@/context/SeasonContext";
import { useEffect, useState } from "react";
import { getGamesByWeek } from "@/services/gameService";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { buildScoresUrl, PLAYOFF_SLUGS, getPlayoffLabel, isPlayoffSlug } from "@/lib/routes";

type PlayoffWeek = {
  slug: string;
  label: string;
  espnWeek: number; // ESPN playoff week (1=WC, 2=DIV, 3=CONF, 5=SB)
};

const PLAYOFF_WEEKS: PlayoffWeek[] = [
  { slug: "wild-card", label: "WC", espnWeek: 1 },
  { slug: "divisional", label: "DIV", espnWeek: 2 },
  { slug: "conference", label: "CONF", espnWeek: 3 },
  { slug: "super-bowl", label: "SB", espnWeek: 5 },
];

export function WeekSelector({ currentWeek }: { currentWeek: number | string }) {
  const { selectedSeason } = useSeason();
  const router = useRouter();
  const [unlockedPlayoffWeeks, setUnlockedPlayoffWeeks] = useState<string[]>(["wild-card"]);

  // Prior to 2021, the NFL season had 17 weeks. From 2021 onwards, it has 18.
  const totalWeeks = selectedSeason >= 2021 ? 18 : 17;
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  const activeNFLWeek = getCurrentNFLWeek();
  const isCurrentSeason = selectedSeason === 2025;

  // Determine if current view is a playoff week
  const isPlayoffWeek = typeof currentWeek === 'string' && isPlayoffSlug(currentWeek);

  // Check which playoff weeks should be unlocked
  useEffect(() => {
    async function checkPlayoffAccess() {
      // For historical seasons, unlock all playoff weeks
      if (!isCurrentSeason) {
        setUnlockedPlayoffWeeks(PLAYOFF_SLUGS.map(s => s));
        return;
      }

      // For current season, check completion status sequentially
      const unlocked: string[] = ["wild-card"]; // WC always unlocked

      try {
        // Check if Wild Card (week 1) is complete
        const { games: wcGames } = await getGamesByWeek(1, 3, selectedSeason);
        const wcComplete = wcGames.length > 0 && wcGames.every(g => g.status === 'post');

        if (wcComplete) {
          unlocked.push("divisional");

          // Only check Divisional if Wild Card is complete
          const { games: divGames } = await getGamesByWeek(2, 3, selectedSeason);
          const divComplete = divGames.length > 0 && divGames.every(g => g.status === 'post');

          if (divComplete) {
            unlocked.push("conference");

            // Only check Conference if Divisional is complete
            const { games: confGames } = await getGamesByWeek(3, 3, selectedSeason);
            const confComplete = confGames.length > 0 && confGames.every(g => g.status === 'post');

            if (confComplete) {
              unlocked.push("super-bowl");
            }
          }
        }

        setUnlockedPlayoffWeeks(unlocked);
      } catch (error) {
        console.error("Error checking playoff access:", error);
      }
    }

    checkPlayoffAccess();
  }, [selectedSeason, isCurrentSeason]);

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    // Check if it's a playoff week slug or regular week number
    if (PLAYOFF_WEEKS.some(p => p.slug === value)) {
      router.push(buildScoresUrl(selectedSeason, value));
    } else {
      const selectedWeek = parseInt(value);
      router.push(buildScoresUrl(selectedSeason, selectedWeek));
    }
  };

  return (
    <div className="space-y-3">
      {/* Mobile Dropdown - Combined Regular Season + Playoffs */}
      <div className="md:hidden flex items-center gap-2">
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
          Week:
        </span>
        <div className="relative flex-1">
          <select
            value={isPlayoffWeek ? currentWeek : currentWeek}
            onChange={handleWeekChange}
            className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-base font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer min-h-[44px]"
          >
            {/* Regular Season Weeks */}
            {weeks.map((week) => (
              <option key={week} value={week}>
                Week {week}{week === activeNFLWeek && selectedSeason === 2025 ? ' (Live)' : ''}
              </option>
            ))}

            {/* Playoff Weeks */}
            {PLAYOFF_WEEKS.map((playoff) => {
              const isUnlocked = unlockedPlayoffWeeks.includes(playoff.slug);
              if (!isUnlocked) return null;

              return (
                <option key={playoff.slug} value={playoff.slug}>
                  {playoff.label === 'WC' ? 'Wild Card' :
                   playoff.label === 'DIV' ? 'Divisional' :
                   playoff.label === 'CONF' ? 'Conference' :
                   playoff.label === 'SB' ? 'Super Bowl' : playoff.label}
                </option>
              );
            })}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Desktop Buttons - Regular Season */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto overflow-y-visible pb-2 -mx-3 px-3">
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap mr-2 sticky left-3 bg-slate-50 dark:bg-slate-950 pr-2 z-10">
          Week:
        </span>
        {weeks.map((week) => (
          <Link
            key={week}
            href={buildScoresUrl(selectedSeason, week)}
            className={`relative px-4 py-3 sm:px-3 sm:py-1.5 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
              week === currentWeek && !isPlayoffWeek
                ? "bg-blue-600 text-white shadow-md dark:bg-blue-500"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
            }`}
          >
            {week}
            {week === activeNFLWeek && selectedSeason === 2025 && (
              <span className="absolute top-0 right-0 flex h-2 w-2 z-10">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Playoff Weeks - Desktop Only */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto overflow-y-visible pb-2 -mx-3 px-3">
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap mr-2 sticky left-3 bg-slate-50 dark:bg-slate-950 pr-2 z-10">
          Playoffs:
        </span>
        {PLAYOFF_WEEKS.map((playoff) => {
          const isUnlocked = unlockedPlayoffWeeks.includes(playoff.slug);
          const isActive = currentWeek === playoff.slug;

          if (!isUnlocked) {
            // Locked playoff week
            return (
              <button
                key={playoff.slug}
                disabled
                className="px-4 py-3 sm:px-3 sm:py-1.5 text-sm font-medium rounded-full transition-all whitespace-nowrap bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed dark:bg-slate-900 dark:text-slate-600 dark:border-slate-800"
              >
                {playoff.label}
              </button>
            );
          }

          return (
            <Link
              key={playoff.slug}
              href={buildScoresUrl(selectedSeason, playoff.slug)}
              className={`relative px-4 py-3 sm:px-3 sm:py-1.5 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white shadow-md dark:bg-blue-500"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
              }`}
            >
              {playoff.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
