import type { Subject } from "@/lib/harness/types";
import { BrandMark } from "@/components/BrandMark";

export function ScopeBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      style={{
        background: "var(--color-hover)",
        color: "var(--primary)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <BrandMark size={14} /> Math &amp; physics manipulatives
    </span>
  );
}

export function SubjectTag({ subject }: { subject: Subject }) {
  const isMath = subject === "math";
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide"
      style={{
        background: isMath ? "rgba(20, 184, 166, 0.18)" : "rgba(251, 113, 133, 0.2)",
        color: isMath ? "var(--primary)" : "#fb7185",
      }}
    >
      {subject}
    </span>
  );
}

export function StandardChip({ code, text }: { code: string; text: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px]"
      style={{
        background: "var(--bg-overlay)",
        color: "var(--text-mid)",
        border: "1px solid var(--border-subtle)",
      }}
      title={text}
    >
      <strong style={{ color: "var(--accent)" }}>{code}</strong>
      <span className="hidden sm:inline">· {text}</span>
    </span>
  );
}
