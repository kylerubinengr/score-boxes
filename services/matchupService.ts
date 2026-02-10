import { TEAM_ID_TO_ABBR, getNflfastrAbbr } from "@/constants/teams";
import { fetchAllSeasonPlays } from "@/lib/pbpData";
import { computeSeasonTeamStats } from "@/lib/teamStatsAggregator";
import type { LeagueMetricContext, LeagueContext } from "@/types/teamStats";
import fs from "fs/promises";
import path from "path";

export type RankedStat = {
  value: string;
  rank?: number;
};

export type AdvancedTeamStats = {
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
  // Yards stats (per game, ranked)
  offTotalYPG: RankedStat;
  offPassYPG: RankedStat;
  offRushYPG: RankedStat;
  defTotalYPG: RankedStat;
  defPassYPG: RankedStat;
  defRushYPG: RankedStat;
  // Pass/Rush efficiency breakdown
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
  // Expanded situational stats
  off3rdShortConv: RankedStat;
  def3rdShortConv: RankedStat;
  off3rdMedConv: RankedStat;
  def3rdMedConv: RankedStat;
  off3rdLongConv: RankedStat;
  def3rdLongConv: RankedStat;
  off4thDownSuccess: RankedStat;
  def4thDownSuccess: RankedStat;
  offGoalLineTD: RankedStat;
  defGoalLineTD: RankedStat;
  offTwoMinEpa: RankedStat;
  defTwoMinEpa: RankedStat;
  offClutchEpa: RankedStat;
  defClutchEpa: RankedStat;
};

export type MatchupComparison = {
  home: AdvancedTeamStats;
  away: AdvancedTeamStats;
};

// Helper to calculate ranks
function calculateRanks(data: Record<string, number>, ascending: boolean = false): Record<string, number> {
  const sorted = Object.entries(data)
    .sort(([, a], [, b]) => ascending ? a - b : b - a);
  
  const ranks: Record<string, number> = {};
  sorted.forEach((item, index) => {
    ranks[item[0]] = index + 1;
  });
  return ranks;
}

// Helper to compute league aggregates for a stat (avg, best, worst with team names)
function computeLeagueAggregates(
  vals: Record<string, number>,
  ascending: boolean,
  formatter: (v: number) => string,
): LeagueMetricContext {
  const entries = Object.entries(vals);
  if (entries.length === 0) {
    return { avg: "N/A", best: "N/A", bestTeam: "", worst: "N/A", worstTeam: "" };
  }
  const sum = entries.reduce((s, [, v]) => s + v, 0);
  const avg = sum / entries.length;
  // Sort: best first (ascending=true means lower is better for defense)
  const sorted = [...entries].sort(([, a], [, b]) => ascending ? a - b : b - a);
  const bestEntry = sorted[0];
  const worstEntry = sorted[sorted.length - 1];
  return {
    avg: formatter(avg),
    best: formatter(bestEntry[1]),
    bestTeam: bestEntry[0],
    worst: formatter(worstEntry[1]),
    worstTeam: worstEntry[0],
  };
}

type AdvancedStatsResult = {
  teams: Record<string, Partial<AdvancedTeamStats>>;
  leagueContext: LeagueContext;
};

// In-memory cache for computed advanced stats, keyed by season.
// Persists across requests on the same warm serverless instance.
const advancedStatsCache = new Map<number, { data: AdvancedStatsResult; timestamp: number }>();
const ADVANCED_STATS_TTL = 3600 * 1000; // 1 hour in ms

/**
 * Fetch play-by-play data from nflverse and compute per-team EPA/success stats.
 * Falls back to static team_stats.json if PBP fetch fails.
 */
