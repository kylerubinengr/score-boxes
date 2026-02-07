import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ season: string }> }): Promise<Metadata> {
  const { season } = await params;
  return {
    title: `${season} NFL Standings | Score Boxes`,
    description: `NFL conference standings and playoff picture for the ${season} season.`,
  };
}

export default function StandingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
