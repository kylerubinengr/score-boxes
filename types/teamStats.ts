import type { AdvancedTeamStats } from "@/services/matchupService";

/** Per-metric league context for tooltips */
export type LeagueMetricContext = {
  avg: string;
  best: string;
  bestTeam: string;
  worst: string;
  worstTeam: string;
};

/** Full league context: one entry per stat key */
export type LeagueContext = Record<string, LeagueMetricContext>;

/** Enhanced API response for team stats endpoint */
export type TeamStatsResponse = {
  stats: AdvancedTeamStats;
  leagueContext: LeagueContext;
};
