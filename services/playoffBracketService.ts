import { Game, Team, PlayoffTeam, BracketGame, BracketRoundData, BracketStructure, PlayoffRound, GameStatus } from "@/types/nfl";
import { getGamesByWeek } from "./gameService";
import { getTeamByAbbr } from "@/constants/teams";

/**
 * Fetch all playoff games for a given season
 * @param year - Season year (e.g., 2024, 2025)
 * @param conference - Optional filter for AFC or NFC
 * @returns Array of playoff games
 */
export async function getPlayoffGames(
  year: number,
  conference?: 'AFC' | 'NFC'
): Promise<Game[]> {
  const playoffGames: Game[] = [];

  // Fetch playoff weeks (1=Wild Card, 2=Divisional, 3=Championship, 5=Super Bowl)
  for (const week of [1, 2, 3, 5]) {
    try {
      const { games } = await getGamesByWeek(week, 3, year); // seasonType=3 for playoffs
      playoffGames.push(...games);
    } catch (error) {
      console.warn(`No playoff games found for week ${week}, year ${year}`);
    }
  }

  // Filter by conference if specified
  if (conference) {
    return playoffGames.filter(game => {
      // Exclude Super Bowl from conference brackets (it's AFC vs NFC)
      if (game.week === 5) return false;

      // For playoff games, BOTH teams must be from the same conference
      return isTeamInConference(game.homeTeam, conference) &&
             isTeamInConference(game.awayTeam, conference);
    });
  }

  return playoffGames;
}

/**
 * Check if a team belongs to a specific conference
 */
function isTeamInConference(team: Team, conference: 'AFC' | 'NFC'): boolean {
  const teamData = getTeamByAbbr(team.abbreviation);
  return teamData?.conference === conference;
}

/**
 * Build bracket structure from playoff games and seed information
 * Uses strict slot-based approach with fixed card counts per round
 * @param playoffGames - Array of playoff games from ESPN
 * @param seeds - Playoff teams (seeds 1-7) for this conference
 * @returns Structured bracket data for rendering
 */
export function buildBracketStructure(
  playoffGames: Game[],
  seeds: PlayoffTeam[]
): BracketStructure {
  // Initialize fixed bracket structure with exact slot counts
  const rounds: BracketRoundData[] = [
    { round: 'WILD_CARD', week: 1, games: [] },    // 4 cards: 1 bye + 3 games
    { round: 'DIVISIONAL', week: 2, games: [] },   // 2 cards
    { round: 'CHAMPIONSHIP', week: 3, games: [] }, // 1 card
  ];

  // Get games by round
  const wildCardGames = playoffGames.filter(g => g.week === 1);
  const divisionalGames = playoffGames.filter(g => g.week === 2);
  const championshipGames = playoffGames.filter(g => g.week === 3);

  // Build Wild Card round (4 slots total)
  rounds[0].games = buildWildCardRound(wildCardGames, seeds);

  // Build Divisional round (2 slots total)
  rounds[1].games = buildDivisionalRound(divisionalGames, wildCardGames, seeds);

  // Build Championship round (1 slot total)
  rounds[2].games = buildChampionshipRound(championshipGames);

  // Determine conference from seeds
  const conference = seeds[0]?.abbreviation ?
    getTeamByAbbr(seeds[0].abbreviation)?.conference || 'AFC' : 'AFC';

  return {
    conference: conference as 'AFC' | 'NFC',
    rounds,
    lastUpdated: Date.now()
  };
}

/**
 * Build Wild Card round with fixed 4 slots: 1 bye + 3 games
 */
function buildWildCardRound(games: Game[], seeds: PlayoffTeam[]): BracketGame[] {
  const slots: BracketGame[] = [];
  const seed1 = seeds.find(s => s.seed === 1);

  // Slot 0: #1 Seed Bye Week (always first)
  slots.push({
    id: null,
    round: 'WILD_CARD',
    position: 0,
    homeTeam: seed1,
    homeSeed: 1,
    status: 'TBD',
    isByeWeek: true,
  });

  // Slots 1-3: Wild Card Games (2v7, 3v6, 4v5)
  const expectedMatchups = [
    { home: 2, away: 7 },
    { home: 3, away: 6 },
    { home: 4, away: 5 },
  ];

  expectedMatchups.forEach((matchup, index) => {
    // Try to find actual game for this matchup
    const actualGame = games.find(g => {
      const homeSeed = findSeed(g.homeTeam, seeds);
      const awaySeed = findSeed(g.awayTeam, seeds);
      return (homeSeed === matchup.home && awaySeed === matchup.away) ||
             (homeSeed === matchup.away && awaySeed === matchup.home);
    });

    if (actualGame) {
      // Game exists - use real data
      slots.push({
        id: actualGame.id,
        game: actualGame,
        round: 'WILD_CARD',
        position: index + 1,
        homeTeam: actualGame.homeTeam,
        awayTeam: actualGame.awayTeam,
        homeSeed: findSeed(actualGame.homeTeam, seeds),
        awaySeed: findSeed(actualGame.awayTeam, seeds),
        status: mapGameStatus(actualGame.status),
        winnerId: actualGame.winnerId,
      });
    } else {
      // Game doesn't exist yet - create TBD slot with expected seeds
      const homeTeam = seeds.find(s => s.seed === matchup.home);
      const awayTeam = seeds.find(s => s.seed === matchup.away);

      slots.push({
        id: null,
        round: 'WILD_CARD',
        position: index + 1,
        homeTeam,
        awayTeam,
        homeSeed: matchup.home,
        awaySeed: matchup.away,
        status: 'TBD',
      });
    }
  });

  return slots; // Always returns exactly 4 cards
}

