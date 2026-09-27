import type { Metadata } from "next";
import { site } from "@/data/site";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${site.name} about photographs from an event, or an event worth shooting.`,
};

const socialLabels: Record<string, string> = {
  instagram: "Instagram",
  x: "X",
  linkedin: "LinkedIn",
  flickr: "Flickr",
};

/** "https://instagram.com/mikeee.mylens" -> "@mikeee.mylens" */
const instagramHandle = (url: string) => {
  const handle = url.replace(/\/+$/, "").split("/").pop();
  return handle ? `@${handle}` : "Instagram";
};

export default function ContactPage() {
  const socials = Object.entries(site.socials).filter(([, href]) => href);
  const instagram = site.socials.instagram;

  return (
    <section className="shell pb-24 pt-32 md:pt-40">
      <header className="max-w-3xl">
        <p className="eyebrow">Contact</p>
        <h1 className="display mt-5 text-[2.25rem] text-bone xs:text-5xl sm:text-6xl md:text-7xl">
          Start a<br />
          <span className="text-accent">conversation</span>
        </h1>
        <p className="mt-6 text-base leading-relaxed text-muted md:text-lg">
          If your car is in one of the albums and you want the full-resolution
          files, or you know of an event worth shooting, get in touch.
          {site.contactForm
            ? " I read everything that comes in."
            : " A message on Instagram is the quickest way to reach me."}
        </p>
      </header>

      <div className="mt-16 grid gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          {site.contactForm ? (
            <ContactForm />
          ) : (
            /* No form until there is an email service behind it - a dead form
               that silently swallows messages is worse than no form at all. */
            <div className="border border-line bg-surface p-8 md:p-10">
              <p className="eyebrow text-accent">Message me</p>
              <h2 className="display mt-4 text-2xl text-bone sm:text-3xl">
                Find me on Instagram
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted">
                That is where I post everything first, and where I answer
                fastest. Send a DM with the event and your car and I will dig
                out the full-resolution files.
              </p>

              {instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group mt-8 inline-flex items-center gap-3 bg-bone px-7 py-4 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-ink transition-colors duration-300 hover:bg-accent hover:text-white"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <rect
                      x="2.5"
                      y="2.5"
                      width="19"
                      height="19"
                      rx="5.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="4.2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <circle cx="17.6" cy="6.4" r="1.3" fill="currentColor" />
                  </svg>
                  {instagramHandle(instagram)}
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    &rarr;
                  </span>
                </a>
              )}

              <p className="mt-8 border-t border-line pt-6 text-sm leading-relaxed text-muted">
                Not on Instagram? Email works too —{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="link-wipe break-all text-bone"
                >
                  {site.email}
                </a>
              </p>
            </div>
          )}
        </div>

        <aside className="md:col-span-4 md:col-start-9">
          <div className="border-t border-line pt-6">
            <p className="eyebrow">Direct</p>
            <a
              href={`mailto:${site.email}`}
              className="link-wipe mt-4 block break-all py-1 text-base text-bone"
            >
              {site.email}
            </a>
            {site.phone && (
              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                className="link-wipe mt-2 block text-base text-bone"
              >
                {site.phone}
              </a>
            )}
          </div>

          <div className="mt-10 border-t border-line pt-6">
            <p className="eyebrow">Based in</p>
            <p className="mt-4 text-base text-bone">{site.location}</p>
            <p className="mt-2 text-sm text-muted">
              Getting to UK events when I can.
            </p>
          </div>

          {socials.length > 0 && (
            <div className="mt-10 border-t border-line pt-6">
              <p className="eyebrow">Elsewhere</p>
              <ul className="mt-4 space-y-2">
                {socials.map(([key, href]) => (
                  <li key={key}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="link-wipe inline-block py-1.5 text-base text-bone"
                    >
                      {socialLabels[key] ?? key}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10 border-t border-line pt-6">
            <p className="eyebrow">Replies</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              This is not a full-time thing, so it may take me a few days to
              get back to you.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
