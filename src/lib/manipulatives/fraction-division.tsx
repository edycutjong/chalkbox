"use client";

/**
 * Fraction-Division Bars — the flagship interactive manipulative.
 *
 * Drag the divisor slider smaller → the piece size shrinks → more pieces fit in
 * the whole → the quotient readout GROWS. That is the "dividing by a fraction
 * makes the answer bigger" aha, made tactile (docs/SEED_DATA.md §1).
 *
 * This is a REAL working component, not a stub. Its math is the shared core in
 * ./fraction-division-core.ts, the very same code the invariant runner proves.
 */

import { useMemo, useState } from "react";
import {
  DIVIDEND,
  DIVISOR_INITIAL,
  DIVISOR_MAX,
  DIVISOR_MIN,
  clamp,
  computeQuotient,
} from "./fraction-division-core";

export interface FractionDivisionProps {
  /** How many wholes are being divided (default 1). */
  dividend?: number;
  /** Rendered inside the student view; hides the framing chrome when true. */
  compact?: boolean;
}

const SLIDER_MIN = 0.05; // slider floor (probe allows lower; UI stays legible)

export default function FractionDivision({
  dividend = DIVIDEND,
  compact = false,
}: FractionDivisionProps) {
  const [divisor, setDivisor] = useState(DIVISOR_INITIAL);

  const quotient = useMemo(
    () => computeQuotient(dividend, divisor),
    [dividend, divisor],
  );

  // Draw whole pieces + a partial remainder, capped for legibility.
  const pieces = useMemo(() => {
    const full = Math.floor(quotient);
    const partial = quotient - full;
    const capped = Math.min(full, 48);
    const arr: number[] = [];
    for (let i = 0; i < capped; i++) arr.push(1);
    if (partial > 1e-6 && capped === full) arr.push(partial);
    return arr;
  }, [quotient]);

  const hue = 168; // teal, matches --primary #14B8A6

  return (
    <div
      data-testid="fraction-division-sim"
      className="flex w-full flex-col gap-6 rounded-2xl p-6"
      style={{
        background: compact ? "transparent" : "var(--bg-elevated)",
        border: compact ? "none" : "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex flex-col gap-1">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--primary)" }}
        >
          Fraction-Division Bars
        </span>
        <output
          data-testid="quotient-readout"
          className="font-mono text-3xl font-bold"
          style={{ color: "var(--text-hi)" }}
        >
          {dividend} ÷ {divisor.toFixed(2)} ={" "}
          <span style={{ color: "var(--accent)" }}>{quotient.toFixed(2)}</span>
        </output>
      </div>

      {/* The whole bar, tiled into pieces of size `divisor`. */}
      <div
        data-testid="fraction-bars"
        className="flex min-h-16 flex-wrap content-start gap-1 rounded-xl p-3"
        style={{ background: "var(--bg-overlay)" }}
        aria-label={`${quotient.toFixed(2)} pieces of size ${divisor.toFixed(2)}`}
      >
        {pieces.map((p, i) => (
          <div
            key={i}
            className="h-10 rounded-md transition-all"
            style={{
              width: `${Math.max(6, p * 44)}px`,
              background: `hsl(${hue} 76% ${48 - (i % 3) * 6}%)`,
              opacity: p < 1 ? 0.5 : 1,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-mid)" }}>
          <span>smaller piece →</span>
          <span>divisor = {divisor.toFixed(2)}</span>
          <span>← bigger piece</span>
        </div>
        <input
          data-testid="divisor-slider"
          type="range"
          min={SLIDER_MIN}
          max={DIVISOR_MAX}
          step={0.01}
          value={divisor}
          onChange={(e) =>
            setDivisor(clamp(Number(e.target.value), DIVISOR_MIN, DIVISOR_MAX))
          }
          aria-label="Divisor (piece size)"
          className="w-full accent-[var(--primary)]"
        />
      </div>

      {!compact && (
        <p
          data-testid="embedded-question"
          className="rounded-xl p-4 text-sm"
          style={{ background: "var(--color-hover)", color: "var(--text-hi)" }}
        >
          You made the piece smaller but the answer got <em>bigger</em>. Predict{" "}
          <strong>1 ÷ 0.25</strong> before you drag there.
        </p>
      )}
    </div>
  );
}
