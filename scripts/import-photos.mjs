#!/usr/bin/env node
/**
 * Photo import / manifest builder.
 *
 *   npm run import-photos
 *   npm run import-photos -- --from "D:/Photos/Silverstone 2025" --category circuit
 *
 * What it does:
 *   - optionally copies images in from an external folder (--from)
 *   - scans public/images/gallery (including one level of sub-folders)
 *   - measures each image and builds a tiny blur-up placeholder
 *   - writes data/photos.json, PRESERVING any metadata you have already
 *     edited for a file (title, alt, category, event, location, year,
 *     featured, settings)
 *   - drops entries whose file no longer exists
 *
 * Sub-folder names matching a category set that photo's category, so
 * public/images/gallery/rally/foo.jpg lands in the Rally filter.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GALLERY_DIR = path.join(ROOT, "public", "images", "gallery");
const MANIFEST = path.join(ROOT, "data", "photos.json");

const CATEGORY_IDS = [
  "circuit",
  "rally",
  "endurance",
  "pit-lane",
  "portrait",
  "detail",
];
const DEFAULT_CATEGORY = "circuit";
const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

/** Fields the script must never overwrite once you have edited them. */
const EDITABLE = [
  "alt",
  "title",
  "category",
  "event",
  "location",
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
  const args = { from: null, category: null, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--from") args.from = argv[++i];
    else if (a === "--category") args.category = argv[++i];
    else if (a === "--force") args.force = true;
  }
  if (args.category && !CATEGORY_IDS.includes(args.category)) {
    exit(
      `Unknown category "${args.category}".\n    Valid: ${CATEGORY_IDS.join(", ")}`,
    );
  }
  return args;
}

// ---------------------------------------------------------------- helpers

/** "silverstone-turn-three_02" -> "Silverstone Turn Three 02" */
function titleFromFilename(name) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

// ---------------------------------------------------------------- copy-in

async function copyFrom(srcDir, category) {
  const target = category ? path.join(GALLERY_DIR, category) : GALLERY_DIR;
  await fs.mkdir(target, { recursive: true });

  const resolved = path.resolve(srcDir);
  const files = await walk(resolved);
  if (!files.length) exit(`No images found in ${resolved}`);

  let copied = 0;
  for (const file of files) {
    const dest = path.join(target, path.basename(file));
    try {
      await fs.access(dest);
      continue; // already there, leave it alone
    } catch {
      /* not present - copy it */
    }
    await fs.copyFile(file, dest);
    copied++;
  }
  console.log(
    `  Copied ${copied} new image${copied === 1 ? "" : "s"} into ${path.relative(ROOT, target)}`,
  );
}

// ---------------------------------------------------------------- main

async function main() {
  const args = parseArgs(process.argv.slice(2));

  await fs.mkdir(GALLERY_DIR, { recursive: true });

  if (args.from) {
    console.log(`\n  Importing from ${args.from}`);
    await copyFrom(args.from, args.category);
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
  let added = 0;
  let refreshed = 0;

  for (const file of files) {
    const rel = path.relative(GALLERY_DIR, file).split(path.sep);
    const folder = rel.length > 1 ? rel[0].toLowerCase() : null;
    const base = path.basename(file, path.extname(file));
    const id = base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

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
      alt: `${titleFromFilename(base)} - motorsport photograph by Michael Peacock`,
      title: titleFromFilename(base),
      category:
        folder && CATEGORY_IDS.includes(folder) ? folder : DEFAULT_CATEGORY,
      blurDataURL: await blurPlaceholder(file),
    };

    const year = yearFrom(base) ?? yearFrom(rel.join("/"));
    if (year) photo.year = year;

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
