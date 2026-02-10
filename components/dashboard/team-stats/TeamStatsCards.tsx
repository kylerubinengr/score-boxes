"use client";

import { useState, useEffect, useMemo } from "react";
import { NFL_TEAMS } from "@/constants/teams";
import type { AdvancedTeamStats } from "@/services/matchupService";
import type { LeagueContext } from "@/types/teamStats";
import { RecordSection } from "./RecordSection";
import { StatSectionCard } from "./StatSectionCard";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { STAT_SECTIONS } from "./constants";

function useTeamColors(teamAbbr: string) {
  return useMemo(() => {
    const team = NFL_TEAMS[teamAbbr.toUpperCase()];
    if (!team)
      return {
        primary: "#64748b",
        darkAccent: "#94a3b8",
        secondary: "#94a3b8",
      };
    return {
      primary: team.branding.colors.primary,
      darkAccent: team.branding.colors.darkAccent,
      secondary: team.branding.secondary,
    };
  }, [teamAbbr]);
}

export function TeamStatsCards({
  teamAbbr,
  season,
}: {
  teamAbbr: string;
  season?: number;
}) {
  const [stats, setStats] = useState<AdvancedTeamStats | null>(null);
  const [leagueContext, setLeagueContext] = useState<LeagueContext>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colors = useTeamColors(teamAbbr);

  useEffect(() => {
    if (!teamAbbr) return;

    let cancelled = false;
    setIsLoading(true);

    const params = new URLSearchParams({ team: teamAbbr });
    if (season) params.set("season", season.toString());

    fetch(`/api/team-stats?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch team stats");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setStats(data.stats);
          setLeagueContext(data.leagueContext || {});
        }
      })
      .catch((err) => {
        console.error("Team stats fetch error:", err);
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamAbbr, season]);

  if (isLoading) return <div className="p-8 bg-blue-100 text-blue-900 text-xl font-bold rounded-lg mb-6 border-4 border-blue-500">LOADING TEAM STATS...</div>;
  if (error) return <div className="p-8 bg-red-100 text-red-900 text-xl font-bold rounded-lg mb-6 border-4 border-red-500">ERROR: {error}</div>;
  if (!stats) return <div className="p-8 bg-yellow-100 text-yellow-900 text-xl font-bold rounded-lg mb-6 border-4 border-yellow-500">NO STATS DATA</div>;

  return (
    <div className="space-y-6 mb-6">
      {/* Record section */}
      <RecordSection
        record={stats.record}
        homeRecord={stats.homeRecord}
        awayRecord={stats.awayRecord}
        divRecord={stats.divRecord}
        primaryColor={colors.primary}
        darkAccentColor={colors.darkAccent}
      />

      {/* Stat section cards in 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {STAT_SECTIONS.map((section) => (
          <StatSectionCard
            key={section.title}
            config={section}
            stats={stats}
            leagueContext={leagueContext}
            primaryColor={colors.primary}
            darkAccentColor={colors.darkAccent}
          />
        ))}
      </div>
    </div>
  );
}
