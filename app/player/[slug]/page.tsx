"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSeason } from "@/context/SeasonContext";
import { getPlayerBySlug } from "@/services/playerService";
import { PlayerDetail, PlayerGameStats } from "@/types/nfl";
import { NFL_TEAMS } from "@/constants/teams";
import Image from "next/image";
import { Trophy, TrendingUp, Loader2 } from "lucide-react";

// ── Position-aware stat helpers ──────────────────────────────────────

function getPrimaryStatLabel(position: string): string {
  switch (position) {
    case "QB":
      return "Passing Yards";
    case "RB":
    case "FB":
      return "Rushing Yards";
    case "WR":
    case "TE":
      return "Receiving Yards";
    default:
      return "Yards";
  }
}

function getTop3Games(games: PlayerGameStats[]): PlayerGameStats[] {
  return [...games]
    .sort((a, b) => (b.totalEpa ?? -Infinity) - (a.totalEpa ?? -Infinity))
    .slice(0, 3);
}

// ── EPA color helper ─────────────────────────────────────────────────

function epaColor(epa: number | undefined): string {
  if (epa === undefined) return "text-slate-500 dark:text-slate-400";
  if (epa >= 10) return "text-emerald-600 dark:text-emerald-400";
  if (epa >= 5) return "text-green-600 dark:text-green-400";
  if (epa > 0) return "text-green-500 dark:text-green-400";
  if (epa > -5) return "text-red-500 dark:text-red-400";
  return "text-red-600 dark:text-red-400";
}

function formatEpa(epa: number | undefined): string {
  if (epa === undefined) return "-";
  const sign = epa > 0 ? "+" : "";
  return `${sign}${epa.toFixed(1)}`;
}

// ── Stat card component ──────────────────────────────────────────────

function StatCard({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
      <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
        {value}
      </div>
      <div className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
        {label}
      </div>
      {subtext && (
        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {subtext}
        </div>
      )}
    </div>
  );
}

// ── Top game card ────────────────────────────────────────────────────

