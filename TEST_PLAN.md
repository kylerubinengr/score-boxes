# NFL Dashboard Test Plan

## Executive Summary

**Current Coverage**: ~6.6% (470 lines of tests / 7,115 lines of source code)
**Target Coverage**: 70% (4,981 lines of tests needed)
**Additional Lines Required**: ~4,511 lines

## Current Test Coverage Analysis

### Existing Tests (470 lines total)
1. `useAdaptivePolling.test.tsx` - Adaptive polling hook tests
2. `polling-config.test.ts` - Polling configuration tests
3. `ScoringSummary.test.tsx` - Scoring summary component tests

### Coverage Gaps Identified

#### Services (0% coverage) - 5 files
- `gameService.ts` (508 lines) - Core ESPN API integration
- `playoffService.ts` (181 lines) - Playoff standings API
- `matchupService.ts` (190 lines) - Advanced stats and matchup comparison
- `playoffBracketService.ts` (346 lines) - Playoff bracket logic
- `sumer-sports-service.ts` (120 lines) - SumerSports HTML scraping

#### Context Providers (0% coverage) - 3 files
- `GameTabsContext.tsx` (112 lines) - Multi-tab state management
- `SeasonContext.tsx` (77 lines) - Season/view mode persistence
- `ThemeContext.tsx` (58 lines) - Dark mode toggle

#### Components (minimal coverage) - Priority targets
- `ConferenceStandingsTable.tsx` (196 lines) - Sortable standings table
- `PlayoffsTab.tsx` (283 lines) - Playoff picture view
- `LiveGameView.tsx` (137 lines) - Live game updates (uses polling hook)

---

## Test Plan by Module

### 1. Service Layer Tests

#### 1.1 gameService.ts (Priority: CRITICAL)

**Functions to Test**:
- `getGamesByWeek(week, seasonType, year)`
- `getGameById(gameId, year)`
- `getGamesByTeam(teamId, year)`

**Test Scenarios**:

**getGamesByWeek**:
- ✅ Success: Fetch regular season games (week 17, seasonType 2)
- ✅ Success: Fetch playoff games (week 1, seasonType 3)
- ✅ Success: Parse game data correctly (teams, scores, venue, weather)
- ✅ Success: Handle indoor/outdoor venue detection
- ✅ Success: Parse stat leaders (passing, rushing, receiving)
- ✅ Success: Parse scoring plays with correct team attribution
- ✅ Success: Parse linescores (quarter-by-quarter scoring)
- ✅ Success: Parse drives with play-by-play data
- ✅ Success: Determine game status (pre/in/post)
- ✅ Edge Case: Missing stat leaders
- ✅ Edge Case: Empty scoring plays array
- ✅ Edge Case: Games with ties in record
- ❌ Error: ESPN API returns 404
- ❌ Error: ESPN API returns invalid JSON
- ❌ Error: Missing required fields in response

**getGameById**:
- ✅ Success: Fetch single game with full details
- ✅ Success: Parse boxscore statistics (passing yards, turnovers, etc.)
- ✅ Success: Parse scoring plays for game detail view
- ✅ Success: Parse drive-by-drive data
- ✅ Edge Case: Game not found
- ❌ Error: Network timeout
- ❌ Error: Malformed game ID

**getGamesByTeam**:
- ✅ Success: Fetch all games for a specific team (regular season)
- ✅ Success: Fetch playoff games for team
- ✅ Success: Return games in chronological order
- ✅ Edge Case: Team with no games
- ❌ Error: Invalid team ID

**Mock Requirements**:
- MSW handlers for ESPN API endpoints:
  - `/apis/site/v2/sports/football/nfl/scoreboard`
  - `/apis/site/v2/sports/football/nfl/summary`
  - `/apis/site/v2/sports/football/nfl/teams/{teamId}/schedule`
- Mock game data with complete structure (teams, venue, weather, stats)
- Mock error responses (404, 500, malformed JSON)

**Expected Coverage**: ~400 lines of tests

---

#### 1.2 playoffService.ts (Priority: HIGH)

**Functions to Test**:
- `getPlayoffPicture(year)`
- `getMockPlayoffPicture()` (internal)
- `parseRecord(record)` (internal helper)

**Test Scenarios**:

