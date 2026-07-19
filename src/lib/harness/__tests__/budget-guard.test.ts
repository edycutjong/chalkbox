import { describe, it, expect } from "vitest";
import { checkBudget } from "@/lib/harness/budget-guard";
import { DEFAULT_BUDGET } from "@/lib/harness/types";

describe("checkBudget (spend ceiling)", () => {
  it("allows another attempt while under every ceiling", () => {
    const d = checkBudget({ attempt: 1, tokensUsed: 20_000, elapsedMs: 5_000 });
    expect(d.ok).toBe(true);
    expect(d.stop).toBeUndefined();
  });

  it("stops when attempts are exhausted", () => {
    const d = checkBudget({
      attempt: DEFAULT_BUDGET.maxAttempts,
      tokensUsed: 0,
      elapsedMs: 0,
    });
    expect(d.ok).toBe(false);
    expect(d.stop).toBe("attempts_exhausted");
  });

  it("stops at the token ceiling before spending more", () => {
    const d = checkBudget({
      attempt: 1,
      tokensUsed: DEFAULT_BUDGET.maxTokens,
      elapsedMs: 0,
    });
    expect(d.ok).toBe(false);
    expect(d.stop).toBe("token_ceiling");
  });

  it("stops when the wall-clock deadline is reached", () => {
    const d = checkBudget({
      attempt: 1,
      tokensUsed: 0,
      elapsedMs: DEFAULT_BUDGET.maxWallClockMs,
    });
    expect(d.ok).toBe(false);
    expect(d.stop).toBe("wall_clock_exceeded");
  });

  it("reports attempts before tokens before wall-clock when several are breached", () => {
    const d = checkBudget({
      attempt: DEFAULT_BUDGET.maxAttempts,
      tokensUsed: DEFAULT_BUDGET.maxTokens,
      elapsedMs: DEFAULT_BUDGET.maxWallClockMs,
    });
    expect(d.stop).toBe("attempts_exhausted");
  });

  it("respects a caller-supplied budget override", () => {
    const tight = { maxAttempts: 1, maxTokens: 10, maxWallClockMs: 10, perAttemptTimeoutMs: 5 };
    expect(checkBudget({ attempt: 0, tokensUsed: 5, elapsedMs: 5 }, tight).ok).toBe(true);
    expect(checkBudget({ attempt: 1, tokensUsed: 0, elapsedMs: 0 }, tight).stop).toBe(
      "attempts_exhausted",
    );
  });
});
