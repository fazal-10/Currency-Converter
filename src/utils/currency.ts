import type { Currency, CurrencyCode } from "../types/currency";

const FRANKFURTER_HOST = "api.frankfurter.app";

export interface ConversionResult {
  amount: number;
  base: CurrencyCode;
  date: string;
  rate: number;
  to: CurrencyCode;
}

export async function fetchConversion(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
): Promise<ConversionResult> {
  if (from === to) {
    return {
      amount,
      base: from,
      date: new Date().toISOString().slice(0, 10),
      rate: 1,
      to,
    };
  }

  const url = `https://${FRANKFURTER_HOST}/latest?amount=${encodeURIComponent(
    amount,
  )}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Frankfurter API error: ${response.status} ${response.statusText}`);
  }

  const data: {
    amount: number;
    base: string;
    date: string;
    rates: Record<string, number>;
  } = await response.json();

  const rate = data.rates[to];

  if (rate == null) {
    throw new Error(`Rate for ${to} not found in Frankfurter response`);
  }

  return {
    amount: data.amount,
    base: data.base as CurrencyCode,
    date: data.date,
    rate,
    to,
  };
}

function currencyCodeToFlag(code: string): string | undefined {
  if (!code || code.length < 2) return undefined;

  const country = code.slice(0, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) {
    return undefined;
  }

  const base = 0x1f1e6;
  const aCode = "A".charCodeAt(0);

  const first = base + (country.charCodeAt(0) - aCode);
  const second = base + (country.charCodeAt(1) - aCode);

  return String.fromCodePoint(first, second);
}

export async function fetchCurrencies(): Promise<Currency[]> {
  const response = await fetch(`https://${FRANKFURTER_HOST}/currencies`);

  if (!response.ok) {
    throw new Error(`Frankfurter API error: ${response.status} ${response.statusText}`);
  }

  const data: Record<string, string> = await response.json();

  return Object.entries(data)
    .map(([code, name]) => {
      const flag = currencyCodeToFlag(code);
      return {
        code,
        name,
        flag,
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function formatAmount(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
