import Link from "next/link";
import { site } from "@/data/site";

const socialLabels: Record<string, string> = {
  instagram: "Instagram",
  x: "X",
  linkedin: "LinkedIn",
  flickr: "Flickr",
};

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const socials = Object.entries(site.socials).filter(([, href]) => href);

  return (
    <footer className="border-t border-line bg-ink-2">
      <div className="shell py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="eyebrow">Say hello</p>
            <p className="display mt-5 text-3xl text-bone sm:text-4xl md:text-5xl">
              Get in
              <br />
              <span className="text-accent">touch</span>
            </p>
            <a
              href={`mailto:${site.email}`}
              className="link-wipe mt-6 inline-block break-all py-1 text-base text-bone md:text-lg"
            >
              {site.email}
            </a>
          </div>

          <div className="md:col-span-3 md:col-start-8">
            <p className="eyebrow">Navigate</p>
            <ul className="mt-5 space-y-3 text-sm">
              {[
                { href: "/", label: "Home" },
                { href: "/work", label: "Work" },
                { href: "/events", label: "Events" },
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="link-wipe inline-block py-1.5 text-muted transition-colors hover:text-bone"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="eyebrow">Elsewhere</p>
            <ul className="mt-5 space-y-3 text-sm">
              {socials.length ? (
                socials.map(([key, href]) => (
                  <li key={key}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="link-wipe inline-block py-1.5 text-muted transition-colors hover:text-bone"
                    >
                      {socialLabels[key] ?? key}
                    </a>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-2">Coming soon</li>
              )}
            </ul>
          </div>
        </div>

        <div className="rule mt-14" />

        <div className="mt-6 flex flex-col gap-3 text-xs text-muted-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {site.name}. All photographs are protected by
            copyright.
          </p>
          <p className="font-display uppercase tracking-[0.2em]">
            {site.location}
          </p>
        </div>
      </div>
    </footer>
  );
}
