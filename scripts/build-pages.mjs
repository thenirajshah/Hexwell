#!/usr/bin/env node
/**
 * Static build for GitHub Pages.
 *
 *   npm run build:pages
 *   BASE_PATH=/my-repo/ npm run build:pages
 *
 * Writes the site to ./gh-pages (index.html, 404.html, assets, .nojekyll).
 * User sites (username.github.io) use BASE_PATH=/. Project sites use /repo-name/.
 */
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function normalizeBase(raw) {
  if (!raw || raw === "/" || raw === "./") return "/";
  const trimmed = raw.trim();
  const withLead = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLead.endsWith("/") ? withLead : `${withLead}/`;
}

const base = normalizeBase(process.env.BASE_PATH);
const outDir = join(root, "gh-pages");

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env, stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

function findIndex(dir, depth = 0) {
  if (depth > 4 || !existsSync(dir)) return null;
  const direct = join(dir, "index.html");
  if (existsSync(direct)) return dir;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    const found = findIndex(join(dir, name.name), depth + 1);
    if (found) return found;
  }
  return null;
}

rmSync(outDir, { recursive: true, force: true });

const env = {
  ...process.env,
  GITHUB_PAGES: "1",
  VITE_GITHUB_PAGES: "1",
  BASE_PATH: base,
};

await run("node", ["scripts/with-app-env.mjs", "vite", "build"], env);

const candidates = [join(root, ".output", "public"), join(root, "dist"), join(root, ".vercel", "output", "static")];
const site = candidates.map((dir) => findIndex(dir)).find(Boolean);
if (!site) {
  console.error("[pages] No index.html after the static build.");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
cpSync(site, outDir, { recursive: true });
cpSync(join(outDir, "index.html"), join(outDir, "404.html"));
writeFileSync(join(outDir, ".nojekyll"), "");
// Project-site sitemap and crawler guidance; no production URLs for preview builds.
if (base === "/Hexwell/") {
  const url = "https://thenirajshah.github.io/Hexwell/";
  const catalog = JSON.parse(readFileSync(join(root, "src/data/catalog.json"), "utf8"));
  const urls = [url, ...catalog.parts.map(part => url + "part/" + encodeURIComponent(part.id))];
  const entries = urls.map(loc => "<url><loc>" + loc + "</loc></url>").join("\n");
  writeFileSync(join(outDir, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries + '</urlset>\n');
  writeFileSync(join(outDir, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: " + url + "sitemap.xml\n");
}
console.log(`[pages] Site written to gh-pages (base ${base})`);
