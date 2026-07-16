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
