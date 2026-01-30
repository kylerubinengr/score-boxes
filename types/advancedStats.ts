export type AdvancedTeamSplit = {
  epaPerPlay: number | null;
  successRate: number | null;
  firstDownPct: number | null;
  plays: number;
};

export type AdvancedTeamStats = {
  allPlays: AdvancedTeamSplit;
  rush: AdvancedTeamSplit;
  pass: AdvancedTeamSplit;
  earlyDowns: AdvancedTeamSplit;
  earlyRush: AdvancedTeamSplit;
  earlyPass: AdvancedTeamSplit;
  lateDowns: AdvancedTeamSplit;
  lateRush: AdvancedTeamSplit;
  latePass: AdvancedTeamSplit;
};

export type AdvancedPlayerStat = {
  name: string;
  epaPerPlay: number | null;
  totalEpa: number | null;
  successRate: number | null;
  firstDownPct: number | null;
  plays: number;
};

export type AdvancedPlayerStats = {
  dropbacks: AdvancedPlayerStat[];
  rushAttempts: AdvancedPlayerStat[];
  passTargets: AdvancedPlayerStat[];
};

export type AdvancedGameStats = {
  gameId: string;
  season: number;
  homeTeam: string;
  awayTeam: string;
  teamStats: {
    home: AdvancedTeamStats;
    away: AdvancedTeamStats;
  };
  playerStats: {
    home: AdvancedPlayerStats;
    away: AdvancedPlayerStats;
  };
};
