import { Game, Team, WeatherInfo, MatchupStats, StatLeader, TeamBoxscore, ScoringPlay, Linescore, BoxScoreData } from "@/types/nfl";
import { TEAM_BRANDING, TEAM_LOGOS, DEFAULT_NFL_LOGO } from "@/constants/teams";
import { STADIUM_REGISTRY } from "@/constants/stadiums";
import { weatherCache } from "@/lib/weatherCache";
import { storage } from "@/lib/storage";

// Helper function to map OpenWeather ID to our condition strings
const mapWeatherCodeToCondition = (id: number): string => {
  if (id === 800) return "Sunny";
  if (id >= 801 && id <= 804) return "Cloudy";
  if ((id >= 500 && id <= 531) || (id >= 300 && id <= 321)) return "Rain";
  if (id >= 600 && id <= 622) return "Snow";
  return "Cloudy"; // Default case
};

const sortGames = (games: Game[]) => {
  return games.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export async function getGamesByWeek(
  week: number = 17,
  seasonType: number = 2,
  year: number = 2025
): Promise<{ games: Game[]; lastUpdated?: number; isSnapshot: boolean }> {
  // Use provided year for weeks 1-18 (Regular Season).
  const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${year}&seasontype=${seasonType}&week=${week}`;

  try {
    const espnData = await fetch(espnUrl)
      .then(res => res.ok ? res.json() : null)
      .catch(() => null);

    if (!espnData?.events) {
        const snapshot = storage.getSnapshot(week);
        if (snapshot) {
            return { games: sortGames(snapshot.data), lastUpdated: snapshot.lastUpdated, isSnapshot: true };
        }
        throw new Error("Failed to fetch ESPN data and no snapshot available");
    }

    const gamesPromises = espnData.events.map(async (event: any) => {
      const competition = event.competitions[0];
      const statusType = event.status.type.name; 
      const statusState = event.status.type.state; 
      const isFinal = statusState === 'post' || statusType === 'STATUS_FINAL';
      
      const venue = competition.venue;
      const homeComp = competition.competitors.find((c: any) => c.homeAway === "home");
      const awayComp = competition.competitors.find((c: any) => c.homeAway === "away");

      const getRecord = (comp: any) => {
        if (!comp.records) return "0-0";
        const totalRecord = comp.records.find((r: any) => r.type === 'total');
        return (totalRecord || comp.records[0])?.summary ?? "0-0";
      };

      const homeBranding = TEAM_BRANDING[homeComp.team.abbreviation as keyof typeof TEAM_BRANDING];
      const homeTeam: Team = {
        id: homeComp.team.id,
        name: homeComp.team.displayName,
        abbreviation: homeComp.team.abbreviation,
        record: getRecord(homeComp),
        logoUrl: TEAM_LOGOS[homeComp.team.abbreviation] || DEFAULT_NFL_LOGO,
        color: homeBranding?.primary || "#000000",
        colors: homeBranding?.colors || { primary: "#000000", lightAccent: "#000000", darkAccent: "#FFFFFF" },
        clinchedPlayoffs: homeComp.playoffStatus?.clinched,
      };

      const awayBranding = TEAM_BRANDING[awayComp.team.abbreviation as keyof typeof TEAM_BRANDING];
      const awayTeam: Team = {
        id: awayComp.team.id,
        name: awayComp.team.displayName,
        abbreviation: awayComp.team.abbreviation,
        record: getRecord(awayComp),
        logoUrl: TEAM_LOGOS[awayComp.team.abbreviation] || DEFAULT_NFL_LOGO,
        color: awayBranding?.primary || "#000000",
        colors: awayBranding?.colors || { primary: "#000000", lightAccent: "#000000", darkAccent: "#FFFFFF" },
        clinchedPlayoffs: awayComp.playoffStatus?.clinched,
      };

      let weather: WeatherInfo = { temperature: 0, condition: "N/A", windSpeed: 0, precipChance: 0 };
      let lat, lon, isIndoor = false;

      if (STADIUM_REGISTRY[venue.fullName]) {
        const registry = STADIUM_REGISTRY[venue.fullName];
        isIndoor = registry.indoor;
        lat = registry.lat;
        lon = registry.lon;
      } else if (venue.coordinates) {
        lat = venue.coordinates.latitude;
        lon = venue.coordinates.longitude;
        isIndoor = venue.indoor;
      }

      /* Weather fetching commented out
      if (lat && lon && !isFinal) {
        const fetchedWeather = await getWeather(lat.toString(), lon.toString(), event.date);
        weather = isIndoor ? { ...fetchedWeather, condition: "Dome" } : fetchedWeather;
      }
      */

      const homeScore = parseInt(homeComp.score) || 0;
      const awayScore = parseInt(awayComp.score) || 0;
      const winnerId = isFinal ? (homeScore > awayScore ? homeTeam.id : (awayScore > homeScore ? awayTeam.id : undefined)) : undefined;

      return {
        id: event.id,
        week: espnData.week.number,
        season: year,
        seasonType: seasonType,
        date: event.date,
        venue: venue.fullName,
        venueLocation: `${venue.address?.city}, ${venue.address?.state}`,
        homeTeam,
        awayTeam,
        weather,
        broadcast: competition.broadcasts?.[0]?.names?.[0] ?? competition.geoBroadcasts?.[0]?.media?.shortName ?? "",
        isLive: statusState === 'in',
        indoor: !!isIndoor,
        status: statusState as 'pre' | 'in' | 'post',
        displayClock: event.status.displayClock,
        period: event.status.period,
        homeScore,
        awayScore,
        winnerId
      };
    });

    const resolvedGames = await Promise.all(gamesPromises);

    // Sort games by date
    sortGames(resolvedGames);

    storage.saveSnapshot(week, resolvedGames);

    return { games: resolvedGames, lastUpdated: Date.now(), isSnapshot: false };

  } catch (error) {
    console.warn("Error fetching live game data, checking snapshots:", error);
    const snapshot = storage.getSnapshot(week);
    if (snapshot) {
        return { games: sortGames(snapshot.data), lastUpdated: snapshot.lastUpdated, isSnapshot: true };
    }
    return { games: sortGames(getMockGames(week)), isSnapshot: false };
  }
}

/**
 * Fetches all games for a specific team in a given season
 * @param teamAbbreviation - Team abbreviation (e.g., "BUF", "KC")
 * @param year - Season year (e.g., 2025)
 * @param seasonType - 2 = Regular Season, 3 = Playoffs (default: 2)
 * @returns Array of games featuring the specified team, sorted chronologically
 */
export async function getGamesByTeam(
  teamAbbreviation: string,
  year: number = 2025
): Promise<{ games: Game[]; lastUpdated?: number; isSnapshot: boolean }> {
  // Determine max weeks based on season for regular season
  const maxRegularWeeks = year >= 2021 ? 18 : 17;
  const regularSeasonPromises = Array.from({ length: maxRegularWeeks }, (_, i) =>
    getGamesByWeek(i + 1, 2, year)
  );

  // Playoffs are seasonType 3, weeks 1 (Wild Card) through 5 (Super Bowl)
  const playoffPromises = Array.from({ length: 5 }, (_, i) =>
    getGamesByWeek(i + 1, 3, year)
  );

  // Fetch all regular season and playoff weeks in parallel
  const allPromises = [...regularSeasonPromises, ...playoffPromises];
  const allWeekResults = await Promise.all(allPromises);

  // Flatten all games and filter for the specified team
  const allGames = allWeekResults.flatMap(result => result.games);

  const teamGames = allGames.filter(game =>
    game.homeTeam.abbreviation === teamAbbreviation ||
    game.awayTeam.abbreviation === teamAbbreviation
  );

  // Remove duplicates that might appear if a game is in multiple fetches (unlikely but safe)
  const uniqueGames = Array.from(new Map(teamGames.map(game => [game.id, game])).values());

  // Sort chronologically (earliest first)
  uniqueGames.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    games: uniqueGames,
    lastUpdated: Date.now(),
    isSnapshot: false
  };
}

// Helper to determine if weather should be refetched based on game proximity
const shouldRefetchWeather = (gameDate: string, lastFetchTime: number): boolean => {
  const now = Date.now();
  const kickoff = new Date(gameDate).getTime();
  const diffHours = (kickoff - now) / (1000 * 60 * 60);
  const dataAgeHours = (now - lastFetchTime) / (1000 * 60 * 60);

  if (diffHours > 72) { // > 3 days
    return dataAgeHours > 12;
  } else if (diffHours > 24) { // 1-3 days
    return dataAgeHours > 6;
  } else { // < 24 hours
    return dataAgeHours > 1;
  }
};

export async function getWeather(
  lat: string,
  lon: string,
  gameDate: string
): Promise<WeatherInfo> {
  const cacheKey = `weather_${lat}_${lon}`;
  const cached = weatherCache.get(cacheKey);
  
  if (cached && !shouldRefetchWeather(gameDate, cached.lastUpdated || 0)) {
    return cached;
  }

  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=imperial`;

  try {
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`Weather throttled: Using stale data for ${lat},${lon}.`);
      }
      return cached || { temperature: 0, condition: "N/A", windSpeed: 0, precipChance: 0 };
    }
    const data = await response.json();

    const weather = {
      temperature: Math.round(data.main.temp),
      condition: mapWeatherCodeToCondition(data.weather[0].id),
      windSpeed: Math.round(data.wind.speed),
      precipChance: 0, 
      lastUpdated: Date.now()
    };

    weatherCache.set(cacheKey, weather);
    return weather;
  } catch (error) {
    console.error(`Error fetching weather for lat/lon ${lat},${lon}:`, error);
    return cached || { temperature: 0, condition: "N/A", windSpeed: 0, precipChance: 0 };
  }
}

