import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { DEMO_MODE } from "@/lib/demo";
import { version } from "../../../package.json";

const GITHUB = "https://github.com/edycutjong/chalkbox";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Create", href: "/create" },
      { label: "Gallery", href: "/gallery" },
      { label: "How it works", href: "/#how" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    heading: "Project",
    links: [
      { label: "GitHub", href: GITHUB },
      { label: "README", href: `${GITHUB}#readme` },
      { label: "Architecture", href: `${GITHUB}/blob/main/docs/ARCHITECTURE.md` },
      { label: "Complexity blueprint", href: `${GITHUB}/blob/main/docs/COMPLEXITY.md` },
    ],
  },
  {
    heading: "Built for",
    links: [
      { label: "OpenAI Build Week", href: "https://openai.devpost.com" },
      { label: "MIT License", href: `${GITHUB}/blob/main/LICENSE` },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className="mt-10"
      style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-overlay)" }}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 font-semibold">
            <BrandMark size={28} />
            <span className="text-lg font-bold" style={{ color: "var(--text-hi)" }}>
              Chalkbox
            </span>
          </div>
          <p className="max-w-xs text-sm" style={{ color: "var(--text-mid)" }}>
            Type the misconception; get a self-tested interactive manipulative in two minutes.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.heading} aria-label={col.heading} className="flex flex-col gap-3">
            <span className="eyebrow" style={{ color: "var(--text-low)" }}>
              {col.heading}
            </span>
            {col.links.map((l) => (
              <Link key={l.label} href={l.href} className="link-quiet text-sm">
                {l.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>

      <div className="hairline" />
      <div
        className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs sm:flex-row"
        style={{ color: "var(--text-low)" }}
      >
        <span>© 2026 Chalkbox · MIT Licensed · Built for OpenAI Build Week</span>
        <span className="flex items-center gap-2 font-mono">
          <Link
            href={`${GITHUB}/releases/tag/v${version}`}
            className="link-quiet"
            aria-label={`Release v${version}`}
          >
            v{version}
          </Link>
          <span aria-hidden="true">·</span>
          <span>{DEMO_MODE ? "Demo mode · no keys required" : "Live · Codex + GPT-5.6"}</span>
        </span>
      </div>
    </footer>
  );
}
