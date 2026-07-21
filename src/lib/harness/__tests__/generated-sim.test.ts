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

  it("compiles a component that actually exercises useState/useMemo/useCallback", async () => {
    const hooksComponentSrc = `import React from "react";
import { useState, useMemo, useCallback } from "react";
export default function Manipulative() {
  const [value] = useState(3);
  const doubled = useMemo(() => value * 2, [value]);
  const onClick = useCallback(() => doubled, [doubled]);
  onClick();
  return React.createElement("div", { "data-testid": "demo-sim" },
    React.createElement("input", { "data-testid": "value-slider", type: "range" }),
    React.createElement("output", { "data-testid": "value-readout" }, String(doubled)));
}`;
    const result = await runGeneratedSim({
      title: "hooks",
      componentSrc: hooksComponentSrc,
      probeSrc,
      invariants,
    });
    expect(result.render.ok).toBe(true);
    expect(result.render.text.join(" ")).toContain("6");
  });

  it("fails render when the component source has no exported function", async () => {
    const result = await runGeneratedSim({
      title: "no-export",
      componentSrc: `const notAFunction = 42;`,
      probeSrc,
      invariants,
    });
    expect(result.render.ok).toBe(false);
    expect(result.render.error).toContain("must export a named function");
  });

  it("fails render when the probe source never defines createProbe", async () => {
    const result = await runGeneratedSim({
      title: "no-probe",
      componentSrc,
      probeSrc: `function notCreateProbe() { return {}; }`,
      invariants,
    });
    expect(result.render.ok).toBe(false);
    expect(result.render.error).toContain("createProbe");
  });

  it("fails render when createProbe() does not return a SimProbe-shaped object", async () => {
    const result = await runGeneratedSim({
      title: "bad-probe-shape",
      componentSrc,
      probeSrc: `export function createProbe() { return { rootTestId: "demo-sim" }; }`,
      invariants,
    });
    expect(result.render.ok).toBe(false);
    expect(result.render.error).toContain("SimProbe");
  });

  it("renders a nested function component, a Fragment, an array of children, and numeric text", async () => {
    const nestedComponentSrc = `import React from "react";
function Readout() {
  return React.createElement(React.Fragment, null,
    React.createElement("output", { "data-testid": "value-readout" }, 42));
}
export default function Manipulative() {
  return React.createElement("div", { "data-testid": "demo-sim" },
    [React.createElement("input", { "data-testid": "value-slider", type: "range" })],
    React.createElement(Readout));
}`;
    const result = await runGeneratedSim({
      title: "nested",
      componentSrc: nestedComponentSrc,
      probeSrc,
      invariants,
    });
    expect(result.render.ok).toBe(true);
    expect(result.render.text).toContain("42");
  });

  it("fails render when the component returns a non-renderable value", async () => {
    const badComponentSrc = `import React from "react";
export default function Manipulative() {
  return Symbol("not renderable");
}`;
    const result = await runGeneratedSim({
      title: "non-renderable",
      componentSrc: badComponentSrc,
      probeSrc,
      invariants,
    });
    expect(result.render.ok).toBe(false);
    expect(result.render.error).toContain("non-renderable");
  });

  it("fails render when an element has an invalid (non-string/function/symbol) type", async () => {
    const badComponentSrc = `import React from "react";
export default function Manipulative() {
  return { type: 42, props: {} };
}`;
    const result = await runGeneratedSim({
      title: "invalid-type",
      componentSrc: badComponentSrc,
      probeSrc,
      invariants,
    });
    expect(result.render.ok).toBe(false);
    expect(result.render.error).toContain("invalid element type");
  });

  it("produces a stable sha256 sourceHash for a given componentSrc, on both success and failure", async () => {
    const ok = await runGeneratedSim({ title: "demo", componentSrc, probeSrc, invariants });
    const failing = await runGeneratedSim({
      title: "demo",
      componentSrc,
      probeSrc: `export function createProbe() { return {}; }`,
      invariants,
    });
    expect(ok.sourceHash).toBe(failing.sourceHash);
    expect(ok.sourceHash).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});
