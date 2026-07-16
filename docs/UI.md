# UI — Chalkbox (design decisions + component list)

> **Text only — no images generated.** This documents the design language, the three screens, and the component inventory for a build in Next.js + React + Tailwind. Design is 1 of 4 equal rubric criteria ("complete, coherent product experience — not just a technical proof of concept"), so this is not decoration — it's a quarter of the score.

---

## 1. Design principles

1. **The transformation is the hero.** The product's entire emotional payload is *one sentence → running software*. Every screen serves that reveal; nothing competes with it.
2. **Trust is visible.** The self-testing loop is the moat — so the build timeline *shows* Codex writing, testing, and retrying. We never hide the verification behind a spinner; the retry-on-failure moment is a feature, not an embarrassment.
3. **Two audiences, two moods.** The teacher surface is calm, focused, "prep-at-9pm" quiet. The student surface is bright, full-bleed, tappable, zero-chrome — it must feel like a toy, not a form.
4. **Proud constraints.** "Math & physics manipulatives" is stated in the UI as a badge, not buried as a limitation. Narrow scope reads as intent.
5. **Phone-first for students, laptop-first for teachers.** Teachers create on a laptop; students open on whatever cracked phone they have. The student view is designed mobile-up.
6. **Honest, humane failure.** When generation can't pass its own tests, the UI says exactly that ("This didn't pass its own tests — try rephrasing") and offers the prompt back. No fake success, no dead end.

## 2. Visual language

- **Name metaphor:** *Chalkbox* — a box of chalk, the humblest teaching tool. Warm, tactile, classroom, not "AI startup."
- **Palette:** warm chalk-on-slate. A deep slate/charcoal ground (`#1f2530`-ish) for the teacher app and student frame, chalk-white ink, and **one accent** — a chalk-yellow/amber (`#f2c14e`-ish) reserved for the primary action ("Create") and the live "verified ✓" moment. A muted teal for math, a warm coral for physics as subject tags. Restraint: one accent, two subject tints, nothing else.
- **Typography:** a friendly humanist sans for UI (Inter/system), and a slightly chalky display face for the big prompt-box label and the hero headline. Generous line-height; this is an app used tired, at night.
- **Texture:** a faint chalk-dust grain on the dark ground; hand-drawn underline strokes under section headers to sell the "chalk" metaphor without being kitschy.
- **Motion:** restrained. The one place motion is spent lavishly is the **build timeline** (stages animating in with real timestamps) and the **manipulative reveal** (the sim fading/scaling in when it passes). Everything else is instant.
- **Theme:** ships dark by default (the slate ground); the student iframe inherits a light, high-contrast surface so sims read on a projector and a phone in sunlight.

## 3. Screens

### Screen A — Create (teacher, laptop-first)

The product's front door. Deliberately empty and calm.

- **Hero prompt box**, centered, oversized, label: **"What do you want your students to *feel*?"** (the "feel," not "learn," is the whole thesis — manipulatives beat explanations).
- **Example chips** below the box (tap to fill): *"why dividing by a fraction makes the answer bigger" · "why a heavy and a light ball fall at the same rate" · "why 45° throws the ball farthest."* These double as the demo's on-ramp and a hint at the math+physics scope.
- **Scope badge**: a small pill — *"Math & physics manipulatives."* Proud, not apologetic.
- **On submit → the Build Timeline replaces the box in place** (no page nav): a vertical stepper streaming real SSE events —
  1. `Checking it's classroom-ready…` (Luna) ✓
  2. `Codex is writing the manipulative…` (Sol)
  3. `Running its own smoke test…`
  4. *(if failed)* `First try didn't pass — Codex is fixing it…` ← **the trust moment, shown, not hidden**
  5. `Verified ✓ Published` (amber)
  Each step carries a **real timestamp**; the video's time-compression is labeled, never faked.
- **Result state**: the live manipulative renders inline (in its sandboxed iframe), with a **student share link** (one-tap copy), a **"Publish to Gallery"** toggle, and a **"Make another"** reset.
- **Failure state**: honest copy + the prompt returned to the box + a "try rephrasing" nudge.

