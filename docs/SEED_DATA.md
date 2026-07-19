# SEED_DATA — Chalkbox

> Design principle (Actian postmortem #15): **the data IS the product.** The seeded Gallery is what a judge sees on the live link when they don't wait for a live generation. It must be built around ONE devastating demo prompt, use REAL curriculum standards (never lorem-ipsum), and regenerate deterministically.

---

## 1. The ONE Devastating Demo Prompt

Everything in the seed set orbits the hero prompt from the emotional hook and the 30-second video script:

> **"Show my students why dividing by a fraction makes the answer *bigger*, not smaller."**

- **Standard:** Common Core **6.NS.A.1** — *"Interpret and compute quotients of fractions, and solve word problems involving division of fractions by fractions."*
- **The manipulative it produces:** draggable **fraction-division bars**. The dividend bar is fixed; the student drags a handle to shrink the divisor (the "piece size"). As the piece gets *smaller*, the count of pieces that fit — the quotient — visibly *grows*. An overlay reads `6 ÷ 1/2 = 12` and updates live. The embedded question: *"You made the piece smaller but the answer got bigger. Predict `6 ÷ 1/4` before you drag there."*
- **Why it's devastating in 10 seconds:** the misconception ("dividing makes things smaller") is one every 6th-grade teacher fights, and the reveal — *smaller divisor → bigger answer, shown by dragging* — is the exact "feel it, don't be told it" moment that no worksheet or chatbot can deliver. On camera: teacher types the sentence → build timeline runs (Luna triage → Codex writes → smoke test → **one honest retry** → publish) → the bars appear → cut to a phone. That single artifact carries the whole submission.

**Demo staging:** the hero sim is *also* generated **live** in the video (honestly timelapsed with real timestamps), but its finished form is **pre-seeded in the Gallery** so the judge-testable link never depends on a live run succeeding on the judge's click.

---

## 2. The Seed Gallery — 15 curriculum-tagged manipulatives

10 math (Common Core) + 5 physics (NGSS). Grade bands span 3–12 so the Gallery reads as a real product with range, while the build/verification depth stays in math+physics only (the scope fence). Every one is produced through the **real pipeline** (Codex writes → headless smoke test → publish), and every card shows its **generation prompt** and **real standard code**.

### Math — Common Core

| # | Title (slug) | Grade | Standard | Standard text (short) | Teacher prompt (verbatim on card) | Core interaction |
|---|---|---|---|---|---|---|
| 1 ⭐ | Fraction-Division Bars (`fraction-division-bars`) | 6 | **6.NS.A.1** | Compute quotients of fractions | "Show why dividing by a fraction makes the answer bigger, not smaller." | Drag divisor smaller → quotient (pieces that fit) grows |
| 2 | Integer Number Line (`integer-number-line`) | 7 | **7.NS.A.1** | Add/subtract rational numbers on a number line | "Let them feel that subtracting a negative moves you to the right." | Drag a hop vector along a number line; sign flips direction |
| 3 | Double Number Line (`ratio-double-line`) | 6 | **6.RP.A.3** | Reason about ratios with tables & double number lines | "Show that 3 apples for $2 is the same rate as 9 for $6." | Stretch a linked pair of number lines; ratio stays fixed |
| 4 | Slope Explorer (`slope-explorer`) | 8 | **8.EE.B.5** | Graph proportional relationships; interpret slope | "Let them see that a steeper line means a bigger rate of change." | Drag a line's second point; rise/run and slope update live |
| 5 | Equivalent-Fraction Wall (`fraction-wall`) | 4 | **4.NF.A.1** | Recognize/generate equivalent fractions | "Show that 1/2 and 2/4 cover the exact same amount." | Stack fraction-strip rows; equal widths snap-align |
| 6 | Pythagorean Squares (`pythagorean-squares`) | 8 | **8.G.B.7** | Apply the Pythagorean theorem to find side lengths | "Let them see a² + b² literally fill up c²." | Drag legs of a right triangle; the three squares' areas tally |
| 7 | Mean as a Balance Beam (`mean-balance-beam`) | 6 | **6.SP.A.3** | A measure of center summarizes data with one number | "Show that the mean is the balance point of the data." | Drag data dots on a beam; it tips until balanced at the mean |
| 8 | Function Machine (`function-machine`) | 8 | **8.F.A.1** | Understand a function as one output per input | "Let them feel that a function gives exactly one output per input." | Drop inputs into a machine; rule transforms each to one output |
| 9 | Probability Spinner (`probability-spinner`) | 7 | **7.SP.C.6** | Approximate probability from long-run frequency | "Show that more spins get closer to the true probability." | Spin repeatedly; observed frequency converges to theoretical |
| 10 | Area-Model Multiplier (`area-model-distributive`) | 3 | **3.MD.C.7c** | Area models and the distributive property | "Show that 4 × 13 is 4 × 10 plus 4 × 3." | Split a rectangle's width; the two sub-areas sum to the whole |

### Physics — NGSS

| # | Title (slug) | Grade | Standard | Standard text (short) | Teacher prompt (verbatim on card) | Core interaction |
|---|---|---|---|---|---|---|
| 11 | Free-Fall Race (`free-fall-race`) | 9–12 | **HS-PS2-1** | Newton's 2nd law: net force, mass, acceleration | "Prove a heavy ball and a light ball hit the ground at the same time." | Set two masses; drop; both land together (no air resistance) |
| 12 | Projectile Launcher (`projectile-launcher`) | 9–12 | **HS-PS2-1** | Analyze force/mass/acceleration relationships | "Let them find the launch angle that throws the ball farthest." | Drag angle & speed; the 45° arc reveals maximum range |
| 13 | Wave Amplitude vs Frequency (`wave-amplitude-frequency`) | 6–8 | **MS-PS4-1** | Mathematical model of a wave's properties | "Show the difference between a louder wave and a higher-pitch wave." | Two sliders: amplitude (height) vs frequency (spacing), independent |
| 14 | Net-Force Cart (`net-force-cart`) | 6–8 | **MS-PS2-2** | Change in motion depends on net force and mass | "Let them feel that more force or less mass means more acceleration." | Add force arrows and mass blocks; acceleration responds |
| 15 | Kinetic-Energy Explorer (`kinetic-energy`) | 6–8 | **MS-PS3-1** | Kinetic energy relates to mass and speed | "Show that doubling speed quadruples the energy." | Sliders for mass & speed; KE bar tracks the v² relationship |

⭐ = hero demo prompt.

---

## 3. Seed teacher personas (Gallery attribution — not real accounts)

To make the Gallery read as a used product (not a solo dump) while staying honest, seed cards are attributed to a small set of **clearly labeled sample authors** (the README states these are seed personas, not real users; real external-teacher creations added during the Jul 19 launch are marked as such):

- **Ms. Alvarez** — 6th-grade math (hero prompt + #2, #3, #7).
- **Mr. Osei** — 8th-grade math (#4, #6, #8).
- **Ms. Tran** — 3rd/4th elementary math (#5, #9, #10).
- **Dr. Bell** — high-school physics (#11, #12).
- **Coach Ramirez** — middle-school physical science (#13, #14, #15).

## 4. Smoke-test invariants (what "verified" means per sim)

Every generated manipulative ships with a Codex-authored headless smoke test asserting **interactive invariants** — not pixel-perfection. Publish is blocked until all pass; a failure feeds its trace back to Codex for one retry. Representative invariants:

| Sim | Invariant asserted (examples) |
|---|---|
| Fraction-Division Bars (⭐) | Renders without error; a `divisor` control exists and is draggable; **monotonicity: decreasing the divisor never decreases the displayed quotient**; the readout equals `dividend ÷ divisor` at 3 sampled positions |
| Slope Explorer | Dragging the endpoint updates a numeric `slope`; slope sign matches the drag direction; vertical drag with zero run is handled (no `NaN`/crash) |
| Probability Spinner | Repeated spins produce a frequency that moves toward the theoretical value as N grows (tolerance-bounded); no spin returns an out-of-range outcome |
| Free-Fall Race | Two different masses reach `y=0` within one animation frame of each other; no negative or `NaN` positions |
| Wave Amplitude vs Frequency | Amplitude slider changes height but **not** wavelength; frequency slider changes spacing but **not** height (independence invariant) |

**Generic invariants applied to all 15:** (a) mounts and renders with no thrown error / console error; (b) every declared interactive control responds to a synthetic input event; (c) the core displayed relationship is correct at ≥3 sampled input points; (d) no `NaN`/`Infinity` leaks into the rendered DOM; (e) stays within the sandbox (no network call attempted, no import outside the allowlist).

## 5. Reproducible generator — `scripts/seed.ts`

Two modes, matching the workflow's "identical demo data on every run" requirement while keeping the honest "these were really generated by Codex" story:

- **`seed.ts --apply` (deterministic, default):** reads `data/fixtures/manifest.json` (the 15 records: slug, title, grade, standard code + text, teacher prompt, persona, invariant list) and the **committed, already-generated** component artifacts in `data/fixtures/sims/<slug>.tsx`, and upserts them into Supabase by slug. Produces **byte-identical** Gallery state every run — no Codex call, no credits spent, safe for CI and for a judge cloning the repo. Idempotent (upsert on `slug`).
- **`seed.ts --regen <slug>` (non-deterministic, provenance):** re-runs the *real* pipeline (Codex writes → headless smoke test → retry-with-trace → publish) for one slug and overwrites its fixture. This is how the committed artifacts were originally produced; it's the button that proves the seed set isn't hand-written. **Not** part of deterministic seeding — it's how we regenerate/refresh, gated behind an explicit flag so `--apply` stays reproducible.

**Fixtures committed to the repo (`data/fixtures/`):**
- `manifest.json` — the 15 records above, single source of truth.
- `standards.json` — real Common Core / NGSS codes + official descriptions (ingested at build time via `r.jina.ai` from the standards sites, so Luna's tagging and the Gallery cards use authentic text, per Actian lesson #8/#15).
- `sims/<slug>.tsx` — the 15 generated single-file React manipulatives.
- `sims/<slug>.smoke.ts` — the 15 Codex-authored smoke tests.

**Determinism note:** `--apply` never calls a model, so it's deterministic by construction. The committed `.tsx`/`.smoke.ts` artifacts are the frozen output of prior `--regen` runs; regenerating is an explicit, separate action.

## 6. Why this seed set scores

- **Real standards, not filler** — 15 authentic Common Core / NGSS codes with official descriptions make the Impact criterion concrete (a curriculum-literate judge, i.e. VP Education Leah Belsky, can verify `6.NS.A.1` is exactly the fraction-division standard).
- **One devastating prompt, deep** — the hero (`fraction-division-bars`) is the demo's spine; the other 14 prove range without diluting focus.
- **Prompts shown** — every card exposes the teacher sentence that made it, so the Gallery itself demonstrates the product's core claim (sentence → software) 15 times over.
- **Verification visible** — invariants are documented per sim; a judge can open a smoke test and see the loop is real, not decorative.
