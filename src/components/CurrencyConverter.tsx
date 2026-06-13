import { type FormEvent, type KeyboardEvent, useEffect, useState } from "react";
import type { Currency, CurrencyCode } from "../types/currency";
import { fetchCurrencies } from "../api/fetchCurrencies";
import { getRates } from "../api/getRates";
import { convertAmount } from "../utils/convertAmount";
import { formatAmount } from "../utils/formatAmount";

const HISTORY_STORAGE_KEY = "currency-converter-history";
const MAX_HISTORY_ENTRIES = 5;

interface ConversionHistoryEntry {
  id: string;
  sourceAmount: number;
  sourceCurrency: CurrencyCode;
  targetAmount: number;
  targetCurrency: CurrencyCode;
  unitRate: number;
  date: string;
}

function isHistoryEntry(value: unknown): value is ConversionHistoryEntry {
  if (typeof value !== "object" || value == null) return false;

  const entry = value as Partial<ConversionHistoryEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.sourceAmount === "number" &&
    typeof entry.sourceCurrency === "string" &&
    typeof entry.targetAmount === "number" &&
    typeof entry.targetCurrency === "string" &&
    typeof entry.unitRate === "number" &&
    typeof entry.date === "string"
  );
}

function loadConversionHistory(): ConversionHistoryEntry[] {
  try {
    const saved = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isHistoryEntry).slice(0, MAX_HISTORY_ENTRIES);
  } catch {
    return [];
  }
}

