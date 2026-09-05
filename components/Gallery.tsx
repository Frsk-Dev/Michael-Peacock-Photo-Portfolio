"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  activeCategories,
  photoLabel,
  type Category,
  type Photo,
} from "@/data/photos";
import Lightbox from "./Lightbox";

type Filter = Category | "all";

interface Props {
  photos: Photo[];
  /**
   * Which filters to offer. Defaults to every category that has photos
   * site-wide; an event album passes just the ones in that album.
   */
  categories?: { id: Category; label: string }[];
}

export default function Gallery({ photos, categories }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () =>
      filter === "all" ? photos : photos.filter((p) => p.category === filter),
    [photos, filter],
  );

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([["all", photos.length]]);
    for (const p of photos) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return map;
  }, [photos]);

  const changeFilter = useCallback(
    (next: Filter) => {
      if (next === filter) return;
      setLightboxIndex(null);
      setFilter(next);

      // Without this you stay wherever you were scrolled to while the grid
      // swaps underneath you, which reads as "the filter did nothing".
      requestAnimationFrame(() => {
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [filter],
  );

  // Deep-link support: /work#drift opens that filter.
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Filter;
    if (hash && (hash === "all" || activeCategories.some((c) => c.id === hash)))
      setFilter(hash);
  }, []);

  const available = categories ?? activeCategories;
  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    ...available,
  ];

  // One category is not a choice, so do not show a filter bar for it.
  const showFilters = available.length > 1;

  return (
    <>
      {/* Scroll anchor. The margin clears the fixed header. */}
      <div ref={topRef} className="scroll-mt-32" aria-hidden />

      {/* Filter bar - deliberately not sticky, so it stays put as you scroll */}
      <div
        className="mb-10 border-y border-line/70"
        hidden={!showFilters}
      >
        <div
          role="tablist"
          aria-label="Filter photographs by discipline"
          className="flex snap-x gap-1 overflow-x-auto py-3 md:gap-2 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {filters.map((f) => {
            const selected = filter === f.id;
            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={selected}
                onClick={() => changeFilter(f.id)}
                className={`group flex shrink-0 snap-start items-center gap-2 whitespace-nowrap border px-4 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 ${
                  selected
                    ? "border-accent bg-accent text-white"
                    : "border-line text-muted hover:border-muted-2 hover:text-bone"
                }`}
              >
                {f.label}
                <span
                  className={`text-[10px] tabular-nums ${
                    selected ? "text-white/70" : "text-muted-2"
                  }`}
                >
                  {counts.get(f.id) ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result count, so a filter always gives visible feedback */}
      <p
        className="mb-6 text-xs uppercase tracking-[0.16em] text-muted-2"
        hidden={!showFilters}
      >
        Showing {visible.length}{" "}
        {visible.length === 1 ? "photograph" : "photographs"}
        {filter !== "all" && (
          <>
            {" in "}
            <span className="text-muted">
              {filters.find((f) => f.id === filter)?.label}
            </span>
          </>
        )}
      </p>

      {/* Masonry grid - CSS columns keeps every frame at its true aspect ratio */}
      {visible.length ? (
        <div className="columns-1 gap-4 sm:columns-2 md:gap-5 xl:columns-3">
          {visible.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIndex(i)}
              aria-label={`Open ${photoLabel(photo)} full screen`}
              className="group relative mb-4 block w-full cursor-zoom-in break-inside-avoid overflow-hidden bg-surface md:mb-5"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                placeholder={photo.blurDataURL ? "blur" : "empty"}
                blurDataURL={photo.blurDataURL}
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                loading={i < 6 ? "eager" : "lazy"}
                priority={i < 3}
                className="w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              />

              {/* Hover caption */}
              <span className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/90 via-ink/10 to-transparent p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="translate-y-2 transition-transform duration-500 group-hover:translate-y-0 group-focus-visible:translate-y-0">
                  <span className="block font-display text-base font-bold uppercase tracking-tight text-bone">
                    {photoLabel(photo)}
                  </span>
                  {photo.location && (
                    <span className="mt-1 block text-xs text-muted">
                      {photo.location}
                    </span>
                  )}
                </span>
              </span>

              {/* Expand hint, so it is obvious the frame opens */}
              <span
                aria-hidden
                className="pointer-events-none absolute right-4 top-4 grid h-9 w-9 place-items-center border border-bone/30 bg-ink/60 text-bone opacity-0 backdrop-blur transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M5.5 1H1v4.5M8.5 1H13v4.5M13 8.5V13H8.5M1 8.5V13h4.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                </svg>
              </span>

              {/* Corner accent rule */}
              <span className="pointer-events-none absolute left-0 top-0 h-[2px] w-0 bg-accent transition-[width] duration-700 ease-out group-hover:w-full" />
            </button>
          ))}
        </div>
      ) : (
        <p className="py-24 text-center text-muted">
          No photographs in this category yet.
        </p>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={visible}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </>
  );
}
