import { describe, expect, it, vi } from "vitest";
import { hitRateLimit } from "@/lib/api/rateLimit";

describe("hitRateLimit", () => {
  it("lässt bis zum Limit durch und meldet dann die Wartezeit", () => {
    const key = `test:${Math.random()}`;
    expect(hitRateLimit(key, 2, 60_000)).toBeNull();
    expect(hitRateLimit(key, 2, 60_000)).toBeNull();
    expect(hitRateLimit(key, 2, 60_000)).toBe(60);
  });

  it("setzt das Fenster nach Ablauf zurück", () => {
    vi.useFakeTimers();
    try {
      const key = `test:${Math.random()}`;
      expect(hitRateLimit(key, 1, 1000)).toBeNull();
      expect(hitRateLimit(key, 1, 1000)).not.toBeNull();
      vi.advanceTimersByTime(1001);
      expect(hitRateLimit(key, 1, 1000)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("zählt Schlüssel unabhängig voneinander", () => {
    const a = `a:${Math.random()}`;
    const b = `b:${Math.random()}`;
    expect(hitRateLimit(a, 1, 60_000)).toBeNull();
    expect(hitRateLimit(b, 1, 60_000)).toBeNull();
  });
});
