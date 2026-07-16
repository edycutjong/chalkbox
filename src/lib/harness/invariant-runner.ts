/**
 * InvariantRunner (G3) — docs/COMPLEXITY.md §3.3.
 *
 * Executes an InvariantSpec against a manipulative's exposed probe API,
 * deterministically (fake timers / seeded, no network). This is the crux of
 * the moat: a sim isn't "done" because it renders — it's done because its
 * pedagogical invariants hold under simulated student interaction.
 *
 * In the full engine the probe is driven inside a headless jsdom render. Here
 * it runs against a lightweight `SimProbe` that a manipulative module exports
 * (see src/lib/manipulatives/fraction-division.tsx) — same contract, no DOM.
 */

import type {
  DriveStep,
  Invariant,
  InvariantResult,
  InvariantRunReport,
  InvariantSpec,
} from "./types";

/**
 * The probe API the FIXED region of the harness wires up. The headless runner
 * drives it; the generated component can neither skip nor fake it.
 */
export interface SimProbe {
  /** testId of the mounted root — must match spec.renderProbe.rootTestId. */
  readonly rootTestId: string;
  /** Which interactive control testIds this sim exposes. */
  testIds(): string[];
  /** Reset to initial state; optional seed for determinism checks. */
  reset(seed?: number): void;
  /** Apply one synthetic student interaction. */
  drive(step: DriveStep): void;
  /** Read a named piece of exposed state (e.g. "quotientValue"). */
  read(probe: string): number;
}

function isMonotonic(
  seq: number[],
  direction: "increasing" | "decreasing",
  tolerance: number,
): boolean {
  for (let i = 1; i < seq.length; i++) {
    const delta = seq[i] - seq[i - 1];
    if (direction === "increasing" && delta < -tolerance) return false;
    if (direction === "decreasing" && delta > tolerance) return false;
  }
  return true;
}

function runOne(probe: SimProbe, inv: Invariant): InvariantResult {
  switch (inv.kind) {
    case "render": {
      const present = probe.testIds();
      const missing = inv.requireTestIds.filter((id) => !present.includes(id));
      return {
        id: inv.id,
        kind: inv.kind,
        passed: missing.length === 0,
        expected: `testIds present: ${inv.requireTestIds.join(", ")}`,
        error: missing.length ? `missing testIds: ${missing.join(", ")}` : undefined,
      };
    }

    case "monotonic": {
      probe.reset();
      const observed: number[] = [];
      for (const step of inv.drive) {
        probe.drive(step);
        observed.push(probe.read(inv.observe.probe));
      }
      const tol = inv.tolerance ?? 1e-6;
      const passed = isMonotonic(observed, inv.direction, tol);
      return {
        id: inv.id,
        kind: inv.kind,
        passed,
        observed,
        expected: `${inv.observe.probe} ${inv.direction}`,
        error: passed
          ? undefined
          : `not monotonic ${inv.direction === "increasing" ? "↑" : "↓"}: [${observed
              .map((v) => v.toFixed(2))
              .join(", ")}]`,
      };
    }

    case "bounds": {
      probe.reset();
      const observed: number[] = [];
      for (const step of inv.drive) {
        probe.drive(step);
        observed.push(probe.read(inv.observe.probe));
      }
      const offending = observed.find((v) => !Number.isFinite(v) || v < inv.min || v > inv.max);
      const passed = offending === undefined;
      return {
        id: inv.id,
        kind: inv.kind,
        passed,
        observed,
        expected: `${inv.observe.probe} ∈ [${inv.min}, ${inv.max}]`,
        error: passed ? undefined : `value left bounds: ${offending}`,
      };
    }

    case "response": {
      probe.reset();
      const before = probe.read(inv.observe.probe);
      for (const step of inv.drive) probe.drive(step);
      const after = probe.read(inv.observe.probe);
      const passed = before !== after;
      return {
        id: inv.id,
        kind: inv.kind,
        passed,
        observed: [before, after],
        expected: `${inv.observe.probe} responds to interaction`,
        error: passed ? undefined : `readout did not change (${before})`,
      };
    }

    case "conservation": {
      probe.reset();
      const observed: number[] = [probe.read(inv.observe.probe)];
      for (const step of inv.drive) {
        probe.drive(step);
        observed.push(probe.read(inv.observe.probe));
      }
      const first = observed[0];
      const offending = observed.find((v) => Math.abs(v - first) > inv.epsilon);
      const passed = offending === undefined;
      return {
        id: inv.id,
        kind: inv.kind,
        passed,
        observed,
        expected: `${inv.observe.probe} conserved within ±${inv.epsilon}`,
        error: passed ? undefined : `drift ${Math.abs((offending ?? 0) - first)} > ${inv.epsilon}`,
      };
    }

    case "determinism": {
      const run = (): number => {
        probe.reset(inv.seed);
        for (const step of inv.drive) probe.drive(step);
        return probe.read(inv.observe.probe);
      };
      const a = run();
      const b = run();
      const passed = a === b;
      return {
        id: inv.id,
        kind: inv.kind,
        passed,
        observed: [a, b],
        expected: `same seed ⇒ same ${inv.observe.probe}`,
        error: passed ? undefined : `non-deterministic: ${a} ≠ ${b}`,
      };
    }

    default: {
      // Exhaustiveness guard.
      const _never: never = inv;
      return {
        id: (_never as Invariant).id,
        kind: (_never as Invariant).kind,
        passed: false,
        error: "unknown invariant kind",
      };
    }
  }
}

export class InvariantRunner {
  run(probe: SimProbe, spec: InvariantSpec): InvariantRunReport {
    const start = Date.now();
    const results: InvariantResult[] = [];

    // renderProbe root must exist before any interaction is driven.
    const rootPresent =
      probe.rootTestId === spec.renderProbe.rootTestId && probe.testIds().length >= 0;
    if (!rootPresent) {
      results.push({
        id: "root-render-probe",
        kind: "render",
        passed: false,
        error: `root testId '${spec.renderProbe.rootTestId}' not mounted`,
      });
    }

    for (const inv of spec.invariants) {
      results.push(runOne(probe, inv));
    }

    return {
      passed: results.every((r) => r.passed),
      results,
      durationMs: Math.max(1, Date.now() - start),
    };
  }
}

export const invariantRunner = new InvariantRunner();

/** Format a run report as a retry trace handed back to Codex on failure. */
export function formatInvariantFailures(report: InvariantRunReport): string {
  return report.results
    .filter((r) => !r.passed)
    .map((r) => `invariant '${r.id}' (${r.kind}) FAILED — ${r.error ?? "no detail"}`)
    .join("\n");
}
