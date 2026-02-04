"use client";

import { useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { SeasonSelector } from "@/components/dashboard/SeasonSelector";
import { ViewToggle } from "@/components/dashboard/ViewToggle";
import { PlayoffsTab } from "@/components/dashboard/PlayoffsTab";
import { TabLimitWarning } from "@/components/ui/TabLimitWarning";
import { useSeason } from "@/context/SeasonContext";
import { buildStandingsUrl } from "@/lib/routes";

export default function StandingsPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const seasonParam = parseInt(params.season as string, 10);
  const { selectedSeason, setSelectedSeason, setViewMode } = useSeason();

  // Sync season from URL to context (only when URL param changes)
  useEffect(() => {
    if (!isNaN(seasonParam) && seasonParam >= 2020 && seasonParam <= 2025) {
      setSelectedSeason(seasonParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonParam]);

  // Validate season param
  useEffect(() => {
    if (isNaN(seasonParam) || seasonParam < 2020 || seasonParam > 2025) {
      router.push(buildStandingsUrl(2025));
    }
  }, [seasonParam, router]);

  // Update view mode state
  useEffect(() => {
    setViewMode({ type: 'STANDINGS', href: pathname });
  }, [pathname, setViewMode]);

  return (
    <main className="bg-slate-50 dark:bg-slate-950 min-h-screen pt-2 pb-8 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              Score Boxes
            </h1>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
            <SeasonSelector />
            <ViewToggle />
          </div>
        </div>

        <PlayoffsTab />
      </div>
      <TabLimitWarning />
    </main>
  );
}
