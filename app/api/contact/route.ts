import { NextResponse } from "next/server";
import { site } from "@/data/site";

/**
 * Contact form handler.
 *
 * Delivery uses Resend (https://resend.com) over its REST API, so there is no
 * extra dependency to install. Set these in .env.local to turn it on:
 *
 *   RESEND_API_KEY=re_xxxxxxxx
 *   CONTACT_TO=you@yourdomain.com          # optional, defaults to site.email
 *   CONTACT_FROM=site@yourdomain.com       # must be a Resend-verified domain
 *
 * Without a key the route returns a clear message and the form falls back to
 * a direct mailto link, so nothing silently disappears.
 */

export const runtime = "nodejs";

/** Crude in-memory rate limit: 5 messages per IP per 10 minutes. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // keep the map from growing unbounded
  return recent.length > MAX_PER_WINDOW;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many messages sent. Please try again later." },
      { status: 429 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: bots fill every field, people never see this one.
  if (clean(payload.company, 100)) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(payload.name, 120);
  const email = clean(payload.email, 200);
  const message = clean(payload.message, 4000);
  const type = clean(payload.type, 100) || "Enquiry";
  const date = clean(payload.date, 40);

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Please fill in your name, email and a message." },
      { status: 400 },
    );
  }
  if (!isEmail(email)) {
    return NextResponse.json(
      { error: "That email address does not look right." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO || site.email;
  const from = process.env.CONTACT_FROM;

  if (!apiKey || !from) {
    return NextResponse.json(
      {
        error:
          "The contact form is not connected to an email service yet.",
      },
      { status: 503 },
    );
  }

  const lines = [
    `Name:    ${name}`,
    `Email:   ${email}`,
    `Enquiry: ${type}`,
    date ? `Date:    ${date}` : null,
    "",
    message,
  ].filter(Boolean);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `${type} — ${name}`,
        text: lines.join("\n"),
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Resend error:", res.status, detail);
      return NextResponse.json(
        { error: "The message could not be sent." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact route failed:", err);
    return NextResponse.json(
      { error: "The message could not be sent." },
      { status: 502 },
    );
  }
}
