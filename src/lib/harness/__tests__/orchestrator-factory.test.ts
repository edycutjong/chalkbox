import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * createOrchestrator is "the one environment seam" (see orchestrator-factory.ts):
 * it must wire the free StubOrchestrator in every case except a live key AND an
 * explicit demo opt-out. Follows the demoModeWith() pattern in env-safety.test.ts
 * so a live OPENAI_API_KEY exported on the dev machine can never leak in.
 */

const KEYS = ["NEXT_PUBLIC_DEMO_MODE", "CHALKBOX_DEMO_MODE", "OPENAI_API_KEY"] as const;

async function createOrchestratorWith(env: Partial<Record<(typeof KEYS)[number], string>>) {
  for (const key of KEYS) vi.stubEnv(key, undefined as unknown as string);
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value as string);
  vi.resetModules();
  const { createOrchestrator } = await import("@/lib/harness/orchestrator-factory");
  const { StubOrchestrator, RealOrchestrator } = await import("@/lib/harness/orchestrator");
  return { StubOrchestrator, RealOrchestrator, createOrchestrator };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("createOrchestrator (env seam)", () => {
  it("wires the stub orchestrator with no env set (default demo)", async () => {
    const { createOrchestrator, StubOrchestrator } = await createOrchestratorWith({});
    expect(createOrchestrator()).toBeInstanceOf(StubOrchestrator);
  });

  it("wires the stub orchestrator even with a live key, when demo is forced", async () => {
    const { createOrchestrator, StubOrchestrator } = await createOrchestratorWith({
      OPENAI_API_KEY: "sk-test",
      CHALKBOX_DEMO_MODE: "true",
    });
    expect(createOrchestrator()).toBeInstanceOf(StubOrchestrator);
  });

  it("wires the stub orchestrator when only NEXT_PUBLIC_DEMO_MODE forces demo", async () => {
    const { createOrchestrator, StubOrchestrator } = await createOrchestratorWith({
      OPENAI_API_KEY: "sk-test",
      NEXT_PUBLIC_DEMO_MODE: "true",
    });
    expect(createOrchestrator()).toBeInstanceOf(StubOrchestrator);
  });

  it("wires the real orchestrator only when a key is present AND demo is explicitly disabled", async () => {
    const { createOrchestrator, RealOrchestrator } = await createOrchestratorWith({
      OPENAI_API_KEY: "sk-test",
      CHALKBOX_DEMO_MODE: "false",
    });
    expect(createOrchestrator()).toBeInstanceOf(RealOrchestrator);
  });

  it("constructs the real orchestrator with an onAttempt listener without throwing", async () => {
    // Full behavioral proof that the listener actually fires per attempt lives
    // in orchestrator.test.ts (RealOrchestrator, mocked engine); this just
    // proves the factory forwards the argument through the constructor.
    const { createOrchestrator, RealOrchestrator } = await createOrchestratorWith({
      OPENAI_API_KEY: "sk-test",
      CHALKBOX_DEMO_MODE: "false",
    });
    const listener = vi.fn();
    expect(() => createOrchestrator(listener)).not.toThrow();
    expect(createOrchestrator(listener)).toBeInstanceOf(RealOrchestrator);
  });
});
