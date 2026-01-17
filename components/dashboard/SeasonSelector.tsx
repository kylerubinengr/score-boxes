"use client";

import { useSeason } from "@/context/SeasonContext";
import { getCurrentNFLWeek } from "@/lib/nflDates";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function SeasonSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedSeason, setSelectedSeason } = useSeason();
  const availableSeasons = [2025, 2024, 2023, 2022, 2021, 2020];

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeason = parseInt(e.target.value);
    setSelectedSeason(newSeason);

    // If on Standings view, stay on Standings
    if (pathname === '/dashboard/playoffs') {
      router.push('/dashboard/playoffs');
      return;
    }

    // Specific logic for Dashboard view redirection
    if (pathname === '/' || pathname.startsWith('/dashboard')) {
      if (newSeason < 2025) {
        router.push('/dashboard/1');
      } else if (newSeason === 2025) {
        const currentWeek = getCurrentNFLWeek();
        if (currentWeek === 'playoffs') {
          router.push('/dashboard/playoffs');
        } else {
          router.push(`/dashboard/${currentWeek}`);
        }
      }
    }
    // Team view just updates the context, no redirect needed (Effect in page handles fetch)
  };

  return (
    <div className="w-full md:w-auto flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 sm:px-3 py-2.5 sm:py-2 shadow-sm min-h-[44px]">
      <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">Season:</span>
      <div className="relative flex-1 md:flex-initial">
        <select
          value={selectedSeason}
          onChange={handleSeasonChange}
          className="w-full appearance-none bg-transparent border-none text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-bold pr-5 sm:pr-6 focus:outline-none focus:ring-0 cursor-pointer"
        >
          {availableSeasons.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
