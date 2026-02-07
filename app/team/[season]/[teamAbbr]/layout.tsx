import type { Metadata } from "next";
import { TEAM_NAMES } from "@/constants/teams";

export async function generateMetadata({ params }: { params: Promise<{ season: string; teamAbbr: string }> }): Promise<Metadata> {
  const { season, teamAbbr } = await params;
  const abbr = teamAbbr.toUpperCase();
  const teamName = TEAM_NAMES[abbr] || abbr;
  return {
    title: `${teamName} ${season} Stats | Score Boxes`,
    description: `${teamName} game results, stats, and schedule for the ${season} NFL season.`,
  };
}

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
