# Chalkbox 🖍️ — Pitch Deck Outline

> _Type the misconception; get a self-tested interactive manipulative in two minutes._
> Built for **OpenAI Build Week · Education**. Interactive version: [`chalkbox_pitch_deck.html`](./chalkbox_pitch_deck.html) (press **P** for these speaker notes, **Cmd/Ctrl+P** to export a 10-page PDF).

**Visual system:** Editorial dark · `#020617` ground · teal `#14B8A6` primary · amber `#F59E0B` accent (≤5%) · Space Grotesk display / JetBrains Mono. 80/15/5 color rule. One hero element per slide.

---

## 1 · Cover
**Chalkbox 🖍️ — A sentence becomes a _self-tested_ manipulative.**
`chalkbox.edycu.dev` · Built for OpenAI Build Week.
🎙️ _Chalkbox turns a teacher's plain-English misconception into a live, self-tested interactive. The word that matters today is "self-tested."_

## 2 · Hook
**A chat can _write_ code. It can't _test_ it.**
Chalkbox executes what it generates, reads the failure, and fixes it — so nothing untested reaches a child.
🎙️ _Every AI code demo stops at "it compiles." Ours doesn't ship until it has run its own test and passed. That gap is the product._

## 3 · Problem
**She can write a worksheet. She can't write software.**
9 PM, night before class. Ms. Alvarez knows the misconception (dividing by a fraction). The fix is an interactive she can't author by 8 AM. Vendors ship a fixed catalog on a multi-month roadmap — not _her_ class's problem tonight.
🎙️ _The most effective tool for breaking a misconception is a manipulative — and it's the one artifact a teacher can never make herself._

## 4 · Solution
**Type the misconception. Get a verified sim.**
She types _"show why dividing by a fraction makes the answer bigger."_ Codex writes it, tests it, retries until it passes, and returns a phone-friendly link — under two minutes, no code.
🎙️ _One sentence in, one working manipulative out. [Swap in the real create-flow screenshot.]_

## 5 · How It Works — the moat
**Four gates. Retry-with-trace on any failure.**
- **G1** Safety + standard gate (Luna) → `accept · math · 6-8 · CCSS.6.NS.A.1`
- **G2** Generate (Sol) + static/AST check → `import allowlist · no network`
- **G3** Headless render + interactive invariants → `divisor↓ ⇒ quotient↑ ✓` _(fail → retry with trace)_
- **G4** Output safety + publish → `CSP connect-src 'none' · null origin`
🎙️ _The pedagogy itself is a machine-checked assertion at G3. A sim that renders but teaches the wrong direction fails and retries. No other teacher-to-sim tool executes and tests its own output._

## 6 · Live Demo
**Prompt → self-test → phone.** Four framed beats with numbered callouts:
1. Teacher types the misconception → 2. Live build timeline (G2 fail → G3 fail → green) → 3. Draggable published sim → 4. Zero-chrome share link on a phone.
🎙️ _Beat 2's retry is genuine — the broken-probe seam makes the on-camera fix real. [Swap all four placeholders.]_

## 7 · Key Features
- 🔁 **It tests itself** — asserts its own invariants before publishing.
- 🛡️ **Sandboxed by construction** — null-origin iframe, strict CSP, import allowlist, AST validation.
- 📐 **Standards-aligned** — math & physics, real CCSS/NGSS codes; off-curriculum rejected.
- 📱 **A link, not an app** — students open it on any phone, no login.
🎙️ _Lead with the loop; the other three are why a real teacher puts this in front of thirty kids._

## 8 · Why Now / Why Us
**Codex can finally _run_ its own code.** One-shot completions guess; an agent that executes, reads the trace, and fixes can guarantee. The moat isn't the UI — it's the invariant DSL that encodes pedagogy as a test. Copying the front end doesn't copy the moat.
🎙️ _Why-now: execute-and-fix is newly reliable. Why-us: a clone must rebuild the verification layer, not the UI._

## 9 · Traction
**Real harness. Not a mockup.** — 47 tests green (21 unit + 26 E2E) · 6-stage CI · 15 curriculum-tagged sims · 4 live gates.
The static validator + interactive-invariant runner are real and unit-tested; the flagship runs the genuine 3-attempt self-debug loop today. Deployed in demo mode, zero keys to try.
Honest status: the live any-prompt engine is the next milestone; the harness guarding it already works.
🎙️ _No fake user counts. Traction = depth of the verified harness. Invite judges to clone and run the tests._

## 10 · The Ask
**Give every teacher a verification loop.** Try it, break it, judge the moat.
🌐 chalkbox.edycu.dev · 💻 github.com/edycutjong/chalkbox · ✉️ edy.cu@live.com · [QR → live demo]
🎙️ _Close on the ask, not "thank you." Invite them to try it on their phone via the QR right now._

---

### Speaker-delivery notes
- **60-second cut:** slides 1 → 2 → 5 → 6 → 10 (Cover, Hook, Loop, Demo, Ask).
- **Never truncate:** Cover (1), Demo (6), Ask (10).
- **Keep it honest:** no invented users — the depth of the verified harness is the flex.
