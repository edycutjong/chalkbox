import { describe, it, expect } from "vitest";
import { StubOrchestrator } from "@/lib/harness/orchestrator";

describe("StubOrchestrator (demo mode)", () => {
  it("publishes the seeded flagship after a self-debug retry loop", async () => {
    const orch = new StubOrchestrator();
    const result = await orch.run({
      prompt: "show why dividing by a fraction makes the answer bigger",
      subject: "math",
      gradeBand: "6-8",
      standard: { framework: "CCSS", code: "6.NS.A.1" },
    });

    expect(result.status).toBe("published");
    expect(result.shareId).toBe("frac-div-demo");
    expect(result.artifact?.sriHash).toMatch(/^sha256-/);
  });

  it("records an honest multi-attempt trace: fetch fail → monotonic fail → green", async () => {
    const orch = new StubOrchestrator();
    const result = await orch.run({
      prompt: "show why dividing by a fraction makes the answer bigger",
      subject: "math",
      gradeBand: "6-8",
      standard: null,
    });

    expect(result.attempts).toHaveLength(3);
    expect(result.attempts[0].outcome).toBe("validation_failed");
    expect(result.attempts[1].outcome).toBe("invariant_failed");
    expect(result.attempts[2].outcome).toBe("passed");
    // The final attempt's invariant report is genuinely green.
    expect(result.attempts[2].invariantRun.passed).toBe(true);
  });
});
