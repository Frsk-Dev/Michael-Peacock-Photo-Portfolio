import Image from "next/image";
import Link from "next/link";
import { site } from "@/data/site";
import { featuredPhotos, photos } from "@/data/photos";
import FeaturedGrid from "@/components/FeaturedGrid";
import EventCard from "@/components/EventCard";
import { eventAlbums } from "@/data/events";

export default function HomePage() {
  const hero = featuredPhotos[0] ?? photos[0];
  const grid = (featuredPhotos.length ? featuredPhotos : photos).slice(1, 7);

  // Albums are already sorted newest first, by EXIF capture date.
  const latestEvent = eventAlbums[0]?.name ?? "—";

  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden">
        {hero && (
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            priority
            placeholder={hero.blurDataURL ? "blur" : "empty"}
            blurDataURL={hero.blurDataURL}
            sizes="100vw"
            className="object-cover"
          />
        )}
        {/* Two-stop scrim: keeps type legible without flattening the photo. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-transparent"
        />

        <div className="shell relative z-10 w-full pb-16 pt-32 md:pb-24">
          <p className="eyebrow animate-fade">{site.tagline}</p>

          <h1 className="display mt-6 text-[clamp(2.75rem,11vw,8.5rem)] text-bone">
            {site.heroLines.map((line, i) => (
              <span key={line} className="block overflow-hidden">
                <span
                  className="block animate-reveal opacity-0"
                  style={{ animationDelay: `${120 + i * 110}ms` }}
                >
                  {i === site.heroLines.length - 1 ? (
                    <>
                      {line.replace(/\.$/, "")}
                      <span className="text-accent">.</span>
                    </>
                  ) : (
                    line
                  )}
                </span>
              </span>
            ))}
          </h1>

          <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p
              className="max-w-lg animate-reveal text-base leading-relaxed text-muted opacity-0 md:text-lg"
              style={{ animationDelay: "420ms" }}
            >
              {site.heroIntro}
            </p>

            <div
              className="flex animate-reveal flex-wrap gap-3 opacity-0"
              style={{ animationDelay: "520ms" }}
            >
              <Link
                href="/work"
                className="group flex items-center gap-3 bg-bone px-7 py-4 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-ink transition-colors duration-300 hover:bg-accent hover:text-white"
              >
                View the work
                <span
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </Link>
              <Link
                href="/contact"
                className="border border-line px-7 py-4 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-bone transition-colors duration-300 hover:border-bone"
              >
                Enquire
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          aria-hidden
          className="absolute bottom-6 right-5 z-10 hidden items-center gap-3 md:flex md:right-10"
        >
          <span className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-2">
            Scroll
          </span>
          <span className="block h-12 w-px overflow-hidden bg-line">
            <span className="block h-4 w-px animate-[reveal_1.8s_ease-in-out_infinite] bg-accent" />
          </span>
        </div>
      </section>

      {/* ------------------------------------------------------ Statement */}
      <section className="border-b border-line bg-ink-2">
        <div className="shell grid gap-10 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-4">
            <p className="eyebrow reveal">The approach</p>
          </div>
          <div className="md:col-span-8">
            <p className="display reveal text-2xl leading-[1.15] text-bone sm:text-3xl md:text-[2.6rem]">
              A car at full lock gives you one frame, and it is gone. I shoot
              for the one that carries the <span className="text-accent">smoke,
              the light and the noise</span> — and holds up printed a metre wide.
            </p>

            <dl className="reveal mt-14 grid grid-cols-2 gap-8 sm:grid-cols-3">
              {[
                { n: `${photos.length}`, l: "Frames in the gallery" },
                { n: `${eventAlbums.length}`, l: "Events covered" },
                { n: latestEvent, l: "Most recent shoot" },
              ].map((s) => (
                <div key={s.l} className="border-t border-line pt-4">
                  <dt className="font-display text-2xl font-bold tracking-tight text-bone md:text-3xl">
                    {s.n}
                  </dt>
                  <dd className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-2">
                    {s.l}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Featured */}
      <section className="shell py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow reveal">Selected work</p>
            <h2 className="display reveal mt-4 text-4xl text-bone sm:text-5xl md:text-6xl">
              Recent frames
            </h2>
          </div>
          <Link
            href="/work"
            className="link-wipe reveal font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted transition-colors hover:text-bone"
          >
            All photographs &rarr;
          </Link>
        </div>

        <FeaturedGrid photos={grid} />
      </section>

      {/* --------------------------------------------------------- Events */}
      <section className="border-t border-line bg-ink-2">
        <div className="shell py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow reveal">Albums</p>
              <h2 className="display reveal mt-4 text-4xl text-bone sm:text-5xl md:text-6xl">
                Events
              </h2>
              <p className="reveal mt-5 max-w-md text-sm leading-relaxed text-muted">
                Each show kept as its own album. Pick one to see the full set.
              </p>
            </div>
            {eventAlbums.length > 4 && (
              <Link
                href="/events"
                className="link-wipe reveal font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted transition-colors hover:text-bone"
              >
                All events &rarr;
              </Link>
            )}
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 md:gap-6">
            {eventAlbums.slice(0, 4).map((album, i) => (
              <div key={album.slug} className="reveal" data-reveal-delay={i * 80}>
                <EventCard album={album} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Services */}
      <section className="border-t border-line bg-ink-2">
        <div className="shell py-20 md:py-28">
          <p className="eyebrow reveal">What I do</p>
          <div className="mt-12 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
            {site.services.map((s, i) => (
              <div
                key={s.title}
                className="reveal group bg-ink-2 p-8 transition-colors duration-500 hover:bg-surface md:p-10"
                data-reveal-delay={i * 90}
              >
                <span className="font-display text-xs tabular-nums text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 font-display text-xl font-bold uppercase tracking-tight text-bone">
                  {s.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
