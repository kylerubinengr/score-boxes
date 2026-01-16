import { Game, Team, PlayoffTeam, PlayoffPicture, WeatherInfo } from "@/types/nfl";

// Mock Teams
export const mockTeamKC: Team = {
  id: "12",
  name: "Kansas City Chiefs",
  abbreviation: "KC",
  record: "14-1",
  logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
  clinchedPlayoffs: true,
  color: "#E31837",
  colors: {
    primary: "#E31837",
    lightAccent: "#FFB81C",
    darkAccent: "#000000"
  }
};

export const mockTeamBUF: Team = {
  id: "2",
  name: "Buffalo Bills",
  abbreviation: "BUF",
  record: "12-3",
  logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",
  clinchedPlayoffs: true,
  color: "#00338D",
  colors: {
    primary: "#00338D",
    lightAccent: "#C60C30",
    darkAccent: "#00338D"
  }
};

export const mockTeamSF: Team = {
  id: "25",
  name: "San Francisco 49ers",
  abbreviation: "SF",
  record: "11-4",
  logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png",
  clinchedPlayoffs: false,
  color: "#AA0000",
  colors: {
    primary: "#AA0000",
    lightAccent: "#B3995D",
    darkAccent: "#000000"
  }
};

export const mockWeather: WeatherInfo = {
  temperature: 45,
  condition: "Partly Cloudy",
  windSpeed: 10,
  precipChance: 20,
  lastUpdated: Date.now()
};

// Mock Pre-Game
export const mockGamePre: Game = {
  id: "401671808",
  week: 17,
  season: 2025,
  seasonType: 2,
  date: "2025-01-20T01:15Z",
  venue: "Arrowhead Stadium",
  venueLocation: "Kansas City, MO",
  homeTeam: mockTeamKC,
  awayTeam: mockTeamBUF,
  weather: mockWeather,
  broadcast: "NBC",
  status: "pre",
  indoor: false,
};

// Mock Live Game
export const mockGameLive: Game = {
  id: "401671809",
  week: 17,
  season: 2025,
  seasonType: 2,
  displayClock: "7:42",
  period: 2,
  date: "2025-01-19T18:00Z",
  venue: "Levi's Stadium",
  venueLocation: "Santa Clara, CA",
  homeTeam: mockTeamSF,
  awayTeam: mockTeamBUF,
  weather: { ...mockWeather, temperature: 62 },
  broadcast: "FOX",
  status: "in",
  isLive: true,
  indoor: false,
  homeScore: 14,
  awayScore: 10,
  scoringPlays: [
    {
      id: "4016718091",
      quarter: 1,
      clock: "10:23",
      text: "Josh Allen 5 Yd pass to Stefon Diggs (Tyler Bass Kick)",
      type: "TD",
      team: {
        id: "2",
        abbreviation: "BUF",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png"
      },
      scoreValue: 7,
      awayScore: 7,
      homeScore: 0
    },
    {
      id: "4016718092",
      quarter: 1,
      clock: "3:15",
      text: "Brock Purdy 12 Yd pass to Deebo Samuel (Jake Moody Kick)",
      type: "TD",
      team: {
        id: "25",
        abbreviation: "SF",
        logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png"
      },
      scoreValue: 7,
      awayScore: 7,
      homeScore: 7
    },
  ],
  linescores: {
    home: [
      { displayValue: "7", label: "Q1" },
      { displayValue: "7", label: "Q2" },
      { displayValue: "0", label: "Q3" },
      { displayValue: "0", label: "Q4" },
    ],
    away: [
      { displayValue: "7", label: "Q1" },
      { displayValue: "3", label: "Q2" },
      { displayValue: "0", label: "Q3" },
      { displayValue: "0", label: "Q4" },
    ]
  }
};

