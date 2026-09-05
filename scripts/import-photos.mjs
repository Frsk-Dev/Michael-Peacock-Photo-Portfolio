#!/usr/bin/env node
/**
 * Photo import / manifest builder.
 *
 *   npm run import-photos
 *   npm run import-photos -- --from "D:/Photos/Gravity 2026/Drifting" --category drift --event "Gravity 2026"
 *
 * What it does:
 *   - copies images in from an external folder (--from), resizing them to a
 *     sensible web size on the way (originals are left untouched)
 *   - scans public/images/gallery (including one level of sub-folders)
 *   - measures each image, reads its EXIF for the settings and capture year,
 *     and builds a tiny blur-up placeholder
 *   - does NOT invent a title: an untitled frame is labelled with its event
 *   - writes data/photos.json, PRESERVING any metadata you have already
 *     edited for a file (title, alt, category, event, location, year,
 *     featured, settings)
 *   - drops entries whose file no longer exists
 *
 * Sub-folder names matching a category set that photo's category, so
 * public/images/gallery/drift/foo.jpg lands in the Drift filter.
 *
 * Flags:
 *   --from <dir>        copy images in from here first
 *   --category <id>     category for copied images (also picks the sub-folder)
 *   --event <name>      stamp this event name on newly imported photos
 *   --location <place>  stamp this location on newly imported photos
 *   --max-edge <px>     longest edge for the web copies (default 2560)
 *   --quality <1-100>   JPEG quality for the web copies (default 82)
 *   --no-resize         copy originals through untouched
 *   --force             reset ALL metadata to the derived defaults
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import exifReader from "exif-reader";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GALLERY_DIR = path.join(ROOT, "public", "images", "gallery");
const MANIFEST = path.join(ROOT, "data", "photos.json");

const CATEGORY_IDS = [
  "drift",
  "show",
  "detail",
  "circuit",
  "rally",
  "endurance",
  "pit-lane",
  "portrait",
];
const DEFAULT_CATEGORY = "drift";
const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

/** Fields the script must never overwrite once you have edited them. */
const EDITABLE = [
  "alt",
  "title",
  "category",
  "event",
  "location",
  "driver",
  "date",
  "year",
  "featured",
  "settings",
];

const exit = (msg) => {
  console.error(`\n  x ${msg}\n`);
  process.exit(1);
};

// ---------------------------------------------------------------- args

function parseArgs(argv) {
  const args = {
    from: null,
    category: null,
    event: null,
    location: null,
    maxEdge: 2560,
    quality: 82,
    resize: true,
    force: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--from") args.from = argv[++i];
    else if (a === "--category") args.category = argv[++i];
    else if (a === "--event") args.event = argv[++i];
    else if (a === "--location") args.location = argv[++i];
    else if (a === "--max-edge") args.maxEdge = Number(argv[++i]);
    else if (a === "--quality") args.quality = Number(argv[++i]);
    else if (a === "--no-resize") args.resize = false;
    else if (a === "--force") args.force = true;
  }
  if (args.category && !CATEGORY_IDS.includes(args.category)) {
    exit(
      `Unknown category "${args.category}".\n    Valid: ${CATEGORY_IDS.join(", ")}`,
    );
  }
  if (!Number.isFinite(args.maxEdge) || args.maxEdge < 320) {
    exit("--max-edge must be a number of at least 320.");
  }
  if (!Number.isFinite(args.quality) || args.quality < 1 || args.quality > 100) {
    exit("--quality must be between 1 and 100.");
  }
  return args;
}

// ---------------------------------------------------------------- helpers

/**
 * "adam lz" -> "Adam LZ", "jc-r32" -> "JC R32".
 * Folder names are typed in a hurry, so this only fixes capitalisation and
 * separators. Spelling stays exactly as you wrote it - correct anything you
 * do not like in data/photos.json and re-runs will keep your version.
 */
