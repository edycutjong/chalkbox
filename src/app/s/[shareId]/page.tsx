import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SimFrame } from "@/components/SimFrame";
import { getSimByShareId } from "@/lib/seed/gallery";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>;
}): Promise<Metadata> {
  const { shareId } = await params;
  const sim = getSimByShareId(shareId);
  return {
    title: sim ? `${sim.title} 🖍️` : "Chalkbox 🖍️",
    description: sim?.prompt ?? "A Chalkbox manipulative.",
  };
}

export default async function StudentPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const sim = getSimByShareId(shareId);
  if (!sim) notFound();

  return (
    // Phone-first, zero-chrome, light high-contrast surface (docs/UI.md §Screen C).
    <main
      data-theme="light"
      className="flex min-h-dvh flex-col items-stretch justify-center gap-4 px-4 py-6"
      style={{ background: "#f8fafc", color: "#0f172a" }}
    >
      <div className="mx-auto w-full max-w-md">
        <SimFrame sim={sim} compact />
      </div>

      <section
        data-testid="question-card"
        className="mx-auto w-full max-w-md rounded-2xl p-4 text-center text-sm"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        }}
      >
        {sim.hero
          ? "You made the piece smaller but the answer got bigger. Predict 1 ÷ 0.25 before you drag there."
          : sim.interaction}
      </section>

      <footer className="mx-auto text-[11px]" style={{ color: "#94a3b8" }}>
        made with 🖍️ Chalkbox
      </footer>
    </main>
  );
}
