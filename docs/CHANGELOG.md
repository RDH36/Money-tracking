# Changelog

All notable changes to Mitsitsy will be documented in this file.

## [2.0.3] - 2026-07-17

### Added
- Backup and transfer your data via `.mitsitsy` files (phone migration)
- Direct import of a `.mitsitsy` backup from onboarding
- Date filter in history and date display on transaction cards

### Fixed
- Deleting a transfer now removes both legs of the transfer

## [2.0.2] - 2026-06-15

### Added
- Cloud backup survey to gauge interest
- First-expense activation tracking with analytics events

### Fixed
- Smoother "wow moment" animation

## [2.0.1] - 2026-06-03

### Added
- App lock with PIN, biometric unlock and recovery
- Custom transaction date when logging entries
- Dashboard lock banner and "my other apps" page

### Fixed
- Monthly challenge reset bug
- Activity feed now orders by recording date so back-dated entries surface as recent
- Expense reminder and planification notifications translated (FR/EN/MG)

## [2.0.0] - 2026-04-30

### Added
- V2 design redesign across dashboard, activity, add, planification, reports, calendar, settings and achievements
- Rose theme, refreshed popups and bottom sheets
- French amount formatting
- Manual XP recalculation button to repair inflated accounts

### Changed
- Settings polish, accurate notification labels, simplified feedback
- Planification renamed with form parity

### Fixed
- Critical XP spam on the Achievements page (stale closure)

## [1.1.0] - 2026-03-03

### Added
- Gamification system: earn XP and level up by tracking your finances
- Daily streaks with streak freeze protection
- Daily challenges (log expense, log 3 transactions, check plans, log income)
- 7 badges to unlock (first expense, 3/7/30 day streaks, 500 XP, level 5, 50 transactions)
- XP and level system with progress bar on dashboard
- Achievements tab in History screen with stats and badge grid
- Level up celebration modal
- XP toast notification after each action
- Differentiated XP rewards: income (15 XP) > transfer (8 XP) > expense (5 XP)

## [1.0.6] - 2025-02-26

### Added
- Factory reset button in settings (danger zone)
- Delete transactions via trash icon or long press
- "What's New" page accessible from settings
- Performance optimizations for instant UI feedback

### Fixed
- Transaction list now updates instantly after delete
- Account balances refresh after transaction delete on dashboard
- Category and account delete confirmation shows correct name
- Reset app now properly returns to onboarding

## [1.0.5] - 2025-02-20

### Added
- Malagasy language support (275 translation keys)
- Dark mode with improved text readability
- Feedback modal with rotating tips
- Multi-language support (FR, EN, MG)
- Tutorial carousel during onboarding

## [1.0.4] - 2025-02-15

### Added
- Currency conversion with live exchange rates
- Multiple account support (bank + cash + custom)
- Transfer between accounts
- Planification system for budget planning

## [1.0.3] - 2025-02-10

### Added
- Expense chart by category on dashboard
- Transaction history with date grouping
- Pull-to-refresh on all screens

## [1.0.2] - 2025-02-05

### Added
- Custom categories (up to 3)
- Notification reminders
- Balance visibility toggle

## [1.0.1] - 2025-02-01

### Added
- Initial release
- Income and expense tracking
- Default categories with icons
- SQLite offline database