**getPlayoffPicture**:
- ✅ Success: Fetch live playoff standings from ESPN
- ✅ Success: Parse AFC teams correctly (seeds 1-7)
- ✅ Success: Parse NFC teams correctly (seeds 1-7)
- ✅ Success: Categorize teams (bracket, inTheHunt, eliminated)
- ✅ Success: Parse clinch status (* = homefield, z = division, x = playoff, e = eliminated)
- ✅ Success: Calculate win percentage from stats
- ✅ Success: Parse additional stats (points for/against, differential, streak)
- ✅ Success: Handle games behind calculation
- ✅ Edge Case: Incomplete standings data (< 7 teams per conference)
- ✅ Edge Case: Missing clinch indicators
- ❌ Error: ESPN API failure → fallback to mock data
- ❌ Error: Malformed standings response

**getMockPlayoffPicture**:
- ✅ Success: Return valid playoff structure
- ✅ Success: Mock data has 7 teams per conference
- ✅ Success: Teams properly sorted by seed

**parseRecord** (internal helper):
- ✅ Success: Parse "12-3" → {wins: 12, losses: 3, ties: 0}
- ✅ Success: Parse "9-5-1" → {wins: 9, losses: 5, ties: 1}
- ✅ Success: Calculate correct win percentage
- ✅ Edge Case: Handle ties in percentage calculation (0.5 weight)

**Mock Requirements**:
- MSW handler for ESPN standings API
- Mock standings data with full stats array
- Mock clinch status variations

**Expected Coverage**: ~150 lines of tests

---

#### 1.3 matchupService.ts (Priority: MEDIUM)

**Functions to Test**:
- `getMatchupComparison(homeId, awayId)`
- `getAdvancedStats()` (internal)
- `getESPNStandings()` (internal)
- `calculateRanks(data, ascending)` (internal helper)

**Test Scenarios**:

**getMatchupComparison**:
- ✅ Success: Fetch and combine ESPN + advanced stats
- ✅ Success: Map team IDs to abbreviations correctly
- ✅ Success: Return complete AdvancedTeamStats structure
- ✅ Edge Case: Team not found in advanced stats → fallback to "N/A"
- ✅ Edge Case: Team not found in ESPN standings → use defaults
- ❌ Error: Both APIs fail → return null values

**getAdvancedStats**:
- ✅ Success: Read team_stats.json from filesystem
- ✅ Success: Calculate EPA ranks (offensive: higher better, defensive: lower better)
- ✅ Success: Calculate success rate ranks
- ✅ Success: Format values correctly (toFixed(3) for EPA, percentage for success)
- ❌ Error: File not found → return empty object
- ❌ Error: Invalid JSON → return empty object

**getESPNStandings**:
- ✅ Success: Fetch standings and extract stats
- ✅ Success: Calculate ranks for points for/against/differential
- ✅ Success: Parse record with ties
- ❌ Error: API failure → return empty object

**calculateRanks**:
- ✅ Success: Rank descending (higher values = rank 1)
- ✅ Success: Rank ascending (lower values = rank 1)
- ✅ Edge Case: Tied values → first entry wins

**Mock Requirements**:
- MSW handler for ESPN standings API
- Mock `team_stats.json` file contents
- Mock fs.readFile for filesystem tests

**Expected Coverage**: ~130 lines of tests

---

#### 1.4 playoffBracketService.ts (Priority: MEDIUM)

**Functions to Test**:
- `getPlayoffGames(year, conference?)`
- `buildBracketStructure(playoffGames, seeds)`
- `buildWildCardRound()`, `buildDivisionalRound()`, `buildChampionshipRound()` (internal)
- `getDivisionalMatchups()` (internal)
- `findSeed()`, `mapGameStatus()` (internal helpers)

**Test Scenarios**:

**getPlayoffGames**:
- ✅ Success: Fetch playoff weeks 1, 2, 3, 5 (Wild Card, Divisional, Championship, Super Bowl)
- ✅ Success: Filter by conference (exclude Super Bowl from conference brackets)
- ✅ Success: Return all playoff games if no conference filter
- ✅ Edge Case: No playoff games available yet (return empty array)
- ❌ Error: ESPN API failure for specific week

**buildBracketStructure**:
- ✅ Success: Build complete bracket with 4 Wild Card slots
- ✅ Success: Build 2 Divisional slots
- ✅ Success: Build 1 Championship slot
- ✅ Success: Populate bye week card for #1 seed
- ✅ Success: Match actual games to expected seeds (2v7, 3v6, 4v5)
- ✅ Edge Case: TBD games when matchups not scheduled
- ✅ Edge Case: Incomplete Wild Card results → Divisional shows TBD

