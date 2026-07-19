import { describe, it, expect } from "vitest";
import { invariantRunner, type SimProbe } from "@/lib/harness/invariant-runner";
import {
  FRACTION_DIVISION_SPEC,
  createFractionDivisionProbe,
  computeQuotient,
} from "@/lib/manipulatives/fraction-division-core";

describe("fraction-division invariants (G3)", () => {
  it("the pedagogy holds: quotient grows as divisor shrinks", () => {
    const report = invariantRunner.run(createFractionDivisionProbe(), FRACTION_DIVISION_SPEC);
    expect(report.passed).toBe(true);
    const mono = report.results.find((r) => r.id === "quotient-grows-as-divisor-shrinks");
    expect(mono?.passed).toBe(true);
    expect(mono?.observed).toEqual([
      computeQuotient(1, 0.9),
      computeQuotient(1, 0.5),
      computeQuotient(1, 0.25),
      computeQuotient(1, 0.1),
    ]);
  });

  it("catches a broken sim that uses × instead of ÷ (monotonicity violated)", () => {
    // A deliberately wrong probe: quotient = dividend * divisor (× not ÷).
    let d = 1;
    const broken: SimProbe = {
      rootTestId: "fraction-division-sim",
      testIds: () => ["divisor-slider", "quotient-readout", "fraction-bars"],
      reset: () => {
        d = 1;
      },
      drive: (step) => {
        if (step.action === "setSlider") d = step.value ?? d;
      },
      read: () => 1 * d, // WRONG: multiply, not divide
    };
    const report = invariantRunner.run(broken, FRACTION_DIVISION_SPEC);
    const mono = report.results.find((r) => r.id === "quotient-grows-as-divisor-shrinks");
    expect(mono?.passed).toBe(false);
    expect(report.passed).toBe(false);
  });
});
