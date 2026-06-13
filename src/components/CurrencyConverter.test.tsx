import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CURRENCIES_FIXTURE, makeRatesFixture } from "../test/fixtures";

vi.mock("../api/fetchCurrencies", () => ({
  fetchCurrencies: vi.fn(async () => CURRENCIES_FIXTURE),
}));

const getRatesMock = vi.fn();
vi.mock("../api/getRates", () => ({
  getRates: (args: unknown) => getRatesMock(args),
}));

import { CurrencyConverter } from "./CurrencyConverter";

const HISTORY_STORAGE_KEY = "currency-converter-history";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe("CurrencyConverter", () => {
  it("loads currencies and disables selecting the same currency", async () => {
    render(<CurrencyConverter />);

    const fromSelect = await screen.findByLabelText("From");
    const toSelect = await screen.findByLabelText("To");

    expect(fromSelect).toBeEnabled();
    expect(toSelect).toBeEnabled();

    // Initially USD -> NPR in app defaults, but fixture doesn't include NPR, so effect fixes to USD/EUR.
    expect((fromSelect as HTMLSelectElement).value).toBe("USD");
    expect((toSelect as HTMLSelectElement).value).toBe("EUR");

    // USD should be disabled in To dropdown
    const toOptions = within(toSelect).getAllByRole("option") as HTMLOptionElement[];
    const usdInTo = toOptions.find((o) => o.value === "USD");
    expect(usdInTo?.disabled).toBe(true);
  });

  it("prevents more than 12 digits before decimal", async () => {
    const user = userEvent.setup();
    render(<CurrencyConverter />);

    const amountInput = await screen.findByLabelText("Enter Amount");
    await user.type(amountInput, "1234567890123"); // 13 digits

    expect((amountInput as HTMLInputElement).value).toBe("123456789012");
  });

  it("shows result only after a successful conversion and clears on changes", async () => {
    const user = userEvent.setup();
    getRatesMock.mockResolvedValue(
      makeRatesFixture({
        amount: 100,
        from: "USD",
        to: "EUR",
        convertedAmount: 92,
        date: "2026-02-25",
      }),
    );

    render(<CurrencyConverter />);

    const amountInput = await screen.findByLabelText("Enter Amount");
    const button = screen.getByRole("button", { name: /get exchange rate/i });

    // Enter amount clears any prior result and allows submit
    await user.clear(amountInput);
    await user.type(amountInput, "100");

    await user.click(button);

    // Result appears after conversion
    expect(
      await screen.findAllByText(/100(\.00|,00)\sUSD\s=\s92(\.00|,00)\sEUR/),
    ).not.toHaveLength(0);
    expect(screen.getAllByText(/1\sUSD\s=\s0(\.92|,92)\sEUR/)).not.toHaveLength(0);

    // Changing amount clears result
    await user.type(amountInput, "1");
    expect(
      screen.getByText(/click “get exchange rate” to see the result\./i),
    ).toBeInTheDocument();
  });

  it("shows an error when getRates fails", async () => {
    const user = userEvent.setup();
    getRatesMock.mockRejectedValue(new Error("Network down"));

    render(<CurrencyConverter />);

    const amountInput = await screen.findByLabelText("Enter Amount");
    const button = screen.getByRole("button", { name: /get exchange rate/i });

    await user.type(amountInput, "10");
    await user.click(button);

    expect(
      await screen.findByText(/unable to perform this conversion right now\./i),
    ).toBeInTheDocument();
  });

  it("adds successful conversions to history", async () => {
    const user = userEvent.setup();
    getRatesMock.mockResolvedValue(
      makeRatesFixture({
        amount: 25,
        from: "USD",
        to: "EUR",
        convertedAmount: 23,
        date: "2026-02-25",
      }),
    );

    render(<CurrencyConverter />);

    const amountInput = await screen.findByLabelText("Enter Amount");
    const button = screen.getByRole("button", { name: /get exchange rate/i });

    await user.type(amountInput, "25");
    await user.click(button);

    const history = screen.getByRole("region", { name: /conversion history/i });
    expect(
      await within(history).findByText(/25(\.00|,00)\sUSD\s=\s23(\.00|,00)\sEUR/),
    ).toBeInTheDocument();
    expect(
      within(history).getByText(/1\sUSD\s=\s0(\.92|,92)\sEUR\s·\s2026-02-25/),
    ).toBeInTheDocument();
  });

  it("loads persisted conversion history", async () => {
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          id: "saved-entry",
          sourceAmount: 10,
          sourceCurrency: "USD",
          targetAmount: 9.2,
          targetCurrency: "EUR",
          unitRate: 0.92,
          date: "2026-02-25",
        },
      ]),
    );

    render(<CurrencyConverter />);

    const history = screen.getByRole("region", { name: /conversion history/i });
    expect(
      within(history).getByText(/10(\.00|,00)\sUSD\s=\s9(\.20|,20)\sEUR/),
    ).toBeInTheDocument();
  });

  it("keeps only the five newest history entries", async () => {
    const user = userEvent.setup();
    getRatesMock.mockImplementation((args: unknown) => {
      const { amount, from, to } = args as {
        amount: number;
        from: string;
        to: string;
      };

      return Promise.resolve(
        makeRatesFixture({
          amount,
          from,
          to,
          convertedAmount: amount * 2,
          date: `2026-02-${String(20 + amount).padStart(2, "0")}`,
        }),
      );
    });

    render(<CurrencyConverter />);

    const amountInput = await screen.findByLabelText("Enter Amount");
    const button = screen.getByRole("button", { name: /get exchange rate/i });

    for (let amount = 1; amount <= 6; amount += 1) {
      await user.clear(amountInput);
      await user.type(amountInput, String(amount));
      await user.click(button);
      await waitFor(() => expect(getRatesMock).toHaveBeenCalledTimes(amount));
    }

    const history = screen.getByRole("region", { name: /conversion history/i });
    const entries = within(history).getAllByRole("listitem");
    expect(entries).toHaveLength(5);
    expect(entries[0]).toHaveTextContent(/6(\.00|,00)\sUSD\s=\s12(\.00|,00)\sEUR/);
    expect(history).not.toHaveTextContent(/1(\.00|,00)\sUSD\s=\s2(\.00|,00)\sEUR/);

    const savedHistory = JSON.parse(
      window.localStorage.getItem(HISTORY_STORAGE_KEY) ?? "[]",
    ) as unknown[];
    expect(savedHistory).toHaveLength(5);
  });
});
