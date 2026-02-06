import Papa from 'papaparse';
import https from 'https';
import http from 'http';

/**
 * Raw play-by-play row from nflverse CSV.
 * Only the columns needed for advanced stats aggregation.
 */
export interface PlayRow {
  game_id: string;
  play_type: string;
  epa: number | null;
  success: number | null;
  first_down: number | null;
  wp: number | null;
  qb_dropback: number | null;
  qb_kneel: number | null;
  qb_spike: number | null;
  down: number | null;
  posteam: string;
  defteam: string;
  season_type: string;
  pass: number | null;
  rush: number | null;
  two_point_attempt: number | null;
  aborted_play: number | null;
  yards_gained: number | null;
  passer_player_name: string | null;
  passer_player_id: string | null;
  rusher_player_name: string | null;
  rusher_player_id: string | null;
  receiver_player_name: string | null;
  rush_attempt: number | null;
  pass_attempt: number | null;
  // Counting stats columns (used by performances aggregation)
  complete_pass: number | null;
  passing_yards: number | null;
  pass_touchdown: number | null;
  interception: number | null;
  rushing_yards: number | null;
  rush_touchdown: number | null;
  receiving_yards: number | null;
  receiver_player_id: string | null;
  // Situational stats columns (3rd down, red zone)
  yardline_100: number | null;  // Distance from opponent's end zone (1-99)
  touchdown: number | null;     // 1 if play resulted in TD
  field_goal_result: string | null;  // 'made', 'missed', 'blocked', or null
  // Win probability chart fields
  qtr: number | null;                    // Quarter (1-4, 5 for OT)
  game_seconds_remaining: number | null; // Seconds remaining in game
  desc: string | null;                   // Play description text
  // Score fields for WP tooltip
  total_home_score: number | null;       // Home team score at this point
  total_away_score: number | null;       // Away team score at this point
  // Direct home_wp field from nflverse (more accurate than converting from wp)
  home_wp: number | null;                // Home team WP at start of play (0-1)
  home_wp_post: number | null;           // Home team WP at end of play (0-1)
}

function parseNumeric(val: string | undefined | null): number | null {
  if (val === undefined || val === null || val === '' || val === 'NA' || val === 'NaN') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

/** Parse a raw CSV row into a typed PlayRow. */
function parsePlayRow(row: Record<string, string>): PlayRow {
  return {
    game_id: row.game_id || '',
    play_type: row.play_type || '',
    epa: parseNumeric(row.epa),
    success: parseNumeric(row.success),
    first_down: parseNumeric(row.first_down),
    wp: parseNumeric(row.wp),
    qb_dropback: parseNumeric(row.qb_dropback),
    qb_kneel: parseNumeric(row.qb_kneel),
    qb_spike: parseNumeric(row.qb_spike),
    down: parseNumeric(row.down),
    posteam: row.posteam || '',
    defteam: row.defteam || '',
    season_type: row.season_type || '',
    pass: parseNumeric(row.pass),
    rush: parseNumeric(row.rush),
    two_point_attempt: parseNumeric(row.two_point_attempt),
    aborted_play: parseNumeric(row.aborted_play),
    yards_gained: parseNumeric(row.yards_gained),
    passer_player_name: row.passer_player_name || null,
    passer_player_id: row.passer_player_id || null,
    rusher_player_name: row.rusher_player_name || null,
    rusher_player_id: row.rusher_player_id || null,
    receiver_player_name: row.receiver_player_name || null,
    rush_attempt: parseNumeric(row.rush_attempt),
    pass_attempt: parseNumeric(row.pass_attempt),
    complete_pass: parseNumeric(row.complete_pass),
    passing_yards: parseNumeric(row.passing_yards),
    pass_touchdown: parseNumeric(row.pass_touchdown),
    interception: parseNumeric(row.interception),
    rushing_yards: parseNumeric(row.rushing_yards),
    rush_touchdown: parseNumeric(row.rush_touchdown),
    receiving_yards: parseNumeric(row.receiving_yards),
    receiver_player_id: row.receiver_player_id || null,
    // Situational stats
    yardline_100: parseNumeric(row.yardline_100),
    touchdown: parseNumeric(row.touchdown),
    field_goal_result: row.field_goal_result || null,
    // Win probability chart fields
    qtr: parseNumeric(row.qtr),
    game_seconds_remaining: parseNumeric(row.game_seconds_remaining),
    desc: row.desc || null,
    // Score fields for WP tooltip
    total_home_score: parseNumeric(row.total_home_score),
    total_away_score: parseNumeric(row.total_away_score),
    // Direct home_wp fields from nflverse
    home_wp: parseNumeric(row.home_wp),
    home_wp_post: parseNumeric(row.home_wp_post),
  };
}

/**
 * Follow redirects and return a Node.js readable stream.
 * GitHub release URLs redirect to a CDN, so we need to follow.
 */
export function httpsGetFollowRedirects(url: string, maxRedirects = 5): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    const doRequest = (currentUrl: string, remaining: number) => {
      https.get(currentUrl, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (remaining <= 0) {
            reject(new Error('Too many redirects'));
            return;
          }
          doRequest(res.headers.location, remaining - 1);
        } else if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      }).on('error', reject);
    };
    doRequest(url, maxRedirects);
  });
}