**buildWildCardRound**:
- ✅ Success: Always return exactly 4 cards
- ✅ Success: First card is #1 seed bye week
- ✅ Success: Cards 2-4 are games (or TBD with expected seeds)

**buildDivisionalRound**:
- ✅ Success: Always return exactly 2 cards
- ✅ Success: Determine matchups after Wild Card complete (re-seeding logic)
- ✅ Success: #1 plays lowest remaining seed
- ✅ Edge Case: Wild Card incomplete → show 2 TBD cards

**getDivisionalMatchups**:
- ✅ Success: Re-seed correctly (#1 vs lowest, highest remaining vs next)
- ✅ Success: Sort winners by seed before matching
- ✅ Edge Case: Not all Wild Card games complete → return empty array

**Mock Requirements**:
- Mock playoff games (weeks 1, 2, 3, 5)
- Mock PlayoffTeam seeds (1-7)
- Mock team data with conference affiliations

**Expected Coverage**: ~200 lines of tests

---

### 2. Context Provider Tests

#### 2.1 SeasonContext.tsx (Priority: HIGH)

**Test Scenarios**:
- ✅ Success: Provider renders children
- ✅ Success: Default season is 2025
- ✅ Success: Default view mode is WEEK
- ✅ Success: Load season from localStorage on mount
- ✅ Success: Load view mode from localStorage on mount
- ✅ Success: `setSelectedSeason` updates state and localStorage
- ✅ Success: `setViewMode` updates state and localStorage
- ✅ Success: `setViewMode` skips update if value unchanged (optimization)
- ✅ Edge Case: Invalid localStorage season (< 2020 or > 2025) → use default
- ✅ Edge Case: Invalid JSON in localStorage view → use default
- ❌ Error: useSeason called outside provider → throw error

**Mock Requirements**:
- Mock localStorage (getItem, setItem)
- React Testing Library for context testing

**Expected Coverage**: ~80 lines of tests

---

#### 2.2 GameTabsContext.tsx (Priority: HIGH)

**Test Scenarios**:
- ✅ Success: Provider renders children
- ✅ Success: Default tabs array is empty
- ✅ Success: Load tabs from localStorage on mount
- ✅ Success: `addTab` adds new tab to array
- ✅ Success: `addTab` updates localStorage
- ✅ Success: `removeTab` removes tab by ID
- ✅ Success: `setActiveTab` updates active tab
- ✅ Success: `clearTabs` removes all tabs
- ✅ Edge Case: Enforce 8 tab limit (reject if ≥ 8 tabs)
- ✅ Edge Case: Prevent duplicate tabs (same game ID)
- ✅ Edge Case: Invalid localStorage data → use default
- ❌ Error: useGameTabs called outside provider → throw error

**Mock Requirements**:
- Mock localStorage
- Mock tab data structures

**Expected Coverage**: ~100 lines of tests

---

#### 2.3 ThemeContext.tsx (Priority: MEDIUM)

**Test Scenarios**:
- ✅ Success: Provider renders children
- ✅ Success: Default theme is "light"
- ✅ Success: Load theme from localStorage on mount
- ✅ Success: Respect system preference if no localStorage value
- ✅ Success: `toggleTheme` switches light → dark
- ✅ Success: `toggleTheme` switches dark → light
- ✅ Success: `toggleTheme` updates localStorage
- ✅ Success: `toggleTheme` adds/removes "dark" class on document.documentElement
- ✅ Edge Case: Invalid theme in localStorage → use system preference
- ❌ Error: useTheme called outside provider → throw error

**Mock Requirements**:
- Mock localStorage
- Mock window.matchMedia for system preference
- Mock document.documentElement.classList

**Expected Coverage**: ~70 lines of tests

---

### 3. Component Tests

#### 3.1 ConferenceStandingsTable.tsx (Priority: HIGH)

**Test Scenarios**:
- ✅ Success: Render table with conference name
- ✅ Success: Render all team rows
- ✅ Success: Display team logos, names, records
- ✅ Success: Display seed numbers
- ✅ Success: Display clinch badges (* Z X E)
- ✅ Success: Render sortable column headers
- ✅ Success: Clicking column header triggers onSort callback
- ✅ Success: Display sort indicator (↑ or ↓) based on sortConfig
- ✅ Success: Render tiebreaker tooltips when present
- ✅ Success: Display magic numbers when present
- ✅ Edge Case: Handle missing optional fields (gamesBehind, scenarios)
- ✅ Accessibility: Column headers have aria-sort attributes
- ✅ Accessibility: Info icons have aria-label

**Mock Requirements**:
- Mock PlayoffTeam array with various clinch statuses
- Mock sortConfig and onSort callback

**Expected Coverage**: ~100 lines of tests

---

#### 3.2 PlayoffsTab.tsx (Priority: HIGH)

**Test Scenarios**:
- ✅ Success: Render loading spinner while fetching data
- ✅ Success: Render both conference tables after data loads
- ✅ Success: Pass sorted teams to ConferenceStandingsTable
- ✅ Success: Sort teams by seed (default)
- ✅ Success: Sort teams by wins, losses, points, etc.
- ✅ Success: Toggle sort direction (asc ↔ desc)
- ✅ Success: Render legend footer
- ✅ Edge Case: No playoff data → show error message
- ❌ Error: API failure → show error message

**Mock Requirements**:
- Mock getPlayoffPicture service
- Mock SeasonContext
- Mock PlayoffPicture data structure

**Expected Coverage**: ~120 lines of tests

---

## Test Infrastructure Setup

### Jest Configuration Updates

**File**: `jest.config.js` or `package.json`

```javascript
{
  "jest": {
    "collectCoverage": true,
    "collectCoverageFrom": [
      "services/**/*.{ts,tsx}",
      "context/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "hooks/**/*.{ts,tsx}",
      "!**/*.d.ts",
      "!**/node_modules/**",
      "!**/__tests__/**"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

### MSW Setup

**Create**: `__tests__/mocks/handlers.ts`

Mock all ESPN API endpoints:
- Scoreboard API
- Summary API
- Standings API
- Team Schedule API

**Create**: `__tests__/mocks/mockData.ts`

Centralized mock data for:
- Games (pre/in/post status)
- Teams
- Playoff standings
- Advanced stats

---

## Implementation Strategy

### Phase 1: Service Layer (Days 1-3)
1. Set up MSW handlers for ESPN APIs
2. Create mock data fixtures
3. Write gameService tests (400 lines)
4. Write playoffService tests (150 lines)
5. Write matchupService tests (130 lines)
6. Write playoffBracketService tests (200 lines)

**Estimated Lines**: 880 lines
**Estimated Time**: 12-16 hours

### Phase 2: Context Providers (Day 4)
1. Set up localStorage mocks
2. Write SeasonContext tests (80 lines)
3. Write GameTabsContext tests (100 lines)
4. Write ThemeContext tests (70 lines)

**Estimated Lines**: 250 lines
**Estimated Time**: 4-6 hours

### Phase 3: Components (Day 5)
1. Write ConferenceStandingsTable tests (100 lines)
2. Write PlayoffsTab tests (120 lines)

**Estimated Lines**: 220 lines
**Estimated Time**: 4-6 hours

### Phase 4: Coverage & CI (Day 6)
1. Configure Jest coverage thresholds
2. Run coverage report
3. Fill any remaining gaps
4. Set up CI coverage reporting

**Estimated Time**: 2-4 hours

---

## Success Criteria

✅ **Coverage**: 70% line coverage across all source files
✅ **Service Layer**: All public functions have success + error tests
✅ **Context Providers**: All state mutations and localStorage interactions tested
✅ **Components**: Critical UI components render correctly and handle user interactions
✅ **CI Integration**: Coverage report runs on every PR
✅ **No Regressions**: All existing tests continue to pass

---

## Risk Mitigation

**Risk**: ESPN API changes could break tests
**Mitigation**: Use MSW to mock all external API calls, making tests resilient to API changes

**Risk**: LocalStorage not available in test environment
**Mitigation**: Mock localStorage in all context provider tests

**Risk**: React 19 compatibility issues with testing library
**Mitigation**: Already using `@testing-library/react@16.3.1` (React 19 compatible)

**Risk**: File system operations fail in test environment
**Mitigation**: Mock `fs` module for matchupService tests

---

## Coverage Calculation

**Current State**:
- Test lines: 470
- Source lines: 7,115
- Coverage: 6.6%

**Target State** (70% coverage):
- Test lines needed: ~4,981
- Additional tests: ~4,511 lines

**Projected Test Distribution**:
- Service Layer: ~880 lines (Phase 1)
- Context Providers: ~250 lines (Phase 2)
- Components: ~220 lines (Phase 3)
- Infrastructure: ~100 lines (MSW handlers, mocks)
- Additional coverage: ~3,061 lines (utilities, helpers, edge cases)

**Total New Tests**: ~4,511 lines

This test plan provides comprehensive coverage of all critical paths while ensuring production-readiness of the NFL Dashboard application.
