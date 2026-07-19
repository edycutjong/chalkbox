/**
 * DEMO MODE.
 *
 * Chalkbox ships judge-testable with ZERO environment variables and ZERO API
 * keys. When DEMO_MODE is true (the default in this skeleton) the generation
 * orchestrator is a STUB that returns a pre-seeded, honestly-labeled build
 * trace instead of calling the real Codex/Supabase engine.
 *
 * The real engine drops in by setting these env vars and flipping DEMO_MODE off
 * at the seams marked `// STUB:` across src/lib/harness.
 */

// STUB: real mode activates only when an OpenAI key is present. Absent → demo.
export const DEMO_MODE: boolean =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  process.env.CHALKBOX_DEMO_MODE === "true" ||
  (!process.env.OPENAI_API_KEY && process.env.CHALKBOX_DEMO_MODE !== "false");

/** A short, honest banner shown wherever demo data is served. */
export const DEMO_NOTICE = "Demo mode — pre-seeded build trace, no live Codex/Supabase call.";
