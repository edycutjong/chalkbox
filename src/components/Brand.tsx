import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2 font-semibold">
      <BrandMark size={28} animated />
      <span className="text-lg font-bold tracking-tight" style={{ color: "var(--text-hi)" }}>
        Chalkbox
      </span>
    </Link>
  );
}
