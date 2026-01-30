"use client";

import React from "react";
import type { AdvancedGameStats, AdvancedTeamStats, AdvancedTeamSplit, AdvancedPlayerStat } from "@/types/advancedStats";
import type { Team } from "@/types/nfl";
import { getEpaColor, getSuccessRateColor } from "@/lib/epaColors";
import { SafeImage } from "@/components/common/SafeImage";

const TEAM_SPLIT_ROWS: { key: keyof AdvancedTeamStats; label: string; indent?: boolean }[] = [
  { key: "allPlays", label: "All plays" },
  { key: "rush", label: "Rush", indent: true },
  { key: "pass", label: "Pass", indent: true },
  { key: "earlyDowns", label: "Early downs\n(1st & 2nd)" },
  { key: "earlyRush", label: "Early rush", indent: true },
  { key: "earlyPass", label: "Early pass", indent: true },
  { key: "lateDowns", label: "Late downs\n(3rd & 4th)" },
  { key: "lateRush", label: "Late rush", indent: true },
  { key: "latePass", label: "Late pass", indent: true },
];

function formatEpa(value: number | null): string {
  if (value === null || isNaN(value)) return "—";
  return value.toFixed(2);
}

function formatPct(value: number | null): string {
  if (value === null || isNaN(value)) return "—";
  return Math.round(value * 100).toString();
}

function formatTotalEpa(value: number | null): string {
  if (value === null || isNaN(value)) return "—";
  return value.toFixed(1);
}

function ColoredCell({ value, colorFn, formatted, className = "" }: {
  value: number | null;
  colorFn: (v: number | null) => string;
  formatted: string;
  className?: string;
}) {
  const bg = colorFn(value);
  return (
    <td
      className={`px-2 py-1.5 text-right text-[11px] font-mono font-semibold ${className}`}
      style={{ backgroundColor: bg === "transparent" ? undefined : bg }}
    >
      <span className={bg !== "transparent" ? "text-slate-800" : "text-slate-400 dark:text-slate-500"}>
        {formatted}
      </span>
    </td>
  );
}

function TeamStatsTable({ stats, team }: { stats: AdvancedTeamStats; team: Team }) {
  return (
    <div className="border border-slate-100 rounded-lg overflow-hidden dark:border-slate-800">
      <div className="bg-slate-50 p-2 border-b border-slate-100 flex items-center gap-2 dark:bg-slate-800/50 dark:border-slate-800">
        <SafeImage src={team.logoUrl} alt="" width={20} height={20} />
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
          {team.abbreviation} Team Stats
        </h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50/50 dark:bg-slate-800/30">
            <tr>
              <th className="p-2 text-left font-bold text-slate-400 dark:text-slate-500 w-36"></th>
              <th className="p-2 text-right font-bold text-slate-400 dark:text-slate-500">EPA/play</th>
              <th className="p-2 text-right font-bold text-slate-400 dark:text-slate-500">SR</th>
              <th className="p-2 text-right font-bold text-slate-400 dark:text-slate-500">1st%</th>
              <th className="p-2 text-right font-bold text-slate-400 dark:text-slate-500">Plays</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {TEAM_SPLIT_ROWS.map(({ key, label, indent }) => {
              const split: AdvancedTeamSplit = stats[key];
              return (
                <tr key={key} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/30">
                  <td className={`px-3 py-1.5 text-[11px] font-bold text-slate-700 whitespace-pre-line dark:text-slate-300 ${indent ? "pl-6 italic" : ""}`}>
                    {label}
                  </td>
                  <ColoredCell value={split.epaPerPlay} colorFn={getEpaColor} formatted={formatEpa(split.epaPerPlay)} />
                  <ColoredCell value={split.successRate} colorFn={getSuccessRateColor} formatted={formatPct(split.successRate)} />
                  <ColoredCell value={split.firstDownPct} colorFn={getSuccessRateColor} formatted={formatPct(split.firstDownPct)} />
                  <td className="px-2 py-1.5 text-right text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {split.plays}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayerStatsTable({ title, players }: { title: string; players: AdvancedPlayerStat[] }) {
  if (!players || players.length === 0) return null;

  return (
    <div className="border border-slate-100 rounded-lg overflow-hidden dark:border-slate-800">
      <div className="bg-slate-50 p-2 border-b border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">{title}</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50/50 dark:bg-slate-800/30">
            <tr>
              <th className="p-2 text-left font-bold text-slate-400 dark:text-slate-500">Player</th>
              <th className="p-2 text-right font-bold text-slate-400 dark:text-slate-500">EPA/play</th>
              <th className="p-2 text-right font-bold text-slate-400 dark:text-slate-500">EPA</th>
              <th className="p-2 text-right font-bold text-slate-400 dark:text-slate-500">SR</th>
              <th className="p-2 text-right font-bold text-slate-400 dark:text-slate-500">1st%</th>
              <th className="p-2 text-right font-bold text-slate-400 dark:text-slate-500">Plays</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {players.map((player, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/30">
                <td className="px-3 py-1.5 text-[11px] font-bold text-slate-700 whitespace-nowrap dark:text-slate-300">
                  {player.name}
                </td>
                <ColoredCell value={player.epaPerPlay} colorFn={(v) => getEpaColor(v, 0.5)} formatted={formatEpa(player.epaPerPlay)} />
                <ColoredCell value={player.totalEpa} colorFn={(v) => getEpaColor(v, 5)} formatted={formatTotalEpa(player.totalEpa)} />
                <ColoredCell value={player.successRate} colorFn={getSuccessRateColor} formatted={formatPct(player.successRate)} />
                <ColoredCell value={player.firstDownPct} colorFn={getSuccessRateColor} formatted={formatPct(player.firstDownPct)} />
                <td className="px-2 py-1.5 text-right text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {player.plays}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface AdvancedStatsViewProps {
  stats: AdvancedGameStats;
  homeTeam: Team;
  awayTeam: Team;
}

export function AdvancedStatsView({ stats, homeTeam, awayTeam }: AdvancedStatsViewProps) {
  return (
    <div className="space-y-8">
      {/* Team Stats - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamStatsTable stats={stats.teamStats.away} team={awayTeam} />
        <TeamStatsTable stats={stats.teamStats.home} team={homeTeam} />
      </div>

      {/* Player Stats - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Away Players */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
            <SafeImage src={awayTeam.logoUrl} alt="" width={20} height={20} />
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">
              {awayTeam.abbreviation} Players
            </h3>
          </div>
          <PlayerStatsTable title="DROPBACKS" players={stats.playerStats.away.dropbacks} />
          <PlayerStatsTable title="RUSH ATTEMPTS" players={stats.playerStats.away.rushAttempts} />
          <PlayerStatsTable title="PASS TARGETS" players={stats.playerStats.away.passTargets} />
        </div>

        {/* Home Players */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
            <SafeImage src={homeTeam.logoUrl} alt="" width={20} height={20} />
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">
              {homeTeam.abbreviation} Players
            </h3>
          </div>
          <PlayerStatsTable title="DROPBACKS" players={stats.playerStats.home.dropbacks} />
          <PlayerStatsTable title="RUSH ATTEMPTS" players={stats.playerStats.home.rushAttempts} />
          <PlayerStatsTable title="PASS TARGETS" players={stats.playerStats.home.passTargets} />
        </div>
      </div>
    </div>
  );
}