async function getAdvancedStats(season?: number): Promise<AdvancedStatsResult> {
  const seasonYear = season || new Date().getFullYear();

  // Check in-memory cache
  const cached = advancedStatsCache.get(seasonYear);
  if (cached && (Date.now() - cached.timestamp) < ADVANCED_STATS_TTL) {
    return cached.data;
  }

  try {
    console.log(`[advancedStats] Computing team stats from PBP for season ${seasonYear}...`);
    const plays = await fetchAllSeasonPlays(seasonYear);
    const rawStats = computeSeasonTeamStats(plays);
    console.log(`[advancedStats] Computed stats for ${Object.keys(rawStats).length} teams (${plays.length} plays)`);

    // Extract values for ranking
    const offEpaVals: Record<string, number> = {};
    const defEpaVals: Record<string, number> = {};
    const offSuccessVals: Record<string, number> = {};
    const defSuccessVals: Record<string, number> = {};
    const offTotalYdsVals: Record<string, number> = {};
    const offPassYdsVals: Record<string, number> = {};
    const offRushYdsVals: Record<string, number> = {};
    const defTotalYdsVals: Record<string, number> = {};
    const defPassYdsVals: Record<string, number> = {};
    const defRushYdsVals: Record<string, number> = {};
    // Pass/Rush efficiency
    const offPassEpaVals: Record<string, number> = {};
    const offRushEpaVals: Record<string, number> = {};
    const offPassSuccessVals: Record<string, number> = {};
    const offRushSuccessVals: Record<string, number> = {};
    const defPassEpaVals: Record<string, number> = {};
    const defRushEpaVals: Record<string, number> = {};
    const defPassSuccessVals: Record<string, number> = {};
    const defRushSuccessVals: Record<string, number> = {};
    // Situational stats
    const off3rdDownVals: Record<string, number> = {};
    const def3rdDownVals: Record<string, number> = {};
    const offRedzoneVals: Record<string, number> = {};
    const defRedzoneVals: Record<string, number> = {};
    // Expanded situational stats
    const off3rdShortVals: Record<string, number> = {};
    const def3rdShortVals: Record<string, number> = {};
    const off3rdMedVals: Record<string, number> = {};
    const def3rdMedVals: Record<string, number> = {};
    const off3rdLongVals: Record<string, number> = {};
    const def3rdLongVals: Record<string, number> = {};
    const off4thDownVals: Record<string, number> = {};
    const def4thDownVals: Record<string, number> = {};
    const offGoalLineVals: Record<string, number> = {};
    const defGoalLineVals: Record<string, number> = {};
    const offTwoMinEpaVals: Record<string, number> = {};
    const defTwoMinEpaVals: Record<string, number> = {};
    const offClutchEpaVals: Record<string, number> = {};
    const defClutchEpaVals: Record<string, number> = {};

    Object.keys(rawStats).forEach(team => {
      const s = rawStats[team];
      offEpaVals[team] = s.off_epa;
      defEpaVals[team] = s.def_epa;
      offSuccessVals[team] = s.off_success_rate;
      defSuccessVals[team] = s.def_success_rate;
      // Total yards (pass + rush)
      offTotalYdsVals[team] = s.off_pass_yards + s.off_rush_yards;
      offPassYdsVals[team] = s.off_pass_yards;
      offRushYdsVals[team] = s.off_rush_yards;
      defTotalYdsVals[team] = s.def_pass_yards + s.def_rush_yards;
      defPassYdsVals[team] = s.def_pass_yards;
      defRushYdsVals[team] = s.def_rush_yards;
      // Pass/Rush efficiency
      offPassEpaVals[team] = s.off_dropback_epa;
      offRushEpaVals[team] = s.off_rush_epa;
      offPassSuccessVals[team] = s.off_pass_success_rate;
      offRushSuccessVals[team] = s.off_rush_success_rate;
      defPassEpaVals[team] = s.def_dropback_epa;
      defRushEpaVals[team] = s.def_rush_epa;
      defPassSuccessVals[team] = s.def_pass_success_rate;
      defRushSuccessVals[team] = s.def_rush_success_rate;
      // Situational stats
      off3rdDownVals[team] = s.off_third_down_conv_rate;
      def3rdDownVals[team] = s.def_third_down_conv_rate;
      offRedzoneVals[team] = s.off_redzone_td_rate;
      defRedzoneVals[team] = s.def_redzone_td_rate;
      // Expanded situational stats
      off3rdShortVals[team] = s.off_third_short_conv_rate;
      def3rdShortVals[team] = s.def_third_short_conv_rate;
      off3rdMedVals[team] = s.off_third_med_conv_rate;
      def3rdMedVals[team] = s.def_third_med_conv_rate;
      off3rdLongVals[team] = s.off_third_long_conv_rate;
      def3rdLongVals[team] = s.def_third_long_conv_rate;
      off4thDownVals[team] = s.off_fourth_down_success_rate;
      def4thDownVals[team] = s.def_fourth_down_success_rate;
      offGoalLineVals[team] = s.off_goalline_td_rate;
      defGoalLineVals[team] = s.def_goalline_td_rate;
      offTwoMinEpaVals[team] = s.off_two_min_epa;
      defTwoMinEpaVals[team] = s.def_two_min_epa;
      offClutchEpaVals[team] = s.off_clutch_epa;
      defClutchEpaVals[team] = s.def_clutch_epa;
    });

    // Offense: Higher is better (Descending)
    const offEpaRanks = calculateRanks(offEpaVals, false);
    const offSuccessRanks = calculateRanks(offSuccessVals, false);
    const offTotalYdsRanks = calculateRanks(offTotalYdsVals, false);
    const offPassYdsRanks = calculateRanks(offPassYdsVals, false);
    const offRushYdsRanks = calculateRanks(offRushYdsVals, false);
    // Defense: Lower is better (Ascending)
    const defEpaRanks = calculateRanks(defEpaVals, true);
    const defSuccessRanks = calculateRanks(defSuccessVals, true);
    const defTotalYdsRanks = calculateRanks(defTotalYdsVals, true);
    const defPassYdsRanks = calculateRanks(defPassYdsVals, true);
    const defRushYdsRanks = calculateRanks(defRushYdsVals, true);
    // Pass/Rush efficiency ranks
    const offPassEpaRanks = calculateRanks(offPassEpaVals, false);
    const offRushEpaRanks = calculateRanks(offRushEpaVals, false);
    const offPassSuccessRanks = calculateRanks(offPassSuccessVals, false);
    const offRushSuccessRanks = calculateRanks(offRushSuccessVals, false);
    const defPassEpaRanks = calculateRanks(defPassEpaVals, true);
    const defRushEpaRanks = calculateRanks(defRushEpaVals, true);
    const defPassSuccessRanks = calculateRanks(defPassSuccessVals, true);
    const defRushSuccessRanks = calculateRanks(defRushSuccessVals, true);
    // Situational ranks: Higher 3rd down conv is better for offense, lower for defense
    const off3rdDownRanks = calculateRanks(off3rdDownVals, false);
    const def3rdDownRanks = calculateRanks(def3rdDownVals, true);
    // Higher red zone TD% is better for offense, lower for defense
    const offRedzoneRanks = calculateRanks(offRedzoneVals, false);
    const defRedzoneRanks = calculateRanks(defRedzoneVals, true);
    // Expanded situational ranks
    const off3rdShortRanks = calculateRanks(off3rdShortVals, false);
    const def3rdShortRanks = calculateRanks(def3rdShortVals, true);
    const off3rdMedRanks = calculateRanks(off3rdMedVals, false);
    const def3rdMedRanks = calculateRanks(def3rdMedVals, true);
    const off3rdLongRanks = calculateRanks(off3rdLongVals, false);
    const def3rdLongRanks = calculateRanks(def3rdLongVals, true);
    const off4thDownRanks = calculateRanks(off4thDownVals, false);
    const def4thDownRanks = calculateRanks(def4thDownVals, true);
    const offGoalLineRanks = calculateRanks(offGoalLineVals, false);
    const defGoalLineRanks = calculateRanks(defGoalLineVals, true);
    const offTwoMinEpaRanks = calculateRanks(offTwoMinEpaVals, false);
    const defTwoMinEpaRanks = calculateRanks(defTwoMinEpaVals, true);
    const offClutchEpaRanks = calculateRanks(offClutchEpaVals, false);
    const defClutchEpaRanks = calculateRanks(defClutchEpaVals, true);

    // Compute per-game yardage values for league context
    const offTotalYPGVals: Record<string, number> = {};
    const offPassYPGVals: Record<string, number> = {};
    const offRushYPGVals: Record<string, number> = {};
    const defTotalYPGVals: Record<string, number> = {};
    const defPassYPGVals: Record<string, number> = {};
    const defRushYPGVals: Record<string, number> = {};
    Object.keys(rawStats).forEach(team => {
      const s = rawStats[team];
      const g = s.games || 1;
      offTotalYPGVals[team] = (s.off_pass_yards + s.off_rush_yards) / g;
      offPassYPGVals[team] = s.off_pass_yards / g;
      offRushYPGVals[team] = s.off_rush_yards / g;
      defTotalYPGVals[team] = (s.def_pass_yards + s.def_rush_yards) / g;
      defPassYPGVals[team] = s.def_pass_yards / g;
      defRushYPGVals[team] = s.def_rush_yards / g;
    });

    // Compute league context (avg, best, worst for each stat)
    const fmt3 = (v: number) => v.toFixed(3);
    const fmt1 = (v: number) => v.toFixed(1);
    const fmtPct = (v: number) => v.toFixed(1) + "%";

    const leagueContext: LeagueContext = {
      offEpa: computeLeagueAggregates(offEpaVals, false, fmt3),
      defEpa: computeLeagueAggregates(defEpaVals, true, fmt3),
      offSuccess: computeLeagueAggregates(offSuccessVals, false, fmtPct),
      defSuccess: computeLeagueAggregates(defSuccessVals, true, fmtPct),
      offTotalYPG: computeLeagueAggregates(offTotalYPGVals, false, fmt1),
      offPassYPG: computeLeagueAggregates(offPassYPGVals, false, fmt1),
      offRushYPG: computeLeagueAggregates(offRushYPGVals, false, fmt1),
      defTotalYPG: computeLeagueAggregates(defTotalYPGVals, true, fmt1),
      defPassYPG: computeLeagueAggregates(defPassYPGVals, true, fmt1),
      defRushYPG: computeLeagueAggregates(defRushYPGVals, true, fmt1),
      offPassEpa: computeLeagueAggregates(offPassEpaVals, false, fmt3),
      offRushEpa: computeLeagueAggregates(offRushEpaVals, false, fmt3),
      offPassSuccess: computeLeagueAggregates(offPassSuccessVals, false, fmtPct),
      offRushSuccess: computeLeagueAggregates(offRushSuccessVals, false, fmtPct),
      defPassEpa: computeLeagueAggregates(defPassEpaVals, true, fmt3),
      defRushEpa: computeLeagueAggregates(defRushEpaVals, true, fmt3),
      defPassSuccess: computeLeagueAggregates(defPassSuccessVals, true, fmtPct),
      defRushSuccess: computeLeagueAggregates(defRushSuccessVals, true, fmtPct),
      off3rdDownConv: computeLeagueAggregates(off3rdDownVals, false, fmtPct),
      def3rdDownConv: computeLeagueAggregates(def3rdDownVals, true, fmtPct),
      offRedzoneTD: computeLeagueAggregates(offRedzoneVals, false, fmtPct),
      defRedzoneTD: computeLeagueAggregates(defRedzoneVals, true, fmtPct),
      off3rdShortConv: computeLeagueAggregates(off3rdShortVals, false, fmtPct),
      def3rdShortConv: computeLeagueAggregates(def3rdShortVals, true, fmtPct),
      off3rdMedConv: computeLeagueAggregates(off3rdMedVals, false, fmtPct),
      def3rdMedConv: computeLeagueAggregates(def3rdMedVals, true, fmtPct),
      off3rdLongConv: computeLeagueAggregates(off3rdLongVals, false, fmtPct),
      def3rdLongConv: computeLeagueAggregates(def3rdLongVals, true, fmtPct),
      off4thDownSuccess: computeLeagueAggregates(off4thDownVals, false, fmtPct),
      def4thDownSuccess: computeLeagueAggregates(def4thDownVals, true, fmtPct),
      offGoalLineTD: computeLeagueAggregates(offGoalLineVals, false, fmtPct),
      defGoalLineTD: computeLeagueAggregates(defGoalLineVals, true, fmtPct),
      offTwoMinEpa: computeLeagueAggregates(offTwoMinEpaVals, false, fmt3),
      defTwoMinEpa: computeLeagueAggregates(defTwoMinEpaVals, true, fmt3),
      offClutchEpa: computeLeagueAggregates(offClutchEpaVals, false, fmt3),
      defClutchEpa: computeLeagueAggregates(defClutchEpaVals, true, fmt3),
    };

    const resultMap: Record<string, Partial<AdvancedTeamStats>> = {};

    Object.keys(rawStats).forEach(team => {
      const s = rawStats[team];
      const games = s.games || 1;
      const offTotalYPG = (s.off_pass_yards + s.off_rush_yards) / games;
      const defTotalYPG = (s.def_pass_yards + s.def_rush_yards) / games;

      resultMap[team] = {
        offEpa: {
          value: s.off_epa?.toFixed(3) || "N/A",
          rank: offEpaRanks[team]
        },
        defEpa: {
          value: s.def_epa?.toFixed(3) || "N/A",
          rank: defEpaRanks[team]
        },
        offSuccess: {
          value: (s.off_success_rate || 0).toFixed(1) + "%",
          rank: offSuccessRanks[team]
        },
        defSuccess: {
          value: (s.def_success_rate || 0).toFixed(1) + "%",
          rank: defSuccessRanks[team]
        },
        offTotalYPG: {
          value: offTotalYPG.toFixed(1),
          rank: offTotalYdsRanks[team]
        },
        offPassYPG: {
          value: (s.off_pass_yards / games).toFixed(1),
          rank: offPassYdsRanks[team]
        },
        offRushYPG: {
          value: (s.off_rush_yards / games).toFixed(1),
          rank: offRushYdsRanks[team]
        },
        defTotalYPG: {
          value: defTotalYPG.toFixed(1),
          rank: defTotalYdsRanks[team]
        },
        defPassYPG: {
          value: (s.def_pass_yards / games).toFixed(1),
          rank: defPassYdsRanks[team]
        },
        defRushYPG: {
          value: (s.def_rush_yards / games).toFixed(1),
          rank: defRushYdsRanks[team]
        },
        offPassEpa: {
          value: s.off_dropback_epa?.toFixed(3) || "N/A",
          rank: offPassEpaRanks[team]
        },
        offRushEpa: {
          value: s.off_rush_epa?.toFixed(3) || "N/A",
          rank: offRushEpaRanks[team]
        },
        offPassSuccess: {
          value: (s.off_pass_success_rate || 0).toFixed(1) + "%",
          rank: offPassSuccessRanks[team]
        },
        offRushSuccess: {
          value: (s.off_rush_success_rate || 0).toFixed(1) + "%",
          rank: offRushSuccessRanks[team]
        },
        defPassEpa: {
          value: s.def_dropback_epa?.toFixed(3) || "N/A",
          rank: defPassEpaRanks[team]
        },
        defRushEpa: {
          value: s.def_rush_epa?.toFixed(3) || "N/A",
          rank: defRushEpaRanks[team]
        },
        defPassSuccess: {
          value: (s.def_pass_success_rate || 0).toFixed(1) + "%",
          rank: defPassSuccessRanks[team]
        },
        defRushSuccess: {
          value: (s.def_rush_success_rate || 0).toFixed(1) + "%",
          rank: defRushSuccessRanks[team]
        },
        // Situational stats
        off3rdDownConv: {
          value: (s.off_third_down_conv_rate || 0).toFixed(1) + "%",
          rank: off3rdDownRanks[team]
        },
        def3rdDownConv: {
          value: (s.def_third_down_conv_rate || 0).toFixed(1) + "%",
          rank: def3rdDownRanks[team]
        },
        offRedzoneTD: {
          value: (s.off_redzone_td_rate || 0).toFixed(1) + "%",
          rank: offRedzoneRanks[team]
        },
        defRedzoneTD: {
          value: (s.def_redzone_td_rate || 0).toFixed(1) + "%",
          rank: defRedzoneRanks[team]
        },
        // Expanded situational stats
        off3rdShortConv: {
          value: (s.off_third_short_conv_rate || 0).toFixed(1) + "%",
          rank: off3rdShortRanks[team]
        },
        def3rdShortConv: {
          value: (s.def_third_short_conv_rate || 0).toFixed(1) + "%",
          rank: def3rdShortRanks[team]
        },
        off3rdMedConv: {
          value: (s.off_third_med_conv_rate || 0).toFixed(1) + "%",
          rank: off3rdMedRanks[team]
        },
        def3rdMedConv: {
          value: (s.def_third_med_conv_rate || 0).toFixed(1) + "%",
          rank: def3rdMedRanks[team]
        },
        off3rdLongConv: {
          value: (s.off_third_long_conv_rate || 0).toFixed(1) + "%",
          rank: off3rdLongRanks[team]
        },
        def3rdLongConv: {
          value: (s.def_third_long_conv_rate || 0).toFixed(1) + "%",
          rank: def3rdLongRanks[team]
        },
        off4thDownSuccess: {
          value: (s.off_fourth_down_success_rate || 0).toFixed(1) + "%",
          rank: off4thDownRanks[team]
        },
        def4thDownSuccess: {
          value: (s.def_fourth_down_success_rate || 0).toFixed(1) + "%",
          rank: def4thDownRanks[team]
        },
        offGoalLineTD: {
          value: (s.off_goalline_td_rate || 0).toFixed(1) + "%",
          rank: offGoalLineRanks[team]
        },
        defGoalLineTD: {
          value: (s.def_goalline_td_rate || 0).toFixed(1) + "%",
          rank: defGoalLineRanks[team]
        },
        offTwoMinEpa: {
          value: (s.off_two_min_epa || 0).toFixed(3),
          rank: offTwoMinEpaRanks[team]
        },
        defTwoMinEpa: {
          value: (s.def_two_min_epa || 0).toFixed(3),
          rank: defTwoMinEpaRanks[team]
        },
        offClutchEpa: {
          value: (s.off_clutch_epa || 0).toFixed(3),
          rank: offClutchEpaRanks[team]
        },
        defClutchEpa: {
          value: (s.def_clutch_epa || 0).toFixed(3),
          rank: defClutchEpaRanks[team]
        },
      };
    });

    const result: AdvancedStatsResult = { teams: resultMap, leagueContext };

    // Cache the result
    advancedStatsCache.set(seasonYear, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.warn(`[advancedStats] PBP fetch failed for ${seasonYear}, falling back to static JSON:`, error);
    return getAdvancedStatsFromFile();
  }
}

/** Fallback: load from static team_stats.json (only contains one season) */
async function getAdvancedStatsFromFile(): Promise<AdvancedStatsResult> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'team_stats.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const stats = JSON.parse(fileContent);

    const offEpaVals: Record<string, number> = {};
    const defEpaVals: Record<string, number> = {};
    const offSuccessVals: Record<string, number> = {};
    const defSuccessVals: Record<string, number> = {};

    Object.keys(stats).forEach(team => {
      offEpaVals[team] = stats[team].off_epa;
      defEpaVals[team] = stats[team].def_epa;
      offSuccessVals[team] = stats[team].off_success_rate;
      defSuccessVals[team] = stats[team].def_success_rate;
    });

    const offEpaRanks = calculateRanks(offEpaVals, false);
    const offSuccessRanks = calculateRanks(offSuccessVals, false);
    const defEpaRanks = calculateRanks(defEpaVals, true);
    const defSuccessRanks = calculateRanks(defSuccessVals, true);

    const resultMap: Record<string, Partial<AdvancedTeamStats>> = {};

    Object.keys(stats).forEach(team => {
      resultMap[team] = {
        offEpa: {
          value: stats[team].off_epa?.toFixed(3) || "N/A",
          rank: offEpaRanks[team]
        },
        defEpa: {
          value: stats[team].def_epa?.toFixed(3) || "N/A",
          rank: defEpaRanks[team]
        },
        offSuccess: {
          value: (stats[team].off_success_rate || 0).toFixed(1) + "%",
          rank: offSuccessRanks[team]
        },
        defSuccess: {
          value: (stats[team].def_success_rate || 0).toFixed(1) + "%",
          rank: defSuccessRanks[team]
        },
        // Fallback doesn't have per-game yard data
        offTotalYPG: { value: "N/A" },
        offPassYPG: { value: "N/A" },
        offRushYPG: { value: "N/A" },
        defTotalYPG: { value: "N/A" },
        defPassYPG: { value: "N/A" },
        defRushYPG: { value: "N/A" },
        offPassEpa: { value: "N/A" },
        offRushEpa: { value: "N/A" },
        offPassSuccess: { value: "N/A" },
        offRushSuccess: { value: "N/A" },
        defPassEpa: { value: "N/A" },
        defRushEpa: { value: "N/A" },
        defPassSuccess: { value: "N/A" },
        defRushSuccess: { value: "N/A" },
        // Situational fallbacks
        off3rdDownConv: { value: "N/A" },
        def3rdDownConv: { value: "N/A" },
        offRedzoneTD: { value: "N/A" },
        defRedzoneTD: { value: "N/A" },
        // Expanded situational fallbacks
        off3rdShortConv: { value: "N/A" },
        def3rdShortConv: { value: "N/A" },
        off3rdMedConv: { value: "N/A" },
        def3rdMedConv: { value: "N/A" },
        off3rdLongConv: { value: "N/A" },
        def3rdLongConv: { value: "N/A" },
        off4thDownSuccess: { value: "N/A" },
        def4thDownSuccess: { value: "N/A" },
        offGoalLineTD: { value: "N/A" },
        defGoalLineTD: { value: "N/A" },
        offTwoMinEpa: { value: "N/A" },
        defTwoMinEpa: { value: "N/A" },
        offClutchEpa: { value: "N/A" },
        defClutchEpa: { value: "N/A" },
      };
    });

    // Fallback league context for the limited stats we have
    const fmt3 = (v: number) => v.toFixed(3);
    const fmtPct = (v: number) => v.toFixed(1) + "%";
    const fallbackLeague: LeagueContext = {
      offEpa: computeLeagueAggregates(offEpaVals, false, fmt3),
      defEpa: computeLeagueAggregates(defEpaVals, true, fmt3),
      offSuccess: computeLeagueAggregates(offSuccessVals, false, fmtPct),
      defSuccess: computeLeagueAggregates(defSuccessVals, true, fmtPct),
    };

    return { teams: resultMap, leagueContext: fallbackLeague };
  } catch (error) {
    console.warn("Could not load local team stats JSON:", error);
    return { teams: {}, leagueContext: {} };
  }
}

