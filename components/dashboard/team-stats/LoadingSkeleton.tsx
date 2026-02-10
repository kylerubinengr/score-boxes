export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Record card skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-t-xl mb-4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-14 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
          ))}
        </div>
      </div>

      {/* Stat cards skeleton (2x2 grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28 mb-4" />
            <div className="space-y-3">
              {[...Array(i < 2 ? 3 : 6)].map((_, j) => (
                <div
                  key={j}
                  className="h-8 bg-slate-200 dark:bg-slate-700 rounded"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
