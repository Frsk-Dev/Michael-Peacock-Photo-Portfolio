import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
