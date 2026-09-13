import { NextResponse } from 'next/server';
import { fetchGamePlays, PlayRow } from '@/lib/pbpData';
import type { WinProbabilityData, WinProbabilityPoint, KeyPlay } from '@/types/winProbability';

// ESPN abbreviation → nflverse abbreviation mapping for edge cases
const ABBR_MAP: Record<string, string> = {
  WSH: 'WAS',
  JAC: 'JAX',
  LAR: 'LA',
};

function mapAbbreviation(abbr: string): string {
  return ABBR_MAP[abbr] || abbr;
}

// ESPN playoff week → nflverse week
// ESPN uses weeks 1-5 for playoffs; nflverse uses 19-22
const ESPN_PLAYOFF_TO_NFLVERSE: Record<number, number> = {
  1: 19,  // Wild Card
  2: 20,  // Divisional
  3: 21,  // Conference Championship
  4: 22,  // Super Bowl
  5: 22,  // Super Bowl (ESPN sometimes uses week 5)
};

function buildGameId(season: number, week: number, seasonType: number, away: string, home: string): string {
  const nflverseWeek = seasonType === 3
    ? (ESPN_PLAYOFF_TO_NFLVERSE[week] ?? 18 + week)
    : week;
  const weekStr = nflverseWeek.toString().padStart(2, '0');
  return `${season}_${weekStr}_${mapAbbreviation(away)}_${mapAbbreviation(home)}`;
}

// In-memory cache for computed win probability data (completed games never change)
const resultCache = new Map<string, WinProbabilityData>();

export const maxDuration = 60; // Allow up to 60s for streaming large CSV files

