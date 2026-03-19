import { describe, expect, it, vi } from "vitest";
import { getRates } from "./getRates";

describe("getRates", () => {
  it("calls /latest for different currencies", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        amount: 10,
        base: "GBP",
        date: "2026-02-25",
        rates: { USD: 12.34 },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const res = await getRates({ amount: 10, from: "GBP", to: "USD" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "/latest?amount=10&from=GBP&to=USD",
    );
    expect(res.rates.USD).toBe(12.34);
  });

  it("throws on non-OK responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(getRates({ amount: 10, from: "GBP", to: "USD" })).rejects.toThrow(
      /Frankfurter API error/,
    );
  });

  it("short-circuits when from === to", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await getRates({ amount: 10, from: "USD", to: "USD" });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(res.base).toBe("USD");
    expect(res.rates.USD).toBe(10);
  });
});