type ESPNStandingsResult = {
  teams: Record<string, Partial<AdvancedTeamStats>>;
  leagueContext: LeagueContext;
};

async function getESPNStandings(season?: number): Promise<ESPNStandingsResult> {
  try {
    const url = season
      ? `https://site.api.espn.com/apis/v2/sports/football/nfl/standings?season=${season}`
      : "https://site.api.espn.com/apis/v2/sports/football/nfl/standings";
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return { teams: {}, leagueContext: {} };
    const data = await res.json();

    const statsMap: Record<string, Partial<AdvancedTeamStats>> = {};

    // For ranking
    const pfVals: Record<string, number> = {};
    const paVals: Record<string, number> = {};
    const diffVals: Record<string, number> = {};

    // First pass: Collect data
    data.children?.forEach((conf: any) => {
        conf.standings?.entries?.forEach((entry: any) => {
            const teamId = entry.team.id;
            const stats = entry.stats || [];
            const getStat = (name: string) => parseFloat(stats.find((s: any) => s.name === name)?.value || "0");

            pfVals[teamId] = getStat("pointsFor");
            paVals[teamId] = getStat("pointsAgainst");
            diffVals[teamId] = getStat("differential");
        });
    });

    const pfRanks = calculateRanks(pfVals, false); // Higher better
    const paRanks = calculateRanks(paVals, true);  // Lower better
    const diffRanks = calculateRanks(diffVals, false); // Higher better

    // Compute league context for ESPN stats
    // ESPN uses team IDs as keys; we need to map to abbreviations for display
    const fmt0 = (v: number) => Math.round(v).toString();
    const espnLeagueContext: LeagueContext = {
      pointsFor: computeLeagueAggregates(pfVals, false, fmt0),
      pointsAgainst: computeLeagueAggregates(paVals, true, fmt0),
      diff: computeLeagueAggregates(diffVals, false, fmt0),
    };
    // Map team IDs in league context to abbreviations
    for (const key of Object.keys(espnLeagueContext)) {
      const ctx = espnLeagueContext[key];
      ctx.bestTeam = TEAM_ID_TO_ABBR[ctx.bestTeam] || ctx.bestTeam;
      ctx.worstTeam = TEAM_ID_TO_ABBR[ctx.worstTeam] || ctx.worstTeam;
    }

    // Second pass: Build objects
    data.children?.forEach((conf: any) => {
        conf.standings?.entries?.forEach((entry: any) => {
            const teamId = entry.team.id;
            const stats = entry.stats || [];

            const getStatDisplay = (name: string) => stats.find((s: any) => s.name === name)?.displayValue || "-";

            const wins = getStatDisplay("wins");
            const losses = getStatDisplay("losses");
            const ties = getStatDisplay("ties");
            const record = ties !== "0" && ties !== "-" ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;

            statsMap[teamId] = {
                record,
                homeRecord: getStatDisplay("Home"),
                awayRecord: getStatDisplay("Road"),
                divRecord: getStatDisplay("vs. Div."),
                streak: getStatDisplay("streak"),
                pointsFor: { value: getStatDisplay("pointsFor"), rank: pfRanks[teamId] },
                pointsAgainst: { value: getStatDisplay("pointsAgainst"), rank: paRanks[teamId] },
                diff: { value: getStatDisplay("differential"), rank: diffRanks[teamId] },
            };
        });
    });
    return { teams: statsMap, leagueContext: espnLeagueContext };
  } catch (e) {
    console.error("ESPN Standings Fetch Error:", e);
    return { teams: {}, leagueContext: {} };
  }
}

