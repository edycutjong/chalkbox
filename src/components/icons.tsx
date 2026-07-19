import { Atom, Sigma, PenLine, type LucideProps } from "lucide-react";
import type { Subject } from "@/lib/harness/types";

/**
 * SubjectIcon — one clean line icon per subject, shared by the gallery grid,
 * gallery preview and the sim frame so math/physics read consistently.
 * Inherits `currentColor` and sizes to the surrounding text.
 */
export function SubjectIcon({ subject, ...props }: { subject: Subject } & LucideProps) {
  const Icon = subject === "math" ? Sigma : subject === "physics" ? Atom : PenLine;
  return <Icon aria-hidden {...props} />;
}
