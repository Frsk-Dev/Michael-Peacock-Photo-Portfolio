"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Scroll-reveal driver.
 *
 * Adds `reveal-ready` to <html> only once JS is running, so if scripts fail
 * or are disabled the content is simply visible rather than stuck at
 * opacity 0. Elements marked `.reveal` fade up as they enter the viewport.
 *
 * Re-runs on navigation so client-side route changes pick up new nodes.
 */
export default function RevealProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      root.classList.remove("reveal-ready");
      return;
    }

    root.classList.add("reveal-ready");

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)"),
    );
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          // Stagger siblings slightly for a more considered feel.
          const delay = Number(el.dataset.revealDelay ?? 0);
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
