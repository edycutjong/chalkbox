import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * Spend-safety guard for DEMO_MODE resolution (src/lib/demo.ts).
 *
 * DEMO_MODE decides whether a generation call hits the STUB (free) or the real
 * Codex engine (bills OPENAI_API_KEY). These tests pin the resolution so a
 * future refactor can never silently make the real, spending path the default,
 * and they prove the vitest env guard forces demo mode even on a machine that
 * has a live key exported. See OPTION_3_RUNBOOK.md.
 */

const KEYS = ["NEXT_PUBLIC_DEMO_MODE", "CHALKBOX_DEMO_MODE", "OPENAI_API_KEY"] as const;

/** Load DEMO_MODE fresh under a specific env; vi.unstubAllEnvs restores after each test. */
async function demoModeWith(env: Partial<Record<(typeof KEYS)[number], string>>): Promise<boolean> {
  for (const k of KEYS) vi.stubEnv(k, undefined as unknown as string); // clear all three
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v as string);
  vi.resetModules();
  const { DEMO_MODE } = await import("@/lib/demo");
  return DEMO_MODE;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("DEMO_MODE resolution (spend safety)", () => {
  it("defaults to demo (free) when no env is set", async () => {
    expect(await demoModeWith({})).toBe(true);
  });

  it("stays in demo when a key is present but demo is explicitly forced", async () => {
    expect(await demoModeWith({ OPENAI_API_KEY: "sk-test", CHALKBOX_DEMO_MODE: "true" })).toBe(
      true,
    );
  });

  it("NEXT_PUBLIC_DEMO_MODE=true also forces demo even with a key present", async () => {
    expect(await demoModeWith({ OPENAI_API_KEY: "sk-test", NEXT_PUBLIC_DEMO_MODE: "true" })).toBe(
      true,
    );
  });

  it("enters real mode only when a key is present AND demo is not forced", async () => {
    expect(await demoModeWith({ OPENAI_API_KEY: "sk-test", CHALKBOX_DEMO_MODE: "false" })).toBe(
      false,
    );
  });

  it("a key alone (no explicit demo flag) enters real mode", async () => {
    expect(await demoModeWith({ OPENAI_API_KEY: "sk-test" })).toBe(false);
  });

  it("explicit CHALKBOX_DEMO_MODE=false opts into real mode even with no key", async () => {
    // Documents the actual precedence: an explicit opt-out wins over the
    // no-key default. It cannot spend (no key), but it is NOT demo mode.
    expect(await demoModeWith({ CHALKBOX_DEMO_MODE: "false" })).toBe(false);
  });

  it("the test suite itself runs in demo mode (vitest env guard forces it)", async () => {
    // No stubbing here: proves vitest.config.ts `env: { CHALKBOX_DEMO_MODE }`
    // pins demo mode on this machine, which has a live OPENAI_API_KEY exported.
    const { DEMO_MODE } = await import("@/lib/demo");
    expect(DEMO_MODE).toBe(true);
  });
});
