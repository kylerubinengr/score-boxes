import { Target, BarChart3, Zap, Crosshair } from "lucide-react";
import type { AdvancedTeamStats, RankedStat } from "@/services/matchupService";
import type { LeagueContext } from "@/types/teamStats";
import type { StatRowConfig, StatSectionConfig } from "./constants";
import { StickyColumnHeader } from "./StickyColumnHeader";
import { StatRow } from "./StatRow";

const ICON_MAP = {
  Target,
  BarChart3,
  Zap,
  Crosshair,
} as const;

export function StatSectionCard({
  config,
  stats,
  leagueContext,
  primaryColor,
  darkAccentColor,
}: {
  config: StatSectionConfig;
  stats: AdvancedTeamStats;
  leagueContext: LeagueContext;
  primaryColor: string;
  darkAccentColor: string;
}) {
  const Icon = ICON_MAP[config.iconName];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Icon
          className="w-4 h-4"
          style={{ color: primaryColor }}
        />
        <h3 className="text-xs font-bold uppercase tracking-wider">
          <span className="dark:hidden" style={{ color: primaryColor }}>
            {config.title}
          </span>
          <span
            className="hidden dark:inline"
            style={{ color: darkAccentColor }}
          >
            {config.title}
          </span>
        </h3>
      </div>

      {/* Sticky column labels */}
      <StickyColumnHeader />

      {/* Stat rows */}
      {config.rows.map((row: StatRowConfig, idx: number) => {
        const offStat = stats[row.offKey] as RankedStat;
        const defStat = row.defKey
          ? (stats[row.defKey] as RankedStat)
          : undefined;

        return (
          <StatRow
            key={row.label}
            label={row.label}
            offStat={offStat || { value: "N/A" }}
            defStat={defStat}
            offLeagueContext={leagueContext[row.leagueContextOffKey]}
            defLeagueContext={
              row.leagueContextDefKey
                ? leagueContext[row.leagueContextDefKey]
                : undefined
            }
            tooltip={row.tooltip}
            isOdd={idx % 2 === 1}
          />
        );
      })}
    </div>
  );
}
