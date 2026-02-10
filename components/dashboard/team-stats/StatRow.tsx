import type { RankedStat } from "@/services/matchupService";
import type { LeagueMetricContext } from "@/types/teamStats";
import { RankBadge } from "./RankBadge";
import { LeagueContextTooltip } from "./LeagueContextTooltip";
import { Info } from "lucide-react";

function DescriptionTooltip({ text }: { text: string }) {
  return (
    <span className="group/desc relative inline-flex items-center">
      <Info className="w-3 h-3 text-slate-400 cursor-help hover:text-blue-500 transition-colors" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/desc:block w-44 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl z-50 normal-case tracking-normal font-medium leading-relaxed text-center pointer-events-none">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </span>
    </span>
  );
}

function StatCell({
  stat,
  label,
  leagueContext,
}: {
  stat: RankedStat;
  label: string;
  leagueContext?: LeagueMetricContext;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 min-w-0 py-0.5">
      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums truncate">
        {stat.value}
      </span>
      <LeagueContextTooltip label={label} context={leagueContext} />
      <RankBadge rank={stat.rank} />
    </div>
  );
}

export function StatRow({
  label,
  offStat,
  defStat,
  offLeagueContext,
  defLeagueContext,
  tooltip,
  isOdd,
}: {
  label: string;
  offStat: RankedStat;
  defStat?: RankedStat;
  offLeagueContext?: LeagueMetricContext;
  defLeagueContext?: LeagueMetricContext;
  tooltip?: string;
  isOdd: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[1.2fr_1fr_1fr] items-center gap-x-4 sm:gap-x-6 py-2 sm:py-2.5 px-3 sm:px-4 border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 hover:bg-slate-100/60 dark:hover:bg-slate-700/20 transition-colors ${
        isOdd ? "bg-slate-50/50 dark:bg-slate-800/[0.08]" : ""
      }`}
    >
      {/* Label column */}
      <span className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1 pr-1">
        {label}
        {tooltip && <DescriptionTooltip text={tooltip} />}
      </span>

      {/* Offense cell */}
      <StatCell
        stat={offStat}
        label={`${label} (Off)`}
        leagueContext={offLeagueContext}
      />

      {/* Defense cell */}
      {defStat ? (
        <StatCell
          stat={defStat}
          label={`${label} (Def)`}
          leagueContext={defLeagueContext}
        />
      ) : (
        <div className="flex items-center justify-center py-0.5">
          <span className="text-sm text-slate-300 dark:text-slate-600">—</span>
        </div>
      )}
    </div>
  );
}
