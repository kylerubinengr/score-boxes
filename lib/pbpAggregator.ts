import type { PlayRow } from './pbpData';
import type {
  AdvancedGameStats,
  AdvancedTeamStats,
  AdvancedTeamSplit,
  AdvancedPlayerStat,
  AdvancedPlayerStats,
} from '@/types/advancedStats';

/** A play after filtering and computed field augmentation. */
interface FilteredPlay extends PlayRow {
  is_pass: number;
  is_run: number;
}

// ---------------------------------------------------------------------------
// Filtering — port of process_game_data()
// ---------------------------------------------------------------------------

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
// Helpers
// ---------------------------------------------------------------------------

function mean(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function sum(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0);
}

function computeSplit(plays: FilteredPlay[]): AdvancedTeamSplit {
  if (plays.length === 0) {
    return { epaPerPlay: null, successRate: null, firstDownPct: null, plays: 0 };
  }
  return {
    epaPerPlay: mean(plays.map((p) => p.epa)),
    successRate: mean(plays.map((p) => p.success)),
    firstDownPct: mean(plays.map((p) => p.first_down)),
    plays: plays.length,
  };
}

// ---------------------------------------------------------------------------
// Team Stats — port of get_team_stats()
// ---------------------------------------------------------------------------

function computeTeamStats(plays: FilteredPlay[], teamAbbr: string): AdvancedTeamStats {
  const teamPlays = plays.filter((p) => p.posteam === teamAbbr);

  const rushPlays = teamPlays.filter((p) => p.is_run === 1);
  const passPlays = teamPlays.filter((p) => p.is_pass === 1);
  const earlyPlays = teamPlays.filter((p) => p.down === 1 || p.down === 2);
  const latePlays = teamPlays.filter((p) => p.down === 3 || p.down === 4);

  return {
    allPlays: computeSplit(teamPlays),
    rush: computeSplit(rushPlays),
    pass: computeSplit(passPlays),
    earlyDowns: computeSplit(earlyPlays),
    earlyRush: computeSplit(earlyPlays.filter((p) => p.is_run === 1)),
    earlyPass: computeSplit(earlyPlays.filter((p) => p.is_pass === 1)),
    lateDowns: computeSplit(latePlays),
    lateRush: computeSplit(latePlays.filter((p) => p.is_run === 1)),
    latePass: computeSplit(latePlays.filter((p) => p.is_pass === 1)),
  };
}

// ---------------------------------------------------------------------------
// Player Stats — port of get_team_player_stats()
// ---------------------------------------------------------------------------

function groupBy<T>(arr: T[], keyFn: (item: T) => string | null): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const key = keyFn(item);
    if (key === null || key === '') continue;
    const group = map.get(key);
    if (group) {
      group.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

function computePlayerMetrics(name: string, plays: FilteredPlay[]): AdvancedPlayerStat {
  return {
    name,
    epaPerPlay: mean(plays.map((p) => p.epa)),
    totalEpa: sum(plays.map((p) => p.epa)),
    successRate: mean(plays.map((p) => p.success)),
    firstDownPct: mean(plays.map((p) => p.first_down)),
    plays: plays.length,
  };
}

function computePlayerTable(
  plays: FilteredPlay[],
  groupByFn: (p: FilteredPlay) => string | null
): AdvancedPlayerStat[] {
  const groups = groupBy(plays, groupByFn);
  const stats: AdvancedPlayerStat[] = [];
  for (const [name, group] of groups) {
    stats.push(computePlayerMetrics(name, group));
  }
  // Sort by totalEpa descending (nulls last)
  stats.sort((a, b) => (b.totalEpa ?? -Infinity) - (a.totalEpa ?? -Infinity));
  return stats;
}

function computePlayerStats(plays: FilteredPlay[], teamAbbr: string): AdvancedPlayerStats {
  const teamPlays = plays.filter((p) => p.posteam === teamAbbr);

  // Dropbacks: group by passer where qb_dropback === 1
  const dropbackPlays = teamPlays.filter((p) => p.qb_dropback === 1);
  const dropbacks = computePlayerTable(dropbackPlays, (p) => p.passer_player_name);

  // Rush attempts: group by rusher where rush_attempt === 1 and qb_dropback === 0
  const rushPlays = teamPlays.filter((p) => p.rush_attempt === 1 && p.qb_dropback === 0);
  const rushAttempts = computePlayerTable(rushPlays, (p) => p.rusher_player_name);

  // Pass targets: group by receiver where pass_attempt === 1 and receiver is not null
  const targetPlays = teamPlays.filter(
    (p) => p.pass_attempt === 1 && p.receiver_player_name !== null && p.receiver_player_name !== ''
  );
  const passTargets = computePlayerTable(targetPlays, (p) => p.receiver_player_name);

  return { dropbacks, rushAttempts, passTargets };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export function computeAdvancedStats(
  rawPlays: PlayRow[],
  gameId: string,
  season: number,
  homeTeam: string,
  awayTeam: string
): AdvancedGameStats {
  const plays = filterPlays(rawPlays);

  return {
    gameId,
    season,
    homeTeam,
    awayTeam,
    teamStats: {
      home: computeTeamStats(plays, homeTeam),
      away: computeTeamStats(plays, awayTeam),
    },
    playerStats: {
      home: computePlayerStats(plays, homeTeam),
      away: computePlayerStats(plays, awayTeam),
    },
  };
}