function TopGameCard({
  game,
  rank,
  position,
}: {
  game: PlayerGameStats;
  rank: number;
  position: string;
}) {
  const medalColors = [
    "from-yellow-400 to-amber-500",
    "from-slate-300 to-slate-400",
    "from-amber-600 to-amber-700",
  ];

  // Build secondary stats display
  const secondaryStats: string[] = [];
  if (position === "QB") {
    secondaryStats.push(`${game.completions}/${game.attempts}`);
    secondaryStats.push(`${game.passingYards} yds`);
    if (game.passingTds > 0) secondaryStats.push(`${game.passingTds} TD`);
    if (game.interceptions > 0) secondaryStats.push(`${game.interceptions} INT`);
    if (game.rushingYards > 0) secondaryStats.push(`${game.rushingYards} rush yds`);
    if (game.rushingTds > 0) secondaryStats.push(`${game.rushingTds} rush TD`);
  } else if (position === "RB" || position === "FB") {
    if (game.carries > 0) secondaryStats.push(`${game.carries} car`);
    secondaryStats.push(`${game.rushingYards} rush yds`);
    if (game.rushingTds > 0) secondaryStats.push(`${game.rushingTds} rush TD`);
    if (game.receptions > 0) secondaryStats.push(`${game.receptions} rec`);
    if (game.receivingYards > 0) secondaryStats.push(`${game.receivingYards} rec yds`);
    if (game.receivingTds > 0) secondaryStats.push(`${game.receivingTds} rec TD`);
  } else {
    if (game.receptions > 0) secondaryStats.push(`${game.receptions} rec`);
    secondaryStats.push(`${game.receivingYards} rec yds`);
    if (game.receivingTds > 0) secondaryStats.push(`${game.receivingTds} TD`);
    if (game.targets > 0) secondaryStats.push(`${game.targets} tgt`);
    if (game.rushingYards > 0) secondaryStats.push(`${game.rushingYards} rush yds`);
    if (game.rushingTds > 0) secondaryStats.push(`${game.rushingTds} rush TD`);
  }

  const oppTeam = NFL_TEAMS[game.opponent];
  const oppLogo = oppTeam?.logoUrl;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Rank banner */}
      <div
        className={`bg-gradient-to-r ${medalColors[rank]} px-4 py-1.5 flex items-center gap-2`}
      >
        <Trophy className="w-4 h-4 text-white" />
        <span className="text-sm font-bold text-white">#{rank + 1}</span>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {oppLogo && (
              <Image src={oppLogo} alt={game.opponent} width={32} height={32} />
            )}
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                vs {game.opponent}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Week {game.week}
              </div>
            </div>
          </div>
          {/* EPA badge */}
          {game.totalEpa !== undefined && (
            <div className="text-right">
              <div className={`text-xl font-bold ${epaColor(game.totalEpa)}`}>
                {formatEpa(game.totalEpa)}
              </div>
              <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                EPA
              </div>
            </div>
          )}
        </div>

        {secondaryStats.length > 0 && (
          <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-1.5">
            {secondaryStats.map((s, i) => (
              <span
                key={i}
                className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Game Log Table ───────────────────────────────────────────────────

function GameLogTable({
  games,
  position,
}: {
  games: PlayerGameStats[];
  position: string;
}) {
  const isQB = position === "QB";
  const isRB = position === "RB" || position === "FB";
  const isReceiver = position === "WR" || position === "TE";

  // Compute totals for the footer row
  const totals = games.reduce(
    (acc, g) => ({
      completions: acc.completions + g.completions,
      attempts: acc.attempts + g.attempts,
      passingYards: acc.passingYards + g.passingYards,
      passingTds: acc.passingTds + g.passingTds,
      interceptions: acc.interceptions + g.interceptions,
      carries: acc.carries + g.carries,
      rushingYards: acc.rushingYards + g.rushingYards,
      rushingTds: acc.rushingTds + g.rushingTds,
      receptions: acc.receptions + g.receptions,
      targets: acc.targets + g.targets,
      receivingYards: acc.receivingYards + g.receivingYards,
      receivingTds: acc.receivingTds + g.receivingTds,
      totalEpa: acc.totalEpa + (g.totalEpa ?? 0),
    }),
    {
      completions: 0,
      attempts: 0,
      passingYards: 0,
      passingTds: 0,
      interceptions: 0,
      carries: 0,
      rushingYards: 0,
      rushingTds: 0,
      receptions: 0,
      targets: 0,
      receivingYards: 0,
      receivingTds: 0,
      totalEpa: 0,
    }
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 sticky left-0 bg-white dark:bg-slate-800 z-10">
              WK
            </th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
              OPP
            </th>
            {/* Passing columns — show for QBs */}
            {isQB && (
              <>
                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  CMP/ATT
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  PASS YDS
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  PASS TD
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  INT
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  RTG
                </th>
              </>
            )}
            {/* Rushing columns — show for QBs, RBs */}
            {(isQB || isRB) && (
              <>
                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  CAR
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  RUSH YDS
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  RUSH TD
                </th>
              </>
            )}
            {/* Receiving columns — show for RBs, WRs, TEs */}
            {(isRB || isReceiver) && (
              <>
                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  REC
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  TGT
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  REC YDS
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  REC TD
                </th>
              </>
            )}
            {/* WR rushing stats */}
            {isReceiver && (
              <>
                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  RUSH YDS
                </th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  RUSH TD
                </th>
              </>
            )}
            <th className="text-right py-3 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
              EPA
            </th>
          </tr>
        </thead>
        <tbody>
          {games.map((game, idx) => {
            const oppTeam = NFL_TEAMS[game.opponent];
            return (
              <tr
                key={`${game.week}-${idx}`}
                className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-800 z-10">
                  {game.week}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    {oppTeam?.logoUrl && (
                      <Image
                        src={oppTeam.logoUrl}
                        alt={game.opponent}
                        width={20}
                        height={20}
                      />
                    )}
                    <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                      {game.opponent}
                    </span>
                  </div>
                </td>
                {isQB && (
                  <>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {game.completions}/{game.attempts}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-900 dark:text-slate-100">
                      {game.passingYards}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {game.passingTds}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {game.interceptions}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {game.passerRating > 0 ? game.passerRating.toFixed(1) : "-"}
                    </td>
                  </>
                )}
                {(isQB || isRB) && (
                  <>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {game.carries}
                    </td>
                    <td className={`py-2.5 px-3 text-right ${isRB ? "font-medium text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}`}>
                      {game.rushingYards}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {game.rushingTds}
                    </td>
                  </>
                )}
                {(isRB || isReceiver) && (
                  <>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {game.receptions}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {game.targets}
                    </td>
                    <td className={`py-2.5 px-3 text-right ${isReceiver ? "font-medium text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}`}>
                      {game.receivingYards}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {game.receivingTds}
                    </td>
                  </>
                )}
                {isReceiver && (
                  <>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {game.rushingYards}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      {game.rushingTds}
                    </td>
                  </>
                )}
                <td className={`py-2.5 px-3 text-right font-medium ${epaColor(game.totalEpa)}`}>
                  {formatEpa(game.totalEpa)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40">
            <td className="py-2.5 px-3 font-bold text-xs text-slate-900 dark:text-slate-100 sticky left-0 bg-slate-50 dark:bg-slate-700/40 z-10">
              TOT
            </td>
            <td className="py-2.5 px-3" />
            {isQB && (
              <>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {totals.completions}/{totals.attempts}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {totals.passingYards.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {totals.passingTds}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {totals.interceptions}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-400 dark:text-slate-500">
                  —
                </td>
              </>
            )}
            {(isQB || isRB) && (
              <>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {totals.carries}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {totals.rushingYards.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {totals.rushingTds}
                </td>
              </>
            )}
            {(isRB || isReceiver) && (
              <>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {totals.receptions}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {totals.targets}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {totals.receivingYards.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {totals.receivingTds}
                </td>
              </>
            )}
            {isReceiver && (
              <>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {totals.rushingYards.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                  {totals.rushingTds}
                </td>
              </>
            )}
            <td className={`py-2.5 px-3 text-right font-bold ${epaColor(totals.totalEpa)}`}>
              {formatEpa(totals.totalEpa)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Season Summary Cards ─────────────────────────────────────────────

function SeasonSummaryCards({ player }: { player: PlayerDetail }) {
  const { season, position } = player;
  const isQB = position === "QB";
  const isRB = position === "RB" || position === "FB";
  const isReceiver = position === "WR" || position === "TE";

  // Compute total EPA from game log
  const totalEpa = player.games.reduce((sum, g) => sum + (g.totalEpa ?? 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      <StatCard label="Games" value={season.gamesPlayed} />

      {/* Passing stats for QBs */}
      {isQB && (
        <>
          <StatCard
            label="Pass Yds"
            value={season.passingYards.toLocaleString()}
          />
          <StatCard label="Pass TD" value={season.passingTds} />
          <StatCard label="INT" value={season.interceptions} />
          <StatCard
            label="Comp %"
            value={`${season.completionPct}%`}
          />
          <StatCard
            label="Passer Rating"
            value={season.passerRating.toFixed(1)}
          />
          {/* QB rushing */}
          <StatCard
            label="Rush Yds"
            value={season.rushingYards.toLocaleString()}
          />
          <StatCard label="Rush TD" value={season.rushingTds} />
          <StatCard label="Carries" value={season.carries} />
        </>
      )}

      {/* Rushing stats for RBs */}
      {isRB && (
        <>
          <StatCard
            label="Rush Yds"
            value={season.rushingYards.toLocaleString()}
          />
          <StatCard label="Rush TD" value={season.rushingTds} />
          <StatCard label="Carries" value={season.carries} />
          <StatCard label="YPC" value={season.yardsPerCarry} />
          {/* RB receiving */}
          <StatCard label="Receptions" value={season.receptions} />
          <StatCard
            label="Rec Yds"
            value={season.receivingYards.toLocaleString()}
          />
          <StatCard label="Rec TD" value={season.receivingTds} />
        </>
      )}

      {/* Receiving stats for WR/TE */}
      {isReceiver && (
        <>
          <StatCard
            label="Rec Yds"
            value={season.receivingYards.toLocaleString()}
          />
          <StatCard label="Receptions" value={season.receptions} />
          <StatCard label="Rec TD" value={season.receivingTds} />
          <StatCard label="Targets" value={season.targets} />
          <StatCard label="YPR" value={season.yardsPerReception} />
          {/* WR/TE rushing */}
          <StatCard
            label="Rush Yds"
            value={season.rushingYards.toLocaleString()}
          />
          <StatCard label="Rush TD" value={season.rushingTds} />
        </>
      )}

      {/* Total EPA for all positions */}
      <StatCard label="Total EPA" value={formatEpa(totalEpa)} />
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────

export default function PlayerPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { selectedSeason } = useSeason();

  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlayer() {
      setLoading(true);
      setError(null);

      try {
        const data = await getPlayerBySlug(slug, selectedSeason);
        if (cancelled) return;

        if (!data) {
          setError("Player not found");
          setPlayer(null);
        } else {
          setPlayer(data);
        }
      } catch {
        if (!cancelled) setError("Failed to load player stats");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlayer();
    return () => {
      cancelled = true;
    };
  }, [slug, selectedSeason]);

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading player stats...
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────
  if (error || !player) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Player Not Found
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {error || "No data available for this player."}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Try searching for a different player or season.
          </p>
        </div>
      </div>
    );
  }

  // ── Data derived from player ─────────────────────────────────────
  const top3 = getTop3Games(player.games);
  const teamData = NFL_TEAMS[player.team];
  const teamColor = teamData?.branding?.primary || "#6366f1";

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* ── Player Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 sm:gap-6">
        {player.headshot ? (
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2"
            style={{ borderColor: teamColor }}
          >
            <Image
              src={player.headshot}
              alt={player.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
        ) : player.teamLogo ? (
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center p-2"
            style={{ backgroundColor: `${teamColor}15` }}
          >
            <Image
              src={player.teamLogo}
              alt={player.team}
              width={56}
              height={56}
            />
          </div>
        ) : null}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {player.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: teamColor }}
            >
              {player.position}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {teamData ? `${teamData.city} ${teamData.name}` : player.team}
            </span>
            <span className="text-sm text-slate-400 dark:text-slate-500">
              &middot; {selectedSeason} Season
            </span>
          </div>
        </div>
      </div>

      {/* ── Season Stats ──────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          Season Stats
        </h2>
        <SeasonSummaryCards player={player} />
      </section>

      {/* ── Top 3 Performances ────────────────────────────────────── */}
      {top3.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Top {top3.length} Performances
            <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
              by EPA
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {top3.map((game, idx) => (
              <TopGameCard
                key={`top-${game.week}`}
                game={game}
                rank={idx}
                position={player.position}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Game Log ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
          Game Log
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <GameLogTable games={player.games} position={player.position} />
        </div>
      </section>
    </main>
  );
}
