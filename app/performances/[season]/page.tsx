"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { SeasonSelector } from "@/components/dashboard/SeasonSelector";
import { ViewToggle } from "@/components/dashboard/ViewToggle";
import { PerformancesTable } from "@/components/dashboard/PerformancesTable";
import { TabLimitWarning } from "@/components/ui/TabLimitWarning";
import { useSeason } from "@/context/SeasonContext";
import { buildPerformancesUrl } from "@/lib/routes";
import type { PerformanceRow } from "@/types/performances";

export default function PerformancesPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const seasonParam = parseInt(params.season as string, 10);
  const { selectedSeason, setSelectedSeason, setViewMode } = useSeason();

  const [performances, setPerformances] = useState<PerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync season from URL to context
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
      router.push(buildPerformancesUrl(2025));
    }
  }, [seasonParam, router]);

  // Update view mode state
  useEffect(() => {
    setViewMode({ type: "PERFORMANCES", href: pathname });
  }, [pathname, setViewMode]);

  // Fetch performances using URL season param
  useEffect(() => {
    if (isNaN(seasonParam) || seasonParam < 2020 || seasonParam > 2025) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/season-performances?season=${seasonParam}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setPerformances(data.performances ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [seasonParam]);

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

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          Top Performances
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Top 50 individual game performances of the {seasonParam} season by total EPA
        </p>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Loading season data&hellip; This may take 15-30 seconds on first load.
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-red-500 dark:text-red-400">
              Failed to load performances: {error}
            </p>
          </div>
        )}

        {!loading && !error && (
          <PerformancesTable performances={performances} />
        )}
      </div>
      <TabLimitWarning />
    </main>
  );
}