const ALL_CAPS = new Set([
  "lz", "hg", "hgs", "bmw", "jc", "gt", "gtr", "rx7", "r32", "r33", "r34",
  "s13", "s14", "s15", "ae86", "uk", "usa", "e36", "e46", "e92", "m3", "m4",
]);
function tidyName(raw) {
  return raw
    .replace(/[._]+/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) =>
      ALL_CAPS.has(w.toLowerCase())
        ? w.toUpperCase()
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

/**
 * Default alt text. Uses the driver when the source folders gave us one,
 * because "Adam LZ drifting at AdamLZ World Tour 2026" is worth far more to
 * a screen reader and to search than a generic line.
 */
function buildAlt(driver, event) {
  if (driver && event) return `${driver} drifting at ${event}`;
  if (event) return `${event} - motorsport photograph by Michael Peacock`;
  return "Motorsport photograph by Michael Peacock";
}

/** Pull a 4-digit year out of a filename or folder path, if one is there. */
function yearFrom(str) {
  const m = str.match(/(?:^|[^\d])(19|20)(\d{2})(?:[^\d]|$)/);
  if (!m) return undefined;
  const y = Number(`${m[1]}${m[2]}`);
  const now = new Date().getFullYear();
  return y >= 1950 && y <= now + 1 ? y : undefined;
}

async function walk(dir, depth = 0) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (depth < 1) files.push(...(await walk(full, depth + 1)));
    } else if (EXTS.has(path.extname(e.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

/** 20px-wide blurred JPEG, inlined as a data URI for the next/image blur-up. */
async function blurPlaceholder(file) {
  const buf = await sharp(file)
    .rotate()
    .resize(20, 20, { fit: "inside" })
    .blur(1.2)
    .jpeg({ quality: 45 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

/** Format a shutter speed the way a photographer writes it. */
function shutter(seconds) {
  if (!seconds) return null;
  if (seconds >= 1) return `${Number(seconds.toFixed(1))}s`;
  return `1/${Math.round(1 / seconds)}s`;
}

/**
 * Build the "400mm · f/2.8 · 1/1000s · ISO 200" line from EXIF.
 * Returns undefined when the file carries no usable exposure data.
 */
function settingsFromExif(exifBuffer) {
  if (!exifBuffer) return undefined;
  let tags;
  try {
    tags = exifReader(exifBuffer);
  } catch {
    return undefined;
  }
  const p = tags?.Photo ?? {};
  const parts = [];

  if (p.FocalLength) parts.push(`${Math.round(p.FocalLength)}mm`);
  if (p.FNumber) parts.push(`f/${Number(p.FNumber.toFixed(1))}`);
  const s = shutter(p.ExposureTime);
  if (s) parts.push(s);
  const iso = Array.isArray(p.ISOSpeedRatings)
    ? p.ISOSpeedRatings[0]
    : p.ISOSpeedRatings;
  if (iso) parts.push(`ISO ${iso}`);

  return parts.length ? parts.join(" · ") : undefined;
}

/**
 * When the shutter actually fired, as { date: "2026-09-04", year: 2026 }.
 * The date is what orders events on the site, so newest shows come first
 * without anyone maintaining a list by hand.
 */
function captureDateFromExif(exifBuffer) {
  if (!exifBuffer) return {};
  try {
    const tags = exifReader(exifBuffer);
    const d = tags?.Photo?.DateTimeOriginal ?? tags?.Image?.DateTime;
    if (d instanceof Date && !Number.isNaN(d.valueOf())) {
      const pad = (n) => String(n).padStart(2, "0");
      return {
        date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        year: d.getFullYear(),
      };
    }
  } catch {
    /* no usable date */
  }
  return {};
}

// ---------------------------------------------------------------- copy-in

async function copyFrom(srcDir, args) {
  const target = args.category
    ? path.join(GALLERY_DIR, args.category)
    : GALLERY_DIR;
  await fs.mkdir(target, { recursive: true });

  const resolved = path.resolve(srcDir);
  const files = (await walk(resolved)).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
  if (!files.length) exit(`No images found in ${resolved}`);

  let copied = 0;
  let skipped = 0;
  let bytesIn = 0;
  let bytesOut = 0;

  // Claimed within this run, so two sources never fight over one destination.
  const claimed = new Set();

  // Gallery-relative path -> the source sub-folder it came out of. Photographers
  // tend to sort a shoot into folders per driver or team, and that name is real
  // information worth keeping rather than flattening away.
  const drivers = new Map();

  for (const file of files) {
    // Web copies are always JPEG. Only .jpg passes its name through unchanged:
    // anything else gets its original extension folded into the name, so
    // "shot.jpg" and "shot.png" stay two distinct photos rather than one
    // silently overwriting the other. Deterministic, so re-runs still match.
    const ext = path.extname(file).toLowerCase();
    const stem = path.basename(file, path.extname(file));
    let destName = ext === ".jpg" ? `${stem}.jpg` : `${stem}-${ext.slice(1)}.jpg`;

    let n = 2;
    while (claimed.has(destName.toLowerCase())) {
      destName = `${stem}-${n++}.jpg`;
    }
    claimed.add(destName.toLowerCase());

    const dest = path.join(target, destName);

    // Sub-folder directly under the source root, if the file was in one.
    const rel = path.relative(resolved, file).split(path.sep);
    if (rel.length > 1) {
      drivers.set(path.relative(GALLERY_DIR, dest), tidyName(rel[0]));
    }

    try {
      await fs.access(dest);
      skipped++;
      continue; // already imported, leave it alone
    } catch {
      /* not present - import it */
    }

    const srcStat = await fs.stat(file);
    bytesIn += srcStat.size;

    if (args.resize) {
      await sharp(file)
        .rotate() // bake in the EXIF orientation before stripping metadata
        .resize(args.maxEdge, args.maxEdge, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: args.quality, progressive: true, mozjpeg: true })
        // Keep the colour profile so the web copy is not washed out; the rest
        // of the EXIF (GPS, serial numbers) is dropped on purpose.
        .withMetadata({ icc: "srgb" })
        .toFile(dest);
    } else {
      await fs.copyFile(file, dest);
    }

    bytesOut += (await fs.stat(dest)).size;
    copied++;
    if (copied % 10 === 0) process.stdout.write(`    ${copied} imported...\n`);
  }

  const mb = (n) => `${(n / 1048576).toFixed(0)} MB`;
  console.log(
    `    ${copied} imported${skipped ? `, ${skipped} already present` : ""} -> ${path.relative(ROOT, target)}`,
  );
  if (copied && args.resize) {
    console.log(
      `    ${mb(bytesIn)} of originals -> ${mb(bytesOut)} on disk (max ${args.maxEdge}px, q${args.quality})`,
    );
  }
  if (drivers.size) {
    const names = [...new Set(drivers.values())];
    console.log(
      `    ${names.length} source sub-folders recorded as drivers: ${names.slice(0, 6).join(", ")}${names.length > 6 ? ", ..." : ""}`,
    );
  }
  return drivers;
}

// ---------------------------------------------------------------- main

async function main() {
  const args = parseArgs(process.argv.slice(2));

  await fs.mkdir(GALLERY_DIR, { recursive: true });

  // Gallery-relative path -> driver name, for anything copied in this run.
  let drivers = new Map();
  if (args.from) {
    console.log(`\n  Importing from ${args.from}`);
    drivers = await copyFrom(args.from, args);
  }

  // Load whatever metadata already exists so we never clobber your edits.
  let existing = [];
  try {
    existing = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    /* first run */
  }
  const byId = new Map(existing.map((p) => [p.id, p]));

  const files = (await walk(GALLERY_DIR)).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
  );

  if (!files.length) {
    exit(
      `No images in public/images/gallery.\n` +
        `    Drop some in, or run:\n` +
        `      npm run import-photos -- --from "C:/path/to/photos"`,
    );
  }

  const out = [];
  const usedIds = new Set();
  let added = 0;
  let refreshed = 0;

  for (const file of files) {
    const rel = path.relative(GALLERY_DIR, file).split(path.sep);
    const folder = rel.length > 1 ? rel[0].toLowerCase() : null;
    const base = path.basename(file, path.extname(file));

    // Two files can share a stem across sub-folders - keep ids unique.
    let id = base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (usedIds.has(id)) {
      let n = 2;
      while (usedIds.has(`${id}-${n}`)) n++;
      id = `${id}-${n}`;
    }
    usedIds.add(id);

    let meta;
    try {
      meta = await sharp(file).rotate().metadata();
    } catch (err) {
      console.warn(`  ! Skipped ${base} - could not read it (${err.message})`);
      continue;
    }
    if (!meta.width || !meta.height) {
      console.warn(`  ! Skipped ${base} - no dimensions`);
      continue;
    }

    const prev = byId.get(id);

    const photo = {
      id,
      src: "/images/gallery/" + rel.map(encodeURIComponent).join("/"),
      width: meta.width,
      height: meta.height,
      // No title is generated on purpose. A frame with no title is labelled
      // with its event, which beats "Gravity 2026 15". Add titles by hand in
      // data/photos.json for the shots that deserve one.
      alt: buildAlt(drivers.get(rel.join(path.sep)), args.event),
      category:
        folder && CATEGORY_IDS.includes(folder) ? folder : DEFAULT_CATEGORY,
      blurDataURL: await blurPlaceholder(file),
    };

    const settings = settingsFromExif(meta.exif);
    if (settings) photo.settings = settings;

    const shot = captureDateFromExif(meta.exif);
    if (shot.date) photo.date = shot.date;

    const year = shot.year ?? yearFrom(base) ?? yearFrom(rel.join("/"));
    if (year) photo.year = year;

    const driver = drivers.get(rel.join(path.sep));
    if (driver) photo.driver = driver;

    // Stamp event/location on anything new, when the flags were given.
    if (!prev) {
      if (args.event) photo.event = args.event;
      if (args.location) photo.location = args.location;
    }

    if (prev && !args.force) {
      // Keep everything you have edited; only refresh the derived fields.
      for (const key of EDITABLE) {
        if (prev[key] !== undefined) photo[key] = prev[key];
      }
    }
    if (prev) refreshed++;
    else added++;

    out.push(photo);
  }

  // Manifest order is meaningful - the first featured photo is the home page
  // hero - so keep whatever order the file already had and append new frames
  // at the end, rather than re-sorting everything by filename.
  const prevOrder = new Map(existing.map((p, i) => [p.id, i]));
  out.sort((a, b) => {
    const ai = prevOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bi = prevOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });

  // Featured: if you have not marked any yourself, feature the first six.
  if (!out.some((p) => p.featured)) {
    out.slice(0, 6).forEach((p) => {
      p.featured = true;
    });
  }

  const dropped = existing.filter((p) => !out.some((o) => o.id === p.id));

  await fs.writeFile(MANIFEST, JSON.stringify(out, null, 2) + "\n", "utf8");

  const counts = out.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  console.log(`\n  data/photos.json updated`);
  console.log(
    `    ${out.length} photos   ${added} new   ${refreshed} refreshed`,
  );
  if (dropped.length) {
    console.log(
      `    ${dropped.length} removed (file gone): ${dropped.map((p) => p.id).join(", ")}`,
    );
  }
  console.log(
    `    by category: ${Object.entries(counts)
      .map(([k, v]) => `${k} ${v}`)
      .join("  |  ")}`,
  );
  console.log(
    `\n  Next: open data/photos.json, set the titles and categories you want,\n` +
      `  then run  npm run dev\n`,
  );
}

main().catch((err) => exit(err.stack || err.message));
