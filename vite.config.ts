import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("three")) {
            return "three";
          }

          if (id.includes("codemirror") || id.includes("@codemirror") || id.includes("@lezer")) {
            return "codemirror";
          }

          if (id.includes("acorn") || id.includes("astring") || id.includes("eslint-scope")) {
            return "ast-engine";
          }

          return undefined;
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: false,
    include: ["src/**/*.test.ts"],
    restoreMocks: true
  }
});
