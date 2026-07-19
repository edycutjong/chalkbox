/**
 * Chalkbox landing page.
 *
 * Aesthetic direction (landing-page-guide-v2): Editorial · dark chalk-on-slate,
 * Space Grotesk display + JetBrains Mono, teal #14B8A6 / amber #F59E0B, mesh +
 * grid background. Staggered load-in entrances, zero-JS FAQ, glass cards.
 *
 * The 11 elements map to: Header (logo+nav+CTA) → Hero (title, CTA, live product
 * + real-stat social proof) → HowItWorks (media/intelligence) → Benefits →
 * Proof (self-debug trace, in place of fabricated testimonials) → GalleryPreview
 * (real seed data) → FAQ → FinalCTA → Footer. Copy is honest: no invented users.
 */

import { Header } from "@/components/Header";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Benefits } from "@/components/landing/Benefits";
import { Proof } from "@/components/landing/Proof";
import { GalleryPreview } from "@/components/landing/GalleryPreview";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-dvh">
      <RevealOnScroll />
      <Header />
      <Hero />
      <div className="hairline mx-auto max-w-6xl" />
      <HowItWorks />
      <Benefits />
      <Proof />
      <GalleryPreview />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
