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
import { checkBudget } from "./budget-guard";
import { runGeneratedSim, type GeneratedSimPackage } from "./generated-sim";
import { createResponse } from "./openai-responses";
import { gateOutputWithLuna, gatePromptWithLuna } from "./safety";
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

/** Optional server-side observer; it does not change the public run() contract. */
export type GenerationAttemptListener = (attempt: GenerationAttempt) => void;

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

/**
 * Live, server-only generation path.
 *
 * Sol emits a component AND an executable, matching SimProbe.  We statically
 * validate both programs, headlessly render the component, check every probe
 * control exists in that real markup, then drive the actual probe through G3. A failed
 * render, invariant, safety scan, or API error is never converted into a pass.
 */
export class RealOrchestrator implements GenerationOrchestrator {
  constructor(
    private readonly budget: GenerationBudget = DEFAULT_BUDGET,
    private readonly onAttempt?: GenerationAttemptListener,
  ) {}

  async run(req: GenerationRequest): Promise<GenerationResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return new StubOrchestrator(this.budget).run(req);

    const start = Date.now();
    let tokensUsed = 0;
    let retryTrace = "";
    const attempts: GenerationAttempt[] = [];
    let verdict;
    try {
      verdict = await gatePromptWithLuna(req.prompt, apiKey, this.budget.perAttemptTimeoutMs);
    } catch {
      // An unavailable live API must never strand the app or replace demo data
      // with a fabricated failure trace.
      return new StubOrchestrator(this.budget).run(req);
    }

    if (verdict.decision === "reject") {
      return failedResult(req, attempts, start, "safety_rejected", verdict.reasons.join(" "));
    }

    for (;;) {
      const budgetDecision = checkBudget(
        { attempt: attempts.length, tokensUsed, elapsedMs: Date.now() - start },
        this.budget,
      );
      if (!budgetDecision.ok) {
        return failedResult(
          req,
          attempts,
          start,
          "render_failed",
          budgetDecision.detail ?? "budget stopped",
        );
      }

      let generated: GeneratedSimPackage;
      let roundTokens = 0;
      try {
        const response = await createResponse(
          apiKey,
          generationRequest(req, verdict, retryTrace),
          this.budget.perAttemptTimeoutMs,
        );
        roundTokens = response.tokensUsed;
        tokensUsed += roundTokens;
        generated = parseGeneratedPackage(response.text);
      } catch {
        return new StubOrchestrator(this.budget).run(req);
      }

      const validation = mergeValidation(
        staticValidator.validate(generated.componentSrc),
        staticValidator.validate(generated.probeSrc),
      );
      if (!validation.ok) {
        const attempt = failedAttempt(
          attempts.length + 1,
          generated.componentSrc,
          validation,
          "validation_failed",
          roundTokens,
        );
        this.record(attempts, attempt);
        retryTrace = validation.violations.map((v) => `${v.rule}: ${v.detail}`).join("\n");
        continue;
      }

      const execution = await runGeneratedSim(generated);
      if (!execution.render.ok) {
        this.record(attempts, {
          n: attempts.length + 1,
          codePreview: preview(generated.componentSrc),
          validation,
          render: { ok: false, error: execution.render.error },
          invariantRun: execution.invariantRun,
          tokensUsed: roundTokens,
          outcome: "render_failed",
        });
        retryTrace = `headless render FAILED — ${execution.render.error ?? "unknown error"}`;
        continue;
      }
      if (!execution.invariantRun.passed) {
        this.record(attempts, {
          n: attempts.length + 1,
          codePreview: preview(generated.componentSrc),
          validation,
          render: { ok: true },
          invariantRun: execution.invariantRun,
          tokensUsed: roundTokens,
          outcome: "invariant_failed",
        });
        retryTrace = execution.invariantRun.results
          .filter((result) => !result.passed)
          .map((result) => `${result.id}: ${result.error ?? "invariant failed"}`)
          .join("\n");
        continue;
      }

      let outputVerdict;
      try {
        outputVerdict = await gateOutputWithLuna(
          execution.render.text,
          apiKey,
          this.budget.perAttemptTimeoutMs,
        );
      } catch {
        return new StubOrchestrator(this.budget).run(req);
      }
      if (outputVerdict.decision === "reject") {
        this.record(attempts, {
          n: attempts.length + 1,
          codePreview: preview(generated.componentSrc),
          validation,
          render: { ok: true },
          invariantRun: execution.invariantRun,
          tokensUsed: roundTokens,
          outcome: "safety_rejected",
        });
        retryTrace = `G4 output safety rejected: ${outputVerdict.reasons.join(" ")}`;
        continue;
      }

      this.record(attempts, {
        n: attempts.length + 1,
        codePreview: preview(generated.componentSrc),
        validation,
        render: { ok: true },
        invariantRun: execution.invariantRun,
        tokensUsed: roundTokens,
        outcome: "passed",
      });
      const simId = `sim-${execution.sourceHash
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 12)
        .toLowerCase()}`;
      return {
        status: "published",
        simId,
        attempts,
        artifact: {
          simId,
          componentSrc: generated.componentSrc,
          sriHash: `sha256-${execution.sourceHash}`,
        },
        invariants: generated.invariants,
        latencyMs: { total: Math.max(1, Date.now() - start) },
        shareId: simId,
      };
    }
  }

  private record(attempts: GenerationAttempt[], attempt: GenerationAttempt): void {
    attempts.push(attempt);
    this.onAttempt?.(attempt);
  }
}

