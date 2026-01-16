import { http, HttpResponse } from 'msw';
import { mockScoreboardResponse, mockStandingsResponse, mockGamePost } from './mockData';

export const handlers = [
  // ESPN Scoreboard API - Get games by week
  http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', ({ request }) => {
    const url = new URL(request.url);
    const week = url.searchParams.get('week');
    const seasontype = url.searchParams.get('seasontype');
    const year = url.searchParams.get('dates');

    // Return mock scoreboard data
    return HttpResponse.json(mockScoreboardResponse);
  }),

  // ESPN Summary API - Get single game details
  http.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary', ({ request }) => {
    const url = new URL(request.url);
    const eventId = url.searchParams.get('event');

    if (eventId === '401671810') {
      // Return detailed game with boxscore
      return HttpResponse.json({
        header: {
          id: "401671810",
          season: { year: 2025, type: 2 },
          week: 17,
          date: "2025-01-18T18:00Z",
          competitions: [{
             id: "401671810",
             date: "2025-01-18T18:00Z",
             status: {
                type: {
                   name: "STATUS_FINAL",
                   state: "post",
                   completed: true,
                   detail: "Final"
                },
                period: 4,
                displayClock: "0:00"
             },
             competitors: [
               { id: "12", homeAway: "home", team: { id: "12", abbreviation: "KC", displayName: "Kansas City Chiefs" }, score: "28", winner: true, records: [{ summary: "14-1" }] },
               { id: "25", homeAway: "away", team: { id: "25", abbreviation: "SF", displayName: "San Francisco 49ers" }, score: "21", winner: false, records: [{ summary: "11-4" }] }
             ],
             broadcasts: [{ names: ["CBS"] }]
          }]
        },
        gameInfo: {
          venue: {
             fullName: "Arrowhead Stadium",
             address: { city: "Kansas City", state: "MO" },
             indoor: false,
             coordinates: { latitude: 39.0489, longitude: -94.4839 }
          }
        },
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
          ],
          players: [
            {
              team: { id: "12", abbreviation: "KC" },
              statistics: [
                 {
                    name: "passing",
                    athletes: [
                        { athlete: { displayName: "Patrick Mahomes" }, stats: ["25/35", "312", "8.9", "3", "1", "2", "85.4", "115.2"] }
                    ]
                 },
                 {
                    name: "rushing",
                    athletes: [
                        { athlete: { displayName: "Isiah Pacheco" }, stats: ["15", "98", "6.5", "1", "12"] }
                    ]
                 },
                 {
                    name: "receiving",
                    athletes: [
                        { athlete: { displayName: "Travis Kelce" }, stats: ["8", "115", "14.4", "0", "25", "10"] }
                    ]
                 }
              ]
            },
            {
              team: { id: "25", abbreviation: "SF" },
              statistics: [
                 {
                    name: "passing",
                    athletes: [
                        { athlete: { displayName: "Brock Purdy" }, stats: ["20/30", "285", "9.5", "2", "2", "3", "75.0", "98.5"] }
                    ]
                 },
                 {
                    name: "rushing",
                    athletes: [
                        { athlete: { displayName: "Christian McCaffrey" }, stats: ["18", "105", "5.8", "1", "15"] }
                    ]
                 },
                 {
                    name: "receiving",
                    athletes: [
                        { athlete: { displayName: "Deebo Samuel" }, stats: ["6", "92", "15.3", "0", "22", "8"] }
                    ]
                 }
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
            team: { id: "12", abbreviation: "KC" },
            leaders: [
              {
                name: "passingYards",
                displayName: "Passing Leader",
                leaders: [{ athlete: { displayName: "Patrick Mahomes", headshot: { href: "" } }, displayValue: "312 YDS, 3 TD" }]
              },
              {
                name: "rushingYards",
                displayName: "Rushing Leader",
                leaders: [{ athlete: { displayName: "Isiah Pacheco", headshot: { href: "" } }, displayValue: "98 YDS, 1 TD" }]
              },
              {
                name: "receivingYards",
                displayName: "Receiving Leader",
                leaders: [{ athlete: { displayName: "Travis Kelce", headshot: { href: "" } }, displayValue: "115 YDS" }]
              }
            ]
          },
          {
            team: { id: "25", abbreviation: "SF" },
            leaders: [
              {
                name: "passingYards",
                displayName: "Passing Leader",
                leaders: [{ athlete: { displayName: "Brock Purdy", headshot: { href: "" } }, displayValue: "285 YDS, 2 TD" }]
              },
              {
                name: "rushingYards",
                displayName: "Rushing Leader",
                leaders: [{ athlete: { displayName: "Christian McCaffrey", headshot: { href: "" } }, displayValue: "105 YDS, 1 TD" }]
              },
              {
                name: "receivingYards",
                displayName: "Receiving Leader",
                leaders: [{ athlete: { displayName: "Deebo Samuel", headshot: { href: "" } }, displayValue: "92 YDS" }]
              }
            ]
          }
        ]
      });
    }

    return HttpResponse.json({ error: 'Game not found' }, { status: 404 });
  }),

  // ESPN Standings API - Get playoff picture
  http.get('https://site.api.espn.com/apis/v2/sports/football/nfl/standings', ({ request }) => {
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
