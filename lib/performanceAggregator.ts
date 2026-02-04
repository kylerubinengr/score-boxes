import type { PlayRow } from './pbpData';
import type { PerformanceRow, PlayerRole } from '@/types/performances';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mean(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function sumNullable(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0);
}

function sumCount(values: (number | null)[]): number {
  return values.filter((v): v is number => v !== null && !isNaN(v) && v > 0).length;
}

/** Parse week number from nflverse game_id like "2024_05_HOU_BUF" */
function parseWeek(gameId: string): number {
  const parts = gameId.split('_');
  return parseInt(parts[1], 10) || 0;
}

/** Derive opponent abbreviation from gameId and player's team */
function deriveOpponent(gameId: string, team: string): string {
  const parts = gameId.split('_');
  // Format: SEASON_WEEK_AWAY_HOME
  const away = parts[2] || '';
  const home = parts[3] || '';
  return team === away ? home : away;
}

// ---------------------------------------------------------------------------
// Filtering — same criteria as pbpAggregator.ts
// ---------------------------------------------------------------------------

interface FilteredPlay extends PlayRow {
  is_pass: number;
  is_run: number;
}

function filterPlays(rows: PlayRow[]): FilteredPlay[] {
  return rows
    .filter(
      (r) =>
        r.wp !== null &&
        r.wp >= 0.05 &&
        r.wp <= 0.95 &&
        (r.play_type === 'pass' || r.play_type === 'run') &&
        r.qb_kneel === 0 &&
        r.qb_spike === 0
    )
    .map((r) => ({
      ...r,
      is_pass: r.qb_dropback === 1 ? 1 : 0,
      is_run: r.play_type === 'run' && r.qb_dropback === 0 ? 1 : 0,
    }));
}

// ---------------------------------------------------------------------------
// Grouping key: (gameId, playerName, role)
// ---------------------------------------------------------------------------

type GroupKey = string; // "gameId|playerName|role"

function makeKey(gameId: string, name: string, role: PlayerRole): GroupKey {
  return `${gameId}|${name}|${role}`;
}

function parseKey(key: GroupKey): { gameId: string; playerName: string; role: PlayerRole } {
  const [gameId, playerName, role] = key.split('|');
  return { gameId, playerName, role: role as PlayerRole };
}

// ---------------------------------------------------------------------------
// Main aggregation
// ---------------------------------------------------------------------------

/**
 * Computes season-wide per-game player performances from raw PBP data.
 * Returns top performances sorted by totalEpa descending.
 */
