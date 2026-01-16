import { PlayoffPicture, PlayoffTeam } from "@/types/nfl";
import { TEAM_LOGOS, DEFAULT_NFL_LOGO } from "@/constants/teams";

function getMockPlayoffPicture(): PlayoffPicture {
    // Helper to parse record and calculate stats
    const parseRecord = (record: string) => {
        const parts = record.split('-');
        const wins = parseInt(parts[0]);
        const losses = parseInt(parts[1]);
        const ties = parts[2] ? parseInt(parts[2]) : 0;
        const winPercentage = (wins + 0.5 * ties) / (wins + losses + ties);
        return { wins, losses, ties, winPercentage };
    };

    const afcTeams: PlayoffTeam[] = [
        { id: '7', name: 'Denver Broncos', abbreviation: 'DEN', seed: 1, record: '12-3', ...parseRecord('12-3'), pointsFor: 428, pointsAgainst: 312, differential: 116, streak: 'W3', logoUrl: TEAM_LOGOS['DEN'] || DEFAULT_NFL_LOGO, clinchStatus: 'CLINCHED_HOMEFIELD', scenarios: "Clinches AFC West with a win AND Chargers loss" },
        { id: '17', name: 'New England Patriots', abbreviation: 'NE', seed: 2, record: '12-3', ...parseRecord('12-3'), pointsFor: 415, pointsAgainst: 298, differential: 117, streak: 'W2', logoUrl: TEAM_LOGOS['NE'] || DEFAULT_NFL_LOGO, clinchStatus: 'NONE', tiebreakerReason: "Loses tiebreaker to Denver based on head-to-head record", magicNumber: 1 },
        { id: '30', name: 'Jacksonville Jaguars', abbreviation: 'JAX', seed: 3, record: '11-4', ...parseRecord('11-4'), pointsFor: 392, pointsAgainst: 325, differential: 67, streak: 'L1', logoUrl: TEAM_LOGOS['JAX'] || DEFAULT_NFL_LOGO, clinchStatus: 'NONE', magicNumber: 2 },
        { id: '23', name: 'Pittsburgh Steelers', abbreviation: 'PIT', seed: 4, record: '9-6', ...parseRecord('9-6'), pointsFor: 342, pointsAgainst: 318, differential: 24, streak: 'W1', logoUrl: TEAM_LOGOS['PIT'] || DEFAULT_NFL_LOGO, clinchStatus: 'NONE', scenarios: "Clinches North with a win OR Ravens loss", magicNumber: 1 },
        { id: '24', name: 'Los Angeles Chargers', abbreviation: 'LAC', seed: 5, record: '11-4', ...parseRecord('11-4'), pointsFor: 405, pointsAgainst: 312, differential: 93, streak: 'W2', logoUrl: TEAM_LOGOS['LAC'] || DEFAULT_NFL_LOGO, clinchStatus: 'NONE' },
        { id: '2', name: 'Buffalo Bills', abbreviation: 'BUF', seed: 6, record: '11-4', ...parseRecord('11-4'), pointsFor: 398, pointsAgainst: 289, differential: 109, streak: 'W4', logoUrl: TEAM_LOGOS['BUF'] || DEFAULT_NFL_LOGO, clinchStatus: 'NONE' },
        { id: '34', name: 'Houston Texans', abbreviation: 'HOU', seed: 7, record: '10-5', ...parseRecord('10-5'), pointsFor: 365, pointsAgainst: 328, differential: 37, streak: 'L2', logoUrl: TEAM_LOGOS['HOU'] || DEFAULT_NFL_LOGO, clinchStatus: 'NONE' },
        { id: '33', name: 'Baltimore Ravens', abbreviation: 'BAL', seed: 8, record: '10-5', ...parseRecord('10-5'), pointsFor: 378, pointsAgainst: 315, differential: 63, streak: 'W1', logoUrl: TEAM_LOGOS['BAL'] || DEFAULT_NFL_LOGO, clinchStatus: 'NONE', gamesBehind: "1.0 GB" },
        { id: '11', name: 'Indianapolis Colts', abbreviation: 'IND', seed: 9, record: '9-6', ...parseRecord('9-6'), pointsFor: 325, pointsAgainst: 342, differential: -17, streak: 'L1', logoUrl: TEAM_LOGOS['IND'] || DEFAULT_NFL_LOGO, clinchStatus: 'NONE', gamesBehind: "2.0 GB" },
        { id: '10', name: 'Tennessee Titans', abbreviation: 'TEN', seed: 15, record: '3-12', ...parseRecord('3-12'), pointsFor: 245, pointsAgainst: 398, differential: -153, streak: 'L6', logoUrl: TEAM_LOGOS['TEN'] || DEFAULT_NFL_LOGO, clinchStatus: 'ELIMINATED' },
    ];

    const nfcTeams: PlayoffTeam[] = [
        { id: '26', name: 'Seattle Seahawks', abbreviation: 'SEA', seed: 1, record: '12-3', ...parseRecord('12-3'), pointsFor: 432, pointsAgainst: 298, differential: 134, streak: 'W5', logoUrl: TEAM_LOGOS['SEA'] || DEFAULT_NFL_LOGO, clinchStatus: 'CLINCHED_HOMEFIELD' },
        { id: '3', name: 'Chicago Bears', abbreviation: 'CHI', seed: 2, record: '11-4', ...parseRecord('11-4'), pointsFor: 385, pointsAgainst: 312, differential: 73, streak: 'W2', logoUrl: TEAM_LOGOS['CHI'] || DEFAULT_NFL_LOGO, clinchStatus: 'NONE', magicNumber: 2 },
        { id: '21', name: 'Philadelphia Eagles', abbreviation: 'PHI', seed: 3, record: '10-5', ...parseRecord('10-5'), pointsFor: 368, pointsAgainst: 325, differential: 43, streak: 'L1', logoUrl: TEAM_LOGOS['PHI'] || DEFAULT_NFL_LOGO, clinchStatus: 'CLINCHED_DIVISION' },
        { id: '29', name: 'Carolina Panthers', abbreviation: 'CAR', seed: 4, record: '8-7', ...parseRecord('8-7'), pointsFor: 298, pointsAgainst: 315, differential: -17, streak: 'W1', logoUrl: TEAM_LOGOS['CAR'] || DEFAULT_NFL_LOGO, clinchStatus: 'NONE', scenarios: "Clinches South with a win AND Falcons loss" },
        { id: '25', name: 'San Francisco 49ers', abbreviation: 'SF', seed: 5, record: '11-4', ...parseRecord('11-4'), pointsFor: 412, pointsAgainst: 289, differential: 123, streak: 'W3', logoUrl: TEAM_LOGOS['SF'] || DEFAULT_NFL_LOGO, clinchStatus: 'NONE' },
        { id: '14', name: 'Los Angeles Rams', abbreviation: 'LAR', seed: 6, record: '11-4', ...parseRecord('11-4'), pointsFor: 395, pointsAgainst: 318, differential: 77, streak: 'W1', logoUrl: TEAM_LOGOS['LAR'] || DEFAULT_NFL_LOGO, clinchStatus: 'NONE' },
        { id: '9', name: 'Green Bay Packers', abbreviation: 'GB', seed: 7, record: '9-5-1', ...parseRecord('9-5-1'), pointsFor: 342, pointsAgainst: 325, differential: 17, streak: 'T1', logoUrl: TEAM_LOGOS['GB'] || DEFAULT_NFL_LOGO, clinchStatus: 'NONE' },
        { id: '1', name: 'Atlanta Falcons', abbreviation: 'ATL', seed: 8, record: '9-6', ...parseRecord('9-6'), pointsFor: 328, pointsAgainst: 335, differential: -7, streak: 'L2', logoUrl: TEAM_LOGOS['ATL'] || DEFAULT_NFL_LOGO, clinchStatus: 'NONE', gamesBehind: "0.5 GB" },
        { id: '6', name: 'Dallas Cowboys', abbreviation: 'DAL', seed: 9, record: '8-7', ...parseRecord('8-7'), pointsFor: 315, pointsAgainst: 342, differential: -27, streak: 'L1', logoUrl: TEAM_LOGOS['DAL'] || DEFAULT_NFL_LOGO, clinchStatus: 'NONE', gamesBehind: "1.0 GB" },
        { id: '19', name: 'New York Giants', abbreviation: 'NYG', seed: 16, record: '2-13', ...parseRecord('2-13'), pointsFor: 198, pointsAgainst: 425, differential: -227, streak: 'L8', logoUrl: TEAM_LOGOS['NYG'] || DEFAULT_NFL_LOGO, clinchStatus: 'ELIMINATED' },
    ];

    return {
      afc: {
          name: "AFC",
          teams: afcTeams.filter(t => t.seed <= 7),
          inTheHunt: afcTeams.filter(t => t.seed > 7 && t.clinchStatus !== 'ELIMINATED'),
          eliminated: afcTeams.filter(t => t.clinchStatus === 'ELIMINATED'),
          allTeams: [...afcTeams].sort((a, b) => a.seed - b.seed)
      },
      nfc: {
          name: "NFC",
          teams: nfcTeams.filter(t => t.seed <= 7),
          inTheHunt: nfcTeams.filter(t => t.seed > 7 && t.clinchStatus !== 'ELIMINATED'),
          eliminated: nfcTeams.filter(t => t.clinchStatus === 'ELIMINATED'),
          allTeams: [...nfcTeams].sort((a, b) => a.seed - b.seed)
      },
    };
}


