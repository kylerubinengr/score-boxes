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
  passer_player_name: string | null;
  rusher_player_name: string | null;
  receiver_player_name: string | null;
  rush_attempt: number | null;
  pass_attempt: number | null;
}

function parseNumeric(val: string | undefined | null): number | null {
  if (val === undefined || val === null || val === '' || val === 'NA' || val === 'NaN') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

/**
 * Follow redirects and return a Node.js readable stream.
 * GitHub release URLs redirect to a CDN, so we need to follow.
 */
function httpsGetFollowRedirects(url: string, maxRedirects = 5): Promise<http.IncomingMessage> {
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

          plays.push({
            game_id: rowGameId,
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
            passer_player_name: row.passer_player_name || null,
            rusher_player_name: row.rusher_player_name || null,
            receiver_player_name: row.receiver_player_name || null,
            rush_attempt: parseNumeric(row.rush_attempt),
            pass_attempt: parseNumeric(row.pass_attempt),
          });
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
