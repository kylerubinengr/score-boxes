import { TEAM_ID_TO_ABBR, getNflfastrAbbr } from "@/constants/teams";
import { fetchAllSeasonPlays } from "@/lib/pbpData";
import { computeSeasonTeamStats } from "@/lib/teamStatsAggregator";
import fs from "fs/promises";
import path from "path";

export type RankedStat = {
  value: string;
  rank?: number;
};

export type AdvancedTeamStats = {
  record: string;
  homeRecord: string;
  awayRecord: string;
  divRecord: string;
  streak: string;
  pointsFor: RankedStat;
  pointsAgainst: RankedStat;
  diff: RankedStat;
  offEpa: RankedStat;
  defEpa: RankedStat;
  offSuccess: RankedStat;
  defSuccess: RankedStat;
  // Yards stats (per game, ranked)
  offTotalYPG: RankedStat;
  offPassYPG: RankedStat;
  offRushYPG: RankedStat;
  defTotalYPG: RankedStat;
  defPassYPG: RankedStat;
  defRushYPG: RankedStat;
  // Pass/Rush efficiency breakdown
  offPassEpa: RankedStat;
  offRushEpa: RankedStat;
  offPassSuccess: RankedStat;
  offRushSuccess: RankedStat;
  defPassEpa: RankedStat;
  defRushEpa: RankedStat;
  defPassSuccess: RankedStat;
  defRushSuccess: RankedStat;
  // Situational stats
  off3rdDownConv: RankedStat;
  def3rdDownConv: RankedStat;
  offRedzoneTD: RankedStat;
  defRedzoneTD: RankedStat;
};

export type MatchupComparison = {
  home: AdvancedTeamStats;
  away: AdvancedTeamStats;
};

// Helper to calculate ranks
function calculateRanks(data: Record<string, number>, ascending: boolean = false): Record<string, number> {
  const sorted = Object.entries(data)
    .sort(([, a], [, b]) => ascending ? a - b : b - a);
  
  const ranks: Record<string, number> = {};
  sorted.forEach((item, index) => {
    ranks[item[0]] = index + 1;
  });
  return ranks;
}

// In-memory cache for computed advanced stats, keyed by season.
// Persists across requests on the same warm serverless instance.
const advancedStatsCache = new Map<number, { data: Record<string, Partial<AdvancedTeamStats>>; timestamp: number }>();
const ADVANCED_STATS_TTL = 3600 * 1000; // 1 hour in ms

/**
 * Fetch play-by-play data from nflverse and compute per-team EPA/success stats.
 * Falls back to static team_stats.json if PBP fetch fails.
 */
