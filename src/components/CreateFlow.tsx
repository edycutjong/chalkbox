"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Circle, CircleCheck, LoaderCircle, RotateCcw } from "lucide-react";
import { ScopeBadge } from "@/components/Badges";
import { SimFrame } from "@/components/SimFrame";
import { HERO_SIM, resolveInteractiveSim, type GallerySim } from "@/lib/seed/gallery";
import { formatViolations } from "@/lib/harness/validator";
import { formatInvariantFailures } from "@/lib/harness/invariant-runner";
import type { GenerationResult, SafetyVerdict } from "@/lib/harness/types";

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

type Phase = "idle" | "running" | "published" | "rejected" | "unsupported";

function stamp(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface GenerationStream {
  verdict: SafetyVerdict | null;
  demo: boolean;
  result: GenerationResult | null;
}

async function requestGeneration(prompt: string): Promise<GenerationStream> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok || !response.body) throw new Error("Generation service is unavailable.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const stream: GenerationStream = { verdict: null, demo: true, result: null };
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const message = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const event = message.match(/^event: (.+)$/m)?.[1];
      const data = message.match(/^data: (.+)$/m)?.[1];
      if (event && data) {
        const payload: unknown = JSON.parse(data);
        if (event === "verdict" && payload && typeof payload === "object") {
          const value = payload as { verdict?: SafetyVerdict; demo?: boolean };
          stream.verdict = value.verdict ?? null;
          stream.demo = value.demo === true;
        }
        if (event === "result") stream.result = payload as GenerationResult;
        if (event === "error") {
          const value = payload as { message?: string };
          throw new Error(value.message ?? "Generation failed.");
        }
      }
      boundary = buffer.indexOf("\n\n");
    }
    if (done) break;
  }
  return stream;
}

