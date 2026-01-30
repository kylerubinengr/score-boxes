import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import type { AdvancedGameStats, AdvancedTeamStats, AdvancedPlayerStats, AdvancedPlayerStat } from '@/types/advancedStats';

// ESPN abbreviation → nflverse abbreviation mapping for edge cases
const ABBR_MAP: Record<string, string> = {
  WSH: 'WAS',
  JAC: 'JAX',
  LAR: 'LA',
};

function mapAbbreviation(abbr: string): string {
  return ABBR_MAP[abbr] || abbr;
}

function buildGameId(season: number, week: number, seasonType: number, away: string, home: string): string {
  // ESPN uses seasonType=3 for playoffs with weeks 1-5
  // nflfastR uses weeks 19-22+ for playoffs (18 + ESPN week)
  const nflverseWeek = seasonType === 3 ? 18 + week : week;
  const weekStr = nflverseWeek.toString().padStart(2, '0');
  return `${season}_${weekStr}_${mapAbbreviation(away)}_${mapAbbreviation(home)}`;
}

// Python script outputs team_stats as { column: { rowLabel: value } }
// e.g. { "EPA/Play": { "All Plays": 0.3, "Rush": 0.04, ... }, "Success Rate": { ... }, ... }
type PythonTeamStatsDict = {
  'EPA/Play': Record<string, number | null>;
  'Success Rate': Record<string, number | null>;
  '1st Down %': Record<string, number | null>;
  'Plays': Record<string, number>;
};

type PythonPlayerRecord = {
  passer_player_name?: string;
  rusher_player_name?: string;
  receiver_player_name?: string;
  'EPA/play': number | null;
  'Total EPA': number | null;
  SR: number | null;
  '1st%': number | null;
  Count: number;
};

type PythonOutput = {
  game_id: string;
  season: number;
  home_team: string;
  away_team: string;
  team_stats: {
    home: PythonTeamStatsDict;
    away: PythonTeamStatsDict;
  };
  player_stats: {
    home: { passing: PythonPlayerRecord[]; rushing: PythonPlayerRecord[]; receiving: PythonPlayerRecord[] };
    away: { passing: PythonPlayerRecord[]; rushing: PythonPlayerRecord[]; receiving: PythonPlayerRecord[] };
  };
  error?: string;
};

const SPLIT_KEY_MAP: Record<string, keyof AdvancedTeamStats> = {
  'All Plays': 'allPlays',
  'Rush': 'rush',
  'Pass': 'pass',
  'Early Downs (1st/2nd)': 'earlyDowns',
  'Early Rush': 'earlyRush',
  'Early Pass': 'earlyPass',
  'Late Downs (3rd/4th)': 'lateDowns',
  'Late Rush': 'lateRush',
  'Late Pass': 'latePass',
};

function transformTeamStats(raw: PythonTeamStatsDict): AdvancedTeamStats {
  const result = {} as AdvancedTeamStats;
  for (const [pythonKey, tsKey] of Object.entries(SPLIT_KEY_MAP)) {
    result[tsKey] = {
      epaPerPlay: raw['EPA/Play']?.[pythonKey] ?? null,
      successRate: raw['Success Rate']?.[pythonKey] ?? null,
      firstDownPct: raw['1st Down %']?.[pythonKey] ?? null,
      plays: raw['Plays']?.[pythonKey] ?? 0,
    };
  }
  return result;
}

function transformPlayerStats(
  passing: PythonPlayerRecord[],
  rushing: PythonPlayerRecord[],
  receiving: PythonPlayerRecord[]
): AdvancedPlayerStats {
  const mapPlayer = (rec: PythonPlayerRecord, nameKey: string): AdvancedPlayerStat => ({
    name: (rec as Record<string, unknown>)[nameKey] as string || 'Unknown',
    epaPerPlay: rec['EPA/play'] ?? null,
    totalEpa: rec['Total EPA'] ?? null,
    successRate: rec.SR ?? null,
    firstDownPct: rec['1st%'] ?? null,
    plays: rec.Count ?? 0,
  });

  return {
    dropbacks: passing.map(r => mapPlayer(r, 'passer_player_name')),
    rushAttempts: rushing.map(r => mapPlayer(r, 'rusher_player_name')),
    passTargets: receiving.map(r => mapPlayer(r, 'receiver_player_name')),
  };
}

// In-memory cache for computed game stats (completed games never change)
const resultCache = new Map<string, AdvancedGameStats>();

function runPythonScript(gameId: string): Promise<PythonOutput> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'nflfastr', 'game_analysis.py');

    execFile(
      'python3',
      [scriptPath, '--game_id', gameId],
      { timeout: 120000, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Python script failed: ${error.message}. stderr: ${stderr}`));
          return;
        }
        try {
          const parsed = JSON.parse(stdout);
          if (parsed.error) {
            reject(new Error(parsed.error));
            return;
          }
          resolve(parsed as PythonOutput);
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${(e as Error).message}. stdout: ${stdout.slice(0, 500)}`));
        }
      }
    );
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get('season');
  const week = searchParams.get('week');
  const seasonType = searchParams.get('seasonType');
  const away = searchParams.get('away');
  const home = searchParams.get('home');

  if (!season || !week || !away || !home) {
    return NextResponse.json(
      { error: 'season, week, away, and home query parameters are required' },
      { status: 400 }
    );
  }

  const gameId = buildGameId(
    parseInt(season),
    parseInt(week),
    parseInt(seasonType || '2'),
    away,
    home
  );

  // Check in-memory cache first
  const cached = resultCache.get(gameId);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }

  try {
    const rawData = await runPythonScript(gameId);

    const result: AdvancedGameStats = {
      gameId: rawData.game_id,
      season: rawData.season,
      homeTeam: rawData.home_team,
      awayTeam: rawData.away_team,
      teamStats: {
        home: transformTeamStats(rawData.team_stats.home),
        away: transformTeamStats(rawData.team_stats.away),
      },
      playerStats: {
        home: transformPlayerStats(
          rawData.player_stats.home.passing,
          rawData.player_stats.home.rushing,
          rawData.player_stats.home.receiving
        ),
        away: transformPlayerStats(
          rawData.player_stats.away.passing,
          rawData.player_stats.away.rushing,
          rawData.player_stats.away.receiving
        ),
      },
    };

    // Cache the result (completed games don't change)
    resultCache.set(gameId, result);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[advanced-game-stats] Error for game ${gameId}:`, message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
