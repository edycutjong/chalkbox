import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GALLERY_SIMS } from "@/lib/seed/gallery";
import { SubjectIcon } from "@/components/icons";

export function GalleryPreview() {
  const sims = GALLERY_SIMS.slice(0, 6);
  return (
    <section id="gallery" className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-20">
      <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="max-w-xl">
          <span className="eyebrow" style={{ color: "var(--primary)" }}>
            The gallery
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Every card is a real standard and the exact sentence that made it.
          </h2>
        </div>
        <Link href="/gallery" className="btn btn-ghost text-sm">
          Browse all {GALLERY_SIMS.length}{" "}
          <ArrowRight className="icon-nudge" size={16} aria-hidden />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sims.map((s) => (
          <article key={s.slug} className="card card-hover reveal flex min-w-0 flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
              <span
                className="pill font-mono"
                style={{ color: "var(--accent)", fontSize: "0.66rem" }}
              >
                {s.standard.framework} {s.standard.code}
              </span>
              <span className="feature-icon h-9 w-9" aria-hidden>
                <SubjectIcon subject={s.subject} size={18} strokeWidth={1.75} />
              </span>
            </div>
            <h3 className="text-lg font-bold leading-snug">{s.title}</h3>
            <p className="text-sm italic leading-relaxed" style={{ color: "var(--text-mid)" }}>
              “{s.prompt}”
            </p>
            <div
              className="mt-auto flex min-w-0 items-center gap-2 border-t pt-3 text-xs"
              style={{ borderColor: "var(--border-subtle)", color: "var(--text-low)" }}
            >
              <span
                className="rounded px-1.5 py-0.5 font-mono"
                style={{ background: "var(--color-hover)", color: "var(--primary)" }}
              >
                Grade {s.gradeLabel}
              </span>
              <span className="min-w-0 truncate">{s.interaction}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
