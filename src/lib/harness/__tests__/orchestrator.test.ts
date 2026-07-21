import { afterEach, describe, expect, it, vi } from "vitest";
import { RealOrchestrator, seededShareId, StubOrchestrator } from "@/lib/harness/orchestrator";
import { DEFAULT_BUDGET, type GenerationRequest } from "@/lib/harness/types";

// ── Mock the ONE network seam every live code path funnels through. No test in
// this file ever hits the real OpenAI endpoint: createResponse is fully
// stubbed and its return values are scripted per test. Both orchestrator.ts's
// `./openai-responses` import and safety.ts's `./openai-responses` import
// resolve to this same mocked module (vi.mock keys by resolved module id, not
// specifier text), so gatePromptWithLuna/gateOutputWithLuna are covered too.
const createResponseMock = vi.fn();
vi.mock("@/lib/harness/openai-responses", () => ({
  createResponse: (...args: unknown[]) => createResponseMock(...(args as [])),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  createResponseMock.mockReset();
});

const req: GenerationRequest = {
  prompt: "show why dividing by a fraction makes the answer bigger",
  subject: "math",
  gradeBand: "6-8",
  standard: { framework: "CCSS", code: "6.NS.A.1" },
};

function acceptVerdictJSON(): string {
  return JSON.stringify({
    decision: "accept",
    reasons: [],
    gradeBand: "6-8",
    subject: "math",
    standard: { framework: "CCSS", code: "6.NS.A.1" },
    toxicity: 0.01,
    offCurriculum: false,
  });
}

function rejectVerdictJSON(reason: string): string {
  return JSON.stringify({
    decision: "reject",
    reasons: [reason],
    gradeBand: null,
    subject: null,
    standard: null,
    toxicity: 0.9,
    offCurriculum: false,
  });
}

const VALID_COMPONENT_SRC = `import React from "react";
export default function Manipulative() {
  return React.createElement("div", { "data-testid": "demo-sim" },
    React.createElement("input", { "data-testid": "value-slider", type: "range" }),
    React.createElement("output", { "data-testid": "value-readout" }, "value"));
}`;

const VALID_PROBE_SRC = `export function createProbe() {
  let value = 0;
  return {
    rootTestId: "demo-sim",
    testIds() { return ["value-slider", "value-readout"]; },
    reset() { value = 0; },
    drive(step) { if (step.target === "value-slider") value = Number(step.value); },
    read() { return value; }
  };
}`;

const VALID_INVARIANTS = {
  version: "1.0",
  renderProbe: { rootTestId: "demo-sim" },
  invariants: [
    { kind: "render", id: "controls", requireTestIds: ["value-slider", "value-readout"] },
    {
      kind: "monotonic",
      id: "value-rises",
      drive: [
        { action: "setSlider", target: "value-slider", value: 1 },
        { action: "setSlider", target: "value-slider", value: 2 },
      ],
      observe: { probe: "value" },
      direction: "increasing",
    },
  ],
};

function validGenJSON(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    title: "demo",
    componentSrc: VALID_COMPONENT_SRC,
    probeSrc: VALID_PROBE_SRC,
    invariants: VALID_INVARIANTS,
    ...overrides,
  });
}

// Fails G2 (IMPORT_NOT_ALLOWED): imports a specifier outside the allowlist.
const BAD_VALIDATION_COMPONENT_SRC = `import axios from "axios";\nexport default function Manipulative() { return null; }`;

// Passes G2 and renders, but the probe references a control that is never
// rendered in the component markup — fails the render/probe-control check.
const RENDER_FAIL_COMPONENT_SRC = `import React from "react";
export default function Manipulative() {
  return React.createElement("div", { "data-testid": "demo-sim" },
    React.createElement("input", { "data-testid": "value-slider", type: "range" }),
    React.createElement("output", { "data-testid": "other-readout" }, "value"));
}`;

