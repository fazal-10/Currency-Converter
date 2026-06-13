## 1. History State and Persistence

- [x] 1.1 Add a typed conversion history entry model and localStorage key in `CurrencyConverter.tsx`.
- [x] 1.2 Load valid saved history on initial render and fall back to an empty list when storage is invalid or unavailable.
- [x] 1.3 Persist history updates to localStorage while keeping at most 5 newest entries.

## 2. Conversion Recording and UI

- [x] 2.1 Record a new history entry after each successful conversion using the displayed conversion data.
- [x] 2.2 Render the history section below the main calculator with an empty state and newest-first entries.
- [x] 2.3 Add responsive styles that match the current calculator card theme.

## 3. Verification

- [x] 3.1 Add component tests for rendering a successful conversion in history.
- [x] 3.2 Add component tests for loading persisted history and limiting history to 5 entries.
- [x] 3.3 Run OpenSpec validation and the app test suite.
