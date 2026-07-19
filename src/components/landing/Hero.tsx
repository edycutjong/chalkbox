import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CreateFlow } from "@/components/CreateFlow";
import { BrandMark } from "@/components/BrandMark";
import { DEMO_MODE, DEMO_NOTICE } from "@/lib/demo";

/** Verifiable product facts — NO invented user counts (zero real traction yet). */
const STATS: { value: string; label: string }[] = [
  { value: "~2 min", label: "sentence → live sim" },
  { value: "0", label: "API keys to try it" },
  { value: "4", label: "verification gates" },
  { value: "6", label: "invariant types" },
];

export function Hero() {
  return (
    <section className="relative mx-auto w-full max-w-6xl overflow-hidden px-5 pb-16 pt-10 sm:pt-16">
      {/* floating brand orbs — depth behind the hero */}
      <div
        aria-hidden
        className="orb drift"
        style={{
          top: "-40px",
          left: "8%",
          width: "260px",
          height: "260px",
          background: "var(--primary)",
        }}
      />
      <div
        aria-hidden
        className="orb drift"
        style={{
          top: "40px",
          right: "6%",
          width: "220px",
          height: "220px",
          background: "var(--accent)",
          animationDelay: "-3s",
          opacity: 0.22,
        }}
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <span
          className="pill animate-up"
          style={{ animationDelay: "0ms", color: "var(--primary)" }}
        >
          <BrandMark size={14} /> OpenAI Build Week · Education
        </span>

        <h1 className="text-4xl font-bold leading-[1.05] sm:text-6xl">
          <span className="animate-up inline-block" style={{ animationDelay: "60ms" }}>
            A sentence becomes a{" "}
          </span>
          <span
            className="text-brandient animate-up inline-block"
            style={{ animationDelay: "180ms" }}
          >
            self-tested
          </span>{" "}
          <span className="animate-up inline-block" style={{ animationDelay: "300ms" }}>
            manipulative.
          </span>
        </h1>

        <p
          className="animate-up max-w-xl text-base sm:text-lg"
          style={{ animationDelay: "420ms", color: "var(--text-mid)" }}
        >
          A teacher types the misconception she fights every year. Codex writes an interactive,{" "}
          <em>runs its own test</em>, retries until it passes, and publishes a phone-friendly
          manipulative her students open on any device.
        </p>

        <div
          className="animate-up flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "540ms" }}
        >
          <Link href="/create" className="btn btn-primary">
            Create one now <ArrowRight className="icon-nudge" size={17} aria-hidden />
          </Link>
          <Link href="/#how" className="btn btn-ghost">
            See how the loop works
          </Link>
        </div>

        {/* Social proof — real, checkable numbers, not testimonials. */}
        <dl
          className="animate-up mt-4 grid w-full max-w-lg grid-cols-4 gap-3"
          style={{ animationDelay: "660ms" }}
        >
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <dt className="font-display text-2xl font-bold" style={{ color: "var(--text-hi)" }}>
                {s.value}
              </dt>
              <dd className="text-[0.62rem] leading-tight" style={{ color: "var(--text-low)" }}>
                {s.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Live interactive centerpiece — the product IS the hero media. */}
      <div id="create" className="animate-fade mx-auto mt-14 w-full max-w-3xl scroll-mt-24">
        <div className="mb-3 flex items-center justify-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full blink"
            style={{ background: "var(--color-success)" }}
            aria-hidden
          />
          <span className="eyebrow" style={{ color: "var(--text-mid)" }}>
            Live · watch it test itself
          </span>
        </div>
        <CreateFlow />
        {DEMO_MODE && (
          <p className="mt-3 text-center text-xs" style={{ color: "var(--text-low)" }}>
            {DEMO_NOTICE}
          </p>
        )}
      </div>
    </section>
  );
}
