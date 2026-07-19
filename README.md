<div align="center">
  <h1>Chalkbox 🖍️</h1>
  <p><em>Type the misconception; get a self-tested interactive manipulative in two minutes.</em></p>
  <img src="docs/assets/readme-hero.png" alt="Chalkbox — interactive manipulatives, conjured by a teacher's sentence" width="100%">

  <br/><br/>

  [![Live Demo](https://img.shields.io/badge/🚀_Live-chalkbox.edycu.dev-14b8a6?style=for-the-badge)](https://chalkbox.edycu.dev)
  [![Pitch Video](https://img.shields.io/badge/🎬_Demo-Video-ef4444?style=for-the-badge)](#-demo-video)
  [![Built for OpenAI Build Week](https://img.shields.io/badge/OpenAI-Build_Week_2026-8b5cf6?style=for-the-badge)](https://openai.devpost.com)

  <br/>

  ![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
  ![Codex](https://img.shields.io/badge/Codex_SDK-412991?style=flat&logo=openai&logoColor=white)
  ![GPT-5.6](https://img.shields.io/badge/GPT--5.6-412991?style=flat&logo=openai&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
  ![Vercel](https://img.shields.io/badge/Vercel-black?style=flat&logo=vercel)
  [![License: MIT](https://img.shields.io/badge/License-MIT-14b8a6?style=flat)](LICENSE)
  [![CI](https://github.com/edycutjong/chalkbox/actions/workflows/ci.yml/badge.svg)](https://github.com/edycutjong/chalkbox/actions/workflows/ci.yml)
  [![CodeQL](https://github.com/edycutjong/chalkbox/actions/workflows/codeql.yml/badge.svg)](https://github.com/edycutjong/chalkbox/actions/workflows/codeql.yml)

</div>

---

## 📸 See it in Action

<div align="center">
  <img src="docs/assets/devpost-gallery.png" alt="The sim tests itself before a student ever sees it" width="100%">
</div>

> **A teacher types a misconception → Codex writes a manipulative, runs its own smoke test, retries on failure, and only then publishes → a student opens it on any phone.** Nothing untested reaches a child.

---

## 💡 The Problem & Solution

Interactive manipulatives are the single most effective tool for breaking a math or physics misconception — and the one artifact a teacher can never make herself. She can write a worksheet. She can find a video. She cannot author software at 9 PM for tomorrow's 8 AM class. Edtech vendors ship a fixed catalog on a multi-month roadmap, not the bespoke thing *her* class is stuck on tonight.

**Chalkbox** closes that gap. A teacher types the misconception she wants to break — *"show why dividing by a fraction makes the answer bigger, not smaller"* — and in under two minutes she has a live, draggable manipulative her students open on any phone. No code. No app store. No waiting for a vendor.

**Key Features:**
- ⚡ **Self-testing generation loop** — At runtime, Codex writes a single-file interactive React component, renders it headlessly, asserts its *interactive invariants* hold (a smoke test Codex also writes), retries with the error trace on failure, and only then publishes. This loop is the moat.
- 🎓 **Curriculum-tagged gallery** — A public grid seeded with manipulatives, each showing its real Common Core / NGSS standard code and the exact prompt that generated it.
- 📱 **Phone-friendly share links** — Students open a zero-chrome sim running inside a locked-down, network-severed sandboxed iframe.

---

## 🧠 Why the loop matters (the moat)

A single chat completion can produce plausible-looking code. It cannot **execute** it, **test** it, **read the failure**, and **fix** it. Chalkbox does exactly that, every generation:

```
G1  Luna safety + standard gate  →  accept (math, grade 6-8, CCSS.6.NS.A.1)
    codex generate               →  interactive component + invariant spec
G2  static/AST validation        →  import allowlist, no network APIs
    headless render              →  mounts, deterministic, fake timers
G3  interactive invariants       →  "drag divisor smaller ⇒ quotient bigger" ✓
    (fail → retry with trace, bounded budget)
G4  Luna output safety           →  no inappropriate labels
    publish                      →  sandboxed iframe, CSP no-network
```

The pedagogy itself is encoded as a machine-checked test. If Codex generates a sim where dragging the divisor down makes the quotient go *down*, it's pedagogically wrong even though it "renders fine" — and **G3 catches it and forces a retry.** See [`docs/COMPLEXITY.md`](docs/COMPLEXITY.md) for the full invariant DSL and sandbox model.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js + React on Vercel |
| **Generation engine** | Codex SDK (TypeScript) driving `codex` in sandboxed per-request working dirs |
| **Models** | GPT-5.6 **Sol** (generation/iteration) · GPT-5.6 **Luna** (triage: safety gate + grade tag + standard alignment) |
| **Data** | Supabase (share links + gallery) |
| **Sandbox** | Null-origin iframe · strict CSP (`connect-src 'none'`) · import allowlist · AST validation |

Full design in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · complexity blueprint in [`docs/COMPLEXITY.md`](docs/COMPLEXITY.md) · demo data in [`docs/SEED_DATA.md`](docs/SEED_DATA.md).

---

## 🤝 Where Codex Accelerated

> Populated from the primary Codex CLI session (the `/feedback` Session ID submitted with this project). This section quotes the real decision points where Codex authored, tested, and iterated the generation pipeline — filled in as the build progresses.

---

## 🚀 Getting Started

> **For Judges:** the seeded gallery at [chalkbox.edycu.dev](https://chalkbox.edycu.dev) is browsable with zero setup — no login.
>
> **Current status — runnable skeleton in demo mode.** The Create flow replays the flagship fraction-division build end-to-end (prompt → self-test → published share link) with no API keys. The harness it exercises is **real and unit-tested**: the static validator (import allowlist / no-network) and the interactive-invariant runner both work and pass. The live Codex-driven generation engine (arbitrary prompt → new verified sim) is the next milestone and drops in behind the `// STUB:` seams in `src/lib/harness/orchestrator.ts`.

### Prerequisites
- Node.js ≥ 20
- npm

### Local run
```bash
git clone https://github.com/edycutjong/chalkbox.git
cd chalkbox
npm install
cp .env.example .env.local   # add your OpenAI + Supabase keys
npm run dev
```

---

## 🧪 Testing & CI

The generation loop is the moat — so the harness that guards it is production-grade. A **6-stage GitHub Actions pipeline** runs on every push: **Quality → Security → Build → E2E → Performance → Deploy Gate**, with concurrency cancellation and a Node `20 / 22 / 24` matrix on `main`.

```bash
# ── Code Quality ────────────────────────────
npm run lint          # ESLint (next lint)
npm run typecheck     # TypeScript strict (tsc --noEmit)
npm run test          # Unit tests (Vitest)
npm run test:coverage # Coverage report (v8)
npm run format:check  # Prettier
npm run ci            # Full quality gate (format + lint + typecheck + coverage + build)

# ── Advanced Testing ────────────────────────
npm run build && npm run e2e   # Playwright E2E (demo mode, no keys)
npm run e2e:ui                 # Playwright interactive mode
npm run lighthouse             # Lighthouse CI audit

# ── Security ────────────────────────────────
make security-scan             # npm audit + license compliance
```

The unit suite covers the harness that *is* the product — the invariant runner, the static validator (import allowlist / no-network), and the retry orchestrator.

| Layer            | Tool                                | Status |
| ---------------- | ----------------------------------- | ------ |
| Code Quality     | ESLint + TypeScript strict          | ✅     |
| Formatting       | Prettier                            | ✅     |
| Unit Testing     | Vitest (harness suites)             | ✅     |
| E2E Testing      | Playwright (3 specs, demo mode)     | ✅     |
| Security (SAST)  | CodeQL                              | ✅     |
| Security (SCA)   | Dependabot + npm audit              | ✅     |
| Secret Scanning  | TruffleHog (CI stage)               | ✅     |
| Performance      | Lighthouse CI                       | ✅     |

E2E specs run entirely in **demo mode** with zero environment variables: a smoke test (`e2e/demo-mode.spec.ts`), the core Create flow through to a published share link (`e2e/create-flow.spec.ts`), and responsive layout at 375 / 768 / 1440 px (`e2e/responsive.spec.ts`).

---

## 📁 Project Structure

```
chalkbox/
├── docs/                 # PRD, architecture, complexity blueprint + README assets
│   └── assets/           # Hero, OG image, gallery/thumbnail renders
├── e2e/                  # Playwright specs (demo-mode, create-flow, responsive)
├── public/               # icon.svg + og-image.png (wired into layout metadata)
├── src/
│   ├── app/              # Next.js App Router pages (/, /gallery, /create, /s/[shareId])
│   ├── components/       # CreateFlow, GalleryGrid, SimFrame, Header, Brand, Badges
│   └── lib/
│       ├── harness/      # The moat: validator, invariant-runner, orchestrator, safety
│       ├── manipulatives/# Flagship interactive (fraction-division)
│       └── seed/         # Curriculum-tagged gallery seed data
├── .github/              # CI/CD pipeline, CodeQL, Dependabot, community health files
├── lighthouserc.json     # Performance/accessibility/SEO thresholds
├── playwright.config.ts  # E2E config
└── README.md             # You are here
```

---

## 🎯 Scope & Honest Limitations

- **Math and physics manipulatives only** — stated proudly. That discipline is why the generation loop can be hardened enough to trust with 32 kids.
- **Runtime generation has real latency and a non-zero failure rate** even after retry. When the live engine lands, its true success rate will be published via a reproducible `scripts/bench.ts` rather than hidden — and the seeded gallery means a judge never *needs* a live generation to succeed to evaluate the product.
- A passing smoke test asserts interactive invariants, not a formal proof of pedagogical soundness.
- **What's real today:** the validator + invariant runner + spend-guard budget ceiling + the flagship fraction-division sim (21 unit tests, 26 E2E tests, all green). **What's stubbed today:** the Codex generation engine, Supabase persistence, magic-link auth, the cross-origin sandboxed-iframe host, and the SSE verify stream — each honestly marked `// STUB:` in source. No generation benchmark exists yet.

---

## 🎬 Demo Video

_Link added before submission — a ≤3-min narrated walkthrough with the self-test loop as the centerpiece. Script in [`docs/SUBMISSION.md`](docs/SUBMISSION.md)._

---

## 📄 License

[MIT](LICENSE) © 2026 Edy Cu

## 🙏 Acknowledgments

Built for **OpenAI Build Week 2026** (Education track). Thank you to OpenAI for Codex and the GPT-5.6 models — the coding-agent workflow *is* the product.
