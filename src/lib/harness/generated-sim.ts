/**
 * Server-only generated-simulation runtime.
 *
 * A model response is deliberately two coupled programs:
 * - a React component, rendered once by ReactDOMServer; and
 * - a pure SimProbe module, executed in a restricted VM and driven by G3.
 *
 * The component is not trusted because it came from a model.  The probe is not
 * trusted either: it receives no require/process/network globals, and all of
 * its declared controls must be present in the component's actual SSR markup
 * before the invariant runner is allowed to touch it.
 */

import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";
import type { InvariantRunReport, InvariantSpec, RenderInvariant } from "./types";
import { invariantRunner, type SimProbe } from "./invariant-runner";

export interface GeneratedSimPackage {
  componentSrc: string;
  probeSrc: string;
  invariants: InvariantSpec;
  title: string;
}

export interface GeneratedSimRun {
  render: { ok: boolean; error?: string; text: string[] };
  invariantRun: InvariantRunReport;
  sourceHash: string;
}

const FAILED_REPORT: InvariantRunReport = {
  passed: false,
  results: [],
  durationMs: 0,
};

type HeadlessComponent = () => unknown;
type HeadlessElement = {
  type: string | HeadlessComponent | symbol;
  props: Record<string, unknown> & { children?: unknown[] };
};

// A deliberately tiny React-compatible surface for the generated component's
// first render. It executes React.createElement/useState/useMemo code without
// importing react-dom/server (which Next prohibits from route compilation).
const headlessReact = {
  Fragment: Symbol.for("react.fragment"),
  createElement(
    type: HeadlessElement["type"],
    props: Record<string, unknown> | null,
    ...children: unknown[]
  ): HeadlessElement {
    return { type, props: { ...(props ?? {}), children } };
  },
  useState<T>(initial: T): [T, (next: T | ((current: T) => T)) => void] {
    let current = initial;
    return [
      current,
      (next) => (current = typeof next === "function" ? (next as (value: T) => T)(current) : next),
    ];
  },
  useMemo<T>(factory: () => T): T {
    return factory();
  },
  useCallback<T>(callback: T): T {
    return callback;
  },
};

function compileComponent(source: string): HeadlessComponent {
  // Generation instructions require plain JavaScript (no TypeScript or JSX),
  // one React import, and either `export default function Manipulative` or an
  // exported `Manipulative` function.  This tiny transform is intentionally
  // narrower than a general transpiler.
  const transformed = source
    .replace(/import\s+React\s+from\s+["']react["'];?/g, "const React = __React;")
    .replace(/import\s*{\s*([^}]+)\s*}\s*from\s*["']react["'];?/g, "const {$1} = __React;")
    .replace(/export\s+default\s+function\s+([A-Za-z_$][\w$]*)/g, "function $1")
    .replace(/export\s+function\s+([A-Za-z_$][\w$]*)/g, "function $1");
  const names = [...transformed.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((m) => m[1]);
  const candidate = names.includes("Manipulative") ? "Manipulative" : names[0];
  if (!candidate) throw new Error("component must export a named function");
  const context = vm.createContext({ __React: headlessReact, module: { exports: {} } });
  new vm.Script(`${transformed}\nmodule.exports.default = ${candidate};`, {
    filename: "component.generated.js",
  }).runInContext(context, { timeout: 1_000 });
  const component = (context.module as { exports: { default?: unknown } }).exports.default;
  if (typeof component !== "function") throw new Error("component export is not a function");
  return component as HeadlessComponent;
}

function compileProbe(source: string): SimProbe {
  const transformed = source
    .replace(/export\s+default\s+function\s+createProbe/g, "function createProbe")
    .replace(/export\s+function\s+createProbe/g, "function createProbe");
  const context = vm.createContext({
    Math,
    Number,
    Array,
    Object,
    JSON,
    module: { exports: {} },
  });
  new vm.Script(`${transformed}\nmodule.exports.createProbe = createProbe;`, {
    filename: "probe.generated.js",
  }).runInContext(context, { timeout: 1_000 });
  const createProbe = (context.module as { exports: { createProbe?: unknown } }).exports
    .createProbe;
  if (typeof createProbe !== "function") throw new Error("probe must export createProbe()");
  const probe = (createProbe as () => unknown)();
  if (!isSimProbe(probe)) throw new Error("createProbe() did not return a SimProbe");
  return probe;
}

function isSimProbe(value: unknown): value is SimProbe {
  if (!value || typeof value !== "object") return false;
  const probe = value as Partial<SimProbe>;
  return (
    typeof probe.rootTestId === "string" &&
    typeof probe.testIds === "function" &&
    typeof probe.reset === "function" &&
    typeof probe.drive === "function" &&
    typeof probe.read === "function"
  );
}

function textFromMarkup(markup: string): string[] {
  return markup
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function renderHeadlessly(element: unknown): string {
  if (element === null || element === undefined || typeof element === "boolean") return "";
  if (typeof element === "string" || typeof element === "number") return String(element);
  if (Array.isArray(element)) return element.map(renderHeadlessly).join("");
  if (!element || typeof element !== "object")
    throw new Error("component returned a non-renderable value");
  const node = element as HeadlessElement;
  if (typeof node.type === "function") return renderHeadlessly(node.type());
  if (typeof node.type === "symbol") return renderHeadlessly(node.props.children ?? []);
  if (typeof node.type !== "string") throw new Error("component returned an invalid element type");
  const testId = node.props["data-testid"];
  const attr = typeof testId === "string" ? ` data-testid=\"${testId}\"` : "";
  return `<${node.type}${attr}>${renderHeadlessly(node.props.children ?? [])}</${node.type}>`;
}

function requireRenderedTestIds(markup: string, probe: SimProbe, spec: InvariantSpec): void {
  const expected = new Set<string>([
    spec.renderProbe.rootTestId,
    probe.rootTestId,
    ...probe.testIds(),
  ]);
  for (const invariant of spec.invariants) {
    if (invariant.kind === "render") {
      for (const id of (invariant as RenderInvariant).requireTestIds) expected.add(id);
    }
  }
  for (const id of expected) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`data-testid=["']${escaped}["']`).test(markup)) {
      throw new Error(`headless render missing probe control '${id}'`);
    }
  }
}

/** Execute the generated pair in a fresh on-disk workspace and a fresh VM. */
export async function runGeneratedSim(generated: GeneratedSimPackage): Promise<GeneratedSimRun> {
  const workingDir = await mkdtemp(join(tmpdir(), "chalkbox-generation-"));
  try {
    await Promise.all([
      writeFile(join(workingDir, "Manipulative.js"), generated.componentSrc, "utf8"),
      writeFile(join(workingDir, "probe.js"), generated.probeSrc, "utf8"),
      writeFile(join(workingDir, "invariants.json"), JSON.stringify(generated.invariants), "utf8"),
    ]);

    const Component = compileComponent(generated.componentSrc);
    const markup = renderHeadlessly(Component());
    const probe = compileProbe(generated.probeSrc);
    requireRenderedTestIds(markup, probe, generated.invariants);
    return {
      render: { ok: true, text: textFromMarkup(markup) },
      invariantRun: invariantRunner.run(probe, generated.invariants),
      sourceHash: createHash("sha256").update(generated.componentSrc).digest("base64"),
    };
  } catch (error) {
    return {
      render: { ok: false, error: errorMessage(error), text: [] },
      invariantRun: FAILED_REPORT,
      sourceHash: createHash("sha256").update(generated.componentSrc).digest("base64"),
    };
  } finally {
    await rm(workingDir, { recursive: true, force: true });
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
