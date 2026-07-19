import { describe, expect, it } from "vitest";
import { runGeneratedSim } from "@/lib/harness/generated-sim";

const componentSrc = `import React from "react";
export default function Manipulative() {
  return React.createElement("div", { "data-testid": "demo-sim" },
    React.createElement("input", { "data-testid": "value-slider", type: "range" }),
    React.createElement("output", { "data-testid": "value-readout" }, "value"));
}`;

const probeSrc = `export function createProbe() {
  let value = 0;
  return {
    rootTestId: "demo-sim",
    testIds() { return ["value-slider", "value-readout"]; },
    reset() { value = 0; },
    drive(step) { if (step.target === "value-slider") value = Number(step.value); },
    read() { return value; }
  };
}`;

const invariants = {
  version: "1.0" as const,
  renderProbe: { rootTestId: "demo-sim" },
  invariants: [
    { kind: "render" as const, id: "controls", requireTestIds: ["value-slider", "value-readout"] },
    {
      kind: "monotonic" as const,
      id: "value-rises",
      drive: [
        { action: "setSlider" as const, target: "value-slider", value: 1 },
        { action: "setSlider" as const, target: "value-slider", value: 2 },
      ],
      observe: { probe: "value" },
      direction: "increasing" as const,
    },
  ],
};

describe("generated simulation runtime", () => {
  it("SSR-renders the model component then drives its executable probe through G3", async () => {
    const result = await runGeneratedSim({ title: "demo", componentSrc, probeSrc, invariants });
    expect(result.render.ok).toBe(true);
    expect(result.invariantRun.passed).toBe(true);
  });

  it("fails before G3 when a probe control is absent from rendered component markup", async () => {
    const result = await runGeneratedSim({
      title: "bad",
      componentSrc: componentSrc.replace('"value-readout"', '"other-readout"'),
      probeSrc,
      invariants,
    });
    expect(result.render.ok).toBe(false);
    expect(result.render.error).toContain("value-readout");
    expect(result.invariantRun.passed).toBe(false);
  });
});
