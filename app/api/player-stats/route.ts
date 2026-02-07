import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { NFL_TEAMS } from '@/constants/teams';
import { fetchAllSeasonPlays, type PlayRow } from '@/lib/pbpData';
import { httpsGetFollowRedirects } from '@/lib/pbpData';

// ── Types ────────────────────────────────────────────────────────────

interface RosterPlayer {
  gsisId: string;
  fullName: string;
  position: string;
  team: string;
  headshotUrl: string;
}

/** Per-game player stats aggregated from PBP data */
interface PlayerGameRow {
  playerId: string;
  displayName: string;
  position: string;
  headshotUrl: string;
  team: string;
  season: number;
  week: number;
  opponentTeam: string;
  // Passing
  completions: number;
  attempts: number;
  passingYards: number;
  passingTds: number;
  interceptions: number;
  sacks: number;
  // Rushing
  carries: number;
  rushingYards: number;
  rushingTds: number;
  // Receiving
  receptions: number;
  targets: number;
  receivingYards: number;
  receivingTds: number;
  // EPA metrics
  totalEpa: number;
  epaPerPlay: number;
  epaPlays: number;
}

// ── NFL Passer Rating Calculation ────────────────────────────────────

function calculatePasserRating(comp: number, att: number, yds: number, td: number, int: number): number {
  if (att === 0) return 0;
  const a = Math.min(Math.max(((comp / att) - 0.3) * 5, 0), 2.375);
  const b = Math.min(Math.max(((yds / att) - 3) * 0.25, 0), 2.375);
  const c = Math.min(Math.max((td / att) * 20, 0), 2.375);
  const d = Math.min(Math.max(2.375 - ((int / att) * 25), 0), 2.375);
  return Math.round(((a + b + c + d) / 6) * 100 * 10) / 10;
}

// ── Roster Fetching ──────────────────────────────────────────────────

async function fetchRosterDetails(season: number): Promise<Map<string, RosterPlayer>> {
  const url = `https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_${season}.csv`;
  const stream = await httpsGetFollowRedirects(url);
  const roster = new Map<string, RosterPlayer>();

  return new Promise<Map<string, RosterPlayer>>((resolve, reject) => {
    Papa.parse(stream, {
      header: true,
      skipEmptyLines: true,
      step: (result: Papa.ParseStepResult<Record<string, string>>) => {
        const row = result.data;
        const gsisId = row.gsis_id;
        const fullName = row.full_name;
        const position = row.position;
        const team = row.team;
        if (gsisId && fullName && position) {
          roster.set(gsisId, { gsisId, fullName, position, team: team || '', headshotUrl: row.headshot_url || '' });
        }
      },
      complete: () => resolve(roster),
      error: (err: Error) => reject(err),
    });
  });
}

// ── Helpers ──────────────────────────────────────────────────────────

function parseWeekFromGameId(gameId: string): number {
  const parts = gameId.split('_');
  return parseInt(parts[1], 10) || 0;
}

function deriveOpponent(gameId: string, team: string): string {
  const parts = gameId.split('_');
  const away = parts[2] || '';
  const home = parts[3] || '';
  return team === away ? home : away;
}

function isSkillPosition(pos: string): boolean {
  return ['QB', 'RB', 'FB', 'HB', 'WR', 'TE', 'K'].includes(pos.toUpperCase());
}

function nflfastrToAppAbbr(nflfastrAbbr: string): string {
  const team = Object.values(NFL_TEAMS).find(t => t.nflfastrAbbr === nflfastrAbbr);
  return team?.abbreviation || nflfastrAbbr;
}

function getTeamLogo(nflfastrAbbr: string): string {
  const team = Object.values(NFL_TEAMS).find(t => t.nflfastrAbbr === nflfastrAbbr);
  return team?.logoUrl || '';
}

function nameToSlug(name: string, team?: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  if (team) slug += `-${team.toLowerCase()}`;
  return slug;
}

function needsTeamDisambiguation(name: string, allRows: PlayerGameRow[]): boolean {
  const teams = new Set(allRows.filter(r => r.displayName === name).map(r => r.team));
  return teams.size > 1;
}

// ── PBP Aggregation with EPA ─────────────────────────────────────────