// Passes G2, renders, but the monotonic invariant genuinely fails: the probe's
// readout DECREASES as the slider is driven up, violating "increasing".
const INVARIANT_FAIL_PROBE_SRC = `export function createProbe() {
  let value = 0;
  return {
    rootTestId: "demo-sim",
    testIds() { return ["value-slider", "value-readout"]; },
    reset() { value = 0; },
    drive(step) { if (step.target === "value-slider") value = Number(step.value); },
    read() { return -value; }
  };
}`;

function setLiveKey(): void {
  vi.stubEnv("OPENAI_API_KEY", "sk-test");
}

describe("StubOrchestrator (demo mode)", () => {
  it("publishes the seeded flagship after a self-debug retry loop", async () => {
    const orch = new StubOrchestrator();
    const result = await orch.run(req);

    expect(result.status).toBe("published");
    expect(result.shareId).toBe("frac-div-demo");
    expect(result.artifact?.sriHash).toMatch(/^sha256-/);
  });

  it("records an honest multi-attempt trace: fetch fail → monotonic fail → green", async () => {
    const orch = new StubOrchestrator();
    const result = await orch.run({ ...req, standard: null });

    expect(result.attempts).toHaveLength(3);
    expect(result.attempts[0].outcome).toBe("validation_failed");
    expect(result.attempts[1].outcome).toBe("invariant_failed");
    expect(result.attempts[2].outcome).toBe("passed");
    // The final attempt's invariant report is genuinely green.
    expect(result.attempts[2].invariantRun.passed).toBe(true);
  });
});

describe("seededShareId", () => {
  it("maps the seeded flagship sim to its stable demo share token", () => {
    expect(seededShareId("frac-div-9x2")).toBe("frac-div-demo");
  });

  it("passes any other simId through unchanged", () => {
    expect(seededShareId("sim-abc123")).toBe("sim-abc123");
  });
});

