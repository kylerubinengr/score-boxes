# Score Boxes Documentation

This directory contains project documentation organized by purpose and lifecycle stage.

## Current Documentation

- **[Testing Strategy](./TESTING_STRATEGY.md)** - Testing approach, patterns, and guidelines

## Code Reviews

Comprehensive code review reports:
- **[Code Review (Jan 4, 2026)](./reviews/CODE_REVIEW_REPORT_2026-01-04.md)** - Full codebase analysis with prioritized action items

## Design Decisions

Architecture Decision Records (ADRs) and design documentation:
- **[Game Header UX Improvements](./decisions/GAME_HEADER_UX_IMPROVEMENTS.md)** - Header component UX design rationale

## Archive

Historical implementation documentation:
- **[Phase 1 Implementation](./archive/PHASE_1_IMPLEMENTATION.md)** - Adaptive polling system implementation
- **[Header Refactor Summary](./archive/HEADER_REFACTOR_SUMMARY.md)** - Header component refactoring details
- **[Phase 4 & 5 Summary](./archive/PHASE_4_5_SUMMARY.md)** - Team data consolidation and file reorganization

## Contributing

For development setup and contribution guidelines, see:
- [Main README](../README.md) - Project overview and setup
- [CONTRIBUTING](../CONTRIBUTING.md) - Contribution guidelines (when available)
- [CHANGELOG](../CHANGELOG.md) - Version history (when available)

## Organization

```
docs/
├── README.md                    # This file
├── TESTING_STRATEGY.md          # Current testing docs
├── archive/                     # Historical implementation docs
├── decisions/                   # Architecture decisions
└── reviews/                     # Code review reports
```

## Adding Documentation

When adding new documentation:

1. **Testing docs** → `/docs/`
2. **Code reviews** → `/docs/reviews/` (with date in filename)
3. **Design decisions** → `/docs/decisions/` (ADR format recommended)
4. **Implementation summaries** → `/docs/archive/` (after completion)
5. **Active docs** → Keep in root or `/docs/` based on relevance

## Archiving Documentation

Move completed implementation docs to `/docs/archive/` to keep root clean while preserving history for reference.
