import type { Currency } from "../types/currency";
import { makeFlagFromCurrency } from "../utils/makeFlagFromCurrency";

const FRANKFURTER_HOST = "api.frankfurter.app";

export async function fetchCurrencies(): Promise<Currency[]> {
  const response = await fetch(`https://${FRANKFURTER_HOST}/currencies`);

  if (!response.ok) {
    throw new Error(
      `Frankfurter API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: Record<string, string> = await response.json();

  return Object.entries(data)
    .map(([code, name]) => ({
      code,
      name,
      flag: makeFlagFromCurrency(code),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