/**
 * Fetches PBP data for a specific game by streaming the full-season CSV
 * from nflverse GitHub releases and filtering rows by game_id in real-time.
 *
 * Uses Node.js https module directly (bypasses Next.js fetch wrapper)
 * and PapaParse streaming mode for memory-efficient row-by-row processing.
 * Only retains ~150-200 rows per game (~50KB).
 */
export async function fetchGamePlays(gameId: string, season: number): Promise<PlayRow[]> {
  const url = `https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_${season}.csv`;

  const stream = await httpsGetFollowRedirects(url);

  const plays: PlayRow[] = [];
  let foundGame = false;

  return new Promise<PlayRow[]>((resolve, reject) => {
    Papa.parse(stream, {
      header: true,
      skipEmptyLines: true,
      step: (result: Papa.ParseStepResult<Record<string, string>>, parser: Papa.Parser) => {
        const row = result.data;
        const rowGameId = row.game_id;

        if (rowGameId === gameId) {
          foundGame = true;

          plays.push(parsePlayRow(row));
        } else if (foundGame) {
          // PBP CSVs are ordered chronologically — abort once past the target game
          parser.abort();
        }
      },
      complete: () => resolve(plays),
      error: (err: Error) => {
        // PapaParse fires 'error' on abort — if we found the game, that's success
        if (foundGame && plays.length > 0) {
          resolve(plays);
        } else {
          reject(err);
        }
      },
    });
  });
}

/**
 * Fetches ALL plays for an entire season by streaming the full CSV.
 * Unlike fetchGamePlays, this does NOT filter by game_id or abort early.
 * Used for season-wide performance aggregation.
 *
 * WARNING: This reads the entire season CSV (~95MB, ~50k rows).
 * Results should be cached aggressively.
 */
export async function fetchAllSeasonPlays(season: number): Promise<PlayRow[]> {
  const url = `https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_${season}.csv`;

  const stream = await httpsGetFollowRedirects(url);

  const plays: PlayRow[] = [];

  return new Promise<PlayRow[]>((resolve, reject) => {
    Papa.parse(stream, {
      header: true,
      skipEmptyLines: true,
      step: (result: Papa.ParseStepResult<Record<string, string>>) => {
        const row = result.data;
        const playType = row.play_type;
        // Only keep pass/run plays to reduce memory (skip kickoffs, timeouts, etc.)
        if (playType === 'pass' || playType === 'run') {
          plays.push(parsePlayRow(row));
        }
      },
      complete: () => resolve(plays),
      error: (err: Error) => reject(err),
    });
  });
}
