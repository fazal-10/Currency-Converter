import { describe, expect, it } from "vitest";
import { formatAmount } from "./formatAmount";

describe("formatAmount", () => {
  it("formats to 2 decimal places", () => {
    const formatted = formatAmount(1);
    expect(formatted).toMatch(/1(\.00|,00)$/);
  });

  it("keeps two decimals for fractional values", () => {
    const formatted = formatAmount(1.2);
    expect(formatted).toMatch(/1(\.20|,20)$/);
  });
});

