"use client";

import { Team, Drive, PlayByPlay } from "@/types/nfl";
import { SafeImage } from "../common/SafeImage";

interface LastPlayWidgetProps {
  drive: Drive;
  homeTeam: Team;
  awayTeam: Team;
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatPlayType(play: PlayByPlay): string {
  const type = play.type || "";
  const yards = play.yardsGained;
  if (yards !== undefined && yards !== 0 && !type.includes("Penalty") && !type.includes("Timeout")) {
    return `${Math.abs(yards)}-yd ${type}`;
  }
  return type;
}

const SKIP_PLAY_TYPES = ["timeout", "end of", "two-minute", "official", "coin toss"];

function findLastRealPlay(plays: PlayByPlay[]): PlayByPlay | null {
  for (const p of plays) {
    const t = p.type?.toLowerCase() || "";
    if (t === "") continue;
    if (SKIP_PLAY_TYPES.some(skip => t.includes(skip))) continue;
    return p;
  }
  return plays[0] || null;
}

function FieldVisualization({
  yardsToEndzone,
  driveTeamAbbr,
  driveTeamColor,
  opponentAbbr,
  opponentColor,
}: {
  yardsToEndzone: number;
  driveTeamAbbr: string;
  driveTeamColor: string;
  opponentAbbr: string;
  opponentColor: string;
}) {
  // SVG viewBox: 120 wide (10 end zone + 100 field + 10 end zone) × 53.3 tall
  const vw = 120;
  const vh = 53.3;
  const ezW = 10;
  const fieldLeft = ezW;
  const fieldW = 100;
  const ballX = fieldLeft + (fieldW - yardsToEndzone);
  const midY = vh / 2;

  const yardNumbers = [
    { num: 10, x: 10 }, { num: 20, x: 20 }, { num: 30, x: 30 },
    { num: 40, x: 40 }, { num: 50, x: 50 },
    { num: 40, x: 60 }, { num: 30, x: 70 }, { num: 20, x: 80 },
    { num: 10, x: 90 },
  ];

  return (
    <svg
      viewBox={`0 0 ${vw} ${vh}`}
      className="w-full sm:max-w-md rounded-lg overflow-hidden border border-slate-700 dark:border-slate-600"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Field surface */}
      <rect x={fieldLeft} y={0} width={fieldW} height={vh} fill="#2d6a3f" />

      {/* Alternating field strips for depth */}
      {Array.from({ length: 20 }, (_, i) => (
        <rect
          key={`strip-${i}`}
          x={fieldLeft + i * 5}
          y={0}
          width={5}
          height={vh}
          fill={i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent"}
        />
      ))}

      {/* End zones */}
      <rect x={0} y={0} width={ezW} height={vh} fill={driveTeamColor} />
      <rect x={fieldLeft + fieldW} y={0} width={ezW} height={vh} fill={opponentColor} />

      {/* End zone team names */}
      <text
        x={ezW / 2} y={midY}
        textAnchor="middle" dominantBaseline="central"
        fill="rgba(255,255,255,0.7)"
        fontSize="5.5" fontWeight="900" letterSpacing="1.5"
        transform={`rotate(-90, ${ezW / 2}, ${midY})`}
      >
        {driveTeamAbbr}
      </text>
      <text
        x={fieldLeft + fieldW + ezW / 2} y={midY}
        textAnchor="middle" dominantBaseline="central"
        fill="rgba(255,255,255,0.7)"
        fontSize="5.5" fontWeight="900" letterSpacing="1.5"
        transform={`rotate(90, ${fieldLeft + fieldW + ezW / 2}, ${midY})`}
      >
        {opponentAbbr}
      </text>

      {/* Major yard lines (every 10 yards) */}
      {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((yd) => (
        <line
          key={`yl-${yd}`}
          x1={fieldLeft + yd} y1={0}
          x2={fieldLeft + yd} y2={vh}
          stroke="rgba(255,255,255,0.25)" strokeWidth={0.4}
        />
      ))}

      {/* Minor yard lines (every 5 yards) */}
      {[5, 15, 25, 35, 45, 55, 65, 75, 85, 95].map((yd) => (
        <line
          key={`yl5-${yd}`}
          x1={fieldLeft + yd} y1={0}
          x2={fieldLeft + yd} y2={vh}
          stroke="rgba(255,255,255,0.08)" strokeWidth={0.3}
        />
      ))}

      {/* Hash marks along top and bottom edges (every yard) */}
      {Array.from({ length: 99 }, (_, i) => i + 1).map((yd) => (
        <g key={`hash-${yd}`}>
          <line
            x1={fieldLeft + yd} y1={0}
            x2={fieldLeft + yd} y2={1.5}
            stroke="rgba(255,255,255,0.2)" strokeWidth={0.3}
          />
          <line
            x1={fieldLeft + yd} y1={vh - 1.5}
            x2={fieldLeft + yd} y2={vh}
            stroke="rgba(255,255,255,0.2)" strokeWidth={0.3}
          />
        </g>
      ))}

      {/* Center hash marks (NFL hash marks are closer to center) */}
      {Array.from({ length: 99 }, (_, i) => i + 1).map((yd) => (
        <g key={`chash-${yd}`}>
          <line
            x1={fieldLeft + yd} y1={midY - 3}
            x2={fieldLeft + yd} y2={midY - 1.5}
            stroke="rgba(255,255,255,0.12)" strokeWidth={0.25}
          />
          <line
            x1={fieldLeft + yd} y1={midY + 1.5}
            x2={fieldLeft + yd} y2={midY + 3}
            stroke="rgba(255,255,255,0.12)" strokeWidth={0.25}
          />
        </g>
      ))}

      {/* Yard numbers — top and bottom */}
      {yardNumbers.map(({ num, x }, i) => (
        <g key={`ynum-${i}`}>
          <text
            x={fieldLeft + x} y={7}
            textAnchor="middle" dominantBaseline="central"
            fill="rgba(255,255,255,0.2)"
            fontSize="5" fontWeight="800"
          >
            {num}
          </text>
          <text
            x={fieldLeft + x} y={vh - 7}
            textAnchor="middle" dominantBaseline="central"
            fill="rgba(255,255,255,0.2)"
            fontSize="5" fontWeight="800"
            transform={`rotate(180, ${fieldLeft + x}, ${vh - 7})`}
          >
            {num}
          </text>
        </g>
      ))}

      {/* Sidelines */}
      <rect x={fieldLeft} y={0} width={fieldW} height={0.5} fill="rgba(255,255,255,0.4)" />
      <rect x={fieldLeft} y={vh - 0.5} width={fieldW} height={0.5} fill="rgba(255,255,255,0.4)" />

      {/* Goal lines */}
      <line x1={fieldLeft} y1={0} x2={fieldLeft} y2={vh} stroke="rgba(255,255,255,0.5)" strokeWidth={0.6} />
      <line x1={fieldLeft + fieldW} y1={0} x2={fieldLeft + fieldW} y2={vh} stroke="rgba(255,255,255,0.5)" strokeWidth={0.6} />

      {/* Drive path line */}
      <line
        x1={fieldLeft} y1={midY}
        x2={ballX} y2={midY}
        stroke="rgba(255,255,255,0.3)" strokeWidth={0.6}
        strokeDasharray="1.5 1"
      />

      {/* Ball marker with glow */}
      <circle cx={ballX} cy={midY} r={3} fill="rgba(251,191,36,0.3)" />
      <circle cx={ballX} cy={midY} r={2} fill="#fbbf24" stroke="white" strokeWidth={0.6} />
    </svg>
  );
}

export function LastPlayWidget({ drive, homeTeam, awayTeam }: LastPlayWidgetProps) {
  const lastPlay = findLastRealPlay(drive.plays);
  if (!lastPlay) return null;

  const isHomePossession = drive.team.id === homeTeam.id;
  const possTeam = isHomePossession ? homeTeam : awayTeam;
  const defTeam = isHomePossession ? awayTeam : homeTeam;

  const down = lastPlay.endDown ?? lastPlay.down;
  const distance = lastPlay.endDistance ?? lastPlay.distance;
  const yardsToEndzone = lastPlay.endYardsToEndzone ?? lastPlay.yardLine;
  const downDistText = lastPlay.downDistanceText;
  const possText = lastPlay.possessionText;

  const downDisplay = down && down > 0 && distance !== undefined
    ? `${getOrdinal(down)} & ${distance}`
    : downDistText?.split(" at ")[0] || null;

  const ballOnDisplay = possText
    || (yardsToEndzone ? `${yardsToEndzone <= 50 ? defTeam.abbreviation : possTeam.abbreviation} ${yardsToEndzone <= 50 ? yardsToEndzone : 100 - yardsToEndzone}` : null);

  const driveTeamColor = drive.team.color || possTeam.color || "#333";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      {/* Drive Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-50 dark:bg-slate-800 p-1 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
            <SafeImage src={drive.team.logo} alt={drive.team.abbreviation} width={24} height={24} />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Current Drive
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>{drive.playCount || drive.plays.length} plays</span>
          <span className="text-slate-300 dark:text-slate-600">&middot;</span>
          <span>{drive.yards ?? 0} yds</span>
          {drive.timeElapsed && (
            <>
              <span className="text-slate-300 dark:text-slate-600">&middot;</span>
              <span>{drive.timeElapsed}</span>
            </>
          )}
        </div>
      </div>

      {/* Down & Distance + Ball Position */}
      {(downDisplay || ballOnDisplay) && (
        <div className="flex items-center justify-center gap-4 sm:gap-8 px-3 sm:px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50">
          {downDisplay && (
            <div className="text-center">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Down</div>
              <div className="text-sm sm:text-lg font-black text-slate-900 dark:text-slate-100">{downDisplay}</div>
            </div>
          )}
          {downDisplay && ballOnDisplay && (
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          )}
          {ballOnDisplay && (
            <div className="text-center">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Ball on</div>
              <div className="text-sm sm:text-lg font-black text-slate-900 dark:text-slate-100">{ballOnDisplay}</div>
            </div>
          )}
        </div>
      )}

      {/* Field Visualization */}
      {yardsToEndzone && yardsToEndzone > 0 && (
        <div className="px-3 sm:px-4 py-2 sm:flex sm:justify-center">
          <FieldVisualization
            yardsToEndzone={yardsToEndzone}
            driveTeamAbbr={possTeam.abbreviation}
            driveTeamColor={driveTeamColor}
            opponentAbbr={defTeam.abbreviation}
            opponentColor={defTeam.color || "#333"}
          />
        </div>
      )}

      {/* Last Play */}
      <div className="px-3 sm:px-4 py-2.5 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
            {formatPlayType(lastPlay)}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            Last Play
          </span>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
          {lastPlay.text}
        </p>
      </div>
    </div>
  );
}
