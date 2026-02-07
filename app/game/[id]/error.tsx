"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Game page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Failed to load game
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Could not load game details. The game may not exist or the data source may be temporarily unavailable.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            Back to scores
          </Link>
        </div>
      </div>
    </div>
  );
}
