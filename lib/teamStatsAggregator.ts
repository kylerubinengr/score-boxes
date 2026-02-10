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
  // Expanded situational stats
  off_third_short_conv_rate: number;  // 3rd & Short (<=3 yds) conv %
  def_third_short_conv_rate: number;
  off_third_med_conv_rate: number;    // 3rd & Medium (4-6 yds) conv %
  def_third_med_conv_rate: number;
  off_third_long_conv_rate: number;   // 3rd & Long (>6 yds) conv %
  def_third_long_conv_rate: number;
  off_fourth_down_success_rate: number; // 4th down go-for-it success %
  def_fourth_down_success_rate: number;
  off_goalline_td_rate: number;       // Goal-to-go (<=10 yds) TD %
  def_goalline_td_rate: number;
  off_two_min_epa: number;            // 2-minute drill EPA/play
  def_two_min_epa: number;
  off_clutch_epa: number;             // Clutch: WP 30-70% in final 4 min of Q4 or OT
  def_clutch_epa: number;
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
  // Expanded situational tracking
  thirdShortAttempts: number;
  thirdShortConversions: number;
  thirdMedAttempts: number;
  thirdMedConversions: number;
  thirdLongAttempts: number;
  thirdLongConversions: number;
  fourthDownAttempts: number;
  fourthDownSuccesses: number;
  goalLinePlays: number;
  goalLineTDs: number;
  twoMinEpaSum: number;
  twoMinEpaCount: number;
  clutchEpaSum: number;
  clutchEpaCount: number;
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
    thirdShortAttempts: 0, thirdShortConversions: 0,
    thirdMedAttempts: 0, thirdMedConversions: 0,
    thirdLongAttempts: 0, thirdLongConversions: 0,
    fourthDownAttempts: 0, fourthDownSuccesses: 0,
    goalLinePlays: 0, goalLineTDs: 0,
    twoMinEpaSum: 0, twoMinEpaCount: 0,
    clutchEpaSum: 0, clutchEpaCount: 0,
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
    const ydstogo = play.ydstogo;
    const firstDown = play.first_down ?? 0;
    const yardline = play.yardline_100;
    const isTouchdown = play.touchdown === 1;
    const gameSecsRemaining = play.game_seconds_remaining;
    const quarter = play.qtr;
    const homeWp = play.home_wp;

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
    // 3rd down distance splits (offensive)
    if (down === 3 && ydstogo !== null) {
      if (ydstogo <= 3) {
        off.thirdShortAttempts++;
        if (firstDown === 1 || isTouchdown) off.thirdShortConversions++;
      } else if (ydstogo <= 6) {
        off.thirdMedAttempts++;
        if (firstDown === 1 || isTouchdown) off.thirdMedConversions++;
      } else {
        off.thirdLongAttempts++;
        if (firstDown === 1 || isTouchdown) off.thirdLongConversions++;
      }
    }
    // 4th down tracking (offensive)
    if (down === 4) {
      off.fourthDownAttempts++;
      if (success === 1) off.fourthDownSuccesses++;
    }
    // Goal-to-go tracking (inside 10, offensive)
    if (yardline !== null && yardline <= 10) {
      off.goalLinePlays++;
      if (isTouchdown) off.goalLineTDs++;
    }
    // 2-minute drill EPA (offensive)
    if (gameSecsRemaining !== null && gameSecsRemaining <= 120 && (quarter === 2 || quarter === 4)) {
      off.twoMinEpaSum += epa;
      off.twoMinEpaCount++;
    }
    // Clutch EPA: WP between 30-70% AND final 4 minutes of Q4 or OT (offensive)
    if (homeWp !== null && Math.abs(homeWp - 0.5) < 0.2 &&
        gameSecsRemaining !== null && quarter !== null &&
        ((quarter === 4 && gameSecsRemaining <= 240) || quarter === 5)) {
      off.clutchEpaSum += epa;
      off.clutchEpaCount++;
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
    // 3rd down distance splits (defensive)
    if (down === 3 && ydstogo !== null) {
      if (ydstogo <= 3) {
        def.thirdShortAttempts++;
        if (firstDown === 1 || isTouchdown) def.thirdShortConversions++;
      } else if (ydstogo <= 6) {
        def.thirdMedAttempts++;
        if (firstDown === 1 || isTouchdown) def.thirdMedConversions++;
      } else {
        def.thirdLongAttempts++;
        if (firstDown === 1 || isTouchdown) def.thirdLongConversions++;
      }
    }
    // 4th down tracking (defensive)
    if (down === 4) {
      def.fourthDownAttempts++;
      if (success === 1) def.fourthDownSuccesses++;
    }
    // Goal-to-go tracking (inside 10, defensive)
    if (yardline !== null && yardline <= 10) {
      def.goalLinePlays++;
      if (isTouchdown) def.goalLineTDs++;
    }
    // 2-minute drill EPA (defensive)
    if (gameSecsRemaining !== null && gameSecsRemaining <= 120 && (quarter === 2 || quarter === 4)) {
      def.twoMinEpaSum += epa;
      def.twoMinEpaCount++;
    }
    // Clutch EPA: WP between 30-70% AND final 4 minutes of Q4 or OT (defensive)
    if (homeWp !== null && Math.abs(homeWp - 0.5) < 0.2 &&
        gameSecsRemaining !== null && quarter !== null &&
        ((quarter === 4 && gameSecsRemaining <= 240) || quarter === 5)) {
      def.clutchEpaSum += epa;
      def.clutchEpaCount++;
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
      // Expanded situational stats
      off_third_short_conv_rate: off.thirdShortAttempts > 0 ? (off.thirdShortConversions / off.thirdShortAttempts) * 100 : 0,
      def_third_short_conv_rate: def.thirdShortAttempts > 0 ? (def.thirdShortConversions / def.thirdShortAttempts) * 100 : 0,
      off_third_med_conv_rate: off.thirdMedAttempts > 0 ? (off.thirdMedConversions / off.thirdMedAttempts) * 100 : 0,
      def_third_med_conv_rate: def.thirdMedAttempts > 0 ? (def.thirdMedConversions / def.thirdMedAttempts) * 100 : 0,
      off_third_long_conv_rate: off.thirdLongAttempts > 0 ? (off.thirdLongConversions / off.thirdLongAttempts) * 100 : 0,
      def_third_long_conv_rate: def.thirdLongAttempts > 0 ? (def.thirdLongConversions / def.thirdLongAttempts) * 100 : 0,
      off_fourth_down_success_rate: off.fourthDownAttempts > 0 ? (off.fourthDownSuccesses / off.fourthDownAttempts) * 100 : 0,
      def_fourth_down_success_rate: def.fourthDownAttempts > 0 ? (def.fourthDownSuccesses / def.fourthDownAttempts) * 100 : 0,
      off_goalline_td_rate: off.goalLinePlays > 0 ? (off.goalLineTDs / off.goalLinePlays) * 100 : 0,
      def_goalline_td_rate: def.goalLinePlays > 0 ? (def.goalLineTDs / def.goalLinePlays) * 100 : 0,
      off_two_min_epa: off.twoMinEpaCount > 0 ? off.twoMinEpaSum / off.twoMinEpaCount : 0,
      def_two_min_epa: def.twoMinEpaCount > 0 ? def.twoMinEpaSum / def.twoMinEpaCount : 0,
      off_clutch_epa: off.clutchEpaCount > 0 ? off.clutchEpaSum / off.clutchEpaCount : 0,
      def_clutch_epa: def.clutchEpaCount > 0 ? def.clutchEpaSum / def.clutchEpaCount : 0,
    };
  }

  return result;
}