describe("RealOrchestrator (live path, fully mocked engine)", () => {
  it("falls back to the stub when no OPENAI_API_KEY is present", async () => {
    vi.stubEnv("OPENAI_API_KEY", undefined as unknown as string);
    const result = await new RealOrchestrator().run(req);
    expect(result.status).toBe("published");
    expect(result.shareId).toBe("frac-div-demo");
    expect(createResponseMock).not.toHaveBeenCalled();
  });

  it("falls back to the stub when the G1 prompt-safety call itself fails", async () => {
    setLiveKey();
    createResponseMock.mockRejectedValueOnce(new Error("network unavailable"));
    const result = await new RealOrchestrator().run(req);
    expect(result.status).toBe("published");
    expect(result.shareId).toBe("frac-div-demo");
    expect(createResponseMock).toHaveBeenCalledTimes(1);
  });

  it("fails closed with safety_rejected when G1 rejects the prompt", async () => {
    setLiveKey();
    createResponseMock.mockResolvedValueOnce({
      text: rejectVerdictJSON("This prompt isn't classroom-appropriate."),
      tokensUsed: 40,
    });
    const result = await new RealOrchestrator().run(req);
    expect(result.status).toBe("failed");
    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0].outcome).toBe("safety_rejected");
  });

  it("stops immediately, bounded, when the budget is exhausted before any attempt", async () => {
    setLiveKey();
    createResponseMock.mockResolvedValueOnce({ text: acceptVerdictJSON(), tokensUsed: 40 });
    const zeroAttemptBudget = { ...DEFAULT_BUDGET, maxAttempts: 0 };
    const result = await new RealOrchestrator(zeroAttemptBudget).run(req);
    expect(result.status).toBe("failed");
    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0].render.error).toContain("maxAttempts=0");
    // Only the G1 call happened — no generation round was ever attempted.
    expect(createResponseMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the stub when a generation round itself errors", async () => {
    setLiveKey();
    createResponseMock
      .mockResolvedValueOnce({ text: acceptVerdictJSON(), tokensUsed: 40 })
      .mockRejectedValueOnce(new Error("upstream 500"));
    const result = await new RealOrchestrator().run(req);
    expect(result.status).toBe("published");
    expect(result.shareId).toBe("frac-div-demo");
  });

  it("falls back to the stub when the model returns an unparseable/incomplete package", async () => {
    setLiveKey();
    createResponseMock
      .mockResolvedValueOnce({ text: acceptVerdictJSON(), tokensUsed: 40 })
      .mockResolvedValueOnce({ text: JSON.stringify({ title: "oops" }), tokensUsed: 900 });
    const result = await new RealOrchestrator().run(req);
    expect(result.status).toBe("published");
    expect(result.shareId).toBe("frac-div-demo");
  });

  it("retries with trace after a G2 validation failure, then publishes", async () => {
    setLiveKey();
    const onAttempt = vi.fn();
    createResponseMock
      .mockResolvedValueOnce({ text: acceptVerdictJSON(), tokensUsed: 40 })
      .mockResolvedValueOnce({
        text: validGenJSON({ componentSrc: BAD_VALIDATION_COMPONENT_SRC }),
        tokensUsed: 1_000,
      })
      .mockResolvedValueOnce({ text: validGenJSON(), tokensUsed: 1_200 })
      .mockResolvedValueOnce({ text: acceptVerdictJSON(), tokensUsed: 30 });

    const result = await new RealOrchestrator(undefined, onAttempt).run(req);

    expect(result.status).toBe("published");
    expect(result.attempts).toHaveLength(2);
    expect(result.attempts[0].outcome).toBe("validation_failed");
    expect(result.attempts[1].outcome).toBe("passed");
    expect(result.artifact?.componentSrc).toBe(VALID_COMPONENT_SRC);
    expect(result.artifact?.sriHash).toMatch(/^sha256-/);
    expect(result.simId).toMatch(/^sim-/);
    expect(result.shareId).toBe(result.simId);
    expect(onAttempt).toHaveBeenCalledTimes(2);
    expect(onAttempt.mock.calls[0][0].n).toBe(1);
    expect(onAttempt.mock.calls[1][0].n).toBe(2);
  });

  it("retries with trace after a render failure (missing probe control), then publishes", async () => {
    setLiveKey();
    createResponseMock
      .mockResolvedValueOnce({ text: acceptVerdictJSON(), tokensUsed: 40 })
      .mockResolvedValueOnce({
        text: validGenJSON({ componentSrc: RENDER_FAIL_COMPONENT_SRC }),
        tokensUsed: 1_000,
      })
      .mockResolvedValueOnce({ text: validGenJSON(), tokensUsed: 1_200 })
      .mockResolvedValueOnce({ text: acceptVerdictJSON(), tokensUsed: 30 });

    const result = await new RealOrchestrator().run(req);

    expect(result.status).toBe("published");
    expect(result.attempts).toHaveLength(2);
    expect(result.attempts[0].outcome).toBe("render_failed");
    expect(result.attempts[0].render.error).toContain("value-readout");
    expect(result.attempts[1].outcome).toBe("passed");
  });

  it("retries with trace after a G3 invariant failure, then publishes", async () => {
    setLiveKey();
    createResponseMock
      .mockResolvedValueOnce({ text: acceptVerdictJSON(), tokensUsed: 40 })
      .mockResolvedValueOnce({
        text: validGenJSON({ probeSrc: INVARIANT_FAIL_PROBE_SRC }),
        tokensUsed: 1_000,
      })
      .mockResolvedValueOnce({ text: validGenJSON(), tokensUsed: 1_200 })
      .mockResolvedValueOnce({ text: acceptVerdictJSON(), tokensUsed: 30 });

    const result = await new RealOrchestrator().run(req);

    expect(result.status).toBe("published");
    expect(result.attempts).toHaveLength(2);
    expect(result.attempts[0].outcome).toBe("invariant_failed");
    expect(result.attempts[0].invariantRun.passed).toBe(false);
    expect(result.attempts[1].outcome).toBe("passed");
  });

  it("retries with trace after G4 output-safety rejects a clean render, then publishes", async () => {
    setLiveKey();
    createResponseMock
      .mockResolvedValueOnce({ text: acceptVerdictJSON(), tokensUsed: 40 })
      .mockResolvedValueOnce({ text: validGenJSON(), tokensUsed: 1_000 })
      .mockResolvedValueOnce({ text: rejectVerdictJSON("off-curriculum label"), tokensUsed: 20 })
      .mockResolvedValueOnce({ text: validGenJSON(), tokensUsed: 1_200 })
      .mockResolvedValueOnce({ text: acceptVerdictJSON(), tokensUsed: 30 });

    const result = await new RealOrchestrator().run(req);

    expect(result.status).toBe("published");
    expect(result.attempts).toHaveLength(2);
    expect(result.attempts[0].outcome).toBe("safety_rejected");
    expect(result.attempts[1].outcome).toBe("passed");
  });

  it("falls back to the stub when the G4 output-safety call itself fails", async () => {
    setLiveKey();
    createResponseMock
      .mockResolvedValueOnce({ text: acceptVerdictJSON(), tokensUsed: 40 })
      .mockResolvedValueOnce({ text: validGenJSON(), tokensUsed: 1_000 })
      .mockRejectedValueOnce(new Error("luna unavailable"));

    const result = await new RealOrchestrator().run(req);
    expect(result.status).toBe("published");
    expect(result.shareId).toBe("frac-div-demo");
  });

  it("normalizes a lenient invariant spec (type-alias + missing renderProbe/version) instead of hard-failing", async () => {
    setLiveKey();
    // Sol emits `type` instead of `kind`, and omits `renderProbe`/`version`
    // entirely. normalizeInvariantSpec() must default these rather than throw
    // parseGeneratedPackage — the docstring's "well-formed-enough spec reaches
    // the REAL gates" contract. The derived renderProbe root is guessed from
    // the render invariant's first requireTestId ("value-slider"), which is
    // NOT the probe's actual rootTestId ("demo-sim") — so this first attempt
    // legitimately fails at G3 (root mismatch) and retries, exactly like a
    // real malformed-but-parseable Sol reply would.
    const lenientInvariants = {
      invariants: [
        { kind: "render", id: "controls", requireTestIds: ["value-slider"] },
        {
          type: "monotonic",
          id: "value-rises",
          drive: [
            { action: "setSlider", target: "value-slider", value: 1 },
            { action: "setSlider", target: "value-slider", value: 2 },
          ],
          observe: { probe: "value" },
          direction: "increasing",
        },
      ],
    };
    createResponseMock
      .mockResolvedValueOnce({ text: acceptVerdictJSON(), tokensUsed: 40 })
      .mockResolvedValueOnce({
        text: validGenJSON({ invariants: lenientInvariants }),
        tokensUsed: 1_000,
      })
      .mockResolvedValueOnce({ text: validGenJSON(), tokensUsed: 1_200 })
      .mockResolvedValueOnce({ text: acceptVerdictJSON(), tokensUsed: 30 });

    const result = await new RealOrchestrator().run(req);

    expect(result.status).toBe("published");
    expect(result.attempts).toHaveLength(2);
    // Parsing succeeded (no fallback to Stub) — it legitimately reached G3 and
    // failed there on the guessed root, not on a parse/validation error.
    expect(result.attempts[0].outcome).toBe("invariant_failed");
    expect(result.attempts[0].validation.ok).toBe(true);
    expect(result.attempts[1].outcome).toBe("passed");
  });

  it("never loops unbounded: a persistently failing engine stops at maxAttempts", async () => {
    setLiveKey();
    const tightBudget = { ...DEFAULT_BUDGET, maxAttempts: 2 };
    createResponseMock
      .mockResolvedValueOnce({ text: acceptVerdictJSON(), tokensUsed: 40 })
      .mockResolvedValue({
        text: validGenJSON({ componentSrc: BAD_VALIDATION_COMPONENT_SRC }),
        tokensUsed: 1_000,
      });

    const result = await new RealOrchestrator(tightBudget).run(req);

    expect(result.status).toBe("failed");
    // Exactly maxAttempts real attempts were recorded — no synthetic extra
    // attempt is appended, and the loop provably terminated.
    expect(result.attempts).toHaveLength(2);
    expect(result.attempts.every((a) => a.outcome === "validation_failed")).toBe(true);
    // G1 + 2 generation rounds = 3 calls; the loop never started a 3rd round.
    expect(createResponseMock).toHaveBeenCalledTimes(3);
  });
});
