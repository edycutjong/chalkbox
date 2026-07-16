"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StandardChip, SubjectTag } from "@/components/Badges";
import { GALLERY_SIMS, type GallerySim } from "@/lib/seed/gallery";

type SubjectFilter = "all" | "math" | "physics";

export function GalleryGrid() {
  const [subject, setSubject] = useState<SubjectFilter>("all");

  const sims = useMemo(
    () => (subject === "all" ? GALLERY_SIMS : GALLERY_SIMS.filter((s) => s.subject === subject)),
    [subject],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Subject filter">
        {(["all", "math", "physics"] as const).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={subject === f}
            onClick={() => setSubject(f)}
            className="rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors"
            style={{
              background: subject === f ? "var(--color-hover)" : "var(--bg-overlay)",
              color: subject === f ? "var(--primary)" : "var(--text-mid)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs" style={{ color: "var(--text-low)" }}>
          {sims.length} manipulatives
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sims.map((sim) => (
          <SimCard key={sim.slug} sim={sim} />
        ))}
      </div>
    </div>
  );
}

function SimCard({ sim }: { sim: GallerySim }) {
  return (
    <article
      className="glass flex flex-col gap-3 rounded-2xl p-5"
      style={sim.hero ? { borderColor: "var(--accent)" } : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <SubjectTag subject={sim.subject} />
        <span className="text-xs" style={{ color: "var(--text-low)" }}>
          Grade {sim.gradeLabel}
        </span>
      </div>

      <h3 className="text-lg font-bold" style={{ color: "var(--text-hi)" }}>
        {sim.hero && <span aria-hidden>⭐ </span>}
        {sim.title}
      </h3>

      <StandardChip code={sim.standard.code} text={sim.standard.text} />

      <blockquote
        className="rounded-xl p-3 text-sm italic"
        style={{ background: "var(--bg-overlay)", color: "var(--text-mid)" }}
      >
        “{sim.prompt}”
      </blockquote>

      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-xs" style={{ color: "var(--text-low)" }}>
          {sim.persona} · <span title="Seed persona, not a real account">sample</span>
        </span>
        <div className="flex gap-2">
          <Link
            href="/"
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ border: "1px solid var(--border-default)", color: "var(--text-hi)" }}
          >
            Remix
          </Link>
          <Link
            href={`/s/${sim.shareId}`}
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: "var(--primary)", color: "#02120f" }}
          >
            Open
          </Link>
        </div>
      </div>
    </article>
  );
}