interface PlayerGameAccum {
  gameId: string;
  playerId: string;
  team: string;
  completions: number;
  attempts: number;
  passingYards: number;
  passingTds: number;
  interceptions: number;
  sacks: number;
  carries: number;
  rushingYards: number;
  rushingTds: number;
  receptions: number;
  targets: number;
  receivingYards: number;
  receivingTds: number;
  // EPA tracking — collect EPA values from all plays involving this player
  epaValues: number[];
}

/**
 * Aggregate raw PBP plays into per-game player stats with EPA metrics.
 * Each play's EPA is attributed to the primary actor:
 * - Pass plays → passer gets EPA (not receiver, to avoid double-counting)
 * - Rush plays → rusher gets EPA
 * - For receivers, we track a separate set of EPA values from their targets
 */
function aggregatePbpToPlayerGameRows(
  plays: PlayRow[],
  roster: Map<string, RosterPlayer>,
  season: number
): PlayerGameRow[] {
  const playerGames = new Map<string, PlayerGameAccum>();

  function getOrCreate(key: string, gameId: string, playerId: string, team: string): PlayerGameAccum {
    let accum = playerGames.get(key);
    if (!accum) {
      accum = {
        gameId, playerId, team,
        completions: 0, attempts: 0, passingYards: 0, passingTds: 0, interceptions: 0, sacks: 0,
        carries: 0, rushingYards: 0, rushingTds: 0,
        receptions: 0, targets: 0, receivingYards: 0, receivingTds: 0,
        epaValues: [],
      };
      playerGames.set(key, accum);
    }
    return accum;
  }

  for (const play of plays) {
    const epa = play.epa;

    // ── Passer ──
    if (play.passer_player_id && play.pass_attempt === 1) {
      const key = `${play.game_id}|${play.passer_player_id}`;
      const accum = getOrCreate(key, play.game_id, play.passer_player_id, play.posteam);
      accum.attempts += 1;
      if (play.complete_pass === 1) accum.completions += 1;
      accum.passingYards += Number(play.passing_yards) || 0;
      if (play.pass_touchdown === 1) accum.passingTds += 1;
      if (play.interception === 1) accum.interceptions += 1;
      // Passer gets EPA for all dropbacks
      if (epa !== null) accum.epaValues.push(epa);
    }

    // ── Sacks (qb_dropback without pass_attempt) ──
    if (play.passer_player_id && play.play_type === 'pass' && play.pass_attempt !== 1 && play.qb_dropback === 1) {
      const key = `${play.game_id}|${play.passer_player_id}`;
      const accum = getOrCreate(key, play.game_id, play.passer_player_id, play.posteam);
      accum.sacks += 1;
      if (epa !== null) accum.epaValues.push(epa);
    }

    // ── Rusher ──
    if (play.rusher_player_id && play.rush_attempt === 1) {
      const key = `${play.game_id}|${play.rusher_player_id}`;
      const accum = getOrCreate(key, play.game_id, play.rusher_player_id, play.posteam);
      accum.carries += 1;
      accum.rushingYards += Number(play.rushing_yards) || 0;
      if (play.rush_touchdown === 1) accum.rushingTds += 1;
      // Rusher gets EPA for designed runs (not QB scrambles counted as pass plays)
      if (epa !== null && play.qb_dropback !== 1) accum.epaValues.push(epa);
    }

    // ── Receiver ──
    if (play.receiver_player_id && play.pass_attempt === 1) {
      const key = `${play.game_id}|${play.receiver_player_id}`;
      const accum = getOrCreate(key, play.game_id, play.receiver_player_id, play.posteam);
      accum.targets += 1;
      if (play.complete_pass === 1) {
        accum.receptions += 1;
        accum.receivingYards += Number(play.receiving_yards) || 0;
      }
      if (play.pass_touchdown === 1 && play.complete_pass === 1) accum.receivingTds += 1;
      // Receiver gets EPA from targets (separate from passer EPA)
      if (epa !== null) accum.epaValues.push(epa);
    }
  }

  // Convert accumulators to PlayerGameRow
  const result: PlayerGameRow[] = [];

  for (const accum of playerGames.values()) {
    const rosterInfo = roster.get(accum.playerId);
    if (!rosterInfo) continue;
    if (!isSkillPosition(rosterInfo.position)) continue;

    const hasMeaningfulStats = accum.attempts > 0 || accum.carries > 0 || accum.targets > 0;
    if (!hasMeaningfulStats) continue;

    const week = parseWeekFromGameId(accum.gameId);
    const opponent = deriveOpponent(accum.gameId, accum.team);

    const totalEpa = accum.epaValues.reduce((sum, v) => sum + v, 0);
    const epaPlays = accum.epaValues.length;
    const epaPerPlay = epaPlays > 0 ? totalEpa / epaPlays : 0;

    result.push({
      playerId: accum.playerId,
      displayName: rosterInfo.fullName,
      position: rosterInfo.position,
      headshotUrl: rosterInfo.headshotUrl,
      team: accum.team,
      season,
      week,
      opponentTeam: opponent,
      completions: accum.completions,
      attempts: accum.attempts,
      passingYards: accum.passingYards,
      passingTds: accum.passingTds,
      interceptions: accum.interceptions,
      sacks: accum.sacks,
      carries: accum.carries,
      rushingYards: accum.rushingYards,
      rushingTds: accum.rushingTds,
      receptions: accum.receptions,
      targets: accum.targets,
      receivingYards: accum.receivingYards,
      receivingTds: accum.receivingTds,
      totalEpa: Math.round(totalEpa * 100) / 100,
      epaPerPlay: Math.round(epaPerPlay * 1000) / 1000,
      epaPlays,
    });
  }

  return result;
}

