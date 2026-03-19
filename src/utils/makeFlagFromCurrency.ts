export function makeFlagFromCurrency(code: string): string | undefined {
  if (!code || code.length < 2) return undefined;

  const country = code.slice(0, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) return undefined;

  const base = 0x1f1e6;
  const aCode = "A".charCodeAt(0);

  const first = base + (country.charCodeAt(0) - aCode);
  const second = base + (country.charCodeAt(1) - aCode);

  return String.fromCodePoint(first, second);
}

