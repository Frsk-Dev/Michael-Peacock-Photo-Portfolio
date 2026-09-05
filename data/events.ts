import { photos, categories, type Category, type Photo } from "./photos";

/**
 * Events (shows) are derived from the photo manifest - every distinct `event`
 * value becomes an album. Import a new shoot with `--event "Name"` and its
 * album page, home page card and route all appear on their own.
 *
 * Ordering is by the newest photo in each event, taken from EXIF, so the most
 * recent show is always first without anyone maintaining a list.
 */

export interface EventAlbum {
  /** URL segment, e.g. "adamlz-world-tour-2026". */
  slug: string;
  /** Display name, exactly as stored on the photos. */
  name: string;
  photos: Photo[];
  count: number;
  /** Newest capture date in the album, ISO yyyy-mm-dd. */
  date?: string;
  year?: number;
  location?: string;
  /** The frame used as the album thumbnail. */
  cover: Photo;
  /** Categories present in this album, in site order, with counts. */
  categories: { id: Category; label: string; count: number }[];
  /** Drivers and teams shot at this event, alphabetical. */
  drivers: string[];
}

/** Optional per-event copy. Everything is optional; omit what you do not need. */
export const eventDetails: Record<
  string,
  { blurb?: string; location?: string; coverId?: string }
> = {
  "adamlz-world-tour-2026": {
    blurb:
      "Adam LZ's World Tour landing in the UK, with a full field of drivers running tandem all afternoon.",
  },
  "gravity-2026": {
    blurb:
      "A weekend of drifting outside and a hall full of show cars inside.",
  },
};

export const slugifyEvent = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function buildAlbums(): EventAlbum[] {
  const grouped = new Map<string, Photo[]>();

  for (const photo of photos) {
    if (!photo.event) continue;
    const list = grouped.get(photo.event);
    if (list) list.push(photo);
    else grouped.set(photo.event, [photo]);
  }

  const albums: EventAlbum[] = [];

  for (const [name, list] of grouped) {
    const slug = slugifyEvent(name);
    const detail = eventDetails[slug] ?? {};

    // Newest frame in the album decides where the event sorts.
    const dates = list.map((p) => p.date).filter(Boolean) as string[];
    const date = dates.length ? dates.sort().at(-1) : undefined;

    // Album cards are 3:2, so a landscape frame survives the crop; a portrait
    // one gets sliced through the middle. Landscape wins unless you have named
    // a cover yourself.
    const landscape = (p: Photo) => p.width > p.height;
    const cover =
      (detail.coverId && list.find((p) => p.id === detail.coverId)) ||
      list.find((p) => p.featured && landscape(p)) ||
      list.find(landscape) ||
      list.find((p) => p.featured) ||
      list[0];

    const present = new Set(list.map((p) => p.category));

    albums.push({
      slug,
      name,
      photos: list,
      count: list.length,
      date,
      year: list.find((p) => p.year)?.year,
      location: detail.location ?? list.find((p) => p.location)?.location,
      cover,
      categories: categories
        .filter((c) => present.has(c.id))
        .map((c) => ({
          ...c,
          count: list.filter((p) => p.category === c.id).length,
        })),
      drivers: [
        ...new Set(list.map((p) => p.driver).filter(Boolean) as string[]),
      ].sort((a, b) => a.localeCompare(b)),
    });
  }

  // Newest first. Events with no date fall to the bottom.
  return albums.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export const eventAlbums = buildAlbums();

export const getEventAlbum = (slug: string) =>
  eventAlbums.find((e) => e.slug === slug);

/** Human date for an album, e.g. "4 September 2026". */
export function formatEventDate(album: EventAlbum) {
  if (!album.date) return album.year ? String(album.year) : "";
  const [y, m, d] = album.date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