// Mock Post-Game (Final)
export const mockGamePost: Game = {
  id: "401671810",
  week: 17,
  season: 2025,
  seasonType: 2,
  date: "2025-01-18T18:00Z",
  venue: "Arrowhead Stadium",
  venueLocation: "Kansas City, MO",
  homeTeam: mockTeamKC,
  awayTeam: mockTeamSF,
  weather: mockWeather,
  broadcast: "CBS",
  status: "post",
  indoor: false,
  homeScore: 28,
  awayScore: 21,
  winnerId: "12",
  boxscore: {
    home: {
      passingYards: 312,
      rushingYards: 98,
      turnovers: 1,
      sacks: 2,
      interceptions: 1,
      defensiveTD: 0
    },
    away: {
      passingYards: 285,
      rushingYards: 105,
      turnovers: 2,
      sacks: 3,
      interceptions: 2,
      defensiveTD: 0
    }
  },
  matchupStats: {
    home: {
      passingLeader: {
        name: "Patrick Mahomes",
        value: "312 YDS, 3 TD",
        category: "passing",
        teamAbbreviation: "KC",
        espnId: "3139477"
      },
      rushingLeader: {
        name: "Isiah Pacheco",
        value: "98 YDS, 1 TD",
        category: "rushing",
        teamAbbreviation: "KC",
        espnId: "4430737"
      },
      receivingLeader: {
        name: "Travis Kelce",
        value: "8 REC, 115 YDS",
        category: "receiving",
        teamAbbreviation: "KC",
        espnId: "15847"
      }
    },
    away: {
      passingLeader: {
        name: "Brock Purdy",
        value: "285 YDS, 2 TD, 2 INT",
        category: "passing",
        teamAbbreviation: "SF",
        espnId: "4361741"
      },
      rushingLeader: {
        name: "Christian McCaffrey",
        value: "105 YDS, 1 TD",
        category: "rushing",
        teamAbbreviation: "SF",
        espnId: "3116385"
      },
      receivingLeader: {
        name: "Deebo Samuel",
        value: "6 REC, 92 YDS",
        category: "receiving",
        teamAbbreviation: "SF",
        espnId: "3915511"
      }
    }
  }
};

// Mock Playoff Teams
export const mockPlayoffTeamsAFC: PlayoffTeam[] = [
  {
    id: "12",
    name: "Kansas City Chiefs",
    abbreviation: "KC",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
    seed: 1,
    record: "14-1",
    wins: 14,
    losses: 1,
    ties: 0,
    pointsFor: 428,
    pointsAgainst: 298,
    differential: 130,
    streak: "W5",
    winPercentage: 0.933,
    clinchStatus: "CLINCHED_HOMEFIELD"
  },
  {
    id: "2",
    name: "Buffalo Bills",
    abbreviation: "BUF",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",
    seed: 2,
    record: "12-3",
    wins: 12,
    losses: 3,
    ties: 0,
    pointsFor: 398,
    pointsAgainst: 289,
    differential: 109,
    streak: "W4",
    winPercentage: 0.800,
    clinchStatus: "CLINCHED_DIVISION"
  },
  {
    id: "33",
    name: "Baltimore Ravens",
    abbreviation: "BAL",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png",
    seed: 3,
    record: "11-4",
    wins: 11,
    losses: 4,
    ties: 0,
    pointsFor: 378,
    pointsAgainst: 315,
    differential: 63,
    streak: "W1",
    winPercentage: 0.733,
    clinchStatus: "CLINCHED_PLAYOFF"
  },
  {
    id: "23",
    name: "Pittsburgh Steelers",
    abbreviation: "PIT",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png",
    seed: 4,
    record: "10-5",
    wins: 10,
    losses: 5,
    ties: 0,
    pointsFor: 342,
    pointsAgainst: 318,
    differential: 24,
    streak: "W1",
    winPercentage: 0.667,
    clinchStatus: "NONE",
    scenarios: "Clinches North with a win OR Ravens loss"
  },
  {
    id: "24",
    name: "Los Angeles Chargers",
    abbreviation: "LAC",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png",
    seed: 5,
    record: "11-4",
    wins: 11,
    losses: 4,
    ties: 0,
    pointsFor: 405,
    pointsAgainst: 312,
    differential: 93,
    streak: "W2",
    winPercentage: 0.733,
    clinchStatus: "NONE"
  },
  {
    id: "34",
    name: "Houston Texans",
    abbreviation: "HOU",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png",
    seed: 6,
    record: "10-5",
    wins: 10,
    losses: 5,
    ties: 0,
    pointsFor: 365,
    pointsAgainst: 328,
    differential: 37,
    streak: "L2",
    winPercentage: 0.667,
    clinchStatus: "NONE"
  },
  {
    id: "7",
    name: "Denver Broncos",
    abbreviation: "DEN",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/den.png",
    seed: 7,
    record: "9-6",
    wins: 9,
    losses: 6,
    ties: 0,
    pointsFor: 325,
    pointsAgainst: 342,
    differential: -17,
    streak: "L1",
    winPercentage: 0.600,
    clinchStatus: "NONE"
  }
];

