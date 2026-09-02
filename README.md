# Michael Peacock — Motorsport Photography

A portfolio site built with Next.js 16, React 19 and Tailwind CSS 4.

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
```

---

## Adding your photographs

This is the part you will use most.

### 1. Put the images somewhere the site can see them

Drop files into `public/images/gallery/`. If you put them in a sub-folder named
after a category, the category is assigned automatically:

```
public/images/gallery/
  circuit/
    silverstone-turn-three-2025.jpg
  rally/
    kielder-night-stage-2025.jpg
  endurance/
  pit-lane/
  portrait/
  detail/
```

Files sitting loose in `gallery/` default to the `circuit` category — you can
change that afterwards.

### 2. Run the importer

```bash
npm run import-photos
```

It measures every image, generates the little blurred preview that fades in
while the full photo loads, and writes `data/photos.json`.

You can also copy images in from anywhere on your machine:

```bash
npm run import-photos -- --from "D:/Photos/Silverstone 2025" --category circuit
```

**It never overwrites your edits.** Once you have written a proper title or
caption for a photo, re-running the importer keeps it. (Use `--force` if you
genuinely want everything reset to the filename-derived defaults.)

### 3. Tidy the titles

Open `data/photos.json` and edit. A full entry looks like:

```json
{
  "id": "silverstone-turn-three-2025",
  "src": "/images/gallery/circuit/silverstone-turn-three-2025.jpg",
  "width": 4000,
  "height": 2667,
  "alt": "A GT3 car turning in to Copse at Silverstone, late afternoon light",
  "title": "Apex, Copse",
  "category": "circuit",
  "event": "British GT Round 4",
  "location": "Silverstone, UK",
  "year": 2025,
  "featured": true,
  "settings": "400mm · f/2.8 · 1/1000s · ISO 200",
  "blurDataURL": "data:image/jpeg;base64,..."
}
```

- `title`, `event`, `location`, `year`, `settings` — shown in the lightbox
- `category` — one of `circuit`, `rally`, `endurance`, `pit-lane`, `portrait`, `detail`
- `featured: true` — puts the photo on the home page (the first one becomes the hero)
- `alt` — worth writing properly; it is what screen readers and Google read
- `id`, `src`, `width`, `height`, `blurDataURL` — leave these to the importer

### 4. Remove the placeholders

Once your own work is in:

```bash
rm public/images/gallery/placeholder-*.jpg
npm run import-photos
```

The "Placeholders showing" notice on the Work page disappears on its own.

---

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
  photos.ts           types and helpers
scripts/
  import-photos.mjs   the importer
  make-placeholders.mjs
```

### Design notes

The interface is deliberately near-monochrome — dark greys, one red accent
used sparingly for active states and emphasis. Photographs are the only real
colour on the page, which keeps them from competing with the furniture.
Change the palette in the `@theme` block at the top of `app/globals.css`.
