/**
 * Fraction-division — shared, framework-agnostic core.
 *
 * The pedagogy: dividing by a SMALLER piece makes the answer BIGGER.
 * quotient = dividend / divisor, with dividend = 1 whole bar. Drag the divisor
 * (the "piece size") smaller and the count of pieces that fit — the quotient —
 * visibly grows. This is the flagship demo sim (docs/SEED_DATA.md §1).
 *
 * This module is imported by:
 *   - the React component (fraction-division.tsx) that a student actually plays,
 *   - the InvariantRunner probe (below) that proves the pedagogy holds,
 *   - the StubOrchestrator + unit tests.
 * One math implementation, three consumers — no drift.
 */

import type { InvariantSpec, DriveStep } from "@/lib/harness/types";
import type { SimProbe } from "@/lib/harness/invariant-runner";

/** One whole bar is divided into pieces of size `divisor`. */
export const DIVIDEND = 1;

export const DIVISOR_MIN = 0.001;
export const DIVISOR_MAX = 2;
export const DIVISOR_INITIAL = 1;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** The load-bearing relationship: how many pieces of size `divisor` fit in `dividend`. */
export function computeQuotient(dividend: number, divisor: number): number {
  const d = clamp(divisor, DIVISOR_MIN, DIVISOR_MAX);
  return dividend / d;
}

/**
 * The machine-checkable contract the flagship sim is proven against.
 * Mirrors the concrete JSON in docs/COMPLEXITY.md §3.3 verbatim.
 */
export const FRACTION_DIVISION_SPEC: InvariantSpec = {
  version: "1.0",
  renderProbe: { rootTestId: "fraction-division-sim" },
  invariants: [
    {
      kind: "render",
      id: "core-elements-present",
      requireTestIds: ["divisor-slider", "quotient-readout", "fraction-bars"],
    },
    {
      kind: "monotonic",
      id: "quotient-grows-as-divisor-shrinks",
      drive: [
        { action: "setSlider", target: "divisor-slider", value: 0.9 },
        { action: "setSlider", target: "divisor-slider", value: 0.5 },
        { action: "setSlider", target: "divisor-slider", value: 0.25 },
        { action: "setSlider", target: "divisor-slider", value: 0.1 },
      ],
      observe: { probe: "quotientValue" },
      direction: "increasing",
      tolerance: 1e-6,
    },
    {
      kind: "bounds",
      id: "quotient-stays-finite",
      drive: [{ action: "setSlider", target: "divisor-slider", value: 0.001 }],
      observe: { probe: "quotientValue" },
      min: 0,
      max: 100000,
    },
    {
      kind: "determinism",
      id: "seed-stable",
      seed: 42,
      drive: [{ action: "drag", target: "divisor-slider", value: -30 }],
      observe: { probe: "quotientValue" },
    },
  ],
};

/**
 * The probe API the FIXED region of the harness wires. It exposes exactly the
 * same math the React component renders, so a green invariant run genuinely
 * certifies the on-screen sim.
 */
export function createFractionDivisionProbe(dividend = DIVIDEND): SimProbe {
  let divisor = DIVISOR_INITIAL;

  return {
    rootTestId: "fraction-division-sim",
    testIds() {
      return ["divisor-slider", "quotient-readout", "fraction-bars"];
    },
    reset() {
      // Deterministic: the sim has no RNG, so seed is irrelevant — reset is exact.
      divisor = DIVISOR_INITIAL;
    },
    drive(step: DriveStep) {
      switch (step.action) {
        case "setSlider":
          divisor = clamp(step.value ?? divisor, DIVISOR_MIN, DIVISOR_MAX);
          break;
        case "drag":
          // Drag delta maps to piece-size change (px → 0.01 units).
          divisor = clamp(divisor + (step.value ?? 0) * 0.01, DIVISOR_MIN, DIVISOR_MAX);
          break;
        case "tick":
        case "click":
          break;
      }
    },
    read(probe: string): number {
      if (probe === "quotientValue") return computeQuotient(dividend, divisor);
      if (probe === "divisorValue") return divisor;
      return NaN;
    },
  };
}

