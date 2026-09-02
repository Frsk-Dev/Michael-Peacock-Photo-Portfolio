"use client";

import { useState } from "react";
import { site } from "@/data/site";

type Status = "idle" | "sending" | "sent" | "error";

const enquiryTypes = [
  "Race weekend coverage",
  "Team or driver commission",
  "Editorial licensing",
  "Print enquiry",
  "Something else",
];

const field =
  "w-full border border-line bg-ink-2 px-4 py-3 text-base text-bone placeholder:text-muted-2 transition-colors duration-300 focus:border-accent focus:outline-none";
const label =
  "block font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(body.error || "Something went wrong.");

      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  }

  if (status === "sent") {
    return (
      <div className="border border-accent/40 bg-surface p-8 md:p-10">
        <p className="font-display text-2xl font-bold uppercase tracking-tight text-bone">
          Message sent
        </p>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Thanks for getting in touch — I will come back to you within a couple
          of days. If it is urgent, email{" "}
          <a href={`mailto:${site.email}`} className="link-wipe text-bone">
            {site.email}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-8 border border-line px-6 py-3 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-bone transition-colors hover:border-accent hover:bg-accent hover:text-white"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate={false}>
      {/* Honeypot - real people never fill this in. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={120}
            autoComplete="name"
            placeholder="Your name"
            className={`${field} mt-3`}
          />
        </div>
        <div>
          <label className={label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            placeholder="you@example.com"
            className={`${field} mt-3`}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="type">
            Enquiry
          </label>
          <select
            id="type"
            name="type"
            defaultValue={enquiryTypes[0]}
            className={`${field} mt-3 appearance-none`}
          >
            {enquiryTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="date">
            Date (if known)
          </label>
          <input
            id="date"
            name="date"
            type="date"
            className={`${field} mt-3`}
          />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="message">
          Details
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={4000}
          placeholder="Series, circuit, dates, what you need from the shoot…"
          className={`${field} mt-3 resize-y`}
        />
      </div>

      {status === "error" && error && (
        <div
          role="alert"
          className="border border-accent/50 bg-accent/10 px-4 py-3 text-sm text-bone"
        >
          {error}{" "}
          <a
            href={`mailto:${site.email}`}
            className="link-wipe font-semibold text-accent-soft"
          >
            Email me directly instead
          </a>
          .
        </div>
      )}

      <div className="flex flex-wrap items-center gap-5 pt-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className="group flex items-center gap-3 bg-bone px-8 py-4 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-ink transition-colors duration-300 hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send enquiry"}
          {status !== "sending" && (
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              &rarr;
            </span>
          )}
        </button>
        <p className="text-xs text-muted-2">
          Or email{" "}
          <a href={`mailto:${site.email}`} className="link-wipe text-muted">
            {site.email}
          </a>
        </p>
      </div>
    </form>
  );
}
