# PRD — Chalkbox (OpenAI Build Week, Education Track)

> Source of truth: `IDEATION_FABLE_DEEP_ANALYSIS.md` Idea 1 (35/40) + `IDEAS.md` v2 (build decision) + `PRODUCTION_PLAN.md` (locked scope fence). This PRD operationalizes that spec; it does not re-open the decision.
> Deadline: **Tue Jul 21, 2026, 5:00 PM PT.** Live at **chalkbox.edycu.dev**.

---

## Emotional Hook (first line, mandatory)

**It's 9 PM on a Sunday. Ms. Alvarez teaches 6th-grade math to 32 kids at three ability levels, and she knows exactly which misconception is going to sink half her class tomorrow — that dividing by a fraction makes the answer *smaller*. She can write a worksheet. She can find a video. But the one thing that would actually break the misconception — a thing her students can *touch and drag* until it clicks — is software, and she cannot write software.**

Chalkbox is for her.

---

## 1. Problem Statement

Pedagogy research is unambiguous: for deep misconceptions, **interactive manipulatives beat explanations** — a student who drags fraction bars until the quotient visibly grows understands division-by-a-fraction in a way no paragraph delivers. Yet the interactive manipulative is the single artifact a teacher can *never* author herself:

- Worksheets she can write.
- Videos she can find (generic, not aimed at *her* class's specific misconception).
- Software she cannot make — and edtech vendors ship a fixed catalog on a multi-month roadmap, not the bespoke thing she needs for 8 AM tomorrow.

The result: differentiated, misconception-targeted instruction stays theoretical. The teacher who most precisely knows what her class is stuck on has no path from that knowledge to something students can manipulate — at 9 PM, alone, tonight.

## 2. Solution Overview

Chalkbox turns one sentence into a live, playable, phone-friendly manipulative in under two minutes.

The teacher types the misconception she wants to break. Codex (GPT-5.6) — at **product runtime**, not just build time — writes a single-file interactive React manipulative, **runs it headlessly**, **asserts its interactive invariants hold** (a smoke test Codex also writes), **retries with the failure trace** if it doesn't, and only then **publishes** it to a sandboxed iframe. The teacher gets a share link her students open on any phone.

The load-bearing insight (the whole hackathon's thesis, embodied for non-developers): **a person who cannot code receives working, verified, bespoke interactive software on demand.** Not generated text. Not a chatbot answer. A running program. Only a coding agent that writes-executes-tests-retries can deliver that — remove Codex and the product cannot exist, because no single chat completion can author *and verify* interactive software.

## 3. Target Users

| User | Who | What they do in Chalkbox |
|---|---|---|
| **Primary — the teacher (Ms. Alvarez)** | K-12 math/physics teacher, non-coder, prepping tonight for tomorrow | Types a misconception → gets a verified manipulative → copies a student share link into her LMS / writes it on the board |
| **Secondary — the student** | 11-16, on a school Chromebook or a phone | Opens the share link, manipulates the sim, answers the embedded prompt. No login, no app install |
| **Tertiary — the browsing teacher** | Any teacher who lands on the public Gallery | Finds a curriculum-tagged sim (real Common Core / NGSS codes), reads the generation prompt that made it, remixes by typing her own variant |

**Explicit non-users (scope discipline):** curriculum administrators, students working unsupervised at home, coding students learning to program, anyone outside math + physics.

## 4. Core Features (MVP — the only things that ship)

Exactly three surfaces. Everything else is out of scope (Section 8).

### F1 — Create (teacher surface) — *the load-bearing flow*
- A single prompt box: **"What do you want your students to *feel*?"** with example chips ("show why dividing by a fraction makes the answer bigger", "let them feel why a heavier ball and a lighter ball fall at the same rate").
- On submit, an **honest build timeline** streams the real pipeline stages: *Luna triage → Codex writing the manipulative → headless smoke test → (retry-with-trace if it failed) → published.* Timestamps are real; any time-compression in the demo video is labeled.
- Output: a live, playable manipulative + a copyable student share link + a "publish to Gallery" toggle.
- **The verification loop is a first-class, visible product feature**, not a hidden implementation detail — the retry-on-failure moment is shown to the teacher, because it is the reason to trust what she's about to hand 32 kids.

### F2 — Gallery (discovery surface)
- Public, curriculum-tagged grid of manipulatives. Each card shows: title, subject (math/physics), grade band, the **real standard code(s)** it targets (Common Core / NGSS), and — uniquely — **the exact generation prompt** that produced it.
- Seeded before launch with **~15 manipulatives** built through the real pipeline (see `SEED_DATA.md`), so the judge-testable link has depth even without waiting for a live generation.
- "Remix" = pre-fill the Create box with this card's prompt.

### F3 — Student link (delivery surface)
- Phone-first, full-screen, zero-chrome view of one manipulative + its embedded question. No login, no branding clutter, works on a school Chromebook and a cracked iPhone.
- The manipulative runs inside a **locked-down sandboxed iframe** (no network, CSP, import allowlist) — a student can only interact with the sim, never reach anything else.

### Cross-cutting: Safety & Trust (part of every surface, not a feature tab)
- **Luna content gate** on every prompt (classroom-appropriateness) before any generation spends a credit.
- **Sandboxed execution** for every published sim.
- **Verification-before-publish**: nothing reaches a student that hasn't passed its own smoke test.

### Auth
- **Magic-link only.** A teacher needs an identity to own her creations and manage share links; that's the entire auth story. No passwords, no OAuth, no roles, no roster.

## 5. User Stories

1. As **Ms. Alvarez**, I type "show why dividing by a fraction makes the answer bigger," and within two minutes I have a draggable fraction-bar sim that passed its own tests, so I can trust it in front of my class tomorrow.
2. As **Ms. Alvarez**, I watch the build timeline retry once after its first attempt failed the smoke test, so I *see* that Chalkbox checks its own work instead of shipping me broken software.
3. As **a student**, I open a link my teacher wrote on the board, drag the bars on my phone, and the quotient grows as the divisor shrinks — and the embedded question asks me to predict the next one.
4. As **a browsing physics teacher**, I find a projectile-motion sim in the Gallery tagged `HS-PS2-1`, read the prompt that made it, and remix it for my own class in one click.
5. As **Ms. Alvarez**, I paste a prompt that's off-topic or inappropriate, and Luna declines it *before* it burns a generation, with a clear message — so the tool stays classroom-safe by construction.

## 6. Success Metrics

**Product-truth metrics (the ones judges can verify on the live link):**
- **Generation success rate**: ≥ 80% of in-scope math/physics prompts produce a published, verified manipulative within ≤ 2 retries. Reported honestly in the README from `scripts/bench.ts` over a fixed 20-prompt suite (p50 / p95 wall-clock + pass rate). *This is the benchmark artifact the rubric rewards.*
- **Time-to-manipulative**: p50 ≤ 120 s from submit to playable.
- **Verification catch rate**: % of first attempts that fail the smoke test and are caught before publish (proof the loop does real work, not theater).

**Traction metrics (the decider — per the three-loss postmortem):**
- **≥ 5–10 external teachers** (not self-orchestrated) with a manipulative published to the Gallery by Jul 19–20, plus captured quotes/screenshots.

**Submission-gate metrics (binary):**
- Live URL up; <3-min narrated video public on YouTube; public repo + MIT license; README "Where Codex Accelerated" section; `/feedback` Session ID captured.

## 7. Scope Constraint — ONE core flow with extreme depth

> **The flow:** *Teacher types a misconception → Codex builds, self-tests, and publishes a verified interactive manipulative → student opens a phone-friendly share link.*

All depth goes into the **generation + verification loop**: the hardened component harness, Codex filling the interactive core, the headless smoke test Codex writes, the retry-with-trace, and the sandbox. Everything else (three thin surfaces, magic-link auth) is deliberately shallow plumbing around that one deep spine. **Subject scope: math + physics manipulatives only — stated proudly in the UI**, not hidden as a limitation.

## 8. Out of Scope (what we will NOT build)

Cut on sight — naming these protects the one flow:

- ❌ Any subject beyond **math + physics** (no chemistry, biology, history, language).
- ❌ **Editing** generated sims (no visual editor, no parameter sliders for the teacher — regenerate instead).
- ❌ **Classrooms, rosters, student accounts, gradebooks, analytics, progress tracking.**
- ❌ **Auth beyond magic-link** (no passwords, SSO, OAuth, roles, orgs).
- ❌ **Real-time collaboration**, comments, likes, social features.
- ❌ **Multi-track** anything — this is an Education entry, only Education.
- ❌ **Native/mobile apps** — responsive web only.
- ❌ **A general "build any app" box** — that's the crowded horizontal-platform trap and a different track; Chalkbox is a legible vertical.

## 9. Honest Limitations (stated plainly — judges are OpenAI staff)

- Generation is **not 100% reliable**; some in-scope prompts fail even after retry. The product degrades gracefully (clear "didn't pass its tests — try rephrasing" UX) and the real success rate is published, not hidden.
- **Math + physics only.** A chemistry teacher gets nothing today. This is a choice, not an oversight.
- The verification loop asserts **interactive invariants** (it renders, controls respond, the core relationship holds) — it is a *smoke test*, not a proof of pedagogical correctness or a formal verification of the underlying math.
- Live generation is **rate-limited** (prepaid Codex credits, no auto top-up); the Gallery exists so judges never *need* to wait on a live generation.
- Sandbox is defense-in-depth (no network, CSP, import allowlist) but is not claimed to be an unbreakable security boundary; live generation is disabled if any escape is found, Gallery stays up.

## 10. Why This Wins (rubric map — 4 equal criteria)

| Criterion | How Chalkbox scores | Target |
|---|---|---|
| **Technological Implementation** | Runtime Codex writes-executes-tests-retries verified React manipulatives; spot-checkable `/feedback` session; the self-test loop is on camera | 9/10 |
| **Design** | Complete three-surface product loop (Create → Gallery → Student link), phone-friendly, coherent — not a PoC | 8/10 |
| **Potential Impact** | Teachers = huge, sympathetic, judge-championed (VP Education Leah Belsky on panel); specific differentiated-instruction crisis, not "for everyone" | 9/10 |
| **Quality of Idea** | Manipulatives-on-demand with a verification moat; the ~10 convergent competitors lack the self-testing loop | 9/10 |

**Honest crowding note (from `IDEAS.md` v2):** the teacher→interactive-sim concept is *not* unique — ~10 independent models generated it. The moat is **verified execution** (the self-testing loop), curriculum-tagged real-standard gallery, sandbox safety, and math+physics discipline — none of the ~10 collisions have the loop.
