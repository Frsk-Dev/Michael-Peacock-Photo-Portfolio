import Link from "next/link";

export default function NotFound() {
  return (
    <section className="shell flex min-h-[70vh] flex-col justify-center py-32">
      <p className="eyebrow">Error 404</p>
      <h1 className="display mt-5 text-[2.5rem] text-bone xs:text-6xl sm:text-7xl md:text-8xl">
        Off the
        <br />
        <span className="text-accent">racing line</span>
      </h1>
      <p className="mt-6 max-w-md text-base text-muted">
        That page does not exist. Head back to the portfolio.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/"
          className="bg-bone px-7 py-4 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-ink transition-colors duration-300 hover:bg-accent hover:text-white"
        >
          Home
        </Link>
        <Link
          href="/work"
          className="border border-line px-7 py-4 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-bone transition-colors duration-300 hover:border-bone"
        >
          View the work
        </Link>
      </div>
    </section>
  );
}
