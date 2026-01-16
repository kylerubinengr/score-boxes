"use client";

import { PlayoffTeam } from "@/types/nfl";
import { SafeImage } from "../common/SafeImage";
import { ChevronDown, ChevronsUpDown } from "lucide-react";

export interface SortConfig {
  key: keyof PlayoffTeam;
  direction: 'asc' | 'desc';
}

interface ConferenceStandingsTableProps {
  conference: 'AFC' | 'NFC';
  teams: PlayoffTeam[];
  sortConfig: SortConfig;
  onSort: (key: keyof PlayoffTeam) => void;
}

const SortableHeader = ({
  label,
  sortKey,
  sortConfig,
  onSort,
  className = ""
}: {
  label: string;
  sortKey: keyof PlayoffTeam;
  sortConfig: SortConfig;
  onSort: (key: keyof PlayoffTeam) => void;
  className?: string;
}) => {
  const isSorted = sortConfig.key === sortKey;
  const isAsc = sortConfig.direction === 'asc';

  return (
    <th className={`px-2 sm:px-3 py-2 font-bold text-slate-500 uppercase tracking-wider text-[9px] sm:text-[10px] dark:text-slate-400 ${className}`}>
      <button onClick={() => onSort(sortKey)} className="flex items-center gap-1">
        {label}
        {isSorted ? (
          <ChevronDown className={`w-3 h-3 transition-transform ${isAsc ? 'rotate-0' : 'rotate-180'}`} />
        ) : (
          <ChevronsUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
        )}
      </button>
    </th>
  );
};

export function ConferenceStandingsTable({ conference, teams, sortConfig, onSort }: ConferenceStandingsTableProps) {
  // Helper: Format PCT to 3 decimals (e.g., .750)
  const formatPct = (pct: number): string => {
    return pct.toFixed(3);
  };

  // Helper: Render clinch indicator inline
  const ClinchIndicator = ({ status }: { status: PlayoffTeam['clinchStatus'] }) => {
    switch (status) {
      case 'CLINCHED_HOMEFIELD':
        return <span className="text-yellow-600 font-black ml-1" title="Clinched Home Field">*</span>;
      case 'CLINCHED_DIVISION':
        return <span className="text-green-600 font-black ml-1" title="Clinched Division">z</span>;
      case 'CLINCHED_PLAYOFF':
        return <span className="text-blue-600 font-black ml-1" title="Clinched Playoff">y</span>;
      case 'ELIMINATED':
        return <span className="text-slate-400 font-black ml-1" title="Eliminated">e</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <h3 className="text-2xl font-black mb-6 text-slate-800 tracking-tight uppercase flex items-center justify-between dark:text-slate-200">
        <span>{conference} Standings</span>
      </h3>

      {/* Table Container - Horizontal scroll on mobile */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg dark:border-slate-700 relative">
        {/* Scroll Indicator for Mobile */}
        <div className="md:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 dark:from-slate-900"></div>

        <table className="w-full text-xs">
          {/* Table Head */}
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="px-2 sm:px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider text-[9px] sm:text-[10px] bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                <button onClick={() => onSort('seed')} className="flex items-center gap-1">
                  RK
                  {sortConfig.key === 'seed' ? (
                    <ChevronDown className={`w-3 h-3 transition-transform ${sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'}`} />
                  ) : (
                    <ChevronsUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                  )}
                </button>
              </th>
              <SortableHeader label="Team" sortKey="abbreviation" sortConfig={sortConfig} onSort={onSort} />
              <SortableHeader label="W" sortKey="wins" sortConfig={sortConfig} onSort={onSort} className="text-center" />
              <SortableHeader label="L" sortKey="losses" sortConfig={sortConfig} onSort={onSort} className="text-center" />
              <SortableHeader label="T" sortKey="ties" sortConfig={sortConfig} onSort={onSort} className="text-center" />
              <SortableHeader label="PCT" sortKey="winPercentage" sortConfig={sortConfig} onSort={onSort} className="text-center" />
              <SortableHeader label="PF" sortKey="pointsFor" sortConfig={sortConfig} onSort={onSort} className="text-center" />
              <SortableHeader label="PA" sortKey="pointsAgainst" sortConfig={sortConfig} onSort={onSort} className="text-center" />
              <SortableHeader label="DIFF" sortKey="differential" sortConfig={sortConfig} onSort={onSort} className="text-center" />
              <SortableHeader label="STRK" sortKey="streak" sortConfig={sortConfig} onSort={onSort} className="text-center" />
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-white dark:bg-slate-900">
            {teams.map((team) => (
              <tr
                key={team.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors dark:border-slate-800 dark:hover:bg-slate-800/30"
              >
                {/* Rank - Highlighted */}
                <td className="px-2 sm:px-3 py-2 sm:py-3 text-center bg-slate-100 dark:bg-slate-800">
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">{team.seed}</span>
                </td>

                {/* Team Name/Logo */}
                <td className="px-2 sm:px-3 py-2 sm:py-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <SafeImage
                      src={team.logoUrl}
                      alt={team.abbreviation}
                      width={20}
                      height={20}
                      className="object-contain sm:w-6 sm:h-6"
                      initials={team.abbreviation}
                    />
                    <div className="flex items-center">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{team.abbreviation}</span>
                      <ClinchIndicator status={team.clinchStatus} />
                    </div>
                  </div>
                </td>

                {/* W */}
                <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                  <span className="font-mono text-xs sm:text-sm text-slate-700 dark:text-slate-300">{team.wins}</span>
                </td>

                {/* L */}
                <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                  <span className="font-mono text-xs sm:text-sm text-slate-700 dark:text-slate-300">{team.losses}</span>
                </td>

                {/* T */}
                <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                  <span className="font-mono text-xs sm:text-sm text-slate-500 dark:text-slate-400">{team.ties}</span>
                </td>

                {/* PCT */}
                <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                  <span className="font-mono text-xs sm:text-sm text-slate-700 dark:text-slate-300">{formatPct(team.winPercentage)}</span>
                </td>

                {/* PF */}
                <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                  <span className="font-mono text-xs sm:text-sm text-slate-700 dark:text-slate-300">{team.pointsFor}</span>
                </td>

                {/* PA */}
                <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                  <span className="font-mono text-xs sm:text-sm text-slate-700 dark:text-slate-300">{team.pointsAgainst}</span>
                </td>

                {/* DIFF */}
                <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                  <span className={`font-mono text-xs sm:text-sm ${
                    team.differential > 0 ? 'text-green-600 dark:text-green-400' :
                    team.differential < 0 ? 'text-red-600 dark:text-red-400' :
                    'text-slate-500 dark:text-slate-400'
                  }`}>
                    {team.differential > 0 ? `+${team.differential}` : team.differential}
                  </span>
                </td>

                {/* STRK */}
                <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                  <span className={`font-mono text-xs ${
                    team.streak.startsWith('W') ? 'text-green-600 dark:text-green-400' :
                    team.streak.startsWith('L') ? 'text-red-600 dark:text-red-400' :
                    'text-slate-500 dark:text-slate-400'
                  }`}>
                    {team.streak}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

