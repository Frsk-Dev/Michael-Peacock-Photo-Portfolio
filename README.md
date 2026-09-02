# Michael Peacock — Motorsport Photography

A portfolio site built with Next.js 16, React 19 and Tailwind CSS 4.

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
```

---

## Adding your photographs

This is the part you will use most. The current gallery holds 83 frames from
Gravity 2026, imported from `D:/photos/ThroughMyLens/Gravity 2026/Keep/`.

### The one command

```bash
npm run import-photos -- --from "D:/path/to/your/photos" --category drift --event "Event Name 2026"
```

That copies the images in, **resizes them to 2560px on the long edge** (your
24MP originals are ~15MB each; the web copies come out around 400KB and your
originals are never touched), reads the EXIF for the camera settings line,
generates the blurred preview that fades in while the full photo loads, and
updates `data/photos.json`.

Categories: `drift`, `show`, `detail`, and `circuit`, `rally`, `endurance`,
`pit-lane`, `portrait` are defined ready for future work — **a filter only
appears on the site once it has photos in it**, so the unused ones stay hidden.

Useful flags:

| Flag | What it does |
| --- | --- |
| `--from <dir>` | Copy images in from this folder |
| `--category <id>` | Category for the imported set (also picks the sub-folder) |
| `--event "Name"` | Stamp an event name on the new photos |
| `--location "Place"` | Stamp a location on the new photos |
| `--max-edge 2560` | Longest edge of the web copies |
| `--quality 82` | JPEG quality of the web copies |
| `--no-resize` | Copy originals through untouched |
| `--force` | Reset all metadata to the derived defaults |

Running it with no flags just rescans `public/images/gallery/` and rebuilds
the manifest.

**It never overwrites your edits.** Once you have written a title or caption
for a photo, re-running the importer keeps it.

### Then tidy the titles

Open `data/photos.json` and edit. A full entry looks like:

```json
{
  "id": "gravity-2026-26",
  "src": "/images/gallery/drift/Gravity.2026-26.jpg",
  "width": 2560,
  "height": 1368,
  "alt": "A drift car laying down heavy smoke in front of a packed crowd, Gravity 2026",
  "title": "Crowd Pleaser",
  "category": "drift",
  "event": "Gravity 2026",
  "location": "",
  "year": 2026,
  "featured": true,
  "settings": "174mm · f/7.1 · 1/2000s · ISO 1250",
  "blurDataURL": "data:image/jpeg;base64,..."
}
```

- `title` — shown on grid hover and in the lightbox
- `event`, `location`, `year` — the caption line in the lightbox
- `settings` — read from EXIF; edit freely
- `category` — moves the photo between filters
- `featured: true` — puts it on the home page. **The first featured photo is
  the hero image.**
- `alt` — worth writing properly; it is what screen readers and Google read
- `id`, `src`, `width`, `height`, `blurDataURL` — leave these to the importer

**The titles currently in there are my read of each frame** — "Crowd Pleaser",
"Full Commitment", "The Beetle". They deliberately avoid naming cars or
drivers, because getting those wrong is worse than leaving them out. Swapping
in the real car, driver and team names is the single biggest improvement you
can make to this gallery.

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
  page.tsx            home — hero, statement, featured grid, services
  work/page.tsx       the portfolio
  about/page.tsx      bio, facts, gear
  contact/page.tsx    form and details
  api/contact/        form handler
  globals.css         design tokens and shared styles
components/
  SiteHeader          nav, mobile menu
  SiteFooter
  Gallery             filtering and the masonry grid
  Lightbox            full-screen viewer
  ContactForm
  RevealProvider      scroll-in animations
data/
  site.ts             all site copy and config
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
