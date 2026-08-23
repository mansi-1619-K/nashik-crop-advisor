#!/usr/bin/env node
/**
 * fetch-brutal-assets.mjs
 *
 * Pulls public-domain / freely-licensed photographs of raw concrete
 * architecture from Wikimedia Commons into public/assets/raw/ and writes a
 * provenance manifest (title, artist, license, source page) used for
 * editorial captions in the UI.
 *
 * Usage: node scripts/fetch-brutal-assets.mjs
 * No external dependencies — Node built-in fetch only.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT_DIR = resolve(process.cwd(), "public/assets/raw");
const UA = "NashikCropAdvisorBrutalistRedesign/1.0 (local build script)";

const SEARCHES = [
  { fileStem: "boston-city-hall", query: 'Boston City Hall' },
  { fileStem: "habitat-67", query: 'Habitat 67 Montreal building' },
  { fileStem: "trellick-tower", query: 'Trellick Tower London' },
  { fileStem: "geisel-library", query: 'Geisel Library' },
];

const PREFERRED_LICENSES = /public domain|cc0|cc by(-sa)?|attribution/i;

async function commonsJson(params) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`Commons API ${res.status} for ${params.gsrsearch ?? ""}`);
  return res.json();
}

function pickFromResults(data) {
  const pages = Object.values(data?.query?.pages ?? {});
  const candidates = [];
  for (const page of pages) {
    const info = page?.imageinfo?.[0];
    if (!info) continue;
    if (info.mime && info.mime !== "image/jpeg") continue;
    if ((info.width ?? 0) < 1200) continue;
    const meta = info.extmetadata ?? {};
    const license = meta.LicenseShortName?.value ?? "unknown";
    if (!PREFERRED_LICENSES.test(license)) continue;
    candidates.push({
      title: page.title,
      url: info.thumburl ?? info.url,
      width: info.thumbwidth ?? info.width,
      height: info.thumbheight ?? info.height,
      license,
      artist: (meta.Artist?.value ?? "unknown").replace(/<[^>]+>/g, "").trim().slice(0, 120),
      descriptionUrl: info.descriptionurl ?? "",
      credit: meta.Credit?.value ? meta.Credit.value.replace(/<[^>]+>/g, "").trim().slice(0, 120) : "",
    });
  }
  // Prefer Public domain / CC0 first, then any acceptable CC.
  candidates.sort((a, b) => {
    const rank = (c) => (/public domain|cc0/i.test(c.license) ? 0 : 1);
    return rank(a) - rank(b);
  });
  return candidates[0] ?? null;
}

async function download(url, destPath) {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`download failed ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
  return buf.length;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const manifest = [];

  for (const target of SEARCHES) {
    process.stdout.write(`searching Commons: ${target.query}\n`);
    try {
      const data = await commonsJson({
        action: "query",
        generator: "search",
        gsrsearch: `${target.query} filetype:bitmap`,
        gsrnamespace: 6,
        gsrlimit: 12,
        prop: "imageinfo",
        iiprop: "url|extmetadata|mime|size",
        iiurlwidth: 1600,
      });
      const pick = pickFromResults(data);
      if (!pick) {
        process.stdout.write(`  !! no acceptable result for "${target.query}" — skipping\n`);
        continue;
      }
      const dest = resolve(OUT_DIR, `${target.fileStem}.jpg`);
      const bytes = await download(pick.url, dest);
      manifest.push({
        id: target.fileStem,
        file: `/assets/raw/${target.fileStem}.jpg`,
        bytes,
        ...pick,
      });
      process.stdout.write(`  -> ${target.fileStem}.jpg (${(bytes / 1024).toFixed(0)} KB) [${pick.license}] ${pick.title}\n`);
    } catch (err) {
      process.stdout.write(`  !! ${err.message} — skipping\n`);
    }
  }

  writeFileSync(resolve(OUT_DIR, "manifest.json"), JSON.stringify({ retrievedAt: new Date().toISOString(), source: "Wikimedia Commons", images: manifest }, null, 2));
  process.stdout.write(`\nwrote ${manifest.length}/${SEARCHES.length} assets + manifest.json to public/assets/raw/\n`);
  if (manifest.length === 0) process.exitCode = 1;
}

await main();