async function getGameSummary(gameId: string): Promise<{ matchupStats: MatchupStats; scoringPlays?: ScoringPlay[]; linescores?: { home: Linescore[], away: Linescore[] } } | undefined> {
  const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`;
  try {
    const res = await fetch(summaryUrl);
    if (!res.ok) return undefined;
    const data = await res.json();
    
    if (!data.leaders) {
        return { matchupStats: { home: {}, away: {} }, scoringPlays: [], linescores: { home: [], away: [] } };
    }

    const parseTeamLeaders = (teamData: any) => {
        if (!teamData) return {};
        const passing = teamData.leaders?.find((l: any) => l.name === "passingYards");
        const rushing = teamData.leaders?.find((l: any) => l.name === "rushingYards");
        const receiving = teamData.leaders?.find((l: any) => l.name === "receivingYards");

        const mapLeader = (catData: any, categoryName: string): StatLeader | undefined => {
             if (!catData || !catData.leaders || catData.leaders.length === 0) return undefined;
             const leader = catData.leaders[0];
             const athlete = leader.athlete;
             const displayValue = leader.displayValue || "";
             const parts = displayValue.split(/,\s+/).map((s: string) => s.trim());
             const stats: { [key: string]: string } = {};
             const findValue = (suffix: string) => {
                const part = parts.find((p: string) => p.endsWith(suffix));
                return part ? part.replace(suffix, "").trim() : "0";
             };
             if (leader.mainStat && leader.mainStat.label === "YDS") {
                 stats["Yds"] = leader.mainStat.value;
             } else {
                 stats["Yds"] = findValue("YDS");
             }
             stats["TD"] = findValue("TD");
             if (categoryName === "Passing") stats["INT"] = findValue("INT");
             else if (categoryName === "Rushing") {
                 const carStr = findValue("CAR");
                 let car = parseFloat(carStr.replace(/,/g, ''));
                 let yds = parseFloat(stats["Yds"].toString().replace(/,/g, ''));
                 stats["AVG"] = (car > 0 && !isNaN(yds)) ? (yds / car).toFixed(1) : "0.0";
             } else if (categoryName === "Receiving") stats["REC"] = findValue("REC");
             return {
                name: athlete.displayName, value: leader.mainStat?.value || stats["Yds"], category: categoryName,
                teamAbbreviation: teamData.team.abbreviation, logoUrl: athlete.headshot?.href, detailedStats: stats
             };
        };

        return {
            passingLeader: mapLeader(passing, "Passing"), rushingLeader: mapLeader(rushing, "Rushing"), receivingLeader: mapLeader(receiving, "Receiving"),
        };
    };

    const parseBoxScore = (boxscoreData: any): BoxScoreData | undefined => {
        if (!boxscoreData || !boxscoreData.players) return undefined;
        const parseCategory = (name: string, headers: string[]) => {
            const categoryData = boxscoreData.players.find((p: any) => p.name === name);
            if (!categoryData) return { headers, players: [], totals: [] };
            const players = categoryData.athletes.map((athlete: any) => ({ name: athlete.athlete.displayName, stats: athlete.stats }));
            const totals = categoryData.totals || headers.map(() => "");
            return { headers, players, totals };
        };
        return {
            passing: parseCategory("passing", ["C/ATT", "YDS", "AVG", "TD", "INT", "SACKS", "QBR", "RTG"]),
            rushing: parseCategory("rushing", ["CAR", "YDS", "AVG", "TD", "LONG"]),
            receiving: parseCategory("receiving", ["REC", "YDS", "AVG", "TD", "LONG", "TGTS"]),
            fumbles: parseCategory("fumbles", ["FUM", "LOST", "REC"]),
        };
    };

    const homeComp = data.header?.competitions?.[0]?.competitors?.find((c:any) => c.homeAway === 'home');
    const awayComp = data.header?.competitions?.[0]?.competitors?.find((c:any) => c.homeAway === 'away');
    
    const homeBox = data.boxscore?.players?.find((p:any) => p.team.id === homeComp?.id);
    const awayBox = data.boxscore?.players?.find((p:any) => p.team.id === awayComp?.id);

    const homeTeamLeaders = data.leaders.find((l: any) => l.team.id === homeComp?.id);
    const awayTeamLeaders = data.leaders.find((l: any) => l.team.id === awayComp?.id);

    const homeStats = { ...parseTeamLeaders(homeTeamLeaders), boxscore: parseBoxScore(homeBox ? { players: homeBox.statistics } : undefined) };
    const awayStats = { ...parseTeamLeaders(awayTeamLeaders), boxscore: parseBoxScore(awayBox ? { players: awayBox.statistics } : undefined) };

    const scoringPlays: ScoringPlay[] = (data.scoringPlays || [])
        .filter((play: any) => play && play.text)
        .map((play: any) => ({
            id: play.id, quarter: play.period.number, clock: play.clock.displayValue, text: play.text || '', type: play.type?.text || 'N/A',
            team: { id: play.team.id, abbreviation: play.team.abbreviation || play.team.displayName, logo: play.team.logo || '' },
            scoreValue: play.scoringType?.value || 0, awayScore: play.awayScore, homeScore: play.homeScore
        }));

    const homeLinescores = homeComp?.linescores?.filter(Boolean).map((l: any) => ({ displayValue: l.displayValue, label: l.period?.toString() || '' })) || [];
    const awayLinescores = awayComp?.linescores?.filter(Boolean).map((l: any) => ({ displayValue: l.displayValue, label: l.period?.toString() || '' })) || [];

    return {
        matchupStats: { home: homeStats, away: awayStats },
        scoringPlays,
        linescores: { home: homeLinescores, away: awayLinescores }
    };
  } catch (e) {
    console.error(`Error in getGameSummary for ID ${gameId}:`, e);
    return undefined;
  }
}

export async function getGameById(id: string, options: { fetchWeather?: boolean } = { fetchWeather: false }): Promise<Game | undefined> {
  const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${id}`;

  try {
    const summaryRes = await fetch(summaryUrl);
    if (!summaryRes.ok) {
      console.error(`Failed to fetch summary for game ${id}`);
      return undefined;
    }
    const data = await summaryRes.json();

    const competition = data.header.competitions[0];
    const statusType = data.header.competitions[0].status.type;
    const isFinal = statusType.name === 'STATUS_FINAL' || statusType.completed === true;

    const homeComp = competition.competitors.find((c: any) => c.homeAway === "home");
    const awayComp = competition.competitors.find((c: any) => c.homeAway === "away");

    let historicalGame: Game | undefined;
    
    // If records are missing (null or empty array), try fetching from scoreboard endpoint
    const recordsMissing = (!homeComp.records || homeComp.records.length === 0) && (!awayComp.records || awayComp.records.length === 0);

    if (recordsMissing) {
         try {
             // Pass explicit year and week from header to get point-in-time records
             const { games } = await getGamesByWeek(data.header.week, data.header.season.type, data.header.season.year);
             historicalGame = games.find(g => g.id === id);
         } catch (err) {
             console.warn("Failed to fetch historical game data for records:", err);
         }
    }

    const getRecord = (comp: any, isHome: boolean) => {
        if (comp.records && comp.records.length > 0) {
            return comp.records[0].summary;
        }

        // Try historical game first (more accurate for past games)
        if (historicalGame) {
            return isHome ? historicalGame.homeTeam.record : historicalGame.awayTeam.record;
        }
        
        // Fallback to standings (season-end records)
        if (data.standings && data.standings.groups) {
            for (const group of data.standings.groups) {
                const entry = group.standings?.entries?.find((e: any) => e.id === comp.id);
                if (entry) {
                    const totalStat = entry.stats?.find((s: any) => s.type === 'total' || s.name === 'overall');
                    if (totalStat?.summary) return totalStat.summary;
                }
            }
        }
        
        return "0-0";
    };

    const homeBranding = TEAM_BRANDING[homeComp.team.abbreviation as keyof typeof TEAM_BRANDING];
    const homeTeam: Team = {
      id: homeComp.team.id, name: homeComp.team.displayName, abbreviation: homeComp.team.abbreviation,
      record: getRecord(homeComp, true), logoUrl: TEAM_LOGOS[homeComp.team.abbreviation] || DEFAULT_NFL_LOGO,
      color: homeBranding?.primary || "#000000",
      colors: homeBranding?.colors || { primary: "#000000", lightAccent: "#000000", darkAccent: "#FFFFFF" },
      clinchedPlayoffs: false,
    };

    const awayBranding = TEAM_BRANDING[awayComp.team.abbreviation as keyof typeof TEAM_BRANDING];
    const awayTeam: Team = {
      id: awayComp.team.id, name: awayComp.team.displayName, abbreviation: awayComp.team.abbreviation,
      record: getRecord(awayComp, false), logoUrl: TEAM_LOGOS[awayComp.team.abbreviation] || DEFAULT_NFL_LOGO,
      color: awayBranding?.primary || "#000000",
      colors: awayBranding?.colors || { primary: "#000000", lightAccent: "#000000", darkAccent: "#FFFFFF" },
      clinchedPlayoffs: false,
    };

    const venue = data.gameInfo.venue;
    const isIndoor = venue.indoor;
    let weather: WeatherInfo = { temperature: 0, condition: "N/A", windSpeed: 0, precipChance: 0 };
    
    if (options.fetchWeather && venue.coordinates && !isFinal) {
      const fetchedWeather = await getWeather(venue.coordinates.latitude.toString(), venue.coordinates.longitude.toString(), data.header.date);
      weather = isIndoor ? { ...fetchedWeather, condition: "Dome" } : fetchedWeather;
    }

    const summary = await getGameSummary(id);

    // Process Drives
    let drives: import("@/types/nfl").Drive[] = [];
    if (data.drives) {
        const previous = data.drives.previous || [];
        const current = data.drives.current;
        
        // Deduplicate: If current drive exists, ensure it's not already in previous
        const rawDrives = [...previous];
        if (current && !rawDrives.some((d: any) => d.id === current.id)) {
            rawDrives.push(current);
        }

        drives = rawDrives.map((d: any) => {
            const plays = (d.plays?.map((p: any) => ({
                id: p.id,
                driveId: d.id,
                clock: p.clock?.displayValue || (typeof p.clock === 'string' ? p.clock : ""),
                text: p.text || p.shortText || "",
                type: p.type?.text || "",
                down: p.start?.down,
                distance: p.start?.distance,
                yardLine: p.start?.yardLine,
                yardsGained: p.statYardage,
                quarter: p.period?.number,
                isScore: p.scoringType?.value > 0,
                wallclock: p.wallclock,
                team: {
                    id: d.team?.id,
                    logo: d.team?.logos?.[0]?.href
                },
                homeScore: p.homeScore,
                awayScore: p.awayScore
            })) || []);

            // Plays are chronological from API. Last play has final score of drive.
            const lastPlay = plays[plays.length - 1];
            const homeScoreAfter = lastPlay?.homeScore ?? 0;
            const awayScoreAfter = lastPlay?.awayScore ?? 0;
            const startQuarter = d.start?.period?.number ?? plays[0]?.quarter;
            const endQuarter = d.end?.period?.number ?? lastPlay?.quarter;

            return {
                id: d.id,
                description: d.description,
                team: {
                    id: d.team?.id,
                    logo: d.team?.logos?.[0]?.href || (d.team?.id === homeTeam.id ? homeTeam.logoUrl : awayTeam.logoUrl),
                    abbreviation: d.team?.abbreviation || d.team?.displayName,
                    color: d.team?.id === homeTeam.id ? homeTeam.color : awayTeam.color
                },
                result: d.result?.text || (typeof d.result === 'string' ? d.result : "In Progress"),
                yards: typeof d.yards === 'object' ? d.yards.value : d.yards,
                timeElapsed: d.timeElapsed?.displayValue || (typeof d.timeElapsed === 'string' ? d.timeElapsed : ""),
                playCount: d.offensivePlays,
                startClock: d.start?.clock?.displayValue,
                isScore: d.isScore,
                plays: isFinal ? plays : plays.reverse(), // Newest first only for live games
                startQuarter,
                endQuarter,
                homeScoreAfter,
                awayScoreAfter
            };
        });

        if (!isFinal) {
            drives.reverse(); // Newest drive first for live games
        }
    }

    const game: Game = {
      id: id, week: data.header.week, season: data.header.season.year, seasonType: data.header.season.type,
      displayClock: statusType.detail === 'Final' ? '0:00' : competition.status.displayClock,
      period: competition.status.period,
      date: data.header.date || new Date().toISOString(),
      venue: venue.fullName, venueLocation: `${venue.address?.city}, ${venue.address?.state}`,
      homeTeam, awayTeam, weather,
      broadcast: competition.broadcasts?.[0]?.names?.[0] ?? "",
      isLive: statusType.state === 'in', indoor: isIndoor, status: statusType.state as 'pre' | 'in' | 'post',
      homeScore: parseInt(homeComp.score) || 0, awayScore: parseInt(awayComp.score) || 0,
      winnerId: homeComp.winner ? homeTeam.id : (awayComp.winner ? awayTeam.id : undefined),
      matchupStats: summary?.matchupStats,
      scoringPlays: summary?.scoringPlays,
      linescores: summary?.linescores,
      drives
    };
    
    return game;

  } catch (error) {
    console.error(`Error constructing game object for ID ${id}:`, error);
    return undefined;
  }
}

