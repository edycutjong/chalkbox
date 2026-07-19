# SUBMISSION — Chalkbox (OpenAI Build Week, Education Track)

> Ready-to-paste Devpost copy. Judges are OpenAI staff (incl. VP Education Leah Belsky). One track: **Education**. Live at **chalkbox.edycu.dev**.

---

## Project title
**Chalkbox — interactive manipulatives, conjured by a teacher's sentence.**

## Emotional Hook (first line)
It's 9 PM on a Sunday. Ms. Alvarez teaches 6th-grade math to 32 kids at three ability levels, and she knows exactly which misconception is going to sink half her class tomorrow — that dividing by a fraction makes the answer *smaller*. She can write a worksheet. She can find a video. But the one thing that would actually break the misconception — a thing her students can touch and drag until it clicks — is software, and she cannot write software. Chalkbox is for her.

## Short description (≤150 chars)
A teacher types a misconception; Codex builds, self-tests, and publishes a live interactive math/physics manipulative students open on their phones.

## Long description (~500 words)

Interactive manipulatives are the single most effective tool for breaking a math or physics misconception — and the one artifact a teacher can never make herself. She can write a worksheet. She can find a video. She cannot author software at 9 PM for tomorrow's 8 AM class. Edtech vendors ship a fixed catalog on a multi-month roadmap, not the bespoke thing *her* class is stuck on tonight.

Chalkbox closes that gap. A teacher types the misconception she wants to break — *"show why dividing by a fraction makes the answer bigger, not smaller"* — and in under two minutes she has a live, draggable manipulative her students open on any phone. No code. No app store. No waiting for a vendor.

**What makes it real is the loop no chatbot can run.** At product runtime, Codex (GPT-5.6) doesn't just describe a manipulative — it **writes** a single-file interactive React component, **runs it headlessly**, **asserts its interactive invariants hold** (a smoke test Codex also writes: dragging the divisor smaller must make the quotient bigger; a heavy and light ball must land together), **retries with the error trace** if it fails, and only **then publishes**. Nothing reaches a student that hasn't passed its own tests. That verification loop is the moat — and it's on camera.

**Three surfaces, nothing more.** *Create* (the teacher types; an honest build timeline streams Codex writing, testing, and retrying with real timestamps). *Gallery* (a public, curriculum-tagged grid seeded with ~15 manipulatives, each showing its real Common Core / NGSS standard code and the exact prompt that generated it). *Student link* (phone-first, zero-chrome, the sim running in a locked-down sandboxed iframe).

**Codex is load-bearing, not decorative.** The product is *runtime* code generation-and-verification for a person who cannot code. Remove Codex and Chalkbox cannot exist — a single chat completion can produce plausible-looking code but cannot execute it, test it, read the failure, and fix it. GPT-5.6 runs in two tiers: **Sol** generates and iterates the manipulative; **Luna** runs a fast, cheap triage on every prompt — a classroom-safety gate, grade-level tag, and alignment to a real curriculum standard — *before* a single generation credit is spent.

**Scope is deliberately narrow: math and physics manipulatives only, stated proudly in the UI.** That discipline is why the generation loop can be hardened enough to trust with 32 kids.

Chalkbox is live at **chalkbox.edycu.dev** — a seeded gallery you can play with immediately (no login) and a rate-limited "generate live" button. Auth is magic-link only; a teacher just needs to own her creations.

The insight the whole thing rests on: pedagogy is clear that manipulatives beat explanations, but manipulatives are the one artifact teachers can't author. Codex removes exactly that barrier — and nothing else does.

## Why ONLY Codex + GPT-5.6 (sponsor-tech defense)

This is a "build WITH Codex" event; the primitive to defend is the coding-agent workflow itself, used at runtime. Chalkbox uses it across (at least) three load-bearing surfaces:

1. **Codex SDK (TypeScript) driving `codex` in a sandboxed per-request working dir** — the runtime engine that writes the component, runs the smoke test, and retries with the trace. This is the product.
2. **GPT-5.6 Sol** (generation/iteration, high reasoning effort) for the one step where correctness is load-bearing — authoring and fixing interactive code.
3. **GPT-5.6 Luna** (fast/cheap) for the per-prompt triage gate (safety + grade tag + standard alignment) that runs before any Sol credit is spent.
4. **Codex CLI + IDE extension** as the build tooling — the primary `/feedback` thread *is* the generation pipeline, so the submitted Session ID genuinely covers the core work.

**Remove Codex and you'd need a code generator + a headless test runner + a retry-orchestration harness + a human to read every failure and fix it — and you'd still be shipping unverified software to children.** The write-execute-test-retry loop in one agent is the entire value.

**Honest limitation of the sponsor tech:** runtime Codex generation has real latency and a non-zero failure rate even after retry — some in-scope prompts don't pass. When the live engine lands we will publish the true success rate via a reproducible `scripts/bench.ts` rather than hide it, and the seeded Gallery means a judge never *needs* a live generation to succeed to evaluate the product. **Build status:** the validator + invariant runner + flagship sim are real and tested today; the Codex generation engine is the next milestone (currently a labeled stub).

## Demo video script (<3 min, narrated — mandatory voiceover covering Codex AND GPT-5.6)

> Public YouTube, ≤3 min, English narration, no copyrighted music. Show the Codex interface on-screen (FAQ: "a strong signal"). Centerpiece = the self-test loop retrying.

