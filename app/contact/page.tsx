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

export default function ContactPage() {
  const socials = Object.entries(site.socials).filter(([, href]) => href);

  return (
    <section className="shell pb-24 pt-32 md:pt-40">
      <header className="max-w-3xl">
        <p className="eyebrow">Contact</p>
        <h1 className="display mt-5 text-5xl text-bone sm:text-6xl md:text-7xl">
          Start a<br />
          <span className="text-accent">conversation</span>
        </h1>
        <p className="mt-6 text-base leading-relaxed text-muted md:text-lg">
          If your car is in one of the albums and you want the full-resolution
          files, or you know of an event worth shooting, get in touch. I read
          everything that comes in.
        </p>
      </header>

      <div className="mt-16 grid gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <ContactForm />
        </div>

        <aside className="md:col-span-4 md:col-start-9">
          <div className="border-t border-line pt-6">
            <p className="eyebrow">Direct</p>
            <a
              href={`mailto:${site.email}`}
              className="link-wipe mt-4 block text-base text-bone"
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
                      className="link-wipe text-base text-bone"
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