export async function getPlayoffPicture(year: number = 2025): Promise<PlayoffPicture | null> {
  const url = `https://site.api.espn.com/apis/v2/sports/football/nfl/standings?season=${year}`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.warn(`Live playoff API failed for year ${year}, using mock data.`);
      return getMockPlayoffPicture();
    }
    const data = await res.json();
    
    const afcTeams: PlayoffTeam[] = [];
    const nfcTeams: PlayoffTeam[] = [];

    const processConference = (conferenceData: any, targetArray: PlayoffTeam[]) => {
       if (!conferenceData?.standings?.entries) return;

       conferenceData.standings.entries.forEach((entry: any) => {
          const stats = entry.stats || [];
          const getStat = (type: string) => stats.find((s: any) => s.type === type)?.displayValue;
          const getStatValue = (type: string) => parseFloat(stats.find((s: any) => s.type === type)?.value || "0");

          const seedStr = getStat('playoffseed');
          const seed = seedStr ? parseInt(seedStr) : 0;

          const clincher = getStat('clincher');
          let clinchStatus: PlayoffTeam['clinchStatus'] = 'NONE';

          if (clincher === '*') clinchStatus = 'CLINCHED_HOMEFIELD';
          else if (clincher === 'z') clinchStatus = 'CLINCHED_DIVISION';
          else if (clincher === 'y' || clincher === 'x') clinchStatus = 'CLINCHED_PLAYOFF';
          else if (clincher === 'e') clinchStatus = 'ELIMINATED';

          const wins = getStat('wins') || "0";
          const losses = getStat('losses') || "0";
          const ties = getStat('ties') || "0";
          const record = ties !== "0" ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;

          const teamAbbreviation = entry.team.abbreviation;
          const team: PlayoffTeam = {
              id: entry.team.id,
              name: entry.team.displayName,
              abbreviation: teamAbbreviation,
              logoUrl: TEAM_LOGOS[teamAbbreviation] || DEFAULT_NFL_LOGO,
              seed: seed,
              record: record,

              // Split W-L-T values
              wins: getStatValue('wins'),
              losses: getStatValue('losses'),
              ties: getStatValue('ties'),

              // Stats for standings table
              pointsFor: getStatValue('pointsfor'),
              pointsAgainst: getStatValue('pointsagainst'),
              differential: getStatValue('differential'),
              streak: getStat('streak') || '-',
              winPercentage: getStatValue('winpercent'),

              clinchStatus: clinchStatus,
              gamesBehind: getStat('gamesbehind'),
          };

          targetArray.push(team);
       });
    };

    if (data.children) {
        data.children.forEach((child: any) => {
            if (child.abbreviation === 'AFC') {
                processConference(child, afcTeams);
            } else if (child.abbreviation === 'NFC') {
                processConference(child, nfcTeams);
            }
        });
    }

    if (afcTeams.length < 7 || nfcTeams.length < 7) {
        console.warn("Live playoff data is incomplete, falling back to mock data.");
        return getMockPlayoffPicture();
    }

    afcTeams.sort((a, b) => a.seed - b.seed);
    nfcTeams.sort((a, b) => a.seed - b.seed);
    
    const categorize = (teams: PlayoffTeam[]) => {
        const bracket = teams.filter(t => t.seed > 0 && t.seed <= 7);
        const inTheHunt = teams.filter(t => t.seed >= 8 && t.seed <= 12 && t.clinchStatus !== 'ELIMINATED');
        const eliminated = teams.filter(t => t.clinchStatus === 'ELIMINATED');

        // All teams sorted by seed for standings table
        const allTeams = [...teams].sort((a, b) => a.seed - b.seed);

        return { bracket, inTheHunt, eliminated, allTeams };
    };

    const afcGroups = categorize(afcTeams);
    const nfcGroups = categorize(nfcTeams);

    return {
      afc: {
        name: "AFC",
        teams: afcGroups.bracket,
        inTheHunt: afcGroups.inTheHunt,
        eliminated: afcGroups.eliminated,
        allTeams: afcGroups.allTeams
      },
      nfc: {
        name: "NFC",
        teams: nfcGroups.bracket,
        inTheHunt: nfcGroups.inTheHunt,
        eliminated: nfcGroups.eliminated,
        allTeams: nfcGroups.allTeams
      },
    };

  } catch (error) {
    console.error("Error fetching playoff picture, using mock data:", error);
    return getMockPlayoffPicture();
  }
}
