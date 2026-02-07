import { PlayerSearchResult, PlayerDetail } from '@/types/nfl';

export async function searchPlayers(
  query: string,
  season: number
): Promise<PlayerSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    search: query.trim(),
    season: season.toString(),
  });

  const response = await fetch(`/api/player-stats?${params}`);
  if (!response.ok) {
    console.error('[playerService] Search failed:', response.statusText);
    return [];
  }

  const data = await response.json();
  return data.players || [];
}

export async function getPlayerBySlug(
  slug: string,
  season: number
): Promise<PlayerDetail | null> {
  const params = new URLSearchParams({
    slug,
    season: season.toString(),
  });

  const response = await fetch(`/api/player-stats?${params}`);
  if (!response.ok) {
    console.error('[playerService] Player fetch failed:', response.statusText);
    return null;
  }

  const data = await response.json();
  return data.player || null;
}
