import { describe, it, expect } from "vitest";
import {
  invariantRunner,
  formatInvariantFailures,
  type SimProbe,
} from "@/lib/harness/invariant-runner";
import type { InvariantSpec } from "@/lib/harness/types";
import {
  FRACTION_DIVISION_SPEC,
  createFractionDivisionProbe,
  createBrokenFractionDivisionProbe,
  computeQuotient,
  computeWrongQuotient,
  clamp,
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

  it("the seeded flagship also proves the bounds and determinism invariants", () => {
    const report = invariantRunner.run(createFractionDivisionProbe(), FRACTION_DIVISION_SPEC);
    const bounds = report.results.find((r) => r.id === "quotient-stays-finite");
    expect(bounds?.passed).toBe(true);
    const determinism = report.results.find((r) => r.id === "seed-stable");
    expect(determinism?.passed).toBe(true);
    expect(determinism?.observed?.[0]).toBe(determinism?.observed?.[1]);
  });

  it("clamp saturates at both the low and high ends", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(50, 0, 10)).toBe(10);
    expect(clamp(4, 0, 10)).toBe(4);
  });

  it("computeWrongQuotient multiplies instead of dividing (the deliberate bug)", () => {
    expect(computeWrongQuotient(1, 0.5)).toBe(0.5);
    expect(computeWrongQuotient(1, 0.5)).not.toBe(computeQuotient(1, 0.5));
  });

  it("the fixed probe supports drag, tick, click and the divisorValue readout", () => {
    const probe = createFractionDivisionProbe();
    probe.drive({ action: "drag", target: "divisor-slider", value: -30 });
    expect(probe.read("divisorValue")).toBeCloseTo(0.7, 6);
    probe.drive({ action: "tick", target: "divisor-slider" });
    probe.drive({ action: "click", target: "divisor-slider" });
    expect(probe.read("divisorValue")).toBeCloseTo(0.7, 6); // tick/click are no-ops
    expect(Number.isNaN(probe.read("unknown-probe"))).toBe(true);
  });

  it("the broken probe also supports drag/tick/click and its own divisorValue/unknown reads", () => {
    const probe = createBrokenFractionDivisionProbe();
    probe.drive({ action: "drag", target: "divisor-slider", value: -30 });
    expect(probe.read("divisorValue")).toBeCloseTo(0.7, 6);
    expect(probe.read("quotientValue")).toBeCloseTo(computeWrongQuotient(1, 0.7), 6);
    probe.drive({ action: "tick", target: "divisor-slider" });
    probe.drive({ action: "click", target: "divisor-slider" });
    expect(Number.isNaN(probe.read("unknown-probe"))).toBe(true);
    probe.reset();
    expect(probe.read("divisorValue")).toBe(1);
  });
});

/** A minimal, fully controllable probe for exercising each invariant kind in isolation. */
function makeProbe(overrides: Partial<SimProbe> = {}): SimProbe {
  let value = 0;
  return {
    rootTestId: "widget-root",
    testIds: () => ["slider"],
    reset: (seed) => {
      value = seed ?? 0;
    },
    drive: (step) => {
      value += step.value ?? 1;
    },
    read: () => value,
    ...overrides,
  };
}

const oneStepDrive = [{ action: "setSlider" as const, target: "slider", value: 1 }];

describe("InvariantRunner — render probe root", () => {
  it("fails root-render-probe when the probe's rootTestId does not match the spec", () => {
    const probe = makeProbe({ rootTestId: "wrong-root" });
    const spec: InvariantSpec = {
      version: "1.0",
      renderProbe: { rootTestId: "widget-root" },
      invariants: [],
    };
    const report = invariantRunner.run(probe, spec);
    expect(report.passed).toBe(false);
    const rootResult = report.results.find((r) => r.id === "root-render-probe");
    expect(rootResult?.passed).toBe(false);
    expect(rootResult?.error).toContain("widget-root");
  });

  it("passes root-render-probe (and yields an empty report) when there are no invariants", () => {
    const probe = makeProbe();
    const spec: InvariantSpec = {
      version: "1.0",
      renderProbe: { rootTestId: "widget-root" },
      invariants: [],
    };
    const report = invariantRunner.run(probe, spec);
    expect(report.passed).toBe(true);
    expect(report.results).toHaveLength(0);
  });
});

describe("InvariantRunner — render invariant", () => {
  it("passes when every required testId is present", () => {
    const probe = makeProbe();
    const report = invariantRunner.run(probe, {
      version: "1.0",
      renderProbe: { rootTestId: "widget-root" },
      invariants: [{ kind: "render", id: "controls", requireTestIds: ["slider"] }],
    });
    expect(report.results.find((r) => r.id === "controls")?.passed).toBe(true);
  });

  it("fails and reports the missing testIds", () => {
    const probe = makeProbe();
    const report = invariantRunner.run(probe, {
      version: "1.0",
      renderProbe: { rootTestId: "widget-root" },
      invariants: [{ kind: "render", id: "controls", requireTestIds: ["slider", "readout"] }],
    });
    const result = report.results.find((r) => r.id === "controls");
    expect(result?.passed).toBe(false);
    expect(result?.error).toContain("readout");
  });
});

