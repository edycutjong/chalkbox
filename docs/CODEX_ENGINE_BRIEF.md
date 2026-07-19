# Codex CLI Engine Brief — paste this into your `codex` session

> **Why this session matters:** this is the thread whose `/feedback` Session ID you submit.
> Codex must genuinely author the engine here — do NOT let another tool write `RealOrchestrator`.
> Keep the whole build in ONE Codex CLI thread. Grab the Session ID at the end (`/feedback`).

## Goal
Implement the **real generation engine** behind the existing `// STUB:` seams so an *arbitrary*
in-scope prompt (math/physics misconception) produces a **new, verified** single-file React
manipulative — write → headless-render → assert interactive invariants → retry-with-trace → publish.
Same `GenerationOrchestrator` interface the stub already satisfies. Demo/CI path must stay green.

## Contract (do not change)
- Interface: `GenerationOrchestrator.run(req: GenerationRequest): Promise<GenerationResult>`
  in `src/lib/harness/orchestrator.ts`; types in `src/lib/harness/types.ts`.
- The web app (`CreateFlow.tsx`) and the CLI both call `run()` — ONE code path.
- `RealOrchestrator` returns the SAME `GenerationResult` shape (`attempts[]`, `artifact`,
  `invariants`, `latencyMs`, `shareId`, `status`) the stub returns — so the UI needs no changes.

## Build these files
1. **`src/lib/harness/orchestrator-factory.ts`** — single seam:
   ```ts
   export function createOrchestrator(): GenerationOrchestrator {
     if (DEMO_MODE) return new StubOrchestrator();   // demo/CI, $0
     return new RealOrchestrator();                   // real key present
   }
   ```
2. **`RealOrchestrator`** (in `orchestrator.ts`, behind the `// STUB:` seam at line ~50):
   - Acquire an **isolated per-request working dir** (temp dir), drive `codex` / the Codex SDK
     with **GPT-5.6 Sol** (high reasoning) to author the component + its smoke test from `req.prompt`.
   - Loop, each attempt:
     - **G2 static** → `staticValidator.validate(source)` (REAL, exists — import allowlist / no network).
     - **headless render** → render the component in a jsdom/Playwright harness.
     - **G3 invariants** → `invariantRunner.run(probe, spec)` (REAL, exists) — the pedagogy check.
     - **G4 output safety** → `safety.ts` (Luna pass, seam at `safety.ts:61`).
     - On any failure: append a `GenerationAttempt` with the real error, feed the **trace** back to
       Codex, retry. On success: publish (SRI-pin the source, mint `shareId`).
   - **Call `checkBudget(...)` (`budget-guard.ts`) BEFORE each round** — hard ceiling (maxAttempts 4 /
     maxTokens 120k / maxWallClock 90s) so a runaway retry can't drain the account. 6 tests already pin it.
3. **`src/app/api/generate/route.ts`** (server-only) — calls `createOrchestrator().run(req)` and
   **SSE-streams** the attempts. ⚠️ The real engine reads `OPENAI_API_KEY` and **must never run
   client-side**. `CreateFlow.tsx` is `"use client"` — change it to POST to this route and consume the
   stream. Do NOT swap the client `new StubOrchestrator()` for a real one (that ships your key to visitors).
4. **Swap the two hardcoded sites** to `createOrchestrator()`:
   `CreateFlow.tsx:32` (via the route now) and `orchestrator.ts:134`.
5. **`scripts/bench.ts`** — run N in-scope prompts, record real **p50/p95 latency + success rate**.
   This kills the "no benchmark exists" gap and lets the README/video cite *real* numbers.

## Models
- **Sol = GPT-5.6** for the load-bearing generation/fix step (rules require GPT-5.6 be load-bearing).
- **Luna** = a cheaper tier for the per-prompt safety/grade/standard triage in `safety.ts` (shave cost).
- Check current per-token pricing in the OpenAI dashboard before the run.

## Guardrails (keep spend to cents)
- `.env.local` (gitignored): `OPENAI_API_KEY=sk-...` and `CHALKBOX_DEMO_MODE=false` **only in this shell**.
- Use a **fresh, low-limit key** (your old shell key leaked in a terminal — rotate it first).
- Don't regenerate the flagship live — it's seeded. Generate ONE *new* subject on camera for the moat shot.
- `unset OPENAI_API_KEY` + `CHALKBOX_DEMO_MODE=true` the moment you finish recording.

## Definition of done
- [ ] A brand-new prompt (not fraction-division) generates a verified sim end-to-end, real key.
- [ ] The retry-on-failure is genuine (the broken-probe seam makes attempt-1 fail naturally).
- [ ] `npm run ci` + all 47 tests still green in **demo mode** (engine additive, stub path intact).
- [ ] `scripts/bench.ts` emits real p50/p95 + success rate.
- [ ] Grab the `/feedback` Session ID → paste into README "Where Codex Accelerated" + the Devpost field.