/**
 * Build Divisional round with fixed 2 slots
 * Only shows actual matchups if Wild Card games are complete
 */
function buildDivisionalRound(
  divisionalGames: Game[],
  wildCardGames: Game[],
  seeds: PlayoffTeam[]
): BracketGame[] {
  const slots: BracketGame[] = [];

  // Check if all Wild Card games are final
  const allWildCardComplete = wildCardGames.length === 3 &&
    wildCardGames.every(g => g.status === 'post');

  if (allWildCardComplete) {
    // Determine actual matchups based on Wild Card winners
    const divisionalMatchups = getDivisionalMatchups(wildCardGames, seeds);

    divisionalMatchups.forEach((matchup, index) => {
      // Try to find actual game
      const actualGame = divisionalGames.find(g =>
        (g.homeTeam.id === matchup.home.id && g.awayTeam.id === matchup.away.id) ||
        (g.homeTeam.id === matchup.away.id && g.awayTeam.id === matchup.home.id)
      );

      if (actualGame) {
        slots.push({
          id: actualGame.id,
          game: actualGame,
          round: 'DIVISIONAL',
          position: index,
          homeTeam: actualGame.homeTeam,
          awayTeam: actualGame.awayTeam,
          homeSeed: findSeed(actualGame.homeTeam, seeds),
          awaySeed: findSeed(actualGame.awayTeam, seeds),
          status: mapGameStatus(actualGame.status),
          winnerId: actualGame.winnerId,
        });
      } else {
        // Game scheduled but not in API yet
        slots.push({
          id: null,
          round: 'DIVISIONAL',
          position: index,
          homeTeam: matchup.home,
          awayTeam: matchup.away,
          homeSeed: matchup.homeSeed,
          awaySeed: matchup.awaySeed,
          status: 'SCHEDULED',
        });
      }
    });
  } else {
    // Wild Card not complete - show 2 TBD slots
    for (let i = 0; i < 2; i++) {
      slots.push({
        id: null,
        round: 'DIVISIONAL',
        position: i,
        status: 'TBD',
      });
    }
  }

  return slots; // Always returns exactly 2 cards
}

/**
 * Build Championship round with fixed 1 slot
 */
function buildChampionshipRound(championshipGames: Game[]): BracketGame[] {
  const slots: BracketGame[] = [];

  if (championshipGames.length > 0) {
    const game = championshipGames[0];
    slots.push({
      id: game.id,
      game,
      round: 'CHAMPIONSHIP',
      position: 0,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      status: mapGameStatus(game.status),
      winnerId: game.winnerId,
    });
  } else {
    // No championship game yet - show TBD
    slots.push({
      id: null,
      round: 'CHAMPIONSHIP',
      position: 0,
      status: 'TBD',
    });
  }

  return slots; // Always returns exactly 1 card
}

/**
 * Determine Divisional round matchups based on Wild Card results
 * NFL re-seeds: #1 plays lowest seed, highest remaining plays next lowest
 */
function getDivisionalMatchups(
  wildCardGames: Game[],
  seeds: PlayoffTeam[]
): Array<{ home: Team | PlayoffTeam; away: Team | PlayoffTeam; homeSeed: number; awaySeed: number }> {
  // Get winners from Wild Card
  const winners = wildCardGames
    .filter(g => g.winnerId)
    .map(g => {
      const winner = g.winnerId === g.homeTeam.id ? g.homeTeam : g.awayTeam;
      const seed = findSeed(winner, seeds);
      return { team: winner, seed: seed || 99 };
    })
    .sort((a, b) => a.seed - b.seed); // Sort by seed (lowest first)

  if (winners.length !== 3) {
    return []; // Not all games complete
  }

  const seed1 = seeds.find(s => s.seed === 1);
  if (!seed1) return [];

  // Matchup 1: #1 seed (bye) vs lowest remaining seed (winner with highest seed number)
  const lowestSeed = winners[2]; // Highest seed number = lowest ranked team

  // Matchup 2: Highest remaining seed vs next lowest
  const highestRemaining = winners[0];
  const nextLowest = winners[1];

  return [
    {
      home: seed1,
      away: lowestSeed.team,
      homeSeed: 1,
      awaySeed: lowestSeed.seed,
    },
    {
      home: highestRemaining.team,
      away: nextLowest.team,
      homeSeed: highestRemaining.seed,
      awaySeed: nextLowest.seed,
    },
  ];
}

/**
 * Determine playoff round from ESPN week number
 */
function determineRound(week: number): PlayoffRound {
  switch(week) {
    case 1: return 'WILD_CARD';
    case 2: return 'DIVISIONAL';
    case 3: return 'CHAMPIONSHIP';
    case 5: return 'SUPER_BOWL';
    default: return 'WILD_CARD';
  }
}

/**
 * Find seed number for a team
 */
function findSeed(team: Team, seeds: PlayoffTeam[]): number | undefined {
  const found = seeds.find(s =>
    s.abbreviation === team.abbreviation ||
    s.name === team.name ||
    s.id === team.id
  );
  return found?.seed;
}

/**
 * Map GameStatus to BracketGame status
 */
function mapGameStatus(status: GameStatus): 'TBD' | 'SCHEDULED' | 'LIVE' | 'FINAL' {
  switch(status) {
    case 'pre': return 'SCHEDULED';
    case 'in': return 'LIVE';
    case 'post': return 'FINAL';
    default: return 'TBD';
  }
}

