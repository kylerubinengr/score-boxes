"use client";

import React, { useState, useRef, useMemo } from "react";
import type { WinProbabilityData, WinProbabilityPoint, KeyPlay } from "@/types/winProbability";
import { NFL_TEAMS } from "@/constants/teams";

interface WinProbabilityChartProps {
  data: WinProbabilityData;
  homeAbbr: string;
  awayAbbr: string;
}

// Chart dimensions
const CHART_WIDTH = 800;
const CHART_HEIGHT = 300;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const INNER_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

function getTeamColors(abbr: string) {
  const team = NFL_TEAMS[abbr.toUpperCase()];
  if (!team) return { primary: "#64748b", darkAccent: "#94a3b8" };
  return {
    primary: team.branding.colors.primary,
    darkAccent: team.branding.colors.darkAccent,
  };
}

export function WinProbabilityChart({ data, homeAbbr, awayAbbr }: WinProbabilityChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<WinProbabilityPoint | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const homeColors = getTeamColors(homeAbbr);
  const awayColors = getTeamColors(awayAbbr);
  const homeColor = homeColors.primary;
  const awayColor = awayColors.primary;

  // Determine game time range from the data
  const { startSeconds, endSeconds, hasOT } = useMemo(() => {
    if (data.points.length === 0) return { startSeconds: 3600, endSeconds: 0, hasOT: false };
    const start = data.points[0].gameSecondsRemaining;
    const end = data.points[data.points.length - 1].gameSecondsRemaining;
    // OT if any point has quarter > 4 or gameSecondsRemaining < 0
    const ot = data.points.some(p => p.quarter > 4 || p.gameSecondsRemaining < 0);
    return { startSeconds: Math.max(3600, start), endSeconds: Math.min(0, end), hasOT: ot };
  }, [data.points]);

  const totalDuration = startSeconds - endSeconds;

  // Scale functions — x uses elapsed game time for even spacing
  const xScale = (index: number) => {
    const point = data.points[index];
    if (!point) return PADDING.left;
    const elapsed = startSeconds - point.gameSecondsRemaining;
    return PADDING.left + (elapsed / totalDuration) * INNER_WIDTH;
  };

  // Direct time-to-x conversion for axis labels
  const timeToX = (gameSecondsRemaining: number) => {
    const elapsed = startSeconds - gameSecondsRemaining;
    return PADDING.left + (elapsed / totalDuration) * INNER_WIDTH;
  };

  const yScale = (wp: number) =>
    PADDING.top + INNER_HEIGHT - (wp / 100) * INNER_HEIGHT;

  // Generate path with gradient segments (split at 50% crossing)
  const { pathSegments, scoringPlays } = useMemo(() => {
    const segments: { path: string; isHome: boolean }[] = [];
    const scoring: { x: number; y: number; type: string; team: string }[] = [];

    if (data.points.length === 0) return { pathSegments: segments, scoringPlays: scoring };

    let currentPath = `M ${xScale(0)} ${yScale(data.points[0].wp)}`;
    let currentIsHome = data.points[0].wp >= 50;

    for (let i = 1; i < data.points.length; i++) {
      const point = data.points[i];
      const prevPoint = data.points[i - 1];
      const isHome = point.wp >= 50;
      const x = xScale(i);
      const y = yScale(point.wp);

      // Check if crossing 50% line
      if (isHome !== currentIsHome) {
        const x1 = xScale(i - 1);
        const y1 = yScale(prevPoint.wp);
        const y50 = yScale(50);
        const ratio = (y50 - y1) / (y - y1);
        const xIntersect = x1 + ratio * (x - x1);

        currentPath += ` L ${xIntersect} ${y50}`;
        segments.push({ path: currentPath, isHome: currentIsHome });
        currentPath = `M ${xIntersect} ${y50}`;
        currentIsHome = isHome;
      }

      currentPath += ` L ${x} ${y}`;

      // Track scoring plays
      if (point.isScoring) {
        scoring.push({
          x,
          y,
          type: point.scoringType || "score",
          team: point.scoringTeam || point.posteam,
        });
      }
    }

    segments.push({ path: currentPath, isHome: currentIsHome });
    return { pathSegments: segments, scoringPlays: scoring };
  }, [data.points]);

  // Handle mouse interaction — find nearest point by time-based x position
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || data.points.length === 0) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const svgX = (x / rect.width) * CHART_WIDTH;
    const relativeX = svgX - PADDING.left;

    if (relativeX < 0 || relativeX > INNER_WIDTH) {
      setHoveredPoint(null);
      return;
    }

    // Convert mouse x to game seconds remaining
    const elapsed = (relativeX / INNER_WIDTH) * totalDuration;
    const targetSeconds = startSeconds - elapsed;

    // Find nearest point by game time
    let nearestIndex = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < data.points.length; i++) {
      const dist = Math.abs(data.points[i].gameSecondsRemaining - targetSeconds);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = i;
      }
    }

    setHoveredPoint(data.points[nearestIndex]);
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="space-y-6">
      {/* Chart Container */}
      <div className="relative bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        {/* Team Labels */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: homeColor }}
            />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {homeAbbr} Win Probability
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {awayAbbr} Win Probability
            </span>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: awayColor }}
            />
          </div>
        </div>

        {/* SVG Chart */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Background */}
          <rect
            x={PADDING.left}
            y={PADDING.top}
            width={INNER_WIDTH}
            height={INNER_HEIGHT}
            className="fill-slate-50 dark:fill-slate-800"
          />

          {/* Y-axis grid lines */}
          {[0, 25, 50, 75, 100].map((wp) => (
            <g key={wp}>
              <line
                x1={PADDING.left}
                y1={yScale(wp)}
                x2={PADDING.left + INNER_WIDTH}
                y2={yScale(wp)}
                className={
                  wp === 50
                    ? "stroke-slate-400 dark:stroke-slate-500"
                    : "stroke-slate-200 dark:stroke-slate-700"
                }
                strokeWidth={wp === 50 ? 2 : 1}
                strokeDasharray={wp === 50 ? "4 4" : undefined}
              />
              <text
                x={PADDING.left - 8}
                y={yScale(wp)}
                className="fill-slate-500 dark:fill-slate-400"
                style={{ fontSize: "10px", fontFamily: "monospace" }}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {wp}%
              </text>
            </g>
          ))}

          {/* Quarter dividers and x-axis labels at fixed time boundaries */}
          {[
            { seconds: 2700, label: 'End Q1' },
            { seconds: 1800, label: 'Halftime' },
            { seconds: 900, label: 'End Q3' },
            ...(hasOT ? [{ seconds: 0, label: 'End Q4' }] : []),
          ].map(({ seconds, label }) => (
            <g key={label}>
              <line
                x1={timeToX(seconds)}
                y1={PADDING.top}
                x2={timeToX(seconds)}
                y2={PADDING.top + INNER_HEIGHT}
                className="stroke-slate-300 dark:stroke-slate-600"
                strokeDasharray="2 2"
              />
              <text
                x={timeToX(seconds)}
                y={PADDING.top + INNER_HEIGHT + 16}
                className="fill-slate-400 dark:fill-slate-500"
                style={{ fontSize: "9px", fontWeight: "bold" }}
                textAnchor="middle"
              >
                {label}
              </text>
            </g>
          ))}

          {/* Game Start label */}
          <text
            x={PADDING.left}
            y={PADDING.top + INNER_HEIGHT + 16}
            className="fill-slate-400 dark:fill-slate-500"
            style={{ fontSize: "9px", fontWeight: "bold" }}
            textAnchor="start"
          >
            Game Start
          </text>

          {/* Final label */}
          <text
            x={PADDING.left + INNER_WIDTH}
            y={PADDING.top + INNER_HEIGHT + 16}
            className="fill-slate-400 dark:fill-slate-500"
            style={{ fontSize: "9px", fontWeight: "bold" }}
            textAnchor="end"
          >
            Final
          </text>

          {/* Win probability line segments */}
          {pathSegments.map((segment, i) => (
            <path
              key={i}
              d={segment.path}
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                stroke: segment.isHome ? homeColor : awayColor,
              }}
            />
          ))}

          {/* Scoring play markers */}
          {scoringPlays.map((play, i) => (
            <circle
              key={i}
              cx={play.x}
              cy={play.y}
              r={play.type === "td" ? 6 : 4}
              className="fill-white dark:fill-slate-900"
              strokeWidth={2}
              style={{
                stroke: play.team === data.homeTeam ? homeColor : awayColor,
              }}
            />
          ))}

          {/* Hover indicator */}
          {hoveredPoint && (
            <>
              <line
                x1={xScale(hoveredPoint.playIndex)}
                y1={PADDING.top}
                x2={xScale(hoveredPoint.playIndex)}
                y2={PADDING.top + INNER_HEIGHT}
                className="stroke-slate-400 dark:stroke-slate-500"
                strokeDasharray="2 2"
              />
              <circle
                cx={xScale(hoveredPoint.playIndex)}
                cy={yScale(hoveredPoint.wp)}
                r={6}
                className="fill-white dark:fill-slate-900"
                strokeWidth={3}
                style={{
                  stroke: hoveredPoint.wp >= 50 ? homeColor : awayColor,
                }}
              />
            </>
          )}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && mousePos && (
          <Tooltip
            point={hoveredPoint}
            position={mousePos}
            homeAbbr={homeAbbr}
            awayAbbr={awayAbbr}
          />
        )}
      </div>

      {/* Key Plays Section */}
      <KeyPlaysSection
        keyPlays={data.keyPlays}
        homeAbbr={homeAbbr}
        awayAbbr={awayAbbr}
        homeColor={homeColor}
        awayColor={awayColor}
        homeTeam={data.homeTeam}
      />
    </div>
  );
}

