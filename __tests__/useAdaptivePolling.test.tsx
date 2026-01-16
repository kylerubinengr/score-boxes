import { renderHook, waitFor, act } from '@testing-library/react';
import { useAdaptivePolling } from '@/hooks/useAdaptivePolling';
import { Game } from '@/types/nfl';

// Mock the polling config
jest.mock('@/lib/polling-config', () => ({
  getPollingInterval: jest.fn((status, isVisible, hasError) => {
    if (!isVisible) return null;
    if (hasError) return 30000;
    if (status === 'pre') return 60000;
    if (status === 'in') return 10000;
    if (status === 'post') return null;
    return 10000;
  }),
  hasGameChanged: jest.fn(() => true),
  generateGameHash: jest.fn(() => 'test-hash'),
}));

describe('useAdaptivePolling', () => {
  const mockGame: Game = {
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
    isLive: true,
    indoor: false,
    status: 'in',
    homeScore: 0,
    awayScore: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should call fetchFunction immediately on mount', async () => {
    const mockFetch = jest.fn().mockResolvedValue(mockGame);
    const mockUpdate = jest.fn();

    renderHook(() =>
      useAdaptivePolling({
        gameId: '1',
        initialStatus: 'in',
        fetchFunction: mockFetch,
        onUpdate: mockUpdate,
      })
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('1', undefined);
    });
  });

  it('should poll at correct interval for live games', async () => {
    const mockFetch = jest.fn().mockResolvedValue(mockGame);
    const mockUpdate = jest.fn();

    renderHook(() =>
      useAdaptivePolling({
        gameId: '1',
        initialStatus: 'in',
        fetchFunction: mockFetch,
        onUpdate: mockUpdate,
      })
    );

    // Wait for initial fetch
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    // Advance timer by 10 seconds (live game interval)
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });

  it('should not poll when status is post', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ...mockGame, status: 'post' });
    const mockUpdate = jest.fn();

    renderHook(() =>
      useAdaptivePolling({
        gameId: '1',
        initialStatus: 'post',
        fetchFunction: mockFetch,
        onUpdate: mockUpdate,
      })
    );

    // Wait a bit to see if it polls
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // Should not poll for post-game
    expect(mockFetch).toHaveBeenCalledTimes(0);
  });

  it('should handle errors and trigger onError callback', async () => {
    const error = new Error('Fetch failed');
    const mockFetch = jest.fn().mockRejectedValue(error);
    const mockUpdate = jest.fn();
    const mockError = jest.fn();

    renderHook(() =>
      useAdaptivePolling({
        gameId: '1',
        initialStatus: 'in',
        fetchFunction: mockFetch,
        onUpdate: mockUpdate,
        onError: mockError,
      })
    );

    await waitFor(() => {
      expect(mockError).toHaveBeenCalledWith(error);
    });
  });

  it('should cleanup interval on unmount', async () => {
    const mockFetch = jest.fn().mockResolvedValue(mockGame);
    const mockUpdate = jest.fn();

    const { unmount } = renderHook(() =>
      useAdaptivePolling({
        gameId: '1',
        initialStatus: 'in',
        fetchFunction: mockFetch,
        onUpdate: mockUpdate,
      })
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    unmount();

    // Advance timer after unmount
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Should not call fetch again after unmount
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should return correct polling state', async () => {
    const mockFetch = jest.fn().mockResolvedValue(mockGame);
    const mockUpdate = jest.fn();

    const { result } = renderHook(() =>
      useAdaptivePolling({
        gameId: '1',
        initialStatus: 'in',
        fetchFunction: mockFetch,
        onUpdate: mockUpdate,
      })
    );

    await waitFor(() => {
      expect(result.current.isPolling).toBe(true);
      expect(result.current.currentStatus).toBe('in');
      expect(result.current.hasError).toBe(false);
      expect(result.current.isVisible).toBe(true);
    });
  });
});
