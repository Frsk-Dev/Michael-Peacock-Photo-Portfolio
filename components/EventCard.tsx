import Image from "next/image";
import Link from "next/link";
import { formatEventDate, type EventAlbum } from "@/data/events";

/**
 * Thumbnail for one show. Used on the home page and the events index.
 */
export default function EventCard({
  album,
  priority = false,
}: {
  album: EventAlbum;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/events/${album.slug}`}
      className="group relative block overflow-hidden bg-surface"
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden">
        <Image
          src={album.cover.src}
          alt={album.cover.alt}
          fill
          placeholder={album.cover.blurDataURL ? "blur" : "empty"}
          blurDataURL={album.cover.blurDataURL}
          sizes="(max-width: 640px) 100vw, 50vw"
          priority={priority}
          className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-transparent transition-opacity duration-500 group-hover:opacity-95"
        />
      </div>

      {/* Accent rule wipes across on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-[2px] w-0 bg-accent transition-[width] duration-700 ease-out group-hover:w-full"
      />

      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
        <p className="eyebrow text-accent">{formatEventDate(album)}</p>

        <h3 className="display mt-3 text-2xl text-bone sm:text-3xl">
          {album.name}
        </h3>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="tabular-nums">
            {album.count} {album.count === 1 ? "photograph" : "photographs"}
          </span>
          {album.drivers.length > 0 && (
            <span className="tabular-nums">
              {album.drivers.length} drivers
            </span>
          )}
          {album.location && <span>{album.location}</span>}
        </div>

        <span className="mt-5 inline-flex items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-bone">
          View album
          <span
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </span>
      </div>
    </Link>
  );
}
