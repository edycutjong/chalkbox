# BUILD_PLAN — Chalkbox (hour-by-hour sprint)

> **Complements `PRODUCTION_PLAN.md`** (the day-by-day + risk register + go/no-go gates) — it does not replace it. This file is the hour-by-hour execution layer mapped onto the same Day 1–7 skeleton (Jul 15–21, submit Tue Jul 21 5:00 PM PT). Where they overlap, PRODUCTION_PLAN's gates win.
>
> **Governing rules baked in:** (1) all core work runs in the **primary Codex CLI thread** — it *is* the `/feedback` Session ID (judges spot-check it), so build in Codex, not Claude. (2) **Day 1 is a hard risk gate** — if the loop can't be made reliable, pivot to Sheetlift with no renegotiation. (3) **Traction is the decider** — Day 3 launch to real teachers is a line item, not a hope. (4) **Default demo path = the load-bearing capability** (the self-test loop). (5) **Video is a hard gate, recorded for real before submit.**

---

## Priority order (demo-first)
Build in the order the demo needs it: **the loop → live URL → the three surfaces → seed gallery → traction → video → submit.** Anything not on the critical path is nice-to-have and cut first.

- **Must-have (ship or don't submit):** generation+verification loop; Create with honest build timeline; sandboxed student view + share link; seeded Gallery (15); live at chalkbox.edycu.dev; magic-link auth; <3-min narrated video; public repo + MIT; README "Where Codex Accelerated"; `/feedback` Session ID; ≥5 external teacher sims.
- **Nice-to-have (cut under pressure):** Gallery filters beyond subject; live thumbnail previews (fallback: static); prompt-caching optimization; the `openai-docs` skill migration flourish; landing-page polish beyond the hero.

---

## Day 1 — THE SPIKE (risk gate; nothing else matters today)
*Goal: one teacher-style prompt → verified, playable manipulative, end-to-end, twice in a row.*

| Hour | Task |
|---|---|
| H1 | Request $100 Codex credits (form `Ncu6iGkaHq1SwUmEA` — sanity-check live site first). Scaffold repo: `create-next-app` (TS/App Router/Tailwind), **MIT LICENSE in commit 1**, `supabase init`. |
| H2 | **Open the primary Codex CLI thread.** From here, all core work is in Codex. Wire `codex` via the Codex SDK to run in a per-request temp working dir. |
| H3 | Define the **component harness** contract (`<Manipulative/>` shell: mount, declared controls, `readout`, `describeInvariants()`). Codex fills only the core. |
| H4–H5 | Loop v0: prompt → Sol writes component into harness → write file → headless render (headless Chromium). Get *anything* to render. |
| H6–H7 | Add the **Codex-authored smoke test** + assertion run + **retry-with-trace** (max 2 attempts). Wire the hero prompt (`fraction-division-bars`, 6.NS.A.1). |
| H8 | **GATE:** hero prompt → verified playable sim, twice in a row. ✅ continue · ❌ **pivot to Sheetlift, full remaining week, no hybrid.** Commit. |

**Deliverable seeds today:** `scripts/` dir exists; the loop code is the spine of everything downstream.

## Day 2 — Product loop + LIVE
*Goal: the three surfaces exist and the prod URL is the dev environment.*

| Hour | Task |
|---|---|
| H1–H2 | **Create page**: `PromptBox` + example chips + scope badge; `POST /api/generate` streams **SSE** build-timeline events (`BuildTimeline`/`TimelineStep`). |
| H3 | Supabase schema (`sims`, `share_links`, `profiles`, `generation_events`) + RLS; persist published sims. |
| H4 | **Student view** `/s/:token` + `SimFrame` sandboxed iframe (no-network, CSP, import allowlist). Phone-first, zero-chrome. |
| H5 | **Gallery** grid + `SimCard` (title, subject tag, grade, standard chip, generation prompt, Remix). |
| H6 | **Magic-link auth** (Supabase) — the entire auth surface. Ownership via RLS. |
| H7 | Sandbox hardening pass: CSP headers, connect-src none, import allowlist enforced at bundle; **Luna content gate** wired into `/api/generate` (runs before Sol). |
| H8 | **Deploy live to `chalkbox.edycu.dev`** (Vercel). Rate-limit live generation. `GET /api/health`. From now, prod = dev. |

## Day 3 — Seed + LAUNCH (traction gate opens — the decider)
*Goal: 15-item seeded gallery + reliability data + launched to real teachers.*
*(Noon PT: credit form closes — must already be done.)*

| Hour | Task |
|---|---|
| H1 | Build `data/fixtures/standards.json`: ingest real Common Core / NGSS descriptions via `r.jina.ai` (Actian lesson — authentic, not lorem). |
| H2–H3 | Generate the **15 seed manipulatives** through the real pipeline (`SEED_DATA.md` §2); commit `sims/<slug>.tsx` + `.smoke.ts` + `manifest.json`. Build `scripts/seed.ts` (`--apply` deterministic / `--regen` provenance). |
| H4 | `scripts/bench.ts` — fixed 20-prompt suite → p50/p95 + success rate + verification catch rate. **Run it; record real numbers.** |
| H5 | Reliability pass: triage the 20-prompt failures; tighten the harness / retry prompt. |
| H6 | **LAUNCH to real teachers**: r/matheducation, r/ScienceTeachers, r/Physics, teacher X. Ask (one sentence): "Type the misconception that sinks your class; get a manipulative in 2 minutes." |
| H7–H8 | Work the threads; help early teachers; capture their prompts + sims + quotes/screenshots into the Gallery (marked as real, not seed). |

## Day 4 — Traction + Design polish
*Goal: ≥5 external teachers in the gallery; "complete coherent product" Design bar cleared.*

| Hour | Task |
|---|---|
| H1–H3 | Work launch threads → target **5–10 external teachers with sims in the Gallery** (external ≠ self-orchestrated — the three-loss lesson). |
| H4–H6 | Design polish to the rubric's Design criterion: empty states, honest `FailureCard` UX, mobile student view, `Hero`/landing with the Ms.-Alvarez hook, subject tints, chalk visual language. |
| H7 | Fix the top failure classes surfaced by the 20-prompt bench; re-run `bench.ts`. |
| H8 | Write `docs/friction-log.md` (DX report — decisions + where Codex accelerated + architectural debugging lore) and `DEMO.md` (exact steps + expected outputs). Commit. |

## Day 5 — Submission package + SUBMIT
*Goal: submitted (form editable later — never hold a finished entry for deadline day).*

| Hour | Task |
|---|---|
| H1–H3 | **Record the real video** (<3 min, narrated, public YouTube, no copyrighted music). Centerpiece = the self-test loop **retrying on camera**; show the Codex interface on-screen; narrate what it does + how Codex + how GPT-5.6. Expand `SUBMISSION.md` script. **This is a hard gate — no placeholder.** |
| H4 | **README**: setup, sample prompts, run guidance, exact **test count**, **"Where Codex Accelerated"** quoting real decision points from the primary session (the SessionScribe tactic as garnish), honest-limitations section. |
| H5 | Run `/feedback` in the primary Codex thread → capture **Session ID**. Run `scripts/check_submission_readiness.ts` (fails on any placeholder). |
| H6 | Fill the Devpost form completely, run the plugin's `$prepare-submission` audit, **SUBMIT** (Education track). |
| H7–H8 | **Sheetlift go/no-go (evening):** second entry ONLY if every box above is green AND traction gathered. "Almost done" = NO. |

## Day 6 — Buffer (this day exists to be eaten)
| Hour | Task |
|---|---|
| H1–H4 | Fold traction evidence into the submission (teacher-made gallery items, quotes) — edits allowed until deadline. |
| H5–H6 | Fix anything a judge would hit in the first 5 minutes on the live link. Re-run `bench.ts`, update README numbers. |
| H7–H8 | (If greenlit) Sheetlift build day — else more polish / more teacher outreach. |

## Day 7 — Lock
| Hour | Task |
|---|---|
| by **2:00 PM PT** | Final edits done (3-hr buffer vs Devpost/YouTube failures). Verify: video plays publicly, repo public + MIT, live link up + seeded, `/feedback` Session ID filled, category = Education. |
| after | Monitor the live link stays up through judging window. Do not touch the submitted Session ID. |

---

## Mandatory deliverables (workflow Step 6 — adapted, no blockchain)
| Artifact | Path | Purpose |
|---|---|---|
| Reproducible benchmark | `scripts/bench.ts` | p50/p95 + generation success rate + verification catch rate over 20-prompt suite |
| Offline/verify equivalent | `scripts/verify_offline.ts` | Verifies a published sim renders + passes its smoke test with no network (proves sandbox + local reproducibility) |
| Deterministic seed | `scripts/seed.ts --apply` | Byte-identical 15-item gallery reproduction |
| Submission readiness | `scripts/check_submission_readiness.ts` | Fails if any submission field is a placeholder |
| DX / friction log | `docs/friction-log.md` | Where Codex accelerated + key decisions + debugging lore (product-track DX evidence) |
| Demo steps | `DEMO.md` | Exact steps + expected outputs for the judge-testable path |
| Architecture doc | `ARCHITECTURE.md` | Already written — Mermaid pipeline + schema + model justification |
| Landing page | `/` hero section | Ms. Alvarez hook + demo loop + CTA (also serves the launch) |

## Definition of DONE (mirror of PRODUCTION_PLAN §5 — all green before any second entry)
1. Live URL stable; loop passes ~20 varied prompts (numbers in README).
2. ≥5 external teachers' sims in the Gallery, quotes captured.
3. Real video uploaded, public, <3 min, narrated, Codex on-screen.
4. README + "Where Codex Accelerated" + `/feedback` Session ID captured.
5. Devpost form **submitted** (Education).
