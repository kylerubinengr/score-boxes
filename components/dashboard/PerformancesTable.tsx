"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { PerformanceRow, PlayerRole } from "@/types/performances";

type SortField =
  | "totalEpa"
  | "epaPerPlay"
  | "plays"
  | "week"
  | "passingYards"
  | "passTDs"
  | "interceptions"
  | "carries"
  | "rushingYards"
  | "rushTDs"
  | "targets"
  | "receptions"
  | "receivingYards"
  | "receivingTDs";

type SortDirection = "asc" | "desc";

const ROLE_COLORS: Record<PlayerRole, string> = {
  QB: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  RB: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  WR: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  TE: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
};

function formatNum(val: number | null, decimals = 2): string {
  if (val === null || isNaN(val)) return "–";
  return val.toFixed(decimals);
}

function displayStat(val: number | undefined): string {
  return val !== undefined ? String(val) : "–";
}

/** Derive "@ OPP" or "v. OPP" from gameId (format: SEASON_WEEK_AWAY_HOME) and team */
function formatOpponent(gameId: string, team: string, opponent: string): string {
  const parts = gameId.split("_");
  const awayTeam = parts[2] || "";
  const prefix = team === awayTeam ? "@" : "v.";
  return `${prefix} ${opponent}`;
}

interface PerformancesTableProps {
  performances: PerformanceRow[];
}

