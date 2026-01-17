"use client";

import Link from "next/link";
import { getCurrentNFLWeek } from "@/lib/nflDates";
import { useSeason } from "@/context/SeasonContext";
import { useEffect, useState } from "react";
import { getGamesByWeek } from "@/services/gameService";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

type PlayoffWeek = {
  id: string;
  label: string;
  espnWeek: number; // ESPN playoff week (1=WC, 2=DIV, 3=CONF, 5=SB)
};

const PLAYOFF_WEEKS: PlayoffWeek[] = [
  { id: "WC", label: "WC", espnWeek: 1 },
  { id: "DIV", label: "DIV", espnWeek: 2 },
  { id: "CONF", label: "CONF", espnWeek: 3 },
  { id: "SB", label: "SB", espnWeek: 5 },
];

export function WeekSelector({ currentWeek }: { currentWeek: number | string | "standings" }) {
  const { selectedSeason } = useSeason();
  const router = useRouter();
  const [unlockedPlayoffWeeks, setUnlockedPlayoffWeeks] = useState<string[]>(["WC"]);

  // Prior to 2021, the NFL season had 17 weeks. From 2021 onwards, it has 18.
  const totalWeeks = selectedSeason >= 2021 ? 18 : 17;
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  const activeNFLWeek = getCurrentNFLWeek();
  const isCurrentSeason = selectedSeason === 2025;

  // Check which playoff weeks should be unlocked
  useEffect(() => {
    async function checkPlayoffAccess() {
      // For historical seasons, unlock all playoff weeks
      if (!isCurrentSeason) {
        setUnlockedPlayoffWeeks(["WC", "DIV", "CONF", "SB"]);
        return;
      }

      // For current season, check completion status sequentially
      const unlocked: string[] = ["WC"]; // WC always unlocked

      try {
        // Check if Wild Card (week 1) is complete
        const { games: wcGames } = await getGamesByWeek(1, 3, selectedSeason);
        const wcComplete = wcGames.length > 0 && wcGames.every(g => g.status === 'post');

        if (wcComplete) {
          unlocked.push("DIV");

          // Only check Divisional if Wild Card is complete
          const { games: divGames } = await getGamesByWeek(2, 3, selectedSeason);
          const divComplete = divGames.length > 0 && divGames.every(g => g.status === 'post');

          if (divComplete) {
            unlocked.push("CONF");

            // Only check Conference if Divisional is complete
            const { games: confGames } = await getGamesByWeek(3, 3, selectedSeason);
            const confComplete = confGames.length > 0 && confGames.every(g => g.status === 'post');

            if (confComplete) {
              unlocked.push("SB");
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

  const isPlayoffWeek = typeof currentWeek === 'string';

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    // Check if it's a playoff week (string) or regular week (number)
    if (PLAYOFF_WEEKS.some(p => p.id === value)) {
      router.push(`/dashboard/${value}`);
    } else {
      const selectedWeek = parseInt(value);
      router.push(`/dashboard/${selectedWeek}`);
    }
  };

  return (
    <div className="space-y-3">
      {/* Regular Season Weeks - Mobile: Dropdown, Desktop: Buttons */}

      {/* Mobile Dropdown - Combined Regular Season + Playoffs */}
      <div className="md:hidden flex items-center gap-2">
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
          Week:
        </span>
        <div className="relative flex-1">
          <select
            value={typeof currentWeek === 'string' ? currentWeek : currentWeek}
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
              const isUnlocked = unlockedPlayoffWeeks.includes(playoff.id);
              if (!isUnlocked) return null;

              return (
                <option key={playoff.id} value={playoff.id}>
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

      {/* Desktop Buttons */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto overflow-y-visible pb-2 -mx-3 px-3">
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap mr-2 sticky left-3 bg-slate-50 dark:bg-slate-950 pr-2 z-10">
          Week:
        </span>
        {weeks.map((week) => (
          <Link
            key={week}
            href={`/dashboard/${week}`}
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
          const isUnlocked = unlockedPlayoffWeeks.includes(playoff.id);
          const isActive = currentWeek === playoff.id;

          if (!isUnlocked) {
            // Locked playoff week
            return (
              <button
                key={playoff.id}
                disabled
                className="px-4 py-3 sm:px-3 sm:py-1.5 text-sm font-medium rounded-full transition-all whitespace-nowrap bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed dark:bg-slate-900 dark:text-slate-600 dark:border-slate-800"
              >
                {playoff.label}
              </button>
            );
          }

          return (
            <Link
              key={playoff.id}
              href={`/dashboard/${playoff.id}`}
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
