import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import Papa from 'papaparse';

export const maxDuration = 60;

// Initialize Octokit, using a GitHub token if available to avoid rate-limiting
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function getLatestStatsUrl() {
  const TARGET_TAG = 'stats_team';
  const TARGET_FILENAME = 'stats_team_week_2025.csv'; // Based on your last request

  try {
    console.log(`[API Route] Attempting to get release by tag: ${TARGET_TAG}...`);
    const release = await octokit.repos.getReleaseByTag({
      owner: 'nflverse',
      repo: 'nflverse-data',
      tag: TARGET_TAG,
    });
    console.log(`[API Route] Successfully fetched release for tag: ${TARGET_TAG}`);

    const statsAsset = release.data.assets.find(asset => asset.name === TARGET_FILENAME);
    
    if (statsAsset) {
      console.log(`[API Route] Found '${TARGET_FILENAME}' in '${TARGET_TAG}' release:`, statsAsset.browser_download_url);
      return statsAsset.browser_download_url;
    }

    console.warn(`[API Route] Could not find '${TARGET_FILENAME}' in '${TARGET_TAG}' release. Falling back to previous logic.`);
    // Fallback to previous logic (latest release, then 'stats' tag for 'season_stats.csv')
    return getLatestStatsUrlFallback(); // Defined separately to avoid recursion

  } catch (error: any) {
    console.error(`[API Route] Octokit/GitHub API Error in getLatestStatsUrl:`, error);
    // If specific tag fetch fails, try the general latest/stats logic
    return getLatestStatsUrlFallback();
  }
}

// Fallback logic for getting URL from latest release or 'stats' tag
async function getLatestStatsUrlFallback() {
    try {
        console.log("[API Route] Attempting fallback to latest release...");
        const release = await octokit.repos.getLatestRelease({
            owner: 'nflverse',
            repo: 'nflverse-data',
        });
        console.log("[API Route] Successfully fetched latest release in fallback:", release.data.tag_name);

        const statsAsset = release.data.assets.find(asset => asset.name === 'season_stats.csv');
        
        if (statsAsset) {
            console.log("[API Route] Found 'season_stats.csv' in latest release fallback:", statsAsset.browser_download_url);
            return statsAsset.browser_download_url;
        }

        console.warn("[API Route] 'season_stats.csv' not found in latest release fallback. Falling back to 'stats' tag.");
        const statsRelease = await octokit.repos.getReleaseByTag({
            owner: 'nflverse',
            repo: 'nflverse-data',
            tag: 'stats'
        });
        const fallbackAsset = statsRelease.data.assets.find(asset => asset.name === 'season_stats.csv');
        
        if (fallbackAsset) {
            console.log("[API Route] Found asset in 'stats' tag release fallback:", fallbackAsset.browser_download_url);
            return fallbackAsset.browser_download_url;
        }

        throw new Error("Could not find 'season_stats.csv' in latest or 'stats' release via GitHub API.");

    } catch (error: any) {
        console.error("[API Route] Error in fallback getLatestStatsUrlFallback:", error);
        // Final fallback to a hardcoded URL in case all GitHub API calls fail or rate-limit
        const hardcodedFallback = "https://github.com/nflverse/nflverse-data/releases/download/stats/season_stats.csv";
        console.warn("[API Route] Using hardcoded fallback URL:", hardcodedFallback);
        return hardcodedFallback;
    }
}


// Mapping from ESPN's ID to nflfastR's abbreviation
const TEAM_MAP: { [key: string]: string } = {
  "1": "ATL", "2": "BUF", "3": "CHI", "4": "CIN", "5": "CLE", "6": "DAL",
  "7": "DEN", "8": "DET", "9": "GB", "10": "TEN", "11": "IND", "12": "KC",
  "13": "LV", "14": "LAR", "15": "MIA", "16": "MIN", "17": "NE", "18": "NO",
  "19": "NYG", "20": "NYJ", "21": "PHI", "22": "ARI", "23": "PIT", "24": "LAC",
  "25": "SF", "26": "SEA", "27": "TB", "28": "WAS", "29": "CAR", "30": "JAX",
  "33": "BAL", "34": "HOU"
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get('homeId');
  const awayId = searchParams.get('awayId');

  if (!homeId || !awayId) {
    return NextResponse.json({ error: 'homeId and awayId are required' }, { status: 400 });
  }

  try {
    const url = await getLatestStatsUrl();
    console.log("[API Route] Final CSV URL determined:", url);
    const response = await fetch(url, { next: { revalidate: 3600 } });

    if (!response.ok) {
      throw new Error(`Failed to download CSV from ${url}: ${response.statusText} (Status: ${response.status})`);
    }
    console.log("[API Route] Successfully downloaded CSV data.");

    const csvText = await response.text();
    const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true });
    
    // Determine target season based on filename or default to 2024
    let targetSeason = 2024; // Default
    if (url.includes('stats_team_week_2025.csv')) {
        targetSeason = 2025;
    } else {
        const match = url.match(/_(\d{4})\.csv$/);
        if (match) {
            targetSeason = parseInt(match[1]);
        }
    }
    console.log(`[API Route] Filtering data for target season: ${targetSeason}`);

    const filteredData = parsed.data.filter((row: any) => row.season === targetSeason && row.week === 1); // Assuming week 1 for season stats initially
    if(filteredData.length === 0) {
        // If week 1 has no data, try to get overall season stats
        console.warn(`[API Route] No data found for season ${targetSeason}, week 1. Trying overall season stats.`);
        targetSeason = Math.max(...parsed.data.map((row: any) => row.season).filter(Boolean)); // Get latest overall season
        const latestSeasonData = parsed.data.filter((row: any) => row.season === targetSeason && row.week === Math.max(...parsed.data.map((r: any) => r.week).filter(Boolean)));
        if (latestSeasonData.length > 0) {
            console.log(`[API Route] Using latest overall season data from season ${targetSeason}, week ${(latestSeasonData[0] as any).week}.`);
            filteredData.push(...latestSeasonData);
        } else {
            throw new Error(`No data available for season ${targetSeason} after filtering.`);
        }
    }
    
    const homeAbbr = TEAM_MAP[homeId];
    const awayAbbr = TEAM_MAP[awayId];

    // team_abbr is often used for team abbreviations in nflfastR team datasets
    const homeStats = filteredData.find((t: any) => t.team_abbr === homeAbbr || t.team === homeAbbr) || null;
    const awayStats = filteredData.find((t: any) => t.team_abbr === awayAbbr || t.team === awayAbbr) || null;

    if (!homeStats || !awayStats) {
        console.warn(`[API Route] Stats not found for one or both teams: Home Abbr=${homeAbbr}, Away Abbr=${awayAbbr}`);
        // Return partial data or a specific message
        return NextResponse.json({ home: homeStats, away: awayStats, message: "Stats for one or both teams not found in filtered data." }, { status: 200 });
    }

    return NextResponse.json(
      { home: homeStats, away: awayStats },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
    );
  } catch (error: any) {
    console.error("API Route /api/nfl-stats Error:", error); // Log the full error object
    return NextResponse.json({ error: error.message || "An unknown error occurred" }, { status: 500 });
  }
}
