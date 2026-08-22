import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["tests/setup/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"]
    }
  },
  resolve: {
    alias: {
      "@/app": path.resolve(currentDirPath, "app"),
      "@/scripts": path.resolve(currentDirPath, "scripts"),
      "@/tests": path.resolve(currentDirPath, "tests"),
      "@": path.resolve(currentDirPath, "apps/web/src"),
      "server-only": path.resolve(currentDirPath, "tests/mocks/server-only.ts")
    }
  }
});
