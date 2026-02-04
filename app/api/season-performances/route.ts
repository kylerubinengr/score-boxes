import { NextResponse } from 'next/server';
import type { SeasonPerformances, PerformanceRow } from '@/types/performances';
import { fetchAllSeasonPlays } from '@/lib/pbpData';
import { computeSeasonPerformances } from '@/lib/performanceAggregator';
import { fetchPlayerPositions } from '@/lib/rosterData';

// nflverse abbreviation → ESPN abbreviation (reverse of the map in advanced-game-stats)
const NFLVERSE_TO_ESPN: Record<string, string> = {
  WAS: 'WSH',
  LA: 'LAR',
};

function toEspnAbbr(nflverseAbbr: string): string {
  return NFLVERSE_TO_ESPN[nflverseAbbr] || nflverseAbbr;
}

/**
 * Fetch ESPN scoreboard for a given week and return a map of
 * "awayAbbr_homeAbbr" → ESPN event ID.
 */
async function fetchEspnWeekGames(
  season: number,
  week: number,
  seasonType: number
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${season}&seasontype=${seasonType}&week=${week}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return map;
    const data = await res.json();
    for (const event of data.events ?? []) {
      const competitors = event.competitions?.[0]?.competitors ?? [];
      let away = '';
      let home = '';
      for (const c of competitors) {
        if (c.homeAway === 'away') away = c.team?.abbreviation ?? '';
        if (c.homeAway === 'home') home = c.team?.abbreviation ?? '';
      }
      if (away && home) {
        map.set(`${away}_${home}`, event.id);
      }
    }
  } catch {
    // Silently fail — games without ESPN IDs will just not be clickable
  }
  return map;
}

/**
 * For the top performances, resolve ESPN game IDs by fetching scoreboards
 * for each unique week represented in the results.
 */
async function resolveEspnGameIds(
  performances: PerformanceRow[],
  season: number
): Promise<void> {
  // Collect unique (nflverseWeek) values
  const uniqueWeeks = new Set<number>();
  for (const p of performances) {
    uniqueWeeks.add(p.week);
  }

  // Fetch all week scoreboards in parallel
  const weekPromises: Array<{ nflverseWeek: number; promise: Promise<Map<string, string>> }> = [];
  for (const nflverseWeek of uniqueWeeks) {
    // nflverse weeks 1-18 = regular season (ESPN seasonType=2, week=1-18)
    // nflverse weeks 19+ = playoffs (ESPN seasonType=3, week=nflverseWeek-18)
    const isPlayoff = nflverseWeek > 18;
    const seasonType = isPlayoff ? 3 : 2;
    const espnWeek = isPlayoff ? nflverseWeek - 18 : nflverseWeek;
    weekPromises.push({
      nflverseWeek,
      promise: fetchEspnWeekGames(season, espnWeek, seasonType),
    });
  }

  const weekMaps = new Map<number, Map<string, string>>();
  const results = await Promise.all(weekPromises.map((w) => w.promise));
  weekPromises.forEach((w, i) => {
    weekMaps.set(w.nflverseWeek, results[i]);
  });

  // Match each performance to its ESPN game ID
  for (const p of performances) {
    const weekMap = weekMaps.get(p.week);
    if (!weekMap) continue;

    // Parse away and home from nflverse gameId: "2024_16_LAR_SEA"
    const parts = p.gameId.split('_');
    const awayNfl = parts[2] || '';
    const homeNfl = parts[3] || '';

    // Convert to ESPN abbreviations for matching
    const awayEspn = toEspnAbbr(awayNfl);
    const homeEspn = toEspnAbbr(homeNfl);

    const espnId = weekMap.get(`${awayEspn}_${homeEspn}`);
    if (espnId) {
      p.espnGameId = espnId;
    }
  }
}

// In-memory cache keyed by season (completed seasons never change)
const resultCache = new Map<number, SeasonPerformances>();

export const maxDuration = 60; // Allow up to 60s for streaming large CSV files

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const season = searchParams.get('season');

  if (!season) {
    return NextResponse.json(
      { error: 'season query parameter is required' },
      { status: 400 }
    );
  }

  const seasonNum = parseInt(season);
  if (isNaN(seasonNum) || seasonNum < 2000 || seasonNum > 2030) {
    return NextResponse.json(
      { error: 'Invalid season' },
      { status: 400 }
    );
  }

  // Check in-memory cache
  const cached = resultCache.get(seasonNum);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  }

  try {
    console.log(`[season-performances] Streaming full PBP CSV + roster for ${seasonNum}...`);
    const startTime = Date.now();

    // Fetch PBP plays and roster data in parallel
    const [plays, positionMap] = await Promise.all([
      fetchAllSeasonPlays(seasonNum),
      fetchPlayerPositions(seasonNum),
    ]);
    console.log(`[season-performances] Fetched ${plays.length} pass/run plays + ${positionMap.size} roster entries in ${Date.now() - startTime}ms`);

    const performances = computeSeasonPerformances(plays, seasonNum, 200, positionMap);
    console.log(`[season-performances] Computed ${performances.length} top performances in ${Date.now() - startTime}ms`);

    // Resolve ESPN game IDs for clickable rows
    await resolveEspnGameIds(performances, seasonNum);
    console.log(`[season-performances] Resolved ESPN game IDs in ${Date.now() - startTime}ms`);

    const result: SeasonPerformances = {
      season: seasonNum,
      performances,
    };

    // Cache the result
    resultCache.set(seasonNum, result);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[season-performances] Error for season ${seasonNum}:`, message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
