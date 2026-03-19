import { describe, expect, it } from "vitest";
import { makeFlagFromCurrency } from "./makeFlagFromCurrency";

describe("makeFlagFromCurrency", () => {
  it("generates a flag from the first two letters", () => {
    expect(makeFlagFromCurrency("USD")).toBe("🇺🇸");
    expect(makeFlagFromCurrency("EUR")).toBe("🇪🇺");
    expect(makeFlagFromCurrency("inr")).toBe("🇮🇳");
  });

  it("returns undefined for invalid values", () => {
    expect(makeFlagFromCurrency("")).toBeUndefined();
    expect(makeFlagFromCurrency("U")).toBeUndefined();
    expect(makeFlagFromCurrency("1D")).toBeUndefined();
    expect(makeFlagFromCurrency("💰")).toBeUndefined();
  });
});