export const mockPlayoffTeamsNFC: PlayoffTeam[] = [
  {
    id: "26",
    name: "Seattle Seahawks",
    abbreviation: "SEA",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png",
    seed: 1,
    record: "13-2",
    wins: 13,
    losses: 2,
    ties: 0,
    pointsFor: 432,
    pointsAgainst: 298,
    differential: 134,
    streak: "W5",
    winPercentage: 0.867,
    clinchStatus: "CLINCHED_HOMEFIELD"
  },
  {
    id: "3",
    name: "Chicago Bears",
    abbreviation: "CHI",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png",
    seed: 2,
    record: "12-3",
    wins: 12,
    losses: 3,
    ties: 0,
    pointsFor: 385,
    pointsAgainst: 312,
    differential: 73,
    streak: "W2",
    winPercentage: 0.800,
    clinchStatus: "CLINCHED_DIVISION"
  },
  {
    id: "21",
    name: "Philadelphia Eagles",
    abbreviation: "PHI",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png",
    seed: 3,
    record: "11-4",
    wins: 11,
    losses: 4,
    ties: 0,
    pointsFor: 368,
    pointsAgainst: 325,
    differential: 43,
    streak: "L1",
    winPercentage: 0.733,
    clinchStatus: "CLINCHED_PLAYOFF"
  },
  {
    id: "29",
    name: "Carolina Panthers",
    abbreviation: "CAR",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png",
    seed: 4,
    record: "9-6",
    wins: 9,
    losses: 6,
    ties: 0,
    pointsFor: 298,
    pointsAgainst: 315,
    differential: -17,
    streak: "W1",
    winPercentage: 0.600,
    clinchStatus: "NONE"
  },
  {
    id: "25",
    name: "San Francisco 49ers",
    abbreviation: "SF",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png",
    seed: 5,
    record: "11-4",
    wins: 11,
    losses: 4,
    ties: 0,
    pointsFor: 412,
    pointsAgainst: 289,
    differential: 123,
    streak: "W3",
    winPercentage: 0.733,
    clinchStatus: "NONE"
  },
  {
    id: "14",
    name: "Los Angeles Rams",
    abbreviation: "LAR",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png",
    seed: 6,
    record: "10-5",
    wins: 10,
    losses: 5,
    ties: 0,
    pointsFor: 395,
    pointsAgainst: 318,
    differential: 77,
    streak: "W1",
    winPercentage: 0.667,
    clinchStatus: "NONE"
  },
  {
    id: "9",
    name: "Green Bay Packers",
    abbreviation: "GB",
    logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png",
    seed: 7,
    record: "9-5-1",
    wins: 9,
    losses: 5,
    ties: 1,
    pointsFor: 342,
    pointsAgainst: 325,
    differential: 17,
    streak: "T1",
    winPercentage: 0.633,
    clinchStatus: "NONE"
  }
];

export const mockPlayoffPicture: PlayoffPicture = {
  afc: {
    name: "AFC",
    teams: mockPlayoffTeamsAFC.slice(0, 7),
    inTheHunt: [
      {
        id: "11",
        name: "Indianapolis Colts",
        abbreviation: "IND",
        logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png",
        seed: 8,
        record: "9-6",
        wins: 9,
        losses: 6,
        ties: 0,
        pointsFor: 325,
        pointsAgainst: 342,
        differential: -17,
        streak: "L1",
        winPercentage: 0.600,
        clinchStatus: "NONE",
        gamesBehind: "1.0 GB"
      }
    ],
    eliminated: [
      {
        id: "10",
        name: "Tennessee Titans",
        abbreviation: "TEN",
        logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png",
        seed: 15,
        record: "3-12",
        wins: 3,
        losses: 12,
        ties: 0,
        pointsFor: 245,
        pointsAgainst: 398,
        differential: -153,
        streak: "L6",
        winPercentage: 0.200,
        clinchStatus: "ELIMINATED"
      }
    ],
    allTeams: [
      ...mockPlayoffTeamsAFC,
      {
        id: "11",
        name: "Indianapolis Colts",
        abbreviation: "IND",
        logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png",
        seed: 8,
        record: "9-6",
        wins: 9,
        losses: 6,
        ties: 0,
        pointsFor: 325,
        pointsAgainst: 342,
        differential: -17,
        streak: "L1",
        winPercentage: 0.600,
        clinchStatus: "NONE",
        gamesBehind: "1.0 GB"
      }
    ]
  },
  nfc: {
    name: "NFC",
    teams: mockPlayoffTeamsNFC.slice(0, 7),
    inTheHunt: [],
    eliminated: [],
    allTeams: mockPlayoffTeamsNFC
  }
};

