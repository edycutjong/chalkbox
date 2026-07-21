import { afterEach, describe, expect, it, vi } from "vitest";
import {
  gatePrompt,
  gateOutput,
  gatePromptWithLuna,
  gateOutputWithLuna,
} from "@/lib/harness/safety";

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

  it("rejects an empty (or whitespace-only) prompt", () => {
    const verdict = gatePrompt("   ");
    expect(verdict.decision).toBe("reject");
    expect(verdict.reasons).toEqual(["Empty prompt."]);
    expect(verdict.subject).toBeNull();
    expect(verdict.gradeBand).toBeNull();
    expect(verdict.standard).toBeNull();
    expect(verdict.offCurriculum).toBe(true);
  });

  it("infers the slope standard for math prompts mentioning slope", () => {
    expect(gatePrompt("why slope stays constant on a line").standard).toEqual({
      framework: "CCSS",
      code: "8.EE.B.5",
    });
  });

  it("infers the negative-number standard", () => {
    expect(gatePrompt("comparing negative numbers on a number line").standard).toEqual({
      framework: "CCSS",
      code: "7.NS.A.1",
    });
  });

  it("defaults math prompts with no specific hint to 6.NS.A.1", () => {
    expect(gatePrompt("ratio of red to blue counters").standard).toEqual({
      framework: "CCSS",
      code: "6.NS.A.1",
    });
  });

  it("infers the free-fall NGSS standard for physics prompts", () => {
    expect(gatePrompt("why objects fall due to gravity").standard).toEqual({
      framework: "NGSS",
      code: "HS-PS2-1",
    });
  });

  it("infers the kinetic-energy NGSS standard for physics prompts", () => {
    expect(gatePrompt("kinetic energy of a rolling ball").standard).toEqual({
      framework: "NGSS",
      code: "MS-PS3-1",
    });
  });

  it("defaults physics prompts with no specific hint to MS-PS2-2", () => {
    expect(gatePrompt("momentum of two colliding balls").standard).toEqual({
      framework: "NGSS",
      code: "MS-PS2-2",
    });
  });
});

describe("gateOutput (G4 demo heuristic)", () => {
  it("always accepts in demo mode regardless of the rendered labels", () => {
    const verdict = gateOutput(["some", "rendered", "labels"]);
    expect(verdict).toEqual({
      decision: "accept",
      reasons: [],
      gradeBand: null,
      subject: null,
      standard: null,
      toxicity: 0,
      offCurriculum: false,
    });
  });

  it("accepts an empty label list too", () => {
    expect(gateOutput([]).decision).toBe("accept");
  });
});

// ── Live Luna paths (gatePromptWithLuna / gateOutputWithLuna). These are the
// server-only functions the RealOrchestrator calls; here they're tested in
// isolation with `createResponse` fully mocked so no network call ever fires.
// See orchestrator.test.ts for the end-to-end wiring through the orchestrator.
const createResponseMock = vi.fn();
vi.mock("@/lib/harness/openai-responses", () => ({
  createResponse: (...args: unknown[]) => createResponseMock(...(args as [])),
}));

afterEach(() => {
  createResponseMock.mockReset();
});

