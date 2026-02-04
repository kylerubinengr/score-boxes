"use client";

import { useState, useEffect, useMemo } from "react";
import { NFL_TEAMS } from "@/constants/teams";

type RankedStat = {
  value: string;
  rank?: number;
};

type TeamStats = {
  record: string;
  homeRecord: string;
  awayRecord: string;
  divRecord: string;
  streak: string;
  pointsFor: RankedStat;
  pointsAgainst: RankedStat;
  diff: RankedStat;
  offEpa: RankedStat;
  defEpa: RankedStat;
  offSuccess: RankedStat;
  defSuccess: RankedStat;
  offTotalYPG: RankedStat;
  offPassYPG: RankedStat;
  offRushYPG: RankedStat;
  defTotalYPG: RankedStat;
  defPassYPG: RankedStat;
  defRushYPG: RankedStat;
  offPassEpa: RankedStat;
  offRushEpa: RankedStat;
  offPassSuccess: RankedStat;
  offRushSuccess: RankedStat;
  defPassEpa: RankedStat;
  defRushEpa: RankedStat;
  defPassSuccess: RankedStat;
  defRushSuccess: RankedStat;
  // Situational stats
  off3rdDownConv: RankedStat;
  def3rdDownConv: RankedStat;
  offRedzoneTD: RankedStat;
  defRedzoneTD: RankedStat;
};

const getOrdinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const RankBadge = ({ rank }: { rank?: number }) => {
  if (!rank) return null;

  let colorClass =
    "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
  if (rank <= 5)
    colorClass =
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
  else if (rank >= 28)
    colorClass =
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";

  return (
    <span
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${colorClass} inline-block`}
    >
      {getOrdinal(rank)}
    </span>
  );
};

function SummaryCard({
  label,
  value,
  rank,
  primaryColor,
  darkAccentColor,
}: {
  label: string;
  value: string;
  rank?: number;
  primaryColor: string;
  darkAccentColor: string;
}) {
  return (
    <div
      className="text-center py-1.5 px-2 rounded-lg"
      style={{
        backgroundColor: `color-mix(in srgb, ${primaryColor} 6%, transparent)`,
      }}
    >
      <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
      </div>
      <div className="text-base font-bold">
        <span className="dark:hidden" style={{ color: primaryColor }}>{value}</span>
        <span className="hidden dark:inline" style={{ color: darkAccentColor }}>{value}</span>
      </div>
      {rank && <RankBadge rank={rank} />}
    </div>
  );
}

function StatItem({
  label,
  stat,
}: {
  label: string;
  stat: RankedStat;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {stat.value}
        </span>
        <RankBadge rank={stat.rank} />
      </div>
    </div>
  );
}

function SectionHeader({
  label,
  primaryColor,
  darkAccentColor,
}: {
  label: string;
  primaryColor: string;
  darkAccentColor: string;
}) {
  return (
    <h3
      className="text-xs font-bold uppercase tracking-wider mb-2"
      style={{ color: primaryColor }}
    >
      <span className="dark:hidden">{label}</span>
      <span className="hidden dark:inline" style={{ color: darkAccentColor }}>{label}</span>
    </h3>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 mb-6 animate-pulse">
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-t-xl mb-4" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded" />
        ))}
      </div>
    </div>
  );
}

function useTeamColors(teamAbbr: string) {
  return useMemo(() => {
    const team = NFL_TEAMS[teamAbbr.toUpperCase()];
    if (!team) return { primary: "#64748b", darkAccent: "#94a3b8", secondary: "#94a3b8" };
    return {
      primary: team.branding.colors.primary,
      darkAccent: team.branding.colors.darkAccent,
      secondary: team.branding.secondary,
    };
  }, [teamAbbr]);
}

export function TeamStatsTable({ teamAbbr, season }: { teamAbbr: string; season?: number }) {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        console.error("Team stats fetch error:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamAbbr, season]);

  if (isLoading) return <LoadingSkeleton />;
  if (!stats) return null;

  return (
    <div
      className="rounded-xl mb-6 overflow-hidden bg-white dark:bg-slate-900"
      style={{
        borderWidth: '1.5px',
        borderStyle: 'solid',
        borderColor: `color-mix(in srgb, ${colors.primary} 30%, #e2e8f0)`,
      }}
    >
      {/* Team color accent stripe */}
      <div
        className="h-2"
        style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.darkAccent})` }}
      />

      {/* Row 1: Record & Context */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <SectionHeader label="Record" primaryColor={colors.primary} darkAccentColor={colors.darkAccent} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <SummaryCard label="Overall" value={stats.record} primaryColor={colors.primary} darkAccentColor={colors.darkAccent} />
          <SummaryCard label="Home" value={stats.homeRecord} primaryColor={colors.primary} darkAccentColor={colors.darkAccent} />
          <SummaryCard label="Away" value={stats.awayRecord} primaryColor={colors.primary} darkAccentColor={colors.darkAccent} />
          <SummaryCard label="Division" value={stats.divRecord} primaryColor={colors.primary} darkAccentColor={colors.darkAccent} />
        </div>
      </div>

      {/* Two-column: Offense | Defense */}
      <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800">
        {/* Offense Column */}
        <div className="px-3 pt-3 pb-2">
          <SectionHeader label="Offense" primaryColor={colors.primary} darkAccentColor={colors.darkAccent} />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <StatItem label="Points For" stat={stats.pointsFor} />
            <StatItem label="Total YPG" stat={stats.offTotalYPG} />
            <StatItem label="Pass YPG" stat={stats.offPassYPG} />
            <StatItem label="Rush YPG" stat={stats.offRushYPG} />
          </div>
          {/* Efficiency sub-header */}
          <h4
            className="text-xs font-bold uppercase tracking-wider mt-2 mb-2 pt-2 border-t border-slate-100 dark:border-slate-800"
            style={{ color: colors.primary }}
          >
            <span className="dark:hidden">Efficiency</span>
            <span className="hidden dark:inline" style={{ color: colors.darkAccent }}>Efficiency</span>
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <StatItem label="EPA / Play" stat={stats.offEpa} />
            <StatItem label="Success Rate" stat={stats.offSuccess} />
            <StatItem label="Pass EPA" stat={stats.offPassEpa} />
            <StatItem label="Pass Success" stat={stats.offPassSuccess} />
            <StatItem label="Rush EPA" stat={stats.offRushEpa} />
            <StatItem label="Rush Success" stat={stats.offRushSuccess} />
          </div>
          {/* Situational sub-header */}
          <h4
            className="text-xs font-bold uppercase tracking-wider mt-2 mb-2 pt-2 border-t border-slate-100 dark:border-slate-800"
            style={{ color: colors.primary }}
          >
            <span className="dark:hidden">Situational</span>
            <span className="hidden dark:inline" style={{ color: colors.darkAccent }}>Situational</span>
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <StatItem label="3rd Down Conv" stat={stats.off3rdDownConv} />
            <StatItem label="Red Zone TD%" stat={stats.offRedzoneTD} />
          </div>
        </div>

        {/* Defense Column */}
        <div className="px-3 pt-3 pb-2">
          <SectionHeader label="Defense" primaryColor={colors.primary} darkAccentColor={colors.darkAccent} />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <StatItem label="Points Against" stat={stats.pointsAgainst} />
            <StatItem label="Total YPG" stat={stats.defTotalYPG} />
            <StatItem label="Pass YPG" stat={stats.defPassYPG} />
            <StatItem label="Rush YPG" stat={stats.defRushYPG} />
          </div>
          {/* Efficiency sub-header */}
          <h4
            className="text-xs font-bold uppercase tracking-wider mt-2 mb-2 pt-2 border-t border-slate-100 dark:border-slate-800"
            style={{ color: colors.primary }}
          >
            <span className="dark:hidden">Efficiency</span>
            <span className="hidden dark:inline" style={{ color: colors.darkAccent }}>Efficiency</span>
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <StatItem label="EPA / Play" stat={stats.defEpa} />
            <StatItem label="Success Rate" stat={stats.defSuccess} />
            <StatItem label="Pass EPA" stat={stats.defPassEpa} />
            <StatItem label="Pass Success" stat={stats.defPassSuccess} />
            <StatItem label="Rush EPA" stat={stats.defRushEpa} />
            <StatItem label="Rush Success" stat={stats.defRushSuccess} />
          </div>
          {/* Situational sub-header */}
          <h4
            className="text-xs font-bold uppercase tracking-wider mt-2 mb-2 pt-2 border-t border-slate-100 dark:border-slate-800"
            style={{ color: colors.primary }}
          >
            <span className="dark:hidden">Situational</span>
            <span className="hidden dark:inline" style={{ color: colors.darkAccent }}>Situational</span>
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            <StatItem label="3rd Down Def" stat={stats.def3rdDownConv} />
            <StatItem label="Red Zone Def" stat={stats.defRedzoneTD} />
          </div>
        </div>
      </div>
    </div>
  );
}
