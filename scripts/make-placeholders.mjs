#!/usr/bin/env node
/**
 * Generates the placeholder gallery images so the site looks right before
 * your real photographs are in. Safe to delete this script (and the
 * placeholder-*.jpg files) once you have imported your own work.
 *
 *   node scripts/make-placeholders.mjs
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GALLERY_DIR = path.join(ROOT, "public", "images", "gallery");
const MANIFEST = path.join(ROOT, "data", "photos.json");

/** Muted, photographic-feeling backdrops - never brighter than the UI. */
const PALETTES = [
  ["#1c2028", "#0b0d11", "#e8452a"],
  ["#241c1a", "#0d0a09", "#c2683a"],
  ["#161d21", "#090c0e", "#4a7f8c"],
  ["#20202a", "#0b0b10", "#8a7bb0"],
  ["#232019", "#0e0c08", "#c9a227"],
  ["#1a1f1c", "#080a09", "#5c8f6a"],
];

function svg(w, h, index, label) {
  const [a, b, accent] = PALETTES[index % PALETTES.length];
  const diag = Math.hypot(w, h);
  // A few soft diagonal streaks, suggesting a panned frame.
  const streaks = Array.from({ length: 7 }, (_, i) => {
    const y = (h / 8) * (i + 0.5) + (i % 2 ? h * 0.03 : -h * 0.02);
    const o = 0.03 + (i % 3) * 0.018;
    return `<rect x="${-diag * 0.1}" y="${y}" width="${diag * 1.2}" height="${h * 0.012}" fill="#ffffff" opacity="${o}" />`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${a}" />
      <stop offset="100%" stop-color="${b}" />
    </linearGradient>
    <radialGradient id="v" cx="50%" cy="45%" r="72%">
      <stop offset="55%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.55" />
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)" />
  <g transform="rotate(-14 ${w / 2} ${h / 2})">${streaks}</g>
  <rect width="${w}" height="${h}" fill="url(#v)" />
  <rect x="${w * 0.06}" y="${h * 0.06}" width="${w * 0.88}" height="${h * 0.88}"
        fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="${Math.max(1, w * 0.0012)}" />
  <circle cx="${w * 0.5}" cy="${h * 0.46}" r="${Math.min(w, h) * 0.085}"
          fill="none" stroke="${accent}" stroke-opacity="0.65" stroke-width="${Math.max(1, w * 0.0022)}" />
  <text x="${w * 0.5}" y="${h * 0.475}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="700"
        font-size="${Math.min(w, h) * 0.075}" fill="#ffffff" fill-opacity="0.82">${index + 1}</text>
  <text x="${w * 0.5}" y="${h * 0.62}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="600"
        letter-spacing="${Math.min(w, h) * 0.012}"
        font-size="${Math.min(w, h) * 0.028}" fill="#ffffff" fill-opacity="0.45">${label}</text>
</svg>`;
}

async function main() {
  await fs.mkdir(GALLERY_DIR, { recursive: true });
  const manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  const placeholders = manifest.filter((p) => p.id.startsWith("placeholder-"));

  if (!placeholders.length) {
    console.log("\n  No placeholder entries in the manifest - nothing to do.\n");
    return;
  }

  for (const [i, p] of placeholders.entries()) {
    const file = path.join(ROOT, "public", decodeURIComponent(p.src).replace(/^\//, ""));
    const label = "REPLACE WITH YOUR PHOTO";
    const buffer = Buffer.from(svg(p.width, p.height, i, label));
    await sharp(buffer).jpeg({ quality: 82, progressive: true }).toFile(file);

    // Refresh the blur-up placeholder to match.
    const blur = await sharp(file)
      .resize(20, 20, { fit: "inside" })
      .blur(1.2)
      .jpeg({ quality: 45 })
      .toBuffer();
    p.blurDataURL = `data:image/jpeg;base64,${blur.toString("base64")}`;
  }

  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`\n  Generated ${placeholders.length} placeholder images.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
