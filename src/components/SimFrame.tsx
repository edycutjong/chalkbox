import FractionDivision from "@/lib/manipulatives/fraction-division";
import { SubjectIcon } from "@/components/icons";
import type { GallerySim } from "@/lib/seed/gallery";

/**
 * SimFrame — the single rendering boundary reused across Create, Student and
 * Gallery (docs/UI.md §4). In production this is the sandboxed cross-origin
 * iframe (sandbox="allow-scripts", strict CSP, connect-src 'none' — see
 * docs/COMPLEXITY.md §2.2/§2.3). In this skeleton it renders the flagship
 * manipulative inline and represents the sandbox boundary visually.
 *
 * Only the flagship (fraction-division-bars) has a live interactive renderer in
 * the skeleton; the other 14 seed sims show an honest static preview until the
 * real Codex engine emits their bundles.
 */
export function SimFrame({ sim, compact = false }: { sim: GallerySim; compact?: boolean }) {
  return (
    // STUB: replace inner render with the cross-origin sandboxed <iframe>.
    <div data-sim-slug={sim.slug} data-sandbox="allow-scripts; connect-src none" className="w-full">
      {sim.interactive ? <FractionDivision compact={compact} /> : <StaticPreview sim={sim} />}
    </div>
  );
}

function StaticPreview({ sim }: { sim: GallerySim }) {
  return (
    <div
      className="flex min-h-40 flex-col justify-center gap-3 rounded-2xl p-6 text-center"
      style={{
        background: "var(--bg-elevated)",
        border: "1px dashed var(--border-default)",
      }}
    >
      <span
        className="feature-icon mx-auto h-14 w-14"
        style={{ color: "var(--primary)" }}
        aria-hidden
      >
        <SubjectIcon subject={sim.subject} size={26} strokeWidth={1.75} />
      </span>
      <p className="text-sm font-medium" style={{ color: "var(--text-hi)" }}>
        {sim.interaction}
      </p>
      <p className="text-xs" style={{ color: "var(--text-low)" }}>
        Live renderer lands with the real Codex engine
      </p>
    </div>
  );
}
