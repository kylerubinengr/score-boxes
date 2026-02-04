/**
 * NFL Season 2025-2026 Dates
 * Season starts: Thursday, September 4, 2025
 * Rollover: Every Tuesday at 6:00 AM local (Eastern used as NFL standard)
 */

/**
 * Synchronous fallback for current NFL week based on hardcoded rollover dates.
 * Use fetchCurrentNFLWeek() for accurate results from ESPN API.
 */
export function getCurrentNFLWeek(): number | 'playoffs' {
  const now = Date.now();

  // Week 1 Rollover (Tuesday after Week 1 starts)
  // September 9, 2025, 06:00:00 AM EDT (UTC-4)
  const WEEK_1_ROLLOVER = new Date('2025-09-09T06:00:00-04:00').getTime();
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

  const weeksSinceFirstRollover = Math.floor((now - WEEK_1_ROLLOVER) / MS_PER_WEEK);

  // If we are before the first Tuesday rollover, it's Week 1
  if (now < WEEK_1_ROLLOVER) {
    return 1;
  }

  // Current week is 2 + how many full weeks have passed since the first rollover
  const currentWeek = 2 + weeksSinceFirstRollover;

  if (currentWeek > 18) {
    return 'playoffs';
  }

  return currentWeek;
}

// ESPN playoff week number → dashboard route segment
const PLAYOFF_WEEK_TO_ROUTE: Record<number, string> = {
  1: 'WC',
  2: 'DIV',
  3: 'CONF',
  4: 'SB',
  5: 'SB',
};

export interface CurrentWeekInfo {
  /** Legacy dashboard route path segment (e.g. "5", "WC", "SB") */
  route: string;
  /** Human-readable URL slug (e.g. "week-5", "wild-card", "super-bowl") */
  slug: string;
  /** ESPN season type: 2 = regular season, 3 = playoffs */
  seasonType: number;
  /** ESPN week number */
  week: number;
  /** NFL season year (e.g. 2025) */
  season: number;
}

// ESPN playoff week → human-readable slug
const PLAYOFF_WEEK_TO_SLUG: Record<number, string> = {
  1: 'wild-card',
  2: 'divisional',
  3: 'conference',
  4: 'super-bowl',
  5: 'super-bowl',
};

/**
 * Fetches the current NFL week from the ESPN API.
 * Returns the dashboard route for the current/upcoming week.
 * This accounts for the actual game schedule, not just calendar dates.
 */
export async function fetchCurrentNFLWeek(): Promise<CurrentWeekInfo> {
  try {
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
      { cache: 'no-store' }
    );

    if (!res.ok) throw new Error(`ESPN API returned ${res.status}`);

    const data = await res.json();
    const seasonType: number = data.season?.type ?? 2;
    const week: number = data.week?.number ?? 1;
    const season: number = data.season?.year ?? 2025;

    if (seasonType === 3) {
      // Playoffs — map ESPN week to dashboard route
      const route = PLAYOFF_WEEK_TO_ROUTE[week] ?? 'WC';
      const slug = PLAYOFF_WEEK_TO_SLUG[week] ?? 'wild-card';
      return { route, slug, seasonType, week, season };
    }

    // Regular season
    return { route: String(week), slug: `week-${week}`, seasonType, week, season };
  } catch (e) {
    // Fallback to time-based calculation
    const fallback = getCurrentNFLWeek();
    if (fallback === 'playoffs') {
      return { route: 'WC', slug: 'wild-card', seasonType: 3, week: 1, season: 2025 };
    }
    return { route: String(fallback), slug: `week-${fallback}`, seasonType: 2, week: fallback, season: 2025 };
  }
}
