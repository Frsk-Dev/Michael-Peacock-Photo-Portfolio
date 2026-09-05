/**
 * Site-wide content and configuration.
 * Everything here is plain data - edit this file to change the site copy,
 * contact details and social links. No component changes needed.
 *
 * A note on tone: this site does not claim to be a business. No clients, no
 * accreditation, no rates, no turnaround promises. If that changes, the copy
 * here is where to say so.
 */

export const site = {
  name: "Michael Peacock",
  /** A description of the subject, not a job title. */
  role: "Motorsport Photography",
  /** Used in <title>, Open Graph and the JSON-LD block. Set this to your real domain. */
  url: "https://michaelpeacock.photo",
  tagline: "Drifting, show cars and the people around them",
  description:
    "Drift and car culture photography from UK events by Michael Peacock. A self-taught portfolio, still being built.",

  /** Shown on the home hero. Keep it to two short lines. */
  heroLines: ["Sideways,", "held still."],
  heroIntro:
    "Drift action, show cars and close detail work from the UK car scene.",

  email: "michaelpeacock1993@gmail.com",
  phone: "",
  location: "United Kingdom",
  /** Leave a value blank to hide that link entirely. */
  socials: {
    instagram: "https://instagram.com/",
    x: "",
    linkedin: "",
    flickr: "",
  },

  about: {
    heading: "Behind the lens",
    portrait: "/images/portrait.jpg",
    body: [
      "I photograph cars because they refuse to hold still. A drift car gives you a fraction of a second — sideways, half-hidden in its own tyre smoke, with the shot gone by the time you have heard it arrive. Getting it right is the whole appeal.",
      "The work splits three ways: drift action, show cars under hall lighting, and the close detail work — a harness, a wheel, a dressed engine bay — that says as much about a build as the whole car does.",
      "I should be straight about where this is at. I am not accredited and this is not a business. Everything here was shot from the public side of the fence, at events I paid to get into, on kit I bought myself, and I am still working out what does and does not come off. The plan is to keep turning up until it is good enough to be more than that.",
      "If your car is in one of these albums, message me and I will send you the full-resolution files. No charge. And if you know of an event worth being at, I would like to hear about it.",
    ],
    /** Small facts column beside the bio. Add or remove freely. */
    facts: [
      { label: "Based in", value: "United Kingdom" },
      { label: "Shoots", value: "Drift days and car shows" },
      { label: "Camera", value: "Canon EOS R10" },
      { label: "Approach", value: "Self-taught, still learning" },
    ],
    /** Pulled from the EXIF of the current gallery — update as your kit changes. */
    gear: [
      { label: "Body", value: "Canon EOS R10" },
      { label: "Standard", value: "Canon RF 24-105mm f/4L IS USM" },
      { label: "Long", value: "Canon RF 100-400mm f/5.6-8 IS USM" },
    ],
  },

  /** The home page "Where this is at" cards. Honest, not a services list. */
  services: [
    {
      title: "Still building",
      body: "A portfolio in progress rather than a business. No accreditation, no press pass — every frame here was taken from the public side of the fence at an event I bought a ticket to.",
    },
    {
      title: "Your car in here?",
      body: "If you drove at one of these events and your car is in an album, message me. I will send you the full-resolution files, free and without a watermark.",
    },
    {
      title: "Looking for more",
      body: "I want to shoot more events and get better at it. If you run one, or know one worth being at, I would like to hear from you.",
    },
  ],
};

export type Site = typeof site;
