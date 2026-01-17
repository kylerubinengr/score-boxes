# Score Boxes Testing Strategy

## Overview
This document outlines the testing architecture and strategy for the Score Boxes application. The goal is to ensure reliability, maintainability, and confidence in the codebase as we scale.

## Infrastructure
- **Test Runner:** Jest (via `next/jest`)
- **Component Testing:** React Testing Library (RTL)
- **API Mocking:** Mock Service Worker (MSW)
- **Factories:** Factory Pattern for generating test data (see `mocks/factories`)

## Testing Pyramid Strategy

### 1. Unit Tests (High Volume)
**Focus:** Individual components, utility functions, and hooks.
- **Where:** `__tests__/components`, `__tests__/lib`
- **What to test:**
  - **Logic-heavy components:** (e.g., `BracketView`, `OddsTable`) Verify conditional rendering, data formatting, and user interactions.
  - **Utilities:** (e.g., `nflDates.ts`, `playoffService.ts`) Verify pure function outputs, edge cases (OT, ties), and data transformation.
  - **Playoff Logic:** Seeding, clinching scenarios, and tiebreakers must be rigorously tested with various mock data inputs.

### 2. Integration Tests (Medium Volume)
**Focus:** Page-level interactions and data flow.
- **Where:** `__tests__/pages` or `__tests__/integration`
- **What to test:**
  - **Dashboard Views:** Verify that the `WeekSelector`, `GameCard`, and `Scoreboard` work together.
  - **Data Fetching:** Use MSW to simulate API responses (success, error, loading) and verify the UI reacts correctly (e.g., showing `LoadingSpinner` or error messages).
  - **Routing:** Verify that clicking a game card navigates to the correct game details page.

### 3. End-to-End (E2E) Tests (Low Volume - Future)
*Note: Not currently configured, but recommended for critical paths.*
- **Tools:** Playwright or Cypress.
- **Critical Paths:** 
  - User visits dashboard -> Checks scores -> Navigates to Game Details -> Views Scoring Summary.

## Best Practices
1.  **Mock Data Factories:** Always use `mocks/factories` to generate test data. Do not hardcode large objects in test files.
    - *Example:* `const game = mockGame({ status: 'in', homeScore: 24 });`
2.  **Avoid Implementation Details:** Test *what* the user sees (text, accessibility roles), not *how* it's implemented (state values, class names).
3.  **MSW for Network Requests:** Never make real network calls. Define handlers in `mocks/handlers.ts`.
4.  **Coverage:** Aim for 80% branch coverage on core business logic (`services/`, `lib/`).

## Running Tests
- `npm test`: Run all tests.
- `npm run test:watch`: Run tests in watch mode during development.
- `npm run test:coverage`: Generate coverage report.
