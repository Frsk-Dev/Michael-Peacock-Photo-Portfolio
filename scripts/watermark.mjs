#!/usr/bin/env node
/**
 * Stamps the logo watermark onto the gallery copies.
 *
 *   npm run watermark              apply to anything not yet done
 *   npm run watermark -- --sample  preview a few into .watermark-preview/
 *   npm run watermark -- --force   redo everything, even already-marked files
 *
 * Tuning (all optional):
 *   --width 0.18      logo width as a fraction of the photo's width
 *   --opacity 0.6     0 to 1
 *   --pad 0.025       margin from the edges, as a fraction of the width
 *   --position bottom-right | bottom-left | top-right | top-left
 *   --logo path.png   defaults to assets/watermark.png
 *
 * Only the web copies in public/images/gallery are touched. Your originals
 * are never opened by this script.
 *
 * Idempotency matters: running twice must not stack two watermarks. Each
 * photo is flagged `watermarked: true` in data/photos.json once stamped, and
 * flagged files are skipped.
 *
 * Changing the design later means --force, which re-encodes from the already
 * compressed copy AND would stamp over the existing mark. To redesign
 * properly, restore the clean files first:
 *
 *     git restore public/images/gallery data/photos.json
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "data", "photos.json");

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
const SAMPLE = argv.includes("--sample");
const FORCE = argv.includes("--force");
const LOGO = path.resolve(ROOT, flag("logo", "assets/watermark.png"));
const WIDTH_RATIO = Number(flag("width", 0.18));
const OPACITY = Number(flag("opacity", 0.6));
const PAD_RATIO = Number(flag("pad", 0.025));
const POSITION = flag("position", "bottom-right");
const QUALITY = 88;

/**
 * The logo at a given pixel width, faded, with a soft shadow behind it.
 *
 * The shadow matters: the mark is white, and without it the logo disappears
 * against tyre smoke or a bright sky - which is most of this gallery.
 */