// ESPN API Response Mocks
export const mockScoreboardResponse = {
  leagues: [{
    id: "28",
    uid: "s:20~l:28",
    name: "National Football League",
    abbreviation: "NFL"
  }],
  season: {
    year: 2025,
    type: 2
  },
  week: {
    number: 17
  },
  events: [
    {
      id: "401671808",
      uid: "s:20~l:28~e:401671808",
      date: "2025-01-20T01:15Z",
      name: "Buffalo Bills at Kansas City Chiefs",
      shortName: "BUF @ KC",
      season: {
        year: 2025,
        type: 2
      },
      week: {
        number: 17
      },
      competitions: [{
        id: "401671808",
        uid: "s:20~l:28~e:401671808~c:401671808",
        date: "2025-01-20T01:15Z",
        attendance: 0,
        type: {
          id: "1"
        },
        timeValid: true,
        neutralSite: false,
        conferenceCompetition: false,
        recent: false,
        venue: {
          id: "3622",
          fullName: "Arrowhead Stadium",
          address: {
            city: "Kansas City",
            state: "MO"
          },
          indoor: false
        },
        competitors: [
          {
            id: "12",
            uid: "s:20~l:28~t:12",
            type: "team",
            order: 0,
            homeAway: "home",
            team: {
              id: "12",
              uid: "s:20~l:28~t:12",
              location: "Kansas City",
              name: "Chiefs",
              abbreviation: "KC",
              displayName: "Kansas City Chiefs",
              shortDisplayName: "Chiefs",
              color: "e31837",
              alternateColor: "ffb81c",
              isActive: true,
              logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png"
            },
            score: "0",
            records: [{
              name: "overall",
              abbreviation: "overall",
              type: "total",
              summary: "14-1"
            }]
          },
          {
            id: "2",
            uid: "s:20~l:28~t:2",
            type: "team",
            order: 1,
            homeAway: "away",
            team: {
              id: "2",
              uid: "s:20~l:28~t:2",
              location: "Buffalo",
              name: "Bills",
              abbreviation: "BUF",
              displayName: "Buffalo Bills",
              shortDisplayName: "Bills",
              color: "00338d",
              alternateColor: "c60c30",
              isActive: true,
              logo: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png"
            },
            score: "0",
            records: [{
              name: "overall",
              abbreviation: "overall",
              type: "total",
              summary: "12-3"
            }]
          }
        ],
        status: {
          clock: 0,
          displayClock: "0:00",
          period: 0,
          type: {
            id: "1",
            name: "STATUS_SCHEDULED",
            state: "pre",
            completed: false,
            description: "Scheduled",
            detail: "1/20 - 1:15 AM EST",
            shortDetail: "1/20 - 1:15 AM EST"
          }
        },
        broadcasts: [{
          market: "national",
          names: ["NBC"]
        }],
        weather: {
          displayValue: "Partly Cloudy",
          temperature: 45,
          highTemperature: 50,
          conditionId: "2",
          link: {
            language: "en-US",
            text: "Weather",
            href: "http://www.accuweather.com/"
          }
        }
      }],
      status: {
        clock: 0,
        displayClock: "0:00",
        period: 0,
        type: {
          id: "1",
          name: "STATUS_SCHEDULED",
          state: "pre",
          completed: false,
          description: "Scheduled",
          detail: "1/20 - 1:15 AM EST",
          shortDetail: "1/20 - 1:15 AM EST"
        }
      }
    }
  ]
};

