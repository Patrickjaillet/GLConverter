import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const distDir = resolve(projectRoot, "dist");
const indexPath = resolve(distDir, "index.html");

const errors = [];

function collectFiles(dir) {
  const files = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);

    if (statSync(fullPath).isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

if (!existsSync(distDir)) {
  errors.push(`Missing build output directory: ${distDir}. Run "npm run build" first.`);
} else if (!existsSync(indexPath)) {
  errors.push(`Missing ${indexPath}.`);
} else {
  const html = readFileSync(indexPath, "utf8");
  const rootAbsoluteReferences = [...html.matchAll(/(?:src|href)="(\/[^"]*)"/g)].map((match) => match[1]);

  if (rootAbsoluteReferences.length > 0) {
    errors.push(
      `index.html references root-absolute paths, which break on GitHub Pages project sites: ${rootAbsoluteReferences.join(", ")}`
    );
  }

  if (!html.includes('src="./assets/') && !html.includes("src='./assets/")) {
    errors.push('index.html does not reference "./assets/..." — check the Vite "base" configuration is "./".');
  }

  const jsAssets = collectFiles(distDir).filter((file) => file.endsWith(".js"));

  for (const asset of jsAssets) {
    const content = readFileSync(asset, "utf8");

    if (/from\s*["']\/(?!\/)/.test(content)) {
      errors.push(`${asset} contains a root-absolute import specifier.`);
    }
  }

  if (jsAssets.length === 0) {
    errors.push("No JavaScript assets were produced by the build.");
  }
}

if (errors.length > 0) {
  console.error("[verify-pages] GitHub Pages compatibility check failed:");

  for (const error of errors) {
    console.error(` - ${error}`);
  }

  process.exit(1);
}

console.log("[verify-pages] GitHub Pages compatibility verified: all asset paths are relative.");
