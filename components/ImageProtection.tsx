"use client";

import { useEffect } from "react";

/**
 * Discourages casual saving of the photographs.
 *
 * Be clear about what this is worth: it stops someone idly right-clicking a
 * photo. It stops nothing else. A screenshot, the browser's developer tools,
 * "Save page as", or simply opening the image URL all bypass it in seconds.
 * The watermark is the real deterrent; this only removes the most convenient
 * route.
 *
 * Scoped to images on purpose. Blocking the context menu across the whole
 * page would take away "open link in new tab", copying a link, and the
 * right-click menus screen readers and translation tools rely on - all real
 * cost to real visitors, for no extra protection.
 */
export default function ImageProtection() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === "IMG") e.preventDefault();
    };

    // Stops dragging a photo straight onto the desktop.
    const onDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === "IMG") e.preventDefault();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  return null;
}
