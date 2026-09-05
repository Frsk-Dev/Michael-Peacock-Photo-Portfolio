import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import {
  eventAlbums,
  formatEventDate,
  getEventAlbum,
} from "@/data/events";
import { site } from "@/data/site";

type Params = { params: Promise<{ slug: string }> };

/** Every album is known at build time, so all of them prerender. */
export function generateStaticParams() {
  return eventAlbums.map((album) => ({ slug: album.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const album = getEventAlbum(slug);
  if (!album) return { title: "Event not found" };

  return {
    title: album.name,
    description: `${album.count} photographs from ${album.name} by ${site.name}.`,
    openGraph: {
      title: `${album.name} — ${site.name}`,
      description: `${album.count} photographs from ${album.name}.`,
      images: [{ url: album.cover.src }],
    },
  };
}

export default async function EventPage({ params }: Params) {
  const { slug } = await params;
  const album = getEventAlbum(slug);
  if (!album) notFound();

  const others = eventAlbums.filter((a) => a.slug !== album.slug);

  return (
    <section className="shell pb-24 pt-32 md:pt-40">
      <Link
        href="/events"
        className="link-wipe font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted transition-colors hover:text-bone"
      >
        &larr; All events
      </Link>

      <header className="mt-8 max-w-4xl">
        <p className="eyebrow text-accent">{formatEventDate(album)}</p>
        <h1 className="display mt-5 text-5xl text-bone sm:text-6xl md:text-7xl">
          {album.name}
        </h1>

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
          <span className="tabular-nums">
            {album.count} photographs
          </span>
          {album.categories.length > 1 && (
            <span>
              {album.categories.map((c) => `${c.label} ${c.count}`).join(" · ")}
            </span>
          )}
          {album.location && <span>{album.location}</span>}
        </div>
      </header>

      {/* Drivers and teams shot at this event */}
      {album.drivers.length > 0 && (
        <div className="mt-12 border-t border-line pt-6">
          <p className="eyebrow">Drivers &amp; teams</p>
          <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
            {album.drivers.map((driver) => (
              <li
                key={driver}
                className="border border-line px-3 py-1.5 text-xs text-muted"
              >
                {driver}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-14">
        <Gallery photos={album.photos} categories={album.categories} />
      </div>

      {/* Next event */}
      {others.length > 0 && (
        <div className="mt-24 border-t border-line pt-10">
          <p className="eyebrow">More events</p>
          <ul className="mt-6 space-y-3">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/events/${other.slug}`}
                  className="group flex flex-wrap items-baseline justify-between gap-3 border-b border-line/60 py-4 transition-colors hover:border-accent"
                >
                  <span className="display text-2xl text-bone transition-colors group-hover:text-accent sm:text-3xl">
                    {other.name}
                  </span>
                  <span className="text-xs uppercase tracking-[0.16em] text-muted-2">
                    {formatEventDate(other)} · {other.count} photographs
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