export function getMockGames(week: number): Game[] {
  return [
    {
      id: "401671640",
      week: week,
      season: 2025,
      seasonType: 2,
      displayClock: '0:00',
      period: 0,
      date: new Date(Date.now() + 86400000).toISOString(),
      venue: "Highmark Stadium",
      venueLocation: "Orchard Park, NY",
      homeTeam: {
        id: "2",
        name: "Buffalo Bills",
        abbreviation: "BUF",
        record: "10-6",
        logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",
        clinchedPlayoffs: true,
        color: "#00338D",
      },
      awayTeam: {
        id: "20",
        name: "New York Jets",
        abbreviation: "NYJ",
        record: "6-10",
        logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png",
        clinchedPlayoffs: false,
        color: "#125740",
      },
      weather: {
        temperature: 28,
        condition: "Snow",
        windSpeed: 15,
        precipChance: 60,
      },
      broadcast: "CBS",
      isLive: false,
      indoor: false,
      status: 'pre',
      homeScore: 0,
      awayScore: 0,
      matchupStats: {
        home: {
          passingLeader: { name: "J. Allen", value: "3200", category: "Passing", teamAbbreviation: "BUF", detailedStats: { "Yds": "3200", "TD": "28", "INT": "9" } },
          rushingLeader: { name: "J. Cook", value: "950", category: "Rushing", teamAbbreviation: "BUF", detailedStats: { "Yds": "950", "TD": "4", "AVG": "4.9" } },
          receivingLeader: { name: "S. Diggs", value: "1100", category: "Receiving", teamAbbreviation: "BUF", detailedStats: { "Yds": "1100", "TD": "8", "REC": "85" } },
        },
        away: {
          passingLeader: { name: "A. Rodgers", value: "2800", category: "Passing", teamAbbreviation: "NYJ", detailedStats: { "Yds": "2800", "TD": "20", "INT": "6" } },
          rushingLeader: { name: "B. Hall", value: "850", category: "Rushing", teamAbbreviation: "NYJ", detailedStats: { "Yds": "850", "TD": "5", "AVG": "4.5" } },
          receivingLeader: { name: "G. Wilson", value: "900", category: "Receiving", teamAbbreviation: "NYJ", detailedStats: { "Yds": "900", "TD": "6", "REC": "70" } },
        }
      }
    },
    {
      id: "401671641",
      week: week,
      season: 2025,
      seasonType: 2,
      displayClock: '0:00',
      period: 0,
      date: new Date(Date.now() + 90000000).toISOString(),
      venue: "Lambeau Field",
      venueLocation: "Green Bay, WI",
      homeTeam: {
        id: "9",
        name: "Green Bay Packers",
        abbreviation: "GB",
        record: "8-8",
        logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png",
        clinchedPlayoffs: false,
        color: "#183028",
      },
      awayTeam: {
        id: "3",
        name: "Chicago Bears",
        abbreviation: "CHI",
        record: "7-9",
        logoUrl: "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png",
        clinchedPlayoffs: false,
        color: "#0B162A",
      },
      weather: {
        temperature: 15,
        condition: "Cloudy",
        windSpeed: 12,
        precipChance: 10,
      },
      broadcast: "FOX",
      isLive: false,
      indoor: false,
      status: 'pre',
      homeScore: 0,
      awayScore: 0,
    },
  ];
}
