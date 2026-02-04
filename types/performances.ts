export type PlayerRole = 'QB' | 'RB' | 'WR' | 'TE';

export type PerformanceRow = {
  // Identity
  playerName: string;
  role: PlayerRole;
  team: string;           // nflverse abbreviation (e.g. "KC")
  gameId: string;         // e.g. "2025_05_HOU_BUF"
  week: number;           // parsed from gameId
  opponent: string;       // derived from gameId + team
  espnGameId?: string;    // ESPN event ID for linking to game page

  // Advanced metrics (from EPA computation)
  totalEpa: number | null;
  epaPerPlay: number | null;
  successRate: number | null;
  firstDownPct: number | null;
  plays: number;

  // Traditional counting stats (from PBP columns)
  // QB-specific
  completions?: number;
  passAttempts?: number;
  passingYards?: number;
  passTDs?: number;
  interceptions?: number;
  // RB-specific
  carries?: number;
  rushingYards?: number;
  rushTDs?: number;
  // WR-specific
  targets?: number;
  receptions?: number;
  receivingYards?: number;
  receivingTDs?: number;
};

export type SeasonPerformances = {
  season: number;
  performances: PerformanceRow[];
};
