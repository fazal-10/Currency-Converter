import type { Currency } from "../types/currency";
import type { GetRatesResult } from "../api/getRates";

export const CURRENCIES_FIXTURE: Currency[] = [
  { code: "USD", name: "United States Dollar", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳" },
];

export function makeRatesFixture(params: {
  amount: number;
  from: string;
  to: string;
  convertedAmount: number;
  date?: string;
}): GetRatesResult {
  const { amount, from, to, convertedAmount, date } = params;
  return {
    amount,
    base: from,
    date: date ?? "2026-02-25",
    rates: { [to]: convertedAmount },
  };
}