async function getAdvancedStats(season?: number): Promise<Record<string, Partial<AdvancedTeamStats>>> {
  const seasonYear = season || new Date().getFullYear();

  // Check in-memory cache
  const cached = advancedStatsCache.get(seasonYear);
  if (cached && (Date.now() - cached.timestamp) < ADVANCED_STATS_TTL) {
    return cached.data;
  }

  try {
    console.log(`[advancedStats] Computing team stats from PBP for season ${seasonYear}...`);
    const plays = await fetchAllSeasonPlays(seasonYear);
    const rawStats = computeSeasonTeamStats(plays);
    console.log(`[advancedStats] Computed stats for ${Object.keys(rawStats).length} teams (${plays.length} plays)`);

    // Extract values for ranking
    const offEpaVals: Record<string, number> = {};
    const defEpaVals: Record<string, number> = {};
    const offSuccessVals: Record<string, number> = {};
    const defSuccessVals: Record<string, number> = {};
    const offTotalYdsVals: Record<string, number> = {};
    const offPassYdsVals: Record<string, number> = {};
    const offRushYdsVals: Record<string, number> = {};
    const defTotalYdsVals: Record<string, number> = {};
    const defPassYdsVals: Record<string, number> = {};
    const defRushYdsVals: Record<string, number> = {};
    // Pass/Rush efficiency
    const offPassEpaVals: Record<string, number> = {};
    const offRushEpaVals: Record<string, number> = {};
    const offPassSuccessVals: Record<string, number> = {};
    const offRushSuccessVals: Record<string, number> = {};
    const defPassEpaVals: Record<string, number> = {};
    const defRushEpaVals: Record<string, number> = {};
    const defPassSuccessVals: Record<string, number> = {};
    const defRushSuccessVals: Record<string, number> = {};
    // Situational stats
    const off3rdDownVals: Record<string, number> = {};
    const def3rdDownVals: Record<string, number> = {};
    const offRedzoneVals: Record<string, number> = {};
    const defRedzoneVals: Record<string, number> = {};

    Object.keys(rawStats).forEach(team => {
      const s = rawStats[team];
      offEpaVals[team] = s.off_epa;
      defEpaVals[team] = s.def_epa;
      offSuccessVals[team] = s.off_success_rate;
      defSuccessVals[team] = s.def_success_rate;
      // Total yards (pass + rush)
      offTotalYdsVals[team] = s.off_pass_yards + s.off_rush_yards;
      offPassYdsVals[team] = s.off_pass_yards;
      offRushYdsVals[team] = s.off_rush_yards;
      defTotalYdsVals[team] = s.def_pass_yards + s.def_rush_yards;
      defPassYdsVals[team] = s.def_pass_yards;
      defRushYdsVals[team] = s.def_rush_yards;
      // Pass/Rush efficiency
      offPassEpaVals[team] = s.off_dropback_epa;
      offRushEpaVals[team] = s.off_rush_epa;
      offPassSuccessVals[team] = s.off_pass_success_rate;
      offRushSuccessVals[team] = s.off_rush_success_rate;
      defPassEpaVals[team] = s.def_dropback_epa;
      defRushEpaVals[team] = s.def_rush_epa;
      defPassSuccessVals[team] = s.def_pass_success_rate;
      defRushSuccessVals[team] = s.def_rush_success_rate;
      // Situational stats
      off3rdDownVals[team] = s.off_third_down_conv_rate;
      def3rdDownVals[team] = s.def_third_down_conv_rate;
      offRedzoneVals[team] = s.off_redzone_td_rate;
      defRedzoneVals[team] = s.def_redzone_td_rate;
    });

    // Offense: Higher is better (Descending)
    const offEpaRanks = calculateRanks(offEpaVals, false);
    const offSuccessRanks = calculateRanks(offSuccessVals, false);
    const offTotalYdsRanks = calculateRanks(offTotalYdsVals, false);
    const offPassYdsRanks = calculateRanks(offPassYdsVals, false);
    const offRushYdsRanks = calculateRanks(offRushYdsVals, false);
    // Defense: Lower is better (Ascending)
    const defEpaRanks = calculateRanks(defEpaVals, true);
    const defSuccessRanks = calculateRanks(defSuccessVals, true);
    const defTotalYdsRanks = calculateRanks(defTotalYdsVals, true);
    const defPassYdsRanks = calculateRanks(defPassYdsVals, true);
    const defRushYdsRanks = calculateRanks(defRushYdsVals, true);
    // Pass/Rush efficiency ranks
    const offPassEpaRanks = calculateRanks(offPassEpaVals, false);
    const offRushEpaRanks = calculateRanks(offRushEpaVals, false);
    const offPassSuccessRanks = calculateRanks(offPassSuccessVals, false);
    const offRushSuccessRanks = calculateRanks(offRushSuccessVals, false);
    const defPassEpaRanks = calculateRanks(defPassEpaVals, true);
    const defRushEpaRanks = calculateRanks(defRushEpaVals, true);
    const defPassSuccessRanks = calculateRanks(defPassSuccessVals, true);
    const defRushSuccessRanks = calculateRanks(defRushSuccessVals, true);
    // Situational ranks: Higher 3rd down conv is better for offense, lower for defense
    const off3rdDownRanks = calculateRanks(off3rdDownVals, false);
    const def3rdDownRanks = calculateRanks(def3rdDownVals, true);
    // Higher red zone TD% is better for offense, lower for defense
    const offRedzoneRanks = calculateRanks(offRedzoneVals, false);
    const defRedzoneRanks = calculateRanks(defRedzoneVals, true);

    const resultMap: Record<string, Partial<AdvancedTeamStats>> = {};

    Object.keys(rawStats).forEach(team => {
      const s = rawStats[team];
      const games = s.games || 1;
      const offTotalYPG = (s.off_pass_yards + s.off_rush_yards) / games;
      const defTotalYPG = (s.def_pass_yards + s.def_rush_yards) / games;

      resultMap[team] = {
        offEpa: {
          value: s.off_epa?.toFixed(3) || "N/A",
          rank: offEpaRanks[team]
        },
        defEpa: {
          value: s.def_epa?.toFixed(3) || "N/A",
          rank: defEpaRanks[team]
        },
        offSuccess: {
          value: (s.off_success_rate || 0).toFixed(1) + "%",
          rank: offSuccessRanks[team]
        },
        defSuccess: {
          value: (s.def_success_rate || 0).toFixed(1) + "%",
          rank: defSuccessRanks[team]
        },
        offTotalYPG: {
          value: offTotalYPG.toFixed(1),
          rank: offTotalYdsRanks[team]
        },
        offPassYPG: {
          value: (s.off_pass_yards / games).toFixed(1),
          rank: offPassYdsRanks[team]
        },
        offRushYPG: {
          value: (s.off_rush_yards / games).toFixed(1),
          rank: offRushYdsRanks[team]
        },
        defTotalYPG: {
          value: defTotalYPG.toFixed(1),
          rank: defTotalYdsRanks[team]
        },
        defPassYPG: {
          value: (s.def_pass_yards / games).toFixed(1),
          rank: defPassYdsRanks[team]
        },
        defRushYPG: {
          value: (s.def_rush_yards / games).toFixed(1),
          rank: defRushYdsRanks[team]
        },
        offPassEpa: {
          value: s.off_dropback_epa?.toFixed(3) || "N/A",
          rank: offPassEpaRanks[team]
        },
        offRushEpa: {
          value: s.off_rush_epa?.toFixed(3) || "N/A",
          rank: offRushEpaRanks[team]
        },
        offPassSuccess: {
          value: (s.off_pass_success_rate || 0).toFixed(1) + "%",
          rank: offPassSuccessRanks[team]
        },
        offRushSuccess: {
          value: (s.off_rush_success_rate || 0).toFixed(1) + "%",
          rank: offRushSuccessRanks[team]
        },
        defPassEpa: {
          value: s.def_dropback_epa?.toFixed(3) || "N/A",
          rank: defPassEpaRanks[team]
        },
        defRushEpa: {
          value: s.def_rush_epa?.toFixed(3) || "N/A",
          rank: defRushEpaRanks[team]
        },
        defPassSuccess: {
          value: (s.def_pass_success_rate || 0).toFixed(1) + "%",
          rank: defPassSuccessRanks[team]
        },
        defRushSuccess: {
          value: (s.def_rush_success_rate || 0).toFixed(1) + "%",
          rank: defRushSuccessRanks[team]
        },
        // Situational stats
        off3rdDownConv: {
          value: (s.off_third_down_conv_rate || 0).toFixed(1) + "%",
          rank: off3rdDownRanks[team]
        },
        def3rdDownConv: {
          value: (s.def_third_down_conv_rate || 0).toFixed(1) + "%",
          rank: def3rdDownRanks[team]
        },
        offRedzoneTD: {
          value: (s.off_redzone_td_rate || 0).toFixed(1) + "%",
          rank: offRedzoneRanks[team]
        },
        defRedzoneTD: {
          value: (s.def_redzone_td_rate || 0).toFixed(1) + "%",
          rank: defRedzoneRanks[team]
        },
      };
    });

    // Cache the result
    advancedStatsCache.set(seasonYear, { data: resultMap, timestamp: Date.now() });

    return resultMap;
  } catch (error) {
    console.warn(`[advancedStats] PBP fetch failed for ${seasonYear}, falling back to static JSON:`, error);
    return getAdvancedStatsFromFile();
  }
}

