import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Spend guard: every test run resolves to DEMO_MODE regardless of the dev's
    // shell, so no test can ever reach the real Codex engine and bill a key.
    // See src/lib/harness/__tests__/env-safety.test.ts.
    env: { CHALKBOX_DEMO_MODE: "true" },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/lib/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/lib/seed/**"],
    },
  },
});
