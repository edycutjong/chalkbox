/**
 * Live-only benchmark. Never run this in CI: it deliberately refuses demo mode
 * and records the real engine's p50/p95 latency and publish rate.
 *
 * Usage: CHALKBOX_DEMO_MODE=false OPENAI_API_KEY=... npm run bench -- 5
 */

import { createOrchestrator } from "../src/lib/harness/orchestrator-factory";
import { DEMO_MODE } from "../src/lib/demo";

const prompts = [
  "Show why a steeper line means a larger rate of change.",
  "Let students discover that doubling speed quadruples kinetic energy.",
  "Show that a heavier and lighter ball fall together without air resistance.",
  "Let students see that subtracting a negative moves right on a number line.",
];

const requested = Number(process.argv[2] ?? prompts.length);
const count = Number.isInteger(requested) && requested > 0 ? requested : prompts.length;

if (DEMO_MODE || !process.env.OPENAI_API_KEY) {
  throw new Error("Refusing benchmark: set OPENAI_API_KEY and CHALKBOX_DEMO_MODE=false.");
}

const latencies: number[] = [];
let successes = 0;
for (let i = 0; i < count; i++) {
  const prompt = prompts[i % prompts.length];
  const result = await createOrchestrator().run({
    prompt,
    subject: prompt.includes("ball") || prompt.includes("kinetic") ? "physics" : "math",
    gradeBand: null,
    standard: null,
  });
  latencies.push(result.latencyMs.total);
  if (result.status === "published") successes++;
  console.log(
    JSON.stringify({ n: i + 1, status: result.status, latencyMs: result.latencyMs.total }),
  );
}

latencies.sort((a, b) => a - b);
const percentile = (p: number) =>
  latencies[Math.min(latencies.length - 1, Math.ceil(p * latencies.length) - 1)];
console.log(
  JSON.stringify({
    prompts: count,
    successRate: successes / count,
    p50LatencyMs: percentile(0.5),
    p95LatencyMs: percentile(0.95),
  }),
);
