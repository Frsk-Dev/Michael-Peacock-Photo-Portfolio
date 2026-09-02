"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { activeCategories, type Category, type Photo } from "@/data/photos";
import Lightbox from "./Lightbox";

type Filter = Category | "all";

interface Props {
  photos: Photo[];
}

export default function Gallery({ photos }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  // Changing the filter changes what "next" means, so close the viewer.
  const changeFilter = useCallback((next: Filter) => {
    setLightboxIndex(null);
    setFilter(next);
  }, []);

  // Deep-link support: /work#circuit opens that filter.
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Filter;
    if (hash && (hash === "all" || activeCategories.some((c) => c.id === hash)))
      setFilter(hash);
  }, []);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    ...activeCategories,
  ];

  return (
    <>
      {/* Filter bar */}
      <div className="sticky top-[72px] z-30 -mx-5 mb-10 border-y border-line/70 bg-ink/85 px-5 backdrop-blur-xl md:top-20 md:mx-0 md:px-0">
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

      {/* Masonry grid - CSS columns keeps every frame at its true aspect ratio */}
      {visible.length ? (
        <div className="columns-1 gap-4 sm:columns-2 md:gap-5 xl:columns-3">
          {visible.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIndex(i)}
              aria-label={`Open ${photo.title}`}
              className="group relative mb-4 block w-full break-inside-avoid overflow-hidden bg-surface md:mb-5"
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
                    {photo.title}
                  </span>
                  {(photo.location || photo.year) && (
                    <span className="mt-1 block text-xs text-muted">
                      {[photo.location, photo.year].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </span>
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
