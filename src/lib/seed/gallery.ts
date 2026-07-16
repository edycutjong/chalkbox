/**
 * Seed gallery — the 15 curriculum-tagged manipulatives from docs/SEED_DATA.md §2.
 *
 * This is a LOCAL seed module, not a live DB read. In production `seed.ts --apply`
 * upserts these (plus the committed component fixtures) into Supabase by slug;
 * here they are the source of truth for the gallery surface.
 *
 * Every card carries a REAL Common Core / NGSS code and the exact teacher prompt
 * that generated it — never lorem-ipsum (Actian lesson #15: the data is the product).
 */

import type { GradeBand, StandardFramework, Subject } from "@/lib/harness/types";

export interface GallerySim {
  slug: string;
  title: string;
  subject: Subject;
  gradeBand: GradeBand;
  gradeLabel: string; // display, e.g. "6" or "9-12"
  standard: { framework: StandardFramework; code: string; text: string };
  prompt: string; // the verbatim teacher sentence shown on the card
  interaction: string; // one-line description of the core interaction
  persona: string; // seed author (clearly labeled sample)
  hero?: boolean;
  shareId: string; // student link token
  /** true only for the flagship, which has a live interactive renderer here. */
  interactive?: boolean;
}

export const GALLERY_SIMS: GallerySim[] = [
  {
    slug: "fraction-division-bars",
    title: "Fraction-Division Bars",
    subject: "math",
    gradeBand: "6-8",
    gradeLabel: "6",
    standard: { framework: "CCSS", code: "6.NS.A.1", text: "Compute quotients of fractions" },
    prompt: "Show why dividing by a fraction makes the answer bigger, not smaller.",
    interaction: "Drag the divisor smaller → the quotient (pieces that fit) grows",
    persona: "Ms. Alvarez",
    hero: true,
    interactive: true,
    shareId: "frac-div-demo",
  },
  {
    slug: "integer-number-line",
    title: "Integer Number Line",
    subject: "math",
    gradeBand: "6-8",
    gradeLabel: "7",
    standard: { framework: "CCSS", code: "7.NS.A.1", text: "Add/subtract rational numbers on a number line" },
    prompt: "Let them feel that subtracting a negative moves you to the right.",
    interaction: "Drag a hop vector along a number line; sign flips direction",
    persona: "Ms. Alvarez",
    shareId: "int-line-demo",
  },
  {
    slug: "ratio-double-line",
    title: "Double Number Line",
    subject: "math",
    gradeBand: "6-8",
    gradeLabel: "6",
    standard: { framework: "CCSS", code: "6.RP.A.3", text: "Reason about ratios with tables & double number lines" },
    prompt: "Show that 3 apples for $2 is the same rate as 9 for $6.",
    interaction: "Stretch a linked pair of number lines; ratio stays fixed",
    persona: "Ms. Alvarez",
    shareId: "ratio-demo",
  },
  {
    slug: "slope-explorer",
    title: "Slope Explorer",
    subject: "math",
    gradeBand: "6-8",
    gradeLabel: "8",
    standard: { framework: "CCSS", code: "8.EE.B.5", text: "Graph proportional relationships; interpret slope" },
    prompt: "Let them see that a steeper line means a bigger rate of change.",
    interaction: "Drag a line's second point; rise/run and slope update live",
    persona: "Mr. Osei",
    shareId: "slope-demo",
  },
  {
    slug: "fraction-wall",
    title: "Equivalent-Fraction Wall",
    subject: "math",
    gradeBand: "3-5",
    gradeLabel: "4",
    standard: { framework: "CCSS", code: "4.NF.A.1", text: "Recognize/generate equivalent fractions" },
    prompt: "Show that 1/2 and 2/4 cover the exact same amount.",
    interaction: "Stack fraction-strip rows; equal widths snap-align",
    persona: "Ms. Tran",
    shareId: "frac-wall-demo",
  },
  {
    slug: "pythagorean-squares",
    title: "Pythagorean Squares",
    subject: "math",
    gradeBand: "6-8",
    gradeLabel: "8",
    standard: { framework: "CCSS", code: "8.G.B.7", text: "Apply the Pythagorean theorem to find side lengths" },
    prompt: "Let them see a² + b² literally fill up c².",
    interaction: "Drag legs of a right triangle; the three squares' areas tally",
    persona: "Mr. Osei",
    shareId: "pyth-demo",
  },
  {
    slug: "mean-balance-beam",
    title: "Mean as a Balance Beam",
    subject: "math",
    gradeBand: "6-8",
    gradeLabel: "6",
    standard: { framework: "CCSS", code: "6.SP.A.3", text: "A measure of center summarizes data with one number" },
    prompt: "Show that the mean is the balance point of the data.",
    interaction: "Drag data dots on a beam; it tips until balanced at the mean",
    persona: "Ms. Alvarez",
    shareId: "mean-demo",
  },
  {
    slug: "function-machine",
    title: "Function Machine",
    subject: "math",
    gradeBand: "6-8",
    gradeLabel: "8",
    standard: { framework: "CCSS", code: "8.F.A.1", text: "Understand a function as one output per input" },
    prompt: "Let them feel that a function gives exactly one output per input.",
    interaction: "Drop inputs into a machine; rule transforms each to one output",
    persona: "Mr. Osei",
    shareId: "func-demo",
  },
  {
    slug: "probability-spinner",
    title: "Probability Spinner",
    subject: "math",
    gradeBand: "6-8",
    gradeLabel: "7",
    standard: { framework: "CCSS", code: "7.SP.C.6", text: "Approximate probability from long-run frequency" },
    prompt: "Show that more spins get closer to the true probability.",
    interaction: "Spin repeatedly; observed frequency converges to theoretical",
    persona: "Ms. Tran",
    shareId: "spinner-demo",
  },
  {
    slug: "area-model-distributive",
    title: "Area-Model Multiplier",
    subject: "math",
    gradeBand: "3-5",
    gradeLabel: "3",
    standard: { framework: "CCSS", code: "3.MD.C.7c", text: "Area models and the distributive property" },
    prompt: "Show that 4 × 13 is 4 × 10 plus 4 × 3.",
    interaction: "Split a rectangle's width; the two sub-areas sum to the whole",
    persona: "Ms. Tran",
    shareId: "area-demo",
  },
  {
    slug: "free-fall-race",
    title: "Free-Fall Race",
    subject: "physics",
    gradeBand: "9-12",
    gradeLabel: "9-12",
    standard: { framework: "NGSS", code: "HS-PS2-1", text: "Newton's 2nd law: net force, mass, acceleration" },
    prompt: "Prove a heavy ball and a light ball hit the ground at the same time.",
    interaction: "Set two masses; drop; both land together (no air resistance)",
    persona: "Dr. Bell",
    shareId: "freefall-demo",
  },
  {
    slug: "projectile-launcher",
    title: "Projectile Launcher",
    subject: "physics",
    gradeBand: "9-12",
    gradeLabel: "9-12",
    standard: { framework: "NGSS", code: "HS-PS2-1", text: "Analyze force/mass/acceleration relationships" },
    prompt: "Let them find the launch angle that throws the ball farthest.",
    interaction: "Drag angle & speed; the 45° arc reveals maximum range",
    persona: "Dr. Bell",
    shareId: "projectile-demo",
  },
  {
    slug: "wave-amplitude-frequency",
    title: "Wave Amplitude vs Frequency",
    subject: "physics",
    gradeBand: "6-8",
    gradeLabel: "6-8",
    standard: { framework: "NGSS", code: "MS-PS4-1", text: "Mathematical model of a wave's properties" },
    prompt: "Show the difference between a louder wave and a higher-pitch wave.",
    interaction: "Two sliders: amplitude (height) vs frequency (spacing), independent",
    persona: "Coach Ramirez",
    shareId: "wave-demo",
  },
  {
    slug: "net-force-cart",
    title: "Net-Force Cart",
    subject: "physics",
    gradeBand: "6-8",
    gradeLabel: "6-8",
    standard: { framework: "NGSS", code: "MS-PS2-2", text: "Change in motion depends on net force and mass" },
    prompt: "Let them feel that more force or less mass means more acceleration.",
    interaction: "Add force arrows and mass blocks; acceleration responds",
    persona: "Coach Ramirez",
    shareId: "cart-demo",
  },
  {
    slug: "kinetic-energy",
    title: "Kinetic-Energy Explorer",
    subject: "physics",
    gradeBand: "6-8",
    gradeLabel: "6-8",
    standard: { framework: "NGSS", code: "MS-PS3-1", text: "Kinetic energy relates to mass and speed" },
    prompt: "Show that doubling speed quadruples the energy.",
    interaction: "Sliders for mass & speed; KE bar tracks the v² relationship",
    persona: "Coach Ramirez",
    shareId: "ke-demo",
  },
];

export function getSimByShareId(shareId: string): GallerySim | undefined {
  return GALLERY_SIMS.find((s) => s.shareId === shareId);
}

export function getSimBySlug(slug: string): GallerySim | undefined {
  return GALLERY_SIMS.find((s) => s.slug === slug);
}

export const HERO_SIM = GALLERY_SIMS.find((s) => s.hero) ?? GALLERY_SIMS[0];
