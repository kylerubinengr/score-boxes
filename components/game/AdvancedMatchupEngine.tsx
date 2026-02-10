import React from "react";
import { Team } from "@/types/nfl";
import { MatchupComparison, RankedStat } from "@/services/matchupService";
import { SafeImage } from "../common/SafeImage";
import { Info } from "lucide-react";

interface AdvancedMatchupEngineProps {
  homeTeam: Team;
  awayTeam: Team;
  comparison: MatchupComparison;
}

// --- Helpers ---

const getOrdinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const hexToRgba = (hex: string = "#000000", alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Parse helpers for non-ranked stats
const parseRecordPct = (rec: string) => {
    const [w, l, t] = rec.split('-').map(Number);
    if (isNaN(w) || isNaN(l)) return 0;
    const total = w + l + (t || 0);
    return total === 0 ? 0 : (w + (t || 0) * 0.5) / total;
};

const parseStreakVal = (streak: string) => {
    if (!streak) return 0;
    const type = streak.charAt(0);
    const val = parseInt(streak.substring(1));
    if (isNaN(val)) return 0;
    return type === 'W' ? val : -val;
};

// --- Sub-Components ---

const RankBadge = ({ rank }: { rank?: number }) => {
    if (!rank) return null;
    
    let colorClass = "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    if (rank <= 5) colorClass = "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    else if (rank >= 28) colorClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";

    return (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${colorClass} inline-block mt-1`}>
            {getOrdinal(rank)}
        </span>
    );
};

const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative flex items-center">
        <Info className="w-3 h-3 text-slate-400 cursor-help hover:text-blue-500 transition-colors" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl z-50 normal-case tracking-normal font-medium leading-relaxed text-center pointer-events-none">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>
    </div>
);

const TugOfWarBar = ({
    valA,
    valB,
    colorsA,
    colorsB,
    label
}: {
    valA: number;
    valB: number;
    colorsA: { light: string; dark: string };
    colorsB: { light: string; dark: string };
    label: string;
}) => {
    const total = valA + valB;
    const pctA = total === 0 ? 50 : (valA / total) * 100;
    const pctB = 100 - pctA;

    return (
        <div className="flex flex-col items-center gap-1 w-full max-w-[80px] sm:max-w-[120px]">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1 dark:text-slate-400 text-center leading-tight">
                {label}
            </span>
            <div className="w-full h-1.5 flex bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                    style={{ width: `${pctA}%`, '--bar-light': colorsA.light, '--bar-dark': colorsA.dark } as React.CSSProperties} 
                    className="h-full transition-all duration-500 bg-[var(--bar-light)] dark:bg-[var(--bar-dark)] dark:border-y dark:border-l dark:border-white/10" 
                />
                <div 
                    style={{ width: `${pctB}%`, '--bar-light': colorsB.light, '--bar-dark': colorsB.dark } as React.CSSProperties} 
                    className="h-full transition-all duration-500 bg-[var(--bar-light)] dark:bg-[var(--bar-dark)] dark:border-y dark:border-r dark:border-white/10" 
                />
            </div>
        </div>
    );
};


export function AdvancedMatchupEngine({ homeTeam, awayTeam, comparison }: AdvancedMatchupEngineProps) {
  const { home, away } = comparison;

  // Colors
  const homeColors = {
      light: homeTeam.colors?.lightAccent || homeTeam.color || "#000",
      dark: homeTeam.colors?.darkAccent || homeTeam.color || "#fff"
  };
  const awayColors = {
      light: awayTeam.colors?.lightAccent || awayTeam.color || "#000",
      dark: awayTeam.colors?.darkAccent || awayTeam.color || "#fff"
  };

  const sections = [
    {
        id: "summary",
        title: "Summary",
        rows: [
            { id: "record", label: "Record", type: "text", aVal: away.record, hVal: home.record, 
              compare: () => parseRecordPct(home.record) - parseRecordPct(away.record),
              strength: () => [parseRecordPct(away.record), parseRecordPct(home.record)] 
            },
            { id: "streak", label: "Streak", type: "text", aVal: away.streak, hVal: home.streak, 
              compare: () => parseStreakVal(home.streak) - parseStreakVal(away.streak),
              strength: () => {
                  const sA = parseStreakVal(away.streak) + 10;
                  const sB = parseStreakVal(home.streak) + 10;
                  return [Math.max(0, sA), Math.max(0, sB)];
              }
            },
            { id: "diff", label: "Point Diff", type: "stat", statKey: "diff", higherIsBetter: true }
        ]
    },
    {
        id: "scoring",
        title: "Scoring",
        rows: [
            { id: "pf", label: "Points For", type: "stat", statKey: "pointsFor", higherIsBetter: true },
            { id: "pa", label: "Points Against", type: "stat", statKey: "pointsAgainst", higherIsBetter: false }, 
        ]
    },
    {
        id: "advanced",
        title: "Advanced Metrics",
        rows: [
            { id: "off_epa", label: "Off EPA/Play", type: "stat", statKey: "offEpa", higherIsBetter: true,
              tooltip: "Expected Points Added per offensive play." },
            { id: "def_epa", label: "Def EPA/Play", type: "stat", statKey: "defEpa", higherIsBetter: false,
              tooltip: "Expected Points Added allowed per defensive play." },
            { id: "off_succ", label: "Success Rate", type: "stat", statKey: "offSuccess", higherIsBetter: true,
              tooltip: "Percentage of plays that gain expected yardage." },
            { id: "def_succ", label: "Def Success Rate", type: "stat", statKey: "defSuccess", higherIsBetter: false,
              tooltip: "Allowed Success Rate." },
        ]
    },
    {
        id: "situational",
        title: "Situational",
        rows: [
            { id: "3rd_short", label: "3rd & Short", type: "stat", statKey: "off3rdShortConv", higherIsBetter: true,
              tooltip: "3rd down conversion rate when 3 or fewer yards to go." },
            { id: "3rd_med", label: "3rd & Medium", type: "stat", statKey: "off3rdMedConv", higherIsBetter: true,
              tooltip: "3rd down conversion rate when 4-6 yards to go." },
            { id: "3rd_long", label: "3rd & Long", type: "stat", statKey: "off3rdLongConv", higherIsBetter: true,
              tooltip: "3rd down conversion rate when 7+ yards to go." },
            { id: "4th_down", label: "4th Down", type: "stat", statKey: "off4thDownSuccess", higherIsBetter: true,
              tooltip: "4th down go-for-it success rate." },
            { id: "goalline", label: "Goal-to-Go", type: "stat", statKey: "offGoalLineTD", higherIsBetter: true,
              tooltip: "TD rate on plays inside the opponent's 10-yard line." },
            { id: "2min", label: "2-Min Drill", type: "stat", statKey: "offTwoMinEpa", higherIsBetter: true,
              tooltip: "EPA per play in final 2 minutes of each half." },
            { id: "clutch", label: "Clutch EPA", type: "stat", statKey: "offClutchEpa", higherIsBetter: true,
              tooltip: "EPA per play when WP is 30-70% in the final 4 minutes of Q4 or overtime." },
        ]
    }
  ];

  const renderRow = (row: any) => {
      let homeBetter = false;
      let awayBetter = false;
      let strengthA = 0.5;
      let strengthB = 0.5;

      if (row.type === 'stat') {
          const hStat = home[row.statKey as keyof typeof home] as RankedStat;
          const aStat = away[row.statKey as keyof typeof away] as RankedStat;
          
          if (hStat?.rank && aStat?.rank) {
             if (row.higherIsBetter) {
                 homeBetter = hStat.rank < aStat.rank;
                 awayBetter = aStat.rank < hStat.rank;
             } else {
                 homeBetter = hStat.rank < aStat.rank;
                 awayBetter = aStat.rank < hStat.rank;
             }
             strengthB = 33 - hStat.rank;
             strengthA = 33 - aStat.rank;
          }
      } else if (row.compare) {
          const diff = row.compare();
          homeBetter = diff > 0;
          awayBetter = diff < 0;
          if (row.strength) {
              const [sA, sB] = row.strength();
              strengthA = sA;
              strengthB = sB;
          }
      }

      const hVal = row.type === 'stat' ? (home[row.statKey as keyof typeof home] as RankedStat) : { value: row.hVal };
      const aVal = row.type === 'stat' ? (away[row.statKey as keyof typeof away] as RankedStat) : { value: row.aVal };

      // Highlight Styles
      const awayStyle = awayBetter ? { 
          '--hl-light': hexToRgba(awayColors.light, 0.1), 
          '--hl-dark': awayColors.dark 
      } as React.CSSProperties : {};

      const homeStyle = homeBetter ? { 
          '--hl-light': hexToRgba(homeColors.light, 0.1), 
          '--hl-dark': homeColors.dark 
      } as React.CSSProperties : {};

      const baseCellClass = "p-2 sm:p-3 flex flex-col items-center justify-center transition-colors relative";
      const highlightClass = "bg-[var(--hl-light)] dark:bg-transparent dark:text-[var(--hl-dark)]";
      const borderClassAway = awayBetter ? "dark:border-l-[4px] dark:border-[var(--hl-dark)]" : "";
      const borderClassHome = homeBetter ? "dark:border-r-[4px] dark:border-[var(--hl-dark)]" : "";

      // Text Highlight
      const textClass = (isBetter: boolean) =>
        `font-mono text-xs sm:text-sm font-bold ${isBetter ? 'text-slate-900 dark:text-[var(--hl-dark)] scale-110' : 'text-slate-600 dark:text-slate-400'}`;

      return (
        <div key={row.id} className="grid grid-cols-[1fr_80px_1fr] sm:grid-cols-[1fr_120px_1fr] border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm group">
            {/* Away Team Cell */}
            <div 
                className={`${baseCellClass} ${awayBetter ? `${highlightClass} ${borderClassAway}` : ''}`}
                style={awayStyle}
            >
                 {awayBetter && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--hl-light)] opacity-100 dark:hidden" style={{ backgroundColor: awayColors.light }} />}
                 <span className={textClass(awayBetter)}>
                    {aVal.value}
                 </span>
                 <RankBadge rank={(aVal as RankedStat).rank} />
            </div>

            {/* Middle Graphic */}
            <div className="p-2 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 border-x border-slate-100 dark:border-slate-800">
                <TugOfWarBar 
                    valA={strengthA} 
                    valB={strengthB} 
                    colorsA={awayColors} // Left
                    colorsB={homeColors} // Right
                    label={row.label}
                />
            </div>

            {/* Home Team Cell */}
            <div 
                className={`${baseCellClass} ${homeBetter ? `${highlightClass} ${borderClassHome}` : ''}`}
                style={homeStyle}
            >
                 {homeBetter && <div className="absolute right-0 top-0 bottom-0 w-1 bg-[var(--hl-light)] opacity-100 dark:hidden" style={{ backgroundColor: homeColors.light }} />}
                 <span className={textClass(homeBetter)}>
                    {hVal.value}
                 </span>
                 <RankBadge rank={(hVal as RankedStat).rank} />
            </div>
        </div>
      );
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden dark:bg-slate-950 dark:border-slate-800 flex flex-col">
      {/* Sections */}
      <div>
          {sections.map(section => (
              <div key={section.id}>
                  <div className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm border-y border-slate-200 dark:bg-slate-900/95 dark:border-slate-800 px-3 sm:px-4 py-1.5">
                      <h4 className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">{section.title}</h4>
                  </div>
                  <div>
                      {section.rows.map(row => renderRow(row))}
                  </div>
              </div>
          ))}
      </div>

      <div className="p-2 bg-slate-50 border-t border-slate-100 text-center dark:bg-slate-900 dark:border-slate-800">
        <p className="text-[8px] sm:text-[9px] text-slate-400 leading-relaxed">
            Green Badge = Top 5 • Red Badge = Bottom 5 • Bar Width = Relative Strength
        </p>
      </div>
    </div>
  );
}
