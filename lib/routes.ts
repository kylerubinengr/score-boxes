/**
 * Centralized URL routing utilities for the NFL Dashboard.
 *
 * All navigable paths are built through these helpers so that
 * the URL scheme can be changed in one place.
 */

// --- Week slug ↔ params mapping ---

const PLAYOFF_SLUG_TO_ESPN: Record<string, number> = {
  "wild-card": 1,
  "divisional": 2,
  "conference": 3,
  "super-bowl": 5,
};

const ESPN_TO_PLAYOFF_SLUG: Record<number, string> = {
  1: "wild-card",
  2: "divisional",
  3: "conference",
  5: "super-bowl",
};

/** Old abbreviation → new slug (for internal conversion) */
const OLD_ABBR_TO_SLUG: Record<string, string> = {
  WC: "wild-card",
  DIV: "divisional",
  CONF: "conference",
  SB: "super-bowl",
};

const SLUG_TO_OLD_ABBR: Record<string, string> = {
  "wild-card": "WC",
  "divisional": "DIV",
  "conference": "CONF",
  "super-bowl": "SB",
};

export type WeekParams = {
  weekNum: number;
  seasonType: number; // 2 = regular, 3 = playoffs
};

/**
 * Convert a URL week slug to ESPN week number + season type.
 * Returns null if the slug is invalid.
 *
 * Examples:
 *   "week-5"      → { weekNum: 5, seasonType: 2 }
 *   "wild-card"   → { weekNum: 1, seasonType: 3 }
 */
export function weekSlugToParams(slug: string): WeekParams | null {
  // Playoff slug
  if (slug in PLAYOFF_SLUG_TO_ESPN) {
    return { weekNum: PLAYOFF_SLUG_TO_ESPN[slug], seasonType: 3 };
  }

  // Regular season: "week-{n}"
  const match = slug.match(/^week-(\d+)$/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 1 && n <= 18) {
      return { weekNum: n, seasonType: 2 };
    }
  }

  return null;
}

/**
 * Convert a week number (or old abbreviation) to a URL slug.
 *
 * Examples:
 *   5     → "week-5"
 *   "WC"  → "wild-card"
 *   "5"   → "week-5"
 */
export function weekToSlug(week: number | string): string {
  if (typeof week === "string") {
    // Old abbreviation
    if (week in OLD_ABBR_TO_SLUG) return OLD_ABBR_TO_SLUG[week];
    // Already a slug
    if (week.startsWith("week-") || week in PLAYOFF_SLUG_TO_ESPN) return week;
    // Numeric string
    const n = parseInt(week, 10);
    if (!isNaN(n)) return `week-${n}`;
    return `week-1`; // fallback
  }
  return `week-${week}`;
}

/**
 * Convert a URL slug back to the old abbreviation format used internally.
 * Regular season slugs return the numeric string.
 *
 * Examples:
 *   "wild-card" → "WC"
 *   "week-5"    → "5"
 */
export function slugToLegacyWeek(slug: string): string {
  if (slug in SLUG_TO_OLD_ABBR) return SLUG_TO_OLD_ABBR[slug];
  const match = slug.match(/^week-(\d+)$/);
  if (match) return match[1];
  return "1";
}

/**
 * Check if a slug represents a playoff week.
 */
export function isPlayoffSlug(slug: string): boolean {
  return slug in PLAYOFF_SLUG_TO_ESPN;
}

/**
 * Get the playoff display label for a slug.
 */
export function getPlayoffLabel(slug: string): string {
  const labels: Record<string, string> = {
    "wild-card": "WC",
    "divisional": "DIV",
    "conference": "CONF",
    "super-bowl": "SB",
  };
  return labels[slug] ?? slug;
}

/**
 * Get the full playoff name for a slug.
 */
export function getPlayoffFullName(slug: string): string {
  const names: Record<string, string> = {
    "wild-card": "Wild Card",
    "divisional": "Divisional",
    "conference": "Conference",
    "super-bowl": "Super Bowl",
  };
  return names[slug] ?? slug;
}

/** All playoff slugs in order */
export const PLAYOFF_SLUGS = ["wild-card", "divisional", "conference", "super-bowl"] as const;

/** ESPN week number → playoff slug */
export { ESPN_TO_PLAYOFF_SLUG };

// --- URL builders ---

export function buildScoresUrl(season: number, week: number | string): string {
  return `/scores/${season}/${weekToSlug(week)}`;
}

export function buildTeamUrl(season: number, teamAbbr: string): string {
  return `/team/${season}/${teamAbbr}`;
}

export function buildStandingsUrl(season: number): string {
  return `/standings/${season}`;
}

export function buildPerformancesUrl(season: number): string {
  return `/performances/${season}`;
}
