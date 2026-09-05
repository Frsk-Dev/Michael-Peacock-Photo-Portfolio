"use client";

import Image from "next/image";
import { useState } from "react";
import { photoLabel, type Photo } from "@/data/photos";
import Lightbox from "./Lightbox";

/**
 * The home page "Recent frames" grid.
 *
 * Same behaviour as the Work gallery: clicking a frame opens it full screen
 * rather than navigating away, so a photo always enlarges wherever you click it.
 */
export default function FeaturedGrid({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <>
      <div className="mt-12 grid grid-cols-2 gap-2.5 sm:gap-4 md:gap-5 lg:grid-cols-3">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Open ${photoLabel(photo)} full screen`}
            className="group reveal relative block cursor-zoom-in overflow-hidden bg-surface text-left"
            data-reveal-delay={i * 70}
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                placeholder={photo.blurDataURL ? "blur" : "empty"}
                blurDataURL={photo.blurDataURL}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100"
              />
            </div>

            {/* Expand hint */}
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

            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5">
              <p className="font-display text-[9px] uppercase tracking-[0.2em] text-accent sm:text-[10px] sm:tracking-[0.24em]">
                {photo.category.replace("-", " ")}
              </p>
              <h3 className="mt-1.5 font-display text-xs font-bold uppercase leading-tight tracking-tight text-bone sm:mt-2 sm:text-lg">
                {photoLabel(photo)}
              </h3>
              {photo.location && (
                <p className="mt-1 text-xs text-muted">{photo.location}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {index !== null && (
        <Lightbox
          photos={photos}
          index={index}
          onClose={() => setIndex(null)}
          onIndexChange={setIndex}
        />
      )}
    </>
  );
}