// Tooltip component
function Tooltip({
  point,
  position,
  homeAbbr,
  awayAbbr,
}: {
  point: WinProbabilityPoint;
  position: { x: number; y: number };
  homeAbbr: string;
  awayAbbr: string;
}) {
  const containerWidth = 800; // Approximate container width
  const isLeftSide = position.x < containerWidth / 2;

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: isLeftSide ? position.x + 12 : position.x - 220,
        top: Math.max(10, position.y - 60),
      }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 w-52">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            {formatQuarter(point.quarter)}
          </span>
          <span className="text-xs font-mono text-slate-500">
            {formatTime(point.gameSecondsRemaining)}
          </span>
        </div>

        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {homeAbbr} <span className="font-mono text-slate-500 dark:text-slate-400">{point.homeScore}</span>
          </span>
          <span className="text-lg font-black text-blue-600 dark:text-blue-400">
            {point.wp.toFixed(1)}%
          </span>
        </div>

        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {awayAbbr} <span className="font-mono text-slate-500 dark:text-slate-400">{point.awayScore}</span>
          </span>
          <span className="text-lg font-black text-slate-600 dark:text-slate-400">
            {(100 - point.wp).toFixed(1)}%
          </span>
        </div>

        {point.description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-700 pt-2 line-clamp-3">
            {point.description}
          </p>
        )}
      </div>
    </div>
  );
}

