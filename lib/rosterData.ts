import Papa from 'papaparse';
import { httpsGetFollowRedirects } from './pbpData';

/**
 * Fetches nflverse roster data for a season and returns a map of
 * GSIS player ID → position (e.g., "00-0033553" → "TE").
 *
 * The roster CSV is small (~3k rows) and loads quickly.
 * URL: https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_{season}.csv
 */
export async function fetchPlayerPositions(season: number): Promise<Map<string, string>> {
  const url = `https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_${season}.csv`;

  const stream = await httpsGetFollowRedirects(url);

  const positionMap = new Map<string, string>();

  return new Promise<Map<string, string>>((resolve, reject) => {
    Papa.parse(stream, {
      header: true,
      skipEmptyLines: true,
      step: (result: Papa.ParseStepResult<Record<string, string>>) => {
        const row = result.data;
        const gsisId = row.gsis_id;
        const position = row.position;
        if (gsisId && position) {
          positionMap.set(gsisId, position);
        }
      },
      complete: () => resolve(positionMap),
      error: (err: Error) => reject(err),
    });
  });
}
