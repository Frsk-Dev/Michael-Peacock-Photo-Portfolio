import type { Metadata } from "next";
import Gallery from "@/components/Gallery";
import { photos, usingPlaceholders } from "@/data/photos";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Motorsport and car culture photography — drift action, show cars and detail work.",
};

export default function WorkPage() {
  return (
    <section className="shell pb-24 pt-32 md:pt-40">
      <header className="max-w-3xl">
        <p className="eyebrow">The portfolio</p>
        <h1 className="display mt-5 text-5xl text-bone sm:text-6xl md:text-7xl">
          Work
        </h1>
        <p className="mt-6 text-base leading-relaxed text-muted md:text-lg">
          Filter by discipline, then click any frame to open it full-screen.
          Use the arrow keys to move through the set.
        </p>
      </header>

      {usingPlaceholders && (
        <p className="mt-8 border border-line bg-surface px-5 py-4 text-sm text-muted">
          <span className="font-semibold text-bone">Placeholders showing.</span>{" "}
          Drop your photographs into{" "}
          <code className="text-accent">public/images/gallery/</code> and run{" "}
          <code className="text-accent">npm run import-photos</code> to replace
          these.
        </p>
      )}

      <div className="mt-12">
        <Gallery photos={photos} />
      </div>
    </section>
  );
}
