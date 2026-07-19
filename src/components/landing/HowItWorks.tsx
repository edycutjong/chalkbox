/**
 * The verification loop — the moat, told as a doc-quality pipeline.
 * Gates mirror README "Why the loop matters" (G1–G4) exactly.
 */

interface Gate {
  id: string;
  title: string;
  detail: string;
  mono: string;
}

const GATES: Gate[] = [
  {
    id: "G1",
    title: "Safety + standard gate",
    detail: "Luna triages the prompt: subject, grade band, curriculum code — or rejects it.",
    mono: "accept · math · 6-8 · CCSS.6.NS.A.1",
  },
  {
    id: "G2",
    title: "Generate + static check",
    detail: "Sol writes a single-file React manipulative; AST validation enforces the allowlist.",
    mono: "import allowlist · no network APIs",
  },
  {
    id: "G3",
    title: "Render + interactive invariants",
    detail:
      "It mounts headlessly, then the pedagogy is asserted as a test. Fail → retry with the trace.",
    mono: "drag divisor smaller ⇒ quotient bigger ✓",
  },
  {
    id: "G4",
    title: "Output safety + publish",
    detail: "A final safety pass, then it ships under a strict no-network CSP.",
    mono: "CSP connect-src 'none' · null origin",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-20">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <span className="eyebrow" style={{ color: "var(--primary)" }}>
          The moat
        </span>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
          A chat can write code. It can&apos;t <span className="text-brandient">test</span> it.
        </h2>
        <p className="mt-4 text-base" style={{ color: "var(--text-mid)" }}>
          Chalkbox executes what it generates, reads the failure, fixes it, and only publishes what
          passes. The pedagogy itself is a machine-checked assertion — so a sim that renders but
          teaches the wrong thing never reaches a student.
        </p>
      </div>

      <ol className="grid gap-5 md:grid-cols-4">
        {GATES.map((g, i) => (
          <li key={g.id} className="card card-hover relative flex flex-col gap-3 p-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>
                {g.id}
              </span>
              <span className="font-display text-sm font-bold" style={{ color: "var(--text-low)" }}>
                0{i + 1}
              </span>
            </div>
            <h3 className="text-lg font-bold leading-snug">{g.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-mid)" }}>
              {g.detail}
            </p>
            <code
              className="mt-auto block rounded-lg px-3 py-2 font-mono text-[0.68rem] leading-relaxed"
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-mid)",
              }}
            >
              {g.mono}
            </code>
            {/* connector arrow (desktop) */}
            {i < GATES.length - 1 && (
              <span
                aria-hidden
                className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 md:block"
                style={{ color: "var(--primary)" }}
              >
                →
              </span>
            )}
          </li>
        ))}
      </ol>

      <p
        className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-2 text-center text-sm"
        style={{ color: "var(--text-low)" }}
      >
        <span className="font-mono text-xs" style={{ color: "var(--accent)" }}>
          ↺ retry-with-trace
        </span>
        on any gate failure, within a bounded token budget — never an infinite loop.
      </p>
    </section>
  );
}