describe("gatePromptWithLuna (live G1)", () => {
  it("returns the model's verdict verbatim when it is well-formed", async () => {
    createResponseMock.mockResolvedValueOnce({
      text: JSON.stringify({
        decision: "accept",
        reasons: [],
        gradeBand: "9-12",
        subject: "physics",
        standard: { framework: "NGSS", code: "HS-PS2-1" },
        toxicity: 0.02,
        offCurriculum: false,
      }),
      tokensUsed: 12,
    });

    const verdict = await gatePromptWithLuna(
      "why do heavier balls fall the same?",
      "sk-test",
      5_000,
    );

    expect(verdict).toEqual({
      decision: "accept",
      reasons: [],
      gradeBand: "9-12",
      subject: "physics",
      standard: { framework: "NGSS", code: "HS-PS2-1" },
      toxicity: 0.02,
      offCurriculum: false,
    });
    expect(createResponseMock).toHaveBeenCalledTimes(1);
    const [apiKey, body, timeoutMs] = createResponseMock.mock.calls[0];
    expect(apiKey).toBe("sk-test");
    expect(timeoutMs).toBe(5_000);
    expect((body as { model: string }).model).toBe("gpt-5.6-luna");
    const input = (body as { input: Array<{ role: string; content: string }> }).input;
    expect(input[0].role).toBe("developer");
    expect(input[1]).toEqual({ role: "user", content: "why do heavier balls fall the same?" });
  });

  it("falls back to the deterministic heuristic when the model reply is malformed JSON shape", async () => {
    const prompt = "why dividing by a fraction makes the answer bigger";
    createResponseMock.mockResolvedValueOnce({
      text: JSON.stringify({ nonsense: true }),
      tokensUsed: 1,
    });

    const verdict = await gatePromptWithLuna(prompt, "sk-test", 5_000);
    expect(verdict).toEqual(gatePrompt(prompt));
  });

  it("falls back when decision is not accept/reject", async () => {
    const prompt = "why dividing by a fraction makes the answer bigger";
    createResponseMock.mockResolvedValueOnce({
      text: JSON.stringify({ decision: "maybe", reasons: [], toxicity: 0, offCurriculum: false }),
      tokensUsed: 1,
    });
    expect(await gatePromptWithLuna(prompt, "sk-test", 5_000)).toEqual(gatePrompt(prompt));
  });

  it("falls back when reasons is not an array", async () => {
    const prompt = "why dividing by a fraction makes the answer bigger";
    createResponseMock.mockResolvedValueOnce({
      text: JSON.stringify({
        decision: "accept",
        reasons: "nope",
        toxicity: 0,
        offCurriculum: false,
      }),
      tokensUsed: 1,
    });
    expect(await gatePromptWithLuna(prompt, "sk-test", 5_000)).toEqual(gatePrompt(prompt));
  });

  it("falls back when toxicity is not a number", async () => {
    const prompt = "why dividing by a fraction makes the answer bigger";
    createResponseMock.mockResolvedValueOnce({
      text: JSON.stringify({
        decision: "accept",
        reasons: [],
        toxicity: "low",
        offCurriculum: false,
      }),
      tokensUsed: 1,
    });
    expect(await gatePromptWithLuna(prompt, "sk-test", 5_000)).toEqual(gatePrompt(prompt));
  });

  it("falls back when offCurriculum is not a boolean", async () => {
    const prompt = "why dividing by a fraction makes the answer bigger";
    createResponseMock.mockResolvedValueOnce({
      text: JSON.stringify({ decision: "accept", reasons: [], toxicity: 0, offCurriculum: "no" }),
      tokensUsed: 1,
    });
    expect(await gatePromptWithLuna(prompt, "sk-test", 5_000)).toEqual(gatePrompt(prompt));
  });

  it("falls back when the parsed JSON is not an object (e.g. null)", async () => {
    const prompt = "why dividing by a fraction makes the answer bigger";
    createResponseMock.mockResolvedValueOnce({ text: "null", tokensUsed: 1 });
    expect(await gatePromptWithLuna(prompt, "sk-test", 5_000)).toEqual(gatePrompt(prompt));
  });

  it("clamps out-of-range toxicity into [0, 1]", async () => {
    createResponseMock.mockResolvedValueOnce({
      text: JSON.stringify({ decision: "accept", reasons: [], toxicity: 5, offCurriculum: false }),
      tokensUsed: 1,
    });
    expect((await gatePromptWithLuna("x", "sk-test", 5_000)).toxicity).toBe(1);

    createResponseMock.mockResolvedValueOnce({
      text: JSON.stringify({ decision: "accept", reasons: [], toxicity: -3, offCurriculum: false }),
      tokensUsed: 1,
    });
    expect((await gatePromptWithLuna("x", "sk-test", 5_000)).toxicity).toBe(0);
  });

  it("normalizes an invalid gradeBand/subject/standard to null and filters non-string reasons", async () => {
    createResponseMock.mockResolvedValueOnce({
      text: JSON.stringify({
        decision: "accept",
        reasons: ["ok", 42, null],
        gradeBand: "college",
        subject: "chemistry",
        standard: { framework: "XYZ", code: "1" },
        toxicity: 0.1,
        offCurriculum: false,
      }),
      tokensUsed: 1,
    });
    const verdict = await gatePromptWithLuna("x", "sk-test", 5_000);
    expect(verdict.reasons).toEqual(["ok"]);
    expect(verdict.gradeBand).toBeNull();
    expect(verdict.subject).toBeNull();
    expect(verdict.standard).toBeNull();
  });

  it("propagates a network failure to the caller (RealOrchestrator catches it)", async () => {
    createResponseMock.mockRejectedValueOnce(new Error("timeout"));
    await expect(gatePromptWithLuna("x", "sk-test", 5_000)).rejects.toThrow("timeout");
  });
});

describe("gateOutputWithLuna (live G4)", () => {
  it("joins the rendered labels into the user message and returns the parsed verdict", async () => {
    createResponseMock.mockResolvedValueOnce({
      text: JSON.stringify({
        decision: "reject",
        reasons: ["off-curriculum label"],
        gradeBand: null,
        subject: null,
        standard: null,
        toxicity: 0.2,
        offCurriculum: true,
      }),
      tokensUsed: 5,
    });

    const verdict = await gateOutputWithLuna(["divide", "the", "bar"], "sk-test", 5_000);
    expect(verdict.decision).toBe("reject");
    expect(verdict.reasons).toEqual(["off-curriculum label"]);
    const [, body] = createResponseMock.mock.calls[0];
    const input = (body as { input: Array<{ role: string; content: string }> }).input;
    expect(input[1]).toEqual({ role: "user", content: "divide the bar" });
  });

  it("falls back to the deterministic (always-accept) heuristic on a malformed reply", async () => {
    createResponseMock.mockResolvedValueOnce({ text: "{}", tokensUsed: 1 });
    const verdict = await gateOutputWithLuna(["a", "b"], "sk-test", 5_000);
    expect(verdict).toEqual(gateOutput(["a", "b"]));
  });
});
