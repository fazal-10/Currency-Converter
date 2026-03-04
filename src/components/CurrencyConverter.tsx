import { type FormEvent, type KeyboardEvent, useEffect, useState } from "react";
import type { Currency, CurrencyCode } from "../types/currency";
import { fetchConversion, fetchCurrencies, formatAmount } from "../utils/currency";

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
          }
        }

        if (!availableCodes.has(toCurrency) || toCurrency === fromCurrency) {
          const eur = list.find((c) => c.code === "EUR" && c.code !== fromCurrency);
          const fallback = list.find((c) => c.code !== fromCurrency);
          const nextTo = eur ?? fallback;
          if (nextTo) {
            setToCurrency(nextTo.code);
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
      return;
    }

    const match = value.match(/^(\d{0,12})(\.\d*)?$/);

    if (match) {
      setAmount(value);
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

      const conversion = await fetchConversion(
        parsed,
        fromCurrency,
        toCurrency,
      );

      setResult(conversion.rate);
      setRate(conversion.rate / conversion.amount);
      setDate(conversion.date);
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
    setResult(null);
    setRate(null);
    setDate(null);
    setError(null);
  };

  const handleFromChange = (value: string) => {
    const nextFrom = value as CurrencyCode;
    setFromCurrency(nextFrom);
    if (nextFrom === toCurrency) {
      setToCurrency(pickDifferentCurrency(nextFrom, fromCurrency));
    }
    setResult(null);
    setRate(null);
    setDate(null);
    setError(null);
  };

  const handleToChange = (value: string) => {
    const nextTo = value as CurrencyCode;
    setToCurrency(nextTo);
    if (nextTo === fromCurrency) {
      setFromCurrency(pickDifferentCurrency(nextTo, toCurrency));
    }
    setResult(null);
    setRate(null);
    setDate(null);
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
            <span className="field-label">From</span>
            <select
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
                  <span className="currency-option-label">
                    {currency.flag ? `${currency.flag} ${currency.code}` : currency.code}
                  </span>
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
            <span className="field-label">To</span>
            <select
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
                  <span className="currency-option-label">
                    {currency.flag ? `${currency.flag} ${currency.code}` : currency.code}
                  </span>
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
              Your converted amount will appear here.
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
    </div>
  );
}
