import Link from "next/link";
import { Brand } from "@/components/Brand";

export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
      <Brand />
      <nav className="flex items-center gap-5 text-sm" style={{ color: "var(--text-mid)" }}>
        <Link href="/">Create</Link>
        <Link href="/gallery">Gallery</Link>
      </nav>
    </header>
  );
}
