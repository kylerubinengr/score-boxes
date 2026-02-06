export interface WinProbabilityPoint {
  playIndex: number;
  wp: number;                    // Home team WP (0-100)
  quarter: number;
  gameSecondsRemaining: number;
  description: string;
  isScoring: boolean;
  scoringType: 'td' | 'fg' | 'safety' | null;
  scoringTeam: string | null;
  posteam: string;
  homeScore: number;             // Home team score at this point
  awayScore: number;             // Away team score at this point
}

export interface KeyPlay {
  playIndex: number;
  wpSwing: number;
  description: string;
  quarter: number;
  team: string;
}

export interface WinProbabilityData {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  points: WinProbabilityPoint[];
  quarterBreaks: number[];
  keyPlays: KeyPlay[];
}
