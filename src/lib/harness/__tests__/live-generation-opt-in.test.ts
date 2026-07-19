import { afterEach, describe, expect, it, vi } from "vitest";

const KEYS = ["CHALKBOX_DEMO_MODE", "OPENAI_API_KEY"] as const;

async function liveGenerationWith(
  env: Partial<Record<(typeof KEYS)[number], string>>,
): Promise<boolean> {
  for (const key of KEYS) vi.stubEnv(key, undefined as unknown as string);
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value as string);
  vi.resetModules();
  const { LIVE_GENERATION_ENABLED } = await import("@/lib/demo");
  return LIVE_GENERATION_ENABLED;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("real generation opt-in", () => {
  it("requires both a key and CHALKBOX_DEMO_MODE=false", async () => {
    expect(await liveGenerationWith({})).toBe(false);
    expect(await liveGenerationWith({ OPENAI_API_KEY: "sk-test" })).toBe(false);
    expect(
      await liveGenerationWith({ OPENAI_API_KEY: "sk-test", CHALKBOX_DEMO_MODE: "false" }),
    ).toBe(true);
  });
});
