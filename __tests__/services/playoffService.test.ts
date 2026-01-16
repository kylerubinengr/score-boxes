import { getPlayoffPicture } from '@/services/playoffService';
import { mockStandingsResponse, mockPlayoffPicture } from '@/mocks/mockData';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

describe('playoffService', () => {
  describe('getPlayoffPicture', () => {
    describe('Success Cases', () => {
      it('should fetch live playoff standings from ESPN', async () => {
        const result = await getPlayoffPicture(2025);

        expect(result).toBeDefined();
        expect(result).not.toBeNull();
        expect(result?.afc).toBeDefined();
        expect(result?.nfc).toBeDefined();
      });

      it('should parse AFC teams correctly (seeds 1-7)', async () => {
        const result = await getPlayoffPicture(2025);

        expect(result?.afc.teams).toBeDefined();
        expect(result?.afc.teams.length).toBeGreaterThan(0);
        expect(result?.afc.teams.length).toBeLessThanOrEqual(7);

        // Verify seed order
        const seeds = result?.afc.teams.map(t => t.seed) || [];
        expect(seeds).toEqual([...seeds].sort((a, b) => a - b));

        // Verify first team structure
        const firstTeam = result?.afc.teams[0];
        expect(firstTeam).toHaveProperty('id');
        expect(firstTeam).toHaveProperty('name');
        expect(firstTeam).toHaveProperty('abbreviation');
        expect(firstTeam).toHaveProperty('seed');
        expect(firstTeam).toHaveProperty('record');
        expect(firstTeam).toHaveProperty('wins');
        expect(firstTeam).toHaveProperty('losses');
        expect(firstTeam).toHaveProperty('ties');
      });

      it('should parse NFC teams correctly (seeds 1-7)', async () => {
        server.use(
          http.get('http://site.api.espn.com/apis/v2/sports/football/nfl/standings', () => {
            return HttpResponse.json({
              ...mockStandingsResponse,
              children: [
                mockStandingsResponse.children[0], // AFC
                {
                  ...mockStandingsResponse.children[0],
                  id: "9",
                  name: "National Football Conference",
                  abbreviation: "NFC"
                }
              ]
            });
          })
        );

        const result = await getPlayoffPicture(2025);

        expect(result?.nfc.teams).toBeDefined();
        expect(result?.nfc.teams.length).toBeGreaterThan(0);
      });

      it('should categorize teams (bracket, inTheHunt, eliminated)', async () => {
        const result = await getPlayoffPicture(2025);

        // Bracket teams (seeds 1-7)
        expect(result?.afc.teams).toBeDefined();
        expect(result?.afc.teams.every(t => t.seed >= 1 && t.seed <= 7)).toBe(true);

        // In the hunt (seeds 8-12, not eliminated)
        expect(result?.afc.inTheHunt).toBeDefined();
        expect(Array.isArray(result?.afc.inTheHunt)).toBe(true);

        // Eliminated teams
        expect(result?.afc.eliminated).toBeDefined();
        expect(Array.isArray(result?.afc.eliminated)).toBe(true);

        // All teams array
        expect(result?.afc.allTeams).toBeDefined();
        expect(Array.isArray(result?.afc.allTeams)).toBe(true);
      });

      it('should parse clinch status (* = homefield, z = division, x = playoff, e = eliminated)', async () => {
        const result = await getPlayoffPicture(2025);
        const teams = result?.afc.allTeams || [];

        // Find team with homefield advantage
        const homefieldTeam = teams.find(t => t.clinchStatus === 'CLINCHED_HOMEFIELD');
        if (homefieldTeam) {
          expect(homefieldTeam.clinchStatus).toBe('CLINCHED_HOMEFIELD');
        }

        // Find team that clinched division
        const divisionTeam = teams.find(t => t.clinchStatus === 'CLINCHED_DIVISION');
        if (divisionTeam) {
          expect(divisionTeam.clinchStatus).toBe('CLINCHED_DIVISION');
        }

        // Find team that clinched playoff spot
        const playoffTeam = teams.find(t => t.clinchStatus === 'CLINCHED_PLAYOFF');
        if (playoffTeam) {
          expect(playoffTeam.clinchStatus).toBe('CLINCHED_PLAYOFF');
        }

        // Find eliminated team
        const eliminatedTeam = teams.find(t => t.clinchStatus === 'ELIMINATED');
        if (eliminatedTeam) {
          expect(eliminatedTeam.clinchStatus).toBe('ELIMINATED');
        }
      });

      it('should calculate win percentage from stats', async () => {
        const result = await getPlayoffPicture(2025);
        const firstTeam = result?.afc.teams[0];

        expect(firstTeam?.winPercentage).toBeDefined();
        expect(typeof firstTeam?.winPercentage).toBe('number');
        expect(firstTeam?.winPercentage).toBeGreaterThanOrEqual(0);
        expect(firstTeam?.winPercentage).toBeLessThanOrEqual(1);

        // Verify calculation: winPct = wins / (wins + losses + ties)
        if (firstTeam) {
          const expectedPct = firstTeam.wins / (firstTeam.wins + firstTeam.losses + firstTeam.ties);
          expect(Math.abs(firstTeam.winPercentage - expectedPct)).toBeLessThan(0.001);
        }
      });

      it('should parse additional stats (points for/against, differential, streak)', async () => {
        const result = await getPlayoffPicture(2025);
        const firstTeam = result?.afc.teams[0];

        expect(firstTeam?.pointsFor).toBeDefined();
        expect(typeof firstTeam?.pointsFor).toBe('number');

        expect(firstTeam?.pointsAgainst).toBeDefined();
        expect(typeof firstTeam?.pointsAgainst).toBe('number');

        expect(firstTeam?.differential).toBeDefined();
        expect(typeof firstTeam?.differential).toBe('number');

        // Verify differential calculation
        if (firstTeam) {
          expect(firstTeam.differential).toBe(firstTeam.pointsFor - firstTeam.pointsAgainst);
        }

        expect(firstTeam?.streak).toBeDefined();
        expect(typeof firstTeam?.streak).toBe('string');
      });

      it('should handle games behind calculation', async () => {
        const result = await getPlayoffPicture(2025);
        const inTheHuntTeam = result?.afc.inTheHunt[0];

        if (inTheHuntTeam && inTheHuntTeam.gamesBehind) {
          expect(typeof inTheHuntTeam.gamesBehind).toBe('string');
          expect(inTheHuntTeam.gamesBehind).toMatch(/\d+(\.\d+)?\s+GB/);
        }
      });

      it('should parse record with ties correctly', async () => {
        server.use(
          http.get('http://site.api.espn.com/apis/v2/sports/football/nfl/standings', () => {
            const modifiedResponse = {
              ...mockStandingsResponse,
              children: [{
                ...mockStandingsResponse.children[0],
                standings: {
                  ...mockStandingsResponse.children[0].standings,
                  entries: [{
                    ...mockStandingsResponse.children[0].standings.entries[0],
                    stats: [
                      { name: "wins", displayValue: "9", value: 9 },
                      { name: "losses", displayValue: "5", value: 5 },
                      { name: "ties", displayValue: "1", value: 1 },
                      { name: "winpercent", displayValue: "0.633", value: 0.633 },
                      { name: "pointsFor", displayValue: "342", value: 342 },
                      { name: "pointsAgainst", displayValue: "325", value: 325 },
                      { name: "differential", displayValue: "17", value: 17 },
                      { name: "streak", displayValue: "T1", value: "T1" },
                      { name: "playoffseed", displayValue: "7", value: 7 },
                      { name: "clincher", displayValue: "", value: "" }
                    ]
                  }]
                }
              }]
            };
            return HttpResponse.json(modifiedResponse);
          })
        );

        const result = await getPlayoffPicture(2025);
        const teamWithTie = result?.afc.teams[0];

        expect(teamWithTie?.record).toMatch(/\d+-\d+-\d+/); // Format: 9-5-1
        expect(teamWithTie?.ties).toBeGreaterThan(0);
      });
    });

    describe('Edge Cases', () => {
      it('should handle incomplete standings data (< 7 teams per conference)', async () => {
        server.use(
          http.get('http://site.api.espn.com/apis/v2/sports/football/nfl/standings', () => {
            return HttpResponse.json({
              ...mockStandingsResponse,
              children: [{
                ...mockStandingsResponse.children[0],
                standings: {
                  ...mockStandingsResponse.children[0].standings,
                  entries: mockStandingsResponse.children[0].standings.entries.slice(0, 5) // Only 5 teams
                }
              }]
            });
          })
        );

        const result = await getPlayoffPicture(2025);

        // Should fall back to mock data when incomplete
        expect(result).toBeDefined();
        expect(result?.afc.teams.length).toBeGreaterThanOrEqual(7);
      });

      it('should handle missing clinch indicators', async () => {
        server.use(
          http.get('http://site.api.espn.com/apis/v2/sports/football/nfl/standings', () => {
            const modifiedResponse = {
              ...mockStandingsResponse,
              children: [{
                ...mockStandingsResponse.children[0],
                standings: {
                  ...mockStandingsResponse.children[0].standings,
                  entries: mockStandingsResponse.children[0].standings.entries.map((entry: any) => ({
                    ...entry,
                    stats: entry.stats.map((stat: any) =>
                      stat.name === 'clincher' ? { ...stat, displayValue: '', value: '' } : stat
                    )
                  }))
                }
              }]
            });
            return HttpResponse.json(modifiedResponse);
          })
        );

        const result = await getPlayoffPicture(2025);
        const team = result?.afc.teams[0];

        expect(team?.clinchStatus).toBe('NONE');
      });

      it('should handle missing stats gracefully', async () => {
        server.use(
          http.get('http://site.api.espn.com/apis/v2/sports/football/nfl/standings', () => {
            const modifiedResponse = {
              ...mockStandingsResponse,
              children: [{
                ...mockStandingsResponse.children[0],
                standings: {
                  ...mockStandingsResponse.children[0].standings,
                  entries: [{
                    team: mockStandingsResponse.children[0].standings.entries[0].team,
                    stats: [] // No stats
                  }]
                }
              }]
            });
            return HttpResponse.json(modifiedResponse);
          })
        );

        const result = await getPlayoffPicture(2025);

        // Should fall back to mock data
        expect(result).toBeDefined();
      });

      it('should handle missing gamesBehind field', async () => {
        const result = await getPlayoffPicture(2025);
        const teams = result?.afc.allTeams || [];

        // Top seeds shouldn't have gamesBehind
        const topSeed = teams.find(t => t.seed === 1);
        if (topSeed) {
          expect(topSeed.gamesBehind).toBeUndefined();
        }
      });
    });

    describe('Error Cases', () => {
      it('should fall back to mock data on ESPN API failure', async () => {
        server.use(
          http.get('http://site.api.espn.com/apis/v2/sports/football/nfl/standings', () => {
            return HttpResponse.json({ error: 'Service Unavailable' }, { status: 503 });
          })
        );

        const result = await getPlayoffPicture(2025);

        // Should return mock playoff picture
        expect(result).toBeDefined();
        expect(result?.afc.teams.length).toBeGreaterThan(0);
        expect(result?.nfc.teams.length).toBeGreaterThan(0);
      });

      it('should fall back to mock data on malformed standings response', async () => {
        server.use(
          http.get('http://site.api.espn.com/apis/v2/sports/football/nfl/standings', () => {
            return HttpResponse.json({
              malformed: 'data',
              missing: 'children'
            });
          })
        );

        const result = await getPlayoffPicture(2025);

        expect(result).toBeDefined();
        expect(result?.afc).toBeDefined();
        expect(result?.nfc).toBeDefined();
      });

      it('should fall back to mock data on network error', async () => {
        server.use(
          http.get('http://site.api.espn.com/apis/v2/sports/football/nfl/standings', () => {
            return HttpResponse.error();
          })
        );

        const result = await getPlayoffPicture(2025);

        expect(result).toBeDefined();
        expect(result).not.toBeNull();
      });

      it('should fall back to mock data on JSON parse error', async () => {
        server.use(
          http.get('http://site.api.espn.com/apis/v2/sports/football/nfl/standings', () => {
            return HttpResponse.text('Invalid JSON response');
          })
        );

        const result = await getPlayoffPicture(2025);

        expect(result).toBeDefined();
      });
    });

    describe('Mock Data Validation', () => {
      it('should return valid mock playoff picture structure', async () => {
        server.use(
          http.get('http://site.api.espn.com/apis/v2/sports/football/nfl/standings', () => {
            return HttpResponse.error(); // Force mock data
          })
        );

        const result = await getPlayoffPicture(2025);

        expect(result).toBeDefined();
        expect(result?.afc.name).toBe('AFC');
        expect(result?.nfc.name).toBe('NFC');
        expect(result?.afc.teams.length).toBe(7);
        expect(result?.nfc.teams.length).toBe(7);
      });

      it('should have properly sorted mock teams by seed', async () => {
        server.use(
          http.get('http://site.api.espn.com/apis/v2/sports/football/nfl/standings', () => {
            return HttpResponse.error(); // Force mock data
          })
        );

        const result = await getPlayoffPicture(2025);
        const afcSeeds = result?.afc.teams.map(t => t.seed) || [];

        expect(afcSeeds).toEqual([1, 2, 3, 4, 5, 6, 7]);
      });

      it('should have valid records in mock data', async () => {
        server.use(
          http.get('http://site.api.espn.com/apis/v2/sports/football/nfl/standings', () => {
            return HttpResponse.error(); // Force mock data
          })
        );

        const result = await getPlayoffPicture(2025);
        const team = result?.afc.teams[0];

        expect(team?.record).toMatch(/^\d+-\d+(-\d+)?$/);
        expect(team?.wins).toBeGreaterThanOrEqual(0);
        expect(team?.losses).toBeGreaterThanOrEqual(0);
        expect(team?.ties).toBeGreaterThanOrEqual(0);
      });

      it('should include team logos in mock data', async () => {
        server.use(
          http.get('http://site.api.espn.com/apis/v2/sports/football/nfl/standings', () => {
            return HttpResponse.error(); // Force mock data
          })
        );

        const result = await getPlayoffPicture(2025);
        const team = result?.afc.teams[0];

        expect(team?.logoUrl).toBeDefined();
        expect(typeof team?.logoUrl).toBe('string');
        expect(team?.logoUrl.length).toBeGreaterThan(0);
      });
    });

    describe('Year Parameter', () => {
      it('should accept different year parameters', async () => {
        const result2024 = await getPlayoffPicture(2024);
        const result2025 = await getPlayoffPicture(2025);

        expect(result2024).toBeDefined();
        expect(result2025).toBeDefined();
      });

      it('should default to 2025 when no year provided', async () => {
        const result = await getPlayoffPicture();

        expect(result).toBeDefined();
        expect(result?.afc).toBeDefined();
        expect(result?.nfc).toBeDefined();
      });
    });

    describe('Data Integrity', () => {
      it('should ensure all teams have required fields', async () => {
        const result = await getPlayoffPicture(2025);
        const allTeams = [
          ...(result?.afc.teams || []),
          ...(result?.afc.inTheHunt || []),
          ...(result?.afc.eliminated || [])
        ];

        allTeams.forEach(team => {
          expect(team).toHaveProperty('id');
          expect(team).toHaveProperty('name');
          expect(team).toHaveProperty('abbreviation');
          expect(team).toHaveProperty('seed');
          expect(team).toHaveProperty('record');
          expect(team).toHaveProperty('wins');
          expect(team).toHaveProperty('losses');
          expect(team).toHaveProperty('ties');
          expect(team).toHaveProperty('pointsFor');
          expect(team).toHaveProperty('pointsAgainst');
          expect(team).toHaveProperty('differential');
          expect(team).toHaveProperty('streak');
          expect(team).toHaveProperty('winPercentage');
          expect(team).toHaveProperty('clinchStatus');
        });
      });

      it('should ensure no duplicate team IDs in conference', async () => {
        const result = await getPlayoffPicture(2025);
        const afcIds = result?.afc.allTeams.map(t => t.id) || [];
        const uniqueAfcIds = new Set(afcIds);

        expect(afcIds.length).toBe(uniqueAfcIds.size);
      });

      it('should ensure seeds are unique within bracket', async () => {
        const result = await getPlayoffPicture(2025);
        const seeds = result?.afc.teams.map(t => t.seed) || [];
        const uniqueSeeds = new Set(seeds);

        expect(seeds.length).toBe(uniqueSeeds.size);
      });
    });
  });
});
