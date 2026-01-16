import { TEAM_ID_TO_ABBR, getNflfastrAbbr } from "@/constants/teams";
import fs from "fs/promises";
import path from "path";

export type RankedStat = {
  value: string;
  rank?: number;
};

export type AdvancedTeamStats = {
  record: string;
  streak: string;
  pointsFor: RankedStat;
  pointsAgainst: RankedStat;
  diff: RankedStat;
  offEpa: RankedStat;
  defEpa: RankedStat;
  offSuccess: RankedStat;
  defSuccess: RankedStat;
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

async function getAdvancedStats(): Promise<Record<string, Partial<AdvancedTeamStats>>> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'team_stats.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const stats = JSON.parse(fileContent);

    // Extract values for ranking
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

    // Calculate Ranks
    // Offense: Higher is better (Descending)
    const offEpaRanks = calculateRanks(offEpaVals, false);
    const offSuccessRanks = calculateRanks(offSuccessVals, false);
    
    // Defense: Lower is better (Ascending) for EPA? 
    // Usually Defense EPA negative is good? 
    // Wait, in nflfastR, EPA is points added by offense. So Defense EPA being lower (more negative) is better for the defense.
    // So Ascending sort is correct for "Best Defense" (lowest EPA allowed).
    const defEpaRanks = calculateRanks(defEpaVals, true);
    
    // Success Rate allowed: Lower is better
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
            }
        };
    });

    return resultMap;

  } catch (error) {
    console.warn("Could not load local team stats JSON:", error);
    return {};
  }
}

async function getESPNStandings(): Promise<Record<string, Partial<AdvancedTeamStats>>> {
  try {
    const res = await fetch("https://site.api.espn.com/apis/v2/sports/football/nfl/standings", { next: { revalidate: 3600 } });
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
        streak: espn.streak || "-",
        pointsFor: espn.pointsFor || { value: "-" },
        pointsAgainst: espn.pointsAgainst || { value: "-" },
        diff: espn.diff || { value: "-" },
        offEpa: adv.offEpa || { value: "N/A" },
        defEpa: adv.defEpa || { value: "N/A" },
        offSuccess: adv.offSuccess || { value: "N/A" },
        defSuccess: adv.defSuccess || { value: "N/A" },
    };
  };

  return {
    home: mapStats(homeId),
    away: mapStats(awayId)
  };
}