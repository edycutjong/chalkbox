/** Zero-JS accordion via <details>. Honest answers — incl. current status. */

interface QA {
  q: string;
  a: string;
}

const FAQS: QA[] = [
  {
    q: "Is it safe to run AI-written code in front of students?",
    a: "Every sim runs inside a null-origin iframe with a strict Content-Security-Policy (connect-src 'none'), an import allowlist, and AST validation before it ever mounts. It can't reach the network, read cookies, or touch the parent page.",
  },
  {
    q: "How is this different from asking ChatGPT for a simulation?",
    a: "A chat completion produces plausible-looking code. Chalkbox executes it, asserts the pedagogy as an interactive invariant (e.g. 'dragging the divisor smaller must make the quotient bigger'), reads the failure, and retries with the trace. It only publishes a sim that passed its own test.",
  },
  {
    q: "Do students need an account or an app?",
    a: "No. They open a zero-chrome share link on any phone or laptop — no login, no install, no app store.",
  },
  {
    q: "What subjects and grades does it cover?",
    a: "Math and physics today, tagged to real Common Core (CCSS) and NGSS standards. The safety gate rejects prompts that are off-curriculum or off-grade-band.",
  },
  {
    q: "Do I need an API key to try it?",
    a: "No. The site runs in demo mode with zero keys — the seeded gallery is fully browsable and the Create flow replays the flagship build end-to-end.",
  },
  {
    q: "Is it production-ready?",
    a: "It's a runnable demo built for OpenAI Build Week. The harness it exercises — the static validator and the interactive-invariant runner — is real and unit-tested. The live engine that generates a brand-new verified sim from any prompt is the next milestone.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-24 px-5 py-20">
      <div className="mb-10 text-center">
        <span className="eyebrow" style={{ color: "var(--primary)" }}>
          Questions
        </span>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Straight answers.</h2>
      </div>

      <div>
        {FAQS.map((f) => (
          <details key={f.q} className="faq">
            <summary>
              <span>{f.q}</span>
              <span className="chev font-mono" aria-hidden>
                +
              </span>
            </summary>
            <p className="faq-body">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
