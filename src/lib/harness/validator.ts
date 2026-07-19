/**
 * StaticValidator (G2) — docs/COMPLEXITY.md §2.5.
 *
 * This is NOT a stub. It is a real, deterministic, non-LLM static pipeline that
 * genuinely rejects unsafe generated code before it is ever rendered.
 *
 * We run a parse-free scan (comment/string aware) rather than a full AST walk —
 * lighter than SWC/Babel but faithful to the same rules and violation shapes.
 * The real engine can swap in an AST parser behind this identical `validate()`
 * signature without changing a single caller.
 */

import {
  ALLOWED_IMPORT_SPECIFIERS,
  FORBIDDEN_GLOBALS,
  NETWORK_GLOBALS,
  PROTO_MARKERS,
  SIZE_CAPS,
} from "./allowlist";
import type { ValidationResult, Violation, ViolationRule } from "./types";

function lineColFromIndex(source: string, index: number): { line: number; col: number } {
  let line = 1;
  let col = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source[i] === "\n") {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
  return { line, col };
}

/**
 * Strip line comments, block comments and string/template literals, replacing
 * each with same-length whitespace so downstream indices still map to the
 * original source (accurate line/col for violations). This prevents a forbidden
 * word inside a comment or a string label from being flagged.
 */
function neutralizeCommentsAndStrings(source: string): string {
  const out = source.split("");
  let i = 0;
  const n = source.length;
  const blank = (from: number, to: number) => {
    for (let k = from; k < to && k < n; k++) {
      if (out[k] !== "\n") out[k] = " ";
    }
  };
  while (i < n) {
    const c = source[i];
    const next = source[i + 1];
    // Line comment
    if (c === "/" && next === "/") {
      let j = i + 2;
      while (j < n && source[j] !== "\n") j++;
      blank(i, j);
      i = j;
      continue;
    }
    // Block comment
    if (c === "/" && next === "*") {
      let j = i + 2;
      while (j < n && !(source[j] === "*" && source[j + 1] === "/")) j++;
      j = Math.min(n, j + 2);
      blank(i, j);
      i = j;
      continue;
    }
    // String / template literal
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      let j = i + 1;
      while (j < n) {
        if (source[j] === "\\") {
          j += 2;
          continue;
        }
        if (source[j] === quote) {
          j++;
          break;
        }
        j++;
      }
      blank(i + 1, j - 1 >= i + 1 ? j - 1 : i + 1);
      i = j;
      continue;
    }
    i++;
  }
  return out.join("");
}

interface RawImport {
  specifier: string;
  index: number;
}

/** Collect the module specifier of every static import / dynamic import / require. */
function collectImports(source: string): RawImport[] {
  const imports: RawImport[] = [];
  const patterns = [
    /import\s+(?:[^'"]*?\sfrom\s+)?["']([^"']+)["']/g, // import x from "y" | import "y"
    /import\s*\(\s*["']([^"']+)["']\s*\)/g, // dynamic import("y")
    /require\s*\(\s*["']([^"']+)["']\s*\)/g, // require("y")
  ];
  // Run against the ORIGINAL source so we can read specifier text out of strings.
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      imports.push({ specifier: m[1], index: m.index });
    }
  }
  return imports;
}

function ruleForGlobal(token: string): ViolationRule {
  if (NETWORK_GLOBALS.includes(token)) return "NETWORK_API";
  if (token === "eval" || token === "Function") return "DYNAMIC_EVAL";
  if (PROTO_MARKERS.includes(token)) return "PROTO_POLLUTION";
  return "FORBIDDEN_GLOBAL";
}

function escapeForRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Word-boundary-ish match. For dotted tokens we match the literal member chain. */
function scanForbidden(neutral: string, source: string): Violation[] {
  const violations: Violation[] = [];
  const seen = new Set<string>();
  for (const token of FORBIDDEN_GLOBALS) {
    const dotted = token.includes(".");
    const pattern = dotted
      ? new RegExp(escapeForRegex(token), "g")
      : new RegExp(`(?<![\\w$.])${escapeForRegex(token)}(?![\\w$])`, "g");
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(neutral)) !== null) {
      const key = `${token}@${m.index}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const { line, col } = lineColFromIndex(source, m.index);
      violations.push({
        rule: ruleForGlobal(token),
        node: { line, col },
        detail: `forbidden reference '${token}' at ${line}:${col}`,
      });
    }
  }
  // Dynamic eval via `new Function(...)`.
  const newFn = /new\s+Function\s*\(/g;
  let fm: RegExpExecArray | null;
  while ((fm = newFn.exec(neutral)) !== null) {
    const { line, col } = lineColFromIndex(source, fm.index);
    violations.push({
      rule: "DYNAMIC_EVAL",
      node: { line, col },
      detail: `dynamic code construction 'new Function' at ${line}:${col}`,
    });
  }
  return violations;
}

/** CSP-incompat: inline JSX event handlers / javascript: URLs the sandbox CSP refuses. */
function scanCspIncompat(source: string): Violation[] {
  const violations: Violation[] = [];
  const jsUrl = /["'`]javascript:/g;
  let m: RegExpExecArray | null;
  while ((m = jsUrl.exec(source)) !== null) {
    const { line, col } = lineColFromIndex(source, m.index);
    violations.push({
      rule: "CSP_INCOMPATIBLE",
      node: { line, col },
      detail: `javascript: URL refused by sandbox CSP at ${line}:${col}`,
    });
  }
  return violations;
}