/**
 * The WRONG relationship a first Codex draft reached for: × instead of ÷.
 * Multiplying by a shrinking piece makes the answer shrink — the opposite of
 * the pedagogy — so the monotonic invariant genuinely fails when run.
 */
export function computeWrongQuotient(dividend: number, divisor: number): number {
  const d = clamp(divisor, DIVISOR_MIN, DIVISOR_MAX);
  return dividend * d; // BUG: multiplied instead of divided
}

/**
 * A deliberately-broken probe (× not ÷). It renders and validates fine, but the
 * InvariantRunner drives it and the `quotient-grows-as-divisor-shrinks`
 * monotonic invariant FAILS — a real, re-run-stable failure, not a canned one.
 */
export function createBrokenFractionDivisionProbe(dividend = DIVIDEND): SimProbe {
  let divisor = DIVISOR_INITIAL;

  return {
    rootTestId: "fraction-division-sim",
    testIds() {
      return ["divisor-slider", "quotient-readout", "fraction-bars"];
    },
    reset() {
      divisor = DIVISOR_INITIAL;
    },
    drive(step: DriveStep) {
      switch (step.action) {
        case "setSlider":
          divisor = clamp(step.value ?? divisor, DIVISOR_MIN, DIVISOR_MAX);
          break;
        case "drag":
          divisor = clamp(divisor + (step.value ?? 0) * 0.01, DIVISOR_MIN, DIVISOR_MAX);
          break;
        case "tick":
        case "click":
          break;
      }
    },
    read(probe: string): number {
      if (probe === "quotientValue") return computeWrongQuotient(dividend, divisor);
      if (probe === "divisorValue") return divisor;
      return NaN;
    },
  };
}

/**
 * The broken first-draft source (× instead of ÷). Passes G2 static validation
 * (no forbidden APIs), renders, then fails its own G3 smoke test — the source
 * behind the honest attempt-2 failure in the build trace.
 */
export const FRACTION_DIVISION_BROKEN_SOURCE = `import { useState } from "react";
import { Slider, FractionBar } from "@chalkbox/kit";

// ===== CODEX-FILL: COMPONENT =====
export function Manipulative() {
  const [divisor, setDivisor] = useState(1);
  const quotient = 1 * divisor; // BUG: multiplied — should be dividend / divisor
  return (
    <div data-testid="fraction-division-sim">
      <Slider data-testid="divisor-slider" min={0.001} max={2}
              value={divisor} onChange={setDivisor} />
      <FractionBar data-testid="fraction-bars" pieces={quotient} />
      <output data-testid="quotient-readout">
        {1} ÷ {divisor.toFixed(2)} = {quotient.toFixed(2)}
      </output>
    </div>
  );
}
// ===== END CODEX-FILL: COMPONENT =====
`;

/**
 * A faithful excerpt of the single-file component source, used as the
 * CompiledArtifact.componentSrc in demo mode. The real engine emits the full
 * bundle here; this string is what the trace UI previews.
 */
export const FRACTION_DIVISION_SOURCE = `import { useState } from "react";
import { Slider, FractionBar } from "@chalkbox/kit";

// ===== CODEX-FILL: COMPONENT =====
export function Manipulative() {
  const [divisor, setDivisor] = useState(1);
  const quotient = 1 / divisor; // dividend ÷ divisor
  return (
    <div data-testid="fraction-division-sim">
      <Slider data-testid="divisor-slider" min={0.001} max={2}
              value={divisor} onChange={setDivisor} />
      <FractionBar data-testid="fraction-bars" pieces={quotient} />
      <output data-testid="quotient-readout">
        {1} ÷ {divisor.toFixed(2)} = {quotient.toFixed(2)}
      </output>
    </div>
  );
}
// ===== END CODEX-FILL: COMPONENT =====
`;
