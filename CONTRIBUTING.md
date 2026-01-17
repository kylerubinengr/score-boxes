# Contributing to Score Boxes

Thank you for your interest in contributing to the Score Boxes! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Reporting Issues](#reporting-issues)

---

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm 9.0 or higher
- Git

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/nfl-dashboard.git
   cd nfl-dashboard
   ```
3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/original-owner/nfl-dashboard.git
   ```

---

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your API keys (optional)
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Development Workflow

### Creating a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### Making Changes

1. Make your changes in the feature branch
2. Follow the [coding standards](#coding-standards)
3. Add tests for new features
4. Update documentation as needed

### Before Committing

```bash
# Run linter
npm run lint

# Run tests
npm test

# Build to verify no errors
npm run build
```

---

## Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- **Strict mode** is enabled - follow strict type checking
- **Avoid `any`** - use proper types or `unknown` with type guards
- **Export types** from `types/nfl.ts` for reuse

### Component Structure

```typescript
// Preferred structure for components
"use client"; // If client component

import { useState } from "react";
import { ComponentProps } from "@/types";

interface MyComponentProps {
  data: string;
  optional?: boolean;
}

export function MyComponent({ data, optional = false }: MyComponentProps) {
  const [state, setState] = useState<string>("");

  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  );
}
```

### File Naming

- **Components:** PascalCase (e.g., `GameCard.tsx`)
- **Utilities:** kebab-case (e.g., `nfl-dates.ts`)
- **Types:** kebab-case (e.g., `nfl.ts`)
- **Tests:** Same as source + `.test.tsx` (e.g., `GameCard.test.tsx`)

### Directory Organization

- `app/` - Next.js App Router pages and layouts
- `components/` - React components
  - `common/` - Shared/reusable components
  - `dashboard/` - Dashboard-specific components
  - `game/` - Game detail components
  - `layout/` - Layout components
  - `ui/` - UI primitives
- `constants/` - Immutable data and lookup tables
- `lib/` - Utility functions and helpers
- `services/` - API services and data fetching
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions
- `context/` - React Context providers

### Styling

- **Use Tailwind CSS** for styling
- **Follow existing patterns** for consistency
- **Dark mode:** Include `dark:` variants for all colors
- **Responsive:** Use mobile-first approach with `md:` and `lg:` breakpoints

```typescript
// Example with proper styling
<div className="bg-white dark:bg-slate-900 rounded-lg p-4 md:p-6">
  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
    Title
  </h2>
</div>
```

### Imports

- **Use absolute imports** with `@/` prefix
- **Group imports:**
  1. React/Next.js
  2. Third-party libraries
  3. Internal imports (types, components, utils)
  4. Styles/assets

```typescript
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { GameData } from "@/types/nfl";
import { GameCard } from "@/components/dashboard/GameCard";
import { formatDate } from "@/lib/utils";
```

---

## Commit Guidelines

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only changes
- `style:` Code style changes (formatting, missing semicolons, etc.)
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Changes to build process, dependencies, or tooling
- `ci:` CI/CD changes

#### Examples

```bash
feat(dashboard): add sortable standings table

Add ConferenceStandingsTable component with column sorting.
Includes visual indicators for sort direction and proper
accessibility labels.

Closes #123
```

```bash
fix(polling): prevent memory leak in LiveGameView

Clear error state when game finishes to prevent memory
accumulation during long sessions.
```

```bash
docs: update setup instructions in README

Add .env.example creation step and clarify API key requirements.
```

### Commit Best Practices

- **One logical change per commit**
- **Write clear, descriptive messages**
- **Reference issues** when applicable
- **Keep commits focused** - avoid mixing refactoring with features

---

## Pull Request Process

### Before Submitting

1. **Update from upstream:**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run full test suite:**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

3. **Update documentation** if needed

### Submitting a Pull Request

1. **Push your branch:**
   ```bash
   git push origin your-feature-branch
   ```

2. **Create Pull Request** on GitHub

3. **Fill out PR template** with:
   - Description of changes
   - Related issues
   - Testing performed
   - Screenshots (if UI changes)

4. **Request review** from maintainers

### PR Requirements

✅ All tests pass
✅ Linting passes
✅ Build succeeds
✅ Code coverage doesn't decrease
✅ Documentation updated
✅ Commit messages follow conventions

### Review Process

- Maintainers will review your PR
- Address feedback and push updates
- Once approved, maintainers will merge

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Writing Tests

- **Test files:** Co-locate with source or in `__tests__/`
- **Naming:** `ComponentName.test.tsx`
- **Coverage:** Aim for >70% coverage on new code

#### Component Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { GameCard } from './GameCard';

describe('GameCard', () => {
  it('renders game information', () => {
    const mockGame = {
      id: '123',
      homeTeam: { name: 'Bills', score: 24 },
      awayTeam: { name: 'Chiefs', score: 20 },
      status: 'final'
    };

    render(<GameCard game={mockGame} />);

    expect(screen.getByText('Bills')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<GameCard game={mockGame} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Hook Test Example

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAdaptivePolling } from './useAdaptivePolling';

describe('useAdaptivePolling', () => {
  it('adjusts interval based on game state', () => {
    const { result } = renderHook(() =>
      useAdaptivePolling({ status: 'in', scoreDiff: 3 })
    );

    expect(result.current.interval).toBe(15000); // Live game
  });
});
```

---

## Reporting Issues

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check documentation** for solutions
3. **Verify** you're on the latest version

### Creating an Issue

Include:
- **Clear title** describing the issue
- **Description** with steps to reproduce
- **Expected vs actual behavior**
- **Environment** (OS, Node version, browser)
- **Screenshots** if applicable
- **Error messages** or logs

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed

---

## Code Review Guidelines

### For Contributors

- **Respond to feedback** promptly
- **Ask questions** if feedback is unclear
- **Be open to suggestions**
- **Keep discussions professional**

### For Reviewers

- **Be constructive** in feedback
- **Explain reasoning** for requested changes
- **Recognize good work**
- **Focus on code**, not the person

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

## Getting Help

- **GitHub Discussions** - Ask questions, share ideas
- **GitHub Issues** - Report bugs, request features
- **Code Review** - Learn from PR feedback

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

## Thank You!

Your contributions make this project better. We appreciate your time and effort! 🎉