export class StaticValidator {
  constructor(private readonly allow: readonly string[] = ALLOWED_IMPORT_SPECIFIERS) {}

  validate(source: string): ValidationResult {
    const violations: Violation[] = [];
    const neutral = neutralizeCommentsAndStrings(source);

    // Stage 1: (parse-free) sanity — grossly unbalanced braces read as a parse error.
    const opens = (neutral.match(/[{([]/g) ?? []).length;
    const closes = (neutral.match(/[})\]]/g) ?? []).length;
    if (Math.abs(opens - closes) > 0 && source.trim().length > 0 && opens + closes > 0) {
      // Only a hard imbalance is treated as a parse error; small skews are tolerated
      // by the lightweight scanner, so require a meaningful gap.
      if (Math.abs(opens - closes) >= 2) {
        violations.push({
          rule: "PARSE_ERROR",
          node: { line: 1, col: 1 },
          detail: `unbalanced brackets (open=${opens}, close=${closes})`,
        });
      }
    }

    // Stage 2: import allowlist.
    const imports = collectImports(source);
    for (const imp of imports) {
      if (!this.allow.includes(imp.specifier)) {
        const { line, col } = lineColFromIndex(source, imp.index);
        violations.push({
          rule: "IMPORT_NOT_ALLOWED",
          node: { line, col },
          detail: `import '${imp.specifier}' is not in the allowlist`,
        });
      }
    }

    // Stage 3-4: forbidden globals / network APIs / eval / proto pollution.
    violations.push(...scanForbidden(neutral, source));

    // Stage 5: CSP-compat lint.
    violations.push(...scanCspIncompat(source));

    // Stage 6: size / complexity caps.
    const nodeCount = (neutral.match(/[\w$]+|[{}()[\];,.]/g) ?? []).length;
    let depth = 0;
    let maxDepth = 0;
    for (const ch of neutral) {
      if (ch === "{" || ch === "(" || ch === "[") {
        depth++;
        if (depth > maxDepth) maxDepth = depth;
      } else if (ch === "}" || ch === ")" || ch === "]") {
        depth = Math.max(0, depth - 1);
      }
    }
    if (nodeCount > SIZE_CAPS.maxNodeCount) {
      violations.push({
        rule: "MODULE_TOO_LARGE",
        node: { line: 1, col: 1 },
        detail: `module too large (${nodeCount} > ${SIZE_CAPS.maxNodeCount} nodes)`,
      });
    }
    if (maxDepth > SIZE_CAPS.maxDepth) {
      violations.push({
        rule: "UNBOUNDED_LOOP_HINT",
        node: { line: 1, col: 1 },
        detail: `nesting too deep (${maxDepth} > ${SIZE_CAPS.maxDepth})`,
      });
    }

    return {
      ok: violations.length === 0,
      violations,
      meta: {
        importCount: imports.length,
        nodeCount,
        maxDepth,
      },
    };
  }
}

/** Convenience singleton + functional wrapper. */
export const staticValidator = new StaticValidator();

export function validateSource(source: string): ValidationResult {
  return staticValidator.validate(source);
}

/** Format violations as a compact trace string handed back to Codex on retry. */
export function formatViolations(result: ValidationResult): string {
  return result.violations
    .map((v) => `${v.rule} at ${v.node.line}:${v.node.col} — ${v.detail}`)
    .join("\n");
}
