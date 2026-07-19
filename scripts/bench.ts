/**
 * Live-only benchmark. Never run this in CI: it refuses demo mode and records the
 * REAL engine's publish rate + p50/p95 latency over a fixed prompt corpus.
 *
 * Usage: CHALKBOX_DEMO_MODE=false OPENAI_API_KEY=... npm run bench -- 5
 *
 * HONESTY GUARD: RealOrchestrator falls back to the seeded StubOrchestrator on any API
 * failure (bad key / rate limit / no model access) and returns a seeded "published"
 * result. The stub always returns simId "frac-div-9x2", and none of these prompts are
 * fraction-division — so any result with that simId is a silent fallback. It is counted
 * as a fallback (NOT a real success) and excluded from the latency percentiles, so a
 * broken key can never inflate the reported reliability.
 */

import { createOrchestrator } from "../src/lib/harness/orchestrator-factory";
import { LIVE_GENERATION_ENABLED } from "../src/lib/demo";

const STUB_SIM_ID = "frac-div-9x2";

const prompts = [
  "Show why a steeper line means a larger rate of change.",
  "Let students discover that doubling speed quadruples kinetic energy.",
  "Show that a heavier and lighter ball fall together without air resistance.",
  "Let students see that subtracting a negative moves right on a number line.",
];

const requested = Number(process.argv[2] ?? prompts.length);
const count = Number.isInteger(requested) && requested > 0 ? requested : prompts.length;

// Gate on the same seam the factory uses (LIVE_GENERATION_ENABLED = key present AND
// CHALKBOX_DEMO_MODE="false"). This ignores the client-only NEXT_PUBLIC_DEMO_MODE, so a
// .env.local demo default can't silently downgrade the bench to the stub.
if (!LIVE_GENERATION_ENABLED) {
  throw new Error("Refusing benchmark: set OPENAI_API_KEY and CHALKBOX_DEMO_MODE=false.");
}

const realLatencies: number[] = [];
let realPublished = 0;
let fellBack = 0;
let failed = 0;

for (let i = 0; i < count; i++) {
  const prompt = prompts[i % prompts.length];
  let result;
  try {
    result = await createOrchestrator().run({
      prompt,
      subject: prompt.includes("ball") || prompt.includes("kinetic") ? "physics" : "math",
      gradeBand: null,
      standard: null,
    });
  } catch (err) {
    failed++;
    console.log(JSON.stringify({ n: i + 1, status: "error", error: String(err) }));
    continue;
  }

  const isFallback = result.simId === STUB_SIM_ID;
  if (isFallback) {
    fellBack++;
  } else if (result.status === "published") {
    realPublished++;
    realLatencies.push(result.latencyMs.total);
  } else {
    failed++;
  }

  console.log(
    JSON.stringify({
      n: i + 1,
      status: isFallback ? "stub_fallback" : result.status,
      simId: result.simId,
      attempts: result.attempts.length,
      latencyMs: result.latencyMs.total,
    }),
  );
}

realLatencies.sort((a, b) => a - b);
const percentile = (p: number): number | null =>
  realLatencies.length
    ? realLatencies[Math.min(realLatencies.length - 1, Math.ceil(p * realLatencies.length) - 1)]
    : null;

console.log(
  JSON.stringify(
    {
      prompts: count,
      realPublished,
      fellBackToStub: fellBack,
      failed,
      realSuccessRate: realPublished / count,
      p50LatencyMs: percentile(0.5),
      p95LatencyMs: percentile(0.95),
    },
    null,
    2,
  ),
);

if (fellBack > 0) {
  console.error(
    `\n⚠️  ${fellBack}/${count} generation(s) fell back to the seeded stub — the real API failed ` +
      `(check the key, model access, or rate limits). Those are NOT real successes and are ` +
      `excluded from the numbers above.`,
  );
}
