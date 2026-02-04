import type { PlayRow } from './pbpData';

/**
 * Raw per-team stats computed from play-by-play data.
 * Mirrors the structure produced by the Python nflfastr/app.py export_stats().
 */
export interface RawTeamStats {
  games: number;
  off_epa: number;
  off_success_rate: number;
  off_dropback_epa: number;
  off_rush_epa: number;
  off_plays: number;
  off_pass_yards: number;
  off_rush_yards: number;
  off_dropback_pct: number;
  def_epa: number;
  def_success_rate: number;
  def_dropback_epa: number;
  def_rush_epa: number;
  def_plays: number;
  def_pass_yards: number;
  def_rush_yards: number;
  def_dropback_pct: number;
  off_pass_success_rate: number;
  off_rush_success_rate: number;
  def_pass_success_rate: number;
  def_rush_success_rate: number;
  // Situational stats: 3rd down
  off_third_down_conv_rate: number;  // Offensive 3rd down conversion %
  def_third_down_conv_rate: number;  // Defensive 3rd down allowed %
  // Situational stats: Red zone (inside opponent's 20)
  off_redzone_td_rate: number;       // % of red zone trips ending in TD
  def_redzone_td_rate: number;       // % of red zone trips allowed ending in TD
}

interface Accumulator {
  gameIds: Set<string>;
  epaSum: number;
  epaCount: number;
  successSum: number;
  successCount: number;
  passEpaSum: number;
  passEpaCount: number;
  rushEpaSum: number;
  rushEpaCount: number;
  passSuccessSum: number;
  passSuccessCount: number;
  rushSuccessSum: number;
  rushSuccessCount: number;
  passYards: number;
  rushYards: number;
  passPlays: number;
  totalPlays: number;
  // 3rd down tracking
  thirdDownAttempts: number;
  thirdDownConversions: number;
  // Red zone tracking (drive-level, approximated by play inside 20)
  redZonePlays: number;
  redZoneTDs: number;
}

function newAccumulator(): Accumulator {
  return {
    gameIds: new Set(),
    epaSum: 0, epaCount: 0,
    successSum: 0, successCount: 0,
    passEpaSum: 0, passEpaCount: 0,
    rushEpaSum: 0, rushEpaCount: 0,
    passSuccessSum: 0, passSuccessCount: 0,
    rushSuccessSum: 0, rushSuccessCount: 0,
    passYards: 0, rushYards: 0,
    passPlays: 0, totalPlays: 0,
    thirdDownAttempts: 0, thirdDownConversions: 0,
    redZonePlays: 0, redZoneTDs: 0,
  };
}

/**
 * Filters play-by-play rows to match the Python script's prepare_data():
 * - Regular season only
 * - Pass or rush plays (pass=1 or rush=1)
 * - Exclude kneels, spikes, two-point attempts, aborted plays
 * - Must have posteam, defteam, and epa
 */
function filterPlays(plays: PlayRow[]): PlayRow[] {
  return plays.filter(p =>
    p.season_type === 'REG' &&
    (p.pass === 1 || p.rush === 1) &&
    p.qb_kneel !== 1 &&
    p.qb_spike !== 1 &&
    p.two_point_attempt !== 1 &&
    p.aborted_play !== 1 &&
    p.posteam !== '' &&
    p.defteam !== '' &&
    p.epa !== null
  );
}

/**
 * Compute per-team offensive and defensive advanced stats from play-by-play data.
 * Replicates the Python calculate_metrics() + export_stats() logic from nflfastr/app.py.
 *
 * Returns a map of nflverse team abbreviation → RawTeamStats.
 */
