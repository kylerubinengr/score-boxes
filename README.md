# NFL Dashboard

A modern, real-time NFL game tracking dashboard built with Next.js 14+, TypeScript, and Tailwind CSS. Features live game updates, advanced statistics, playoff standings, and comprehensive game analysis.

![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-19.2-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Key Components](#-key-components)
- [API Integration](#-api-integration)
- [Configuration](#-configuration)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🏈 Game Tracking
- **Live Game Updates** - Real-time score updates with adaptive polling
- **Week-by-Week Navigation** - Browse games by NFL week (1-18) and playoffs
- **Game Status Tracking** - Pre-game, in-progress, and final states
- **Multi-Tab Game Management** - Open up to 5 games simultaneously with tab limits

### 📊 Advanced Statistics
- **Play-by-Play Analysis** - Detailed drive-by-drive breakdowns
- **Team Matchup Engine** - Advanced EPA, success rate, and efficiency metrics
- **Scoring Summary** - Quarter-by-quarter scoring with play details
- **Box Score Statistics** - Comprehensive team and player stats

### 🏆 Playoff Standings
- **Conference Standings Table** - Sortable AFC/NFC standings with all teams
- **Playoff Bracket View** - Visual playoff bracket with seeding
- **Clinch Status Indicators** - Real-time playoff clinching scenarios
- **Advanced Metrics** - Win percentage, point differential, streaks

### 🎨 User Experience
- **Dark Mode Support** - Full dark theme with persistent preference
- **Responsive Design** - Mobile-first design that works on all devices
- **Season Selection** - Browse current and historical seasons
- **Adaptive Polling** - Smart polling that adjusts based on game state
- **Offline Support** - Graceful degradation with mock data fallbacks

---

## 🛠 Tech Stack

### Core
- **[Next.js 14+](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS 3.4](https://tailwindcss.com/)** - Utility-first CSS

### Data & State
- **Server Actions** - Next.js server actions for data fetching
- **React Context** - Season and game tab state management
- **ETag Caching** - HTTP cache validation for efficient updates

### Testing
- **[Jest](https://jestjs.io/)** - Unit and integration testing
- **[React Testing Library](https://testing-library.com/react)** - Component testing
- **[MSW](https://mswjs.io/)** - API mocking for tests

### APIs
- **ESPN API** - Game data, scores, and standings
- **The Odds API** - Betting lines and odds (optional)
- **OpenWeather API** - Stadium weather (optional, currently disabled)

### Development
- **ESLint** - Code linting
- **Autoprefixer** - CSS vendor prefixing
- **PostCSS** - CSS processing

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **Git** (for cloning)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nfl-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local  # If example exists
   # Or create manually:
   touch .env.local
   ```

   Add the following variables to `.env.local`:
   ```env
   # Optional: OpenWeather API (for stadium weather - currently disabled)
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key_here
   ```

   **Get API Keys:**
   - OpenWeather: https://openweathermap.org/api

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### First Launch

On first launch, you'll see:
- **Dashboard** - Weekly game schedule (defaults to current week)
- **Playoffs** - Conference standings and playoff bracket
- **About** - Information about the application

**Try these features:**
1. Navigate between weeks using the week selector
2. Click on a game to open detailed view
3. Switch to the Playoffs tab to see standings
4. Toggle between List and Bracket views
5. Try sorting the standings table by different columns
6. Enable dark mode using the theme toggle

---

## 📁 Project Structure

```
nfl-dashboard/
├── app/                          # Next.js App Router
│   ├── about/                    # About page
│   ├── actions/                  # Server Actions
│   │   └── gameActions.ts        # Game data fetching
│   ├── api/                      # API routes (future)
│   ├── dashboard/                # Dashboard pages
│   │   ├── [week]/               # Dynamic week pages
│   │   │   └── page.tsx          # Week view
│   │   └── playoffs/             # Playoffs page
│   │       └── page.tsx          # Playoff standings
│   ├── game/                     # Game detail pages
│   │   └── [id]/                 # Dynamic game pages
│   │       └── page.tsx          # Game detail view
│   ├── team/                     # Team pages (future)
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   └── page.tsx                  # Home page
│
├── components/                   # React components
│   ├── common/                   # Shared components
│   │   └── SafeImage.tsx         # Image with fallback
│   ├── dashboard/                # Dashboard components
│   │   ├── ConferenceStandingsTable.tsx  # Standings table
│   │   ├── GameCard.tsx          # Game card
│   │   ├── PlayoffsTab.tsx       # Playoff tab
│   │   ├── SeasonSelector.tsx    # Season picker
│   │   ├── TeamSelector.tsx      # Team filter
│   │   ├── ViewToggle.tsx        # View switcher
│   │   └── WeekSelector.tsx      # Week navigation
│   ├── game/                     # Game detail components
│   │   ├── AdvancedMatchupEngine.tsx  # Team comparison
│   │   ├── GameDetailHeader.tsx  # Game header
│   │   ├── GameTabManager.tsx    # Multi-tab management
│   │   ├── LiveGameView.tsx      # Live game view
│   │   ├── LivePlayByPlay.tsx    # Play-by-play
│   │   └── ScoringSummary.tsx    # Scoring details
│   ├── layout/                   # Layout components
│   │   └── Navbar.tsx            # Navigation bar
│   └── ui/                       # UI primitives
│       ├── LoadingSpinner.tsx    # Loading indicator
│       └── TabLimitWarning.tsx   # Tab limit warning
│
├── constants/                    # Constants and config
│   ├── mappings.ts               # Team ID mappings
│   ├── stadiums.ts               # Stadium data
│   └── teams.ts                  # Team logos and colors
│
├── context/                      # React Context providers
│   ├── GameTabsContext.tsx       # Game tab state
│   ├── SeasonContext.tsx         # Season state
│   └── ThemeContext.tsx          # Dark mode state
│
├── hooks/                        # Custom React hooks
│   ├── useAdaptivePolling.ts     # Smart polling hook
│   └── useTheme.ts               # Theme hook
│
├── lib/                          # Utilities and helpers
│   ├── polling-config.ts         # Polling configuration
│   └── utils.ts                  # General utilities
│
├── services/                     # Data services
│   ├── gameService.ts            # Game data fetching
│   ├── matchupService.ts         # Matchup comparisons
│   └── playoffService.ts         # Playoff data fetching
│
├── types/                        # TypeScript types
│   └── nfl.ts                    # NFL data types
│
├── __tests__/                    # Test files
│   ├── polling-config.test.ts
│   └── useAdaptivePolling.test.tsx
│
├── nflfastr/                     # Python data analysis
│   └── game_analysis.py          # Game statistics
│
├── public/                       # Static assets
│   └── data/                     # Data files
│       └── team_stats.json       # Team statistics
│
├── .env.local                    # Environment variables (create this)
├── jest.config.ts                # Jest configuration
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

---

## 🔑 Key Components

### Dashboard Components

#### `ConferenceStandingsTable`
Sortable playoff standings table with full statistics.

**Features:**
- Click column headers to sort
- Displays all 16 teams per conference
- Color-coded differentials and streaks
- Playoff status indicators (*, z, y, e)
- Dark mode support

**Props:**
```typescript
interface ConferenceStandingsTableProps {
  conference: 'AFC' | 'NFC';
  teams: PlayoffTeam[];
  sortConfig: SortConfig;
  onSort: (key: keyof PlayoffTeam) => void;
}
```

#### `GameCard`
Individual game card with score, status, and quick actions.

**States:**
- **Pre-game:** Shows matchup, time, and betting odds
- **In-progress:** Live score with adaptive polling
- **Final:** Final score with box score access

#### `WeekSelector`
Week navigation with visual indicators.

**Features:**
- Weeks 1-18 + Playoffs
- Highlights current week
- Shows live game indicators
- Responsive grid layout

### Game Detail Components

#### `LiveGameView`
Real-time game updates with play-by-play.

**Features:**
- Adaptive polling (15s → 2m based on game state)
- ETag-based cache validation
- Automatic cleanup on unmount
- Error handling with retry logic

#### `ScoringSummary`
Multi-tab view of game details.

**Tabs:**
1. **Linescore** - Quarter-by-quarter scoring
2. **Matchup** - Advanced team statistics (EPA, success rate)
3. **Play by Play** - Drive-by-drive breakdown

#### `GameTabManager`
Manages multiple open game tabs.

**Features:**
- Up to 5 simultaneous tabs
- Tab limit warnings
- Close tabs individually
- Persists across navigation

### Context Providers

#### `SeasonContext`
Global season state management.

```typescript
const { selectedSeason, setSelectedSeason } = useSeason();
```

#### `GameTabsContext`
Multi-tab game state.

```typescript
const {
  openTabs,       // Array of open game IDs
  addTab,         // Add new tab
  removeTab,      // Remove tab
  isTabOpen       // Check if tab open
} = useGameTabs();
```

---

## 🌐 API Integration

### ESPN API

**Base URL:** `https://site.api.espn.com/apis/site/v2/sports/football/nfl`

**Endpoints Used:**
- `/scoreboard` - Game scores and schedules
- `/standings` - Playoff standings
- `/summary` - Game details and box scores

**Caching:**
- Next.js ISR with revalidation
- ETag support for live games
- Fallback to mock data on failure

### The Odds API (Optional)

**Endpoint:** `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds`

**Features:**
- Spread, totals, moneyline
- Multiple sportsbooks (DraftKings, FanDuel, BetMGM)
- Line movement tracking

**⚠️ Security Note:** Currently exposed in client bundle. See recommendations in CODE_REVIEW_REPORT.md.

### OpenWeather API (Optional, Disabled)

**Status:** Currently commented out

**Purpose:** Stadium weather conditions

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_OPENWEATHER_API_KEY` | No | OpenWeather API key for weather (currently disabled) |

### Polling Configuration

Edit `lib/polling-config.ts`:

```typescript
export const POLLING_CONFIG = {
  LIVE_GAME_INTERVAL: 15000,      // 15 seconds
  CLOSE_GAME_INTERVAL: 30000,     // 30 seconds
  BLOWOUT_INTERVAL: 60000,        // 1 minute
  FINAL_GAME_INTERVAL: 120000,    // 2 minutes
  MAX_POLLING_TIME: 14400000,     // 4 hours
};
```

### Theme Configuration

Dark mode preferences stored in `localStorage`:
```typescript
localStorage.setItem('theme', 'dark'); // or 'light'
```

### Tab Limits

Adjust in `context/GameTabsContext.tsx`:
```typescript
const MAX_TABS = 5; // Change to desired limit
```

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Development Server

```bash
npm run dev
```

- Runs on `http://localhost:3000`
- Hot module replacement enabled
- API routes available at `/api/*`

### Building for Production

```bash
npm run build
```

**Output:**
- Static pages in `.next/`
- Optimized bundles
- Pre-rendered routes

**Verify Build:**
```bash
npm run start
```

### Code Style

- **ESLint** for linting
- **Prettier** recommended (add `.prettierrc` if desired)
- **TypeScript strict mode** enabled

**Linting:**
```bash
npm run lint
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure

```
__tests__/
├── components/
│   └── dashboard/
│       └── ConferenceStandingsTable.test.tsx
├── hooks/
│   └── useAdaptivePolling.test.tsx
├── services/
│   └── playoffService.test.ts
└── polling-config.test.ts
```

### Writing Tests

**Component Test Example:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ConferenceStandingsTable } from '@/components/dashboard/ConferenceStandingsTable';

describe('ConferenceStandingsTable', () => {
  it('renders teams correctly', () => {
    const mockTeams = [/* ... */];
    render(<ConferenceStandingsTable teams={mockTeams} />);

    expect(screen.getByText('AFC Standings')).toBeInTheDocument();
  });
});
```

**Hook Test Example:**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAdaptivePolling } from '@/hooks/useAdaptivePolling';

describe('useAdaptivePolling', () => {
  it('adjusts interval based on game state', () => {
    const { result } = renderHook(() => useAdaptivePolling(gameData));

    expect(result.current.interval).toBe(15000);
  });
});
```

### Test Coverage

**Current Coverage:** ~15%
**Target Coverage:** 70%+

**Coverage Reports:**
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Import project to Vercel
   - Connect Git repository

2. **Configure Environment Variables**
   - Add all `NEXT_PUBLIC_*` variables
   - Set Node.js version to 18+

3. **Deploy**
   - Automatic deployments on push
   - Preview deployments for PRs

**Vercel CLI:**
```bash
npm i -g vercel
vercel login
vercel
```

### Other Platforms

#### Netlify
```bash
npm run build
# Deploy .next/ directory
```

#### Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

**Build:**
```bash
docker build -t nfl-dashboard .
docker run -p 3000:3000 nfl-dashboard
```

#### Self-Hosted
```bash
npm run build
npm start
# Or use PM2:
pm2 start npm --name "nfl-dashboard" -- start
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Add tests for new features
   - Update documentation

4. **Run tests**
   ```bash
   npm test
   npm run lint
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process or tooling changes

### Code Review Process

1. All PRs require review
2. CI must pass (tests, linting)
3. Coverage should not decrease
4. Update relevant documentation

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **ESPN API** for game data
- **The Odds API** for betting lines
- **nflfastR** for advanced statistics
- **Tailwind CSS** for styling utilities
- **Lucide React** for icons
- **Next.js** team for the framework

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/your-repo/nfl-dashboard/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-repo/nfl-dashboard/discussions)

---

## 🗺 Roadmap

### Current Sprint
- [x] Conference Standings Table with sorting
- [ ] Fix security issues (API keys)
- [ ] Improve test coverage to 70%+
- [ ] Accessibility improvements (WCAG AA)

### Next Sprint
- [ ] Team detail pages
- [ ] Player statistics
- [ ] Historical game archive
- [ ] Export standings to CSV/PDF

### Future
- [ ] Mobile app (React Native)
- [ ] Push notifications for score updates
- [ ] Fantasy football integration
- [ ] Social features (comments, predictions)

---

## 📊 Project Stats

- **Lines of Code:** ~8,500
- **Components:** 35+
- **Test Coverage:** 15% (target: 70%)
- **Bundle Size:** ~450KB
- **Performance Score:** 95+ (Lighthouse)
- **Accessibility Score:** 65/100 (improving)

---

**Built with ❤️ for NFL fans**

*Last Updated: January 4, 2026*
