import { describe, expect, it } from "vitest";
import { convertAmount } from "./convertAmount";

describe("convertAmount", () => {
  it("computes unit rate and returns converted amount", () => {
    const res = convertAmount({ inputAmount: 100, convertedAmount: 120 });
    expect(res.convertedAmount).toBe(120);
    expect(res.unitRate).toBeCloseTo(1.2);
  });

  it("returns unitRate 0 for invalid inputAmount", () => {
    expect(convertAmount({ inputAmount: 0, convertedAmount: 10 }).unitRate).toBe(0);
    expect(convertAmount({ inputAmount: Number.NaN, convertedAmount: 10 }).unitRate).toBe(0);
  });
});

