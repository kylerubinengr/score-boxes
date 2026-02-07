import type { Metadata } from "next";
import { isPlayoffSlug, getPlayoffFullName } from "@/lib/routes";

export async function generateMetadata({ params }: { params: Promise<{ season: string; week: string }> }): Promise<Metadata> {
  const { season, week } = await params;
  const weekLabel = isPlayoffSlug(week) ? getPlayoffFullName(week) : `Week ${week}`;
  return {
    title: `${weekLabel}, ${season} Scores | Score Boxes`,
    description: `NFL scores for ${weekLabel} of the ${season} season.`,
  };
}

export default function ScoresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
