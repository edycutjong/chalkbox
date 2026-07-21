import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Chalkbox ships DEMO MODE by default — no env vars, no external calls.
  // The real Codex/Supabase engine drops in behind the seams in src/lib/harness.
  reactStrictMode: true,
  // Clean URL for the self-contained pitch deck served from public/pitch.html.
  // Press P in-deck for speaker notes, Cmd/Ctrl+P to export a 10-page PDF.
  async rewrites() {
    return [{ source: "/pitch", destination: "/pitch.html" }];
  },
};

export default nextConfig;