// ── Data Cache ───────────────────────────────────────────────────────

const dataCache = new Map<number, { data: PlayerGameRow[]; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getPlayerData(season: number): Promise<PlayerGameRow[]> {
  const now = Date.now();
  const cached = dataCache.get(season);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  console.log(`[player-stats] Fetching PBP + roster for ${season}...`);
  const startTime = Date.now();

  const [plays, roster] = await Promise.all([
    fetchAllSeasonPlays(season),
    fetchRosterDetails(season),
  ]);

  console.log(`[player-stats] Fetched ${plays.length} plays + ${roster.size} roster entries in ${Date.now() - startTime}ms`);

  const aggregated = aggregatePbpToPlayerGameRows(plays, roster, season);
  console.log(`[player-stats] Aggregated into ${aggregated.length} player-game rows in ${Date.now() - startTime}ms`);

  dataCache.set(season, { data: aggregated, timestamp: now });
  return aggregated;
}

// ── Season Summary ───────────────────────────────────────────────────

function computeSeasonSummary(games: PlayerGameRow[]) {
  const gamesPlayed = games.length;
  const sum = (fn: (g: PlayerGameRow) => number) => games.reduce((acc, g) => acc + fn(g), 0);

  const completions = sum(g => g.completions);
  const attempts = sum(g => g.attempts);
  const passingYards = sum(g => g.passingYards);
  const passingTds = sum(g => g.passingTds);
  const interceptions = sum(g => g.interceptions);
  const carries = sum(g => g.carries);
  const rushingYards = sum(g => g.rushingYards);
  const rushingTds = sum(g => g.rushingTds);
  const receptions = sum(g => g.receptions);
  const targets = sum(g => g.targets);
  const receivingYards = sum(g => g.receivingYards);
  const receivingTds = sum(g => g.receivingTds);

  const passerRating = calculatePasserRating(completions, attempts, passingYards, passingTds, interceptions);

  return {
    gamesPlayed,
    completions, attempts, passingYards, passingTds, interceptions,
    completionPct: attempts > 0 ? Math.round((completions / attempts) * 1000) / 10 : 0,
    passerRating,
    carries, rushingYards, rushingTds,
    yardsPerCarry: carries > 0 ? Math.round((rushingYards / carries) * 10) / 10 : 0,
    receptions, targets, receivingYards, receivingTds,
    yardsPerReception: receptions > 0 ? Math.round((receivingYards / receptions) * 10) / 10 : 0,
  };
}

// ── Route Handler ────────────────────────────────────────────────────

export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const slug = searchParams.get('slug');
  const season = parseInt(searchParams.get('season') || '2025');

  if (!search && !slug) {
    return NextResponse.json({ error: 'Either "search" or "slug" query parameter is required' }, { status: 400 });
  }

  try {
    const seasonData = await getPlayerData(season);

    // ── Search Mode ──────────────────────────────────────────────
    if (search) {
      const query = search.toLowerCase().trim();
      if (query.length < 2) {
        return NextResponse.json({ players: [] });
      }

      const playerMap = new Map<string, { name: string; position: string; team: string; headshot: string }>();
      for (const row of seasonData) {
        if (!row.displayName) continue;
        if (!row.displayName.toLowerCase().includes(query)) continue;

        const key = `${row.displayName}__${row.team}`;
        if (!playerMap.has(key)) {
          playerMap.set(key, {
            name: row.displayName,
            position: row.position,
            team: row.team,
            headshot: row.headshotUrl,
          });
        }
      }

      const results = Array.from(playerMap.values())
        .slice(0, 10)
        .map(p => {
          const needsTeam = needsTeamDisambiguation(p.name, seasonData);
          return {
            name: p.name,
            slug: nameToSlug(p.name, needsTeam ? p.team : undefined),
            position: p.position,
            team: nflfastrToAppAbbr(p.team),
            teamLogo: getTeamLogo(p.team),
            headshot: p.headshot,
          };
        });

      return NextResponse.json(
        { players: results },
        { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
      );
    }

    // ── Player Detail Mode ───────────────────────────────────────
    if (slug) {
      let matchedName: string | null = null;
      let matchedTeam: string | null = null;

      for (const row of seasonData) {
        if (!row.displayName) continue;
        const needsTeam = needsTeamDisambiguation(row.displayName, seasonData);
        const playerSlug = nameToSlug(row.displayName, needsTeam ? row.team : undefined);
        if (playerSlug === slug) {
          matchedName = row.displayName;
          matchedTeam = row.team;
          break;
        }
      }

      if (!matchedName) {
        for (const row of seasonData) {
          if (!row.displayName) continue;
          const playerSlug = nameToSlug(row.displayName);
          if (playerSlug === slug || slug.startsWith(playerSlug)) {
            matchedName = row.displayName;
            matchedTeam = row.team;
            break;
          }
        }
      }

      if (!matchedName) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }

      const playerGames = seasonData
        .filter(r => r.displayName === matchedName && (!matchedTeam || r.team === matchedTeam))
        .sort((a, b) => a.week - b.week);

      if (playerGames.length === 0) {
        return NextResponse.json({ error: 'No games found for player' }, { status: 404 });
      }

      const firstRow = playerGames[0];
      const position = firstRow.position;
      const team = nflfastrToAppAbbr(firstRow.team);

      const games = playerGames.map(g => ({
        week: g.week,
        season: g.season,
        opponent: nflfastrToAppAbbr(g.opponentTeam),
        completions: g.completions,
        attempts: g.attempts,
        passingYards: g.passingYards,
        passingTds: g.passingTds,
        interceptions: g.interceptions,
        carries: g.carries,
        rushingYards: g.rushingYards,
        rushingTds: g.rushingTds,
        receptions: g.receptions,
        targets: g.targets,
        receivingYards: g.receivingYards,
        receivingTds: g.receivingTds,
        fantasyPoints: 0,
        passerRating: calculatePasserRating(g.completions, g.attempts, g.passingYards, g.passingTds, g.interceptions),
        sacks: g.sacks,
        sackYards: 0,
        rushingFumbles: 0,
        rushingFumblesLost: 0,
        receivingFumbles: 0,
        receivingFumblesLost: 0,
        specialTeamsTds: 0,
        // EPA metrics
        totalEpa: g.totalEpa,
        epaPerPlay: g.epaPerPlay,
        plays: g.epaPlays,
      }));

      const seasonSummary = computeSeasonSummary(playerGames);
      const needsTeam = needsTeamDisambiguation(matchedName, seasonData);

      return NextResponse.json(
        {
          player: {
            name: matchedName,
            slug: nameToSlug(matchedName, needsTeam ? firstRow.team : undefined),
            position,
            team,
            teamLogo: getTeamLogo(firstRow.team),
            headshot: firstRow.headshotUrl,
            games,
            season: seasonSummary,
          },
        },
        { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[player-stats] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