export async function getTeamStats(teamAbbr: string, season?: number): Promise<{ stats: AdvancedTeamStats; leagueContext: LeagueContext } | null> {
  const { getTeamByAbbr, getNflfastrAbbr } = await import("@/constants/teams");
  const team = getTeamByAbbr(teamAbbr);
  if (!team) return null;

  const [espnResult, advancedResult] = await Promise.all([
    getESPNStandings(season),
    getAdvancedStats(season)
  ]);

  const espn = espnResult.teams[team.espnId] || {};
  const nflfastrAbbr = getNflfastrAbbr(teamAbbr);
  const adv = advancedResult.teams[nflfastrAbbr] || advancedResult.teams[teamAbbr] || {};

  // Merge league contexts from both sources
  const leagueContext: LeagueContext = {
    ...advancedResult.leagueContext,
    ...espnResult.leagueContext,
  };

  const stats: AdvancedTeamStats = {
    record: espn.record || "0-0",
    homeRecord: espn.homeRecord || "-",
    awayRecord: espn.awayRecord || "-",
    divRecord: espn.divRecord || "-",
    streak: espn.streak || "-",
    pointsFor: espn.pointsFor || { value: "-" },
    pointsAgainst: espn.pointsAgainst || { value: "-" },
    diff: espn.diff || { value: "-" },
    offEpa: adv.offEpa || { value: "N/A" },
    defEpa: adv.defEpa || { value: "N/A" },
    offSuccess: adv.offSuccess || { value: "N/A" },
    defSuccess: adv.defSuccess || { value: "N/A" },
    offTotalYPG: adv.offTotalYPG || { value: "N/A" },
    offPassYPG: adv.offPassYPG || { value: "N/A" },
    offRushYPG: adv.offRushYPG || { value: "N/A" },
    defTotalYPG: adv.defTotalYPG || { value: "N/A" },
    defPassYPG: adv.defPassYPG || { value: "N/A" },
    defRushYPG: adv.defRushYPG || { value: "N/A" },
    offPassEpa: adv.offPassEpa || { value: "N/A" },
    offRushEpa: adv.offRushEpa || { value: "N/A" },
    offPassSuccess: adv.offPassSuccess || { value: "N/A" },
    offRushSuccess: adv.offRushSuccess || { value: "N/A" },
    defPassEpa: adv.defPassEpa || { value: "N/A" },
    defRushEpa: adv.defRushEpa || { value: "N/A" },
    defPassSuccess: adv.defPassSuccess || { value: "N/A" },
    defRushSuccess: adv.defRushSuccess || { value: "N/A" },
    // Situational stats
    off3rdDownConv: adv.off3rdDownConv || { value: "N/A" },
    def3rdDownConv: adv.def3rdDownConv || { value: "N/A" },
    offRedzoneTD: adv.offRedzoneTD || { value: "N/A" },
    defRedzoneTD: adv.defRedzoneTD || { value: "N/A" },
    // Expanded situational stats
    off3rdShortConv: adv.off3rdShortConv || { value: "N/A" },
    def3rdShortConv: adv.def3rdShortConv || { value: "N/A" },
    off3rdMedConv: adv.off3rdMedConv || { value: "N/A" },
    def3rdMedConv: adv.def3rdMedConv || { value: "N/A" },
    off3rdLongConv: adv.off3rdLongConv || { value: "N/A" },
    def3rdLongConv: adv.def3rdLongConv || { value: "N/A" },
    off4thDownSuccess: adv.off4thDownSuccess || { value: "N/A" },
    def4thDownSuccess: adv.def4thDownSuccess || { value: "N/A" },
    offGoalLineTD: adv.offGoalLineTD || { value: "N/A" },
    defGoalLineTD: adv.defGoalLineTD || { value: "N/A" },
    offTwoMinEpa: adv.offTwoMinEpa || { value: "N/A" },
    defTwoMinEpa: adv.defTwoMinEpa || { value: "N/A" },
    offClutchEpa: adv.offClutchEpa || { value: "N/A" },
    defClutchEpa: adv.defClutchEpa || { value: "N/A" },
  };

  return { stats, leagueContext };
}

