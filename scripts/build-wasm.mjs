import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const crateDir = resolve(projectRoot, "rust-engine");
const outDir = resolve(projectRoot, "src/wasm/pkg");

function commandExists(command) {
  const probe = spawnSync(command, ["--version"], { stdio: "ignore" });
  return probe.error === undefined;
}

function run() {
  if (!commandExists("wasm-pack")) {
    console.warn("[build-wasm] wasm-pack not found, skipping WASM build. The app will fall back to the JS engine.");
    return;
  }

  const result = spawnSync(
    "wasm-pack",
    ["build", crateDir, "--release", "--target", "web", "--out-dir", outDir, "--out-name", "glconverter_engine"],
    { stdio: "inherit" }
  );

  if (result.status !== 0) {
    console.warn("[build-wasm] wasm-pack build failed, skipping WASM build. The app will fall back to the JS engine.");
    return;
  }

  if (!existsSync(resolve(outDir, "glconverter_engine.js"))) {
    console.warn("[build-wasm] WASM build output missing, skipping. The app will fall back to the JS engine.");
    return;
  }

  console.log("[build-wasm] WASM engine built successfully.");
}

run();