async function fetchEspnWinProbability(eventId: string, homeAbbr: string, awayAbbr: string): Promise<WinProbabilityData | null> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${eventId}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;

  const data = await res.json();
  const wpEntries = data.winprobability;
  if (!wpEntries || wpEntries.length === 0) return null;

  const allPlays: Record<string, any> = {};
  const drives = data.drives || {};
  const driveList = [...(drives.previous || []), ...(drives.current ? [drives.current] : [])];
  for (const drv of driveList) {
    for (const p of (drv.plays || [])) {
      allPlays[p.id] = { ...p, driveTeamAbbr: drv.team?.abbreviation };
    }
  }

  const homeComp = data.header?.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home');
  const awayComp = data.header?.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away');
  const espnHomeAbbr = homeComp?.team?.abbreviation || homeAbbr;
  const espnAwayAbbr = awayComp?.team?.abbreviation || awayAbbr;

  const points: WinProbabilityPoint[] = [];
  let prevQuarter = 0;
  const quarterBreaks: number[] = [];

  for (const entry of wpEntries) {
    const play = allPlays[entry.playId];
    if (!play) continue;

    const quarter = play.period?.number || 1;
    const clockStr = play.clock?.displayValue || '0:00';
    const [min, sec] = clockStr.split(':').map(Number);
    const clockSeconds = (min || 0) * 60 + (sec || 0);
    const regulationSecondsPerQuarter = 900;
    const quartersRemaining = Math.max(0, 4 - quarter);
    const gameSecondsRemaining = quarter <= 4
      ? quartersRemaining * regulationSecondsPerQuarter + clockSeconds
      : clockSeconds - 600;

    if (quarter !== prevQuarter) {
      quarterBreaks.push(points.length);
      prevQuarter = quarter;
    }

    const homeWp = entry.homeWinPercentage * 100;
    const isTD = play.scoringType?.name === 'touchdown';
    const isFG = play.scoringType?.name === 'field-goal' || play.type?.text === 'Field Goal Good';
    const isScoring = isTD || isFG;

    points.push({
      playIndex: points.length,
      wp: homeWp,
      quarter,
      gameSecondsRemaining,
      description: play.text || play.shortText || '',
      isScoring,
      scoringType: isTD ? 'td' : isFG ? 'fg' : null,
      scoringTeam: isScoring ? (play.driveTeamAbbr || null) : null,
      posteam: play.driveTeamAbbr || espnHomeAbbr,
      homeScore: play.homeScore ?? 0,
      awayScore: play.awayScore ?? 0,
    });
  }

  if (points.length === 0) return null;

  for (let i = 1; i < points.length; i++) {
    if (points[i].gameSecondsRemaining >= points[i - 1].gameSecondsRemaining) {
      points[i].gameSecondsRemaining = points[i - 1].gameSecondsRemaining - 1;
    }
  }

  const keyPlays = findKeyPlays(points, 5, espnHomeAbbr);

  return {
    gameId: eventId,
    homeTeam: espnHomeAbbr,
    awayTeam: espnAwayAbbr,
    points,
    quarterBreaks,
    keyPlays,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  const season = searchParams.get('season');
  const week = searchParams.get('week');
  const seasonType = searchParams.get('seasonType');
  const away = searchParams.get('away');
  const home = searchParams.get('home');

  if (eventId) {
    const result = await fetchEspnWinProbability(eventId, home || '', away || '');
    if (!result) {
      return NextResponse.json(
        { error: 'Win probability data not available for this game' },
        { status: 404 }
      );
    }
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-cache, no-store' },
    });
  }

  if (!season || !week || !away || !home) {
    return NextResponse.json(
      { error: 'season, week, away, and home query parameters are required (or eventId for live games)' },
      { status: 400 }
    );
  }

  const seasonNum = parseInt(season);
  const homeAbbr = mapAbbreviation(home);
  const awayAbbr = mapAbbreviation(away);

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
    console.log(`[win-probability] Fetching plays for ${gameId} (season ${seasonNum})...`);
    const plays = await fetchGamePlays(gameId, seasonNum);
    console.log(`[win-probability] Found ${plays.length} plays for ${gameId}`);

    if (plays.length === 0) {
      return NextResponse.json(
        { error: 'No play-by-play data found for this game' },
        { status: 404 }
      );
    }

    const result = transformToWinProbability(plays, gameId, homeAbbr, awayAbbr);

    // Cache the result (completed games don't change)
    resultCache.set(gameId, result);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[win-probability] Error for game ${gameId}:`, message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// Play types to exclude from WP chart (these often have anomalous WP values)
const EXCLUDED_PLAY_TYPES = new Set([
  'timeout',
  'end_of_half',
  'end_quarter',
  'qb_kneel',      // Victory formation kneels can have weird WP
  'no_play',       // Penalties before snap
]);

// Valid play types that should have accurate WP
const VALID_PLAY_TYPES = new Set([
  'pass',
  'run',
  'punt',
  'kickoff',
  'field_goal',
  'extra_point',
  'qb_spike',
]);

/**
 * Check if a play should be included in the WP chart.
 * Filters out timeouts, end of quarter plays, and other non-game plays.
 */
function isValidWpPlay(play: PlayRow): boolean {
  // Must have home_wp_post data (post-play WP, so chart shows WP *after* each play)
  if (play.home_wp_post === null) return false;

  // Filter out invalid WP values (must be in 0-1 range)
  if (play.home_wp_post < 0 || play.home_wp_post > 1) return false;

  // Must have a possessing team (excludes many non-plays)
  if (!play.posteam || play.posteam === '') return false;

  // Exclude known problematic play types
  if (play.play_type && EXCLUDED_PLAY_TYPES.has(play.play_type)) return false;

  // If we have a valid play type, include it
  if (play.play_type && VALID_PLAY_TYPES.has(play.play_type)) return true;

  // For other play types, include if it's a real play (has down info or is a scoring play)
  if (play.down !== null && play.down >= 1 && play.down <= 4) return true;
  if (play.touchdown === 1) return true;
  if (play.field_goal_result) return true;

  // Exclude everything else (likely timeouts, administrative plays, etc.)
  return false;
}

/**
 * Transform play-by-play data into win probability chart format.
 * Uses home_wp field directly from nflverse (already in home team perspective).
 * Applies filtering for invalid WP values and adds end-game normalization.
 */
function transformToWinProbability(
  plays: PlayRow[],
  gameId: string,
  homeTeam: string,
  awayTeam: string
): WinProbabilityData {
  const rawPoints: WinProbabilityPoint[] = [];
  const quarterBreaks: number[] = [];
  let prevQuarter = 0;

  for (const play of plays) {
    // Skip invalid plays (timeouts, end of quarter, etc.)
    if (!isValidWpPlay(play)) continue;

    // Track quarter changes
    if (play.qtr !== null && play.qtr !== prevQuarter) {
      quarterBreaks.push(rawPoints.length);
      prevQuarter = play.qtr;
    }

    // Determine if scoring play
    let isScoring = false;
    let scoringType: 'td' | 'fg' | 'safety' | null = null;
    let scoringTeam: string | null = null;

    if (play.touchdown === 1) {
      isScoring = true;
      scoringType = 'td';
      scoringTeam = play.posteam;
    } else if (play.field_goal_result === 'made') {
      isScoring = true;
      scoringType = 'fg';
      scoringTeam = play.posteam;
    }

    // Use home_wp_post (post-play WP) so the chart value reflects the result of each play
    // Convert from 0-1 to 0-100 scale
    const homeWp = play.home_wp_post! * 100;

    // nflverse game_seconds_remaining for OT counts down from ~600 (same as a regular
    // quarter). Shift OT times to negative so they appear after regulation on the chart.
    // e.g. OT with 500s remaining → -100 (100s elapsed in OT)
    const quarter = play.qtr || 1;
    const rawSeconds = play.game_seconds_remaining ?? 0;
    const gameSeconds = quarter > 4 ? rawSeconds - 600 : rawSeconds;

    rawPoints.push({
      playIndex: rawPoints.length,
      wp: homeWp,
      quarter,
      gameSecondsRemaining: gameSeconds,
      description: play.desc || '',
      isScoring,
      scoringType,
      scoringTeam,
      posteam: play.posteam,
      homeScore: play.total_home_score || 0,
      awayScore: play.total_away_score || 0,
    });
  }

  // Ensure strictly decreasing gameSecondsRemaining so the chart line never
  // doubles back on itself. Multiple plays can share the same clock time
  // (e.g. a TD and the subsequent extra point), so we nudge duplicates.
  for (let i = 1; i < rawPoints.length; i++) {
    if (rawPoints[i].gameSecondsRemaining >= rawPoints[i - 1].gameSecondsRemaining) {
      rawPoints[i].gameSecondsRemaining = rawPoints[i - 1].gameSecondsRemaining - 1;
    }
  }

  // Apply spike smoothing to remove anomalous data points
  const points = smoothWpSpikes(rawPoints);

  // Add end-game normalization: set final WP to 100% for winner
  // The nflfastR model never quite reaches 100% even after game ends
  if (points.length > 0) {
    const lastPoint = points[points.length - 1];
    const homeWon = lastPoint.homeScore > lastPoint.awayScore;
    const awayWon = lastPoint.awayScore > lastPoint.homeScore;

    // Only add final point if game is decided (not a tie) and near end of game
    // For OT games, gameSecondsRemaining can be negative
    if ((homeWon || awayWon) && lastPoint.gameSecondsRemaining <= 120) {
      const finalWp = homeWon ? 100 : 0;

      // Place end-of-game point slightly past the last real play
      const endSeconds = Math.min(lastPoint.gameSecondsRemaining, 0) - 1;

      // Add a final "game over" point at 100% or 0%
      points.push({
        playIndex: points.length,
        wp: finalWp,
        quarter: lastPoint.quarter,
        gameSecondsRemaining: endSeconds,
        description: 'End of Game',
        isScoring: false,
        scoringType: null,
        scoringTeam: null,
        posteam: lastPoint.posteam,
        homeScore: lastPoint.homeScore,
        awayScore: lastPoint.awayScore,
      });
    }
  }

  // Reindex after smoothing and end-game point
  points.forEach((p, i) => { p.playIndex = i; });

  // Recalculate quarter breaks after smoothing
  const smoothedQuarterBreaks: number[] = [];
  let currentQtr = 0;
  points.forEach((p, i) => {
    if (p.quarter !== currentQtr) {
      smoothedQuarterBreaks.push(i);
      currentQtr = p.quarter;
    }
  });

  // Find key plays (biggest WP swings) - use smoothed data
  const keyPlays = findKeyPlays(points, 5, homeTeam);

  return { gameId, homeTeam, awayTeam, points, quarterBreaks: smoothedQuarterBreaks, keyPlays };
}

/**
 * Remove anomalous WP spikes that are likely data errors.
 * A spike is when WP changes drastically and then immediately returns.
 */
function smoothWpSpikes(points: WinProbabilityPoint[]): WinProbabilityPoint[] {
  if (points.length < 3) return points;

  const result: WinProbabilityPoint[] = [];
  const SPIKE_THRESHOLD = 25; // WP change of 25%+ is suspicious if it immediately reverses

  for (let i = 0; i < points.length; i++) {
    const prev = result[result.length - 1];
    const current = points[i];
    const next = points[i + 1];

    // First point always included
    if (!prev) {
      result.push(current);
      continue;
    }

    // Last point always included
    if (!next) {
      result.push(current);
      continue;
    }

    // Check if this is a spike (big change that immediately reverses)
    const changeFromPrev = Math.abs(current.wp - prev.wp);
    const changeToNext = Math.abs(next.wp - current.wp);
    const prevToNextChange = Math.abs(next.wp - prev.wp);

    // It's a spike if:
    // 1. Big change from prev AND big change to next (both > threshold)
    // 2. But prev and next are relatively close to each other
    const isSpike = changeFromPrev > SPIKE_THRESHOLD &&
                    changeToNext > SPIKE_THRESHOLD &&
                    prevToNextChange < SPIKE_THRESHOLD;

    if (isSpike) {
      // Skip this point (it's an anomaly)
      console.log(`[win-probability] Removed spike at play ${i}: ${prev.wp.toFixed(1)}% -> ${current.wp.toFixed(1)}% -> ${next.wp.toFixed(1)}%`);
      continue;
    }

    result.push(current);
  }

  return result;
}

/**
 * Find the plays with the biggest win probability swings.
 * wpSwing is signed from the home team's perspective (positive = good for home).
 */
function findKeyPlays(points: WinProbabilityPoint[], count: number, homeTeam: string): KeyPlay[] {
  if (points.length < 2) return [];

  const swings: { index: number; absSwing: number; homeSwing: number; point: WinProbabilityPoint }[] = [];

  for (let i = 1; i < points.length; i++) {
    const homeSwing = points[i].wp - points[i - 1].wp;
    swings.push({ index: i, absSwing: Math.abs(homeSwing), homeSwing, point: points[i] });
  }

  return swings
    .sort((a, b) => b.absSwing - a.absSwing)
    .slice(0, count)
    .map(({ index, homeSwing, point }) => ({
      playIndex: index,
      wpSwing: point.posteam === homeTeam ? homeSwing : -homeSwing,
      description: point.description,
      quarter: point.quarter,
      team: point.posteam,
    }));
}
