/**
 * Luna classroom-safety gate (G1 in / G4 out) — docs/COMPLEXITY.md §2.6.
 *
 * The real gate is a cheap GPT-5.6 Luna call that classifies the prompt
 * (safety, subject-in-scope, grade band, CCSS/NGSS alignment) before any Sol
 * credit is spent, and re-scans rendered labels after generation.
 *
 * DEMO MODE: a keyword heuristic stands in — enough to demonstrate the accept /
 * reject UX and the standard-alignment tag without an API key. Marked `// STUB:`.
 */

import type { SafetyVerdict, StandardRef } from "./types";
import { createResponse } from "./openai-responses";

const MATH_HINTS = [
  "fraction",
  "divide",
  "division",
  "number",
  "ratio",
  "slope",
  "area",
  "perimeter",
  "probability",
  "negative",
  "integer",
  "multiply",
  "mean",
  "function",
];
const PHYSICS_HINTS = [
  "fall",
  "gravity",
  "force",
  "energy",
  "wave",
  "velocity",
  "acceleration",
  "mass",
  "projectile",
  "angle",
  "pendulum",
  "speed",
  "kinetic",
];
const UNSAFE_HINTS = ["weapon", "kill", "drug", "porn", "suicide", "hate"];

function inferStandard(subject: "math" | "physics", prompt: string): StandardRef | null {
  const p = prompt.toLowerCase();
  if (subject === "math") {
    if (p.includes("fraction") && (p.includes("divid") || p.includes("bigger")))
      return { framework: "CCSS", code: "6.NS.A.1" };
    if (p.includes("slope")) return { framework: "CCSS", code: "8.EE.B.5" };
    if (p.includes("negative")) return { framework: "CCSS", code: "7.NS.A.1" };
    return { framework: "CCSS", code: "6.NS.A.1" };
  }
  if (p.includes("fall") || p.includes("gravity")) return { framework: "NGSS", code: "HS-PS2-1" };
  if (p.includes("energy") || p.includes("kinetic")) return { framework: "NGSS", code: "MS-PS3-1" };
  return { framework: "NGSS", code: "MS-PS2-2" };
}

// STUB: swap for a Luna call when OPENAI_API_KEY is present.
export function gatePrompt(prompt: string): SafetyVerdict {
  const p = prompt.trim().toLowerCase();
  if (p.length === 0) {
    return {
      decision: "reject",
      reasons: ["Empty prompt."],
      gradeBand: null,
      subject: null,
      standard: null,
      toxicity: 0,
      offCurriculum: true,
    };
  }
  if (UNSAFE_HINTS.some((h) => p.includes(h))) {
    return {
      decision: "reject",
      reasons: ["This prompt isn't classroom-appropriate."],
      gradeBand: null,
      subject: null,
      standard: null,
      toxicity: 0.9,
      offCurriculum: false,
    };
  }
  const isMath = MATH_HINTS.some((h) => p.includes(h));
  const isPhysics = PHYSICS_HINTS.some((h) => p.includes(h));
  if (!isMath && !isPhysics) {
    return {
      decision: "reject",
      reasons: ["Chalkbox builds math & physics manipulatives only — try a math or physics idea."],
      gradeBand: null,
      subject: null,
      standard: null,
      toxicity: 0,
      offCurriculum: true,
    };
  }
  const subject: "math" | "physics" = isPhysics && !isMath ? "physics" : "math";
  return {
    decision: "accept",
    reasons: [],
    gradeBand: subject === "physics" ? "9-12" : "6-8",
    subject,
    standard: inferStandard(subject, prompt),
    toxicity: 0.01,
    offCurriculum: false,
  };
}

// STUB: G4 output re-scan. Demo always accepts the seeded sim's labels.
export function gateOutput(renderedText: string[]): SafetyVerdict {
  void renderedText;
  return {
    decision: "accept",
    reasons: [],
    gradeBand: null,
    subject: null,
    standard: null,
    toxicity: 0.0,
    offCurriculum: false,
  };
}