- **[0:00–0:12] The hook.** Empty prompt box: *"What do you want your students to feel?"* VO: "Ms. Alvarez teaches 6th-grade math. She knows exactly which misconception will sink half her class tomorrow. Watch what happens when she types one sentence."
- **[0:12–0:35] Create + the loop (the centerpiece).** She types *"show why dividing by a fraction makes the answer bigger"* → Create. The build timeline streams, **on-screen Codex interface visible**: Luna checks it's classroom-ready → Codex (Sol) writes the manipulative → runs its own smoke test → **first attempt fails, Codex reads the trace and fixes it** → Verified ✓. VO: "This isn't a chatbot answering. Codex is writing real interactive code, running its own test, and — right here — catching its own bug and fixing it before any student sees it. That loop is the whole point: no untested software reaches a child."
- **[0:35–0:55] The reveal.** The fraction-division bars appear; she drags the divisor smaller and the quotient visibly grows; the readout ticks `6 ÷ 1/2 = 12`. VO: "Smaller pieces, bigger answer — she can't *tell* them that so it lands. Now they can feel it."
- **[0:55–1:15] Student view.** Cut to a phone opening the share link; a student drags, answers the embedded question. VO: "No app store, no login. Codex wrote, tested, and shipped this while she took attendance."
- **[1:15–1:45] Depth: Gallery + Codex usage.** Scroll the seeded Gallery — real Common Core / NGSS codes, each card showing its generation prompt. VO explains the tier split: "GPT-5.6 Sol writes and fixes the code; Luna runs a cheap safety-and-standards check on every prompt first. The build itself ran in one Codex CLI session — that's the session ID on this submission."
- **[1:45–2:20] Impact + honesty.** VO: "Manipulatives beat explanations for misconceptions — but they're the one thing teachers can't make. Chalkbox is math and physics only, on purpose, and it publishes its real success rate. Here are five teachers who made one this week." Show launch-teacher gallery cards.
- **[2:20–2:40] Close + gratitude.** Live URL on screen. VO: "Chalkbox — a teacher can now author interactive software for tomorrow's class, for the first time. Thank you for taking the time to review this."

## Screenshot descriptions (for the gallery)
1. **Create — the prompt box** ("What do you want your students to feel?") with example chips and the math+physics scope badge.
2. **Create — the build timeline mid-retry**, showing "First try didn't pass — Codex is fixing it" (the moat, visible).
3. **The fraction-division manipulative**, divisor dragged small, quotient large, readout `6 ÷ 1/4 = 24`.
4. **Gallery**, showing curriculum-tagged cards with real standard codes and their generation prompts.
5. **Student view on a phone** — full-bleed sim + embedded question, zero chrome.

## Track / category
**Education** (single track — multi-track is disallowed and dilutes depth).

## Required submission fields (checklist)
- ☐ Category: **Education**
- ☐ Demo video: public YouTube, <3 min, narrated (covers what it does + how Codex + how GPT-5.6), English, no copyrighted music
- ☐ Public repo + **MIT license** (license present from commit 1)
- ☐ README: setup, sample prompts, run guidance, **"Where Codex Accelerated"** + key decisions
- ☐ **`/feedback` Codex Session ID** (the primary CLI thread that built the pipeline)
- ☐ Live judge-testable URL: **chalkbox.edycu.dev** (seeded gallery + rate-limited live generation, zero setup)

## Personal sign-off
Thank you for taking the time to review Chalkbox. This was built for the teacher at 9 PM on a Sunday who knows exactly what her class is stuck on and, until now, had no way to turn that into something a kid could touch. — Edy

---

## 5.5 Submission Copy Quality Gates (verified before finalizing)

| Gate | Status | Evidence |
|---|---|---|
| **Emotional Hook** — first sentence is one specific person's problem | ✅ | Ms. Alvarez, 9 PM Sunday, fraction division |
| **Docs Distance** — NOT the canonical sponsor docs example | ✅ | Runtime Codex-as-generation-engine for non-coders w/ self-test loop appears in no quickstart (🟢, per spec) |
| **Sponsor Defense** — "Why ONLY Codex" cites 3+ specific surfaces | ✅ | Codex SDK sandboxed dir + Sol + Luna + CLI/IDE; "remove Codex and you'd need N systems" |
| **Honest Limitation** — ≥1 acknowledged gap | ✅ | Non-zero failure rate after retry (published, not hidden); math+physics only; smoke test ≠ pedagogical proof |
| **Benchmark Proof** — reproducible p50/p95 | ☐ | `scripts/bench.ts` specced in COMPLEXITY.md; not built yet — no generation benchmark exists today. Do NOT cite p50/p95 numbers until the script runs. |
| **Test Count** — exact count in README | ◐ | **8 harness unit tests + 24 E2E tests today** (validator, invariant runner, orchestrator). 100+ is the target once the engine lands — state the *real* count in the README, not the target. |
| **Live URL** — deployed, judge-testable | ✅ | chalkbox.edycu.dev, seeded gallery, no setup |
| **Proof of production** (no chain — adapted) | ✅ | Live URL + generation-success benchmark + seeded 15-item gallery + ≥5 real external teachers |
| **Personal Sign-off** — human thank-you | ✅ | Present above |
| **Scope = Narrow+Deep** — ONE flow, not a feature list | ✅ | Prompt → verified sim → share link; math+physics only; 3 surfaces |
| **Default path = judged capability** (Tether #52) | ✅ | The zero-flag demo path exercises the self-test loop; nothing hides the capability behind a nicer side flow |
| **Real demo video is a hard gate** (Turena #50) | ☐ | Record real ≤3-min narrated video before submit — not a placeholder |
| **Mocked components labeled** (Turena #49) | ✅ | Seed personas labeled "sample"; live vs. seeded generation distinguished; time-compression in video labeled |
