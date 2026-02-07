import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const playerName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return {
    title: `${playerName} Stats | Score Boxes`,
    description: `NFL stats and game log for ${playerName}.`,
  };
}

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