export function computeSeasonPerformances(
  rawPlays: PlayRow[],
  season: number,
  limit = 200,
  positionMap?: Map<string, string>
): PerformanceRow[] {
  const plays = filterPlays(rawPlays);

  // Group plays by (gameId, playerName, role)
  const groups = new Map<GroupKey, FilteredPlay[]>();

  for (const play of plays) {
    // QB: dropback plays grouped by passer
    if (play.qb_dropback === 1 && play.passer_player_name) {
      const key = makeKey(play.game_id, play.passer_player_name, 'QB');
      const arr = groups.get(key);
      if (arr) arr.push(play);
      else groups.set(key, [play]);
    }

    // RB: rush attempts (non-QB) grouped by rusher
    if (play.rush_attempt === 1 && play.qb_dropback === 0 && play.rusher_player_name) {
      const key = makeKey(play.game_id, play.rusher_player_name, 'RB');
      const arr = groups.get(key);
      if (arr) arr.push(play);
      else groups.set(key, [play]);
    }

    // WR/TE: pass targets grouped by receiver, classified by roster position
    if (play.pass_attempt === 1 && play.receiver_player_name) {
      const recRole: PlayerRole = positionMap?.get(play.receiver_player_id ?? '') === 'TE' ? 'TE' : 'WR';
      const key = makeKey(play.game_id, play.receiver_player_name, recRole);
      const arr = groups.get(key);
      if (arr) arr.push(play);
      else groups.set(key, [play]);
    }
  }

  // Build a secondary index: all plays involving a player in a game,
  // keyed by "gameId|playerName". This lets us populate ALL counting stat
  // columns (passing, rushing, receiving) for every row, not just the
  // role-specific plays. E.g. a QB's rushing stats, an RB's receiving stats.
  const allPlayerGamePlays = new Map<string, FilteredPlay[]>();
  for (const play of plays) {
    const names = new Set<string>();
    if (play.passer_player_name) names.add(play.passer_player_name);
    if (play.rusher_player_name) names.add(play.rusher_player_name);
    if (play.receiver_player_name) names.add(play.receiver_player_name);
    for (const name of names) {
      const pgKey = `${play.game_id}|${name}`;
      const arr = allPlayerGamePlays.get(pgKey);
      if (arr) arr.push(play);
      else allPlayerGamePlays.set(pgKey, [play]);
    }
  }

  // Compute metrics for each group
  const performances: PerformanceRow[] = [];

  for (const [key, groupPlays] of groups) {
    const { gameId, playerName, role } = parseKey(key);
    // Require minimum 5 plays to filter noise
    if (groupPlays.length < 5) continue;

    const team = groupPlays[0].posteam;

    // Get ALL plays this player was involved in for this game
    const allPlays = allPlayerGamePlays.get(`${gameId}|${playerName}`) ?? [];

    // Passing stats: plays where this player was the passer
    const passingPlays = allPlays.filter((p) => p.passer_player_name === playerName && p.qb_dropback === 1);
    // Rushing stats: plays where this player was the rusher
    // Includes both designed runs (rush_attempt=1, qb_dropback=0) AND QB scrambles
    // (rusher_player_name set with rushing_yards, even on qb_dropback=1 plays)
    const rushingPlays = allPlays.filter((p) => p.rusher_player_name === playerName && p.rushing_yards !== null);
    // Receiving stats: plays where this player was the receiver
    const receivingPlays = allPlays.filter((p) => p.receiver_player_name === playerName && p.pass_attempt === 1);

    const base: PerformanceRow = {
      playerName,
      role,
      team,
      gameId,
      week: parseWeek(gameId),
      opponent: deriveOpponent(gameId, team),
      // EPA metrics are still computed from the role-specific group plays
      totalEpa: sumNullable(groupPlays.map((p) => p.epa)),
      epaPerPlay: mean(groupPlays.map((p) => p.epa)),
      successRate: mean(groupPlays.map((p) => p.success)),
      firstDownPct: mean(groupPlays.map((p) => p.first_down)),
      plays: groupPlays.length,
    };

    // Populate ALL counting stats from the player's full game involvement
    if (passingPlays.length > 0) {
      base.completions = sumCount(passingPlays.map((p) => p.complete_pass));
      base.passAttempts = passingPlays.length;
      base.passingYards = sumNullable(passingPlays.map((p) => p.passing_yards)) ?? 0;
      base.passTDs = sumCount(passingPlays.map((p) => p.pass_touchdown));
      base.interceptions = sumCount(passingPlays.map((p) => p.interception));
    }
    if (rushingPlays.length > 0) {
      base.carries = rushingPlays.length;
      base.rushingYards = sumNullable(rushingPlays.map((p) => p.rushing_yards)) ?? 0;
      base.rushTDs = sumCount(rushingPlays.map((p) => p.rush_touchdown));
    }
    if (receivingPlays.length > 0) {
      base.targets = receivingPlays.length;
      base.receptions = sumCount(receivingPlays.map((p) => p.complete_pass));
      base.receivingYards = sumNullable(receivingPlays.map((p) => p.receiving_yards)) ?? 0;
      base.receivingTDs = sumCount(receivingPlays.map((p) => p.pass_touchdown));
    }

    performances.push(base);
  }

  // Sort by totalEpa descending (nulls last)
  performances.sort((a, b) => (b.totalEpa ?? -Infinity) - (a.totalEpa ?? -Infinity));

  // Per-position minimums: guarantee at least minPerRole entries per position,
  // then fill remaining slots from the global sorted list
  const minPerRole = 50;
  const selected = new Set<number>();
  const roles: PlayerRole[] = ['QB', 'RB', 'WR', 'TE'];

  // First pass: guarantee minimums per role
  for (const role of roles) {
    let count = 0;
    for (let i = 0; i < performances.length && count < minPerRole; i++) {
      if (performances[i].role === role) {
        selected.add(i);
        count++;
      }
    }
  }

  // Second pass: fill remaining slots from global sorted list
  for (let i = 0; i < performances.length && selected.size < limit; i++) {
    selected.add(i);
  }

  // Build final list, re-sorted by EPA
  const result = [...selected].map((i) => performances[i]);
  result.sort((a, b) => (b.totalEpa ?? -Infinity) - (a.totalEpa ?? -Infinity));

  return result;
}
