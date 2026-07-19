/**
 * Budget guard (docs/COMPLEXITY.md §3.1).
 *
 * A PURE ceiling check the real orchestrator MUST consult before starting each
 * Codex round. It contains NO generation logic — just the math against
 * `GenerationBudget` — so a runaway retry loop can never drain the OpenAI key.
 * This is the "hard budget cap" from OPTION_3_RUNBOOK.md, and it lives beside
 * the (already-real) static validator and invariant runner: the harness is real,
 * only the Codex-driving step in the orchestrator is stubbed for demo mode.
 */

import type { GenerationBudget } from "./types";
import { DEFAULT_BUDGET } from "./types";

export interface BudgetState {
  /** Attempts already COMPLETED (so `attempt` == the number about to start). */
  attempt: number;
  /** Cumulative tokens billed across all attempts so far. */
  tokensUsed: number;
  /** Wall-clock elapsed since the request started, in ms. */
  elapsedMs: number;
}

export type BudgetStop = "attempts_exhausted" | "token_ceiling" | "wall_clock_exceeded";

export interface BudgetDecision {
  /** true → another Codex attempt may start; false → stop and fail-closed. */
  ok: boolean;
  /** Which ceiling was hit (only when `ok` is false). */
  stop?: BudgetStop;
  /** Human-readable reason, surfaced in the generation trace on stop. */
  detail?: string;
}

/**
 * May the orchestrator start another Codex attempt? Fails closed on the first
 * ceiling reached. Order (attempts → tokens → wall-clock) is stable so the
 * surfaced reason is deterministic for the trace UI and tests.
 */
export function checkBudget(
  state: BudgetState,
  budget: GenerationBudget = DEFAULT_BUDGET,
): BudgetDecision {
  if (state.attempt >= budget.maxAttempts) {
    return {
      ok: false,
      stop: "attempts_exhausted",
      detail: `reached maxAttempts=${budget.maxAttempts}`,
    };
  }
  if (state.tokensUsed >= budget.maxTokens) {
    return {
      ok: false,
      stop: "token_ceiling",
      detail: `tokensUsed=${state.tokensUsed} ≥ maxTokens=${budget.maxTokens}`,
    };
  }
  if (state.elapsedMs >= budget.maxWallClockMs) {
    return {
      ok: false,
      stop: "wall_clock_exceeded",
      detail: `elapsedMs=${state.elapsedMs} ≥ maxWallClockMs=${budget.maxWallClockMs}`,
    };
  }
  return { ok: true };
}