export function CurrencyConverter() {
  const [amount, setAmount] = useState<string>("");
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>("USD");
  const [toCurrency, setToCurrency] = useState<CurrencyCode>("NPR");
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [currenciesError, setCurrenciesError] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ConversionHistoryEntry[]>(
    loadConversionHistory,
  );

  const clearConversionResult = () => {
    setResult(null);
    setRate(null);
    setDate(null);
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoadingCurrencies(true);
        const list = await fetchCurrencies();
        if (!isMounted) return;
        setCurrencies(list);
        setCurrenciesError(null);

        const availableCodes = new Set(list.map((c) => c.code));

        if (!availableCodes.has(fromCurrency)) {
          const usd = list.find((c) => c.code === "USD");
          const first = usd ?? list[0];
          if (first) {
            setFromCurrency(first.code);
            clearConversionResult();
          }
        }

        if (!availableCodes.has(toCurrency) || toCurrency === fromCurrency) {
          const eur = list.find((c) => c.code === "EUR" && c.code !== fromCurrency);
          const fallback = list.find((c) => c.code !== fromCurrency);
          const nextTo = eur ?? fallback;
          if (nextTo) {
            setToCurrency(nextTo.code);
            clearConversionResult();
          }
        }
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        setCurrenciesError("Unable to load currencies right now.");
      } finally {
        if (isMounted) {
          setIsLoadingCurrencies(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [fromCurrency, toCurrency]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(history.slice(0, MAX_HISTORY_ENTRIES)),
      );
    } catch {
      // Conversion history is helpful, but storage failures should not break conversion.
    }
  }, [history]);

  const pickDifferentCurrency = (
    exclude: CurrencyCode,
    preferred?: CurrencyCode,
  ): CurrencyCode => {
    if (preferred && preferred !== exclude) return preferred;
    const candidate = currencies.find((c) => c.code !== exclude)?.code;
    return (candidate ?? exclude) as CurrencyCode;
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (value === "") {
      setAmount("");
      clearConversionResult();
      return;
    }

    const match = value.match(/^(\d{0,12})(\.\d*)?$/);

    if (match) {
      setAmount(value);
      clearConversionResult();
    }
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
    }

    const trimmed = amount.trim();

    if (!trimmed) {
      setResult(null);
      setError("Please enter an amount to convert.");
      return;
    }

    const parsed = Number.parseFloat(trimmed);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setResult(null);
      setError("Please enter a valid positive amount.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await getRates({
        amount: parsed,
        from: fromCurrency,
        to: toCurrency,
      });

      const convertedAmount = res.rates[toCurrency];
      if (convertedAmount == null) {
        throw new Error(`Rate for ${toCurrency} not found in Frankfurter response`);
      }

      const computed = convertAmount({
        inputAmount: res.amount,
        convertedAmount,
      });

      setResult(computed.convertedAmount);
      setRate(computed.unitRate);
      setDate(res.date);
      setHistory((currentHistory) => [
        {
          id: `${Date.now()}-${fromCurrency}-${toCurrency}`,
          sourceAmount: res.amount,
          sourceCurrency: fromCurrency,
          targetAmount: computed.convertedAmount,
          targetCurrency: toCurrency,
          unitRate: computed.unitRate,
          date: res.date,
        },
        ...currentHistory,
      ].slice(0, MAX_HISTORY_ENTRIES));
    } catch (err) {
      console.error(err);
      setResult(null);
      setRate(null);
      setDate(null);
      setError("Unable to perform this conversion right now.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    clearConversionResult();
    setError(null);
  };

  const handleFromChange = (value: string) => {
    const nextFrom = value as CurrencyCode;
    setFromCurrency(nextFrom);
    if (nextFrom === toCurrency) {
      setToCurrency(pickDifferentCurrency(nextFrom, fromCurrency));
    }
    clearConversionResult();
    setError(null);
  };

  const handleToChange = (value: string) => {
    const nextTo = value as CurrencyCode;
    setToCurrency(nextTo);
    if (nextTo === fromCurrency) {
      setFromCurrency(pickDifferentCurrency(nextTo, toCurrency));
    }
    clearConversionResult();
    setError(null);
  };

  const isSubmitDisabled = !amount.trim();

  const from = currencies.find((c) => c.code === fromCurrency);
  const to = currencies.find((c) => c.code === toCurrency);

  const parsedAmount = Number.parseFloat(amount || "0");
  const resultLabel =
    result != null && from && to
      ? `${formatAmount(parsedAmount)} ${from.code} = ${formatAmount(result)} ${to.code}`
      : null;

  return (
    <div className="currency-card">
      <h1 className="currency-card__title">Currency Converter</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="amount" className="field-label">
            Enter Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={handleAmountChange}
            onKeyDown={handleAmountKeyDown}
            className="amount-input"
            placeholder="e.g. 100"
          />
          <div className="info-text">
            Up to 12 digits are allowed before the decimal point.
          </div>
        </div>

        {currenciesError && <div className="error-text">{currenciesError}</div>}

        {error && <div className="error-text">{error}</div>}

        <div className="currency-row">
          <div className="currency-column">
            <label className="field-label" htmlFor="from-currency">
              From
            </label>
            <select
              id="from-currency"
              className="currency-select"
              value={fromCurrency}
              onChange={(event) => handleFromChange(event.target.value)}
              disabled={isLoadingCurrencies || currencies.length === 0}
            >
              {isLoadingCurrencies && (
                <option value="" disabled>
                  Loading…
                </option>
              )}
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code} disabled={currency.code === toCurrency}>
                  {currency.flag ? `${currency.flag} ${currency.code}` : currency.code}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="swap-button"
            onClick={handleSwap}
            aria-label="Swap currencies"
          >
            ↔
          </button>

          <div className="currency-column">
            <label className="field-label" htmlFor="to-currency">
              To
            </label>
            <select
              id="to-currency"
              className="currency-select"
              value={toCurrency}
              onChange={(event) => handleToChange(event.target.value)}
              disabled={isLoadingCurrencies || currencies.length === 0}
            >
              {isLoadingCurrencies && (
                <option value="" disabled>
                  Loading…
                </option>
              )}
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code} disabled={currency.code === fromCurrency}>
                  {currency.flag ? `${currency.flag} ${currency.code}` : currency.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="result-text">
          {isLoading ? (
            <span className="result-placeholder">Fetching latest rate…</span>
          ) : resultLabel ? (
            <>
              <div>{resultLabel}</div>
              {rate != null && from && to && (
                <div className="result-meta">
                  {`1 ${from.code} = ${formatAmount(rate)} ${to.code}`}
                  {date && ` · ${date}`}
                </div>
              )}
            </>
          ) : (
            <span className="result-placeholder">
              Click “Get Exchange Rate” to see the result.
            </span>
          )}
        </div>

        <button
          type="submit"
          className="primary-button"
          disabled={isSubmitDisabled || isLoading}
        >
          {isLoading ? "Getting rate…" : "Get Exchange Rate"}
        </button>
      </form>

      <section className="history-section" aria-labelledby="history-heading">
        <h2 id="history-heading" className="history-title">
          Conversion History
        </h2>

        {history.length > 0 ? (
          <ul className="history-list">
            {history.map((entry) => (
              <li className="history-item" key={entry.id}>
                <div className="history-main">
                  {`${formatAmount(entry.sourceAmount)} ${entry.sourceCurrency} = ${formatAmount(entry.targetAmount)} ${entry.targetCurrency}`}
                </div>
                <div className="history-meta">
                  {`1 ${entry.sourceCurrency} = ${formatAmount(entry.unitRate)} ${entry.targetCurrency}`}
                  {entry.date && ` · ${entry.date}`}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="history-empty">Your recent conversions will appear here.</p>
        )}
      </section>
    </div>
  );
}