export function computeSeasonTeamStats(plays: PlayRow[]): Record<string, RawTeamStats> {
  const filtered = filterPlays(plays);

  // Accumulators keyed by team abbreviation
  const offense = new Map<string, Accumulator>();
  const defense = new Map<string, Accumulator>();

  for (const play of filtered) {
    const epa = play.epa!; // guaranteed non-null by filter
    const isPass = play.pass === 1;
    const isRush = play.rush === 1;
    const yds = play.yards_gained ?? 0;
    const success = play.success ?? 0;
    const down = play.down;
    const firstDown = play.first_down ?? 0;
    const yardline = play.yardline_100;
    const isTouchdown = play.touchdown === 1;

    // Offensive accumulation (group by posteam)
    let off = offense.get(play.posteam);
    if (!off) { off = newAccumulator(); offense.set(play.posteam, off); }
    off.gameIds.add(play.game_id);
    off.epaSum += epa;
    off.epaCount++;
    off.successSum += success;
    off.successCount++;
    off.totalPlays++;
    if (isPass) {
      off.passEpaSum += epa;
      off.passEpaCount++;
      off.passYards += yds;
      off.passPlays++;
      off.passSuccessSum += success;
      off.passSuccessCount++;
    }
    if (isRush) {
      off.rushEpaSum += epa;
      off.rushEpaCount++;
      off.rushYards += yds;
      off.rushSuccessSum += success;
      off.rushSuccessCount++;
    }
    // 3rd down tracking (offensive)
    if (down === 3) {
      off.thirdDownAttempts++;
      if (firstDown === 1 || isTouchdown) {
        off.thirdDownConversions++;
      }
    }
    // Red zone tracking (inside opponent's 20, yardline_100 <= 20)
    if (yardline !== null && yardline <= 20) {
      off.redZonePlays++;
      if (isTouchdown) {
        off.redZoneTDs++;
      }
    }

    // Defensive accumulation (group by defteam)
    let def = defense.get(play.defteam);
    if (!def) { def = newAccumulator(); defense.set(play.defteam, def); }
    def.gameIds.add(play.game_id);
    def.epaSum += epa;
    def.epaCount++;
    def.successSum += success;
    def.successCount++;
    def.totalPlays++;
    if (isPass) {
      def.passEpaSum += epa;
      def.passEpaCount++;
      def.passYards += yds;
      def.passPlays++;
      def.passSuccessSum += success;
      def.passSuccessCount++;
    }
    if (isRush) {
      def.rushEpaSum += epa;
      def.rushEpaCount++;
      def.rushYards += yds;
      def.rushSuccessSum += success;
      def.rushSuccessCount++;
    }
    // 3rd down tracking (defensive - plays they allowed)
    if (down === 3) {
      def.thirdDownAttempts++;
      if (firstDown === 1 || isTouchdown) {
        def.thirdDownConversions++;
      }
    }
    // Red zone tracking (defensive - plays they allowed in red zone)
    if (yardline !== null && yardline <= 20) {
      def.redZonePlays++;
      if (isTouchdown) {
        def.redZoneTDs++;
      }
    }
  }

  // Merge offense + defense into final per-team stats
  const allTeams = new Set([...offense.keys(), ...defense.keys()]);
  const result: Record<string, RawTeamStats> = {};

  for (const team of allTeams) {
    const off = offense.get(team) || newAccumulator();
    const def = defense.get(team) || newAccumulator();

    result[team] = {
      games: Math.max(off.gameIds.size, def.gameIds.size),
      off_epa: off.epaCount > 0 ? off.epaSum / off.epaCount : 0,
      off_success_rate: off.successCount > 0 ? (off.successSum / off.successCount) * 100 : 0,
      off_dropback_epa: off.passEpaCount > 0 ? off.passEpaSum / off.passEpaCount : 0,
      off_rush_epa: off.rushEpaCount > 0 ? off.rushEpaSum / off.rushEpaCount : 0,
      off_plays: off.totalPlays,
      off_pass_yards: off.passYards,
      off_rush_yards: off.rushYards,
      off_dropback_pct: off.totalPlays > 0 ? (off.passPlays / off.totalPlays) * 100 : 0,
      def_epa: def.epaCount > 0 ? def.epaSum / def.epaCount : 0,
      def_success_rate: def.successCount > 0 ? (def.successSum / def.successCount) * 100 : 0,
      def_dropback_epa: def.passEpaCount > 0 ? def.passEpaSum / def.passEpaCount : 0,
      def_rush_epa: def.rushEpaCount > 0 ? def.rushEpaSum / def.rushEpaCount : 0,
      def_plays: def.totalPlays,
      def_pass_yards: def.passYards,
      def_rush_yards: def.rushYards,
      def_dropback_pct: def.totalPlays > 0 ? (def.passPlays / def.totalPlays) * 100 : 0,
      off_pass_success_rate: off.passSuccessCount > 0 ? (off.passSuccessSum / off.passSuccessCount) * 100 : 0,
      off_rush_success_rate: off.rushSuccessCount > 0 ? (off.rushSuccessSum / off.rushSuccessCount) * 100 : 0,
      def_pass_success_rate: def.passSuccessCount > 0 ? (def.passSuccessSum / def.passSuccessCount) * 100 : 0,
      def_rush_success_rate: def.rushSuccessCount > 0 ? (def.rushSuccessSum / def.rushSuccessCount) * 100 : 0,
      // Situational stats
      off_third_down_conv_rate: off.thirdDownAttempts > 0 ? (off.thirdDownConversions / off.thirdDownAttempts) * 100 : 0,
      def_third_down_conv_rate: def.thirdDownAttempts > 0 ? (def.thirdDownConversions / def.thirdDownAttempts) * 100 : 0,
      off_redzone_td_rate: off.redZonePlays > 0 ? (off.redZoneTDs / off.redZonePlays) * 100 : 0,
      def_redzone_td_rate: def.redZonePlays > 0 ? (def.redZoneTDs / def.redZonePlays) * 100 : 0,
    };
  }

  return result;
}
