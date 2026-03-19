# Developer Documentation — Currency Converter App

## Project overview

This is a small **Vite + React + TypeScript** currency converter UI. It loads the list of supported currencies from the **Frankfurter** API, generates flag emojis dynamically, and converts amounts using live exchange rates from the API.

## Key features

- **Live currency list**: currencies are fetched dynamically from Frankfurter (`/currencies`).
- **Live conversion**: conversions are fetched from Frankfurter (`/latest?amount=...&from=...&to=...`).
- **No hardcoded flags**: flag emojis are generated from currency codes (fallback: show only code).
- **Input validation**
  - Amount must be a positive number.
  - Amount input is limited to **12 digits before decimals**.
- **Swap**: swap From/To currencies.
- **Prevents duplicate selection**: the same currency cannot be selected in both dropdowns.
- **Result freshness**: result is only shown after a successful conversion and is cleared when inputs change.
- **Unit tests**: Vitest + React Testing Library; API requests are mocked.

## Technical stack

- **Runtime/UI**: React 19 + TypeScript
- **Build tooling**: Vite
- **Testing**: Vitest, jsdom, React Testing Library, Testing Library user-event, jest-dom matchers
- **Linting**: ESLint

## Project structure (high level)

```
src/
  api/
    fetchCurrencies.ts      # Frankfurter /currencies
    getRates.ts             # Frankfurter /latest
  components/
    CurrencyConverter.tsx   # Main UI component
  utils/
    convertAmount.ts        # Computes converted + per-unit rate
    formatAmount.ts         # Number formatting helper
    makeFlagFromCurrency.ts # Flag generator (no hardcoded emojis)
  test/
    setup.ts                # jest-dom matchers + RTL cleanup
    fixtures.ts             # Shared test fixtures
```

## Setup instructions

### Install

```bash
cd currency-converter-app
npm install
```

### Run (dev)

```bash
npm run dev
```

Vite will print a local URL in the terminal (commonly `http://localhost:5173`).

### Build (production)

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Run tests

```bash
npm run test
```

Helpful alternatives:

```bash
npm run test:watch
npm run test:ui
```

## Usage guide (app flow)

1. **Enter Amount**
   - Input accepts decimals.
   - The integer part is capped at **12 digits**.
2. **Pick currencies**
   - Choose From and To currencies from the dropdowns.
   - You cannot select the same currency in both dropdowns.
3. **Convert**
   - Click **Get Exchange Rate** (or press Enter in the amount input).
   - The app fetches the conversion from Frankfurter.
4. **Read result**
   - Main line shows: `amount FROM = converted TO`
   - Secondary line shows: `1 FROM = unitRate TO · date`

## Frankfurter API notes

- **Currency list**: `GET https://api.frankfurter.app/currencies`
- **Conversion**: `GET https://api.frankfurter.app/latest?amount=10&from=USD&to=EUR`
- Frankfurter uses ECB rates and typically updates on working days.

## Testing approach (what is mocked)

- **API modules** (`src/api/*`) are tested by mocking `globalThis.fetch`.
- **Component tests** mock the API modules (`fetchCurrencies` / `getRates`) so UI tests are deterministic and do not hit the network.

