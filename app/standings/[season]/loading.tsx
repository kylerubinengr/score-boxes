import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function StandingsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <LoadingSpinner />
    </div>
  );
}
