"use client";

import { SeasonSelector } from "@/components/dashboard/SeasonSelector";
import { ViewToggle } from "@/components/dashboard/ViewToggle";
import { PlayoffsTab } from "@/components/dashboard/PlayoffsTab";
import { TabLimitWarning } from "@/components/ui/TabLimitWarning";
import { useSeason } from "@/context/SeasonContext";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PlayoffsPage() {
  const { setViewMode } = useSeason();
  const pathname = usePathname();

  // Update view mode state
  useEffect(() => {
    setViewMode({ type: 'WEEK', href: pathname });
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