/**
 * Live G1/G4 safety pass. These are intentionally server-only call sites:
 * CreateFlow never imports them, so an API key can never reach the browser.
 * The synchronous functions above remain the deterministic demo implementation.
 */
export async function gatePromptWithLuna(
  prompt: string,
  apiKey: string,
  timeoutMs: number,
): Promise<SafetyVerdict> {
  const fallback = gatePrompt(prompt);
  const result = await createResponse(
    apiKey,
    {
      model: "gpt-5.6-luna",
      reasoning: { effort: "low" },
      input: [
        {
          role: "developer",
          content:
            "You are Chalkbox's classroom safety classifier. Return only the requested JSON. " +
            "Accept only age-appropriate math or physics manipulative requests.",
        },
        { role: "user", content: prompt },
      ],
      text: { format: safetyFormat() },
    },
    timeoutMs,
  );
  return parseVerdict(result.text, fallback);
}

export async function gateOutputWithLuna(
  renderedText: string[],
  apiKey: string,
  timeoutMs: number,
): Promise<SafetyVerdict> {
  const fallback = gateOutput(renderedText);
  const result = await createResponse(
    apiKey,
    {
      model: "gpt-5.6-luna",
      reasoning: { effort: "low" },
      input: [
        {
          role: "developer",
          content:
            "You are Chalkbox's final classroom-output safety scanner. Return only the requested JSON. " +
            "Reject unsafe, off-curriculum, or non-math/non-physics labels.",
        },
        { role: "user", content: renderedText.join(" ") },
      ],
      text: { format: safetyFormat() },
    },
    timeoutMs,
  );
  return parseVerdict(result.text, fallback);
}

function safetyFormat(): Record<string, unknown> {
  return {
    type: "json_schema",
    name: "chalkbox_safety_verdict",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "decision",
        "reasons",
        "gradeBand",
        "subject",
        "standard",
        "toxicity",
        "offCurriculum",
      ],
      properties: {
        decision: { type: "string", enum: ["accept", "reject"] },
        reasons: { type: "array", items: { type: "string" } },
        gradeBand: { type: ["string", "null"], enum: ["K-2", "3-5", "6-8", "9-12", null] },
        subject: { type: ["string", "null"], enum: ["math", "physics", null] },
        standard: {
          type: ["object", "null"],
          additionalProperties: false,
          required: ["framework", "code"],
          properties: {
            framework: { type: "string", enum: ["CCSS", "NGSS"] },
            code: { type: "string" },
          },
        },
        toxicity: { type: "number" },
        offCurriculum: { type: "boolean" },
      },
    },
  };
}

function parseVerdict(text: string, fallback: SafetyVerdict): SafetyVerdict {
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== "object") return fallback;
  const value = parsed as Partial<SafetyVerdict>;
  if (value.decision !== "accept" && value.decision !== "reject") return fallback;
  if (!Array.isArray(value.reasons) || typeof value.toxicity !== "number") return fallback;
  if (typeof value.offCurriculum !== "boolean") return fallback;
  return {
    decision: value.decision,
    reasons: value.reasons.filter((reason): reason is string => typeof reason === "string"),
    gradeBand:
      value.gradeBand === "K-2" ||
      value.gradeBand === "3-5" ||
      value.gradeBand === "6-8" ||
      value.gradeBand === "9-12"
        ? value.gradeBand
        : null,
    subject: value.subject === "math" || value.subject === "physics" ? value.subject : null,
    standard:
      value.standard &&
      typeof value.standard === "object" &&
      "framework" in value.standard &&
      "code" in value.standard &&
      (value.standard.framework === "CCSS" || value.standard.framework === "NGSS") &&
      typeof value.standard.code === "string"
        ? { framework: value.standard.framework, code: value.standard.code }
        : null,
    toxicity: Math.max(0, Math.min(1, value.toxicity)),
    offCurriculum: value.offCurriculum,
  };
}