export function CreateFlow() {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [steps, setSteps] = useState<Step[]>([]);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [verdict, setVerdict] = useState<SafetyVerdict | null>(null);
  const [builtSim, setBuiltSim] = useState<GallerySim | null>(null);
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
    setVerdict(null);
    setBuiltSim(null);

    setPhase("running");
    pushStep({ id: "g1", label: "Checking it's classroom-ready…", state: "active" });
    let stream: GenerationStream;
    try {
      stream = await requestGeneration(text);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Generation failed.";
      settleLast("fail", detail);
      setRejectReason(detail);
      setPhase("rejected");
      runningRef.current = false;
      return;
    }
    const v = stream.verdict;
    if (!v) {
      settleLast("fail", "Generation did not return a classroom-safety verdict.");
      setPhase("rejected");
      runningRef.current = false;
      return;
    }
    if (v.decision === "reject") {
      settleLast("fail", v.reasons.join(" "));
      setRejectReason(v.reasons.join(" "));
      setPhase("rejected");
      runningRef.current = false;
      return;
    }
    settleLast(
      "pass",
      `subject=${v.subject} · grade=${v.gradeBand} · ${v.standard?.framework}.${v.standard?.code}`,
    );
    setVerdict(v);

    // In demo mode we keep the existing prompt-honesty rule. In live mode the
    // server has generated a new artifact, so it must not be replaced by the
    // flagship merely because it isn't in the seed gallery.
    const sim = stream.demo ? resolveInteractiveSim(text, v.subject) : null;
    if (stream.demo && !sim) {
      setPhase("unsupported");
      runningRef.current = false;
      return;
    }
    setBuiltSim(sim);

    const gen = stream.result;
    if (!gen) {
      settleLast("fail", "Generation ended without a result.");
      setPhase("rejected");
      runningRef.current = false;
      return;
    }

    // Render EACH attempt straight from the orchestrator's REAL data — the
    // static-validator violations and the invariant-runner results — so the
    // failures shown are genuinely computed and re-run-stable, not literals.
    for (const a of gen.attempts) {
      pushStep({
        id: `a${a.n}-write`,
        label: `Codex round ${a.n} — filling COMPONENT + INVARIANTS…`,
        state: "active",
      });
      await sleep(750);
      settleLast("pass", a.codePreview);

      // G2 — static validation (real StaticValidator output).
      pushStep({ id: `a${a.n}-g2`, label: "Running static safety checks (G2)…", state: "active" });
      await sleep(650);
      if (!a.validation.ok) {
        settleLast("fail", formatViolations(a.validation));
        continue; // Codex retries — the reason IS this real violation.
      }
      settleLast(
        "pass",
        `G2 clean — ${a.validation.meta.importCount} imports, ${a.validation.meta.nodeCount} nodes`,
      );

      // Headless render.
      if (!a.render.ok) {
        pushStep({ id: `a${a.n}-render`, label: "Headless render…", state: "active" });
        await sleep(400);
        settleLast("fail", a.render.error ?? "render failed");
        continue;
      }

      // G3 — pedagogical invariants (real InvariantRunner output).
      pushStep({
        id: `a${a.n}-g3`,
        label: "Re-running its own smoke test (G3 invariants)…",
        state: "active",
      });
      await sleep(750);
      if (!a.invariantRun.passed) {
        settleLast("fail", formatInvariantFailures(a.invariantRun));
        continue;
      }
      const passCount = a.invariantRun.results.filter((r) => r.passed).length;
      settleLast("pass", `${passCount}/${a.invariantRun.results.length} invariants hold`);
    }

    // G4 / publish — status comes from the real GenerationResult, not a literal.
    if (gen.status === "published") {
      pushStep({ id: "g4", label: "Verified · Published", state: "active", accent: true });
      await sleep(450);
      settleLast(
        "pass",
        `simId=${gen.simId} · attempts=${gen.attempts.length} · G4 output scan clean`,
        true,
      );
    }

    setResult(gen);
    setPhase(gen.status === "published" ? "published" : "rejected");
    runningRef.current = false;
  }, [prompt, pushStep, settleLast]);

  const reset = useCallback(() => {
    setPhase("idle");
    setSteps([]);
    setResult(null);
    setRejectReason(null);
    setVerdict(null);
    setBuiltSim(null);
    setCopied(false);
  }, []);

  const shareUrl = result?.shareId ? `/s/${result.shareId}` : "";
  // Real deploy origin for the share link (falls back to the canonical domain
  // during the first client render; share UI only appears after interaction).
  const [origin, setOrigin] = useState("https://chalkbox.edycu.dev");
  useEffect(() => setOrigin(window.location.origin), []);

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
            className="field w-full resize-none rounded-2xl p-4 text-base outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setPrompt(c)}
                className="chip rounded-full px-3 py-1.5 text-xs"
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
                background: "rgba(239, 68, 68, 0.12)",
                color: "var(--text-hi)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
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
              className="cta-accent inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#1a1300" }}
            >
              Create manipulative
              <ArrowRight className="icon-nudge" size={16} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      {steps.length > 0 && phase !== "rejected" && phase !== "unsupported" && (
        <ol className="glass flex flex-col gap-1 rounded-3xl p-6" data-testid="build-timeline">
          {steps.map((s) => (
            <li key={s.id} className="animate-up flex items-start gap-3 py-2">
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
                  <span
                    className="whitespace-pre-wrap break-words font-mono text-xs"
                    style={{ color: "var(--text-mid)" }}
                  >
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

      {phase === "unsupported" && verdict && (
        <div
          className="glass flex flex-col gap-4 rounded-3xl p-6 sm:p-8"
          data-testid="unsupported-card"
        >
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--primary)" }}
          >
            In scope — live generation coming
          </span>
          <p className="text-sm" style={{ color: "var(--text-hi)" }}>
            Luna classified this as a real, classroom-ready idea, but this demo only ships one
            fully-built manipulative — so we won&apos;t show you the wrong sim.
          </p>
          <div
            className="rounded-xl p-3 font-mono text-xs"
            style={{ background: "var(--bg-overlay)", color: "var(--text-mid)" }}
          >
            detected: subject={verdict.subject} · grade={verdict.gradeBand} ·{" "}
            {verdict.standard?.framework}.{verdict.standard?.code}
          </div>
          <p className="text-sm" style={{ color: "var(--text-mid)" }}>
            Live generation for this prompt is coming — here&apos;s the flagship example that&apos;s
            fully built and passed its own tests:
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/s/frac-div-demo"
              className="pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: "var(--primary)", color: "#02120f" }}
            >
              Open the flagship (fraction division)
              <ArrowRight className="icon-nudge" size={15} aria-hidden />
            </Link>
            <button
              type="button"
              onClick={() => {
                reset();
                setPrompt(EXAMPLE_CHIPS[0]);
              }}
              className="pill rounded-full px-4 py-2 text-sm font-semibold"
              style={{ border: "1px solid var(--border-default)", color: "var(--text-hi)" }}
            >
              Try the built example
            </button>
            <button
              type="button"
              onClick={reset}
              className="link-quiet rounded-full px-4 py-2 text-sm"
            >
              Rephrase
            </button>
          </div>
        </div>
      )}

      {phase === "published" && result && (
        <div className="flex flex-col gap-5" data-testid="result-state">
          {builtSim ? (
            <SimFrame sim={builtSim ?? HERO_SIM} />
          ) : (
            <GeneratedArtifact result={result} />
          )}
          <p
            className="text-center text-xs"
            style={{ color: "var(--text-low)" }}
            data-testid="demo-label"
          >
            {builtSim
              ? "Demo mode — replaying a pre-built, self-tested example."
              : "Live mode — server-verified generated artifact; source is SRI-pinned before publishing."}
          </p>
          <div className="glass flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col">
              <span
                className="text-xs uppercase tracking-widest"
                style={{ color: "var(--text-low)" }}
              >
                Student share link
              </span>
              <span className="font-mono text-sm" style={{ color: "var(--primary)" }}>
                {origin.replace(/^https?:\/\//, "")}
                {shareUrl}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`${origin}${shareUrl}`);
                  setCopied(true);
                }}
                className="pill inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold"
                style={{ background: "var(--primary)", color: "#02120f" }}
              >
                {copied ? (
                  <>
                    <Check size={15} strokeWidth={3} aria-hidden />
                    Copied
                  </>
                ) : (
                  "Copy link"
                )}
              </button>
              <Link
                href={shareUrl}
                className="pill rounded-full px-4 py-2 text-sm font-semibold"
                style={{ border: "1px solid var(--border-default)", color: "var(--text-hi)" }}
              >
                Open student view
              </Link>
              <button
                type="button"
                onClick={reset}
                className="link-quiet rounded-full px-4 py-2 text-sm"
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

function GeneratedArtifact({ result }: { result: GenerationResult }) {
  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-6" data-testid="generated-artifact">
      <span
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--primary)" }}
      >
        Generated manipulative verified server-side
      </span>
      <p className="text-sm" style={{ color: "var(--text-mid)" }}>
        The component was headlessly rendered and its matching probe passed the displayed
        invariants.
      </p>
      <pre
        className="max-h-56 overflow-auto rounded-xl p-3 text-xs"
        style={{ background: "var(--bg-overlay)" }}
      >
        {result.artifact?.componentSrc}
      </pre>
    </div>
  );
}

function StepIcon({ state }: { state: StepState }) {
  const color =
    state === "pass"
      ? "var(--color-success)"
      : state === "fail"
        ? "var(--color-warning)"
        : state === "active"
          ? "var(--primary)"
          : "var(--text-low)";
  return (
    <span className="mt-0.5 flex-shrink-0" style={{ color }} aria-hidden>
      {state === "pass" ? (
        <CircleCheck size={16} strokeWidth={2.25} />
      ) : state === "fail" ? (
        <RotateCcw size={16} strokeWidth={2.25} />
      ) : state === "active" ? (
        <LoaderCircle className="spin" size={16} strokeWidth={2.25} />
      ) : (
        <Circle size={16} strokeWidth={2.25} />
      )}
    </span>
  );
}
