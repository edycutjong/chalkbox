import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SimFrame } from "@/components/SimFrame";
import { BrandMark } from "@/components/BrandMark";
import { SubjectTag, StandardChip } from "@/components/Badges";
import { getSimByShareId } from "@/lib/seed/gallery";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>;
}): Promise<Metadata> {
  const { shareId } = await params;
  const sim = getSimByShareId(shareId);
  return {
    title: sim ? `${sim.title} — Chalkbox` : "Chalkbox",
    description: sim?.prompt ?? "A Chalkbox manipulative.",
  };
}

export default async function StudentPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const sim = getSimByShareId(shareId);
  if (!sim) notFound();

  return (
    // Phone-first, zero-chrome student surface — on the app's dark editorial
    // theme so it reads cohesively with the rest of Chalkbox (docs/UI.md §Screen C).
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-8">
      {/* soft brand glow for depth */}
      <div
        aria-hidden
        className="orb drift"
        style={{
          top: "-60px",
          left: "50%",
          width: "320px",
          height: "320px",
          marginLeft: "-160px",
          background: "var(--primary)",
          opacity: 0.35,
        }}
      />

      <div className="animate-up relative flex w-full max-w-md flex-col gap-4">
        {/* brand + curriculum context */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-center">
          <span
            className="inline-flex items-center gap-1.5 text-sm font-bold"
            style={{ color: "var(--text-hi)" }}
          >
            <BrandMark size={18} />
            Chalkbox
          </span>
          <SubjectTag subject={sim.subject} />
          <StandardChip code={sim.standard.code} text={sim.standard.text} />
        </div>

        {/* the manipulative, framed in a glass card */}
        <div className="glass rounded-3xl p-4 sm:p-5">
          <SimFrame sim={sim} compact />
        </div>

        {/* the pedagogical prompt */}
        <section
          data-testid="question-card"
          className="rounded-2xl p-4 text-center text-sm"
          style={{
            background: "var(--color-hover)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-hi)",
          }}
        >
          {sim.hero
            ? "You made the piece smaller but the answer got bigger. Predict 1 ÷ 0.25 before you drag there."
            : sim.interaction}
        </section>

        <footer className="flex items-center justify-center text-[11px]">
          <Link href="/" className="link-quiet inline-flex items-center gap-1.5">
            made with <BrandMark size={12} /> Chalkbox
          </Link>
        </footer>
      </div>
    </main>
  );
}
