export type GameStatus = 'pre' | 'in' | 'post';

export type Team = {
  id: string;
  name: string;
  abbreviation: string;
  record: string;
  logoUrl: string;
  clinchedPlayoffs: boolean;
  color?: string;
  colors?: {
    primary: string;
    lightAccent: string;
    darkAccent: string;
  };
};

export type WeatherInfo = {
  temperature: number;
  condition: string;
  windSpeed: number;
  precipChance: number;
  lastUpdated?: number;
};

export type StatLeader = {
  name: string;
  value: string;
  category: string;
  teamAbbreviation: string;
  logoUrl?: string;
  detailedStats?: { [key: string]: string };
  rank?: number;
  espnId?: string;
};

export type BoxScoreData = {
  passing: {
    headers: string[];
    players: { name: string; stats: string[] }[];
    totals: string[];
  };
  rushing: {
    headers: string[];
    players: { name: string; stats: string[] }[];
    totals: string[];
  };
  receiving: {
    headers: string[];
    players: { name: string; stats: string[] }[];
    totals: string[];
  };
  fumbles?: {
    headers: string[];
    players: { name: string; stats: string[] }[];
    totals: string[];
  };
};

export type MatchupStats = {
  home: {
    passingLeader?: StatLeader;
    rushingLeader?: StatLeader;
    receivingLeader?: StatLeader;
    boxscore?: BoxScoreData;
  };
  away: {
    passingLeader?: StatLeader;
    rushingLeader?: StatLeader;
    receivingLeader?: StatLeader;
    boxscore?: BoxScoreData;
  };
};

export type PlayoffTeam = {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl: string;
  seed: number;
  record: string;

  // Split W-L-T values for standings table
  wins: number;
  losses: number;
  ties: number;

  // Stats for standings table
  pointsFor: number;
  pointsAgainst: number;
  differential: number;
  streak: string;
  winPercentage: number;

  clinchStatus: 'CLINCHED_HOMEFIELD' | 'CLINCHED_DIVISION' | 'CLINCHED_PLAYOFF' | 'ELIMINATED' | 'NONE';
  tiebreakerReason?: string;
  magicNumber?: number;
  scenarios?: string;
  gamesBehind?: string;
};

export type PlayoffConference = {
  name: 'AFC' | 'NFC';
  teams: PlayoffTeam[];
  inTheHunt: PlayoffTeam[];
  eliminated: PlayoffTeam[];
  allTeams: PlayoffTeam[];  // All 16 teams for standings table
};

export type PlayoffPicture = {
  afc: PlayoffConference;
  nfc: PlayoffConference;
};

export type TeamBoxscore = {
    passingYards: number;
    rushingYards: number;
    turnovers: number;
    sacks?: number;
    interceptions?: number;
    defensiveTD?: number;
};

export type ScoringPlay = {
    id: string;
    quarter: number;
    clock: string;
    text: string;
    type: string;
    team: {
        id: string;
        abbreviation: string;
        logo: string;
    };
    scoreValue: number;
    awayScore: number;
    homeScore: number;
};

export type Linescore = {
    displayValue: string;
    label: string;
};

export type PlayByPlay = {
    id: string;
    driveId?: string;
    clock: string;
    text: string;
    type: string;
    down?: number;
    distance?: number;
    yardLine?: number;
    yardsGained?: number;
    quarter?: number;
    isScore?: boolean;
    wallclock?: string;
    team?: {
        id: string;
        logo: string;
    };
};

export type Drive = {
    id: string;
    description: string;
    team: { id: string; logo: string; abbreviation: string; color?: string };
    result: string;
    plays: PlayByPlay[];
    yards: number;
    timeElapsed: string;
    playCount: number;
    startClock: string;
    isScore: boolean;
    startQuarter?: number;
    endQuarter?: number;
    homeScoreAfter?: number;
    awayScoreAfter?: number;
};

export type Game = {
  id: string;
  week: number;
  season: number;
  seasonType: number;
  displayClock?: string;
  period?: number;
  date: string;
  venue: string;
  venueLocation: string;
  homeTeam: Team;
  awayTeam: Team;
  weather: WeatherInfo;
  broadcast: string;
  isLive?: boolean;
  indoor: boolean;
  matchupStats?: MatchupStats;
  scoringPlays?: ScoringPlay[];
  linescores?: { home: Linescore[], away: Linescore[] };
  // Historical/Result data
  status: GameStatus;
  homeScore?: number;
  awayScore?: number;
  winnerId?: string;
  boxscore?: { home: TeamBoxscore, away: TeamBoxscore };
  drives?: Drive[];
};

// Playoff Bracket Types
export type PlayoffRound =
  | 'WILD_CARD'    // Week 1
  | 'DIVISIONAL'   // Week 2
  | 'CHAMPIONSHIP' // Week 3
  | 'SUPER_BOWL';  // Week 5

export type BracketGame = {
  id: string | null;           // null for TBD games
  game?: Game;                 // Actual ESPN game if available
  round: PlayoffRound;
  position: number;            // 0-2 for Wild Card, 0-1 for Divisional, etc.
  homeTeam?: Team | PlayoffTeam;
  awayTeam?: Team | PlayoffTeam;
  homeSeed?: number;
  awaySeed?: number;
  status: 'TBD' | 'SCHEDULED' | 'LIVE' | 'FINAL';
  winnerId?: string;
  advancesTo?: string;         // Game ID of next round
  isByeWeek?: boolean;
};

export type BracketRoundData = {
  round: PlayoffRound;
  week: number;                // ESPN week (1-5)
  games: BracketGame[];
};

export type BracketStructure = {
  conference: 'AFC' | 'NFC';
  rounds: BracketRoundData[];
  lastUpdated: number;
};
