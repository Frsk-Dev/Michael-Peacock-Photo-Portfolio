import type { Metadata } from "next";
import EventCard from "@/components/EventCard";
import { eventAlbums } from "@/data/events";
import { photos } from "@/data/photos";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Drift events, shows and meets covered by Michael Peacock, album by album.",
};

export default function EventsPage() {
  return (
    <section className="shell pb-24 pt-32 md:pt-40">
      <header className="max-w-3xl">
        <p className="eyebrow">Albums</p>
        <h1 className="display mt-5 text-5xl text-bone sm:text-6xl md:text-7xl">
          Events
        </h1>
        <p className="mt-6 text-base leading-relaxed text-muted md:text-lg">
          Every show and drift day, kept as its own album. {photos.length}{" "}
          photographs across {eventAlbums.length}{" "}
          {eventAlbums.length === 1 ? "event" : "events"} — or see them all
          together in the{" "}
          <a href="/work" className="link-wipe text-bone">
            portfolio
          </a>
          .
        </p>
      </header>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 md:gap-6">
        {eventAlbums.map((album, i) => (
          <EventCard key={album.slug} album={album} priority={i < 2} />
        ))}
      </div>
    </section>
  );
}
