import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold">
      <span aria-hidden className="text-2xl leading-none">
        🖍️
      </span>
      <span className="text-lg font-bold tracking-tight" style={{ color: "var(--text-hi)" }}>
        Chalkbox
      </span>
    </Link>
  );
}
