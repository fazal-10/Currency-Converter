## Why

Users currently lose the context of recent conversions as soon as they run another conversion or refresh the page. A compact conversion history makes repeated comparisons easier and gives the app a more complete calculator experience.

## What Changes

- Add a conversion history section below the main calculator.
- Record each successful conversion with source amount, source currency, converted amount, target currency, unit rate, and rate date.
- Persist the most recent 5 conversions in `localStorage`.
- Load saved history when the app starts.
- Keep the history UI visually aligned with the existing card theme.

## Capabilities

### New Capabilities
- `conversion-history`: Covers recording, displaying, limiting, and persisting recent conversions.

### Modified Capabilities
- `currency-conversion`: Successful conversions are captured as history entries after the result is computed.

## Impact

- `src/components/CurrencyConverter.tsx`: add history state, persistence, recording, and rendering.
- `src/index.css`: add history styling that matches the current compact card UI.
- `src/components/CurrencyConverter.test.tsx`: add or update tests for history rendering, persistence, and limiting behavior.
- Browser `localStorage`: stores recent conversion history for the current device/browser.