/** Fallback: load from static team_stats.json (only contains one season) */
async function getAdvancedStatsFromFile(): Promise<Record<string, Partial<AdvancedTeamStats>>> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'team_stats.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const stats = JSON.parse(fileContent);

    const offEpaVals: Record<string, number> = {};
    const defEpaVals: Record<string, number> = {};
    const offSuccessVals: Record<string, number> = {};
    const defSuccessVals: Record<string, number> = {};

    Object.keys(stats).forEach(team => {
      offEpaVals[team] = stats[team].off_epa;
      defEpaVals[team] = stats[team].def_epa;
      offSuccessVals[team] = stats[team].off_success_rate;
      defSuccessVals[team] = stats[team].def_success_rate;
    });

    const offEpaRanks = calculateRanks(offEpaVals, false);
    const offSuccessRanks = calculateRanks(offSuccessVals, false);
    const defEpaRanks = calculateRanks(defEpaVals, true);
    const defSuccessRanks = calculateRanks(defSuccessVals, true);

    const resultMap: Record<string, Partial<AdvancedTeamStats>> = {};

    Object.keys(stats).forEach(team => {
      resultMap[team] = {
        offEpa: {
          value: stats[team].off_epa?.toFixed(3) || "N/A",
          rank: offEpaRanks[team]
        },
        defEpa: {
          value: stats[team].def_epa?.toFixed(3) || "N/A",
          rank: defEpaRanks[team]
        },
        offSuccess: {
          value: (stats[team].off_success_rate || 0).toFixed(1) + "%",
          rank: offSuccessRanks[team]
        },
        defSuccess: {
          value: (stats[team].def_success_rate || 0).toFixed(1) + "%",
          rank: defSuccessRanks[team]
        },
        // Fallback doesn't have per-game yard data
        offTotalYPG: { value: "N/A" },
        offPassYPG: { value: "N/A" },
        offRushYPG: { value: "N/A" },
        defTotalYPG: { value: "N/A" },
        defPassYPG: { value: "N/A" },
        defRushYPG: { value: "N/A" },
        offPassEpa: { value: "N/A" },
        offRushEpa: { value: "N/A" },
        offPassSuccess: { value: "N/A" },
        offRushSuccess: { value: "N/A" },
        defPassEpa: { value: "N/A" },
        defRushEpa: { value: "N/A" },
        defPassSuccess: { value: "N/A" },
        defRushSuccess: { value: "N/A" },
        // Situational fallbacks
        off3rdDownConv: { value: "N/A" },
        def3rdDownConv: { value: "N/A" },
        offRedzoneTD: { value: "N/A" },
        defRedzoneTD: { value: "N/A" },
      };
    });

    return resultMap;
  } catch (error) {
    console.warn("Could not load local team stats JSON:", error);
    return {};
  }
}

