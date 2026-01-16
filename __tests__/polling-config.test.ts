import { getPollingInterval, hasGameChanged, generateGameHash, POLLING_INTERVALS } from '@/lib/polling-config';
import { Game, GameStatus } from '@/types/nfl';

describe('polling-config', () => {
  describe('getPollingInterval', () => {
    it('should return null when tab is hidden', () => {
      const interval = getPollingInterval('in', false, false);
      expect(interval).toBeNull();
    });

    it('should return ERROR_BACKOFF interval when there is an error', () => {
      const interval = getPollingInterval('in', true, true);
      expect(interval).toBe(POLLING_INTERVALS.ERROR_BACKOFF);
    });

    it('should return PRE_GAME interval for pre-game status', () => {
      const interval = getPollingInterval('pre', true, false);
      expect(interval).toBe(POLLING_INTERVALS.PRE_GAME);
    });

    it('should return LIVE_GAME interval for live game status', () => {
      const interval = getPollingInterval('in', true, false);
      expect(interval).toBe(POLLING_INTERVALS.LIVE_GAME);
    });

    it('should return null for post-game status', () => {
      const interval = getPollingInterval('post', true, false);
      expect(interval).toBeNull();
    });
  });

  describe('hasGameChanged', () => {
    const createMockGame = (overrides: Partial<Game> = {}): Game => ({
      id: '1',
      week: 1,
      date: '2025-01-01',
      venue: 'Test Stadium',
      venueLocation: 'Test City, TS',
      homeTeam: {
        id: '1',
        name: 'Home Team',
        abbreviation: 'HT',
        record: '0-0',
        logoUrl: 'http://test.com/logo.png',
        color: '#000000',
      },
      awayTeam: {
        id: '2',
        name: 'Away Team',
        abbreviation: 'AT',
        record: '0-0',
        logoUrl: 'http://test.com/logo.png',
        color: '#FFFFFF',
      },
      weather: { temperature: 70, condition: 'Sunny', windSpeed: 5, precipChance: 0 },
      broadcast: 'TEST',
      isLive: false,
      indoor: false,
      status: 'pre',
      homeScore: 0,
      awayScore: 0,
      ...overrides,
    });

    it('should return true when prev is null', () => {
      const current = createMockGame();
      expect(hasGameChanged(null, current)).toBe(true);
    });

    it('should return true when home score changes', () => {
      const prev = createMockGame({ homeScore: 0 });
      const current = createMockGame({ homeScore: 7 });
      expect(hasGameChanged(prev, current)).toBe(true);
    });

    it('should return true when away score changes', () => {
      const prev = createMockGame({ awayScore: 0 });
      const current = createMockGame({ awayScore: 3 });
      expect(hasGameChanged(prev, current)).toBe(true);
    });

    it('should return true when status changes', () => {
      const prev = createMockGame({ status: 'pre' });
      const current = createMockGame({ status: 'in' });
      expect(hasGameChanged(prev, current)).toBe(true);
    });

    it('should return true when drive ID changes', () => {
      const prev = createMockGame({
        drives: [{
          id: 'drive1',
          description: 'Test drive',
          team: { id: '1', logo: '', abbreviation: 'HT', color: '#000' },
          result: 'Touchdown',
          yards: 75,
          timeElapsed: '5:00',
          playCount: 10,
          plays: [],
          isScore: true,
          startQuarter: 1,
          endQuarter: 1,
          homeScoreAfter: 7,
          awayScoreAfter: 0,
        }],
      });
      const current = createMockGame({
        drives: [{
          id: 'drive2',
          description: 'Test drive',
          team: { id: '1', logo: '', abbreviation: 'HT', color: '#000' },
          result: 'Touchdown',
          yards: 75,
          timeElapsed: '5:00',
          playCount: 10,
          plays: [],
          isScore: true,
          startQuarter: 1,
          endQuarter: 1,
          homeScoreAfter: 7,
          awayScoreAfter: 0,
        }],
      });
      expect(hasGameChanged(prev, current)).toBe(true);
    });

    it('should return false when nothing meaningful has changed', () => {
      const prev = createMockGame({ homeScore: 7, awayScore: 3, status: 'in' });
      const current = createMockGame({ homeScore: 7, awayScore: 3, status: 'in' });
      expect(hasGameChanged(prev, current)).toBe(false);
    });
  });

  describe('generateGameHash', () => {
    const createMockGame = (overrides: Partial<Game> = {}): Game => ({
      id: '1',
      week: 1,
      date: '2025-01-01',
      venue: 'Test Stadium',
      venueLocation: 'Test City, TS',
      homeTeam: {
        id: '1',
        name: 'Home Team',
        abbreviation: 'HT',
        record: '0-0',
        logoUrl: 'http://test.com/logo.png',
        color: '#000000',
      },
      awayTeam: {
        id: '2',
        name: 'Away Team',
        abbreviation: 'AT',
        record: '0-0',
        logoUrl: 'http://test.com/logo.png',
        color: '#FFFFFF',
      },
      weather: { temperature: 70, condition: 'Sunny', windSpeed: 5, precipChance: 0 },
      broadcast: 'TEST',
      isLive: false,
      indoor: false,
      status: 'pre',
      homeScore: 0,
      awayScore: 0,
      ...overrides,
    });

    it('should generate consistent hash for same game data', () => {
      const game1 = createMockGame();
      const game2 = createMockGame();
      expect(generateGameHash(game1)).toBe(generateGameHash(game2));
    });

    it('should generate different hash when score changes', () => {
      const game1 = createMockGame({ homeScore: 0 });
      const game2 = createMockGame({ homeScore: 7 });
      expect(generateGameHash(game1)).not.toBe(generateGameHash(game2));
    });

    it('should generate different hash when status changes', () => {
      const game1 = createMockGame({ status: 'pre' });
      const game2 = createMockGame({ status: 'in' });
      expect(generateGameHash(game1)).not.toBe(generateGameHash(game2));
    });
  });
});
