# Michael Peacock — Motorsport Photography

A portfolio site built with Next.js 16, React 19 and Tailwind CSS 4.

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
```

---

## Adding a new event

One command. The album page, the home page card, the `/events` entry and the
route all appear on their own.

```bash
npm run import-photos -- --from "D:/photos/ThroughMyLens/YourEvent/Drift" --category drift --event "Your Event 2026"
```

That copies the images in, **resizes them to 2560px on the long edge** (24MP
originals are ~15MB each; web copies land around 350KB and your originals are
never touched), reads EXIF for the camera settings and the capture date, builds
the blurred preview that fades in while the full photo loads, and updates
`data/photos.json`.

**Events are derived from the `event` field** — there is no separate list to
maintain. They sort newest-first by the EXIF capture date of their newest
photo, so a new shoot goes straight to the top.

### Driver and team names

If your source folder is split into sub-folders, each sub-folder name is
recorded as that photo's `driver`:

```
lzworldTOUR/Drift/
  Adam LZ/         -> driver: "Adam LZ"
  James Deane/     -> driver: "James Deane"
  Driftworks/      -> driver: "Driftworks"
  LZWorldTour-63.jpg   (loose files get no driver)
```

Capitalisation is tidied (`adam lz` becomes `Adam LZ`) but **spelling is left
exactly as you typed it**. Those names drive the "Drivers & teams" list on the
album page and the alt text. Fix any you do not like in `data/photos.json`;
re-runs keep your version.

Categories: `drift`, `show`, `detail`, plus `circuit`, `rally`, `endurance`,
`pit-lane`, `portrait` ready for future work — **a filter only appears once it
has photos**, and an album with a single category shows no filter bar at all.

Useful flags:

| Flag | What it does |
| --- | --- |
| `--from <dir>` | Copy images in from this folder |
| `--category <id>` | Category for the imported set |
| `--event "Name"` | Event name — this is what creates the album |
| `--location "Place"` | Optional location, shown on the album |
| `--max-edge 2560` | Longest edge of the web copies |
| `--quality 82` | JPEG quality of the web copies |
| `--no-resize` | Copy originals through untouched |
| `--force` | Reset all metadata to the derived defaults |

Running it with no flags rescans `public/images/gallery/` and rebuilds the
manifest. **It never overwrites your edits**, and never reorders the file.

### How the pages relate

- **`/work`** — every photograph from every event together, filtered by
  discipline. 
- **`/events`** — one card per show.
- **`/events/<slug>`** — that show only, with its own filters and lightbox.
- **Home** — hero, a selected-frames grid, then the event cards.

### Naming frames

Photos are labelled with their **event name**. Nothing is generated from
filenames, so you never get "Gravity 2026 15" as a caption.

A typical entry in `data/photos.json`:

```json
{
  "id": "lzworldtour-61",
  "src": "/images/gallery/drift/LZWorldTour-61.jpg",
  "width": 2560,
  "height": 1484,
  "alt": "Axle Turbo drifting at AdamLZ World Tour 2026",
  "category": "drift",
  "event": "AdamLZ World Tour 2026",
  "driver": "Axle Turbo",
  "date": "2026-09-04",
  "year": 2026,
  "featured": true,
  "settings": "150mm · f/8 · 1/200s · ISO 400",
  "blurDataURL": "data:image/jpeg;base64,..."
}
```

- `event` — what appears on the tile and in the viewer, and which album it joins
- `date` — from EXIF; orders the events
- `driver` — from the source sub-folder; listed on the album page
- `title` — **optional**. Leave it out and the frame shows its event name.
- `featured: true` — puts it on the home page. **The first featured photo in
  the file is the hero image**, which is why the importer never reorders the
  manifest.
- `settings` — read from EXIF and kept, but **not displayed**. To show it
  again, add it back to the caption block in `components/Lightbox.tsx`.
- `id`, `src`, `width`, `height`, `blurDataURL` — leave these to the importer

Per-event copy (a blurb, a location, a hand-picked cover) goes in
`data/events.ts` under `eventDetails`.

## Changing the words

Everything else lives in **`data/site.ts`** — your name, the hero headline,
bio, gear list, services, email and social links. Edit that one file; no
component changes needed.

Your portrait for the About page goes at `public/images/portrait.jpg`.

---

## Making the contact form send email

Out of the box the form validates properly but reports that email is not
connected, and offers your address as a direct mailto link — so nothing is
lost. To make it actually send, create `.env.local`:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_TO=michaelpeacock1993@gmail.com
CONTACT_FROM=site@yourdomain.com
```

Sign up at [resend.com](https://resend.com) (free tier is plenty), verify a
domain, and use an address on that domain as `CONTACT_FROM`. No extra packages
needed — the route calls the REST API directly.

The route already has honeypot spam filtering and a rate limit of 5 messages
per IP per 10 minutes.

---

## Going live

Push to GitHub, then import the repo at [vercel.com](https://vercel.com) —
it detects Next.js and needs no configuration. Add the `RESEND_*` environment
variables in the Vercel dashboard if you are using the contact form.

Then point your domain at it and set `url` in `data/site.ts` to match, so the
social share previews use the right address.

---

## Layout

```
app/
  layout.tsx          fonts, metadata, header/footer, structured data
  page.tsx            home — hero, statement, featured grid, events, services
  events/page.tsx     one card per show
  events/[slug]/      a single event album
  work/page.tsx       the portfolio
  about/page.tsx      bio, facts, gear
  contact/page.tsx    form and details
  api/contact/        form handler
  globals.css         design tokens and shared styles
components/
  SiteHeader          nav, mobile menu
  EventCard           album thumbnail
  SiteFooter
  Gallery             filtering and the masonry grid
  Lightbox            full-screen viewer
  ContactForm
  RevealProvider      scroll-in animations
data/
  site.ts             all site copy and config
  events.ts           albums derived from the photo manifest
  photos.json         the photo manifest (generated, hand-editable)
  photos.ts           types, categories and helpers
scripts/
  import-photos.mjs   the importer
  make-placeholders.mjs   only needed if you ever want the demo images back
```

### Design notes

The interface is deliberately near-monochrome — dark greys, one red accent
used sparingly for active states and emphasis. Photographs are the only real
colour on the page, which keeps them from competing with the furniture.
Change the palette in the `@theme` block at the top of `app/globals.css`.

The gallery uses CSS columns for masonry, so every frame keeps its true aspect
ratio rather than being cropped to a grid.