export function PerformancesTable({ performances }: PerformancesTableProps) {
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<PlayerRole | "ALL">("ALL");
  const [sortField, setSortField] = useState<SortField>("totalEpa");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return "";
    return sortDir === "desc" ? " ▼" : " ▲";
  };

  const handleRowClick = (row: PerformanceRow) => {
    if (row.espnGameId) {
      router.push(`/game/${row.espnGameId}`);
    }
  };

  const filtered = useMemo(() => {
    let rows = performances;
    if (roleFilter !== "ALL") {
      rows = rows.filter((r) => r.role === roleFilter);
    }

    rows = [...rows].sort((a, b) => {
      const av = a[sortField] ?? -Infinity;
      const bv = b[sortField] ?? -Infinity;
      return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number);
    });

    return rows.slice(0, 50);
  }, [performances, roleFilter, sortField, sortDir]);

  const roles: (PlayerRole | "ALL")[] = ["ALL", "QB", "RB", "WR", "TE"];

  // Shading classes
  const shaded = "bg-slate-100/80 dark:bg-slate-800/50";

  const thBase = "px-2 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider";
  const thSortable = `${thBase} cursor-pointer hover:text-slate-700 dark:hover:text-slate-200`;
  const tdBase = "px-2 py-2.5";
  const tdStatBase = `${tdBase} text-right text-slate-600 dark:text-slate-300 font-mono text-xs`;

  return (
    <div>
      {/* Role filter pills */}
      <div className="flex gap-2 mb-4">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
              ${
                roleFilter === role
                  ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }
            `}
          >
            {role === "ALL" ? "All" : role}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm table-fixed">
          <colgroup><col className="w-10" /><col className="w-32" /><col className="w-12" /><col className="w-12" /><col className="w-10" /><col className="w-16" /><col className="w-16" /><col className="w-16" /><col className="w-12" /><col className="w-14" /><col className="w-12" /><col className="w-10" /><col className="w-10" /><col className="w-10" /><col className="w-12" /><col className="w-10" /><col className="w-10" /><col className="w-10" /><col className="w-12" /><col className="w-10" /></colgroup>
          <thead>
            {/* Grouped category header row */}
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              {/* Player info group — shaded */}
              <th colSpan={6} className={`px-2 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 text-center border-b border-slate-200 dark:border-slate-700 ${shaded}`}>
                &nbsp;
              </th>
              {/* EPA group — unshaded */}
              <th colSpan={3} className="px-2 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 text-center border-b border-slate-200 dark:border-slate-700">
                EPA
              </th>
              {/* Passing group — shaded */}
              <th colSpan={4} className={`px-2 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 text-center border-b border-slate-200 dark:border-slate-700 ${shaded}`}>
                Passing
              </th>
              {/* Rushing group — unshaded */}
              <th colSpan={3} className="px-2 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 text-center border-b border-slate-200 dark:border-slate-700">
                Rushing
              </th>
              {/* Receiving group — shaded */}
              <th colSpan={4} className={`px-2 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 text-center border-b border-slate-200 dark:border-slate-700 ${shaded}`}>
                Receiving
              </th>
            </tr>
            {/* Column headers */}
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              {/* Player info — shaded */}
              <th className={`${thBase} text-left ${shaded}`}>#</th>
              <th className={`${thBase} text-left ${shaded}`}>Player</th>
              <th className={`${thBase} text-center ${shaded}`}>Pos</th>
              <th className={`${thBase} text-left ${shaded}`}>Team</th>
              <th className={`${thSortable} text-center ${shaded}`} onClick={() => handleSort("week")}>
                Wk{sortIndicator("week")}
              </th>
              <th className={`${thBase} text-left ${shaded}`}>Opp</th>
              {/* EPA — unshaded */}
              <th className={`${thSortable} text-right`} onClick={() => handleSort("totalEpa")}>
                Total{sortIndicator("totalEpa")}
              </th>
              <th className={`${thSortable} text-right`} onClick={() => handleSort("epaPerPlay")}>
                /Play{sortIndicator("epaPerPlay")}
              </th>
              <th className={`${thSortable} text-right`} onClick={() => handleSort("plays")}>
                Plys{sortIndicator("plays")}
              </th>
              {/* Passing — shaded, sortable */}
              <th className={`${thBase} text-right ${shaded}`}>C/ATT</th>
              <th className={`${thSortable} text-right ${shaded}`} onClick={() => handleSort("passingYards")}>
                YDS{sortIndicator("passingYards")}
              </th>
              <th className={`${thSortable} text-right ${shaded}`} onClick={() => handleSort("passTDs")}>
                TD{sortIndicator("passTDs")}
              </th>
              <th className={`${thSortable} text-right ${shaded}`} onClick={() => handleSort("interceptions")}>
                INT{sortIndicator("interceptions")}
              </th>
              {/* Rushing — unshaded, sortable */}
              <th className={`${thSortable} text-right`} onClick={() => handleSort("carries")}>
                CAR{sortIndicator("carries")}
              </th>
              <th className={`${thSortable} text-right`} onClick={() => handleSort("rushingYards")}>
                YDS{sortIndicator("rushingYards")}
              </th>
              <th className={`${thSortable} text-right`} onClick={() => handleSort("rushTDs")}>
                TD{sortIndicator("rushTDs")}
              </th>
              {/* Receiving — shaded, sortable */}
              <th className={`${thSortable} text-right ${shaded}`} onClick={() => handleSort("targets")}>
                TGT{sortIndicator("targets")}
              </th>
              <th className={`${thSortable} text-right ${shaded}`} onClick={() => handleSort("receptions")}>
                REC{sortIndicator("receptions")}
              </th>
              <th className={`${thSortable} text-right ${shaded}`} onClick={() => handleSort("receivingYards")}>
                YDS{sortIndicator("receivingYards")}
              </th>
              <th className={`${thSortable} text-right ${shaded}`} onClick={() => handleSort("receivingTDs")}>
                TD{sortIndicator("receivingTDs")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((row, idx) => (
              <tr
                key={`${row.gameId}-${row.playerName}-${row.role}`}
                onClick={() => handleRowClick(row)}
                className={`hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-colors ${row.espnGameId ? "cursor-pointer" : ""}`}
              >
                {/* Player info — shaded */}
                <td className={`${tdBase} text-slate-400 dark:text-slate-500 font-mono text-xs ${shaded}`}>
                  {idx + 1}
                </td>
                <td className={`${tdBase} font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap truncate ${shaded}`}>
                  {row.playerName}
                </td>
                <td className={`${tdBase} text-center ${shaded}`}>
                  <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[row.role]}`}>
                    {row.role}
                  </span>
                </td>
                <td className={`${tdBase} text-slate-700 dark:text-slate-300 font-mono text-xs ${shaded}`}>
                  {row.team}
                </td>
                <td className={`${tdBase} text-center text-slate-600 dark:text-slate-400 ${shaded}`}>
                  {row.week}
                </td>
                <td className={`${tdBase} text-slate-700 dark:text-slate-300 font-mono text-xs whitespace-nowrap ${shaded}`}>
                  {formatOpponent(row.gameId, row.team, row.opponent)}
                </td>
                {/* EPA — unshaded */}
                <td className={`${tdBase} text-right font-mono font-semibold`}>
                  {formatNum(row.totalEpa, 1)}
                </td>
                <td className={`${tdBase} text-right font-mono`}>
                  {formatNum(row.epaPerPlay)}
                </td>
                <td className={`${tdBase} text-right text-slate-600 dark:text-slate-400`}>
                  {row.plays}
                </td>
                {/* Passing stats — shaded */}
                <td className={`${tdStatBase} ${shaded}`}>
                  {row.completions !== undefined && row.passAttempts !== undefined
                    ? `${row.completions}/${row.passAttempts}` : "–"}
                </td>
                <td className={`${tdStatBase} ${shaded}`}>
                  {displayStat(row.passingYards)}
                </td>
                <td className={`${tdStatBase} ${shaded}`}>
                  {displayStat(row.passTDs)}
                </td>
                <td className={`${tdStatBase} ${shaded}`}>
                  {displayStat(row.interceptions)}
                </td>
                {/* Rushing stats — unshaded */}
                <td className={tdStatBase}>
                  {displayStat(row.carries)}
                </td>
                <td className={tdStatBase}>
                  {displayStat(row.rushingYards)}
                </td>
                <td className={tdStatBase}>
                  {displayStat(row.rushTDs)}
                </td>
                {/* Receiving stats — shaded */}
                <td className={`${tdStatBase} ${shaded}`}>
                  {displayStat(row.targets)}
                </td>
                <td className={`${tdStatBase} ${shaded}`}>
                  {displayStat(row.receptions)}
                </td>
                <td className={`${tdStatBase} ${shaded}`}>
                  {displayStat(row.receivingYards)}
                </td>
                <td className={`${tdStatBase} ${shaded}`}>
                  {displayStat(row.receivingTDs)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={20}
                  className="px-3 py-8 text-center text-slate-400 dark:text-slate-500"
                >
                  No performances found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        Showing {filtered.length} performances (min 5 plays, garbage time excluded). Click a row to view the game.
      </p>
    </div>
  );
}