export const mockStandingsResponse = {
  uid: "s:20~l:28~g:9",
  id: "9",
  name: "NFL Standings",
  abbreviation: "NFL",
  children: [
    {
      uid: "s:20~l:28~g:9~c:8",
      id: "8",
      name: "American Football Conference",
      abbreviation: "AFC",
      standings: {
        id: "0",
        name: "AFC",
        displayName: "AFC",
        entries: mockPlayoffTeamsAFC.map(team => ({
          team: {
            id: team.id,
            uid: `s:20~l:28~t:${team.id}`,
            displayName: team.name,
            abbreviation: team.abbreviation,
            logo: team.logoUrl
          },
          stats: [
            { name: "wins", type: "wins", displayValue: team.wins.toString(), value: team.wins },
            { name: "losses", type: "losses", displayValue: team.losses.toString(), value: team.losses },
            { name: "ties", type: "ties", displayValue: team.ties.toString(), value: team.ties },
            { name: "winpercent", type: "winpercent", displayValue: team.winPercentage.toFixed(3), value: team.winPercentage },
            { name: "pointsFor", type: "pointsfor", displayValue: team.pointsFor.toString(), value: team.pointsFor },
            { name: "pointsAgainst", type: "pointsagainst", displayValue: team.pointsAgainst.toString(), value: team.pointsAgainst },
            { name: "differential", type: "differential", displayValue: team.differential.toString(), value: team.differential },
            { name: "streak", type: "streak", displayValue: team.streak, value: team.streak },
            { name: "playoffseed", type: "playoffseed", displayValue: team.seed.toString(), value: team.seed },
            {
              name: "clincher",
              type: "clincher",
              displayValue: team.clinchStatus === "CLINCHED_HOMEFIELD" ? "*" :
                           team.clinchStatus === "CLINCHED_DIVISION" ? "z" :
                           team.clinchStatus === "CLINCHED_PLAYOFF" ? "x" :
                           team.clinchStatus === "ELIMINATED" ? "e" : "",
              value: team.clinchStatus === "CLINCHED_HOMEFIELD" ? "*" :
                     team.clinchStatus === "CLINCHED_DIVISION" ? "z" :
                     team.clinchStatus === "CLINCHED_PLAYOFF" ? "x" :
                     team.clinchStatus === "ELIMINATED" ? "e" : ""
            },
            { name: "gamesbehind", type: "gamesbehind", displayValue: team.gamesBehind || "", value: team.gamesBehind || "" }
          ]
        }))
      }
    },
    {
      uid: "s:20~l:28~g:9~c:7",
      id: "7",
      name: "National Football Conference",
      abbreviation: "NFC",
      standings: {
        id: "1",
        name: "NFC",
        displayName: "NFC",
        entries: mockPlayoffTeamsNFC.map(team => ({
          team: {
            id: team.id,
            uid: `s:20~l:28~t:${team.id}`,
            displayName: team.name,
            abbreviation: team.abbreviation,
            logo: team.logoUrl
          },
          stats: [
            { name: "wins", type: "wins", displayValue: team.wins.toString(), value: team.wins },
            { name: "losses", type: "losses", displayValue: team.losses.toString(), value: team.losses },
            { name: "ties", type: "ties", displayValue: team.ties.toString(), value: team.ties },
            { name: "winpercent", type: "winpercent", displayValue: team.winPercentage.toFixed(3), value: team.winPercentage },
            { name: "pointsFor", type: "pointsfor", displayValue: team.pointsFor.toString(), value: team.pointsFor },
            { name: "pointsAgainst", type: "pointsagainst", displayValue: team.pointsAgainst.toString(), value: team.pointsAgainst },
            { name: "differential", type: "differential", displayValue: team.differential.toString(), value: team.differential },
            { name: "streak", type: "streak", displayValue: team.streak, value: team.streak },
            { name: "playoffseed", type: "playoffseed", displayValue: team.seed.toString(), value: team.seed },
            {
              name: "clincher",
              type: "clincher",
              displayValue: team.clinchStatus === "CLINCHED_HOMEFIELD" ? "*" :
                           team.clinchStatus === "CLINCHED_DIVISION" ? "z" :
                           team.clinchStatus === "CLINCHED_PLAYOFF" ? "x" :
                           team.clinchStatus === "ELIMINATED" ? "e" : "",
              value: team.clinchStatus === "CLINCHED_HOMEFIELD" ? "*" :
                     team.clinchStatus === "CLINCHED_DIVISION" ? "z" :
                     team.clinchStatus === "CLINCHED_PLAYOFF" ? "x" :
                     team.clinchStatus === "ELIMINATED" ? "e" : ""
            },
            { name: "gamesbehind", type: "gamesbehind", displayValue: team.gamesBehind || "", value: team.gamesBehind || "" }
          ]
        }))
      }
    }
  ]
};
