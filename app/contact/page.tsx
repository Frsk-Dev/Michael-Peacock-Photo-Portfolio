import type { Metadata } from "next";
import { site } from "@/data/site";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: `Enquire about race weekend coverage, commissions and licensing with ${site.name}.`,
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
          Drift days, shows, feature cars and licensing. Tell me what you need
          and when, and I will come back to you with availability and a quote.
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
              Travelling across the UK for events and feature shoots.
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
            <p className="eyebrow">Response time</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Usually within two working days. During an event weekend it may be
              the Monday after.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
