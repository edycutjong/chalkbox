import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/Brand";

export function Header() {
  return (
    <header className="header-blur sticky top-0 z-50">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <Brand />
        <nav
          aria-label="Primary"
          className="flex items-center gap-4 text-sm sm:gap-7"
          style={{ color: "var(--text-mid)" }}
        >
          <Link href="/#how" className="link-quiet hidden sm:inline">
            How it works
          </Link>
          <Link href="/#gallery" className="link-quiet">
            Gallery
          </Link>
          <Link href="/#faq" className="link-quiet hidden sm:inline">
            FAQ
          </Link>
        </nav>
        <Link href="/create" className="btn btn-primary whitespace-nowrap text-sm">
          Create<span className="hidden sm:inline"> a manipulative</span>
          <ArrowRight className="icon-nudge" size={16} aria-hidden />
        </Link>
      </div>
    </header>
  );
}