describe("InvariantRunner — bounds invariant", () => {
  it("passes when every observed value stays within [min, max]", () => {
    const probe = makeProbe();
    const report = invariantRunner.run(probe, {
      version: "1.0",
      renderProbe: { rootTestId: "widget-root" },
      invariants: [
        {
          kind: "bounds",
          id: "in-range",
          drive: oneStepDrive,
          observe: { probe: "value" },
          min: 0,
          max: 10,
        },
      ],
    });
    const result = report.results.find((r) => r.id === "in-range");
    expect(result?.passed).toBe(true);
    expect(result?.observed).toEqual([1]);
  });

  it("fails when an observed value leaves the bounds", () => {
    const probe = makeProbe();
    const report = invariantRunner.run(probe, {
      version: "1.0",
      renderProbe: { rootTestId: "widget-root" },
      invariants: [
        {
          kind: "bounds",
          id: "too-tight",
          drive: oneStepDrive,
          observe: { probe: "value" },
          min: 5,
          max: 10,
        },
      ],
    });
    const result = report.results.find((r) => r.id === "too-tight");
    expect(result?.passed).toBe(false);
    expect(result?.error).toContain("value left bounds");
  });
});

describe("InvariantRunner — response invariant", () => {
  it("passes when the observed readout changes after driving", () => {
    const probe = makeProbe();
    const report = invariantRunner.run(probe, {
      version: "1.0",
      renderProbe: { rootTestId: "widget-root" },
      invariants: [
        { kind: "response", id: "reacts", drive: oneStepDrive, observe: { probe: "value" } },
      ],
    });
    const result = report.results.find((r) => r.id === "reacts");
    expect(result?.passed).toBe(true);
    expect(result?.observed).toEqual([0, 1]);
  });

  it("fails when the readout never changes", () => {
    const probe = makeProbe({ drive: () => {} });
    const report = invariantRunner.run(probe, {
      version: "1.0",
      renderProbe: { rootTestId: "widget-root" },
      invariants: [
        { kind: "response", id: "static", drive: oneStepDrive, observe: { probe: "value" } },
      ],
    });
    const result = report.results.find((r) => r.id === "static");
    expect(result?.passed).toBe(false);
    expect(result?.error).toContain("did not change");
  });
});

describe("InvariantRunner — conservation invariant", () => {
  it("passes when the observed quantity stays within epsilon of its initial value", () => {
    const probe = makeProbe({ drive: () => {} }); // driving never moves the value
    const report = invariantRunner.run(probe, {
      version: "1.0",
      renderProbe: { rootTestId: "widget-root" },
      invariants: [
        {
          kind: "conservation",
          id: "conserved",
          drive: oneStepDrive,
          observe: { probe: "value" },
          epsilon: 0.001,
        },
      ],
    });
    const result = report.results.find((r) => r.id === "conserved");
    expect(result?.passed).toBe(true);
  });

  it("fails when the observed quantity drifts beyond epsilon", () => {
    const probe = makeProbe();
    const report = invariantRunner.run(probe, {
      version: "1.0",
      renderProbe: { rootTestId: "widget-root" },
      invariants: [
        {
          kind: "conservation",
          id: "drifts",
          drive: oneStepDrive,
          observe: { probe: "value" },
          epsilon: 0.001,
        },
      ],
    });
    const result = report.results.find((r) => r.id === "drifts");
    expect(result?.passed).toBe(false);
    expect(result?.error).toContain("drift");
  });
});

describe("InvariantRunner — determinism invariant", () => {
  it("passes when the same seed reproduces the same observed value", () => {
    const probe = makeProbe();
    const report = invariantRunner.run(probe, {
      version: "1.0",
      renderProbe: { rootTestId: "widget-root" },
      invariants: [
        {
          kind: "determinism",
          id: "stable",
          seed: 7,
          drive: oneStepDrive,
          observe: { probe: "value" },
        },
      ],
    });
    const result = report.results.find((r) => r.id === "stable");
    expect(result?.passed).toBe(true);
    expect(result?.observed).toEqual([8, 8]);
  });

  it("fails when re-running the same seed produces a different value", () => {
    let call = 0;
    const probe = makeProbe({
      reset: () => {
        call += 1;
      },
      read: () => call,
    });
    const report = invariantRunner.run(probe, {
      version: "1.0",
      renderProbe: { rootTestId: "widget-root" },
      invariants: [
        {
          kind: "determinism",
          id: "flaky",
          seed: 1,
          drive: oneStepDrive,
          observe: { probe: "value" },
        },
      ],
    });
    const result = report.results.find((r) => r.id === "flaky");
    expect(result?.passed).toBe(false);
    expect(result?.error).toContain("non-deterministic");
  });
});

describe("formatInvariantFailures", () => {
  it("renders only the failing results as a compact retry trace", () => {
    const probe = makeProbe({ drive: () => {} });
    const report = invariantRunner.run(probe, {
      version: "1.0",
      renderProbe: { rootTestId: "widget-root" },
      invariants: [
        { kind: "render", id: "ok-render", requireTestIds: ["slider"] },
        { kind: "response", id: "bad-response", drive: oneStepDrive, observe: { probe: "value" } },
      ],
    });
    const trace = formatInvariantFailures(report);
    expect(trace).toContain("bad-response");
    expect(trace).not.toContain("ok-render");
  });

  it("returns an empty string when every invariant passed", () => {
    const probe = makeProbe();
    const report = invariantRunner.run(probe, {
      version: "1.0",
      renderProbe: { rootTestId: "widget-root" },
      invariants: [{ kind: "render", id: "ok-render", requireTestIds: ["slider"] }],
    });
    expect(formatInvariantFailures(report)).toBe("");
  });
});
