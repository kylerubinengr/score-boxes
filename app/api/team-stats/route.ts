import { NextResponse } from 'next/server';
import { getTeamStats } from '@/services/matchupService';

export const maxDuration = 60; // PBP CSV streaming can take time on first load

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get('team');
  const seasonStr = searchParams.get('season');
  const season = seasonStr ? parseInt(seasonStr, 10) : undefined;

  if (!team) {
    return NextResponse.json({ error: 'team query parameter is required' }, { status: 400 });
  }

  const stats = await getTeamStats(team, season);
  if (!stats) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
