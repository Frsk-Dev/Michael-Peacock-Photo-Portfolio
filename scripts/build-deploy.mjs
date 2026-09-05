#!/usr/bin/env node
/**
 * Builds a self-contained folder you can upload to a server and run.
 *
 *   npm run build:deploy
 *
 * Produces ./deploy containing everything needed and nothing else:
 *
 *   deploy/
 *     server.js          the entry point - `node server.js`
 *     node_modules/      only the packages the server actually uses
 *     .next/             the compiled app
 *     public/            the photographs
 *     start.sh           reads Pterodactyl's SERVER_PORT / SERVER_IP
 *
 * Next's `output: "standalone"` build does most of this, but it deliberately
 * leaves out `.next/static` and `public` because a CDN often serves those.
 * We are serving them from the same process, so they get copied in here.
 */

import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "deploy");
const STANDALONE = path.join(ROOT, ".next", "standalone");

const step = (msg) => console.log(`\n  ${msg}`);
const fail = (msg) => {
  console.error(`\n  x ${msg}\n`);
  process.exit(1);
};

/** Directory size in bytes, for the summary at the end. */
async function dirSize(dir) {
  let total = 0;
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += await dirSize(full);
    else if (entry.isFile()) total += (await fs.stat(full)).size;
  }
  return total;
}

const mb = (n) => `${(n / 1048576).toFixed(0)} MB`;

// ---------------------------------------------------------------- build

step("Building...");
const build = spawnSync("npm", ["run", "build"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (build.status !== 0) fail("The build failed - fix that before deploying.");

if (!existsSync(STANDALONE)) {
  fail(
    'No .next/standalone directory.\n    Check that next.config.ts still has output: "standalone".',
  );
}

// ---------------------------------------------------------------- assemble

step("Assembling ./deploy");
await fs.rm(OUT, { recursive: true, force: true });
await fs.cp(STANDALONE, OUT, { recursive: true });

// The two things standalone leaves behind on purpose.
await fs.cp(path.join(ROOT, ".next", "static"), path.join(OUT, ".next", "static"), {
  recursive: true,
});
await fs.cp(path.join(ROOT, "public"), path.join(OUT, "public"), {
  recursive: true,
});

// Sanity check: the server is useless without these.
for (const required of ["server.js", ".next/static", "public/images/gallery"]) {
  if (!existsSync(path.join(OUT, required))) {
    fail(`Assembled output is missing ${required}`);
  }
}

/**
 * sharp resizes every photograph on demand. If it cannot load, Next does not
 * error - it quietly serves the original file instead, so the site looks fine
 * while shipping 360KB where it should ship 40KB. The only way to be sure is
 * to actually require it out of the assembled bundle.
 */
const sharpCheck = spawnSync(
  process.execPath,
  ["-e", "require('sharp'); console.log(require('sharp').versions.sharp)"],
  { cwd: OUT, encoding: "utf8" },
);
if (sharpCheck.status !== 0) {
  fail(
    "sharp cannot load from the assembled bundle, so images would be served\n" +
      "    unoptimised. Check outputFileTracingIncludes in next.config.ts.\n" +
      `    ${String(sharpCheck.stderr).trim().split("\n")[0]}`,
  );
}
console.log(`    sharp ${sharpCheck.stdout.trim()} loads correctly`);

// ---------------------------------------------------------------- native deps

/**
 * sharp ships a compiled binary per platform, and npm only ever installs the
 * one for the machine doing the installing. Build on Windows or a Mac, upload
 * to a Linux server, and every optimised image returns a 500 - the JavaScript
 * is fine, the native library underneath is for the wrong OS.
 *
 * So fetch the target platform's binaries and put them in the bundle
 * alongside the local ones. sharp picks the right one at runtime.
 */
const argv = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
const targetOs = argOf("os", "linux");
const targetCpu = argOf("arch", "x64");
const targetLibc = argOf("libc", "glibc"); // musl for Alpine-based images

if (!argv.includes("--no-native")) {
  step(`Adding ${targetOs}-${targetCpu} (${targetLibc}) binaries for sharp`);

  const sharpVersion = JSON.parse(
    await fs.readFile(path.join(ROOT, "package.json"), "utf8"),
  ).dependencies.sharp;

  const tmp = path.join(ROOT, ".sharp-target");
  await fs.rm(tmp, { recursive: true, force: true });
  await fs.mkdir(tmp, { recursive: true });
  await fs.writeFile(
    path.join(tmp, "package.json"),
    JSON.stringify({ name: "sharp-target", version: "1.0.0" }),
  );

  const res = spawnSync(
    "npm",
    [
      "install", "--no-audit", "--no-fund", "--no-save",
      `--os=${targetOs}`, `--cpu=${targetCpu}`, `--libc=${targetLibc}`,
      `sharp@${sharpVersion}`,
    ],
    { cwd: tmp, stdio: "pipe", shell: process.platform === "win32" },
  );
  if (res.status !== 0) {
    fail(
      `Could not fetch ${targetOs}-${targetCpu} binaries for sharp.\n` +
        `    ${String(res.stderr).trim().split("\n").slice(-3).join("\n    ")}`,
    );
  }

  const from = path.join(tmp, "node_modules", "@img");
  const to = path.join(OUT, "node_modules", "@img");
  const wanted = (await fs.readdir(from)).filter((n) => n.includes(targetOs));
  if (!wanted.length) fail(`npm fetched no ${targetOs} binaries for sharp.`);

  for (const pkg of wanted) {
    await fs.cp(path.join(from, pkg), path.join(to, pkg), { recursive: true });
    console.log(`    + @img/${pkg}`);
  }
  await fs.rm(tmp, { recursive: true, force: true });
}

// ---------------------------------------------------------------- start script

const startSh = `#!/bin/sh
# Pterodactyl (and most panels) hand the container a port and bind address.
# Fall back to sensible defaults when running this anywhere else.
export HOSTNAME="\${SERVER_IP:-0.0.0.0}"
export PORT="\${SERVER_PORT:-3000}"
export NODE_ENV=production

echo "Starting on \$HOSTNAME:\$PORT"
exec node server.js
`;
await fs.writeFile(path.join(OUT, "start.sh"), startSh, { mode: 0o755 });

// ---------------------------------------------------------------- summary

const size = await dirSize(OUT);
const photos = await dirSize(path.join(OUT, "public", "images"));

console.log(`
  Ready: ./deploy  (${mb(size)}, of which ${mb(photos)} is photographs)

  To run it anywhere:
      cd deploy && PORT=3000 node server.js

  On a panel that sets SERVER_PORT / SERVER_IP:
      ./start.sh

  No npm install is needed on the server - node_modules is already inside.
`);
