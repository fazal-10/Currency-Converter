## Context

The app is a single React component backed by Frankfurter API helpers. Successful conversions already produce all data needed for history: parsed input amount, selected source and target currencies, computed converted amount, unit rate, and API rate date. The existing UI is a compact white card on a purple gradient background, so the history section should stay inside the card and use the same typography, spacing, border, and muted color language.

## Goals / Non-Goals

**Goals:**
- Record only successful conversions.
- Display the last 5 conversions below the main calculator.
- Persist entries with `localStorage` so history survives refreshes in the same browser.
- Keep the implementation local to the converter without adding dependencies.
- Cover the feature with component tests.

**Non-Goals:**
- Cross-device sync, accounts, or server-side storage.
- Editing individual history entries.
- Re-running a historical conversion by clicking an entry.
- Storing failed or validation-blocked conversion attempts.

## Decisions

- Store history in component state and synchronize with `localStorage`.
  - Rationale: the feature is scoped to this single calculator, and a shared store would be unnecessary ceremony.
  - Alternative considered: a dedicated React context or state library. Rejected because no other component needs the data.

- Use a small typed `ConversionHistoryEntry` model in `CurrencyConverter.tsx`.
  - Rationale: the app already keeps feature-specific state in the component, and the data shape is only used there.
  - Alternative considered: a separate utility module. This can be extracted later if history behavior grows.

- Update history only after a successful API response and computed result.
  - Rationale: this guarantees history matches the displayed conversion and avoids storing incomplete or failed attempts.

- Persist at most 5 entries, newest first.
  - Rationale: this matches the requested UI and keeps the card compact.

- Treat invalid or unreadable `localStorage` content as empty history.
  - Rationale: stale browser data should not break the calculator.

## Risks / Trade-offs

- `localStorage` may be unavailable or throw in some browser contexts -> Guard reads and writes with `try/catch` and continue without persistence.
- Repeated identical conversions may appear multiple times -> Accept this because history reflects user actions, not unique conversion pairs.
- The card can become tall on mobile -> Use compact rows and responsive spacing to keep the section readable.
