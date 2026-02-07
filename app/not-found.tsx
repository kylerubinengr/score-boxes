import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-black text-slate-300 dark:text-slate-700 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Page not found
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
        >
          Back to scores
        </Link>
      </div>
    </div>
  );
}
