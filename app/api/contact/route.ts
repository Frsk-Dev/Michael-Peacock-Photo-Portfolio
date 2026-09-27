import { NextResponse } from "next/server";
import { site } from "@/data/site";

/**
 * Contact form handler.
 *
 * Delivery uses Resend (https://resend.com) over its REST API, so there is no
 * extra dependency to install. The only setting that is actually required:
 *
 *   RESEND_API_KEY=re_xxxxxxxx
 *
 * Optional:
 *   CONTACT_TO=you@example.com       defaults to site.email
 *   CONTACT_FROM=site@yourdomain.com defaults to Resend's shared sender
 *
 * About the sender: Resend's default `onboarding@resend.dev` needs no DNS
 * setup, but will only deliver to the address the Resend account was created
 * with. That is exactly right for a contact form that only ever emails its
 * owner. Verify your own domain in Resend later and set CONTACT_FROM to an
 * address on it - messages then arrive from you rather than resend.dev, and
 * are far less likely to be filtered.
 *
 * Without a key the route says so plainly and the form offers a direct mailto
 * link instead, so a message is never silently lost.
 */

export const runtime = "nodejs";

/**
 * Crude in-memory rate limit: 5 sent messages per IP per 10 minutes.
 *
 * Only counts messages that actually get as far as being sent. Validation
 * failures and honeypot hits are free, so someone who mistypes their email
 * three times is not locked out before their first real attempt.
 *
 * Resets when the server restarts and is per-process, which is fine for a
 * single instance behind Caddy.
 */
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
  const eventName = clean(payload.event, 120);

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
  // Resend's shared sender works without verifying a domain. Override it once
  // you have your own domain set up there.
  const from = process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>";

  const lines = [
    `Name:    ${name}`,
    `Email:   ${email}`,
    `Enquiry: ${type}`,
    eventName ? `Event:   ${eventName}` : null,
    "",
    message,
  ].filter(Boolean);

  if (!apiKey) {
    // In development, show the message in the terminal so the form can be
    // tested end to end before anyone signs up for anything.
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `\n--- contact form (dev; set RESEND_API_KEY to send for real) ---\n` +
          `To: ${to}\n${lines.join("\n")}\n---\n`,
      );
      return NextResponse.json({ ok: true, delivered: false });
    }
    return NextResponse.json(
      { error: "The contact form is not connected to an email service yet." },
      { status: 503 },
    );
  }

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many messages sent. Please try again in a little while." },
      { status: 429 },
    );
  }

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
      console.error("Resend rejected the message:", res.status, detail);

      // Resend returns 403 when the sender domain is not verified, or when
      // the shared sender is used to reach anyone but the account owner.
      // Telling the visitor to email directly is more use than "failed".
      const hint =
        res.status === 403
          ? "The email service rejected the message. Please email me directly."
          : "The message could not be sent.";
      return NextResponse.json({ error: hint }, { status: 502 });
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
