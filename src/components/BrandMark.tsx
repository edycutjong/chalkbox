/**
 * BrandMark — the Chalkbox logo as a real inline vector (not an emoji).
 *
 * The mark mirrors public/icon.svg: a rounded "box" (the sandboxed sim) in the
 * brand teal→amber gradient, carrying a single confident chalk-check — the
 * headless self-test that must pass before a sim ships — plus a publish spark.
 *
 * Server-safe (no hooks). Gradient ids are static; duplicate ids across several
 * marks on one page all resolve to an identical gradient, so every logo renders
 * correctly. Scales crisply from 16px (favicon-ish) to hero sizes.
 */
export function BrandMark({
  size = 26,
  className,
  animated = false,
}: {
  size?: number | string;
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role="img"
      aria-label="Chalkbox"
      className={`brandmark${animated ? " brandmark-animated" : ""}${className ? ` ${className}` : ""}`}
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="chalkboxBrand" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary, #14b8a6)" />
          <stop offset="100%" stopColor="var(--accent, #f59e0b)" />
        </linearGradient>
        <linearGradient id="chalkboxSheen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* the box: rounded square in the brand gradient */}
      <rect x="64" y="64" width="384" height="384" rx="104" fill="url(#chalkboxBrand)" />
      <rect x="64" y="64" width="384" height="384" rx="104" fill="url(#chalkboxSheen)" />

      {/* the self-test check — one confident chalk stroke */}
      <path
        className="brandmark-check"
        d="M 150 268 L 228 348 L 366 178"
        fill="none"
        stroke="#02120f"
        strokeWidth="70"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.28"
      />
      <path
        className="brandmark-check"
        d="M 150 268 L 228 348 L 366 178"
        fill="none"
        stroke="#f8fafc"
        strokeWidth="46"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* publish spark — the verified sim leaving the box */}
      <circle cx="398" cy="140" r="24" fill="#f8fafc" />
    </svg>
  );
}
