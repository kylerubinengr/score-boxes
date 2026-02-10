const getOrdinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

function getRankColorClass(rank: number): string {
  if (rank <= 5) {
    // Elite: Deep Emerald Green
    return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
  }
  if (rank <= 12) {
    // Above Average: Soft Sage Green
    return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-500 dark:border-green-800/60";
  }
  if (rank <= 20) {
    // Neutral: Muted Slate
    return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
  }
  if (rank <= 27) {
    // Below Average: Dusty Amber
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/60";
  }
  // Poor (28-32): Soft Crimson
  return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
}

export function RankBadge({ rank }: { rank?: number }) {
  if (!rank) return null;

  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center justify-center min-w-[36px] ${getRankColorClass(rank)}`}
    >
      {getOrdinal(rank)}
    </span>
  );
}