### Screen B — Gallery (discovery, responsive grid)

Proof of depth even without a live generation — the judge-testable surface.

- **Filter bar**: subject (Math / Physics), grade band, and a standards filter (real Common Core / NGSS codes).
- **Sim cards** (the core component), each showing: title, a live **thumbnail preview** of the manipulative (a small non-interactive render), subject tag (teal/coral), grade band, **the real standard code + short description** (e.g. `6.NS.A.1 · Compute quotients of fractions`), and — the differentiator — **the exact teacher prompt that generated it**, in quotes. A **"Remix"** button pre-fills the Create box with that prompt.
- **Attribution**: seed persona name (Ms. Alvarez, Dr. Bell…) with a small "sample" marker; real launch-teacher cards marked distinctly.
- Seeded with the 15 curriculum-tagged manipulatives from `SEED_DATA.md`; the hero fraction-division card is visually featured.

### Screen C — Student link (`/s/:token`, phone-first, zero-chrome)

Where a kid actually plays. Everything above is in service of this.

- **Full-bleed manipulative** in its sandboxed iframe, edge-to-edge on a phone, light high-contrast surface.
- **One embedded question** overlaid or docked below the sim (e.g., *"You made the piece smaller but the answer got bigger. Predict 6 ÷ 1/4 before you drag there."*).
- **No login, no nav, no Chalkbox chrome competing for attention** — a single tiny "made with Chalkbox" mark, nothing more.
- Large touch targets; works one-thumbed on a Chromebook trackpad or a phone.

### Supporting surface — Landing (single hero section, top of `/`)

- The **Ms. Alvarez hook** as the headline (PRD §Emotional Hook), a 12-second embedded demo loop, one CTA into Create, and the scope badge. This is the first thing a judge or a launched-to teacher sees.

## 4. Component inventory

| Component | Screen | Notes |
|---|---|---|
| `PromptBox` | Create, Landing | Oversized textarea + submit; holds the "feel" label + example chips |
| `ExampleChips` | Create | Tap-to-fill; also the scope hint |
| `ScopeBadge` | Create, Landing, Gallery | "Math & physics manipulatives" pill |
| `BuildTimeline` | Create | SSE-driven stepper; renders triage → write → test → retry → verified with real timestamps. **The trust centerpiece** |
| `TimelineStep` | Create | One row: icon, label, timestamp, state (pending/active/pass/fail) |
| `SimFrame` | Create, Student, Gallery(thumb) | The sandboxed iframe wrapper (no-network, CSP, allowlist); the single rendering boundary reused everywhere |
| `ShareLinkBar` | Create | One-tap copy student link + "Publish to Gallery" toggle |
| `FailureCard` | Create | Honest "didn't pass its tests — try rephrasing" state |
| `GalleryGrid` + `SimCard` | Gallery | Card shows title, thumb, subject tag, grade, **standard code + text**, **generation prompt**, Remix |
| `FilterBar` | Gallery | Subject / grade / standard filters |
| `SubjectTag` | Gallery, Student | Teal (math) / coral (physics) |
| `StandardChip` | Gallery | Real Common Core / NGSS code + short description |
| `QuestionCard` | Student | The embedded prompt docked with the sim |
| `MagicLinkForm` | Auth | The entire auth UI — email in, link out |
| `Hero` | Landing | Ms. Alvarez headline + demo loop + CTA |

## 5. Accessibility & device notes

- Student sims target WCAG AA contrast on a projector and a sunlit phone; controls are keyboard- and touch-operable (part of the smoke-test's "every control responds to a synthetic event" invariant, so a11y and verification reinforce each other).
- No motion in student sims is essential-only; respects `prefers-reduced-motion`.
- Gallery and Student views are SSR for fast first paint on school networks.

## 6. What we deliberately did NOT design

Per the PRD scope fence: no dashboard, no roster/classroom UI, no gradebook, no in-app sim editor, no comments/likes/social, no settings sprawl, no dark/light toggle beyond the built-in split. Three screens + a landing + a magic-link form. The restraint is the design.