async function buildMark(targetWidth) {
  const resized = await sharp(LOGO)
    .resize({ width: targetWidth, fit: "inside", withoutEnlargement: false })
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h } = resized.info;
  const blur = Math.max(1, targetWidth * 0.012);
  const offset = Math.max(1, Math.round(targetWidth * 0.006));
  const pad = Math.ceil(blur * 3) + offset;

  // Black silhouette of the logo, blurred, as the shadow.
  const shadow = await sharp(resized.data)
    .composite([{
      input: Buffer.from([0, 0, 0, 255]),
      raw: { width: 1, height: 1, channels: 4 },
      tile: true,
      blend: "in", // keep the logo's alpha, replace its colour with black
    }])
    .blur(blur)
    .toBuffer();

  // Fade both layers by multiplying their alpha.
  const fade = (buf, amount) =>
    sharp(buf)
      .composite([{
        input: Buffer.from([255, 255, 255, Math.round(255 * amount)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      }])
      .png()
      .toBuffer();

  const canvasW = w + pad * 2;
  const canvasH = h + pad * 2;

  return {
    width: canvasW,
    height: canvasH,
    buffer: await sharp({
      create: { width: canvasW, height: canvasH, channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([
        { input: await fade(shadow, OPACITY * 0.85), top: pad + offset, left: pad },
        { input: await fade(resized.data, OPACITY), top: pad, left: pad },
      ])
      .png()
      .toBuffer(),
  };
}

function placement(imgW, imgH, markW, markH, pad) {
  const top = POSITION.startsWith("top") ? pad : imgH - markH - pad;
  const left = POSITION.endsWith("left") ? pad : imgW - markW - pad;
  return { top: Math.max(0, Math.round(top)), left: Math.max(0, Math.round(left)) };
}

async function main() {
  try {
    await fs.access(LOGO);
  } catch {
    console.error(`\n  x No watermark image at ${path.relative(ROOT, LOGO)}\n`);
    process.exit(1);
  }

  const photos = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  let targets = photos.filter((p) => FORCE || !p.watermarked);

  if (!targets.length) {
    console.log("\n  Everything is already watermarked. Use --force to redo.\n");
    return;
  }

  const previewDir = path.join(ROOT, ".watermark-preview");
  if (SAMPLE) {
    // A landscape frame, a portrait one, and a bright one - the awkward cases.
    const landscape = targets.find((p) => p.width > p.height);
    const portrait = targets.find((p) => p.height > p.width);
    const bright = targets.find((p) => p.category === "show") ?? targets[1];
    targets = [...new Set([landscape, portrait, bright].filter(Boolean))].slice(0, 3);
    await fs.rm(previewDir, { recursive: true, force: true });
    await fs.mkdir(previewDir, { recursive: true });
    console.log(`\n  Previewing ${targets.length} frames into .watermark-preview/`);
  } else {
    console.log(`\n  Watermarking ${targets.length} photographs`);
  }
  console.log(
    `    logo ${path.relative(ROOT, LOGO)} at ${(WIDTH_RATIO * 100).toFixed(0)}% width, ` +
    `${(OPACITY * 100).toFixed(0)}% opacity, ${POSITION}`,
  );

  // The mark only depends on the target width, so cache by that.
  const markCache = new Map();
  let done = 0, bytesBefore = 0, bytesAfter = 0;

  for (const photo of targets) {
    const file = path.join(ROOT, "public", decodeURIComponent(photo.src).replace(/^\//, ""));

    let meta;
    try {
      meta = await sharp(file).metadata();
    } catch {
      console.warn(`  ! skipped ${photo.id} - could not read the file`);
      continue;
    }

    const targetWidth = Math.round(meta.width * WIDTH_RATIO);
    if (!markCache.has(targetWidth)) markCache.set(targetWidth, await buildMark(targetWidth));
    const mark = markCache.get(targetWidth);

    const pad = Math.round(meta.width * PAD_RATIO);
    const pos = placement(meta.width, meta.height, mark.width, mark.height, pad);

    bytesBefore += (await fs.stat(file)).size;

    const out = await sharp(file)
      .composite([{ input: mark.buffer, top: pos.top, left: pos.left }])
      .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
      .withMetadata({ icc: "srgb" })
      .toBuffer();

    if (SAMPLE) {
      await fs.writeFile(path.join(previewDir, `${photo.id}.jpg`), out);
    } else {
      // Write to a temp file then rename, so an interrupted run cannot leave
      // a half-written JPEG in the gallery.
      const tmp = `${file}.tmp`;
      await fs.writeFile(tmp, out);
      await fs.rename(tmp, file);
      photo.watermarked = true;
    }

    bytesAfter += out.length;
    done++;
    if (!SAMPLE && done % 25 === 0) console.log(`    ${done}/${targets.length}...`);
  }

  if (!SAMPLE) {
    const KEY_ORDER = ["id","src","width","height","alt","title","category","event",
                       "location","driver","date","year","featured","watermarked",
                       "settings","blurDataURL"];
    const ordered = photos.map((p) =>
      Object.fromEntries(KEY_ORDER.filter((k) => k in p).map((k) => [k, p[k]])),
    );
    await fs.writeFile(MANIFEST, JSON.stringify(ordered, null, 2) + "\n", "utf8");
  }

  if (!SAMPLE) {
    /**
     * Next caches every resized image it produces, keyed by the URL and not
     * by the file's contents. Stamping a watermark changes the file but not
     * its URL, so without this the site keeps serving the pre-watermark
     * versions for the cache lifetime - four hours by default - and it looks
     * like the watermark simply did not work.
     */
    const caches = [
      path.join(ROOT, ".next", "cache", "images"),
      path.join(ROOT, ".next", "dev", "cache", "images"),
    ];
    let cleared = 0;
    for (const dir of caches) {
      try {
        const entries = await fs.readdir(dir);
        cleared += entries.length;
        await fs.rm(dir, { recursive: true, force: true });
      } catch {
        /* nothing cached there */
      }
    }
    if (cleared) {
      console.log(`\n  Cleared ${cleared} stale entries from Next's image cache.`);
      console.log("  Restart the dev server and hard-refresh (Ctrl+Shift+R).");
    }
  }

  const mb = (n) => `${(n / 1048576).toFixed(0)} MB`;
  console.log(
    `\n  ${done} ${SAMPLE ? "previewed" : "watermarked"}   ${mb(bytesBefore)} -> ${mb(bytesAfter)}\n` +
    (SAMPLE
      ? "  Look at .watermark-preview/, adjust with --width / --opacity, then\n" +
        "  run it for real without --sample.\n"
      : "  Re-run after every import. Already-marked files are skipped.\n"),
  );
}

main().catch((err) => {
  console.error(`\n  x ${err.stack || err.message}\n`);
  process.exit(1);
});
