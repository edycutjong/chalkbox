import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export function FinalCTA() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16">
      <div
        className="relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-16 sm:py-20"
        style={{
          border: "1px solid var(--border-default)",
          background: "var(--bg-elevated)",
          backdropFilter: "var(--blur-glass)",
          WebkitBackdropFilter: "var(--blur-glass)",
        }}
      >
        {/* glow wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: "var(--gradient-mesh)" }}
        />
        <div className="relative flex flex-col items-center gap-6">
          <span className="pill" style={{ color: "var(--primary)" }}>
            <BrandMark size={14} /> No login · no keys · ~2 minutes
          </span>
          <h2 className="max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
            Type the misconception. <br />
            <span className="text-brandient">Watch it test itself.</span>
          </h2>
          <p className="max-w-lg text-base" style={{ color: "var(--text-mid)" }}>
            The manipulative your class is stuck on tonight — built, verified, and shareable before
            the bell.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link href="/create" className="btn btn-primary text-base">
              Create a manipulative <ArrowRight className="icon-nudge" size={18} aria-hidden />
            </Link>
            <Link href="/gallery" className="btn btn-ghost text-base">
              Explore the gallery
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
