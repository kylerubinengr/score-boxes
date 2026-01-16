import { http, HttpResponse } from 'msw';
import { mockScoreboardResponse, mockStandingsResponse, mockGamePost } from './mockData';

export const handlers = [
  // ESPN Scoreboard API - Get games by week
  http.get('http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', ({ request }) => {
    const url = new URL(request.url);
    const week = url.searchParams.get('week');
    const seasontype = url.searchParams.get('seasontype');
    const year = url.searchParams.get('dates');

    // Return mock scoreboard data
    return HttpResponse.json(mockScoreboardResponse);
  }),

  // ESPN Summary API - Get single game details
  http.get('http://site.api.espn.com/apis/site/v2/sports/football/nfl/summary', ({ request }) => {
    const url = new URL(request.url);
    const eventId = url.searchParams.get('event');

    if (eventId === '401671810') {
      // Return detailed game with boxscore
      return HttpResponse.json({
        boxscore: {
          teams: [
            {
              team: { id: "12", abbreviation: "KC" },
              statistics: [
                { name: "passingYards", displayValue: "312" },
                { name: "rushingYards", displayValue: "98" },
                { name: "turnovers", displayValue: "1" }
              ]
            },
            {
              team: { id: "25", abbreviation: "SF" },
              statistics: [
                { name: "passingYards", displayValue: "285" },
                { name: "rushingYards", displayValue: "105" },
                { name: "turnovers", displayValue: "2" }
              ]
            }
          ]
        },
        scoringPlays: mockGamePost.scoringPlays || [],
        drives: {
          previous: []
        },
        leaders: [
          {
            name: "passingLeader",
            displayName: "Passing Leader",
            leaders: [
              {
                athlete: {
                  id: "3139477",
                  displayName: "Patrick Mahomes",
                  team: { id: "12", abbreviation: "KC" }
                },
                displayValue: "312 YDS, 3 TD"
              }
            ]
          }
        ]
      });
    }

    return HttpResponse.json({ error: 'Game not found' }, { status: 404 });
  }),

  // ESPN Standings API - Get playoff picture
  http.get('http://site.api.espn.com/apis/v2/sports/football/nfl/standings', ({ request }) => {
    const url = new URL(request.url);
    const season = url.searchParams.get('season');

    return HttpResponse.json(mockStandingsResponse);
  }),

  // ESPN Team Schedule API - Get games by team
  http.get('http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/:year/types/:seasonType/teams/:teamId/events', ({ params }) => {
    const { teamId } = params;

    return HttpResponse.json({
      items: [
        {
          $ref: `http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401671808`
        },
        {
          $ref: `http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401671810`
        }
      ]
    });
  }),

  // Individual event lookup (for team schedule refs)
  http.get('http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/:eventId', ({ params }) => {
    const { eventId } = params;

    if (eventId === '401671808' || eventId === '401671810') {
      return HttpResponse.json({
        id: eventId,
        week: { number: 17 },
        season: { year: 2025, type: 2 },
        competitions: [{
          id: eventId,
          competitors: [
            { id: "12", homeAway: "home", score: "28", winner: eventId === '401671810' },
            { id: "25", homeAway: "away", score: "21", winner: false }
          ]
        }]
      });
    }

    return HttpResponse.json({ error: 'Event not found' }, { status: 404 });
  }),

  // Error simulation handlers
  http.get('http://site.api.espn.com/error/404', () => {
    return HttpResponse.json({ error: 'Not Found' }, { status: 404 });
  }),

  http.get('http://site.api.espn.com/error/500', () => {
    return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }),

  http.get('http://site.api.espn.com/error/malformed', () => {
    return HttpResponse.text('This is not JSON');
  }),
];
