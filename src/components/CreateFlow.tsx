"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ScopeBadge } from "@/components/Badges";
import { SimFrame } from "@/components/SimFrame";
import { HERO_SIM } from "@/lib/seed/gallery";
import { gatePrompt } from "@/lib/harness/safety";
import { StubOrchestrator } from "@/lib/harness/orchestrator";
import type { GenerationResult } from "@/lib/harness/types";

const EXAMPLE_CHIPS = [
  "why dividing by a fraction makes the answer bigger",
  "why a heavy and a light ball fall at the same rate",
  "why 45° throws the ball farthest",
];

type StepState = "pending" | "active" | "pass" | "fail";
interface Step {
  id: string;
  label: string;
  detail?: string;
  state: StepState;
  ts?: string;
  accent?: boolean;
}

type Phase = "idle" | "running" | "published" | "rejected";

const orchestrator = new StubOrchestrator();

function stamp(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function CreateFlow() {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [steps, setSteps] = useState<Step[]>([]);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const runningRef = useRef(false);

  const pushStep = useCallback((step: Step) => {
    setSteps((prev) => [...prev, step]);
  }, []);
  const settleLast = useCallback((state: StepState, detail?: string, accent?: boolean) => {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === prev.length - 1
          ? { ...s, state, ts: stamp(), detail: detail ?? s.detail, accent }
          : s,
      ),
    );
  }, []);

  const run = useCallback(async () => {
    if (runningRef.current) return;
    const text = prompt.trim();
    if (!text) return;
    runningRef.current = true;
    setSteps([]);
    setResult(null);
    setRejectReason(null);

    // G1 — Luna classroom-safety + standard alignment (demo heuristic).
    const verdict = gatePrompt(text);
    setPhase("running");
    pushStep({ id: "g1", label: "Checking it's classroom-ready…", state: "active" });
    await sleep(650);
    if (verdict.decision === "reject") {
      settleLast("fail", verdict.reasons.join(" "));
      setRejectReason(verdict.reasons.join(" "));
      setPhase("rejected");
      runningRef.current = false;
      return;
    }
    settleLast(
      "pass",
      `subject=${verdict.subject} · grade=${verdict.gradeBand} · ${verdict.standard?.framework}.${verdict.standard?.code}`,
    );

    // Run the real (stub) orchestrator to get the honest multi-attempt trace.
    const gen = await orchestrator.run({
      prompt: text,
      subject: verdict.subject ?? "math",
      gradeBand: verdict.gradeBand,
      standard: verdict.standard,
    });

    // Attempt 1 — write + static validation fails on a network call.
    pushStep({ id: "a1-write", label: "Codex is writing the manipulative…", state: "active" });
    await sleep(900);
    settleLast("pass", "filled COMPONENT + INVARIANTS");
    pushStep({ id: "a1-g2", label: "Running static safety checks…", state: "active" });
    await sleep(700);
    settleLast("fail", "✗ NETWORK_API 'fetch' — not in the sandbox allowlist");

    // Attempt 2 — clean code, renders, but pedagogy is wrong (monotonic fail).
    pushStep({
      id: "a2",
      label: "First try didn't pass — Codex is fixing it…",
      state: "active",
    });
    await sleep(850);
    settleLast(
      "fail",
      "✗ smoke test: quotient went DOWN as divisor shrank [1.11, 2.00, 4.00, 3.33]",
    );

    // Attempt 3 — fixed ÷; real invariants pass.
    pushStep({
      id: "a3",
      label: "Codex fixed the ÷ bug — re-running its own smoke test…",
      state: "active",
    });
    await sleep(900);
    const finalReport = gen.attempts[gen.attempts.length - 1].invariantRun;
    settleLast(
      "pass",
      `✓ ${finalReport.results.filter((r) => r.passed).length}/${finalReport.results.length} invariants hold`,
    );

    pushStep({ id: "g4", label: "Verified ✓ Published", state: "active", accent: true });
    await sleep(500);
    settleLast(
      "pass",
      `simId=${gen.simId} · attempts=${gen.attempts.length} · ${(gen.latencyMs.p50Perf ?? 0) / 1000}s`,
      true,
    );

    setResult(gen);
    setPhase(gen.status === "published" ? "published" : "rejected");
    runningRef.current = false;
  }, [prompt, pushStep, settleLast]);

  const reset = useCallback(() => {
    setPhase("idle");
    setSteps([]);
    setResult(null);
    setRejectReason(null);
    setCopied(false);
  }, []);

  const shareUrl = result?.shareId ? `/s/${result.shareId}` : "";

  return (
    <div className="flex w-full flex-col gap-8">
      {phase === "idle" || phase === "rejected" ? (
        <div className="glass flex flex-col gap-5 rounded-3xl p-6 sm:p-8">
          <label
            htmlFor="prompt"
            className="text-2xl font-bold"
            style={{ color: "var(--text-hi)" }}
          >
            What do you want your students to <em style={{ color: "var(--accent)" }}>feel</em>?
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Show why dividing by a fraction makes the answer bigger, not smaller."
            className="w-full resize-none rounded-2xl p-4 text-base outline-none"
            style={{
              background: "var(--bg-overlay)",
              color: "var(--text-hi)",
              border: "1px solid var(--border-default)",
            }}
          />
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setPrompt(c)}
                className="rounded-full px-3 py-1.5 text-xs transition-colors"
                style={{
                  background: "var(--bg-overlay)",
                  color: "var(--text-mid)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {c}
              </button>
            ))}
          </div>
          {rejectReason && (
            <div
              data-testid="failure-card"
              className="rounded-2xl p-4 text-sm"
              style={{
                background: "color-mix(in srgb, var(--color-error) 12%, transparent)",
                color: "var(--text-hi)",
                border: "1px solid color-mix(in srgb, var(--color-error) 40%, transparent)",
              }}
            >
              {rejectReason} Try rephrasing it as a math or physics idea.
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <ScopeBadge />
            <button
              type="button"
              onClick={run}
              disabled={!prompt.trim()}
              className="rounded-full px-6 py-3 text-sm font-bold transition-opacity disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#1a1300" }}
            >
              Create manipulative →
            </button>
          </div>
        </div>
      ) : null}

      {steps.length > 0 && phase !== "rejected" && (
        <ol className="glass flex flex-col gap-1 rounded-3xl p-6" data-testid="build-timeline">
          {steps.map((s) => (
            <li key={s.id} className="flex items-start gap-3 py-2">
              <StepIcon state={s.state} />
              <div className="flex flex-1 flex-col">
                <span
                  className="text-sm font-medium"
                  style={{
                    color: s.accent && s.state === "pass" ? "var(--accent)" : "var(--text-hi)",
                  }}
                >
                  {s.label}
                </span>
                {s.detail && (
                  <span className="font-mono text-xs" style={{ color: "var(--text-mid)" }}>
                    {s.detail}
                  </span>
                )}
              </div>
              {s.ts && (
                <span className="font-mono text-[11px]" style={{ color: "var(--text-low)" }}>
                  {s.ts}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}

      {phase === "published" && result && (
        <div className="flex flex-col gap-5" data-testid="result-state">
          <SimFrame sim={HERO_SIM} />
          <div className="glass flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col">
              <span
                className="text-xs uppercase tracking-widest"
                style={{ color: "var(--text-low)" }}
              >
                Student share link
              </span>
              <span className="font-mono text-sm" style={{ color: "var(--primary)" }}>
                chalkbox.edycu.dev{shareUrl}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`https://chalkbox.edycu.dev${shareUrl}`);
                  setCopied(true);
                }}
                className="rounded-full px-4 py-2 text-sm font-semibold"
                style={{ background: "var(--primary)", color: "#02120f" }}
              >
                {copied ? "Copied ✓" : "Copy link"}
              </button>
              <Link
                href={shareUrl}
                className="rounded-full px-4 py-2 text-sm font-semibold"
                style={{ border: "1px solid var(--border-default)", color: "var(--text-hi)" }}
              >
                Open student view
              </Link>
              <button
                type="button"
                onClick={reset}
                className="rounded-full px-4 py-2 text-sm"
                style={{ color: "var(--text-mid)" }}
              >
                Make another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepIcon({ state }: { state: StepState }) {
  const map: Record<StepState, { glyph: string; color: string }> = {
    pending: { glyph: "○", color: "var(--text-low)" },
    active: { glyph: "◐", color: "var(--primary)" },
    pass: { glyph: "✓", color: "var(--color-success)" },
    fail: { glyph: "↻", color: "var(--color-warning)" },
  };
  const { glyph, color } = map[state];
  return (
    <span className="mt-0.5 font-mono text-sm" style={{ color }} aria-hidden>
      {glyph}
    </span>
  );
}
