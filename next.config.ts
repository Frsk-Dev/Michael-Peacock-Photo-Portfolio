import path from "node:path";
import os from "node:os";
import type { NextConfig } from "next";

/**
 * Every LAN address this machine currently has.
 *
 * In development Next blocks cross-origin requests to its own dev-only
 * assets, and "cross-origin" includes reaching the server on your LAN IP
 * instead of localhost. When that happens the HMR client fails its
 * handshake, the dev runtime never finishes booting, and the page renders
 * but is completely dead - filters do nothing, photos do not open.
 *
 * Collecting the addresses here rather than hard-coding one means this keeps
 * working when your router hands out a different IP.
 */
function localNetworkOrigins(): string[] {
  const origins = new Set<string>([os.hostname(), `${os.hostname()}.local`]);
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const net of iface ?? []) {
      if (net.family === "IPv4" && !net.internal) origins.add(net.address);
    }
  }
  return [...origins];
}

const nextConfig: NextConfig = {
  /**
   * Emits a self-contained server at .next/standalone with only the
   * node_modules it actually needs. That is what gets deployed - it keeps the
   * upload small and means the server does not need a full npm install to run.
   */
  output: "standalone",

  /**
   * Next traces which files the server needs and copies only those. It cannot
   * follow sharp, because sharp resolves its native binary at runtime rather
   * than through a static import - tracing ships its package.json and nothing
   * else. Next then fails to load it and quietly serves unoptimised originals,
   * so the site still works but every photo is ten times the size it should
   * be. Naming it here makes sure the whole package comes along.
   */
  outputFileTracingIncludes: {
    "/**": ["./node_modules/sharp/**/*", "./node_modules/@img/**/*"],
  },

  // Lets you open the dev site from your phone or another machine on the
  // network. Development only - it has no effect on a production build.
  allowedDevOrigins: localNetworkOrigins(),

  // Pin the workspace root. Without this, Turbopack walks up looking for a
  // lockfile and finds the one in the home directory.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  images: {
    // Photos are served from /public, so no remote patterns are needed.
    // AVIF first, WebP fallback - a big win on image-heavy pages.
    formats: ["image/avif", "image/webp"],
    // Capped at 2560 to match the longest edge the importer writes. Going
    // higher makes Next generate a pointless upscale of a 2560px source,
    // which is slow to produce and no sharper.
    deviceSizes: [640, 828, 1080, 1200, 1600, 2048, 2560],
    imageSizes: [96, 128, 256, 384],
  },
};

export default nextConfig;
