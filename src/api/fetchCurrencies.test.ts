import { describe, expect, it, vi } from "vitest";
import { fetchCurrencies } from "./fetchCurrencies";

describe("fetchCurrencies", () => {
  it("returns a sorted list of currencies", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ USD: "United States Dollar", EUR: "Euro" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchCurrencies();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.map((c) => c.code)).toEqual(["EUR", "USD"]);
    expect(result.find((c) => c.code === "USD")?.name).toBe("United States Dollar");
  });

  it("throws on non-OK responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchCurrencies()).rejects.toThrow(/Frankfurter API error/);
  });
});

