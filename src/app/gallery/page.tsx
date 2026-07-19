import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { GalleryGrid } from "@/components/GalleryGrid";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { ScopeBadge } from "@/components/Badges";

export const metadata: Metadata = {
  title: "Gallery — Chalkbox",
  description:
    "15 curriculum-tagged math & physics manipulatives, each with its real CCSS/NGSS code and the exact teacher prompt that generated it.",
};

export default function GalleryPage() {
  return (
    <main className="min-h-dvh">
      <RevealOnScroll />
      <Header />
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 pb-24 pt-6">
        <div className="flex flex-col gap-3">
          <h1
            className="text-3xl font-bold chalk-underline w-fit"
            style={{ color: "var(--text-hi)" }}
          >
            The Gallery
          </h1>
          <p className="max-w-2xl text-sm" style={{ color: "var(--text-mid)" }}>
            Every card shows the real curriculum standard and the exact sentence a teacher typed to
            make it — the product&rsquo;s core claim, demonstrated 15 times over.
          </p>
          <ScopeBadge />
        </div>
        <GalleryGrid />
      </section>
    </main>
  );
}
