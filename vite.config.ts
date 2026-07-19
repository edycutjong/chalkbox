import { defineConfig } from "vite";
import { fileURLToPath } from "url";

// Minimal config so `vite-node scripts/bench.ts` resolves the "@/…" path alias.
// Tests use vitest.config.ts (which takes precedence for vitest); Next uses next.config.ts.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
