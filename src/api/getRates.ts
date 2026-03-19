import type { CurrencyCode } from "../types/currency";

const FRANKFURTER_HOST = "api.frankfurter.app";

export interface GetRatesResult {
  amount: number;
  base: CurrencyCode;
  date: string;
  rates: Record<string, number>;
}

export async function getRates(params: {
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
}): Promise<GetRatesResult> {
  const { amount, from, to } = params;

  if (from === to) {
    return {
      amount,
      base: from,
      date: new Date().toISOString().slice(0, 10),
      rates: { [to]: amount },
    };
  }

  const url = `https://${FRANKFURTER_HOST}/latest?amount=${encodeURIComponent(
    amount,
  )}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Frankfurter API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: GetRatesResult = await response.json();
  return data;
}

