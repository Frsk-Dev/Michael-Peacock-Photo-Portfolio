#!/usr/bin/env node
/**
 * Builds the social share card - the image that appears when the site is
 * pasted into WhatsApp, Instagram, Discord, iMessage, Facebook or X.
 *
 *   npm run build:og
 *
 * Writes app/opengraph-image.jpg and app/twitter-image.jpg. Next picks those
 * filenames up automatically and emits the meta tags with absolute URLs, so
 * there is nothing to wire up by hand.
 *
 * Re-run it whenever the hero photograph changes - it always uses the first
 * featured frame in data/photos.json, which is the same photo the home page
 * uses as its hero.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// The size every platform expects. 1.91:1.
const W = 1200;
const H = 630;

/** WhatsApp in particular is unreliable above roughly this size. */
const MAX_BYTES = 300 * 1024;

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function main() {
  const site = await fs.readFile(path.join(ROOT, "data", "site.ts"), "utf8");
  const pick = (key) => site.match(new RegExp(`${key}:\\s*"([^"]+)"`))?.[1];
  const name = pick("name") ?? "Michael Peacock";
  const role = pick("role") ?? "Motorsport Photography";

  const photos = JSON.parse(
    await fs.readFile(path.join(ROOT, "data", "photos.json"), "utf8"),
  );
  const hero = photos.find((p) => p.featured) ?? photos[0];
  if (!hero) {
    console.error("\n  x No photographs in the manifest.\n");
    process.exit(1);
  }

  const heroFile = path.join(
    ROOT,
    "public",
    decodeURIComponent(hero.src).replace(/^\//, ""),
  );

  // Photo, cropped to the card and pulled slightly right so the type on the
  // left lands on the quieter part of most frames.
  const base = await sharp(heroFile)
    .resize(W, H, { fit: "cover", position: "attention" })
    .toBuffer();

  const overlay = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="left" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"  stop-color="#0a0a0b" stop-opacity="0.94"/>
      <stop offset="55%" stop-color="#0a0a0b" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#0a0a0b" stop-opacity="0.15"/>
    </linearGradient>
    <linearGradient id="bottom" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%"  stop-color="#0a0a0b" stop-opacity="0.85"/>
      <stop offset="60%" stop-color="#0a0a0b" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#left)"/>
  <rect width="${W}" height="${H}" fill="url(#bottom)"/>

  <text x="72" y="404"
        font-family="Arial, Helvetica, sans-serif" font-weight="700"
        font-size="26" letter-spacing="6" fill="#9b9ba4">${esc(
          role.toUpperCase(),
        )}</text>

  <text x="68" y="500"
        font-family="Arial, Helvetica, sans-serif" font-weight="700"
        font-size="92" letter-spacing="-2" fill="#f4f4f2">${esc(
          name.toUpperCase(),
        )}</text>

  <rect x="72" y="536" width="64" height="7" fill="#e8452a"/>
</svg>`);

  // Step the quality down until it is small enough to preview reliably.
  let out;
  let quality = 88;
  do {
    out = await sharp(base)
      .composite([{ input: overlay, top: 0, left: 0 }])
      .jpeg({ quality, progressive: true, mozjpeg: true })
      .toBuffer();
    if (out.length <= MAX_BYTES) break;
    quality -= 6;
  } while (quality >= 55);

  const og = path.join(ROOT, "app", "opengraph-image.jpg");
  const tw = path.join(ROOT, "app", "twitter-image.jpg");
  await fs.writeFile(og, out);
  await fs.writeFile(tw, out);

  // Next uses these as the images' alt text.
  const alt = `${name} - ${role}`;
  await fs.writeFile(path.join(ROOT, "app", "opengraph-image.alt.txt"), alt);
  await fs.writeFile(path.join(ROOT, "app", "twitter-image.alt.txt"), alt);

  console.log(`
  Share card built from ${path.basename(heroFile)}

    app/opengraph-image.jpg   ${W}x${H}, ${(out.length / 1024).toFixed(0)} KB (q${quality})
    app/twitter-image.jpg     same image, for X
`);

  // ------------------------------------------------------------- per event
  // Album links get their own card. Without this, sharing an album posts the
  // raw cover photograph - wrong shape for a preview and several hundred KB,
  // which WhatsApp often refuses to fetch.
  const events = new Map();
  for (const p of photos) {
    if (!p.event) continue;
    if (!events.has(p.event)) events.set(p.event, []);
    events.get(p.event).push(p);
  }

  const ogDir = path.join(ROOT, "public", "og");
  await fs.mkdir(ogDir, { recursive: true });

  for (const [eventName, list] of events) {
    const slug = eventName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const landscape = (p) => p.width > p.height;
    const cover =
      list.find((p) => p.featured && landscape(p)) ||
      list.find(landscape) ||
      list[0];

    const dates = list.map((p) => p.date).filter(Boolean).sort();
    const when = dates.length
      ? new Date(dates.at(-1) + "T00:00:00Z").toLocaleDateString("en-GB", {
          day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
        })
      : "";

    const file = path.join(
      ROOT, "public", decodeURIComponent(cover.src).replace(/^\//, ""),
    );
    const bg = await sharp(file)
      .resize(W, H, { fit: "cover", position: "attention" })
      .toBuffer();

    const label = `${list.length} photograph${list.length === 1 ? "" : "s"}`;
    // Long event names need to step down or they run off the card.
    const size = eventName.length > 22 ? 62 : eventName.length > 16 ? 74 : 88;

    const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="l" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0a0a0b" stop-opacity="0.94"/>
      <stop offset="60%" stop-color="#0a0a0b" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#0a0a0b" stop-opacity="0.12"/>
    </linearGradient>
    <linearGradient id="b" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#0a0a0b" stop-opacity="0.88"/>
      <stop offset="60%" stop-color="#0a0a0b" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#l)"/>
  <rect width="${W}" height="${H}" fill="url(#b)"/>
  <text x="72" y="392" font-family="Arial, Helvetica, sans-serif" font-weight="700"
        font-size="24" letter-spacing="5" fill="#e8452a">${esc(when.toUpperCase())}</text>
  <text x="68" y="${392 + size + 12}" font-family="Arial, Helvetica, sans-serif" font-weight="700"
        font-size="${size}" letter-spacing="-1.5" fill="#f4f4f2">${esc(eventName.toUpperCase())}</text>
  <text x="72" y="${392 + size + 62}" font-family="Arial, Helvetica, sans-serif" font-weight="400"
        font-size="26" fill="#9b9ba4">${esc(label)}  ·  ${esc(name)}</text>
</svg>`);

    let buf;
    let q = 88;
    do {
      buf = await sharp(bg)
        .composite([{ input: svg, top: 0, left: 0 }])
        .jpeg({ quality: q, progressive: true, mozjpeg: true })
        .toBuffer();
      if (buf.length <= MAX_BYTES) break;
      q -= 6;
    } while (q >= 55);

    await fs.writeFile(path.join(ogDir, `${slug}.jpg`), buf);
    console.log(`    public/og/${slug}.jpg`.padEnd(46) + `${(buf.length / 1024).toFixed(0)} KB`);
  }

  console.log(`
  Next emits the meta tags automatically. Re-run after changing the hero
  photograph or importing a new event.
`);
}

main().catch((err) => {
  console.error(`\n  x ${err.message}\n`);
  process.exit(1);
});
