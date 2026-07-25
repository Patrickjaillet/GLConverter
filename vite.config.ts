import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const packageJsonUrl = new URL("./package.json", import.meta.url);
const packageJson = JSON.parse(readFileSync(fileURLToPath(packageJsonUrl), "utf-8")) as { version: string };

export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  },
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
