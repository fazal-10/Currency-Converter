import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CURRENCIES_FIXTURE, makeRatesFixture } from "../test/fixtures";

vi.mock("../api/fetchCurrencies", () => ({
  fetchCurrencies: vi.fn(async () => CURRENCIES_FIXTURE),
}));

const getRatesMock = vi.fn();
vi.mock("../api/getRates", () => ({
  getRates: (args: unknown) => getRatesMock(args),
}));

import { CurrencyConverter } from "./CurrencyConverter";

afterEach(() => {
  vi.clearAllMocks();
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
    expect(await screen.findByText(/100(\.00|,00)\sUSD\s=\s92(\.00|,00)\sEUR/)).toBeInTheDocument();
    expect(screen.getByText(/1\sUSD\s=\s0(\.92|,92)\sEUR/)).toBeInTheDocument();

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
});

