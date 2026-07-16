import Link from "next/link";
import { Header } from "@/components/Header";
import { CreateFlow } from "@/components/CreateFlow";
import { DEMO_NOTICE } from "@/lib/demo";

export default function HomePage() {
  return (
    <main className="min-h-dvh">
      <Header />
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 pb-24 pt-8">
        <div className="flex flex-col gap-4 text-center">
          <span
            className="mx-auto text-xs font-medium uppercase tracking-[0.2em]"
            style={{ color: "var(--primary)" }}
          >
            🖍️ OpenAI Build Week · Education
          </span>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl chalk-underline mx-auto">
            A sentence becomes a self-tested manipulative.
          </h1>
          <p className="mx-auto max-w-xl text-base" style={{ color: "var(--text-mid)" }}>
            Ms. Alvarez types the misconception she fights every year. Two minutes later she has a
            live, phone-friendly manipulative that <em>passed its own tests</em> — and a link to
            text her students.
          </p>
        </div>

        <CreateFlow />

        <p className="text-center text-xs" style={{ color: "var(--text-low)" }}>
          {DEMO_NOTICE}{" "}
          <Link href="/gallery" style={{ color: "var(--primary)" }}>
            Browse the seeded gallery →
          </Link>
        </p>
      </section>
    </main>
  );
}