// Key Plays section
function KeyPlaysSection({
  keyPlays,
  homeAbbr,
  awayAbbr,
  homeColor,
  awayColor,
  homeTeam,
}: {
  keyPlays: KeyPlay[];
  homeAbbr: string;
  awayAbbr: string;
  homeColor: string;
  awayColor: string;
  homeTeam: string;
}) {
  if (keyPlays.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
        Win Probability Added
      </h4>
      <div className="space-y-3">
        {keyPlays.map((play, i) => {
          const isHomeTeam = play.team === homeTeam;
          const teamAbbr = isHomeTeam ? homeAbbr : awayAbbr;
          const teamColor = isHomeTeam ? homeColor : awayColor;
          const isPositive = play.wpSwing > 0;
          const sign = isPositive ? '+' : '';

          return (
            <div
              key={i}
              className="flex items-start gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
            >
              <div
                className="flex-shrink-0 w-12 h-10 rounded-full flex items-center justify-center text-white font-black text-[10px]"
                style={{ backgroundColor: isPositive ? teamColor : '#64748b' }}
              >
                {sign}{play.wpSwing.toFixed(1)}%
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {formatQuarter(play.quarter)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {teamAbbr}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {play.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper functions
function formatQuarter(quarter: number): string {
  return quarter > 4 ? 'OT' : `Q${quarter}`;
}

function formatTime(seconds: number): string {
  // OT times are negative in our data (shifted by -600).
  // Convert back to time remaining on OT clock: -100 → 500s remaining → 8:20
  if (seconds < 0) {
    const remaining = 600 + seconds; // e.g. -100 → 500
    const clamped = Math.max(0, remaining);
    const mins = Math.floor(clamped / 60);
    const secs = clamped % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  const quarterSeconds = seconds % 900; // 15 minutes per quarter
  const mins = Math.floor(quarterSeconds / 60);
  const secs = quarterSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
