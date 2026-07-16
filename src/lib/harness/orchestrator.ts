/**
 * GenerationOrchestrator — docs/COMPLEXITY.md §3.1 / §3.4.
 *
 * The real orchestrator acquires an isolated workspace, drives Codex/Sol to fill
 * the harness, runs G2 static validation → headless render → G3 invariants →
 * G4 output safety, and retries-with-trace on any failure. The web app and the
 * CLI both call `run()` — one generation code path.
 *
 * In this skeleton, `StubOrchestrator` implements the SAME interface in DEMO
 * MODE: it returns the seeded flagship sim plus a canned-but-honest multi-attempt
 * trace that reproduces the documented self-debug loop (fetch violation on
 * attempt 1 → monotonic-invariant failure on attempt 2 → green on attempt 3).
 * Attempt 3's invariant report is GENUINELY computed against the real probe.
 */

import {
  createFractionDivisionProbe,
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
  type InvariantRunReport,
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

/** A canned FAILED invariant report for attempt 2 (used × instead of ÷). */
function cannedMonotonicFailure(): InvariantRunReport {
  return {
    passed: false,
    durationMs: 41,
    results: [
      { id: "core-elements-present", kind: "render", passed: true },
      {
        id: "quotient-grows-as-divisor-shrinks",
        kind: "monotonic",
        passed: false,
        observed: [1.11, 2.0, 4.0, 3.33],
        expected: "quotientValue increasing",
        error: "not monotonic ↑: [1.11, 2.00, 4.00, 3.33] (used × not ÷)",
      },
    ],
  };
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
      outcome: "validation_failed",
    });

    // ── Attempt 2 — clean code, renders, but pedagogy is wrong (monotonic fail). ──
    const v2 = staticValidator.validate(FRACTION_DIVISION_SOURCE);
    attempts.push({
      n: 2,
      codePreview: "…no network; pure kit.FractionBar composition… (used × not ÷)",
      validation: v2,
      render: { ok: true },
      invariantRun: cannedMonotonicFailure(),
      tokensUsed: 26_900,
      outcome: "invariant_failed",
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
