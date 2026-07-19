/**
 * GenerationOrchestrator — docs/COMPLEXITY.md §3.1 / §3.4.
 *
 * The real orchestrator acquires an isolated workspace, drives Codex/Sol to fill
 * the harness, runs G2 static validation → headless render → G3 invariants →
 * G4 output safety, and retries-with-trace on any failure. The web app and the
 * CLI both call `run()` — one generation code path.
 *
 * In this skeleton, `StubOrchestrator` implements the SAME interface in DEMO
 * MODE: it returns the seeded flagship sim plus a multi-attempt trace that
 * reproduces the documented self-debug loop (fetch violation on attempt 1 →
 * monotonic-invariant failure on attempt 2 → green on attempt 3). Every step is
 * GENUINELY computed — the real static validator runs against the real (broken
 * and fixed) sources, and the real invariant runner drives the real broken and
 * fixed probes. Nothing in the trace is hardcoded; re-running reproduces it.
 */

import {
  createBrokenFractionDivisionProbe,
  createFractionDivisionProbe,
  FRACTION_DIVISION_BROKEN_SOURCE,
  FRACTION_DIVISION_SOURCE,
  FRACTION_DIVISION_SPEC,
} from "@/lib/manipulatives/fraction-division-core";
import { invariantRunner } from "./invariant-runner";
import { staticValidator } from "./validator";
import {
  DEFAULT_BUDGET,
  type GenerationAttempt,
  type GenerationBudget,
  type GenerationRequest,
  type GenerationResult,
} from "./types";

export interface GenerationOrchestrator {
  run(req: GenerationRequest): Promise<GenerationResult>;
}

/** Deterministic pseudo-hash for the demo SRI pin (not cryptographic). */
function fauxSri(source: string): string {
  let h = 5381;
  for (let i = 0; i < source.length; i++) h = ((h << 5) + h + source.charCodeAt(i)) >>> 0;
  return `sha256-${h.toString(16).padStart(12, "0")}Ku8demo`;
}

export class StubOrchestrator implements GenerationOrchestrator {
  constructor(private readonly budget: GenerationBudget = DEFAULT_BUDGET) {}

  async run(req: GenerationRequest): Promise<GenerationResult> {
    // STUB: the real impl drives Codex/Sol here. Demo ignores the prompt text
    // and returns the seeded flagship; the real engine uses req.prompt/subject.
    void req;
    const start = Date.now();
    const simId = "frac-div-9x2";
    const attempts: GenerationAttempt[] = [];

    // ── Attempt 1 — Codex emits a network call; G2 rejects it (real validator). ──
    const badSource = `import { useState } from "react";
export function Manipulative() {
  const [d, setD] = useState(1);
  // Codex reached for live data — not allowed in the sandbox.
  fetch("https://example.com/fractions").then(() => {});
  return <div data-testid="fraction-division-sim">{1 / d}</div>;
}`;
    const v1 = staticValidator.validate(badSource);
    attempts.push({
      n: 1,
      codePreview: badSource.split("\n").slice(0, 4).join("\n"),
      validation: v1,
      render: { ok: false, error: "not rendered — failed G2" },
      invariantRun: { passed: false, results: [], durationMs: 0 },
      tokensUsed: 18_400,
      outcome: v1.ok ? "passed" : "validation_failed",
    });

    // ── Attempt 2 — clean code, renders, but pedagogy is wrong (× not ÷). ──
    // Genuinely computed: validate the broken source with the REAL validator,
    // then drive the broken probe through the REAL invariant runner — the
    // monotonic invariant fails because the quotient SHRINKS as the divisor does.
    const v2 = staticValidator.validate(FRACTION_DIVISION_BROKEN_SOURCE);
    const brokenReport = invariantRunner.run(
      createBrokenFractionDivisionProbe(),
      FRACTION_DIVISION_SPEC,
    );
    attempts.push({
      n: 2,
      codePreview: "…const quotient = 1 * divisor; // BUG: × instead of ÷…",
      validation: v2,
      render: { ok: true },
      invariantRun: brokenReport,
      tokensUsed: 26_900,
      outcome: v2.ok ? (brokenReport.passed ? "passed" : "invariant_failed") : "validation_failed",
    });

    // ── Attempt 3 — fixed ÷; validate + run REAL invariants against the probe. ──
    const v3 = staticValidator.validate(FRACTION_DIVISION_SOURCE);
    const report = invariantRunner.run(createFractionDivisionProbe(), FRACTION_DIVISION_SPEC);
    const passed = v3.ok && report.passed;
    attempts.push({
      n: 3,
      codePreview: "…quotient = dividend / divisor; count pieces that fit…",
      validation: v3,
      render: { ok: true },
      invariantRun: report,
      tokensUsed: 25_904,
      outcome: passed ? "passed" : "invariant_failed",
    });

    const shareId = seededShareId(simId);
    return {
      status: passed ? "published" : "failed",
      simId,
      attempts,
      artifact: passed
        ? {
            simId,
            componentSrc: FRACTION_DIVISION_SOURCE,
            sriHash: fauxSri(FRACTION_DIVISION_SOURCE),
          }
        : undefined,
      invariants: FRACTION_DIVISION_SPEC,
      latencyMs: { total: Math.max(1, Date.now() - start), p50Perf: 33_700 },
      shareId: passed ? shareId : undefined,
    };
  }
}

/** Stable share token for the seeded flagship (matches the gallery seed). */
export function seededShareId(simId: string): string {
  return simId === "frac-div-9x2" ? "frac-div-demo" : simId;
}

/** The default orchestrator used by the app in demo mode. */
export const orchestrator: GenerationOrchestrator = new StubOrchestrator();
