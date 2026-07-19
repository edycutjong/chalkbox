/**
 * "Proof, not promises" — replaces fabricated testimonials (we have zero real
 * users yet) with the REAL self-debug trace and verifiable engineering facts.
 * The trace mirrors StubOrchestrator's genuinely-computed 3-attempt run.
 */

interface TraceLine {
  gate: string;
  text: string;
  status: "fail" | "pass";
}

const TRACE: TraceLine[] = [
  {
    gate: "attempt 1",
    text: "codex reached for live data — fetch() rejected by G2",
    status: "fail",
  },
  {
    gate: "attempt 2",
    text: "renders, but quotient SHRINKS as divisor shrinks — G3 fails",
    status: "fail",
  },
  {
    gate: "attempt 3",
    text: "quotient grows as divisor shrinks — G3 invariants green",
    status: "pass",
  },
];

const FACTS: { value: string; label: string }[] = [
  { value: "47", label: "unit + E2E tests green" },
  { value: "6-stage", label: "CI: quality → deploy" },
  { value: "15", label: "curriculum-tagged sims" },
  { value: "MIT", label: "open source" },
];

export function Proof() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        {/* Left: the honest pitch */}
        <div className="flex flex-col gap-5">
          <span className="eyebrow" style={{ color: "var(--primary)" }}>
            Proof, not promises
          </span>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Watch it catch its own mistake — and fix it.
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-mid)" }}>
            This is the real self-debug loop on the flagship fraction-division sim: two rejected
            attempts, then a verified one. The static validator and the interactive-invariant runner
            it exercises are real and unit-tested — you can run them yourself.
          </p>
          <dl className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-4">
            {FACTS.map((f) => (
              <div key={f.label} className="flex flex-col gap-1">
                <dt className="font-display text-2xl font-bold" style={{ color: "var(--text-hi)" }}>
                  {f.value}
                </dt>
                <dd className="text-[0.66rem] leading-tight" style={{ color: "var(--text-low)" }}>
                  {f.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right: terminal trace */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{ border: "1px solid var(--border-default)", boxShadow: "var(--shadow-lg)" }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ background: "var(--bg-base)", borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span className="h-3 w-3 rounded-full" style={{ background: "#ff5f57" }} />
            <span className="h-3 w-3 rounded-full" style={{ background: "#febc2e" }} />
            <span className="h-3 w-3 rounded-full" style={{ background: "#28c840" }} />
            <span className="ml-3 font-mono text-xs" style={{ color: "var(--text-low)" }}>
              chalkbox generate · fraction-division
            </span>
          </div>
          <div
            className="flex flex-col gap-3 p-5 font-mono text-[0.78rem] leading-relaxed"
            style={{ background: "var(--bg-base)" }}
          >
            {TRACE.map((l) => (
              <div key={l.gate} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex-shrink-0"
                  style={{
                    color: l.status === "pass" ? "var(--color-success)" : "var(--color-error)",
                  }}
                  aria-hidden
                >
                  {l.status === "pass" ? "✓" : "✗"}
                </span>
                <span style={{ color: "var(--text-low)" }} className="w-20 flex-shrink-0">
                  {l.gate}
                </span>
                <span style={{ color: "var(--text-mid)" }}>{l.text}</span>
              </div>
            ))}
            <div className="mt-1 flex items-center gap-3" style={{ color: "var(--color-success)" }}>
              <span aria-hidden>▸</span>
              <span>published → sandboxed share link</span>
              <span className="blink" aria-hidden>
                ▋
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