async function getESPNStandings(season?: number): Promise<Record<string, Partial<AdvancedTeamStats>>> {
  try {
    const url = season
      ? `https://site.api.espn.com/apis/v2/sports/football/nfl/standings?season=${season}`
      : "https://site.api.espn.com/apis/v2/sports/football/nfl/standings";
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const data = await res.json();
    
    const statsMap: Record<string, Partial<AdvancedTeamStats>> = {};
    
    // For ranking
    const pfVals: Record<string, number> = {};
    const paVals: Record<string, number> = {};
    const diffVals: Record<string, number> = {};
    
    // First pass: Collect data
    data.children?.forEach((conf: any) => {
        conf.standings?.entries?.forEach((entry: any) => {
            const teamId = entry.team.id;
            const stats = entry.stats || [];
            const getStat = (name: string) => parseFloat(stats.find((s: any) => s.name === name)?.value || "0");
            
            pfVals[teamId] = getStat("pointsFor");
            paVals[teamId] = getStat("pointsAgainst");
            diffVals[teamId] = getStat("differential");
        });
    });

    const pfRanks = calculateRanks(pfVals, false); // Higher better
    const paRanks = calculateRanks(paVals, true);  // Lower better
    const diffRanks = calculateRanks(diffVals, false); // Higher better

    // Second pass: Build objects
    data.children?.forEach((conf: any) => {
        conf.standings?.entries?.forEach((entry: any) => {
            const teamId = entry.team.id;
            const stats = entry.stats || [];
            
            const getStatDisplay = (name: string) => stats.find((s: any) => s.name === name)?.displayValue || "-";
            
            const wins = getStatDisplay("wins");
            const losses = getStatDisplay("losses");
            const ties = getStatDisplay("ties");
            const record = ties !== "0" && ties !== "-" ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;

            statsMap[teamId] = {
                record,
                homeRecord: getStatDisplay("Home"),
                awayRecord: getStatDisplay("Road"),
                divRecord: getStatDisplay("vs. Div."),
                streak: getStatDisplay("streak"),
                pointsFor: { value: getStatDisplay("pointsFor"), rank: pfRanks[teamId] },
                pointsAgainst: { value: getStatDisplay("pointsAgainst"), rank: paRanks[teamId] },
                diff: { value: getStatDisplay("differential"), rank: diffRanks[teamId] },
            };
        });
    });
    return statsMap;
  } catch (e) {
    console.error("ESPN Standings Fetch Error:", e);
    return {};
  }
}

