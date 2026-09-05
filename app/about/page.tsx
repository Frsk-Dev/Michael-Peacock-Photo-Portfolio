import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${site.name} — a self-taught motorsport photography portfolio from ${site.location}.`,
};

export default function AboutPage() {
  const { about } = site;

  return (
    <>
      <section className="shell pb-20 pt-32 md:pt-40">
        <header className="max-w-3xl">
          <p className="eyebrow">About</p>
          <h1 className="display mt-5 text-5xl text-bone sm:text-6xl md:text-7xl">
            {about.heading}
          </h1>
        </header>

        <div className="mt-16 grid gap-12 md:grid-cols-12 md:gap-16">
          {/* Portrait */}
          <div className="reveal md:col-span-5">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface">
              <Image
                src={about.portrait}
                alt={`${site.name}, ${site.role.toLowerCase()}`}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
            <p className="mt-4 font-display text-[10px] uppercase tracking-[0.24em] text-muted-2">
              {site.name} — {site.location}
            </p>
          </div>

          {/* Bio */}
          <div className="md:col-span-7">
            <div className="space-y-6">
              {about.body.map((para, i) => (
                <p
                  key={i}
                  className="reveal text-base leading-relaxed text-muted md:text-lg"
                  data-reveal-delay={i * 70}
                >
                  {para}
                </p>
              ))}
            </div>

            <dl className="reveal mt-14 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2">
              {about.facts.map((f) => (
                <div key={f.label} className="bg-ink p-6">
                  <dt className="eyebrow">{f.label}</dt>
                  <dd className="mt-3 text-base text-bone">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Gear */}
      <section className="border-y border-line bg-ink-2">
        <div className="shell grid gap-10 py-20 md:grid-cols-12 md:py-24">
          <div className="md:col-span-4">
            <p className="eyebrow reveal">In the bag</p>
            <p className="reveal mt-5 max-w-xs text-sm leading-relaxed text-muted">
              One body, two lenses. A standard zoom for the show floor and the
              detail work, and the long end for whatever is happening on the far
              side of the fence.
            </p>
          </div>
          <div className="md:col-span-8">
            <ul className="divide-y divide-line border-y border-line">
              {about.gear.map((g, i) => (
                <li
                  key={g.label}
                  className="reveal flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-8"
                  data-reveal-delay={i * 60}
                >
                  <span className="w-24 shrink-0 font-display text-[11px] uppercase tracking-[0.2em] text-accent">
                    {g.label}
                  </span>
                  <span className="text-base text-bone">{g.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="shell py-20 text-center md:py-28">
        <p className="eyebrow reveal">Next</p>
        <h2 className="display reveal mt-5 text-4xl text-bone sm:text-5xl md:text-6xl">
          See the work, or
          <br />
          <span className="text-accent">get in touch</span>
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/work"
            className="bg-bone px-7 py-4 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-ink transition-colors duration-300 hover:bg-accent hover:text-white"
          >
            View the portfolio
          </Link>
          <Link
            href="/contact"
            className="border border-line px-7 py-4 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-bone transition-colors duration-300 hover:border-bone"
          >
            Contact
          </Link>
        </div>
      </section>
    </>
  );
}
