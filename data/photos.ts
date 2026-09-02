import raw from "./photos.json";

/**
 * The photo manifest.
 *
 * The data itself lives in `data/photos.json` so it can be regenerated safely.
 * The easy workflow is:
 *
 *   1. drop images into  public/images/gallery/
 *      (optionally in a sub-folder named after a category, e.g.
 *       public/images/gallery/rally/ - the category is picked up automatically)
 *   2. run  npm run import-photos
 *
 * That measures every image, generates a blur-up placeholder and updates the
 * JSON - while preserving any title, caption or category you have already
 * written for a given file. Then edit the titles in photos.json to taste.
 */

export const CATEGORY_IDS = [
  "drift",
  "show",
  "detail",
  "circuit",
  "rally",
  "endurance",
  "pit-lane",
  "portrait",
] as const;

export type Category = (typeof CATEGORY_IDS)[number];

export interface Photo {
  /** Stable id - the filename without its extension. */
  id: string;
  /** Path under /public, e.g. "/images/gallery/silverstone-01.jpg". */
  src: string;
  width: number;
  height: number;
  /** Meaningful alt text. Describe the subject and the action. */
  alt: string;
  title: string;
  category: Category;
  event?: string;
  location?: string;
  year?: number;
  /** Tiny base64 image used as the blur-up placeholder. */
  blurDataURL?: string;
  /** Featured photos appear on the home page, in this order. */
  featured?: boolean;
  /** Optional shooting notes shown in the lightbox. */
  settings?: string;
}

/** Filter buttons, in display order. "All" is added by the gallery. */
export const categories: { id: Category; label: string }[] = [
  { id: "drift", label: "Drift" },
  { id: "show", label: "Show Cars" },
  { id: "detail", label: "Details" },
  // Defined ready for future work - a filter only appears once it has photos.
  { id: "circuit", label: "Circuit" },
  { id: "rally", label: "Rally" },
  { id: "endurance", label: "Endurance" },
  { id: "pit-lane", label: "Pit Lane" },
  { id: "portrait", label: "Portraits" },
];

export const photos = raw as Photo[];

/** Featured photos for the home page, in manifest order. */
export const featuredPhotos = photos.filter((p) => p.featured);

/** Only categories that actually have photos - keeps empty filters off the page. */
export const activeCategories = categories.filter((c) =>
  photos.some((p) => p.category === c.id),
);

export const isPlaceholder = (p: Photo) => p.id.startsWith("placeholder-");

/** True while the site is still running on the shipped placeholder set. */
export const usingPlaceholders = photos.every(isPlaceholder);
