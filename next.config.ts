import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Chalkbox ships DEMO MODE by default — no env vars, no external calls.
  // The real Codex/Supabase engine drops in behind the seams in src/lib/harness.
  reactStrictMode: true,
};

export default nextConfig;
