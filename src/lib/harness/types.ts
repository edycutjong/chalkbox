/**
 * Chalkbox harness types.
 *
 * These mirror the contracts in docs/COMPLEXITY.md §2.5, §3.1, §3.3 one-to-one.
 * They are the depth signal: the machine-checkable proof that a generated
 * manipulative actually teaches the intended idea, plus the static-validation
 * result that makes model-authored code safe to execute at all.
 *
 * Nothing here is a stub — these are the real shapes the (future) Codex-driven
 * engine and the (present) StubOrchestrator both speak.
 */

/* ============================================================
   Safety gate (Luna) — docs/COMPLEXITY.md §2.6
   ============================================================ */

export type GradeBand = "K-2" | "3-5" | "6-8" | "9-12";
export type Subject = "math" | "physics";
export type StandardFramework = "CCSS" | "NGSS";

export interface StandardRef {
  framework: StandardFramework;
  code: string; // e.g. "6.NS.A.1" or "HS-PS2-1"
}

export interface SafetyVerdict {
  decision: "accept" | "reject";
  reasons: string[]; // human-readable, surfaced in UX on reject
  gradeBand: GradeBand | null;
  subject: Subject | null; // must be one of these or reject
  standard: StandardRef | null;
  toxicity: number; // 0..1, threshold 0.15
  offCurriculum: boolean;
}

/* ============================================================
   Static validation (G2) — docs/COMPLEXITY.md §2.5
   ============================================================ */

export type ViolationRule =
  | "IMPORT_NOT_ALLOWED"
  | "FORBIDDEN_GLOBAL"
  | "DYNAMIC_EVAL"
  | "NETWORK_API"
  | "PROTO_POLLUTION"
  | "UNBOUNDED_LOOP_HINT"
  | "CSP_INCOMPATIBLE"
  | "MODULE_TOO_LARGE"
  | "PARSE_ERROR";

export interface Violation {
  rule: ViolationRule;
  node: { line: number; col: number };
  detail: string;
}

export interface ValidationMeta {
  importCount: number;
  nodeCount: number; // approximated in the parse-free scanner
  maxDepth: number; // approximated (max brace nesting)
}

export interface ValidationResult {
  ok: boolean;
  violations: Violation[];
  meta: ValidationMeta;
}

/* ============================================================
   Interactive-invariant assertion contract (G3)
   docs/COMPLEXITY.md §3.3
   ============================================================ */

export interface DriveStep {
  action: "drag" | "setSlider" | "tick" | "click";
  target: string; // testId of the handle/control
  value?: number; // e.g. drag delta, slider value
  ticks?: number; // fake-timer advances for animations
}

export interface RenderInvariant {
  kind: "render";
  id: string;
  requireTestIds: string[];
}

export interface MonotonicInvariant {
  kind: "monotonic";
  id: string;
  drive: DriveStep[];
  observe: { probe: string }; // state key to read after each step
  direction: "increasing" | "decreasing";
  tolerance?: number;
}

export interface ConservationInvariant {
  kind: "conservation";
  id: string;
  drive: DriveStep[];
  observe: { probe: string };
  epsilon: number; // total quantity constant within ±epsilon
}

export interface BoundsInvariant {
  kind: "bounds";
  id: string;
  drive: DriveStep[];
  observe: { probe: string };
  min: number;
  max: number;
}

export interface ResponseInvariant {
  kind: "response";
  id: string;
  drive: DriveStep[];
  observe: { probe: string }; // readout that must change
}

export interface DeterminismInvariant {
  kind: "determinism";
  id: string;
  seed: number;
  drive: DriveStep[];
  observe: { probe: string };
}

export type Invariant =
  | RenderInvariant
  | MonotonicInvariant
  | ConservationInvariant
  | BoundsInvariant
  | ResponseInvariant
  | DeterminismInvariant;

export interface InvariantSpec {
  version: "1.0";
  renderProbe: { rootTestId: string };
  invariants: Invariant[];
}

export interface InvariantResult {
  id: string;
  kind: Invariant["kind"];
  passed: boolean;
  observed?: number[]; // the sampled sequence, for the trace UI
  expected?: string;
  error?: string; // failure detail → becomes the retry trace
}

export interface InvariantRunReport {
  passed: boolean;
  results: InvariantResult[];
  durationMs: number;
}

/* ============================================================
   Generation engine — docs/COMPLEXITY.md §3.1
   ============================================================ */

export interface GenerationRequest {
  prompt: string;
  gradeBand: GradeBand | null;
  subject: Subject;
  standard: StandardRef | null;
  seed?: number; // deterministic gallery reproduction
}

export interface CompiledArtifact {
  simId: string;
  componentSrc: string; // the single-file React manipulative source
  sriHash: string; // sha256-… CSP pin
}

export type AttemptOutcome =
  | "passed"
  | "validation_failed"
  | "render_failed"
  | "invariant_failed"
  | "safety_rejected";

export interface GenerationAttempt {
  n: number;
  codePreview: string; // first N lines, for the live trace UI
  validation: ValidationResult; // G2
  render: { ok: boolean; error?: string };
  invariantRun: InvariantRunReport; // G3 — pass/fail per invariant
  tokensUsed: number;
  outcome: AttemptOutcome;
}

export interface GenerationResult {
  status: "published" | "failed";
  simId: string;
  attempts: GenerationAttempt[]; // full audit trail, one per Codex round
  artifact?: CompiledArtifact; // bundle + SRI hash
  invariants: InvariantSpec; // the contract the sim was proven against
  latencyMs: { total: number; p50Perf?: number };
  shareId?: string; // student share link token, when published
}

export interface GenerationBudget {
  maxAttempts: number; // hard cap on Codex rounds per request (4)
  maxTokens: number; // cumulative token ceiling per request (120_000)
  maxWallClockMs: number; // end-to-end deadline (90_000)
  perAttemptTimeoutMs: number; // 45_000
}

export const DEFAULT_BUDGET: GenerationBudget = {
  maxAttempts: 4,
  maxTokens: 120_000,
  maxWallClockMs: 90_000,
  perAttemptTimeoutMs: 45_000,
};
