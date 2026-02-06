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

/** Map roster position to display role (QB, RB, WR, TE) */
function positionToRole(position: string | undefined): PlayerRole {
  if (!position) return 'WR'; // Default fallback
  const pos = position.toUpperCase();
  if (pos === 'QB') return 'QB';
  if (pos === 'RB' || pos === 'FB' || pos === 'HB') return 'RB';
  if (pos === 'TE') return 'TE';
  if (pos === 'WR') return 'WR';
  // For other positions (K, P, OL, DL, LB, CB, S, etc.), skip them
  return 'WR'; // Fallback, but these players typically won't have offensive stats
}

/** Check if a position is a skill position we want to track */
function isSkillPosition(position: string | undefined): boolean {
  if (!position) return false;
  const pos = position.toUpperCase();
  return ['QB', 'RB', 'FB', 'HB', 'WR', 'TE'].includes(pos);
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
// Player identification: maps (gameId, playerName) → (playerId, team)
// ---------------------------------------------------------------------------

interface PlayerInfo {
  playerId: string | null;
  team: string;
}

function buildPlayerInfoMap(plays: FilteredPlay[]): Map<string, PlayerInfo> {
  const playerInfo = new Map<string, PlayerInfo>();

  for (const play of plays) {
    // Track passer
    if (play.passer_player_name && play.passer_player_id) {
      const key = `${play.game_id}|${play.passer_player_name}`;
      if (!playerInfo.has(key)) {
        playerInfo.set(key, { playerId: play.passer_player_id, team: play.posteam });
      }
    }
    // Track rusher
    if (play.rusher_player_name && play.rusher_player_id) {
      const key = `${play.game_id}|${play.rusher_player_name}`;
      if (!playerInfo.has(key)) {
        playerInfo.set(key, { playerId: play.rusher_player_id, team: play.posteam });
      }
    }
    // Track receiver
    if (play.receiver_player_name && play.receiver_player_id) {
      const key = `${play.game_id}|${play.receiver_player_name}`;
      if (!playerInfo.has(key)) {
        playerInfo.set(key, { playerId: play.receiver_player_id, team: play.posteam });
      }
    }
  }

  return playerInfo;
}

// ---------------------------------------------------------------------------
// Main aggregation
// ---------------------------------------------------------------------------

/**
 * Computes season-wide per-game player performances from raw PBP data.
 * Groups by (gameId, playerName) and calculates TOTAL EPA across all activity types.
 * Returns top performances sorted by totalEpa descending.
 */
export function computeSeasonPerformances(
  rawPlays: PlayRow[],
  season: number,
  limit = 200,
  positionMap?: Map<string, string>
): PerformanceRow[] {
  const plays = filterPlays(rawPlays);

  // Build player info map for ID and team lookups
  const playerInfoMap = buildPlayerInfoMap(plays);

  // Group ALL plays by (gameId, playerName) - not by role
  const playerGamePlays = new Map<string, FilteredPlay[]>();

  for (const play of plays) {
    const names = new Set<string>();
    if (play.passer_player_name) names.add(play.passer_player_name);
    if (play.rusher_player_name) names.add(play.rusher_player_name);
    if (play.receiver_player_name) names.add(play.receiver_player_name);

    for (const name of names) {
      const key = `${play.game_id}|${name}`;
      const arr = playerGamePlays.get(key);
      if (arr) arr.push(play);
      else playerGamePlays.set(key, [play]);
    }
  }

  // Compute metrics for each player-game
  const performances: PerformanceRow[] = [];

  for (const [key, allPlays] of playerGamePlays) {
    const [gameId, playerName] = key.split('|');

    // Get player info
    const info = playerInfoMap.get(key);
    if (!info) continue;

    const { playerId, team } = info;

    // Determine role from roster position
    const rosterPosition = playerId ? positionMap?.get(playerId) : undefined;

    // Skip non-skill positions (we don't want defensive players who recovered fumbles, etc.)
    if (!isSkillPosition(rosterPosition)) {
      // If we don't have a roster position, try to infer from play types
      // But only include if they have significant involvement
      const hasPassingPlays = allPlays.some(p => p.passer_player_name === playerName);
      const hasRushingPlays = allPlays.some(p => p.rusher_player_name === playerName);
      const hasReceivingPlays = allPlays.some(p => p.receiver_player_name === playerName);

      if (!hasPassingPlays && !hasRushingPlays && !hasReceivingPlays) continue;
    }

    const role = positionToRole(rosterPosition);

    // Separate plays by involvement type for counting stats
    const passingPlays = allPlays.filter(p => p.passer_player_name === playerName && p.qb_dropback === 1);
    const rushingPlays = allPlays.filter(p => p.rusher_player_name === playerName && p.rushing_yards !== null);
    const receivingPlays = allPlays.filter(p => p.receiver_player_name === playerName && p.pass_attempt === 1);

    // Calculate TOTAL EPA from all plays where this player contributed
    // Each play's EPA should only count once, attributed to the primary actor
    const epaPlays: FilteredPlay[] = [];
    const seenPlayIds = new Set<string>();

    // For passing plays, passer gets the EPA
    for (const play of passingPlays) {
      const playKey = `${play.game_id}|${play.desc}`;
      if (!seenPlayIds.has(playKey)) {
        epaPlays.push(play);
        seenPlayIds.add(playKey);
      }
    }

    // For rushing plays (non-QB), rusher gets the EPA
    for (const play of rushingPlays) {
      // Only count if this isn't already counted as a passing play (QB scrambles)
      if (play.qb_dropback !== 1) {
        const playKey = `${play.game_id}|${play.desc}`;
        if (!seenPlayIds.has(playKey)) {
          epaPlays.push(play);
          seenPlayIds.add(playKey);
        }
      }
    }

    // For receiving plays, receiver gets the EPA (but only if not already a passing play for this player)
    for (const play of receivingPlays) {
      const playKey = `${play.game_id}|${play.desc}`;
      if (!seenPlayIds.has(playKey)) {
        epaPlays.push(play);
        seenPlayIds.add(playKey);
      }
    }

    // Require minimum 5 EPA-contributing plays to filter noise
    if (epaPlays.length < 5) continue;

    const base: PerformanceRow = {
      playerName,
      role,
      team,
      gameId,
      week: parseWeek(gameId),
      opponent: deriveOpponent(gameId, team),
      // Total EPA from all contributing plays
      totalEpa: sumNullable(epaPlays.map(p => p.epa)),
      epaPerPlay: mean(epaPlays.map(p => p.epa)),
      successRate: mean(epaPlays.map(p => p.success)),
      firstDownPct: mean(epaPlays.map(p => p.first_down)),
      plays: epaPlays.length,
    };

    // Populate ALL counting stats
    if (passingPlays.length > 0) {
      base.completions = sumCount(passingPlays.map(p => p.complete_pass));
      base.passAttempts = passingPlays.length;
      base.passingYards = sumNullable(passingPlays.map(p => p.passing_yards)) ?? 0;
      base.passTDs = sumCount(passingPlays.map(p => p.pass_touchdown));
      base.interceptions = sumCount(passingPlays.map(p => p.interception));
    }
    if (rushingPlays.length > 0) {
      base.carries = rushingPlays.length;
      base.rushingYards = sumNullable(rushingPlays.map(p => p.rushing_yards)) ?? 0;
      base.rushTDs = sumCount(rushingPlays.map(p => p.rush_touchdown));
    }
    if (receivingPlays.length > 0) {
      base.targets = receivingPlays.length;
      base.receptions = sumCount(receivingPlays.map(p => p.complete_pass));
      base.receivingYards = sumNullable(receivingPlays.map(p => p.receiving_yards)) ?? 0;
      base.receivingTDs = sumCount(receivingPlays.map(p => p.pass_touchdown));
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
  const result = [...selected].map(i => performances[i]);
  result.sort((a, b) => (b.totalEpa ?? -Infinity) - (a.totalEpa ?? -Infinity));

  return result;
}
