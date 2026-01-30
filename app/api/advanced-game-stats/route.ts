import { NextResponse } from 'next/server';
import type { AdvancedGameStats } from '@/types/advancedStats';
import { fetchGamePlays } from '@/lib/pbpData';
import { computeAdvancedStats } from '@/lib/pbpAggregator';

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

// In-memory cache for computed game stats (completed games never change)
// Persists across requests on the same warm serverless instance
const resultCache = new Map<string, AdvancedGameStats>();

export const maxDuration = 60; // Allow up to 60s for streaming large CSV files

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

  const seasonNum = parseInt(season);
  const awayAbbr = mapAbbreviation(away);
  const homeAbbr = mapAbbreviation(home);

  const gameId = buildGameId(
    seasonNum,
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
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  }

  try {
    console.log(`[advanced-game-stats] Fetching plays for ${gameId} (season ${seasonNum})...`);
    // Fetch PBP plays for this game by streaming the season CSV
    const plays = await fetchGamePlays(gameId, seasonNum);
    console.log(`[advanced-game-stats] Found ${plays.length} plays for ${gameId}`);

    if (plays.length === 0) {
      return NextResponse.json(
        { error: 'No play-by-play data found for this game' },
        { status: 404 }
      );
    }

    // Aggregate stats in pure TypeScript
    const result = computeAdvancedStats(plays, gameId, seasonNum, homeAbbr, awayAbbr);

    // Cache the result (completed games don't change)
    resultCache.set(gameId, result);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
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