export async function getTeamStats(teamAbbr: string, season?: number): Promise<AdvancedTeamStats | null> {
  const { getTeamByAbbr, getNflfastrAbbr } = await import("@/constants/teams");
  const team = getTeamByAbbr(teamAbbr);
  if (!team) return null;

  const [espnData, advancedData] = await Promise.all([
    getESPNStandings(season),
    getAdvancedStats(season)
  ]);

  const espn = espnData[team.espnId] || {};
  const nflfastrAbbr = getNflfastrAbbr(teamAbbr);
  const adv = advancedData[nflfastrAbbr] || advancedData[teamAbbr] || {};

  return {
    record: espn.record || "0-0",
    homeRecord: espn.homeRecord || "-",
    awayRecord: espn.awayRecord || "-",
    divRecord: espn.divRecord || "-",
    streak: espn.streak || "-",
    pointsFor: espn.pointsFor || { value: "-" },
    pointsAgainst: espn.pointsAgainst || { value: "-" },
    diff: espn.diff || { value: "-" },
    offEpa: adv.offEpa || { value: "N/A" },
    defEpa: adv.defEpa || { value: "N/A" },
    offSuccess: adv.offSuccess || { value: "N/A" },
    defSuccess: adv.defSuccess || { value: "N/A" },
    offTotalYPG: adv.offTotalYPG || { value: "N/A" },
    offPassYPG: adv.offPassYPG || { value: "N/A" },
    offRushYPG: adv.offRushYPG || { value: "N/A" },
    defTotalYPG: adv.defTotalYPG || { value: "N/A" },
    defPassYPG: adv.defPassYPG || { value: "N/A" },
    defRushYPG: adv.defRushYPG || { value: "N/A" },
    offPassEpa: adv.offPassEpa || { value: "N/A" },
    offRushEpa: adv.offRushEpa || { value: "N/A" },
    offPassSuccess: adv.offPassSuccess || { value: "N/A" },
    offRushSuccess: adv.offRushSuccess || { value: "N/A" },
    defPassEpa: adv.defPassEpa || { value: "N/A" },
    defRushEpa: adv.defRushEpa || { value: "N/A" },
    defPassSuccess: adv.defPassSuccess || { value: "N/A" },
    defRushSuccess: adv.defRushSuccess || { value: "N/A" },
    // Situational stats
    off3rdDownConv: adv.off3rdDownConv || { value: "N/A" },
    def3rdDownConv: adv.def3rdDownConv || { value: "N/A" },
    offRedzoneTD: adv.offRedzoneTD || { value: "N/A" },
    defRedzoneTD: adv.defRedzoneTD || { value: "N/A" },
  };
}

export async function getMatchupComparison(homeId: string, awayId: string): Promise<MatchupComparison | null> {
  const [espnData, advancedData] = await Promise.all([
    getESPNStandings(),
    getAdvancedStats()
  ]);

  const mapStats = (id: string): AdvancedTeamStats => {
    const espn = espnData[id] || {};
    const teamAbbr = TEAM_ID_TO_ABBR[id] || "";
    const nflfastrAbbr = getNflfastrAbbr(teamAbbr);
    
    const adv = advancedData[nflfastrAbbr] || advancedData[teamAbbr] || {};

    return {
        record: espn.record || "0-0",
        homeRecord: espn.homeRecord || "-",
        awayRecord: espn.awayRecord || "-",
        divRecord: espn.divRecord || "-",
        streak: espn.streak || "-",
        pointsFor: espn.pointsFor || { value: "-" },
        pointsAgainst: espn.pointsAgainst || { value: "-" },
        diff: espn.diff || { value: "-" },
        offEpa: adv.offEpa || { value: "N/A" },
        defEpa: adv.defEpa || { value: "N/A" },
        offSuccess: adv.offSuccess || { value: "N/A" },
        defSuccess: adv.defSuccess || { value: "N/A" },
        offTotalYPG: adv.offTotalYPG || { value: "N/A" },
        offPassYPG: adv.offPassYPG || { value: "N/A" },
        offRushYPG: adv.offRushYPG || { value: "N/A" },
        defTotalYPG: adv.defTotalYPG || { value: "N/A" },
        defPassYPG: adv.defPassYPG || { value: "N/A" },
        defRushYPG: adv.defRushYPG || { value: "N/A" },
        offPassEpa: adv.offPassEpa || { value: "N/A" },
        offRushEpa: adv.offRushEpa || { value: "N/A" },
        offPassSuccess: adv.offPassSuccess || { value: "N/A" },
        offRushSuccess: adv.offRushSuccess || { value: "N/A" },
        defPassEpa: adv.defPassEpa || { value: "N/A" },
        defRushEpa: adv.defRushEpa || { value: "N/A" },
        defPassSuccess: adv.defPassSuccess || { value: "N/A" },
        defRushSuccess: adv.defRushSuccess || { value: "N/A" },
        // Situational stats
        off3rdDownConv: adv.off3rdDownConv || { value: "N/A" },
        def3rdDownConv: adv.def3rdDownConv || { value: "N/A" },
        offRedzoneTD: adv.offRedzoneTD || { value: "N/A" },
        defRedzoneTD: adv.defRedzoneTD || { value: "N/A" },
    };
  };

  return {
    home: mapStats(homeId),
    away: mapStats(awayId)
  };
}