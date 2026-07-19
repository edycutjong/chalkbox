import { RefreshCw, ShieldCheck, Ruler, Smartphone, type LucideIcon } from "lucide-react";

interface Benefit {
  icon: LucideIcon;
  title: string;
  body: string;
  span: string; // grid emphasis for an asymmetric layout
}

const BENEFITS: Benefit[] = [
  {
    icon: RefreshCw,
    title: "It tests itself before a child sees it",
    body: "Every generation renders headlessly and asserts its own interactive invariants. If the pedagogy is wrong, it retries with the error trace. Nothing untested ships.",
    span: "md:col-span-2",
  },
  {
    icon: ShieldCheck,
    title: "AI-written code, safely sandboxed",
    body: "Sims run in a null-origin iframe with a strict CSP (connect-src 'none'), an import allowlist, and AST validation. No network, no surprises.",
    span: "md:col-span-1",
  },
  {
    icon: Ruler,
    title: "Standards-aligned by construction",
    body: "Math and physics, tagged to real Common Core / NGSS codes — the gate rejects anything off-curriculum or off-grade.",
    span: "md:col-span-1",
  },
  {
    icon: Smartphone,
    title: "A link, not an app store",
    body: "Students open a zero-chrome manipulative on any phone. No login, no install — just the thing their class is stuck on tonight.",
    span: "md:col-span-2",
  },
];

export function Benefits() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <span className="eyebrow" style={{ color: "var(--primary)" }}>
          Why teachers can trust it
        </span>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
          The one artifact a teacher could never make herself.
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {BENEFITS.map((b) => {
          const Icon = b.icon;
          return (
            <article
              key={b.title}
              className={`card card-hover reveal flex flex-col gap-4 p-7 ${b.span}`}
            >
              <span className="feature-icon h-11 w-11" aria-hidden>
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <h3 className="text-xl font-bold leading-snug">{b.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-mid)" }}>
                {b.body}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
