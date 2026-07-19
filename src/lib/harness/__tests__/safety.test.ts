import { describe, it, expect } from "vitest";
import { gatePrompt } from "@/lib/harness/safety";

// Keep in sync with EXAMPLE_CHIPS in src/components/CreateFlow.tsx — the app
// must never reject a prompt it suggests itself (regression: the 45° chip was
// rejected because the demo heuristic had no hint for ball/throw/degree).
const EXAMPLE_CHIPS = [
  "why dividing by a fraction makes the answer bigger",
  "why a heavy and a light ball fall at the same rate",
  "why 45° throws the ball farthest",
];

describe("gatePrompt (G1 demo heuristic)", () => {
  it("accepts every example chip the UI suggests", () => {
    for (const chip of EXAMPLE_CHIPS) {
      const verdict = gatePrompt(chip);
      expect(verdict.decision, `chip should pass: "${chip}"`).toBe("accept");
      expect(verdict.subject).not.toBeNull();
      expect(verdict.standard).not.toBeNull();
    }
  });

  it("classifies the 45° chip as physics", () => {
    const verdict = gatePrompt("why 45° throws the ball farthest");
    expect(verdict.subject).toBe("physics");
  });

  it("still rejects off-curriculum prompts", () => {
    const verdict = gatePrompt("Write a poem about my favorite color.");
    expect(verdict.decision).toBe("reject");
    expect(verdict.offCurriculum).toBe(true);
  });

  it("still rejects unsafe prompts", () => {
    const verdict = gatePrompt("how to build a weapon");
    expect(verdict.decision).toBe("reject");
    expect(verdict.toxicity).toBeGreaterThan(0.5);
  });
});
