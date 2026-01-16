import { getGamesByWeek, getGameById } from '@/services/gameService';
import { mockScoreboardResponse, mockGamePre, mockGameLive, mockGamePost } from '@/mocks/mockData';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

describe('gameService', () => {
  describe('getGamesByWeek', () => {
    describe('Success Cases', () => {
      it('should fetch regular season games for week 17', async () => {
        const result = await getGamesByWeek(17, 2, 2025);

        expect(result).toBeDefined();
        expect(result.games).toBeInstanceOf(Array);
        expect(result.games.length).toBeGreaterThan(0);
        expect(result.isSnapshot).toBe(false);
      });

      it('should fetch playoff games (seasonType 3)', async () => {
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', () => {
            return HttpResponse.json({
              ...mockScoreboardResponse,
              season: { year: 2025, type: 3 },
              week: { number: 1 }
            });
          })
        );

        const result = await getGamesByWeek(1, 3, 2025);

        expect(result.games).toBeDefined();
        expect(result.games[0].seasonType).toBe(3);
      });

      it('should parse game data correctly (teams, scores, venue, weather)', async () => {
        const result = await getGamesByWeek(17, 2, 2025);
        const game = result.games[0];

        // Verify game structure
        expect(game).toHaveProperty('id');
        expect(game).toHaveProperty('week');
        expect(game).toHaveProperty('season');
        expect(game).toHaveProperty('homeTeam');
        expect(game).toHaveProperty('awayTeam');
        expect(game).toHaveProperty('venue');
        expect(game).toHaveProperty('venueLocation');
        expect(game).toHaveProperty('broadcast');
        expect(game).toHaveProperty('weather');
        expect(game).toHaveProperty('status');

        // Verify team structure
        expect(game.homeTeam).toHaveProperty('id');
        expect(game.homeTeam).toHaveProperty('name');
        expect(game.homeTeam).toHaveProperty('abbreviation');
        expect(game.homeTeam).toHaveProperty('record');
        expect(game.homeTeam).toHaveProperty('logoUrl');
      });

      it('should handle indoor/outdoor venue detection', async () => {
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', () => {
            return HttpResponse.json({
              ...mockScoreboardResponse,
              events: [
                {
                  ...mockScoreboardResponse.events[0],
                  competitions: [{
                    ...mockScoreboardResponse.events[0].competitions[0],
                    venue: {
                      ...mockScoreboardResponse.events[0].competitions[0].venue,
                      indoor: true
                    }
                  }]
                }
              ]
            });
          })
        );

        const result = await getGamesByWeek(17, 2, 2025);

        expect(result.games[0].indoor).toBe(true);
      });

      it('should determine game status (pre/in/post)', async () => {
        // Test pre-game status
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', () => {
            return HttpResponse.json({
              ...mockScoreboardResponse,
              events: [{
                ...mockScoreboardResponse.events[0],
                competitions: [{
                  ...mockScoreboardResponse.events[0].competitions[0],
                  status: {
                    type: { state: 'pre' }
                  }
                }]
              }]
            });
          })
        );

        const prResult = await getGamesByWeek(17, 2, 2025);
        expect(prResult.games[0].status).toBe('pre');

        // Test live game status
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', () => {
            return HttpResponse.json({
              ...mockScoreboardResponse,
              events: [{
                ...mockScoreboardResponse.events[0],
                competitions: [{
                  ...mockScoreboardResponse.events[0].competitions[0],
                  status: {
                    type: { state: 'in' },
                    period: 2,
                    displayClock: '7:42'
                  }
                }]
              }]
            });
          })
        );

        const liveResult = await getGamesByWeek(17, 2, 2025);
        expect(liveResult.games[0].status).toBe('in');
        expect(liveResult.games[0].isLive).toBe(true);
        expect(liveResult.games[0].period).toBe(2);
        expect(liveResult.games[0].displayClock).toBe('7:42');

        // Test post-game status
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', () => {
            return HttpResponse.json({
              ...mockScoreboardResponse,
              events: [{
                ...mockScoreboardResponse.events[0],
                competitions: [{
                  ...mockScoreboardResponse.events[0].competitions[0],
                  status: {
                    type: { state: 'post' }
                  },
                  competitors: [
                    { ...mockScoreboardResponse.events[0].competitions[0].competitors[0], score: "28", winner: true },
                    { ...mockScoreboardResponse.events[0].competitions[0].competitors[1], score: "21", winner: false }
                  ]
                }]
              }]
            });
          })
        );

        const postResult = await getGamesByWeek(17, 2, 2025);
        expect(postResult.games[0].status).toBe('post');
        expect(postResult.games[0].homeScore).toBe(28);
        expect(postResult.games[0].awayScore).toBe(21);
      });

      it('should parse broadcast information correctly', async () => {
        const result = await getGamesByWeek(17, 2, 2025);

        expect(result.games[0].broadcast).toBeDefined();
        expect(typeof result.games[0].broadcast).toBe('string');
      });

      it('should handle games with ties in record', async () => {
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', () => {
            return HttpResponse.json({
              ...mockScoreboardResponse,
              events: [{
                ...mockScoreboardResponse.events[0],
                competitions: [{
                  ...mockScoreboardResponse.events[0].competitions[0],
                  competitors: [
                    {
                      ...mockScoreboardResponse.events[0].competitions[0].competitors[0],
                      records: [{ name: "overall", summary: "9-5-1" }]
                    },
                    mockScoreboardResponse.events[0].competitions[0].competitors[1]
                  ]
                }]
              }]
            });
          })
        );

        const result = await getGamesByWeek(17, 2, 2025);

        expect(result.games[0].homeTeam.record).toBe("9-5-1");
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty games array', async () => {
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', () => {
            return HttpResponse.json({
              ...mockScoreboardResponse,
              events: []
            });
          })
        );

        const result = await getGamesByWeek(17, 2, 2025);

        expect(result.games).toEqual([]);
        expect(result.games.length).toBe(0);
      });

      it('should handle missing weather data', async () => {
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', () => {
            return HttpResponse.json({
              ...mockScoreboardResponse,
              events: [{
                ...mockScoreboardResponse.events[0],
                competitions: [{
                  ...mockScoreboardResponse.events[0].competitions[0],
                  weather: undefined
                }]
              }]
            });
          })
        );

        const result = await getGamesByWeek(17, 2, 2025);

        expect(result.games[0].weather).toBeDefined();
        expect(result.games[0].weather.temperature).toBe(0);
        expect(result.games[0].weather.condition).toBe("N/A");
      });

      it('should handle missing broadcast data', async () => {
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', () => {
            return HttpResponse.json({
              ...mockScoreboardResponse,
              events: [{
                ...mockScoreboardResponse.events[0],
                competitions: [{
                  ...mockScoreboardResponse.events[0].competitions[0],
                  broadcasts: []
                }]
              }]
            });
          })
        );

        const result = await getGamesByWeek(17, 2, 2025);

        expect(result.games[0].broadcast).toBe("TBD");
      });

      it('should handle missing team colors', async () => {
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', () => {
            return HttpResponse.json({
              ...mockScoreboardResponse,
              events: [{
                ...mockScoreboardResponse.events[0],
                competitions: [{
                  ...mockScoreboardResponse.events[0].competitions[0],
                  competitors: [
                    {
                      ...mockScoreboardResponse.events[0].competitions[0].competitors[0],
                      team: {
                        ...mockScoreboardResponse.events[0].competitions[0].competitors[0].team,
                        color: undefined,
                        alternateColor: undefined
                      }
                    },
                    mockScoreboardResponse.events[0].competitions[0].competitors[1]
                  ]
                }]
              }]
            });
          })
        );

        const result = await getGamesByWeek(17, 2, 2025);

        // Should still parse without colors
        expect(result.games[0].homeTeam).toBeDefined();
        expect(result.games[0].homeTeam.name).toBeDefined();
      });
    });

    describe('Error Cases', () => {
      it('should handle ESPN API 404 error', async () => {
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', () => {
            return HttpResponse.json({ error: 'Not Found' }, { status: 404 });
          })
        );

        const result = await getGamesByWeek(17, 2, 2025);

        // Should return empty games array or handle gracefully
        expect(result.games).toEqual([]);
      });

      it('should handle ESPN API 500 error', async () => {
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', () => {
            return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
          })
        );

        const result = await getGamesByWeek(17, 2, 2025);

        expect(result.games).toEqual([]);
      });

      it('should handle malformed JSON response', async () => {
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', () => {
            return HttpResponse.text('This is not JSON');
          })
        );

        const result = await getGamesByWeek(17, 2, 2025);

        expect(result.games).toEqual([]);
      });

      it('should handle network timeout', async () => {
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', () => {
            return HttpResponse.error();
          })
        );

        const result = await getGamesByWeek(17, 2, 2025);

        expect(result.games).toEqual([]);
      });
    });
  });

  describe('getGameById', () => {
    describe('Success Cases', () => {
      it('should fetch single game with full details', async () => {
        const result = await getGameById('401671810', 2025);

        expect(result).toBeDefined();
        expect(result?.id).toBe('401671810');
        expect(result?.homeTeam).toBeDefined();
        expect(result?.awayTeam).toBeDefined();
      });

      it('should parse boxscore statistics', async () => {
        const result = await getGameById('401671810', 2025);

        expect(result?.boxscore).toBeDefined();
        expect(result?.boxscore?.home).toHaveProperty('passingYards');
        expect(result?.boxscore?.home).toHaveProperty('rushingYards');
        expect(result?.boxscore?.home).toHaveProperty('turnovers');
        expect(result?.boxscore?.away).toHaveProperty('passingYards');
        expect(result?.boxscore?.away).toHaveProperty('rushingYards');
        expect(result?.boxscore?.away).toHaveProperty('turnovers');
      });

      it('should parse scoring plays for game detail view', async () => {
        const result = await getGameById('401671810', 2025);

        expect(result?.scoringPlays).toBeDefined();
        expect(Array.isArray(result?.scoringPlays)).toBe(true);
      });

      it('should include stat leaders (passing, rushing, receiving)', async () => {
        const result = await getGameById('401671810', 2025);

        expect(result?.matchupStats).toBeDefined();
        expect(result?.matchupStats?.home.passingLeader).toBeDefined();
        expect(result?.matchupStats?.home.passingLeader?.name).toBe("Patrick Mahomes");
      });
    });

    describe('Edge Cases', () => {
      it('should return null for game not found', async () => {
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary', () => {
            return HttpResponse.json({ error: 'Game not found' }, { status: 404 });
          })
        );

        const result = await getGameById('999999', 2025);

        expect(result).toBeNull();
      });

      it('should handle missing boxscore data', async () => {
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary', () => {
            return HttpResponse.json({
              boxscore: undefined,
              scoringPlays: [],
              drives: { previous: [] },
              leaders: []
            });
          })
        );

        const result = await getGameById('401671808', 2025);

        // Should still return game object
        expect(result).toBeDefined();
      });

      it('should handle missing stat leaders', async () => {
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary', () => {
            return HttpResponse.json({
              boxscore: {},
              scoringPlays: [],
              drives: { previous: [] },
              leaders: []
            });
          })
        );

        const result = await getGameById('401671808', 2025);

        expect(result).toBeDefined();
      });
    });

    describe('Error Cases', () => {
      it('should return null on network error', async () => {
        server.use(
          http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary', () => {
            return HttpResponse.error();
          })
        );

        const result = await getGameById('401671810', 2025);

        expect(result).toBeNull();
      });

      it('should handle malformed game ID', async () => {
        const result = await getGameById('invalid-id', 2025);

        // Should either return null or handle gracefully
        expect(result === null || result === undefined).toBe(true);
      });
    });
  });
});