export async function getMatchupComparison(homeId: string, awayId: string): Promise<MatchupComparison | null> {
  const [espnResult, advancedResult] = await Promise.all([
    getESPNStandings(),
    getAdvancedStats()
  ]);

  const mapStats = (id: string): AdvancedTeamStats => {
    const espn = espnResult.teams[id] || {};
    const teamAbbr = TEAM_ID_TO_ABBR[id] || "";
    const nflfastrAbbr = getNflfastrAbbr(teamAbbr);

    const adv = advancedResult.teams[nflfastrAbbr] || advancedResult.teams[teamAbbr] || {};

    return {
        record: espn.record || "0-0",
        homeRecord: espn.homeRecord || "-",
        awayRecord: espn.awayRecord || "-",
        divRecord: espn.divRecord || "-",
        streak: espn.streak || "-",
        pointsFor: espn.pointsFor || { value: "-" },
        pointsAgainst: espn.pointsAgainst || { value: "-" },
        diff: espn.diff || { value: "-" },
        offEpa: adv.offEpa || { value: "N/A" },
        defEpa: adv.defEpa || { value: "N/A" },
        offSuccess: adv.offSuccess || { value: "N/A" },
        defSuccess: adv.defSuccess || { value: "N/A" },
        offTotalYPG: adv.offTotalYPG || { value: "N/A" },
        offPassYPG: adv.offPassYPG || { value: "N/A" },
        offRushYPG: adv.offRushYPG || { value: "N/A" },
        defTotalYPG: adv.defTotalYPG || { value: "N/A" },
        defPassYPG: adv.defPassYPG || { value: "N/A" },
        defRushYPG: adv.defRushYPG || { value: "N/A" },
        offPassEpa: adv.offPassEpa || { value: "N/A" },
        offRushEpa: adv.offRushEpa || { value: "N/A" },
        offPassSuccess: adv.offPassSuccess || { value: "N/A" },
        offRushSuccess: adv.offRushSuccess || { value: "N/A" },
        defPassEpa: adv.defPassEpa || { value: "N/A" },
        defRushEpa: adv.defRushEpa || { value: "N/A" },
        defPassSuccess: adv.defPassSuccess || { value: "N/A" },
        defRushSuccess: adv.defRushSuccess || { value: "N/A" },
        // Situational stats
        off3rdDownConv: adv.off3rdDownConv || { value: "N/A" },
        def3rdDownConv: adv.def3rdDownConv || { value: "N/A" },
        offRedzoneTD: adv.offRedzoneTD || { value: "N/A" },
        defRedzoneTD: adv.defRedzoneTD || { value: "N/A" },
        // Expanded situational stats
        off3rdShortConv: adv.off3rdShortConv || { value: "N/A" },
        def3rdShortConv: adv.def3rdShortConv || { value: "N/A" },
        off3rdMedConv: adv.off3rdMedConv || { value: "N/A" },
        def3rdMedConv: adv.def3rdMedConv || { value: "N/A" },
        off3rdLongConv: adv.off3rdLongConv || { value: "N/A" },
        def3rdLongConv: adv.def3rdLongConv || { value: "N/A" },
        off4thDownSuccess: adv.off4thDownSuccess || { value: "N/A" },
        def4thDownSuccess: adv.def4thDownSuccess || { value: "N/A" },
        offGoalLineTD: adv.offGoalLineTD || { value: "N/A" },
        defGoalLineTD: adv.defGoalLineTD || { value: "N/A" },
        offTwoMinEpa: adv.offTwoMinEpa || { value: "N/A" },
        defTwoMinEpa: adv.defTwoMinEpa || { value: "N/A" },
        offClutchEpa: adv.offClutchEpa || { value: "N/A" },
        defClutchEpa: adv.defClutchEpa || { value: "N/A" },
    };
  };

  return {
    home: mapStats(homeId),
    away: mapStats(awayId)
  };
}