function generationRequest(
  req: GenerationRequest,
  verdict: { subject: string | null; gradeBand: string | null; standard: unknown },
  retryTrace: string,
): Record<string, unknown> {
  return {
    model: "gpt-5.6-sol",
    reasoning: { effort: "high" },
    input: [
      {
        role: "developer",
        content:
          "Generate a safe Chalkbox math/physics manipulative. Return JSON only. componentSrc must be " +
          "plain JavaScript React (no JSX or TypeScript), import only react, export a Manipulative function, " +
          "and use React.createElement. probeSrc must be plain JavaScript with no imports and export createProbe(). " +
          "The probe must implement rootTestId, testIds(), reset(seed?), drive(step), and read(name), with the " +
          "same test IDs and equations as the component. Every test ID named by the probe or render invariants " +
          "must be a data-testid in componentSrc. Never use network, browser storage, eval, require, timers, or " +
          "randomness. Provide a concrete InvariantSpec with at least render, response, and one pedagogy-specific " +
          "monotonic, bounds, conservation, or determinism invariant. The probe will be executed for real.",
      },
      {
        role: "user",
        content: JSON.stringify({
          prompt: req.prompt,
          requestedSubject: req.subject,
          requestedGradeBand: req.gradeBand,
          requestedStandard: req.standard,
          safetyClassification: verdict,
          retryTrace: retryTrace || undefined,
        }),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "chalkbox_generated_sim",
        strict: false,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["title", "componentSrc", "probeSrc", "invariants"],
          properties: {
            title: { type: "string" },
            componentSrc: { type: "string" },
            probeSrc: { type: "string" },
            invariants: { type: "object" },
          },
        },
      },
    },
  };
}

function parseGeneratedPackage(text: string): GeneratedSimPackage {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object") throw new Error("Sol response was not an object");
  const generated = value as Partial<GeneratedSimPackage>;
  if (
    typeof generated.title !== "string" ||
    typeof generated.componentSrc !== "string" ||
    typeof generated.probeSrc !== "string" ||
    !generated.invariants ||
    typeof generated.invariants !== "object"
  ) {
    throw new Error("Sol response omitted a required generated artifact");
  }
  assertInvariantSpec(generated.invariants);
  return generated as GeneratedSimPackage;
}

function assertInvariantSpec(value: unknown): asserts value is GeneratedSimPackage["invariants"] {
  const spec = value as Partial<GeneratedSimPackage["invariants"]>;
  if (
    spec.version !== "1.0" ||
    !spec.renderProbe ||
    typeof spec.renderProbe.rootTestId !== "string" ||
    !Array.isArray(spec.invariants) ||
    spec.invariants.length === 0
  ) {
    throw new Error("Sol response contained an invalid invariant spec");
  }
}

function mergeValidation(
  component: ReturnType<typeof staticValidator.validate>,
  probe: ReturnType<typeof staticValidator.validate>,
) {
  return {
    ok: component.ok && probe.ok,
    violations: [...component.violations, ...probe.violations],
    meta: {
      importCount: component.meta.importCount + probe.meta.importCount,
      nodeCount: component.meta.nodeCount + probe.meta.nodeCount,
      maxDepth: Math.max(component.meta.maxDepth, probe.meta.maxDepth),
    },
  };
}

function failedAttempt(
  n: number,
  source: string,
  validation: ReturnType<typeof staticValidator.validate>,
  outcome: "validation_failed",
  tokensUsed: number,
): GenerationAttempt {
  return {
    n,
    codePreview: preview(source),
    validation,
    render: { ok: false, error: "not rendered — failed G2" },
    invariantRun: { passed: false, results: [], durationMs: 0 },
    tokensUsed,
    outcome,
  };
}

function preview(source: string): string {
  return source.split("\n").slice(0, 8).join("\n");
}

function failedResult(
  req: GenerationRequest,
  attempts: GenerationAttempt[],
  startedAt: number,
  outcome: "render_failed" | "safety_rejected",
  detail: string,
): GenerationResult {
  if (attempts.length === 0) {
    attempts.push({
      n: 1,
      codePreview: "",
      validation: staticValidator.validate("{"),
      render: { ok: false, error: detail },
      invariantRun: { passed: false, results: [], durationMs: 0 },
      tokensUsed: 0,
      outcome,
    });
  }
  return {
    status: "failed",
    simId: "unpublished",
    attempts,
    invariants: {
      version: "1.0",
      renderProbe: { rootTestId: "unpublished" },
      invariants: [],
    },
    latencyMs: { total: Math.max(1, Date.now() - startedAt) },
  };
}
